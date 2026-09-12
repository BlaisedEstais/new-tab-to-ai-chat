// End-to-end tests: loads extension/ into Playwright's Chromium and checks the behaviors that matter.
//   npm test            (headless)
//   HEADED=1 npm test   (watch it run)
// Chat sites may answer an automated browser with a Cloudflare "checking your browser" page. That page is
// served by the site itself, so it still proves the frame loads; the tests never need to sign in.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';

const DEFAULTS = { provider: 'chatgpt', customUrl: '', keepCursor: true };
const extensionPath = path.resolve('extension');
const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'new-tab-to-ai-chat-e2e-'));

// A plain local website, to play "some other site" and "a custom URL".
const server = http
  .createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    res.writeHead(200, { 'content-type': 'text/html' });
    if (url.pathname === '/frame') res.end(`<iframe src="${url.searchParams.get('u')}"></iframe>`);
    else res.end('<title>Local test page</title><h1>Hello</h1>');
  })
  .listen(0);
const local = `http://127.0.0.1:${server.address().port}`;

// Other Chromium browsers: BROWSER=msedge npm test (installed Edge), or BROWSER_PATH=/path/to/browser npm test.
const context = await chromium.launchPersistentContext(userDataDir, {
  ...(process.env.BROWSER_PATH
    ? { executablePath: process.env.BROWSER_PATH }
    : { channel: process.env.BROWSER || 'chromium' }),
  headless: !process.env.HEADED,
  args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
});
let [worker] = context.serviceWorkers();
worker ??= await context.waitForEvent('serviceworker');
const id = new URL(worker.url()).host;
const ext = (file) => `chrome-extension://${id}/${file}`;

/** Resolves with the embedded frame once it shows a document from `origin`; throws after `timeout`. */
async function embeddedFrame(page, origin, timeout = 30000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const frame = page.frames().find((f) => f !== page.mainFrame() && f.url().startsWith(origin));
    if (frame) return frame;
    await page.waitForTimeout(200);
  }
  throw new Error(`no frame from ${origin} (frames: ${page.frames().map((f) => f.url() || '<blank>').join(', ')})`);
}

/** Opens the popup or options page and waits until it has rendered (and wired its listeners). */
async function openSettings(file) {
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(ext(file));
  await page.locator('input[name="provider"]:checked').waitFor({ state: 'attached' });
  return { page, errors };
}

async function setSettings(patch = {}) {
  const page = await context.newPage();
  await page.goto(ext('settings.html'));
  await page.evaluate(async (settings) => {
    const config = await import(chrome.runtime.getURL('lib/config.js'));
    await config.saveSettings(settings);
  }, { ...DEFAULTS, ...patch });
  await page.close();
}

const tests = [];
const test = (name, fn) => tests.push({ name, fn });

test('welcome page opens on install', async () => {
  let welcome;
  for (let i = 0; i < 100 && !welcome; i++) {
    welcome = context.pages().find((p) => p.url() === ext('settings.html#welcome'));
    if (!welcome) await new Promise((r) => setTimeout(r, 100));
  }
  assert.ok(welcome, 'the welcome page did not open');
  await welcome.locator('#welcome').waitFor({ state: 'visible' });
  await welcome.close();
});

test('new tab embeds ChatGPT by default, without leaving the extension page', async () => {
  const page = await context.newPage();
  const ownRequests = [];
  page.on('request', (r) => {
    try {
      if (r.frame() === page.mainFrame()) ownRequests.push(r.url());
    } catch {}
  });
  await page.goto(ext('newtab.html'));
  const frame = await embeddedFrame(page, 'https://chatgpt.com');
  assert.equal(page.url(), ext('newtab.html'), 'the tab itself must stay on the extension page');

  // Critical path: the frame request starts almost immediately.
  await page.waitForFunction(() => performance.getEntriesByType('resource').some((e) => e.initiatorType === 'iframe'));
  const start = await page.evaluate(
    () => performance.getEntriesByType('resource').find((e) => e.initiatorType === 'iframe').startTime,
  );
  assert.ok(start < 250, `iframe request started at ${start} ms`);
  console.log(`      iframe request started ${Math.round(start)} ms after navigation start`);

  // frame.js forwards the site's title (and icon) to the tab.
  const frameTitle = await frame.evaluate(() => document.title);
  await page.waitForFunction((title) => document.title === title, frameTitle, { timeout: 5000 });

  // The page's own requests: extension files and the chosen site (frame, icon). No third parties.
  const icon = await page.evaluate(() => document.querySelector('link[rel="icon"]').href);
  const foreign = ownRequests.filter(
    (u) => !u.startsWith(`chrome-extension://${id}/`) && !u.startsWith('https://chatgpt.com/') && u !== icon,
  );
  assert.deepEqual(foreign, [], 'the new tab page must not contact third parties');
  await page.close();
});

