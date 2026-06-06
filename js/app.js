(function () {
  const C = CONFIG;
  const P = C.profile;
  const T = C.theme;
  const F = C.fonts || { body: 'Inter', display: 'Humane', name: 'MangoGrotesque' };

  const root = document.documentElement;
  root.style.setProperty('--accent', T.accent);
  root.style.setProperty('--accent-hover', T.accentHover);
  root.style.setProperty('--accent-glow', hexToRgba(T.accent, 0.38));
  root.style.setProperty('--text', T.text);
  root.style.setProperty('--text-muted', T.textMuted);
  root.style.setProperty('--card-bg', T.cardBg);
  root.style.setProperty('--card-border', T.cardBorder);
  root.style.setProperty('--radius', T.cardRadius + 'px');
  root.style.setProperty('--font-body', `'${F.body}', system-ui, sans-serif`);
  root.style.setProperty('--font-display', `'${F.display}', 'Inter', sans-serif`);
  root.style.setProperty('--font-name', `'${F.name}', 'Inter', sans-serif`);

  const siteCfg = C.site || {};

  function assetUrl(path) {
    if (!path || /^https?:\/\//i.test(path) || /^data:/i.test(path)) return path;
    const v = siteCfg.cacheVersion ?? 1;
    return `${path}${path.includes('?') ? '&' : '?'}v=${v}`;
  }

  if (siteCfg.favicon) {
    const href = assetUrl(siteCfg.favicon);
    const setIcon = (rel) => {
      let link = document.querySelector(`link[rel="${rel}"]`);
      if (!link) {
        link = document.createElement('link');
        link.rel = rel;
        document.head.appendChild(link);
      }
      link.href = href;
      if (rel === 'icon') link.type = 'image/png';
    };
    setIcon('icon');
    setIcon('apple-touch-icon');
  }

  SiteEffects.initCursor(C.cursor);

  let dockAnimTimer = null;
  let musicViz = null;
  let musicStarted = false;
  let trackIndex = 0;
  let musicNeedsGesture = false;
  const IS_FILE_PROTOCOL = location.protocol === 'file:';

  window.toggleMusicDock = function (open) {
    const dock = document.getElementById('music-dock');
    if (!dock) return;
    if (dockAnimTimer) clearTimeout(dockAnimTimer);

    if (open) {
      SiteEffects.tossFloorConfetti();
      syncShellWidth();
      dock.classList.remove('is-closing');
      dock.classList.add('is-opening');
      requestAnimationFrame(() => {
        requestAnimationFrame(() => dock.classList.add('expanded'));
      });
      dockAnimTimer = setTimeout(() => dock.classList.remove('is-opening'), 540);
      return;
    }

    dock.classList.remove('is-opening');
    dock.classList.add('is-closing');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => dock.classList.remove('expanded'));
    });
    dockAnimTimer = setTimeout(() => {
      dock.classList.remove('is-closing');
      syncShellWidth();
      setupMiniMarquee();
    }, 540);
  };

  /* ─── BACKGROUND ─── */
  const overlay = document.getElementById('bg-overlay');
  const dim = document.getElementById('bg-dim');
  const vignette = document.getElementById('bg-vignette');

  overlay.style.opacity = C.background.overlay;
  if (dim && C.background.dimColor) dim.style.background = C.background.dimColor;
  if (vignette && C.background.vignette) vignette.classList.add('on');

  const pattern = document.getElementById('bg-pattern');

  if (C.background.type === 'video' && C.background.video) {
    pattern.style.display = 'none';
    const vid = document.getElementById('bg-video');
    const loader = document.getElementById('bg-video-loader');
    vid.src = assetUrl(C.background.video);
    vid.load();
    vid.style.display = 'block';
    vid.muted = true;
    vid.classList.add('is-loading');

    let bgVideoReady = false;

    const showVideoLoader = () => {
      if (bgVideoReady) return;
      loader?.classList.add('is-active');
      loader?.classList.remove('is-hidden');
      loader?.setAttribute('aria-hidden', 'false');
      vid.classList.add('is-loading');
    };

    const hideVideoLoader = () => {
      if (bgVideoReady) return;
      bgVideoReady = true;
      loader?.classList.add('is-hidden');
      loader?.setAttribute('aria-hidden', 'true');
      vid.classList.remove('is-loading');
      setTimeout(() => loader?.classList.remove('is-active'), 480);
    };

    showVideoLoader();

    const startBgVideo = () => {
      if (C.background.randomStart !== false) {
        const dur = vid.duration;
        if (dur && isFinite(dur) && dur > 1) {
          vid.currentTime = Math.random() * dur;
        }
      }
      vid.play().catch(() => {});
    };

    const onVideoReady = () => hideVideoLoader();

    vid.addEventListener('loadeddata', onVideoReady, { once: true });
    vid.addEventListener('playing', onVideoReady);
    vid.addEventListener('waiting', () => {
      if (vid.readyState < 3) showVideoLoader();
    });
    vid.addEventListener('error', () => showVideoLoader());

    if (vid.readyState >= 2) startBgVideo();
    else vid.addEventListener('loadedmetadata', startBgVideo, { once: true });

    if (C.background.blur) vid.style.filter = `blur(${C.background.blur}px)`;
  } else if (C.background.type === 'image' && C.background.image) {
    pattern.style.display = 'none';
    const img = document.getElementById('bg-image');
    img.src = assetUrl(C.background.image);
    img.style.display = 'block';
    if (C.background.blur) img.style.filter = `blur(${C.background.blur}px)`;
  } else if (C.background.type === 'gradient') {
    pattern.style.display = 'none';
    const grad = document.getElementById('bg-gradient');
    grad.style.background = C.background.gradient;
    grad.style.display = 'block';
  }

  const crop = P.avatarCrop || 'center center';

  function avatarImg(url, cls) {
    return `<img class="${cls}" src="${assetUrl(url)}" alt="" style="object-position:${crop}" />`;
  }

  function avatarBlock(url) {
    if (url) return `<div class="avatar-wrap">${avatarImg(url, 'avatar')}</div>`;
    return `<div class="avatar-wrap"><div class="avatar-placeholder">${P.displayName[0]?.toUpperCase() || '?'}</div></div>`;
  }

  /* ─── BUILD PAGE ─── */
  const container = document.getElementById('container');

  const SOCIAL_LABELS = {
    telegram: 'Telegram',
    discord: 'Discord',
    youtube: 'YouTube',
    steam: 'Steam',
    instagram: 'Instagram',
    tiktok: 'TikTok',
    github: 'GitHub',
    twitter: 'X',
    vk: 'VK',
    spotify: 'Spotify',
    twitch: 'Twitch',
  };

  const bannerCfg = C.banner || {};
  const showBanner = bannerCfg.enabled !== false;
  const bannerHtml = showBanner
    ? `<div class="profile-banner${bannerCfg.image ? ' has-image' : ''}">
        ${bannerCfg.image
          ? `<img class="profile-banner-img" src="${bannerCfg.image}" alt="" />`
          : '<div class="profile-banner-bg"></div>'}
      </div>`
    : '';

  const serverCfg = C.discordServer || {};
  const serverTag = serverCfg.tag || serverCfg.name?.replace(/!+$/, '').trim() || 'FRND squad';
  const serverCard = serverCfg.enabled
    ? `<a class="card link-card tilt-card shine-card animate-in" id="discord-server" href="${serverCfg.invite || '#'}" target="_blank" rel="noopener">
        <div class="link-icon${serverCfg.icon ? ' link-icon-custom' : ''}" id="server-icon">
          ${serverCfg.icon
            ? `<img class="link-icon-img" src="${assetUrl(serverCfg.icon)}" alt="" />`
            : icon('discord')}
        </div>
        <div class="link-body">
          <div class="link-title" id="server-name">${escapeHtml(serverCfg.name || 'Discord Server')}</div>
          <div class="link-desc" id="server-desc">${escapeHtml(serverTag)} — ${escapeHtml(serverCfg.description || '')}</div>
          <div class="link-desc server-meta" id="server-meta"></div>
        </div>
        <div class="link-arrow">${icon('arrow')}</div>
      </a>`
    : '';

  const portfolioCfg = C.portfolio || {};
  const portfolioCard = portfolioCfg.enabled && portfolioCfg.url
    ? `<a class="card link-card tilt-card shine-card animate-in" id="portfolio-card" href="${portfolioCfg.url}" target="_blank" rel="noopener">
        <div class="link-icon">${icon(portfolioCfg.icon || 'website')}</div>
        <div class="link-body">
          <div class="link-title">${escapeHtml(portfolioCfg.title || 'Portfolio')}</div>
          ${portfolioCfg.description ? `<div class="link-desc">${escapeHtml(portfolioCfg.description)}</div>` : ''}
        </div>
        <div class="link-arrow">${icon('arrow')}</div>
      </a>`
    : '';

  const glowClass = T.glow ? ' glow' : '';

  const profileHtml = `
    <div class="card profile-card tilt-card${glowClass} animate-in">
      ${bannerHtml}
      <div class="views-badge" id="views-badge" title="уникальные IP-адреса">
        ${icon('eye')}
        <span id="views-count">...</span>
      </div>
      <div class="profile-body">
        <div class="profile-center">
          ${avatarBlock(P.avatar)}
          <div class="sparkle-zone">
            <div class="display-name">${escapeHtml(P.displayName)}</div>
          </div>
          ${P.tags.length ? `<div class="tags">${P.tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}</div>` : ''}
          ${P.pronouns ? `<span class="pronouns">${escapeHtml(P.pronouns)}</span>` : ''}
          ${P.location ? `<div class="location">${icon('pin')}<span>${escapeHtml(P.location)}</span></div>` : ''}
          ${C.social.length ? `<div class="social-row">${C.social.map(s => {
            const tip = escapeHtml(s.label || SOCIAL_LABELS[s.id] || s.id);
            return `<a class="social-btn" href="${s.url}" target="_blank" rel="noopener" data-tip="${tip}">${icon(s.id)}</a>`;
          }).join('')}</div>` : ''}
        </div>
      </div>
    </div>`;

  const linksHtml = C.links.map(l => `
    <a class="card link-card tilt-card shine-card animate-in" href="${l.url}" target="_blank" rel="noopener">
      <div class="link-icon">${icon(l.id)}</div>
      <div class="link-body">
        <div class="link-title">${escapeHtml(l.title)}</div>
        ${l.description ? `<div class="link-desc">${escapeHtml(l.description)}</div>` : ''}
      </div>
      <div class="link-arrow">${icon('arrow')}</div>
    </a>`).join('');

  container.innerHTML = profileHtml + linksHtml + serverCard + portfolioCard;

  const musicDock = document.getElementById('music-dock');
  if (C.music.enabled && getPlaylist().length) {
    loadTrack(0);
    document.getElementById('music-open').innerHTML = icon('volume');
    document.getElementById('music-toggle').innerHTML = icon('play');
    document.getElementById('music-prev').innerHTML = icon('skipPrev');
    document.getElementById('music-next').innerHTML = icon('skipNext');
    document.getElementById('music-close').innerHTML = icon('chevronDown');
    document.getElementById('vol-icon').innerHTML = icon('volume');
    const volSlider = document.getElementById('volume-slider');
    if (volSlider) volSlider.value = Math.round((C.music.volume ?? 0.45) * 100);
  } else if (musicDock) {
    musicDock.remove();
  }

  /* ─── FOOTER ─── */
  if (C.footer.show) {
    document.getElementById('footer').innerHTML = `
      <a class="footer-btn" href="${C.footer.url}" target="_blank" rel="noopener">
        <span class="footer-icon">${C.footer.icon}</span>
        ${escapeHtml(C.footer.text)}
      </a>`;
  } else {
    document.getElementById('footer').style.display = 'none';
  }

  /* ─── STATS ─── */
  async function updateStats() {
    const countEl = document.getElementById('views-count');
    const badge = document.getElementById('views-badge');

    if (!C.counter) {
      countEl.textContent = '0';
      return;
    }

    const stats = await trackVisit(C.counter);

    const offset = C.counter.offset ?? 0;

    if (stats.offline) {
      countEl.textContent = offset ? offset.toLocaleString() : '—';
      badge.title = offset
        ? `${offset} уникальных IP с fakecrime · живой счётчик только на хостинге`
        : 'Счётчик уникальных IP работает только на хостинге (не file://)';
    } else {
      const total = stats.unique + offset;
      countEl.textContent = total.toLocaleString();
      badge.title = offset
        ? `${total} уникальных IP · ${offset} fakecrime + ${stats.unique} на этом сайте`
        : `${stats.unique} уникальных IP`;
    }
  }

  /* ─── ENTER ─── */
  const enterScreen = document.getElementById('enter-screen');
  const page = document.getElementById('page');

  function initTypewriterTitle() {
    const text = siteCfg.tabTitle || P.displayName;

    if (siteCfg.titleTypewriter === false) {
      document.title = text;
      return;
    }

    const speed = siteCfg.typewriterSpeed ?? 88;
    let i = 0;
    document.title = '';

    function step() {
      if (i >= text.length) {
        document.title = text;
        return;
      }
      i += 1;
      document.title = text.slice(0, i);
      setTimeout(step, speed + Math.random() * 40);
    }

    setTimeout(step, 280);
  }

  let hasEntered = false;

  function enter(e) {
    if (hasEntered) return;
    hasEntered = true;
    e?.preventDefault();
    e?.stopPropagation();

    const vid = document.getElementById('bg-video');
    if (vid && vid.style.display !== 'none') vid.play().catch(() => {});

    enterScreen.classList.add('hidden');
    page.classList.add('visible');
    startMusic();
    initEffects();
    updateStats();
    loadDiscordServer();
    loadBanner();
    initTypewriterTitle();

    requestAnimationFrame(() => {
      requestAnimationFrame(() => initSiteEffects());
    });
  }

  function initEnterScreen(text) {
    const el = document.getElementById('enter-text');
    const emojiEl = document.getElementById('enter-emoji');
    if (!el) return;

    const charStart = 0.05;
    const charStep = 0.018;
    const charDur = 0.24;
    const len = text.length;

    el.textContent = '';
    el.setAttribute('aria-label', text);

    [...text].forEach((char, i) => {
      const span = document.createElement('span');
      span.className = 'enter-char';
      span.textContent = char === ' ' ? '\u00a0' : char;
      span.style.setProperty('--enter-delay', `${charStart + i * charStep}s`);
      el.appendChild(span);
    });

    const textMid = charStart + ((Math.max(len - 1, 0) * charStep + charDur) / 2);
    if (emojiEl) emojiEl.style.setProperty('--emoji-delay', `${textMid}s`);
  }

  if (C.enter.enabled) {
    const emojiEl = document.getElementById('enter-emoji');
    const emojiUrl = C.enter.emoji || C.enter.avatar || P.avatar;
    if (emojiEl && emojiUrl) emojiEl.src = assetUrl(emojiUrl);
    else emojiEl?.remove();

    initEnterScreen(C.enter.text || 'Tap to continue');
    const sub = document.getElementById('enter-sub');
    if (sub && C.enter.subtext) sub.textContent = C.enter.subtext;
    else sub?.remove();

    enterScreen.style.display = 'flex';
    page.style.display = 'flex';
    enterScreen.addEventListener('click', enter, { once: true });
  } else {
    enterScreen.style.display = 'none';
    page.classList.add('visible');
    page.style.display = 'flex';
  }

  function loadBanner() {
    if (!bannerCfg.enabled || bannerCfg.image || !C.discord?.userId) return;

    fetch(`https://japi.rest/discord/v1/user/${C.discord.userId}`)
      .then(r => r.json())
      .then(json => {
        const url = json.data?.bannerURL;
        if (!url) return;
        const bg = document.querySelector('.profile-banner-bg');
        if (bg) {
          bg.outerHTML = `<img class="profile-banner-img" src="${url}" alt="" />`;
        }
      })
      .catch(() => {});
  }

  function initSiteEffects() {
    SiteEffects.initParallax(C.effects?.parallax !== false);
    SiteEffects.initConfetti(C.effects?.confetti !== false);
  }

  /* ─── MUSIC ─── */
  function getPlaylist() {
    if (Array.isArray(C.music.playlist) && C.music.playlist.length) {
      return C.music.playlist.map((t) => ({
        url: encodeURI(assetUrl(t.url || t.file)),
        title: t.title || '',
        artist: t.artist || '',
      }));
    }
    if (C.music.url) {
      return [{ url: encodeURI(C.music.url), title: C.music.title || '', artist: C.music.artist || '' }];
    }
    return [];
  }

  function updateSkipButtons() {
    const playlist = getPlaylist();
    const dock = document.getElementById('music-dock');
    const single = playlist.length <= 1;
    dock?.classList.toggle('is-single', single);
    document.getElementById('music-prev')?.toggleAttribute('disabled', single);
    document.getElementById('music-next')?.toggleAttribute('disabled', single);
  }

  function applyTrackUI(track) {
    const miniLabel = `${track.title}${track.artist ? ` — ${track.artist}` : ''}`;
    document.getElementById('float-title').textContent = track.title;
    document.getElementById('music-mini-text').textContent = miniLabel;
    const artistEl = document.getElementById('float-artist');
    if (artistEl) artistEl.textContent = track.artist || '';
    document.getElementById('music-fill').style.width = '0%';
    document.getElementById('time-cur').textContent = '0:00';
    document.getElementById('time-end').textContent = '0:00';
    updateSkipButtons();
    setupMiniMarquee();
  }

  function loadTrack(index, playAfterLoad = false) {
    const playlist = getPlaylist();
    const audio = document.getElementById('audio');
    if (!playlist.length || !audio) return;

    trackIndex = ((index % playlist.length) + playlist.length) % playlist.length;
    const track = playlist[trackIndex];
    audio.loop = playlist.length === 1 && C.music.loop !== false;
    audio.src = track.url;
    applyTrackUI(track);

    const onReady = () => {
      audio.removeEventListener('loadedmetadata', onReady);
      document.getElementById('time-end').textContent = fmt(audio.duration);
      if (playAfterLoad) tryPlayMusic(audio);
    };

    if (audio.readyState >= 1) onReady();
    else audio.addEventListener('loadedmetadata', onReady);
  }

  function playPrevTrack() {
    const playlist = getPlaylist();
    if (!playlist.length || playlist.length === 1) return;

    const prev = trackIndex - 1;
    if (prev < 0) {
      if (C.music.loop === false) return;
      loadTrack(playlist.length - 1, true);
    } else {
      loadTrack(prev, true);
    }
  }

  function playNextTrack() {
    const playlist = getPlaylist();
    if (!playlist.length) return;

    if (playlist.length === 1) {
      if (C.music.loop === false) return;
      const audio = document.getElementById('audio');
      audio.currentTime = 0;
      tryPlayMusic(audio);
      return;
    }

    const next = trackIndex + 1;
    if (next >= playlist.length) {
      if (C.music.loop === false) return;
      loadTrack(0, true);
    } else {
      loadTrack(next, true);
    }
  }

  function getMiniMeasureEl() {
    let el = document.getElementById('music-mini-measure');
    if (!el) {
      el = document.createElement('span');
      el.id = 'music-mini-measure';
      el.className = 'music-mini-label';
      el.setAttribute('aria-hidden', 'true');
      el.style.cssText = 'position:fixed;left:-9999px;top:-9999px;visibility:hidden;white-space:nowrap;pointer-events:none;';
      document.body.appendChild(el);
    }
    return el;
  }

  function measureMiniTextWidth(text) {
    const el = getMiniMeasureEl();
    el.textContent = text;
    return el.scrollWidth;
  }

  function calcMiniLayout(text) {
    const iconGap = 28;
    const padX = 28;
    const textW = measureMiniTextWidth(text);
    const dockMax = window.innerWidth - 24;
    const maxTextW = Math.max(72, dockMax - iconGap - padX);
    const textAreaW = Math.min(textW, maxTextW);
    const shellW = iconGap + padX + textAreaW;

    return { shellW, textAreaW, textW, needsScroll: textW > textAreaW + 2 };
  }

  function syncShellWidth() {
    const shell = document.getElementById('music-dock-shell');
    const label = document.getElementById('music-mini-text');
    const dock = document.getElementById('music-dock');
    if (!shell || !label) return;

    const apply = () => {
      const text = label.textContent.trim();
      if (!text) return;

      const { shellW } = calcMiniLayout(text);
      const prev = parseFloat(getComputedStyle(shell).getPropertyValue('--shell-w')) || shell.offsetWidth;
      const isCollapsed = !dock?.classList.contains('expanded') && !dock?.classList.contains('is-opening');

      shell.style.setProperty('--shell-w', `${shellW}px`);
      if (isCollapsed) shell.style.width = `${shellW}px`;
      else shell.style.removeProperty('width');

      if (Math.abs(prev - shellW) > 2) {
        shell.classList.add('is-resizing');
        clearTimeout(shell._resizeTimer);
        shell._resizeTimer = setTimeout(() => shell.classList.remove('is-resizing'), 480);
      }
    };

    requestAnimationFrame(() => requestAnimationFrame(apply));
  }

  function setupMiniMarquee() {
    const track = document.getElementById('music-mini-track');
    const label = document.getElementById('music-mini-text');
    const marquee = track?.parentElement;
    const miniBtn = document.getElementById('music-mini');
    if (!track || !label || !marquee) return;

    track.querySelectorAll('.music-mini-label.is-copy').forEach(el => el.remove());
    track.classList.remove('is-scroll');
    marquee.classList.remove('is-static');
    marquee.style.maxWidth = '';
    marquee.style.width = '';

    const text = label.textContent.trim();
    if (!text) return;

    const measure = () => {
      const { textAreaW, textW, needsScroll } = calcMiniLayout(text);

      marquee.style.maxWidth = `${textAreaW}px`;

      const available = marquee.clientWidth;
      const overflow = needsScroll || textW > available + 2;
      if (!overflow) {
        marquee.classList.add('is-static');
        syncShellWidth();
        return;
      }

      marquee.classList.remove('is-static');

      const copy = label.cloneNode(true);
      copy.classList.add('is-copy');
      copy.setAttribute('aria-hidden', 'true');
      track.appendChild(copy);

      const pauseSec = C.music.marqueePause ?? 1.5;
      const scrollSec = Math.max(8, Math.min(22, textW / 28));
      const totalSec = pauseSec + scrollSec;
      const pausePct = (pauseSec / totalSec) * 100;

      let styleEl = document.getElementById('marquee-keyframes');
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'marquee-keyframes';
        document.head.appendChild(styleEl);
      }
      styleEl.textContent = `
@keyframes miniMarquee {
  0%, ${pausePct.toFixed(2)}% { transform: translateX(0); }
  100% { transform: translateX(calc(-50% - 14px)); }
}`;

      track.style.setProperty('--marquee-dur', `${totalSec}s`);
      track.classList.add('is-scroll');
      syncShellWidth();
    };

    requestAnimationFrame(() => requestAnimationFrame(measure));
  }

  function showMusicFileHint(reason) {
    const dock = document.getElementById('music-dock');
    if (!dock) return;

    let hint = dock.querySelector('.music-file-hint');
    if (!hint) {
      hint = document.createElement('p');
      hint.className = 'music-file-hint';
      dock.appendChild(hint);
    }

    hint.textContent = reason === 'load'
      ? 'Файл не загрузился. Запусти сайт через локальный сервер, а не двойным кликом по index.html'
      : 'Нажми Play или кликни по странице — при открытии файла браузер блокирует автозапуск';
    dock.classList.add('needs-gesture');
  }

  function clearMusicFileHint() {
    const dock = document.getElementById('music-dock');
    dock?.classList.remove('needs-gesture');
    dock?.querySelector('.music-file-hint')?.remove();
  }

  function tryPlayMusic(audio) {
    return audio.play()
      .then(() => {
        musicNeedsGesture = false;
        clearMusicFileHint();
        setPlayIcon(true);
      })
      .catch(() => {
        musicNeedsGesture = true;
        if (IS_FILE_PROTOCOL) showMusicFileHint('autoplay');
      });
  }

  function startMusic() {
    if (!C.music.enabled || !getPlaylist().length) return;
    const audio = document.getElementById('audio');
    const toggle = document.getElementById('music-toggle');
    const dock = document.getElementById('music-dock');
    const miniBtn = document.getElementById('music-mini');
    const closeBtn = document.getElementById('music-close');
    const volSlider = document.getElementById('volume-slider');
    const volIcon = document.getElementById('vol-icon');
    const vizEl = document.getElementById('music-viz');
    if (!audio || !toggle) return;
    if (musicStarted) return;
    musicStarted = true;

    audio.volume = C.music.volume ?? 0.45;
    musicViz = SiteEffects.initVisualizer(audio, vizEl);

    miniBtn?.addEventListener('click', () => {
      window.toggleMusicDock(true);
    });

    closeBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      window.toggleMusicDock(false);
    });

    document.getElementById('music-prev')?.addEventListener('click', (e) => {
      e.stopPropagation();
      playPrevTrack();
    });

    document.getElementById('music-next')?.addEventListener('click', (e) => {
      e.stopPropagation();
      playNextTrack();
    });

    window.addEventListener('resize', setupMiniMarquee);
    document.fonts?.ready?.then(setupMiniMarquee).catch(() => {});
    setTimeout(setupMiniMarquee, 50);
    setTimeout(setupMiniMarquee, 450);

    audio.addEventListener('ended', playNextTrack);

    audio.addEventListener('error', () => {
      if (IS_FILE_PROTOCOL) showMusicFileHint('load');
    });

    if (C.music.autoplay) tryPlayMusic(audio);

    document.addEventListener('pointerdown', () => {
      if (!musicNeedsGesture || audio.paused !== true) return;
      tryPlayMusic(audio);
    }, { passive: true });

    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      if (audio.paused) {
        tryPlayMusic(audio);
      } else {
        audio.pause();
        setPlayIcon(false);
      }
    });

    audio.addEventListener('timeupdate', () => {
      const pct = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
      document.getElementById('music-fill').style.width = pct + '%';
      document.getElementById('time-cur').textContent = fmt(audio.currentTime);
    });

    audio.addEventListener('loadedmetadata', () => {
      document.getElementById('time-end').textContent = fmt(audio.duration);
    });

    audio.addEventListener('play', () => dock?.classList.add('playing'));
    audio.addEventListener('pause', () => dock?.classList.remove('playing'));

    const musicBar = document.getElementById('music-bar');
    let seeking = false;

    function seekFromEvent(e) {
      if (!musicBar || !audio.duration || !isFinite(audio.duration)) return;
      const rect = musicBar.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      audio.currentTime = pct * audio.duration;
      document.getElementById('music-fill').style.width = `${pct * 100}%`;
      document.getElementById('time-cur').textContent = fmt(audio.currentTime);
    }

    musicBar?.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      e.preventDefault();
      seeking = true;
      musicBar.setPointerCapture(e.pointerId);
      seekFromEvent(e);
    });

    musicBar?.addEventListener('pointermove', (e) => {
      if (!seeking) return;
      seekFromEvent(e);
    });

    musicBar?.addEventListener('pointerup', (e) => {
      if (!seeking) return;
      seeking = false;
      musicBar.releasePointerCapture(e.pointerId);
      seekFromEvent(e);
    });

    musicBar?.addEventListener('click', (e) => e.stopPropagation());

    function setVolSliderVisual(pct) {
      if (!volSlider) return;
      volSlider.style.setProperty('--vol-pct', `${pct}%`);
    }

    volSlider?.addEventListener('input', (e) => {
      const v = Number(e.target.value) / 100;
      audio.volume = v;
      setVolSliderVisual(e.target.value);
      updateVolIcon(v);
    });

    function updateVolIcon(v) {
      if (!volIcon) return;
      if (v === 0) volIcon.innerHTML = icon('volumeMute');
      else if (v < 0.35) volIcon.innerHTML = icon('volumeLow');
      else volIcon.innerHTML = icon('volume');
    }

    setVolSliderVisual(volSlider?.value ?? Math.round(audio.volume * 100));
    updateVolIcon(audio.volume);
  }

  function setPlayIcon(playing) {
    const btn = document.getElementById('music-toggle');
    if (btn) btn.innerHTML = icon(playing ? 'pause' : 'play');
  }

  function fmt(s) {
    if (!s || isNaN(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, '0')}`;
  }

  /* ─── DISCORD (Lanyard) ─── */
  const STATUS_CLASS = {
    online: 'status-online',
    idle: 'status-idle',
    dnd: 'status-dnd',
    offline: 'status-offline',
  };

  function loadDiscordServer() {
    const cfg = C.discordServer;
    if (!cfg?.enabled) return;

    const metaEl = document.getElementById('server-meta');
    const nameEl = document.getElementById('server-name');
    const iconEl = document.getElementById('server-icon');
    if (!metaEl) return;

    if (!cfg.guildId) return;

    fetch(`https://discord.com/api/guilds/${cfg.guildId}/widget.json`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        if (nameEl && data.name) nameEl.textContent = data.name;
        if (iconEl && data.icon && !cfg.icon) {
          iconEl.innerHTML = `<img class="link-icon-img" src="https://cdn.discordapp.com/icons/${cfg.guildId}/${data.icon}.png?size=128" alt="" />`;
        }
        const online = data.presence_count ?? 0;
        metaEl.textContent = `${online} участников онлайн`;
      })
      .catch(() => {
        metaEl.textContent = '';
      });
  }

  function setDiscordStatus(status, activityText) {
    const dot = document.getElementById('discord-dot');
    if (dot) {
      dot.className = `discord-status-dot ${STATUS_CLASS[status] || 'status-offline'}`;
    }
    const actEl = document.getElementById('discord-act');
    if (actEl) actEl.textContent = activityText;
  }

  function loadDiscord() {
    if (!C.discord.enabled || !C.discord.userId) return;

    const el = document.getElementById('discord-presence');
    if (!el) return;

    const userId = C.discord.userId;
    const nameEl = document.getElementById('discord-name');
    const avWrap = document.getElementById('discord-av-wrap');
    const statusLabels = { online: 'В сети', idle: 'Не активен', dnd: 'Не беспокоить', offline: 'Не в сети' };

    function renderAvatar(url, status) {
      avWrap.innerHTML = `<img class="discord-status-av" src="${url}" alt="" /><span class="discord-status-dot ${STATUS_CLASS[status] || 'status-offline'}" id="discord-dot"></span>`;
    }

    fetch(`https://japi.rest/discord/v1/user/${userId}`)
      .then(r => r.json())
      .then(json => {
        const d = json.data;
        if (!d) return;

        nameEl.textContent = d.global_name || d.username;
        renderAvatar(d.avatarURL || d.defaultAvatarURL, 'offline');
      })
      .catch(() => {});

    fetch(`https://api.lanyard.rest/v1/users/${userId}`)
      .then(r => r.json())
      .then(json => {
        if (!json.success) {
          setDiscordStatus('offline', statusLabels.offline);
          return;
        }

        const d = json.data;
        const av = d.discord_user.avatar
          ? `https://cdn.discordapp.com/avatars/${d.discord_user.id}/${d.discord_user.avatar}.png?size=64`
          : null;

        if (av) renderAvatar(av, d.discord_status);
        nameEl.textContent = d.discord_user.global_name || d.discord_user.username;

        const act = d.activities.find(a => a.type !== 4) || d.activities[0];
        if (act) {
          let text = act.name;
          if (act.details) text += ` — ${act.details}`;
          else if (act.state) text += ` — ${act.state}`;
          setDiscordStatus(d.discord_status, text);
        } else {
          setDiscordStatus(d.discord_status, statusLabels[d.discord_status] || d.discord_status);
        }
      })
      .catch(() => setDiscordStatus('offline', statusLabels.offline));
  }

  /* ─── EFFECTS ─── */
  function initEffects() {
    if (!C.effects || C.effects.type === 'none') return;

    const canvas = document.getElementById('fx-canvas');
    if (C.effects.type === 'sparkles') initTextSparkles();
    if (C.effects.type !== 'particles' || !canvas) return;
    const ctx = canvas.getContext('2d');
    const particles = [];
    const count = Math.floor((C.effects.intensity || 30) * 1.2);

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        s: 0.5 + Math.random() * 2,
        a: Math.random() * Math.PI * 2,
      });
    }

    function loop() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = C.effects.color || 'rgba(255,255,255,0.6)';

      for (const p of particles) {
        ctx.globalAlpha = 0.15 + Math.random() * 0.35;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2);
        ctx.fill();
        p.x += Math.cos(p.a) * 0.2;
        p.y += Math.sin(p.a) * 0.2;
        if (p.x < 0 || p.x > canvas.width) p.a = Math.PI - p.a;
        if (p.y < 0 || p.y > canvas.height) p.a = -p.a;
      }
      ctx.globalAlpha = 1;
      requestAnimationFrame(loop);
    }
    loop();
  }

  function randomSparklePoint() {
    const x = -12 + Math.random() * 124;
    const y = 36 + Math.random() * 32;
    const driftStart = (Math.random() - 0.5) * 8;
    const driftEnd = driftStart + (Math.random() - 0.5) * 26;
    const rise = 16 + Math.random() * 26;

    return { x, y, driftStart, driftEnd, rise };
  }

  function applySparklePoint(sp, point) {
    sp.style.left = `${point.x}%`;
    sp.style.top = `${point.y}%`;
    sp.style.setProperty('--sparkle-drift-start', `${point.driftStart}px`);
    sp.style.setProperty('--sparkle-drift-end', `${point.driftEnd}px`);
    sp.style.setProperty('--sparkle-rise', `${point.rise}px`);
  }

  function initTextSparkles() {
    const fx = C.effects;
    const selectors = fx.targets || ['.sparkle-zone'];
    const sparkleColor = fx.color || '#ffffff';
    const count = Math.max(4, Math.floor((fx.intensity || 18) / 4));

    selectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(zone => {
        if (zone.dataset.sparkles) return;
        zone.dataset.sparkles = '1';
        zone.classList.add('sparkle-host');

        for (let i = 0; i < count; i++) {
          const sp = document.createElement('span');
          sp.className = 'text-sparkle';
          sp.textContent = '✦';
          sp.style.color = sparkleColor;
          sp.style.setProperty('--sparkle-dur', `${2.1 + Math.random() * 1.4}s`);
          sp.style.setProperty('--sparkle-delay', `${Math.random() * 2.5}s`);

          applySparklePoint(sp, randomSparklePoint());
          sp.addEventListener('animationiteration', () => {
            applySparklePoint(sp, randomSparklePoint());
          });

          zone.appendChild(sp);
        }
      });
    });
  }

  function escapeHtml(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function hexToRgba(hex, a) {
    const h = hex.replace('#', '');
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    return `rgba(${r},${g},${b},${a})`;
  }

  if (!C.enter.enabled) {
    startMusic();
    initEffects();
    initSiteEffects();
    updateStats();
    loadDiscordServer();
    loadBanner();
    initTypewriterTitle();
  }
})();
