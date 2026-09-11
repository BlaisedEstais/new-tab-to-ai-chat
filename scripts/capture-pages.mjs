// Captures the raw material of the store screenshots into store/src/captures/:
//   - chatgpt.com, signed out, in a fresh throwaway browser profile (so no personal data), light and dark;
//   - the extension's own popup and welcome page, in English.
//   npm run capture             (then: npm run assets)
//   npm run capture -- --ui-only  (skip chatgpt.com)
// The chatgpt.com part needs Google Chrome installed, and Cloudflare sometimes challenges automated
// browsers anyway: in that case the previous captures are kept.
import { chromium } from 'playwright';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';

const out = path.resolve('store/src/captures');
fs.mkdirSync(out, { recursive: true });
const profile = () => fs.mkdtempSync(path.join(os.tmpdir(), 'straight-to-chat-capture-'));

async function captureChat() {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const context = await chromium.launchPersistentContext(profile(), {
      channel: 'chrome',
      headless: true,
      ignoreDefaultArgs: ['--enable-automation'],
      args: ['--disable-blink-features=AutomationControlled'],
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36',
      viewport: { width: 1400, height: 660 },
      deviceScaleFactor: 2,
      locale: 'en-US',
    });
    try {
      const page = context.pages()[0] ?? (await context.newPage());
      for (const scheme of ['light', 'dark']) {
        await page.emulateMedia({ colorScheme: scheme });
        await page.goto('https://chatgpt.com/', { waitUntil: 'domcontentloaded' });
        await page.locator('#prompt-textarea').waitFor({ timeout: 30000 });
        await page.waitForTimeout(2500);
        // Leave the cookie banner out of the picture (nothing is accepted or refused).
        await page.evaluate(() => {
          for (const el of document.querySelectorAll('body *')) {
            const { position } = getComputedStyle(el);
            const small = el.getBoundingClientRect().height < innerHeight * 0.4;
            if ((position === 'fixed' || position === 'sticky') && small && /cookie/i.test(el.textContent)) el.remove();
          }
        });
        await page.mouse.move(0, 0);
        await page.screenshot({ path: `${out}/chatgpt-${scheme}.png` });
        console.log(`  store/src/captures/chatgpt-${scheme}.png`);
      }
      return;
    } catch (error) {
      console.log(`  chatgpt.com not ready (attempt ${attempt}): ${error.message.split('\n')[0]}`);
      if (attempt < 3) await new Promise((r) => setTimeout(r, 20000));
    } finally {
      await context.close();
    }
  }
  console.log('  kept the previous chatgpt.com captures');
}

// The extension's pages are rendered from a local web server with a small stand-in for the chrome.* APIs,
// so the captures are in English whatever the language of the machine running this script.
async function captureExtension() {
  const root = path.resolve('extension');
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.json': 'application/json' };
  const server = http
    .createServer((req, res) => {
      const file = path.join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname));
      if (!file.startsWith(root) || !fs.existsSync(file)) return res.writeHead(404).end();
      res.writeHead(200, { 'content-type': types[path.extname(file)] ?? 'application/octet-stream' });
      fs.createReadStream(file).pipe(res);
    })
    .listen(0);
  const base = `http://127.0.0.1:${server.address().port}`;
  const messages = JSON.parse(fs.readFileSync(path.join(root, '_locales/en/messages.json'), 'utf8'));

  const browser = await chromium.launch();
  const context = await browser.newContext({ deviceScaleFactor: 2 });
  await context.addInitScript((messages) => {
    const getMessage = (key, substitutions = []) => {
      const entry = messages[key];
      if (!entry) return '';
      let text = entry.message;
      for (const [name, { content }] of Object.entries(entry.placeholders ?? {})) {
        text = text.replaceAll(`$${name.toUpperCase()}$`, [].concat(substitutions)[Number(content.slice(1)) - 1] ?? '');
      }
      return text;
    };
    const settings = { provider: 'chatgpt', customUrl: '', keepCursor: true };
    window.chrome = {
      runtime: { id: 'straight-to-chat', getURL: (p) => new URL(p, location.origin).href },
      i18n: { getMessage, getUILanguage: () => 'en' },
      storage: { sync: { get: async () => ({ settings }), set: async () => {} }, onChanged: { addListener() {} } },
      permissions: { contains: async () => true, request: async () => true, remove: async () => true },
      declarativeNetRequest: { getDynamicRules: async () => [], updateDynamicRules: async () => {} },
      tabs: { create() {} },
    };
  }, messages);

  const page = await context.newPage();
  for (const scheme of ['light', 'dark']) {
    await page.emulateMedia({ colorScheme: scheme });
    await page.setViewportSize({ width: 340, height: 600 });
    await page.goto(`${base}/popup.html`);
    await page.locator('input[name="provider"]:checked').waitFor({ state: 'attached' });
    await page.locator('body').screenshot({ path: `${out}/popup-${scheme}.png` });
    console.log(`  store/src/captures/popup-${scheme}.png`);
  }
  await page.emulateMedia({ colorScheme: 'light' });
  await page.setViewportSize({ width: 860, height: 900 });
  await page.goto(`${base}/settings.html#welcome`);
  await page.locator('input[name="provider"]:checked').waitFor({ state: 'attached' });
  await page.screenshot({ path: `${out}/welcome-light.png`, fullPage: true });
  console.log('  store/src/captures/welcome-light.png');
  await browser.close();
  server.close();
}

if (!process.argv.includes('--ui-only')) await captureChat();
await captureExtension();
