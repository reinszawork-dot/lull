/* Lull scene art: hand-built, animated SVG illustrations for soundscapes, stories and the hero. */
window.Scenes = (() => {
  let n = 0;
  const rnd = (seed) => () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

  function stars(count, seed, maxY = 140, op = 0.9) {
    const r = rnd(seed); let s = '';
    for (let i = 0; i < count; i++) {
      const tw = r() < 0.35;
      s += `<circle cx="${(r() * 200).toFixed(1)}" cy="${(r() * maxY).toFixed(1)}" r="${(r() * 0.9 + 0.3).toFixed(2)}" fill="#fff" opacity="${(r() * op).toFixed(2)}" ${tw ? `class="anim-twinkle" style="animation-delay:-${(r() * 3).toFixed(1)}s"` : ''}/>`;
    }
    return s;
  }
  function pines(color, base, count, seed, h = 70, op = 1) {
    const r = rnd(seed); let s = `<g fill="${color}" opacity="${op}">`;
    for (let i = 0; i < count; i++) {
      const x = (i / (count - 1)) * 220 - 10 + (r() - 0.5) * 14, hh = h * (0.6 + r() * 0.6), w = hh * 0.32;
      s += `<path d="M${x} ${base - hh} L${x + w} ${base} L${x - w} ${base}Z"/><rect x="${x - 1.5}" y="${base - 2}" width="3" height="8"/>`;
    }
    return s + '</g>';
  }
  const grad = (id, stops, vertical = true) => `<linearGradient id="${id}" x1="0" y1="0" x2="${vertical ? 0 : 1}" y2="${vertical ? 1 : 0}">${stops.map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`).join('')}</linearGradient>`;
  const radial = (id, stops) => `<radialGradient id="${id}">${stops.map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`).join('')}</radialGradient>`;
  const wrap = (inner, defs = '') => `<svg viewBox="0 0 200 260" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs>${defs}</defs>${inner}</svg>`;
  const rainLines = (seed, op = 0.35, count = 60) => {
    const r = rnd(seed); let s = '';
    for (let i = 0; i < count; i++) { const x = r() * 220 - 10, y = r() * 300 - 40, l = 8 + r() * 10; s += `<line x1="${x}" y1="${y}" x2="${x - 2}" y2="${y + l}"/>`; }
    return `<g stroke="#dfe9ff" stroke-opacity="${op}" stroke-width=".8" stroke-linecap="round"><g class="anim-rain">${s}</g><g class="anim-rain" style="animation-delay:-.35s" transform="translate(6 20)">${s}</g></g>`;
  };

  const art = {
    fire(u) {
      const embers = Array.from({ length: 8 }, (_, i) => `<circle class="anim-ember" style="animation-delay:-${(i * 0.4).toFixed(1)}s" cx="${92 + (i * 7) % 18}" cy="${196 - (i % 3) * 4}" r="${1 + (i % 2) * 0.6}" fill="#ffc66b"/>`).join('');
      return wrap(`
        <rect width="200" height="260" fill="url(#sky${u})"/>${stars(25, 7, 90, 0.6)}
        ${pines('#2a1626', 200, 7, 11, 120, .9)}${pines('#160b16', 215, 6, 5, 150)}
        <ellipse cx="100" cy="232" rx="120" ry="34" fill="#1a0e14"/>
        <circle class="anim-glow" cx="100" cy="205" r="80" fill="url(#glow${u})"/>
        <g stroke="#3a2010" stroke-width="7" stroke-linecap="round"><line x1="76" y1="222" x2="124" y2="208"/><line x1="76" y1="208" x2="124" y2="222"/></g>
        <path class="anim-flame" d="M100 150 C 116 176 126 190 118 208 C 112 220 88 220 82 208 C 74 190 90 180 100 150Z" fill="url(#fl${u})"/>
        <path class="anim-flame f2" d="M100 172 C 110 188 114 198 110 208 C 106 216 94 216 90 208 C 86 198 94 188 100 172Z" fill="#ffe7a3"/>
        ${embers}`,
        grad(`sky${u}`, [[0, '#1b0f22'], [0.6, '#3b1a26'], [1, '#5a2420']]) + radial(`glow${u}`, [[0, '#ff9a3c', .75], [0.5, '#ff6a2a', .25], [1, '#ff6a2a', 0]]) + grad(`fl${u}`, [[0, '#ffd36b'], [0.6, '#ff8a2a'], [1, '#e8471f']]));
    },
    rain(u) {
      return wrap(`
        <rect width="200" height="260" fill="url(#sky${u})"/>
        ${pines('#4a6560', 190, 9, 3, 110, .5)}${pines('#2a3c3c', 215, 8, 9, 140, .85)}${pines('#142020', 245, 7, 21, 170)}
        <rect y="120" width="200" height="140" fill="url(#fog${u})"/>
        ${rainLines(4)}`,
        grad(`sky${u}`, [[0, '#2b3d42'], [1, '#6b8580']]) + grad(`fog${u}`, [[0, '#9fb8b0', 0], [1, '#9fb8b0', .35]]));
    },
    ocean(u) {
      return wrap(`
        <rect width="200" height="260" fill="url(#sky${u})"/>${stars(40, 13, 120)}
        <circle cx="140" cy="78" r="40" fill="url(#mg${u})"/><circle cx="140" cy="78" r="15" fill="#fff4e0"/>
        <rect y="160" width="200" height="100" fill="url(#sea${u})"/>
        <g fill="#fff4e0" opacity=".55"><rect x="128" y="168" width="24" height="2" rx="1"/><rect x="132" y="178" width="16" height="2" rx="1"/><rect x="124" y="190" width="32" height="2" rx="1" opacity=".6"/><rect x="134" y="204" width="12" height="2" rx="1" opacity=".5"/></g>
        <g fill="none" stroke="#b9b2ff" stroke-opacity=".35" stroke-width="1.4">
          <path class="anim-wave" d="M-30 214 q 15 -6 30 0 t 30 0 t 30 0 t 30 0 t 30 0 t 30 0 t 30 0 t 30 0"/>
          <path class="anim-wave w2" d="M-30 232 q 15 -6 30 0 t 30 0 t 30 0 t 30 0 t 30 0 t 30 0 t 30 0 t 30 0"/>
          <path class="anim-wave" style="animation-delay:-3s" d="M-30 250 q 15 -6 30 0 t 30 0 t 30 0 t 30 0 t 30 0 t 30 0 t 30 0 t 30 0"/></g>`,
        grad(`sky${u}`, [[0, '#15123a'], [0.7, '#4b2f6a'], [1, '#a2587a']]) + radial(`mg${u}`, [[0, '#ffe9c4', .5], [1, '#ffe9c4', 0]]) + grad(`sea${u}`, [[0, '#2c2458'], [1, '#0f0c24']]));
    },
    wind(u) {
      const clouds = [0, 1, 2].map((i) => `<g class="anim-cloud" style="animation-delay:-${i * 6}s;animation-duration:${16 + i * 5}s" fill="#fff" opacity="${0.14 + i * 0.05}"><ellipse cx="0" cy="${50 + i * 26}" rx="34" ry="9"/><ellipse cx="14" cy="${44 + i * 26}" rx="18" ry="9"/></g>`).join('');
      return wrap(`
        <rect width="200" height="260" fill="url(#sky${u})"/>${stars(18, 21, 80, .5)}${clouds}
        <path d="M0 175 Q 50 140 100 165 T 200 150 V260 H0Z" fill="#5a3f6e"/>
        <path d="M0 200 Q 60 170 120 195 T 200 185 V260 H0Z" fill="#3a2850"/>
        <path d="M0 225 Q 70 205 140 222 T 200 215 V260 H0Z" fill="#1f1530"/>`,
        grad(`sky${u}`, [[0, '#2a2048'], [0.7, '#8a5a82'], [1, '#e2a07c']]));
    },
    crickets(u) {
      const flies = Array.from({ length: 12 }, (_, i) => { const r = rnd(i + 3); return `<circle class="anim-blink" style="animation-delay:-${(r() * 2.4).toFixed(1)}s" cx="${(r() * 200).toFixed(0)}" cy="${(150 + r() * 90).toFixed(0)}" r="1.6" fill="#e6ff8a"/>`; }).join('');
      return wrap(`
        <rect width="200" height="260" fill="url(#sky${u})"/>${stars(70, 31, 170)}
        <circle cx="60" cy="150" r="46" fill="url(#mg${u})"/><circle cx="60" cy="150" r="22" fill="#ffe6b8"/>
        <path d="M0 210 Q 100 196 200 212 V260 H0Z" fill="#100a18"/>
        <g fill="#0b0712"><rect x="128" y="150" width="5" height="64" rx="2"/><path d="M130 160 l -22 -12 M131 158 l 20 -14" stroke="#0b0712" stroke-width="3"/>
          <ellipse cx="128" cy="146" rx="48" ry="9"/><ellipse cx="146" cy="140" rx="26" ry="6"/></g>
        ${flies}`,
        grad(`sky${u}`, [[0, '#0d1230'], [0.7, '#2a2050'], [1, '#4a2a50']]) + radial(`mg${u}`, [[0, '#ffd89a', .45], [1, '#ffd89a', 0]]));
    },
    aurora(u, hue = 0) {
      return wrap(`
        <rect width="200" height="260" fill="url(#sky${u})"/>${stars(60, 41 + hue, 200)}
        <g filter="url(#bl${u})" opacity=".85">
          <path class="anim-aurora" d="M-20 120 C 40 40 90 140 140 60 S 220 80 220 80 L 220 120 C 160 130 120 170 60 150 S 0 160 -20 160Z" fill="${hue ? '#c26bff' : '#7dffc4'}" opacity=".45"/>
          <path class="anim-aurora" style="animation-delay:-5s" d="M-20 90 C 30 50 80 110 130 50 S 220 40 220 40 L 220 70 C 150 100 110 130 60 110 S 0 120 -20 120Z" fill="${hue ? '#ff8fd0' : '#8a7dff'}" opacity=".4"/></g>
        <path d="M0 210 L 40 170 L 70 196 L 110 150 L 150 192 L 175 175 L 200 195 V260 H0Z" fill="#120d22"/>
        <path d="M0 235 L 50 205 L 100 228 L 150 210 L 200 230 V260 H0Z" fill="#0a0714"/>`,
        grad(`sky${u}`, [[0, '#070614'], [1, '#1e1640']]) + `<filter id="bl${u}"><feGaussianBlur stdDeviation="6"/></filter>`);
    },
    lanterns(u) {
      const ls = Array.from({ length: 9 }, (_, i) => { const r = rnd(i * 7 + 2); const x = r() * 180 + 10, y = 160 + r() * 90, s = 0.6 + r() * 0.7;
        return `<g class="anim-rise" style="animation-delay:-${(r() * 9).toFixed(1)}s;animation-duration:${(8 + r() * 5).toFixed(1)}s"><g transform="translate(${x.toFixed(0)} ${y.toFixed(0)}) scale(${s.toFixed(2)})"><circle r="16" fill="url(#lg${u})"/><rect x="-6" y="-8" width="12" height="15" rx="4" fill="#ff8a3a"/><rect x="-6" y="-8" width="12" height="4" rx="2" fill="#c44a1a"/></g></g>`; }).join('');
      const bokeh = Array.from({ length: 14 }, (_, i) => { const r = rnd(i + 50); return `<circle cx="${(r() * 200).toFixed(0)}" cy="${(r() * 260).toFixed(0)}" r="${(3 + r() * 8).toFixed(1)}" fill="#ff7a5a" opacity="${(0.08 + r() * 0.2).toFixed(2)}"/>`; }).join('');
      return wrap(`<rect width="200" height="260" fill="url(#sky${u})"/>${bokeh}${ls}`,
        grad(`sky${u}`, [[0, '#1a0c1e'], [0.6, '#3e1626'], [1, '#6a2a2a']]) + radial(`lg${u}`, [[0, '#ffb05a', .7], [1, '#ff6a2a', 0]]));
    },
    train(u) {
      const win = Array.from({ length: 5 }, (_, i) => `<rect x="${8 + i * 14}" y="-14" width="8" height="6" rx="1" fill="#ffd27a"/>`).join('');
      return wrap(`
        <rect width="200" height="260" fill="url(#sky${u})"/>${stars(40, 61, 130)}
        <circle cx="150" cy="70" r="12" fill="#fff1d8"/><circle cx="150" cy="70" r="30" fill="#fff1d8" opacity=".08"/>
        <path d="M0 180 Q 60 150 120 172 T 200 160 V260 H0Z" fill="#2d2148"/>
        <rect y="200" width="200" height="60" fill="#160f26"/>
        <line x1="0" y1="203" x2="200" y2="203" stroke="#3a2c58" stroke-width="2"/>
        <g class="anim-train"><g transform="translate(0 202)">
          <rect x="0" y="-20" width="80" height="18" rx="4" fill="#0c0816"/>${win}
          <rect x="84" y="-20" width="80" height="18" rx="4" fill="#0c0816"/><g transform="translate(84 0)">${win}</g>
          <rect x="168" y="-24" width="40" height="22" rx="6" fill="#0c0816"/><circle cx="204" cy="-12" r="2.5" fill="#fff6c8"/></g></g>
        <g fill="#ffd27a" opacity=".12"><rect y="206" width="200" height="6"/></g>`,
        grad(`sky${u}`, [[0, '#120f30'], [0.75, '#3c2a5e'], [1, '#7a4a6e']]));
    },
    lighthouse(u) {
      return wrap(`
        <rect width="200" height="260" fill="url(#sky${u})"/>${stars(50, 71, 150)}
        <g class="anim-beam" style="transform-origin:70px 96px"><path d="M70 96 L 230 60 L 230 132Z" fill="url(#bm${u})"/></g>
        <rect y="190" width="200" height="70" fill="url(#sea${u})"/>
        <path d="M30 196 Q 50 170 90 176 Q 110 182 118 196Z" fill="#0d0a18"/>
        <path d="M62 180 L 66 104 L 74 104 L 78 180Z" fill="#e8e2f0"/>
        <path d="M63.2 158 L 76.8 158 L 77.4 168 L 62.6 168Z M64.4 134 L 75.6 134 L 76.2 144 L 63.8 144Z M65.4 112 L 74.6 112 L 75 120 L 65 120Z" fill="#c4486a"/>
        <rect x="63" y="90" width="14" height="14" rx="2" fill="#2a1f40"/><circle cx="70" cy="96" r="4.5" fill="#fff3c4"/><circle class="anim-glow" cx="70" cy="96" r="14" fill="#fff3c4" opacity=".25"/>
        <path d="M60 90 L 70 82 L 80 90Z" fill="#c4486a"/>
        <g fill="none" stroke="#a9a0ff" stroke-opacity=".3"><path class="anim-wave" d="M-30 222 q 15 -5 30 0 t 30 0 t 30 0 t 30 0 t 30 0 t 30 0 t 30 0 t 30 0"/><path class="anim-wave w2" d="M-30 240 q 15 -5 30 0 t 30 0 t 30 0 t 30 0 t 30 0 t 30 0 t 30 0 t 30 0"/></g>`,
        grad(`sky${u}`, [[0, '#0e1030'], [1, '#33295e']]) + grad(`bm${u}`, [[0, '#fff3c4', .55], [1, '#fff3c4', 0]], false) + grad(`sea${u}`, [[0, '#231d48'], [1, '#0b0920']]));
    },
    karoo(u) {
      return wrap(`
        <rect width="200" height="260" fill="url(#sky${u})"/>
        <path d="M0 185 L 30 160 L 70 160 L 92 182 L 130 176 L 150 156 L 185 156 L 200 170 V260 H0Z" fill="#4a3a52"/>
        <rect y="196" width="200" height="64" fill="#2a1f2e"/>
        <g transform="translate(40 168)"><path d="M0 28 V 10 L 20 0 L 40 10 V28Z" fill="#1a1220"/><rect x="0" y="8" width="40" height="3" fill="#6a5a6e"/><rect x="8" y="14" width="8" height="8" fill="#ffcb6b"/><rect x="24" y="14" width="8" height="8" fill="#ffcb6b" opacity=".7"/><circle cx="12" cy="18" r="16" fill="#ffcb6b" opacity=".08"/></g>
        <g transform="translate(150 150)" stroke="#1a1220" stroke-width="2"><line x1="0" y1="0" x2="-8" y2="48"/><line x1="0" y1="0" x2="8" y2="48"/><g class="anim-glow" style="animation-duration:6s"><line x1="-12" y1="-6" x2="12" y2="6"/><line x1="-12" y1="6" x2="12" y2="-6"/><line x1="0" y1="-13" x2="0" y2="13"/></g></g>
        ${rainLines(9, .28, 45)}`,
        grad(`sky${u}`, [[0, '#3a3450'], [0.7, '#7a6a80'], [1, '#b08a78']]));
    },
  };
  const ALIAS = { brown: 'aurora', drone: 'lanterns', bodyscan: 'aurora', karoo: 'karoo', cabin: 'fire' };
  function scene(kind, hue) { n++; const k = art[kind] ? kind : ALIAS[kind] || 'aurora'; return art[k](`s${n}`, hue); }

  // Floating balance stones for the hero.
  function hero() {
    return `<svg class="hero-art" viewBox="0 0 210 190" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs>
      <radialGradient id="hs1" cx="40%" cy="30%"><stop offset="0" stop-color="#5a5466"/><stop offset=".6" stop-color="#25212c"/><stop offset="1" stop-color="#0e0c12"/></radialGradient>
      <radialGradient id="hs2" cx="40%" cy="25%"><stop offset="0" stop-color="#fff0a8"/><stop offset=".45" stop-color="#e8c25a"/><stop offset="1" stop-color="#9a6e1e"/></radialGradient>
      <radialGradient id="hs3" cx="35%" cy="30%"><stop offset="0" stop-color="#e2c8ff"/><stop offset="1" stop-color="#7a4ad0"/></radialGradient>
      <linearGradient id="hc1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#9a96a8"/></linearGradient>
      <linearGradient id="hc2" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d8d4e4"/><stop offset="1" stop-color="#4a4658"/></linearGradient>
      <radialGradient id="hgl"><stop offset="0" stop-color="#9c8cf2" stop-opacity=".45"/><stop offset="1" stop-color="#9c8cf2" stop-opacity="0"/></radialGradient></defs>
      <ellipse cx="105" cy="100" rx="100" ry="80" fill="url(#hgl)"/>
      <ellipse cx="102" cy="150" rx="26" ry="20" fill="url(#hs1)"/>
      <ellipse cx="104" cy="118" rx="54" ry="17" fill="url(#hs2)"/>
      <ellipse cx="96" cy="112" rx="34" ry="5" fill="#fff6c8" opacity=".35"/>
      <ellipse cx="136" cy="96" rx="11" ry="8" fill="url(#hs3)"/>
      <g transform="translate(92 70)">
        <path d="M-26 6 L -12 -26 L 16 -30 L 30 -4 L 18 24 L -14 26Z" fill="url(#hc2)"/>
        <path d="M-12 -26 L 16 -30 L 4 -6Z" fill="#ffffff" opacity=".9"/>
        <path d="M-26 6 L -12 -26 L 4 -6 L -8 14Z" fill="url(#hc1)" opacity=".85"/>
        <path d="M4 -6 L 30 -4 L 18 24 L -8 14Z" fill="#8a86a0" opacity=".85"/>
        <path d="M-8 14 L 18 24 L -14 26 L -26 6Z" fill="#5a566a" opacity=".9"/>
        <path d="M16 -30 L 30 -4 L 4 -6Z" fill="#cfcbe0"/></g>
      <g fill="#fff"><circle class="anim-twinkle" cx="40" cy="40" r="1.6"/><circle class="anim-twinkle" style="animation-delay:-1s" cx="170" cy="58" r="1.3"/><circle class="anim-twinkle" style="animation-delay:-2s" cx="158" cy="150" r="1.1"/><circle class="anim-twinkle" style="animation-delay:-.5s" cx="52" cy="128" r="1"/></g>
    </svg>`;
  }
  return { scene, hero };
})();
