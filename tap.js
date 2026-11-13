/* Lull tap feedback, for every button, tile, chip, tab, switch and link (including ones drawn later).
   - Press: the element sinks a little and springs back on release (bigger things move less).
   - Ripple: moonlight spreads from the exact point you touched, clipped to the element's shape.
   - Sparks: main actions also throw a few firefly sparks.
   - Empty sky: a soft ring, like a drop on still water.
   Uses the Web Animations API on the `scale` property, so it never fights the app's own transforms. */
(function () {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const INTERACTIVE = 'button, a[href], [data-act], [role="button"], [role="radio"], label.switch, label.btn, .look-opt, select, summary';
  const SPARKY = '.btn.primary, .tile, .mood, .sos-card, .scene, .chip, .halt button, .choice, .check, .tabbar button, .look-opt, .round-btn, .ec, .lesson-row, .pattern';
  const SKIP = '.sheet-backdrop, input[type=range], input[type=text], input[type=time], textarea, .dial, .dial *';

  let layer;
  function host() {
    if (!layer) { layer = document.createElement('div'); layer.className = 'tap-layer'; layer.setAttribute('aria-hidden', 'true'); document.body.appendChild(layer); }
    return layer;
  }
  const look = () => (document.documentElement.classList.contains('hush') ? 'hush' : 'plum');
  const tone = (el) => {
    if (el.matches('.btn.primary, .btn.mint, .btn.peach, .avatar')) return 'rgba(255,255,255,.55)';
    if (el.closest('.sos-card, .tabbar .sos, .halt')) return look() === 'hush' ? 'rgba(238,158,124,.45)' : 'rgba(244,156,183,.45)';
    return look() === 'hush' ? 'rgba(243,222,180,.32)' : 'rgba(200,190,255,.32)';
  };

  function ripple(el, x, y) {
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const clip = document.createElement('div');
    clip.className = 'tap-clip';
    clip.style.cssText = `left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;border-radius:${getComputedStyle(el).borderRadius}`;
    const lx = x - r.left, ly = y - r.top;
    const d = 2 * Math.max(Math.hypot(lx, ly), Math.hypot(r.width - lx, ly), Math.hypot(lx, r.height - ly), Math.hypot(r.width - lx, r.height - ly));
    const w = document.createElement('span');
    w.className = 'tap-wave';
    w.style.cssText = `left:${lx - d / 2}px;top:${ly - d / 2}px;width:${d}px;height:${d}px;background:radial-gradient(circle, ${tone(el)} 0%, transparent 62%)`;
    clip.appendChild(w); host().appendChild(clip);
    const a = reduce
      ? w.animate([{ opacity: 0.8, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(1)' }], { duration: 260, easing: 'ease-out' })
      : w.animate([{ transform: 'scale(0)', opacity: 1 }, { transform: 'scale(1)', opacity: 0 }], { duration: 650, easing: 'cubic-bezier(.2,.8,.2,1)' });
    a.onfinish = () => clip.remove();
  }

  function sparks(x, y, warm) {
    if (reduce) return;
    const n = 7;
    for (let i = 0; i < n; i++) {
      const s = document.createElement('i');
      s.className = 'tap-spark';
      if (warm) s.style.setProperty('--c', warm);
      s.style.left = x + 'px'; s.style.top = y + 'px';
      host().appendChild(s);
      const ang = (i / n) * Math.PI * 2 + Math.random() * 0.6, dist = 18 + Math.random() * 22;
      const dx = Math.cos(ang) * dist, dy = Math.sin(ang) * dist - 6;
      s.animate([
        { transform: 'translate(-50%,-50%) scale(1)', opacity: 1 },
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(.2)`, opacity: 0 },
      ], { duration: 520 + Math.random() * 260, easing: 'cubic-bezier(.15,.7,.3,1)' }).onfinish = () => s.remove();
    }
  }

  function ring(x, y) {
    if (reduce || look() !== 'hush') return;
    const o = document.createElement('i');
    o.className = 'tap-ring'; o.style.left = x + 'px'; o.style.top = y + 'px';
    host().appendChild(o);
    o.animate([{ transform: 'translate(-50%,-50%) scale(.2)', opacity: 0.9 }, { transform: 'translate(-50%,-50%) scale(1)', opacity: 0 }],
      { duration: 900, easing: 'cubic-bezier(.2,.8,.2,1)' }).onfinish = () => o.remove();
  }

  // Press and spring back. Bigger targets move less so cards don't lurch.
  const pressed = new Map();
  function down(el) {
    if (reduce) return;
    const r = el.getBoundingClientRect();
    const depth = r.width * r.height > 40000 ? 0.985 : r.width * r.height > 9000 ? 0.965 : 0.92;
    const prev = pressed.get(el); if (prev) prev.cancel();
    const a = el.animate([{ scale: '1' }, { scale: String(depth) }], { duration: 120, easing: 'ease-out', fill: 'forwards' });
    pressed.set(el, a); el.dataset.tapDepth = depth;
  }
  function up(el) {
    const a = pressed.get(el); if (!a) return;
    pressed.delete(el);
    const d = Number(el.dataset.tapDepth) || 0.95, over = 1 + (1 - d) * 0.45;
    a.cancel();
    el.animate([{ scale: String(d) }, { scale: String(over), offset: 0.5 }, { scale: '1' }], { duration: 460, easing: 'cubic-bezier(.3,.9,.4,1)' });
  }
  const releaseAll = () => [...pressed.keys()].forEach(up);

  addEventListener('pointerdown', (e) => {
    if (e.button > 0) return;
    const el = e.target.closest(INTERACTIVE);
    if (el && !el.matches(SKIP) && !el.closest(SKIP) && !el.disabled) {
      down(el);
      ripple(el, e.clientX, e.clientY);
      if (el.matches(SPARKY)) sparks(e.clientX, e.clientY, el.closest('.sos-card, .tabbar .sos, .halt') ? (look() === 'hush' ? '#ee9e7c' : '#f49cb7') : null);
    } else if (!e.target.closest('input, textarea, select, .card, .sheet, .overlay, .tabbar')) {
      ring(e.clientX, e.clientY);
    }
  }, { passive: true });
  addEventListener('pointerup', releaseAll, { passive: true });
  addEventListener('pointercancel', releaseAll, { passive: true });
  addEventListener('blur', releaseAll);

  // Keyboard activation (Enter / Space) ripples from the centre.
  addEventListener('click', (e) => {
    if (e.detail !== 0) return;
    const el = e.target.closest && e.target.closest(INTERACTIVE);
    if (!el) return;
    const r = el.getBoundingClientRect();
    ripple(el, r.left + r.width / 2, r.top + r.height / 2);
  }, true);
})();
