// Straight to Chat: the new tab page.
// Everything on the critical path is synchronous and local: read the cached choice, paint the site's
// background, load the site in a full-page frame. The address bar keeps the cursor because the tab itself
// never leaves this page: Chrome focuses the address bar on new tabs, and a framed site can't take it back.
(() => {
  let page;
  try {
    page = JSON.parse(localStorage.getItem('resolved'));
  } catch {}
  const usable = /^https?:\/\//.test(page?.url) && typeof page.title === 'string' && page.bg?.light && page.bg?.dark;
  if (!usable) {
    page = {
      url: 'https://chatgpt.com/',
      embed: true,
      title: 'ChatGPT',
      bg: { light: '#ffffff', dark: '#000000' },
      allow: 'microphone; clipboard-write; fullscreen',
    };
  }

  // Off the critical path: refresh the cache (settings may have changed on another device, access may have
  // been granted or withdrawn) and repair the header rules. Started first so it also runs before a redirect:
  // the page stays alive until the next site answers.
  const config = import('./lib/config.js');
  const reconciled = config.then((c) => c.reconcile(page)).catch(() => false);

  if (!page.embed) {
    location.replace(page.url);
    return;
  }

  // Paint the site's own background color while it loads: the one it actually showed last time in this
  // light/dark mode (reported by frame.js), else the provider's default. No flash either way.
  const siteOrigin = new URL(page.url).origin;
  const scheme = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  const bgKey = `bg ${siteOrigin} ${scheme}`;
  document.documentElement.style.background = localStorage.getItem(bgKey) || page.bg[scheme];
  document.title = page.title;
  const icon = Object.assign(document.createElement('link'), {
    rel: 'icon',
    href: new URL('/favicon.ico', page.url).href,
  });
  document.head.append(icon);

  const frame = document.createElement('iframe');
  frame.name = 'straight-to-chat'; // how cookie-bridge.js recognizes the frame
  frame.src = page.url;
  frame.allow = page.allow ?? '';
  document.body.append(frame);

  // frame.js (running inside the site) reports the page's title, icon and background color.
  addEventListener('message', ({ source, origin, data }) => {
    if (source !== frame.contentWindow || origin !== siteOrigin || data?.type !== 'straight-to-chat:page') return;
    if (typeof data.title === 'string') document.title = data.title || page.title;
    if (typeof data.icon === 'string' && data.icon.startsWith('https://')) icon.href = data.icon;
    if (typeof data.bg === 'string' && /^rgba?\([\d.,\s]+\)$/.test(data.bg)) localStorage.setItem(bgKey, data.bg);
  });

  // While this tab shows the site, keep its preference cookies readable as the site updates them.
  config.then(async (c) => c.watchCookies(await c.loadSettings())).catch(() => {});

  // If the cache was stale, reload once to show the right site (at most once every few seconds per tab).
  reconciled.then((stale) => {
    const last = Number(sessionStorage.getItem('reloaded')) || 0;
    if (stale && Date.now() - last > 5000) {
      sessionStorage.setItem('reloaded', String(Date.now()));
      location.reload();
    }
  });
})();
