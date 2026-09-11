// Builds dist/straight-to-chat-<version>.zip from extension/: the file to upload to the Chrome Web Store,
// and to attach to GitHub releases.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

const { version } = JSON.parse(fs.readFileSync('extension/manifest.json', 'utf8'));
const zip = `dist/straight-to-chat-${version}.zip`;
fs.mkdirSync('dist', { recursive: true });
fs.rmSync(zip, { force: true });
execFileSync('zip', ['-r', '-X', '-q', `../${zip}`, '.', '-x', '*.DS_Store', '-x', '_metadata/*'], {
  cwd: 'extension',
  stdio: 'inherit',
});
console.log(`Built ${zip} (${(fs.statSync(zip).size / 1024).toFixed(1)} KB)`);
