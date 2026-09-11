// Settings UI, shared by the toolbar popup (popup.html) and the options / welcome page (settings.html).
import {
  DEFAULTS,
  loadSettings,
  saveSettings,
  normalizeUrl,
  sitePattern,
  hasAccess,
  resolve,
  cacheResolved,
} from './lib/config.js';

const $ = (selector) => document.querySelector(selector);
const t = (key, ...substitutions) => chrome.i18n.getMessage(key, substitutions) || key;
const inPopup = document.body.classList.contains('popup');
const shortcut = /mac/i.test(navigator.userAgentData?.platform ?? navigator.platform) ? '⌘T' : 'Ctrl+T';

document.documentElement.lang = chrome.i18n.getUILanguage();
for (const el of document.querySelectorAll('[data-i18n]')) el.textContent = t(el.dataset.i18n);
for (const el of document.querySelectorAll('[data-i18n-placeholder]')) el.placeholder = t(el.dataset.i18nPlaceholder);

const form = $('#form');
const customInput = $('#customUrl'); // options page only

let settings = await loadSettings();
let customAccess = settings.customUrl ? await hasAccess(settings.customUrl) : false;
render();

if (location.hash === '#welcome') $('#welcome').hidden = false;
if (location.hash === '#custom') customInput?.focus();

form.addEventListener('change', ({ target }) => {
  if (target.id === 'keepCursor') setKeepCursor(target.checked);
  else if (target.name === 'provider') setProvider(target.value);
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const url = normalizeUrl(customInput.value);
  if (!url) return show(t('invalidUrl'), 'error');
  customInput.value = url;
  const patch = { provider: 'custom', customUrl: url };
  if (settings.keepCursor) withAccess(url, patch);
  else update(patch);
});

chrome.storage.onChanged.addListener(async (changes, area) => {
  if (area !== 'sync' || !changes.settings) return;
  settings = { ...DEFAULTS, ...changes.settings.newValue };
  customAccess = settings.customUrl ? await hasAccess(settings.customUrl) : false;
  render();
});

cacheResolved(await resolve(settings)); // keeps the new tab's local cache fresh, e.g. after a sync

function setProvider(provider) {
  if (provider !== 'custom') return update({ provider });
  if (!settings.customUrl) return askForCustomSite();
  if (!settings.keepCursor || customAccess) return update({ provider });
  withAccess(settings.customUrl, { provider });
}

function setKeepCursor(keepCursor) {
  const custom = settings.provider === 'custom' && settings.customUrl;
  if (!keepCursor || !custom || customAccess) return update({ keepCursor });
  withAccess(settings.customUrl, { keepCursor });
}

// Showing a custom site inside the new tab needs access to that site. Chrome only shows the prompt when
// asked straight from a click (it answers at once if access is already granted). Prompts close the popup,
// so there the options page takes over.
function withAccess(url, patch) {
  if (inPopup) return askForCustomSite();
  chrome.permissions.request({ origins: [sitePattern(url)] }).then((granted) => update(patch, granted));
}

function askForCustomSite() {
  if (inPopup) {
    chrome.tabs.create({ url: 'settings.html#custom' });
    window.close();
    return;
  }
  render(); // keep the current choice until the custom site is saved
  customInput.focus();
}

async function update(patch, granted = true) {
  const previous = settings;
  settings = { ...settings, ...patch };
  await saveSettings(settings);
  customAccess = settings.customUrl ? await hasAccess(settings.customUrl) : false;
  render();
  show(granted ? t('saved', shortcut) : t('accessDenied'), granted ? 'ok' : 'error');
  // Least privilege: give back access to a custom site as soon as it's no longer the one in use.
  // (Chrome refuses to remove chatgpt.com or claude.ai, which the extension always needs: that's fine.)
  const active = settings.provider === 'custom' && settings.customUrl ? sitePattern(settings.customUrl) : null;
  if (previous.customUrl && sitePattern(previous.customUrl) !== active) {
    chrome.permissions.remove({ origins: [sitePattern(previous.customUrl)] }).catch(() => {});
  }
}

function render() {
  for (const radio of form.elements.provider) radio.checked = radio.value === settings.provider;
  $('#keepCursor').checked = settings.keepCursor;
  const host = settings.customUrl ? new URL(settings.customUrl).hostname : '';
  $('#customHost').textContent = host || (inPopup ? t('customSet') : '');
  if (customInput && document.activeElement !== customInput) customInput.value = settings.customUrl;
}

let hideTimer;
function show(message, kind) {
  const status = $('#status');
  status.textContent = message;
  status.dataset.kind = kind;
  clearTimeout(hideTimer);
  hideTimer = setTimeout(() => (status.textContent = ''), 8000);
}