test('other websites still cannot frame chat sites', async () => {
  for (const site of ['https://chatgpt.com/', 'https://claude.ai/new']) {
    const page = await context.newPage();
    await page.goto(`${local}/frame?u=${encodeURIComponent(site)}`);
    await page.waitForTimeout(4000);
    const loaded = page.frames().some((f) => f !== page.mainFrame() && f.url().startsWith(new URL(site).origin));
    assert.equal(loaded, false, `${site} must stay blocked when a normal website frames it`);
    await page.close();
  }
});

test('regular tabs keep the sites’ security headers', async () => {
  const page = await context.newPage();
  const response = await page.goto('https://chatgpt.com/', { waitUntil: 'commit' });
  const headers = await response.allHeaders();
  assert.ok(headers['x-frame-options'] || headers['content-security-policy'], 'framing protection must be intact');
  await page.close();
});

test('header rules only apply to frames inside this extension’s new tab', async () => {
  const rules = await worker.evaluate(() => chrome.declarativeNetRequest.getDynamicRules());
  assert.ok(rules.length >= 2);
  for (const { condition } of rules) {
    assert.deepEqual(condition.resourceTypes, ['sub_frame']);
    assert.deepEqual(condition.topDomains, [id]);
    assert.equal(condition.requestDomains.length, 1);
  }
});

test('the chat site’s own preference cookies work inside the new tab, the session cookie is untouched', async () => {
  // As the site would have them: a preference cookie readable by its JavaScript (SameSite=Lax), and the
  // HttpOnly session cookie.
  await worker.evaluate(async () => {
    await chrome.cookies.set({ url: 'https://chatgpt.com/', name: 'stc_pref', value: '1', secure: true, sameSite: 'lax' });
    await chrome.cookies.set({ url: 'https://chatgpt.com/', name: 'stc_session', value: '1', secure: true, httpOnly: true, sameSite: 'lax' });
  });
  const page = await context.newPage();
  await page.goto(ext('newtab.html'));
  const frame = await embeddedFrame(page, 'https://chatgpt.com');
  await page.waitForTimeout(1000);
  const sameSite = (name) =>
    worker.evaluate(async (n) => (await chrome.cookies.get({ url: 'https://chatgpt.com/', name: n })).sameSite, name);
  assert.equal(await sameSite('stc_pref'), 'no_restriction', 'cookies the page reads must be readable in the frame');
  assert.equal(await sameSite('stc_session'), 'lax', 'HttpOnly cookies must be left alone');
  // It stays readable while the new tab is open, even when the site sets it again as SameSite=Lax.
  await worker.evaluate(() =>
    chrome.cookies.set({ url: 'https://chatgpt.com/', name: 'stc_pref', value: '2', secure: true, sameSite: 'lax' }),
  );
  await page.waitForTimeout(500);
  assert.equal(await sameSite('stc_pref'), 'no_restriction', 'cookies re-set while the tab is open must be relaxed again');
  // A cookie the page writes while inside the frame sticks (Chrome would drop it as SameSite=Lax).
  const kept = await frame.evaluate(() => {
    document.cookie = 'stc_written=1; path=/';
    return document.cookie.includes('stc_written=1');
  });
  assert.ok(kept, 'a cookie written by the page inside the frame must stick');
  await page.close();
});

test('a corrupted local cache falls back to the default site', async () => {
  const page = await context.newPage();
  await page.goto(ext('manifest.json')); // an extension page without scripts, to write the cache
  await page.evaluate(() => localStorage.setItem('resolved', '{}'));
  await page.goto(ext('newtab.html'));
  await embeddedFrame(page, 'https://chatgpt.com');
  await page.close();
});

