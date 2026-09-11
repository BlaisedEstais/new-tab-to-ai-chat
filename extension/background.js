import { syncRules } from './lib/config.js';

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  await syncRules();
  if (reason === chrome.runtime.OnInstalledReason.INSTALL) {
    chrome.tabs.create({ url: 'settings.html#welcome' });
  }
});

// Dynamic rules persist, but re-checking is cheap and keeps them in step with settings and permissions.
chrome.runtime.onStartup.addListener(() => syncRules());
chrome.permissions.onAdded.addListener(() => syncRules());
chrome.permissions.onRemoved.addListener(() => syncRules());
