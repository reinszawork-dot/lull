/* Lull "Hush" look: moonlit hills behind frosted glass.
   - The sky follows the clock (dawn, day, dusk, night).
   - The moon shows tonight's real phase, worked out from the date.
   - Fireflies drift over the hills; fog bands slide between them.
   - A glass pill slides between tabs.
   "Plum night" (the original look) stays available in Settings. */
(function () {
  const root = document.documentElement;
  const KEY = 'lull-look';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- look ---------- */
  const get = () => { try { return localStorage.getItem(KEY) === 'plum' ? 'plum' : 'hush'; } catch (e) { return 'hush'; } };
  const PHASE_COLOR = { dawn: '#2a3149', day: '#2d4761', dusk: '#1f2239', night: '#111923' };
  function themeColor() {
    const m = document.querySelector('meta[name=theme-color]');
    if (m) m.setAttribute('content', get() === 'plum' ? '#120d1a' : PHASE_COLOR[root.dataset.phase] || '#111923');
  }
  function apply(look) {
    root.classList.toggle('hush', look === 'hush');
    root.dataset.look = look;
    themeColor();
  }
  window.LullLook = {
    get,
    set(look) { try { localStorage.setItem(KEY, look); } catch (e) {} apply(look); },
  };

  /* ---------- time of day ---------- */
  const forced = new URLSearchParams(location.search).get('phase');
  function phaseOf(h) { return h >= 5 && h < 8 ? 'dawn' : h >= 8 && h < 17 ? 'day' : h >= 17 && h < 20 ? 'dusk' : 'night'; }
  function setPhase() {
    root.dataset.phase = /^(dawn|day|dusk|night)$/.test(forced || '') ? forced : phaseOf(new Date().getHours());
    themeColor();
  }
  setPhase();
  setInterval(setPhase, 5 * 60 * 1000);
  apply(get());

  /* ---------- moon phase (0 = new, 0.5 = full) ---------- */
  function moonPhase(date) {
    const SYNODIC = 29.530588853;
    const ref = Date.UTC(2000, 0, 6, 18, 14); // a known new moon
    const days = (date.getTime() - ref) / 86400000;
    return (((days % SYNODIC) + SYNODIC) % SYNODIC) / SYNODIC;
  }
  // Lit part of the disc: outer limb + terminator ellipse.
  function moonPath(p, r, cx, cy) {
    const waxing = p < 0.5;
    const k = Math.cos(2 * Math.PI * p);
    const rx = Math.max(0.01, Math.abs(k) * r);
    const limb = waxing ? 1 : 0;
    const term = waxing ? (k > 0 ? 0 : 1) : (k > 0 ? 1 : 0);
    return `M${cx} ${cy - r} A${r} ${r} 0 0 ${limb} ${cx} ${cy + r} A${rx} ${r} 0 0 ${term} ${cx} ${cy - r}Z`;
  }
  // South of the equator the moon looks mirrored (a waxing moon is lit on the left).
  function southern() {
    let tz = '';
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}
    return /^(Australia|Antarctica)\//.test(tz) || /^America\/Argentina/.test(tz) || [
      'Africa/Johannesburg', 'Africa/Maseru', 'Africa/Mbabane', 'Africa/Windhoek', 'Africa/Gaborone', 'Africa/Maputo',
      'Africa/Harare', 'Africa/Lusaka', 'Africa/Blantyre', 'Indian/Mauritius', 'Indian/Reunion', 'Pacific/Auckland',
      'Pacific/Fiji', 'America/Sao_Paulo', 'America/Santiago', 'America/Montevideo', 'America/Asuncion', 'America/Lima',
    ].includes(tz);
  }
  const PHASE_NAMES = ['New moon', 'Waxing crescent', 'First quarter', 'Waxing gibbous', 'Full moon', 'Waning gibbous', 'Last quarter', 'Waning crescent'];

  /* ---------- the scene ---------- */
  function build() {
    const sky = document.querySelector('.sky');
    if (!sky || sky.querySelector('.hush-sky')) return;
    const p = moonPhase(new Date());
    const name = PHASE_NAMES[Math.round(p * 8) % 8];
    const wrap = document.createElement('div');
    wrap.className = 'hush-sky';
    wrap.innerHTML = `
      <div class="hs-grad"></div>
      <div class="hs-moon" title="${name}">
        <span class="m-halo"></span>
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <defs>
            <radialGradient id="hsMoonLit" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#fffaf0"/><stop offset=".6" stop-color="#f3e2bd"/><stop offset="1" stop-color="#ddbf8a"/></radialGradient>
          </defs>
          <g${southern() ? ' transform="translate(100 0) scale(-1 1)"' : ''}>
          <circle cx="50" cy="50" r="38" class="m-dark"/>
          <path d="${moonPath(p, 38, 50, 50)}" fill="url(#hsMoonLit)"/>
          <circle cx="38" cy="40" r="5" class="m-crater"/><circle cx="60" cy="62" r="7" class="m-crater"/><circle cx="62" cy="34" r="3.5" class="m-crater"/></g>
        </svg>
      </div>
      <canvas class="hs-flies"></canvas>
      <div class="hs-fog f1"></div>
      <svg class="hs-hills" viewBox="0 0 400 160" preserveAspectRatio="none" aria-hidden="true">
        <path class="h1" d="M0 70 C 40 52, 70 50, 110 62 S 180 40, 230 52 S 320 34, 360 50 S 390 56, 400 52 V160 H0Z"/>
        <path class="h2" d="M0 98 C 50 80, 90 84, 140 94 S 220 76, 270 88 S 350 92, 400 80 V160 H0Z"/>
        <path class="h3" d="M0 128 C 60 112, 110 118, 170 124 S 260 108, 320 118 S 380 122, 400 116 V160 H0Z"/>
      </svg>
      <div class="hs-fog f2"></div>`;
    sky.appendChild(wrap);
    root.dataset.moon = name;
    flies(wrap.querySelector('.hs-flies'));
  }

  /* ---------- fireflies + a few stars ---------- */
  function flies(c) {
    const g = c.getContext('2d');
    // Fireflies fly on their own layer above the app so they can follow you over the cards.
    const top = document.createElement('canvas');
    top.className = 'hs-top'; top.setAttribute('aria-hidden', 'true');
    document.body.appendChild(top);
    const gt = top.getContext('2d');
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let W = 0, H = 0, bugs = [], stars = [];
    const fit = () => {
      W = c.width = top.width = innerWidth * dpr; H = c.height = top.height = innerHeight * dpr;
      const n = Math.min(26, Math.round((innerWidth * innerHeight) / 32000) + 6);
      bugs = Array.from({ length: n }, () => ({
        x: Math.random() * W, y: H * (0.45 + Math.random() * 0.5), vx: 0, vy: 0,
        a: Math.random() * 6.28, s: (0.15 + Math.random() * 0.35) * dpr,
        p: Math.random() * 6.28, f: 0.6 + Math.random() * 1.2, r: (1.2 + Math.random() * 1.6) * dpr,
        // where it circles when following the pointer
        o: Math.random() * 6.28, R: (24 + Math.random() * 90) * dpr, w: (Math.random() < 0.5 ? -1 : 1) * (0.4 + Math.random() * 0.6), k: 0.6 + Math.random() * 0.8,
      }));
      stars = Array.from({ length: Math.round((innerWidth * innerHeight) / 14000) }, () => ({
        x: Math.random() * W, y: Math.random() * H * 0.5, r: (Math.random() * 0.9 + 0.3) * dpr, p: Math.random() * 6.28, s: 0.4 + Math.random(), d: 0.3 + Math.random() * 0.7,
      }));
    };
    fit(); addEventListener('resize', fit);

    /* Pointer / finger tracking. Mouse: follows the cursor. Phone: follows a tap, and the
       finger while sliding up or down; the swipe also sweeps the swarm along. */
    const P = { x: 0, y: 0, until: 0, sx: 0, sy: 0, swipe: 0 };
    let lastTouchY = null;
    const at = (cx, cy, hold) => { P.x = cx * dpr; P.y = cy * dpr; P.until = performance.now() + hold; };
    addEventListener('mousemove', (e) => at(e.clientX, e.clientY, 2500), { passive: true });
    addEventListener('mouseleave', () => { P.until = 0; });
    document.addEventListener('mouseleave', () => { P.until = 0; });
    addEventListener('pointerdown', (e) => at(e.clientX, e.clientY, e.pointerType === 'mouse' ? 2500 : 1800), { passive: true });
    addEventListener('touchstart', (e) => { const t = e.touches[0]; if (t) { at(t.clientX, t.clientY, 1800); lastTouchY = t.clientY; } }, { passive: true });
    addEventListener('touchmove', (e) => {
      const t = e.touches[0]; if (!t) return;
      if (lastTouchY != null) P.swipe += (t.clientY - lastTouchY) * dpr; // finger direction
      lastTouchY = t.clientY;
      at(t.clientX, t.clientY, 1800);
    }, { passive: true });
    addEventListener('touchend', () => { lastTouchY = null; }, { passive: true });
    // Scrolling with a wheel or trackpad nudges the swarm the same way the page moves.
    let lastScroll = scrollY;
    addEventListener('scroll', () => { const d = scrollY - lastScroll; lastScroll = scrollY; if (lastTouchY == null) P.swipe -= d * dpr * 0.6; }, { passive: true });

    function draw(t) {
      g.clearRect(0, 0, W, H); gt.clearRect(0, 0, W, H);
      if (!root.classList.contains('hush')) return;
      const ph = root.dataset.phase;
      const now = performance.now();
      const follow = !reduce && now < P.until;
      // eased "look" point for star parallax and the soft light under the pointer
      const tgx = follow ? P.x : W / 2, tgy = follow ? P.y : H / 2;
      P.sx += (tgx - P.sx) * 0.05; P.sy += (tgy - P.sy) * 0.05;
      const sweep = P.swipe; P.swipe *= 0.9;
      const lean = { x: (P.sx - W / 2) / W, y: (P.sy - H / 2) / H };

      const starA = ph === 'night' ? 1 : ph === 'dusk' || ph === 'dawn' ? 0.45 : 0;
      if (starA) for (const s of stars) {
        const x = s.x + lean.x * 26 * dpr * s.d, y = s.y + lean.y * 18 * dpr * s.d;
        const near = follow ? Math.max(0, 1 - Math.hypot(x - P.x, y - P.y) / (140 * dpr)) : 0;
        g.globalAlpha = Math.min(1, starA * (0.25 + 0.55 * Math.sin(s.p + (t / 1000) * s.s) ** 2) + near * 0.8);
        g.beginPath(); g.arc(x, y, s.r * (1 + near * 0.9), 0, 6.28); g.fillStyle = '#f4f1ea'; g.fill();
      }
      const glow = ph === 'day' ? 0.35 : 1;
      if (follow) { // faint moonlight where you point
        const fade = Math.min(1, (P.until - now) / 600);
        const L = 120 * dpr, lg = g.createRadialGradient(P.sx, P.sy, 0, P.sx, P.sy, L);
        lg.addColorStop(0, `rgba(243,222,180,${0.10 * fade * glow})`); lg.addColorStop(1, 'rgba(243,222,180,0)');
        g.fillStyle = lg; g.beginPath(); g.arc(P.sx, P.sy, L, 0, 6.28); g.fill();
      }
      for (const b of bugs) {
        if (!reduce) {
          if (follow) {
            // circle the pointer, each at its own distance and speed
            const ang = b.o + (t / 1000) * b.w;
            const tx = P.x + Math.cos(ang) * b.R, ty = P.y + Math.sin(ang) * b.R * 0.75;
            b.vx += (tx - b.x) * 0.0024 * b.k; b.vy += (ty - b.y) * 0.0024 * b.k;
          } else {
            // wander back down over the hills
            b.a += Math.sin(t / 2400 + b.p) * 0.02;
            b.vx += Math.cos(b.a) * b.s * 0.06; b.vy += Math.sin(b.a) * b.s * 0.04;
            if (b.y < H * 0.4) b.vy += 0.02 * dpr;
          }
          b.vy += sweep * 0.0009 * b.k; // swipe drags them along
          b.vx *= 0.94; b.vy *= 0.94;
          const sp = Math.hypot(b.vx, b.vy), max = 7 * dpr;
          if (sp > max) { b.vx *= max / sp; b.vy *= max / sp; }
          b.x += b.vx; b.y += b.vy;
          if (b.x < -30) b.x = W + 30; if (b.x > W + 30) b.x = -30;
          if (b.y < -30) b.y = -30; if (b.y > H + 30) b.y = H + 30;
        }
        const pulse = Math.max(0, Math.sin(t / 900 * b.f + b.p));
        const a = glow * (0.15 + 0.85 * pulse * pulse);
        const R = b.r * 7;
        const gr = gt.createRadialGradient(b.x, b.y, 0, b.x, b.y, R);
        gr.addColorStop(0, `rgba(255,224,160,${0.9 * a})`); gr.addColorStop(0.25, `rgba(255,196,120,${0.35 * a})`); gr.addColorStop(1, 'rgba(255,190,110,0)');
        gt.fillStyle = gr; gt.beginPath(); gt.arc(b.x, b.y, R, 0, 6.28); gt.fill();
      }
      g.globalAlpha = 1;
    }
    function loop(t) { if (!document.hidden) draw(t); requestAnimationFrame(loop); }
    if (reduce) { draw(0); addEventListener('resize', () => draw(0)); } else requestAnimationFrame(loop);
  }

  /* ---------- sliding tab pill ---------- */
  function tabPill() {
    const bar = document.getElementById('tabbar');
    if (!bar || bar.querySelector('.tab-ind')) return;
    const ind = document.createElement('span');
    ind.className = 'tab-ind'; ind.setAttribute('aria-hidden', 'true');
    bar.prepend(ind);
    const place = () => {
      const a = bar.querySelector('button.active');
      if (!a) { ind.style.opacity = '0'; return; }
      ind.style.opacity = '1';
      ind.style.transform = `translateX(${a.offsetLeft}px)`;
      ind.style.width = a.offsetWidth + 'px';
    };
    new MutationObserver(place).observe(bar, { subtree: true, attributes: true, attributeFilter: ['class'] });
    addEventListener('resize', place);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(place);
    place();
  }

  /* ---------- scroll depth ---------- */
  if (!reduce) {
    let q = false;
    addEventListener('scroll', () => {
      if (q) return; q = true;
      requestAnimationFrame(() => { root.style.setProperty('--sy', Math.min(scrollY, 2000)); q = false; });
    }, { passive: true });
  }

  const start = () => { build(); tabPill(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
