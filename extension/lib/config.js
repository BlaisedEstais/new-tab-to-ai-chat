// Settings, provider catalog, and what lets the chosen site work inside the new tab: header rules and cookies.
// Shared by the service worker, the settings UI and (lazily, off the critical path) the new tab page.

// `bg` is only a first-run guess of each site's background: after that, the new tab uses the color the site
// actually showed (see frame.js). `allow` lists the browser features the site may use inside the frame:
// the voice mode needs the microphone, copy buttons need the clipboard. `relaxCookies`: see relaxCookies().
export const PROVIDERS = {
  chatgpt: {
    name: 'ChatGPT',
    url: 'https://chatgpt.com/',
    bg: { light: '#ffffff', dark: '#000000' },
    allow: 'microphone; clipboard-write; fullscreen',
    relaxCookies: true,
  },
  claude: {
    name: 'Claude',
    url: 'https://claude.ai/new',
    bg: { light: '#fcfcfb', dark: '#151515' },
    allow: 'microphone; clipboard-write; fullscreen',
    relaxCookies: true,
  },
  gemini: {
    name: 'Gemini',
    url: 'https://gemini.google.com/app',
    bg: { light: '#ffffff', dark: '#131314' },
    allow: 'microphone; clipboard-write; fullscreen',
    relaxCookies: false, // Google's cookies are shared by every Google site: leave them alone
  },
};

export const DEFAULTS = { provider: 'chatgpt', customUrl: '', keepCursor: true, language: 'en' };

// newtab.js reads this synchronously on every new tab, so it must stay in step with chrome.storage.
const CACHE_KEY = 'resolved';

export async function loadSettings() {
  const { settings } = await chrome.storage.sync.get('settings');
  return { ...DEFAULTS, ...settings };
}

export async function saveSettings(settings) {
  await chrome.storage.sync.set({ settings });
  await Promise.all([syncRules(settings), relaxCookies(settings)]);
  cacheResolved(await resolve(settings));
}

/** Accepts "gemini.google.com" or a full URL. Returns a normalized http(s) URL, or null. */
export function normalizeUrl(input) {
  const text = String(input ?? '').trim();
  if (!text || /\s/.test(text)) return null; // Chrome would happily turn "not a url" into a host
  const explicit = /^https?:\/\//i.test(text);
  try {
    const url = new URL(explicit ? text : `https://${text}`);
    const host = url.hostname;
    const valid =
      /^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(host) || // example.com, 127.0.0.1
      host === 'localhost' ||
      host.startsWith('[') || // IPv6
      (explicit && /^[a-z0-9-]+$/i.test(host)); // http://nas:8080, only when typed with its scheme
    return valid ? url.href : null;
  } catch {
    return null;
  }
}

/** Host permission pattern covering a URL's site, e.g. "https://example.com/*". */
export function sitePattern(url) {
  const { protocol, hostname } = new URL(url);
  return `${protocol}//${hostname}/*`;
}

export const hasAccess = (url) => chrome.permissions.contains({ origins: [sitePattern(url)] });

/** Everything the new tab page needs, precomputed. */
export async function resolve(settings) {
  const custom = settings.provider === 'custom' && Boolean(settings.customUrl);
  const provider = PROVIDERS[settings.provider] ?? PROVIDERS.chatgpt;
  const url = custom ? settings.customUrl : provider.url;
  // Embedding needs access to the site (the user can withhold it); without it, fall back to a plain redirect.
  const embed = settings.keepCursor && (await hasAccess(url));
  return {
    url,
    embed,
    title: custom ? new URL(url).hostname.replace(/^www\./, '') : provider.name,
    bg: custom ? { light: '#ffffff', dark: '#1f1f1f' } : provider.bg,
    // Feature permissions granted inside the frame are stored for the extension, not for the site, so a
    // custom site gets none: it can't inherit the microphone access you gave ChatGPT or Claude.
    allow: custom ? '' : provider.allow,
  };
}

export function cacheResolved(resolved) {
  localStorage.setItem(CACHE_KEY, JSON.stringify(resolved));
}

// Chat sites send X-Frame-Options / CSP frame-ancestors headers, which forbid showing them inside another
// page. These rules remove those two response headers, but only for frames of the chosen site in a tab whose
// top-level page is this extension's new tab (topDomains = our extension ID; no web page can be that).
// Everywhere else, in regular tabs and when other websites try to frame these sites, nothing changes.
const STRIP = ['x-frame-options', 'content-security-policy'].map((header) => ({ header, operation: 'remove' }));

