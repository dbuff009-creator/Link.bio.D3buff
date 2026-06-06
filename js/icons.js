/* Font Awesome 6 — CDN в index.html; бренды без FA — IMG_ICONS (Simple Icons CDN) */

const IMG_ICONS = {
  namemc: 'https://cdn.simpleicons.org/namemc/0a0a0a',
  roblox: 'https://cdn.simpleicons.org/roblox/0a0a0a',
  roblox2: 'https://cdn.simpleicons.org/roblox/0a0a0a',
};

const BRAND_ICONS = {
  discord: 'fa-brands fa-discord',
  telegram: 'fa-brands fa-telegram',
  youtube: 'fa-brands fa-youtube',
  steam: 'fa-brands fa-steam',
  instagram: 'fa-brands fa-instagram',
  tiktok: 'fa-brands fa-tiktok',
  github: 'fa-brands fa-github',
  twitter: 'fa-brands fa-x-twitter',
  vk: 'fa-brands fa-vk',
  spotify: 'fa-brands fa-spotify',
  twitch: 'fa-brands fa-twitch',
  facebook: 'fa-brands fa-facebook',
  snapchat: 'fa-brands fa-snapchat',
  reddit: 'fa-brands fa-reddit',
  paypal: 'fa-brands fa-paypal',
  website: 'fa-solid fa-globe',
  email: 'fa-solid fa-envelope',
  link: 'fa-solid fa-link',
};

const UI_ICONS = {
  eye: 'fa-solid fa-eye',
  pin: 'fa-solid fa-location-dot',
  arrow: 'fa-solid fa-chevron-right',
  chevronDown: 'fa-solid fa-chevron-down',
  play: 'fa-solid fa-play',
  pause: 'fa-solid fa-pause',
  skipPrev: 'fa-solid fa-backward-step',
  skipNext: 'fa-solid fa-forward-step',
  volume: 'fa-solid fa-volume-high',
  volumeLow: 'fa-solid fa-volume-low',
  volumeMute: 'fa-solid fa-volume-xmark',
  music: 'fa-solid fa-music',
  palette: 'fa-solid fa-palette',
  x: 'fa-solid fa-xmark',
};

function icon(name) {
  const img = IMG_ICONS[name];
  if (img) {
    return `<img class="ico ico-img" src="${img}" alt="" width="20" height="20" loading="lazy" decoding="async" />`;
  }
  const brand = BRAND_ICONS[name];
  if (brand) return `<i class="${brand} ico ico-brand" aria-hidden="true"></i>`;
  const ui = UI_ICONS[name] || UI_ICONS.link;
  return `<i class="${ui} ico ico-ui" aria-hidden="true"></i>`;
}
