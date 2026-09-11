# Privacy policy: Straight to Chat

_Last updated: September 11, 2026_

Straight to Chat does not collect, sell or share any personal data. It has no server, and nothing it handles ever leaves your device.

- **No analytics, no tracking, no ads, no remote code.**
- **Your settings** (which site opens in new tabs, and whether the cursor stays in the address bar) are saved with Chrome's `chrome.storage.sync`, so Chrome can carry them between your own devices if you use Chrome sync. They never reach the author.
- **The site you choose** (ChatGPT, Claude or your custom URL) loads directly from that site, exactly as if you had opened it yourself. Your use of it is covered by that site's own privacy policy.
- **Page title, icon and background color.** While chatgpt.com or claude.ai is shown inside the new tab, a small content script reads the page's title, icon and background color: the tab displays the conversation name, and the color is kept in the extension's local storage on your device so the next new tab can paint it before the site loads. The script doesn't read, store or send your conversations, and it does nothing in regular tabs.
- **Custom sites.** If you set a custom URL, the extension asks Chrome for access to that one site, and gives it back when you switch away from it.
- **Permissions** are listed and explained in the [README](README.md#permissions).

The full source code is public: <https://github.com/BlaisedEstais/straight-to-chat>
