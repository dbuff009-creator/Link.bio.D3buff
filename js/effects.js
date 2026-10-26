/* Курсор, наклон карточек и анализатор музыки. */
const SiteEffects = (() => {
  const CURSOR_HOTSPOT = '3 2';
  let stopSnow = null;

  async function initCursor(cfg) {
    if (window.matchMedia('(pointer: coarse)').matches) return;
    const path = cfg?.custom || (cfg?.childDrawn !== false
      ? await SiteAssets.resolve('image/cursor')
      : '');
    if (!path) return;
    const css = `url("${SiteAssets.url(path)}") ${CURSOR_HOTSPOT}, auto`;
    document.documentElement.style.cursor = css;
    document.body.style.cursor = css;
  }

  function initParallax(enabled) {
    if (!enabled || window.matchMedia('(prefers-reduced-motion: reduce), (pointer: coarse)').matches) return;
    document.querySelectorAll('.tilt-card').forEach(card => {
      if (card.dataset.parallax) return;
      card.dataset.parallax = '1';
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
      const ready = setup();
      if (ctxAudio && ctxAudio.state !== 'running' && ctxAudio.state !== 'closed') {
        ctxAudio.resume().catch(() => {});
      }
      return ready;
    }

    resumeAndSetup();
    audio.addEventListener('play', resumeAndSetup);
    document.addEventListener('click', resumeAndSetup, { once: true });
    tick();

    return { setup: resumeAndSetup };
  }

  return { initCursor, initParallax, initVisualizer };
})();
