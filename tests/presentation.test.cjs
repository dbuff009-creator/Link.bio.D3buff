const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const config = JSON.parse(JSON.stringify(vm.runInNewContext(read('config.js') + ';CONFIG;')));


test('intro is a solid background with only a modest logo and readable continue text', () => {
  const html = read('index.html');
  const css = read('css/style.css');
  assert.equal(config.enter.enabled, true);
  assert.equal(config.enter.text, 'Click to continue');
  assert.match(html, /id="enter-button"[^>]*>Click to continue<\/button>/);
  assert.match(html, /id="entry-logo"/);
  assert.match(css, /#enter-screen\s*\{[^}]*background:\s*#05070b/s);
  assert.match(css, /width:\s*min\(62vw, 220px\)/);
  assert.match(css, /font-size:\s*13px/);
  assert.match(css, /font-family:\s*var\(--font-body\)/);
  assert.ok(fs.existsSync(path.join(root, 'image/logo.png')));
});

test('entry has only a restrained fade and no shatter/explosion effect', () => {
  const html = read('index.html');
  const css = read('css/style.css');
  const app = read('js/app.js');
  assert.doesNotMatch(html, /entry-shatter|fx-canvas/);
  assert.doesNotMatch(css, /entry-shatter|shatter|explosion/i);
  assert.doesNotMatch(app, /shatterEntryLogo|entry-shatter/);
  assert.match(css, /@keyframes entryLogoFade/);
  assert.match(app, /startMusic\(true\);\s*revealPage\(\);/);
});

test('snow stays removed and the original background video is retained', () => {
  assert.equal(config.effects.type, 'none');
  assert.equal(config.background.type, 'video');
  assert.equal(config.background.video, 'back/bg.mp4');
  assert.doesNotMatch(read('index.html'), /snow-field|fx-canvas/i);
  assert.doesNotMatch(read('js/effects.js'), /snowMotion|initSnow|snow-field|fx-canvas/i);
  assert.doesNotMatch(read('css/style.css'), /snow-field|snowTextureDrift|fx-canvas/i);
  assert.ok(!fs.existsSync(path.join(root, 'image/snow.png')));
  assert.ok(!fs.existsSync(path.join(root, 'source-assets/snow-reference.png')));
});

test('mirrored side ornaments are restored with inverted colors on the profile page', () => {
  const html = read('index.html');
  const app = read('js/app.js');
  const css = read('css/style.css');
  assert.equal(config.ornaments.enabled, true);
  assert.equal(config.ornaments.flipHorizontal, true);
  assert.match(html, /id="page-ornaments"[^>]*hidden/);
  assert.match(app, /ornamentCfg\.enabled !== false/);
  assert.match(css, /#page-ornaments\s*\{[^}]*mix-blend-mode:\s*difference/s);
  assert.match(css, /\.page-ornament\s*\{[^}]*mix-blend-mode:\s*difference/s);
  assert.match(css, /\.page-ornament-left\s*\{[^}]*transform:\s*translateY\(-50%\)\s*scaleX\(-1\)/s);
  assert.ok(fs.existsSync(path.join(root, 'image/ornament.png')));
});

test('profile logo remains optically aligned and lowered relative to the banner', () => {
  assert.equal(config.profile.logo, 'image/logo');
  assert.equal(config.profile.logoAxisX, 48.84);
  assert.equal(config.profile.logoOffsetX, -2);
  assert.equal(config.profile.logoOffsetY, 24);
  assert.match(read('css/style.css'), /profile-logo-axis-x/);
  assert.match(read('js/app.js'), /profile-logo-offset-y/);
});

test('complete localhost bundle contains the BAT and a dependency-free Node server', () => {
  const bat = read('START_LOCALHOST.bat');
  const server = read('server.js');
  assert.match(bat, /node server\.js/i);
  assert.match(bat, /http:\/\/localhost:3000/);
  assert.match(bat, /HOST=127\.0\.0\.1/);
  assert.match(server, /server\.listen\(PORT, HOST/);
  assert.match(server, /Content-Range/);
  assert.match(server, /video\/mp4/);
});
