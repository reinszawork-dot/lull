/* Lull sound engine: generative, endless soundscapes made live with Web Audio. No audio files, works offline. */
window.Sound = (() => {
  let ctx = null, master = null;
  const buffers = {};
  const layers = {}; // id -> { gain, nodes, timers, vol }
  let fadeTimer = null;
  const listeners = new Set();

  function ensure() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = 1;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function noise(type) {
    if (buffers[type]) return buffers[type];
    const len = ctx.sampleRate * 6;
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, last = 0;
      for (let i = 0; i < len; i++) {
        const w = Math.random() * 2 - 1;
        if (type === 'white') d[i] = w * 0.5;
        else if (type === 'pink') {
          b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852;
          b3 = 0.8665 * b3 + w * 0.3104856; b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898;
          d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11; b6 = w * 0.115926;
        } else { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
      }
      // crossfade the loop seam
      const f = 2048;
      for (let i = 0; i < f; i++) { const t = i / f; d[len - f + i] = d[len - f + i] * (1 - t) + d[i] * t; }
    }
    return (buffers[type] = buf);
  }
  function src(type) { const s = ctx.createBufferSource(); s.buffer = noise(type); s.loop = true; s.loopStart = 0; s.playbackRate.value = 0.97 + Math.random() * 0.06; return s; }
  function filt(type, freq, q = 0.7) { const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q; return f; }
  function gainN(v) { const g = ctx.createGain(); g.gain.value = v; return g; }
  function lfo(freq, depth, param) { const o = ctx.createOscillator(); o.frequency.value = freq; const g = gainN(depth); o.connect(g); g.connect(param); o.start(); return o; }
  function chain(...n) { for (let i = 0; i < n.length - 1; i++) n[i].connect(n[i + 1]); return n[n.length - 1]; }

  // Short filtered noise burst (raindrop, crackle).
  function burst(out, { freq = 3000, q = 4, dur = 0.03, vol = 0.2, type = 'white' } = {}) {
    const t = ctx.currentTime;
    const s = ctx.createBufferSource(); s.buffer = noise(type);
    const f = filt('bandpass', freq, q);
    const g = gainN(0);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    chain(s, f, g, out);
    s.start(t, Math.random() * 5); s.stop(t + dur + 0.05);
  }

  const builders = {
    rain(out) {
      const s = src('pink');
      chain(s, filt('highpass', 400), filt('lowpass', 7000), gainN(0.9), out);
      const s2 = src('white');
      const g2 = gainN(0.12);
      chain(s2, filt('bandpass', 5000, 0.5), g2, out);
      lfo(0.13, 0.05, g2.gain);
      s.start(); s2.start();
      const t = setInterval(() => { const n = 1 + Math.floor(Math.random() * 3); for (let i = 0; i < n; i++) burst(out, { freq: 1800 + Math.random() * 5000, q: 6, dur: 0.02 + Math.random() * 0.04, vol: 0.05 + Math.random() * 0.12 }); }, 70);
      return { nodes: [s, s2], timers: [t] };
    },
    ocean(out) {
      const s = src('brown');
      const lp = filt('lowpass', 500);
      const g = gainN(0.55);
      chain(s, lp, g, out);
      lfo(0.075, 0.42, g.gain);
      lfo(0.075, 380, lp.frequency);
      const s2 = src('pink');
      const g2 = gainN(0.08);
      chain(s2, filt('highpass', 1200), g2, out);
      lfo(0.075, 0.07, g2.gain);
      s.start(); s2.start();
      return { nodes: [s, s2], timers: [] };
    },
    wind(out) {
      const s = src('white');
      const bp = filt('bandpass', 450, 0.9);
      const g = gainN(0.5);
      chain(s, bp, g, out);
      lfo(0.045, 260, bp.frequency);
      lfo(0.031, 0.3, g.gain);
      const s2 = src('brown');
      chain(s2, filt('lowpass', 250), gainN(0.4), out);
      s.start(); s2.start();
      return { nodes: [s, s2], timers: [] };
    },
    fire(out) {
      const s = src('brown');
      const g = gainN(0.7);
      chain(s, filt('lowpass', 380), g, out);
      lfo(0.4, 0.15, g.gain);
      s.start();
      const t = setInterval(() => {
        if (Math.random() < 0.55) burst(out, { freq: 1200 + Math.random() * 3500, q: 2, dur: 0.008 + Math.random() * 0.02, vol: 0.1 + Math.random() * 0.4 });
        if (Math.random() < 0.04) for (let i = 0; i < 5; i++) setTimeout(() => burst(out, { freq: 2500, q: 1.5, dur: 0.01, vol: 0.25 }), i * 30 + Math.random() * 40);
      }, 90);
      return { nodes: [s], timers: [t] };
    },
    crickets(out) {
      const bed = src('pink');
      chain(bed, filt('lowpass', 900), gainN(0.12), out);
      bed.start();
      const chirp = (freq, pan) => {
        const t0 = ctx.currentTime + 0.02;
        const o = ctx.createOscillator(); o.frequency.value = freq;
        const g = gainN(0);
        const p = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
        for (let i = 0; i < 3; i++) { const t = t0 + i * 0.06; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.05, t + 0.01); g.gain.linearRampToValueAtTime(0, t + 0.04); }
        if (p) { p.pan.value = pan; chain(o, g, p, out); } else chain(o, g, out);
        o.start(t0); o.stop(t0 + 0.25);
      };
      const t1 = setInterval(() => chirp(4300 + Math.random() * 80, -0.6), 820);
      const t2 = setInterval(() => { if (Math.random() < 0.7) chirp(4700 + Math.random() * 80, 0.6); }, 1130);
      return { nodes: [bed], timers: [t1, t2] };
    },
    brown(out) {
      const s = src('brown');
      chain(s, filt('lowpass', 1200), gainN(0.9), out);
      s.start();
      return { nodes: [s], timers: [] };
    },
    drone(out) {
      const lp = filt('lowpass', 700);
      const g = gainN(0.12);
      chain(lp, g, out);
      lfo(0.05, 0.04, g.gain);
      const nodes = [110, 164.81, 220.5, 329.6].map((f, i) => {
        const o = ctx.createOscillator(); o.type = i % 2 ? 'triangle' : 'sine'; o.frequency.value = f;
        const og = gainN(i === 3 ? 0.25 : 0.6);
        lfo(0.03 + i * 0.011, 1.2, o.detune);
        chain(o, og, lp); o.start();
        return o;
      });
      return { nodes, timers: [] };
    },
  };

  function emit() { listeners.forEach((fn) => fn(active())); }
  function active() { return Object.keys(layers); }

  function start(id, vol = 0.5) {
    ensure();
    if (layers[id]) return setVol(id, vol);
    cancelFade();
    const g = gainN(0);
    g.connect(master);
    const built = builders[id](g);
    g.gain.setTargetAtTime(vol, ctx.currentTime, 0.8);
    layers[id] = { gain: g, vol, ...built };
    emit();
  }
  function setVol(id, vol) { const l = layers[id]; if (!l) return; l.vol = vol; l.gain.gain.setTargetAtTime(vol, ctx.currentTime, 0.2); }
  function stop(id, fast) {
    const l = layers[id]; if (!l) return;
    delete layers[id];
    l.timers.forEach(clearInterval);
    l.gain.gain.setTargetAtTime(0, ctx.currentTime, fast ? 0.05 : 0.6);
    setTimeout(() => { l.nodes.forEach((n) => { try { n.stop(); } catch {} }); l.gain.disconnect(); }, fast ? 300 : 3000);
    emit();
  }
  function stopAll(fast) { active().forEach((id) => stop(id, fast)); cancelFade(); }
  function cancelFade() {
    if (fadeTimer) { clearTimeout(fadeTimer); fadeTimer = null; }
    if (master) { master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setTargetAtTime(1, ctx.currentTime, 0.1); }
  }
  // Fade everything out over the last 60s of the timer, then stop.
  function sleepTimer(mins) {
    if (fadeTimer) clearTimeout(fadeTimer);
    fadeTimer = null;
    if (!mins) return;
    const ms = mins * 60000;
    fadeTimer = setTimeout(() => {
      const t = ctx.currentTime;
      master.gain.setValueAtTime(master.gain.value, t);
      master.gain.linearRampToValueAtTime(0, t + 60);
      fadeTimer = setTimeout(() => { fadeTimer = null; stopAll(true); }, 61000);
    }, Math.max(0, ms - 60000));
  }
  function set(mix) { // { rain: 0.5, ... }
    Object.keys(layers).forEach((id) => { if (!(id in mix)) stop(id); });
    Object.entries(mix).forEach(([id, v]) => start(id, v));
  }
  // Soft bell for breathing phase changes.
  function chime(freq = 528, vol = 0.12) {
    ensure();
    const t = ctx.currentTime;
    [1, 2.01, 3.02].forEach((m, i) => {
      const o = ctx.createOscillator(); o.frequency.value = freq * m;
      const g = gainN(0);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol / (i + 1), t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 2.2 - i * 0.4);
      chain(o, g, ctx.destination); o.start(t); o.stop(t + 2.5);
    });
  }

  return { start, stop, stopAll, setVol, set, sleepTimer, chime, active, vol: (id) => layers[id]?.vol, onChange: (fn) => listeners.add(fn), ensure };
})();
