/* Локальные картинки ищутся по имени: bg.png / bg.jpg / bg.jpeg и т. д.
   Работает на обычном статическом хостинге, в том числе GitHub Pages. */
const SiteAssets = (() => {
  const FORMATS = ['png', 'jpg', 'jpeg', 'webp', 'avif', 'gif', 'svg', 'ico', 'bmp'];
  const IMAGE_EXTENSION = /\.(png|jpe?g|webp|avif|gif|svg|ico|bmp)$/i;
  const EXTERNAL_URL = /^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i;
  const resolved = new Map();

  function splitPath(path) {
    const index = path.search(/[?#]/);
    return index < 0 ? [path, ''] : [path.slice(0, index), path.slice(index)];
  }

  function url(path) {
    if (!path || EXTERNAL_URL.test(path)) return path || '';
    const hashAt = path.indexOf('#');
    const hash = hashAt < 0 ? '' : path.slice(hashAt);
    const source = hashAt < 0 ? path : path.slice(0, hashAt);
    const queryAt = source.indexOf('?');
    const pathname = queryAt < 0 ? source : source.slice(0, queryAt);
    const params = new URLSearchParams(queryAt < 0 ? '' : source.slice(queryAt + 1));
    params.set('v', String(CONFIG.site?.cacheVersion ?? 1));
    return `${pathname}?${params.toString()}${hash}`;
  }

  function candidates(path) {
    if (!path) return [];
    if (EXTERNAL_URL.test(path)) return [path];

    const [pathname, suffix] = splitPath(path);
    const extension = pathname.match(IMAGE_EXTENSION);
    const stem = extension ? pathname.slice(0, -extension[0].length) : pathname;
    // Явно указанное расширение имеет приоритет; затем — PNG, JPG, JPEG.
    // Заглавные расширения тоже работают на Linux / GitHub Pages.
    const extensions = [
      ...(extension ? [extension[1]] : []),
      ...FORMATS,
      ...FORMATS.map(format => format.toUpperCase()),
    ];
    return [...new Set(extensions.map(format => `${stem}.${format}${suffix}`))];
  }

  function canLoad(path, timeout) {
    return new Promise(resolve => {
      const image = new Image();
      let settled = false;
      const finish = (loaded) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        image.onload = null;
        image.onerror = null;
        resolve(loaded);
      };
      const timer = setTimeout(() => finish(false), timeout);
      image.onload = () => finish(image.naturalWidth > 0);
      image.onerror = () => finish(false);
      image.decoding = 'async';
      image.src = url(path);
    });
  }

  function resolveImage(path) {
    if (!path) return Promise.resolve('');
    // Ссылки CDN, data: и blob: используются как есть — без угадывания URL.
    if (EXTERNAL_URL.test(path)) return Promise.resolve(path);
    if (resolved.has(path)) return resolved.get(path);

    const task = (async () => {
      const deadline = Date.now() + 12000;
      for (const candidate of candidates(path)) {
        const remaining = deadline - Date.now();
        if (remaining <= 0) break;
        if (await canLoad(candidate, Math.min(3000, remaining))) return candidate;
      }
      console.warn(`[SiteAssets] Изображение не найдено: ${path}`);
      return '';
    })();
    resolved.set(path, task);
    return task;
  }

  async function prepare(config) {
    const slots = [
      [config.site, 'favicon'],
      [config.profile, 'avatar'],
      [config.profile, 'logo'],
      [config.banner, 'image'],
      [config.background, 'image'],
      [config.ornaments, 'image'],
      [config.discordServer, 'icon'],
      [config.cursor, 'custom'],
      [config.enter, 'avatar'],
    ];
    await Promise.all(slots.map(async ([section, key]) => {
      if (!section?.[key]) return;
      section[key] = await resolveImage(section[key]);
    }));
    return config;
  }

  function imageType(path) {
    const [pathname] = splitPath(path || '');
    const extension = pathname.match(IMAGE_EXTENSION)?.[1]?.toLowerCase();
    if (!extension) return '';
    if (extension === 'jpg' || extension === 'jpeg') return 'image/jpeg';
    if (extension === 'svg') return 'image/svg+xml';
    if (extension === 'ico') return 'image/x-icon';
    return `image/${extension}`;
  }

  return { url, candidates, resolve: resolveImage, prepare, imageType };
})();
