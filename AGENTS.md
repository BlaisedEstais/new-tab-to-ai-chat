# AGENTS.md: Straight to Chat

Guide for AI coding agents (Claude Code, Codex, Cursor…) that install, edit or fork this extension.

## What this is

A Manifest V3 Chrome extension (Chrome 145+) that replaces the new tab page with ChatGPT, Claude, Gemini or any URL. The site loads in a full-page iframe inside the extension's own new tab page, so **the address bar keeps keyboard focus**: users can still type a search or a URL the moment the tab opens. Plain JavaScript, HTML and CSS: no framework, no build step, no runtime dependencies.

## Repo map

| Path | Role |
|---|---|
| `extension/` | The extension itself. This is the folder to load in `chrome://extensions` → **Load unpacked**. |
| `extension/manifest.json` | Permissions, new tab override, toolbar popup, options page, content scripts. |
| `extension/newtab.html`, `newtab.js` | The new tab page. Synchronous critical path: localStorage cache → iframe (named `straight-to-chat`). |
| `extension/lib/config.js` | Providers, settings, header rules (declarativeNetRequest), cookie relaxing, `reconcile()`. |
| `extension/background.js` | Service worker: keeps rules and cookies in sync, opens the welcome page on install. |
| `extension/frame.js` | Content script inside the built-in sites' frames: forwards the page title, icon and background color to the tab. |
| `extension/cookie-bridge.js` | MAIN-world content script for chatgpt.com / claude.ai, active only in the `straight-to-chat` frame: cookies the page writes get `SameSite=None; Secure`. |
| `extension/settings.html`, `popup.html`, `settings.js`, `settings.css` | Options/welcome page and toolbar popup (one shared script). UI language comes from the extension's own setting (English default), read from `_locales` directly. |
| `extension/_locales/{en,fr}/messages.json` | UI strings, plus the manifest's name and description for the Chrome Web Store. |
| `store/` | Chrome Web Store listing copy and images. `store/src/*.html` are the sources of every image. |
| `scripts/` | `e2e.mjs` (tests), `package.mjs` (zip), `capture-pages.mjs` and `render-assets.mjs` (store images). |

## Commands

```bash
npm install        # once, dev only: Playwright 1.60 for tests and image rendering
npm test           # end-to-end tests in Chromium with the extension loaded (HEADED=1 npm test to watch)
npm run zip        # dist/straight-to-chat-<version>.zip, for the Chrome Web Store or a GitHub release
npm run capture    # refresh store/src/captures/ (signed-out chatgpt.com + the extension's own pages)
npm run assets     # re-render extension/icons/*.png and store/*.png from store/src/*.html
```

## Installing it for a user

Google Chrome only loads unpacked extensions through its own UI, so an agent can't finish alone (`--load-extension` stopped working in branded Chrome in version 137; it still works in Chromium and Chrome for Testing).

1. Get the code: `git clone https://github.com/BlaisedEstais/straight-to-chat`, or download the zip from the latest release and unzip it.
2. Ask the human to open `chrome://extensions`, turn on **Developer mode** (top right), click **Load unpacked** and pick the `extension/` folder.
3. The welcome page opens: they pick ChatGPT, Claude or Gemini. Done.

After editing files, click the reload icon on the extension's card in `chrome://extensions`, then open a new tab.

## Invariants: keep these true

1. **Address-bar focus.** When `embed` is on, the tab must stay on `newtab.html`: never navigate the top frame and never call `focus()` from the new tab page. That's the whole point of the extension.
2. **Fast critical path.** `newtab.js` stays synchronous until the iframe is in the DOM: don't await `chrome.*` APIs before that. Async work belongs in `reconcile()`, which runs alongside. `npm test` checks the frame request starts within 250 ms.
3. **Scoped header removal.** Every rule keeps `resourceTypes: ['sub_frame']`, a single `requestDomains` entry and `topDomains: [extension ID]`, so it only ever applies inside the extension's own new tab. Removing X-Frame-Options/CSP more broadly would expose these sites to clickjacking during normal browsing. `npm test` checks that a regular website still can't frame them.
4. **Narrow cookie changes.** Only providers with `relaxCookies: true` (chatgpt.com, claude.ai), only cookies without `HttpOnly`, and only their `SameSite` attribute. Never do it for Google domains (their cookies are shared by every Google site). Measured reason: inside the frame, the site's JavaScript only sees and writes `SameSite=None` cookies, while its network requests still carry `Lax` ones. `npm test` checks both the relaxing and that HttpOnly cookies are untouched.
5. **Least privilege.** Required hosts are only the built-in sites. Any other site goes through `optional_host_permissions`, requested at runtime for that single site and removed when it's no longer used. Feature permissions granted inside the frame (microphone, clipboard) are stored for the extension's origin, so custom sites get an empty `allow` list.
6. **No remote code, no analytics, no data collection.** Required by the Chrome Web Store, and promised in `PRIVACY.md`.

## Common changes

- **Add a built-in provider.** Add it to `PROVIDERS` in `extension/lib/config.js` (name, url, background colors, `allow`, `relaxCookies`). Add its origin to `host_permissions` and to the `frame.js` entry of `content_scripts` in `manifest.json` (and to the `cookie-bridge.js` entry if `relaxCookies`). Add a radio option to `settings.html` and `popup.html`. Run `npm test`.
- **Change the default.** `DEFAULTS.provider` in `config.js` and the fallback object at the top of `newtab.js`.
- **Add a language.** Add `_locales/<code>/messages.json` and a button in the `.language` group of `settings.html` and `popup.html`.
- **Rename or rebrand.** `extName` and `extShortName` in `_locales/*/messages.json`, the `<title>`s, `store/src/*.html`, the README.
- **Release.** Bump `version` in `extension/manifest.json`, run `npm run zip`, upload `dist/*.zip` in the Chrome Web Store dashboard (see `store/README.md`) and attach it to a GitHub release.

## Known limitations (by design, don't "fix" them unsafely)

- **Sign-in pages** (OpenAI, Anthropic, Google) refuse to be framed. Users sign in once in a regular tab; the framed site then shares the same cookies (Chrome exempts frames in extension pages with host permissions from storage partitioning).
- **Nested sandbox frames** (Claude artifact previews, ChatGPT canvas and app previews) only allow their parent site, plus the vendors' own extensions, in `frame-ancestors`, so they don't render inside the new tab. Don't strip those sandbox CSPs: they isolate untrusted, AI-generated code. Users can turn off "Keep the cursor in the address bar", or Cmd/Ctrl-click a chat in the sidebar to open it in a regular tab.
