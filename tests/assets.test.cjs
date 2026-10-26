const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../js/assets.js'), 'utf8');

function setup(files = [], brokenFiles = []) {
  const available = new Set(files);
  const broken = new Set(brokenFiles);
  const requests = [];
  const warnings = [];
  class FakeImage {
    set src(url) {
      requests.push(url);
      const pathname = url.split(/[?#]/)[0];
      queueMicrotask(() => {
        if (available.has(pathname)) {
          this.naturalWidth = broken.has(pathname) ? 0 : 128;
          this.onload?.();
        } else {
          this.onerror?.();
        }
      });
    }
  }
  const context = vm.createContext({
    Image: FakeImage,
    CONFIG: { site: { cacheVersion: 7 } },
    URLSearchParams, setTimeout, clearTimeout,
    console: { warn: (...args) => warnings.push(args) },
  });
  const assets = vm.runInContext(`${source}\nSiteAssets;`, context);
  return { assets, requests, warnings };
}

test('extensionless names prefer PNG, JPG, JPEG, then other supported formats', () => {
  const { assets } = setup();
  assert.deepEqual([...assets.candidates('back/bg')].slice(0, 3), ['back/bg.png', 'back/bg.jpg', 'back/bg.jpeg']);
  assert.ok(assets.candidates('image/Server').includes('image/Server.JPEG'));
});

test('an explicit extension keeps priority but has automatic fallback', () => {
  const { assets } = setup();
  assert.deepEqual([...assets.candidates('image/avatar.jpeg')].slice(0, 3), ['image/avatar.jpeg', 'image/avatar.png', 'image/avatar.jpg']);
  assert.equal(assets.candidates('image/avatar.PNG')[0], 'image/avatar.PNG');
});

test('query strings, hashes, folders and dotted base names are preserved', () => {
  const { assets } = setup();
  assert.equal(assets.candidates('image/profile.v2?size=128#top')[0], 'image/profile.v2.png?size=128#top');
  assert.equal(assets.candidates('image/profile.v2.JPG?size=128#top')[0], 'image/profile.v2.JPG?size=128#top');
});

test('cache version is added before a hash and replaces older versions', () => {
  const { assets } = setup();
  assert.equal(assets.url('back/bg.jpg'), 'back/bg.jpg?v=7');
  assert.equal(assets.url('back/bg.jpg?size=128&v=2#preview'), 'back/bg.jpg?size=128&v=7#preview');
});

test('remote URLs, data URLs and blob URLs are not rewritten or probed', async () => {
  const { assets, requests } = setup();
  for (const url of ['https://example.com/image?id=1', '//cdn.example.com/bg.png', 'data:image/png;base64,AAAA', 'blob:https://example.com/id']) {
    assert.equal(await assets.resolve(url), url);
    assert.equal(assets.url(url), url);
    assert.deepEqual([...assets.candidates(url)], [url]);
  }
  assert.equal(requests.length, 0);
});

test('existing PNG loads without unnecessary fallback requests', async () => {
  const { assets, requests } = setup(['back/bg.png']);
  assert.equal(await assets.resolve('back/bg'), 'back/bg.png');
  assert.deepEqual(requests, ['back/bg.png?v=7']);
});

test('PNG can be replaced by JPG without changing configuration', async () => {
  const { assets, requests } = setup(['back/bg.jpg']);
  assert.equal(await assets.resolve('back/bg'), 'back/bg.jpg');
  assert.deepEqual(requests, ['back/bg.png?v=7', 'back/bg.jpg?v=7']);
});

test('JPEG and uppercase extensions load too', async () => {
  const jpeg = setup(['image/bg.jpeg']);
  assert.equal(await jpeg.assets.resolve('image/bg'), 'image/bg.jpeg');
  const uppercase = setup(['image/Server.JPEG']);
  assert.equal(await uppercase.assets.resolve('image/Server'), 'image/Server.JPEG');
});

test('old references with .png still find a replacement .jpg', async () => {
  const { assets } = setup(['image/avatar.jpg']);
  assert.equal(await assets.resolve('image/avatar.png'), 'image/avatar.jpg');
});

test('a nondecodable file does not prevent trying another image format', async () => {
  const { assets } = setup(['image/bg.png', 'image/bg.jpg'], ['image/bg.png']);
  assert.equal(await assets.resolve('image/bg'), 'image/bg.jpg');
});

test('concurrent requests for one image reuse the same resolution', async () => {
  const { assets, requests } = setup(['image/avatar.png']);
  const first = assets.resolve('image/avatar');
  const second = assets.resolve('image/avatar');
  assert.equal(first, second);
  assert.equal(await first, 'image/avatar.png');
  assert.equal(requests.length, 1);
});

test('all configurable local images are resolved, not music or symbolic icons', async () => {
  const { assets } = setup(['image/icon.jpeg', 'image/avatar.jpg', 'image/bg.webp', 'back/bg.png', 'image/Server.JPG', 'image/cursor.png', 'image/enter.gif', 'image/ornament.jpeg', 'image/logo.jpeg']);
  const config = {
    site: { favicon: 'image/icon' },
    profile: { avatar: 'image/avatar', logo: 'image/logo' },
    banner: { image: 'image/bg' },
    ornaments: { image: 'image/ornament' },
    background: { image: 'back/bg', video: 'back/bg.mp4' },
    discordServer: { icon: 'image/Server' },
    cursor: { custom: 'image/cursor' },
    enter: { avatar: 'image/enter' },
    portfolio: { icon: 'palette' },
    music: { playlist: [{ file: 'back/music/sorry.mp3' }] },
  };
  assert.equal(await assets.prepare(config), config);
  assert.equal(config.site.favicon, 'image/icon.jpeg');
  assert.equal(config.profile.avatar, 'image/avatar.jpg');
  assert.equal(config.profile.logo, 'image/logo.jpeg');
  assert.equal(config.banner.image, 'image/bg.webp');
  assert.equal(config.ornaments.image, 'image/ornament.jpeg');
  assert.equal(config.background.image, 'back/bg.png');
  assert.equal(config.discordServer.icon, 'image/Server.JPG');
  assert.equal(config.cursor.custom, 'image/cursor.png');
  assert.equal(config.enter.avatar, 'image/enter.gif');
  assert.equal(config.background.video, 'back/bg.mp4');
  assert.equal(config.portfolio.icon, 'palette');
  assert.equal(config.music.playlist[0].file, 'back/music/sorry.mp3');
});

test('missing images return an empty value so the page can show a placeholder', async () => {
  const { assets, warnings } = setup();
  assert.equal(await assets.resolve('image/missing'), '');
  assert.equal(warnings.length, 1);
  assert.equal(await assets.resolve(''), '');
  assert.deepEqual([...assets.candidates('')], []);
});

test('favicon MIME type follows the actual selected extension', () => {
  const { assets } = setup();
  assert.equal(assets.imageType('image/icon.jpeg?v=7'), 'image/jpeg');
  assert.equal(assets.imageType('image/icon.PNG#top'), 'image/png');
  assert.equal(assets.imageType('image/icon.svg'), 'image/svg+xml');
  assert.equal(assets.imageType('image/icon.ico'), 'image/x-icon');
});
