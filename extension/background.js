import { loadSettings, relaxCookies, syncRules } from './lib/config.js';

const refresh = async () => {
  const settings = await loadSettings();
  await Promise.allSettled([syncRules(settings), relaxCookies(settings)]);
};

chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === chrome.runtime.OnInstalledReason.INSTALL) {
    chrome.tabs.create({ url: 'settings.html#welcome' });
  }
  refresh();
});

// Dynamic rules persist, but re-checking is cheap and keeps them in step with settings and permissions.
chrome.runtime.onStartup.addListener(refresh);
chrome.permissions.onAdded.addListener(refresh);
chrome.permissions.onRemoved.addListener(refresh);