test('in redirect mode, new tabs still pick up settings changed elsewhere', async () => {
  await setSettings({ keepCursor: false }); // the local cache now says "redirect"
  await worker.evaluate((s) => chrome.storage.sync.set({ settings: s }), DEFAULTS); // changed on another device
  const first = await context.newPage();
  await first.goto(ext('newtab.html'));
  await first.waitForURL(/^https:\/\/chatgpt\.com\//); // this one still redirects...
  await first.close();
  const second = await context.newPage();
  await second.goto(ext('newtab.html'));
  await embeddedFrame(second, 'https://chatgpt.com'); // ...but it refreshed the cache before leaving
  assert.equal(second.url(), ext('newtab.html'));
  await second.close();
});

test('the interface is in English by default and switches to French in one click', async () => {
  const { page, errors } = await openSettings('popup.html');
  assert.equal(await page.locator('legend').textContent(), 'Open in every new tab');
  await page.locator('[data-language="fr"]').click();
  await page.locator('legend', { hasText: 'Ouvrir dans chaque nouvel onglet' }).waitFor();
  const stored = await worker.evaluate(async () => (await chrome.storage.sync.get('settings')).settings.language);
  assert.equal(stored, 'fr');
  assert.deepEqual(errors, []);
  await page.close();
});

test('the popup switches to Claude in one click', async () => {
  const { page: popup, errors } = await openSettings('popup.html');
  await popup.locator('input[value="claude"]').click();
  await popup.locator('#status[data-kind="ok"]').waitFor();
  assert.deepEqual(errors, []);
  await popup.close();

  const page = await context.newPage();
  await page.goto(ext('newtab.html'));
  await embeddedFrame(page, 'https://claude.ai');
  assert.equal(page.url(), ext('newtab.html'));
  await page.close();
});

test('with "keep the cursor" off, the site opens as a regular page', async () => {
  const { page: popup } = await openSettings('popup.html');
  await popup.locator('label.switch').click();
  await popup.locator('#status[data-kind="ok"]').waitFor();
  assert.equal(await popup.locator('#keepCursor').isChecked(), false);
  await popup.close();

  const page = await context.newPage();
  await page.goto(ext('newtab.html'));
  await page.waitForURL(/^https:\/\/chatgpt\.com\//, { timeout: 15000 });
  await page.close();
});

test('custom URL: invalid input is rejected, a site without access opens as a regular page', async () => {
  const { page, errors } = await openSettings('settings.html');
  await page.locator('#customUrl').fill('not a url');
  await page.locator('#customUrl').press('Enter');
  await page.locator('#status[data-kind="error"]').waitFor();
  assert.deepEqual(errors, []);
  await page.close();

  // No access was granted to this site, so the new tab falls back to a plain redirect.
  await setSettings({ provider: 'custom', customUrl: `${local}/` });
  const tab = await context.newPage();
  await tab.goto(ext('newtab.html'));
  await tab.waitForURL(`${local}/`, { timeout: 10000 });
  await tab.close();
});

test('settings changed elsewhere (e.g. synced) are picked up by the next new tab', async () => {
  const page = await context.newPage();
  await page.goto(ext('newtab.html'));
  await embeddedFrame(page, 'https://chatgpt.com');
  // Storage changes but the page's local cache doesn't, like after a sync from another computer.
  await worker.evaluate((s) => chrome.storage.sync.set({ settings: s }), { ...DEFAULTS, provider: 'claude' });
  await page.reload();
  await embeddedFrame(page, 'https://claude.ai'); // reconcile() refreshes the cache, then reloads
  await page.close();
});

let failed = 0;
for (const [index, { name, fn }] of tests.entries()) {
  try {
    if (index > 0) await setSettings(); // every test starts from the defaults
    await fn();
    console.log(`  ✓ ${name}`);
  } catch (error) {
    failed++;
    console.log(`  ✗ ${name}\n      ${error.message.split('\n')[0]}`);
  }
}
await context.close();
server.close();
fs.rmSync(userDataDir, { recursive: true, force: true });
console.log(failed ? `\n${failed} of ${tests.length} failed` : `\nAll ${tests.length} passed`);
process.exit(failed ? 1 : 0);