const frameRule = (id, host) => ({
  id,
  priority: 1,
  action: { type: 'modifyHeaders', responseHeaders: STRIP },
  condition: { resourceTypes: ['sub_frame'], requestDomains: [host], topDomains: [chrome.runtime.id] },
});

// What matters in a rule, ignoring any defaults Chrome may add when it hands rules back.
const shape = (rules) =>
  JSON.stringify(
    [...rules]
      .sort((a, b) => a.id - b.id)
      .map(({ id, action, condition: c }) => [
        id,
        action.type,
        action.responseHeaders?.map((h) => `${h.header}:${h.operation}`),
        c.resourceTypes,
        c.requestDomains,
        c.topDomains,
        c.initiatorDomains,
      ]),
  );

/** Makes the dynamic rules match the settings. Returns true if anything changed. */
export async function syncRules(settings) {
  settings ??= await loadSettings();
  const hosts = new Set(Object.values(PROVIDERS).map((p) => new URL(p.url).hostname));
  if (settings.provider === 'custom' && settings.customUrl && (await hasAccess(settings.customUrl))) {
    hosts.add(new URL(settings.customUrl).hostname);
  }
  const wanted = [...hosts].map((host, i) => frameRule(i + 1, host));
  // One update at a time across all the extension's pages and its service worker.
  return navigator.locks.request('straight-to-chat-rules', async () => {
    const current = await chrome.declarativeNetRequest.getDynamicRules();
    if (shape(current) === shape(wanted)) return false;
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: [...new Set([...current, ...wanted].map((r) => r.id))], // unknown IDs are ignored
      addRules: wanted,
    });
    return true;
  });
}

// Inside the new tab frame, Chrome hides the site's SameSite=Lax cookies from its own JavaScript (for scripts,
// the frame counts as third-party), although the site's network requests still carry them. Chat apps keep
// preferences in such cookies: cookie consent, sidebar state, "you're signed in" hints. Without them, the
// app shows its consent banner every time, hides the sidebar and boots slowly. So for ChatGPT and Claude, the
// cookies their JavaScript reads are marked SameSite=None. HttpOnly cookies, such as the session, are never
// touched. cookie-bridge.js does the same for the cookies the page writes while it's inside the frame.
const needsRelaxing = (c) => !c.httpOnly && c.sameSite !== 'no_restriction' && !c.partitionKey;

const relax = (c) =>
  chrome.cookies
    .set({
      url: `https://${c.domain.replace(/^\./, '')}${c.path}`,
      name: c.name,
      value: c.value,
      domain: c.hostOnly ? undefined : c.domain,
      path: c.path,
      secure: true,
      httpOnly: false,
      sameSite: 'no_restriction',
      expirationDate: c.session ? undefined : c.expirationDate,
      storeId: c.storeId,
    })
    .catch(() => null);

const relaxedHost = (settings) => {
  const provider = PROVIDERS[settings.provider];
  return settings.keepCursor && provider?.relaxCookies ? new URL(provider.url).hostname : null;
};

export async function relaxCookies(settings) {
  const host = relaxedHost(settings);
  if (!host) return 0;
  const readable = (await chrome.cookies.getAll({ domain: host })).filter(needsRelaxing);
  await Promise.all(readable.map(relax));
  return readable.length;
}

/** While a new tab shows the site, cookies the site sets again as SameSite=Lax are relaxed right away. */
export function watchCookies(settings) {
  const host = relaxedHost(settings);
  if (!host) return;
  chrome.cookies.onChanged.addListener(({ removed, cookie }) => {
    const domain = cookie.domain.replace(/^\./, '');
    if (!removed && (domain === host || domain.endsWith(`.${host}`)) && needsRelaxing(cookie)) relax(cookie);
  });
}

/**
 * Run by the new tab page as soon as the site starts loading: refreshes the local cache (settings may have
 * changed on another device, access may have been granted or withdrawn), repairs the rules, and relaxes the
 * cookies the site will read. Returns true if what the page shows is stale.
 */
export async function reconcile(shown) {
  const settings = await loadSettings();
  const [resolved, rules] = await Promise.allSettled([resolve(settings), syncRules(settings), relaxCookies(settings)]);
  if (resolved.status === 'fulfilled') cacheResolved(resolved.value);
  const now = resolved.status === 'fulfilled' ? resolved.value : shown;
  const rulesChanged = rules.status === 'fulfilled' && rules.value;
  return rulesChanged || now.url !== shown.url || now.embed !== shown.embed;
}
