// Renders every image from its HTML source in store/src/ (deterministic: same input, same pixels).
//   npm run assets
// Screenshots come in English (store/*.png) and French (store/fr/*.png) for the localized store listings.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const src = (file, query = '') => pathToFileURL(path.resolve('store/src', file)).href + query;

const jobs = [
  // Extension icons: toolbar (16, 32), extensions page (48), Chrome Web Store and install dialog (128).
  ...[16, 32, 48, 128].map((size) => ({
    url: src('icon.html', `?size=${size}`),
    out: [`extension/icons/icon${size}.png`, ...(size === 128 ? ['store/icon-128.png'] : [])],
    width: size,
    height: size,
    transparent: true,
  })),
];

// Order matters: the promo images embed store/screenshot-1.png, so screenshots come first.
for (const [file, width, height, languages] of [
  ['screenshot-1.html', 1280, 800, ['en', 'fr']],
  ['screenshot-2.html', 1280, 800, ['en', 'fr']],
  ['screenshot-3.html', 1280, 800, ['en', 'fr']],
  ['promo-small.html', 440, 280, ['en']],
  ['promo-marquee.html', 1400, 560, ['en']],
  ['social-preview.html', 1280, 640, ['en']],
]) {
  if (!fs.existsSync(path.join('store/src', file))) continue;
  const name = file.replace('.html', '.png');
  for (const language of languages) {
    const english = language === 'en';
    jobs.push({
      url: src(file, english ? '' : `?lang=${language}`),
      out: [english ? `store/${name}` : `store/${language}/${name}`],
      width,
      height,
    });
  }
}

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });
for (const job of jobs) {
  await page.setViewportSize({ width: job.width, height: job.height });
  await page.goto(job.url);
  await page.evaluate(() => document.fonts.ready);
  const buffer = await page.screenshot({ omitBackground: Boolean(job.transparent) });
  for (const out of job.out) {
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, buffer);
    console.log(`  ${out}`);
  }
}

// The website (docs/) shows the screenshots at 2x, as JPEG, so they stay sharp on high-density screens.
fs.mkdirSync('docs/img', { recursive: true });
const hiDpi = await browser.newPage({ deviceScaleFactor: 2, viewport: { width: 1280, height: 800 } });
for (const n of [1, 2, 3]) {
  await hiDpi.goto(src(`screenshot-${n}.html`));
  await hiDpi.evaluate(() => document.fonts.ready);
  await hiDpi.screenshot({ path: `docs/img/screenshot-${n}.jpg`, type: 'jpeg', quality: 88 });
  console.log(`  docs/img/screenshot-${n}.jpg`);
}
for (const file of ['icon-128.png', 'social-preview.png']) fs.copyFileSync(`store/${file}`, `docs/img/${file}`);
await browser.close();
