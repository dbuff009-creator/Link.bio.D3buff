const SiteEffects = (() => {
  const CURSOR_PATH = 'image/cursor.png';
  const CURSOR_HOTSPOT = '3 2';

  function applyCursor() {
    const css = `url('${CURSOR_PATH}') ${CURSOR_HOTSPOT}, auto`;
    document.documentElement.style.cursor = css;
    document.body.style.cursor = css;
  }

  function assetUrl(path) {
    if (!path || /^https?:\/\//i.test(path) || /^data:/i.test(path)) return path;
    const v = (typeof CONFIG !== 'undefined' && CONFIG.site?.cacheVersion) || 1;
    return `${path}${path.includes('?') ? '&' : '?'}v=${v}`;
  }

  function initCursor(cfg) {
    if (cfg?.custom) {
      const css = `url(${assetUrl(cfg.custom)}) ${CURSOR_HOTSPOT}, auto`;
      document.documentElement.style.cursor = css;
      document.body.style.cursor = css;
      return;
    }
    if (cfg?.childDrawn !== false) applyCursor();
  }

  function initParallax(enabled) {
    if (!enabled) return;
    document.querySelectorAll('.tilt-card').forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        card.style.setProperty('--tilt-x', `${x * 6}deg`);
        card.style.setProperty('--tilt-y', `${-y * 6}deg`);
      });
      card.addEventListener('mouseleave', () => {
        card.style.setProperty('--tilt-x', '0deg');
        card.style.setProperty('--tilt-y', '0deg');
      });
    });
  }

  const CONFETTI_COLORS = [
    '#ffffff', '#f5f5f5', '#e5e5e5', '#d4d4d4', '#a3a3a3',
    '#737373', '#525252', '#262626', '#171717', '#000000',
  ];
  const CONFETTI_SHAPES = ['rect', 'ribbon', 'triangle', 'shard'];

  let confettiCanvas = null;
  let confettiCtx = null;
  let confettiParticles = [];
  let confettiRunning = false;

  function getConfettiFloor() {
    const dock = document.getElementById('music-dock');
    const dockH = dock ? dock.getBoundingClientRect().height + 10 : 0;
    return window.innerHeight - Math.max(14, dockH);
  }

  function ensureConfettiCanvas() {
    if (confettiCanvas) return confettiCtx;
    confettiCanvas = document.createElement('canvas');
    confettiCanvas.id = 'confetti-canvas';
    document.body.appendChild(confettiCanvas);
    confettiCtx = confettiCanvas.getContext('2d');
    const resize = () => {
      confettiCanvas.width = window.innerWidth;
      confettiCanvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);
    return confettiCtx;
  }

  function spawnConfettiParticle(x, y) {
    const shape = CONFETTI_SHAPES[Math.floor(Math.random() * CONFETTI_SHAPES.length)];
    const ribbon = shape === 'ribbon';
    const w = ribbon ? 2 + Math.random() * 2.5 : 4.5 + Math.random() * 6.5;
    const h = ribbon ? 11 + Math.random() * 13 : 2.5 + Math.random() * 5.5;
    const angle = Math.random() * Math.PI * 2;
    const speed = 3.5 + Math.random() * 9;

    return {
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - (5 + Math.random() * 9),
      w,
      h,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      shape,
      rot: Math.random() * Math.PI * 2,
      rotV: (Math.random() - 0.5) * 0.32,
      opacity: 1,
      landed: false,
      landAt: 0,
      flutter: Math.random() * Math.PI * 2,
      flutterSpd: 2 + Math.random() * 4,
    };
  }

  function drawConfettiParticle(ctx, p) {
    ctx.save();
    ctx.globalAlpha = p.opacity;
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.fillStyle = p.color;

    if (p.shape === 'triangle') {
      ctx.beginPath();
      ctx.moveTo(0, -p.h * 0.55);
      ctx.lineTo(-p.w * 0.55, p.h * 0.45);
      ctx.lineTo(p.w * 0.55, p.h * 0.45);
      ctx.closePath();
      ctx.fill();
    } else if (p.shape === 'shard') {
      ctx.beginPath();
      ctx.moveTo(-p.w * 0.5, -p.h * 0.35);
      ctx.lineTo(p.w * 0.45, -p.h * 0.5);
      ctx.lineTo(p.w * 0.5, p.h * 0.4);
      ctx.lineTo(-p.w * 0.35, p.h * 0.5);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    }

    ctx.restore();
  }

  function tickConfetti() {
    const ctx = ensureConfettiCanvas();
    const floor = getConfettiFloor();
    const gravity = 0.34;
    const drag = 0.988;
    const now = Date.now();

    ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

    confettiParticles.forEach((p) => {
      if (!p.landed) {
        p.vy += gravity;
        p.vx *= drag;
        p.vy *= drag;
        p.flutter += p.flutterSpd * 0.018;
        p.vx += Math.sin(p.flutter) * 0.18;

        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.rotV;

        const bottom = p.y + p.h * 0.5;
        if (bottom >= floor) {
          p.y = floor - p.h * 0.5;
          if (p.vy > 1.2) {
            p.vy *= -0.22;
            p.vx *= 0.72;
            p.rotV *= 0.45;
          } else {
            p.vy = 0;
            p.vx *= 0.55;
            p.rotV *= 0.25;
            if (Math.abs(p.vx) < 0.35) {
              p.landed = true;
              p.vx = 0;
              p.rotV = 0;
              p.landAt = now;
            }
          }
        }

        if (p.x < p.w) { p.x = p.w; p.vx *= -0.45; }
        if (p.x > confettiCanvas.width - p.w) {
          p.x = confettiCanvas.width - p.w;
          p.vx *= -0.45;
        }
      } else if (now - p.landAt > 900) {
        p.opacity -= 0.06;
      }

      if (p.opacity > 0) drawConfettiParticle(ctx, p);
    });

    confettiParticles = confettiParticles.filter((p) => p.opacity > 0);

    if (confettiParticles.length) {
      requestAnimationFrame(tickConfetti);
    } else {
      confettiRunning = false;
      ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    }
  }

  function burstConfetti(x, y) {
    ensureConfettiCanvas();
    for (let i = 0; i < 18; i++) {
      confettiParticles.push(spawnConfettiParticle(x, y));
    }
    if (!confettiRunning) {
      confettiRunning = true;
      requestAnimationFrame(tickConfetti);
    }
  }

  function tossFloorConfetti() {
    if (!confettiParticles.length) return;

    ensureConfettiCanvas();
    const dock = document.getElementById('music-dock');
    const rect = dock?.getBoundingClientRect();
    const centerX = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
    let tossed = 0;

    confettiParticles.forEach((p) => {
      if (!p.landed || p.opacity <= 0) return;

      p.landed = false;
      p.landAt = 0;
      const rel = (p.x - centerX) / (window.innerWidth * 0.35);
      p.vy = -(14 + Math.random() * 16);
      p.vx = rel * (10 + Math.random() * 14) + (Math.random() - 0.5) * 8;
      p.rotV = (Math.random() - 0.5) * 1.1;
      p.opacity = 1;
      tossed++;
    });

    if (tossed && !confettiRunning) {
      confettiRunning = true;
      requestAnimationFrame(tickConfetti);
    }
  }

  function initConfetti(enabled) {
    if (!enabled) return;
    document.addEventListener('click', (e) => {
      if (e.target.closest('a, button, input, .music-bar, .music-dock, .music-mini')) return;
      burstConfetti(e.clientX, e.clientY);
    });
  }

  function initVisualizer(audio, container) {
    if (!audio || !container) return null;

    const bars = 32;
    container.innerHTML = '';
    const spans = [];
    for (let i = 0; i < bars; i++) {
      const s = document.createElement('span');
      container.appendChild(s);
      spans.push(s);
    }

    let analyser, freqData, source, ctxAudio;

    function setup() {
      if (source) return true;
      try {
        ctxAudio = new (window.AudioContext || window.webkitAudioContext)();
        source = ctxAudio.createMediaElementSource(audio);
        analyser = ctxAudio.createAnalyser();
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.82;
        analyser.minDecibels = -90;
        analyser.maxDecibels = -10;
        source.connect(analyser);
        analyser.connect(ctxAudio.destination);
        freqData = new Uint8Array(analyser.frequencyBinCount);
        return true;
      } catch {
        return false;
      }
    }

    function barValue(i) {
      if (!freqData || !ctxAudio) return 0;
      const minHz = 80;
      const maxHz = 14000;
      const nyquist = ctxAudio.sampleRate / 2;
      const t0 = i / bars;
      const t1 = (i + 1) / bars;
      const hz0 = minHz * Math.pow(maxHz / minHz, t0);
      const hz1 = minHz * Math.pow(maxHz / minHz, t1);
      const bin0 = Math.max(0, Math.floor((hz0 / nyquist) * freqData.length));
      const bin1 = Math.max(bin0 + 1, Math.ceil((hz1 / nyquist) * freqData.length));
      let peak = 0;
      for (let b = bin0; b < bin1; b++) peak = Math.max(peak, freqData[b]);
      return peak;
    }

    function tick() {
      requestAnimationFrame(tick);
      const playing = !audio.paused && analyser && freqData;
      if (playing) analyser.getByteFrequencyData(freqData);

      spans.forEach((el, i) => {
        let h = 8;
        if (playing) {
          const v = barValue(i) / 255;
          h = 5 + Math.pow(v, 0.85) * 95;
        }
        el.style.height = `${h}%`;
        el.style.opacity = playing ? 0.35 + (h / 100) * 0.65 : 0.2;
      });
    }

    function resumeAndSetup() {
      if (ctxAudio?.state === 'suspended') ctxAudio.resume();
      setup();
    }

    setup();
    audio.addEventListener('play', resumeAndSetup);
    document.addEventListener('click', resumeAndSetup, { once: true });
    tick();

    return { setup: resumeAndSetup };
  }

  return {
    initCursor,
    initParallax,
    initConfetti,
    initVisualizer,
    burstConfetti,
    tossFloorConfetti,
  };
})();
