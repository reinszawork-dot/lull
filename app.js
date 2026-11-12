/* Lull: calm, cravings & sleep. Vanilla JS PWA, everything stored on-device. */
(() => {
'use strict';

/* ---------- helpers ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = (n) => String(n).padStart(2, '0');
const dk = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const nightKey = () => { const d = new Date(); if (d.getHours() < 5) d.setDate(d.getDate() - 1); return dk(d); };
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const toMin = (t) => { const [h, m] = (t || '0:0').split(':').map(Number); return h * 60 + m; };
const fmtDur = (mins) => { const h = Math.floor(mins / 60), m = Math.round(mins % 60); return h ? `${h}h ${pad(m)}m` : `${m}m`; };
const fmtTime = (ts) => new Date(ts).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit', hour12: false });
const fmtDay = (ts) => new Date(ts).toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short' });
const sleepHours = (s) => { let d = toMin(s.wake) - toMin(s.bed); if (d <= 0) d += 1440; return d / 60; };
const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d; };
const MOODS = ['😣', '😕', '😐', '🙂', '😌'];
const MOOD_NAMES = ['Rough', 'Low', 'Okay', 'Good', 'Great'];

/* ---------- state ---------- */
const KEY = 'lull-v1';
const defaults = () => ({
  onboarded: false, name: '', goals: [], bedtime: '22:30', wake: '06:30', melody: 'Rainy cabin',
  settings: { chime: true, haptics: true, voice: true, voiceName: '', nudge: true },
  checkins: [], cravings: [], sessions: [], sleep: [], lessonsDone: [], winddown: {}, mixes: [],
});
let S;
try { S = Object.assign(defaults(), JSON.parse(localStorage.getItem(KEY) || '{}')); } catch { S = defaults(); }
S.settings = Object.assign(defaults().settings, S.settings);
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch {} };

const buzz = (p = 20) => { if (S.settings.haptics && navigator.vibrate) navigator.vibrate(p); };
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 2200); }
/* ---------- NextWave Pro ---------- */
NextWavePro.init({
  app: 'lull', name: 'Lull Pro', price: 'R79 once-off',
  buyUrl: 'https://payhip.com', // placeholder until the Payhip product exists
  features: ['3 extra sleep stories', 'Signature soundscape mixes, and save your own', 'Steady: a 7-day course after Unhook', '90-day insights on sleep, mood and cravings'],
  accent: '#7b68e0',
});
const isPro = () => NextWavePro.isPro();
const proBadge = () => (isPro() ? '' : '<span class="pro-badge">Pro</span>');
window.addEventListener('nextwave-pro-change', () => { if ($('#overlay').hidden) rerender(); if (!$('#sheet').hidden && $('#proRow')) openSettings(); });
const allStories = () => [...LULL.stories, ...LULL.proStories];
const allLessons = () => [...LULL.lessons, ...LULL.steady];
const isProStory = (id) => LULL.proStories.some((s) => s.id === id);
const isSteady = (id) => LULL.steady.some((l) => l.id === id);

function logSession(kind, ref, mins, extra = {}) { S.sessions.push({ id: uid(), ts: Date.now(), kind, ref, mins: Math.round(mins * 10) / 10, ...extra }); save(); }

/* ---------- derived stats ---------- */
function activeDays() {
  const set = new Set();
  [...S.checkins, ...S.cravings, ...S.sessions].forEach((x) => set.add(dk(new Date(x.ts))));
  S.sleep.forEach((x) => set.add(x.date));
  return set;
}
function streak() {
  const set = activeDays(); let n = 0; const d = new Date();
  if (!set.has(dk(d))) d.setDate(d.getDate() - 1);
  while (set.has(dk(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
const mindfulMins = () => Math.round(S.sessions.reduce((a, s) => a + (s.mins || 0), 0));
const surfed = () => S.cravings.filter((c) => c.outcome !== 'ate').length;
const todayCheckin = () => S.checkins.filter((c) => dk(new Date(c.ts)) === dk()).pop();
const lastSleep = () => S.sleep.slice().sort((a, b) => a.date.localeCompare(b.date)).pop();

/* ---------- navigation ---------- */
let tab = 'today';
const views = { today: renderToday, breathe: renderBreathe, sleep: renderSleep, journey: renderJourney };
function go(t) {
  if (t === 'pause') return openPause();
  tab = t;
  $$('#tabbar button').forEach((b) => b.classList.toggle('active', b.dataset.tab === t));
  const v = $('#view');
  v.style.animation = 'none'; v.offsetHeight; v.style.animation = '';
  v.innerHTML = views[t]();
  window.scrollTo({ top: 0 });
  afterRender();
}
const rerender = () => { const y = window.scrollY; $('#view').innerHTML = views[tab](); afterRender(); window.scrollTo({ top: y }); };
function afterRender() {
  $('#bedPillText').textContent = S.bedtime;
  $('#avatarText').textContent = (S.name || 'Lull')[0].toUpperCase();
  if (tab === 'sleep') bindDial();
  // animate bars in from zero
  requestAnimationFrame(() => $$('[data-h]').forEach((el) => (el.style.height = el.dataset.h)));
  requestAnimationFrame(() => $$('[data-w]').forEach((el) => (el.style.width = el.dataset.w)));
}
$('#tabbar').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { buzz(10); go(b.dataset.tab); } });

/* ---------- action dispatcher (data-act="name:arg:arg") ---------- */
const actions = {
  pause: () => openPause(),
  surf: () => openPause({ jump: 'surf' }),
  mindful: () => openMindful(),
  breath: (id, m) => openBreath(id, Number(m) || 3),
  story: (id) => (isProStory(id) ? NextWavePro.gate('More sleep stories', () => openStory(id)) : openStory(id)),
  lesson: (id) => (isSteady(id) ? NextWavePro.gate('The Steady course', () => openLesson(id)) : openLesson(id)),
  mix: (name) => NextWavePro.gate('Signature mixes', () => applyMix(LULL.proMixes[name], name)),
  savemix: () => NextWavePro.gate('Saving your own mixes', saveMix),
  mymix: (i) => { const m = S.mixes[Number(i)]; if (m) applyMix(m.mix, m.name); },
  delmix: (i) => { S.mixes.splice(Number(i), 1); save(); rerender(); toast('Mix removed'); },
  insights90: () => NextWavePro.gate('90-day insights', openInsights90),
  pro: () => NextWavePro.open(),
  tab: (t) => go(t),
  checkin: (m) => openCheckin(Number(m)),
  sleeplog: () => openSleepLog(),
  dump: () => openDump(),
  settings: () => openSettings(),
  preset: (name) => applyPreset(name),
  timer: (m) => setTimer(Number(m)),
  stopsound: () => { Sound.stopAll(); setTimer(0); rerender(); },
  wd: (id) => toggleWind(id),
};
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const [name, ...args] = el.dataset.act.split(':');
  if (actions[name]) { buzz(10); actions[name](...args); }
});

/* ---------- sheet & overlay ---------- */
function openSheet(html, onMount) {
  $('#sheetBody').innerHTML = html;
  $('#sheet').hidden = false; $('#sheetBackdrop').hidden = false;
  onMount && onMount($('#sheetBody'));
}
function closeSheet() { $('#sheet').hidden = true; $('#sheetBackdrop').hidden = true; }
$('#sheetBackdrop').addEventListener('click', closeSheet);

let ovCleanup = null;
function openOverlay(html, cleanup) {
  if (ovCleanup) ovCleanup();
  const o = $('#overlay');
  o.innerHTML = html; o.hidden = false; o.scrollTop = 0;
  document.body.style.overflow = 'hidden';
  ovCleanup = cleanup || null;
  return o;
}
function closeOverlay() {
  if (ovCleanup) { const c = ovCleanup; ovCleanup = null; c(); }
  $('#overlay').hidden = true; $('#overlay').innerHTML = '';
  document.body.style.overflow = '';
  rerender();
}
const closeBtn = (label = 'Close') => `<button class="icon-btn" data-close aria-label="${label}"><svg viewBox="0 0 24 24" width="20" height="20"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg></button>`;
$('#overlay').addEventListener('click', (e) => { if (e.target.closest('[data-close]')) closeOverlay(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { if (!$('#sheet').hidden) closeSheet(); else if (!$('#overlay').hidden) closeOverlay(); } });

/* ================================================================
   TODAY
   ================================================================ */
function greeting() { const h = new Date().getHours(); return h < 5 ? 'Still awake' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; }
function nowTiles() {
  const h = new Date().getHours();
  const T = (emoji, title, sub, color, act) => ({ emoji, title, sub, color, act });
  if (h >= 5 && h < 12) return [T('🌅', 'Morning reset', 'Even breath · 3 min', '#ffc59e', 'breath:coherent:3'), T('📖', 'Today\'s lesson', nextLesson() ? nextLesson().title : 'Course complete', '#a99cff', nextLesson() ? `lesson:${nextLesson().id}` : 'tab:journey')];
  if (h >= 12 && h < 17) return [T('⚡', 'Afternoon slump?', 'Quick reset · 1 min', '#7fe0c3', 'breath:sigh:1'), T('🌊', 'Practise surfing', '90 sec urge surf', '#ff9fb8', 'surf')];
  if (h >= 17 && h < 21) return [T('🫧', 'Shake off the day', 'Box breathing · 5 min', '#a99cff', 'breath:box:5'), T('🍽️', 'Eat mindfully', 'Slow down supper', '#ffc59e', 'mindful')];
  return [T('🌙', 'Wind down', 'Your night routine', '#8fb6ff', 'tab:sleep'), T('💤', '4·7·8 in bed', 'Sleep breath · 5 min', '#a99cff', 'breath:478:5')];
}
const nextLesson = () => LULL.lessons.find((l) => !S.lessonsDone.includes(l.id));
function steadyCard() {
  const done = LULL.steady.filter((l) => S.lessonsDone.includes(l.id)).length;
  const nx = LULL.steady.find((l) => !S.lessonsDone.includes(l.id));
  return `<div class="section-title"><h3>Steady · after Unhook ${proBadge()}</h3><span class="faint">${done}/${LULL.steady.length}</span></div>
  <div class="card">
    <p class="muted small">Seven more short lessons for the hard weeks: high-risk times, "if, then" plans, social eating and a steady sleep routine.</p>
    <div class="progress" style="margin-top:10px"><i style="width:0" data-w="${(done / LULL.steady.length) * 100}%"></i></div>
    ${nx ? `<button class="lesson-row next" data-act="lesson:${nx.id}" style="margin-top:6px"><span class="lesson-num">${LULL.steady.indexOf(nx) + 1}</span><div><b>${esc(nx.title)}</b><br><small>${done ? 'Up next' : 'Start here'} · ${nx.mins} min read</small></div><span class="link">${isPro() ? 'Start' : 'Unlock'}</span></button>`
    : `<p style="margin-top:12px">You finished Steady. Your plan is yours to keep.</p>`}
    ${isPro() ? `<details style="margin-top:4px"><summary class="link" style="list-style:none;padding:8px 0">All Steady lessons</summary>
      ${LULL.steady.map((l, i) => `<button class="lesson-row ${S.lessonsDone.includes(l.id) ? 'done' : ''}" data-act="lesson:${l.id}"><span class="lesson-num">${S.lessonsDone.includes(l.id) ? '✓' : i + 1}</span><div><b>${esc(l.title)}</b><br><small>${l.mins} min</small></div></button>`).join('')}
    </details>` : ''}
  </div>`;
}
function windDownBanner() {
  if (!S.settings.nudge) return '';
  const now = new Date(); const mins = now.getHours() * 60 + now.getMinutes();
  let diff = toMin(S.bedtime) - mins; if (diff < -240) diff += 1440;
  if (diff > 45 || diff < -90) return '';
  return `<button class="card sos-card" style="background:linear-gradient(135deg,rgba(143,182,255,.22),rgba(169,156,255,.14));border-color:rgba(143,182,255,.35);margin-bottom:12px" data-act="tab:sleep">
    <span class="ring" style="background:rgba(143,182,255,.22)"><span style="font-size:26px">🌙</span></span>
    <div><h3>${diff > 0 ? `Bedtime in ${fmtDur(diff)}` : 'It\'s past bedtime'}</h3><p class="muted small">Start your wind-down. Kitchen's closing.</p></div></button>`;
}

function renderToday() {
  const ci = todayCheckin();
  const done = S.lessonsDone.length, total = LULL.lessons.length;
  const nl = nextLesson();
  const q = LULL.quotes[(new Date().getDate()) % LULL.quotes.length];
  const tiles = nowTiles();
  const ls = lastSleep();
  return `
  <section class="hero">
    ${Scenes.hero()}
    <h2>${greeting()}${S.name ? `, ${esc(S.name)}` : ''}</h2>
    <p>Find your balance. Calm the mind, ease the cravings, rest well tonight.</p>
    <p class="quote" style="margin-top:10px">“${esc(q)}”</p>
  </section>
  ${windDownBanner()}
  <div class="card">
    ${ci ? `<div class="row between"><div><h3>Today you're feeling ${MOODS[ci.mood - 1]} ${MOOD_NAMES[ci.mood - 1].toLowerCase()}</h3>
      <p class="muted small">Stress ${ci.stress}/5${ci.feelings?.length ? ' · ' + ci.feelings.map(esc).join(', ') : ''}</p></div>
      <button class="btn sm" data-act="checkin:0">Update</button></div>`
    : `<h3>How are you, really?</h3><p class="muted small">A 10-second check-in. Patterns appear on your Journey.</p>
      <div class="moods">${MOODS.map((m, i) => `<button class="mood" data-act="checkin:${i + 1}" aria-label="${MOOD_NAMES[i]}">${m}</button>`).join('')}</div>`}
  </div>

  <div style="margin-top:12px"><button class="sos-card" data-act="pause">
    <span class="ring"><svg viewBox="0 0 24 24"><path d="M8 6h3v12H8zM13 6h3v12h-3z"/></svg></span>
    <div><h3>Craving something?</h3><p class="muted small">Pause first. Two minutes to check what you really need.</p></div>
  </button></div>

  <div class="stats" style="margin-top:12px">
    <div class="stat"><b>${streak()}</b><span>day streak</span></div>
    <div class="stat"><b>${mindfulMins()}</b><span>calm minutes</span></div>
    <div class="stat"><b>${surfed()}</b><span>urges paused</span></div>
  </div>

  <div class="section-title"><h3>For right now</h3></div>
  <div class="tiles">
    ${tiles.map((t) => `<button class="tile" data-act="${t.act}"><span class="dot" style="background:${t.color}"></span><span class="emoji">${t.emoji}</span><div><b>${esc(t.title)}</b><small>${esc(t.sub)}</small></div></button>`).join('')}
  </div>

  <div class="section-title"><h3>Unhook · 10-day course</h3><span class="faint">${done}/${total}</span></div>
  <div class="card">
    <div class="progress"><i style="width:0" data-w="${(done / total) * 100}%"></i></div>
    ${nl ? `<button class="lesson-row next" data-act="lesson:${nl.id}" style="margin-top:6px"><span class="lesson-num">${LULL.lessons.indexOf(nl) + 1}</span><div><b>${esc(nl.title)}</b><br><small>Up next · ${nl.mins} min read</small></div><span class="link">Start</span></button>`
    : `<p style="margin-top:12px">🎉 You finished Unhook. Revisit any lesson below.</p>`}
    <details style="margin-top:4px"><summary class="link" style="list-style:none;padding:8px 0">All lessons</summary>
      ${LULL.lessons.map((l, i) => `<button class="lesson-row ${S.lessonsDone.includes(l.id) ? 'done' : ''}" data-act="lesson:${l.id}"><span class="lesson-num">${S.lessonsDone.includes(l.id) ? '✓' : i + 1}</span><div><b>${esc(l.title)}</b><br><small>${l.mins} min</small></div></button>`).join('')}
    </details>
  </div>

  ${steadyCard()}

  <div class="section-title"><h3>Quick tools</h3></div>
  <div class="tiles">
    <button class="tile" data-act="breath:sigh:1"><span class="dot" style="background:#7fe0c3"></span><span class="emoji">🌬️</span><div><b>1-minute reset</b><small>When it's all too much</small></div></button>
    <button class="tile" data-act="surf"><span class="dot" style="background:#ff9fb8"></span><span class="emoji">🌊</span><div><b>Urge surf</b><small>Ride out a craving</small></div></button>
    <button class="tile" data-act="sleeplog"><span class="dot" style="background:#8fb6ff"></span><span class="emoji">🛏️</span><div><b>Log sleep</b><small>${ls ? `Last: ${fmtDur(sleepHours(ls) * 60)}` : 'How did you sleep?'}</small></div></button>
    <button class="tile" data-act="mindful"><span class="dot" style="background:#ffc59e"></span><span class="emoji">🍓</span><div><b>Mindful bite</b><small>Eat it slowly, guilt-free</small></div></button>
  </div>`;
}

const FEELINGS = ['Calm', 'Anxious', 'Stressed', 'Tired', 'Overwhelmed', 'Lonely', 'Bored', 'Sad', 'Irritable', 'Grateful', 'Hopeful', 'Proud'];
function openCheckin(mood) {
  const ci = todayCheckin();
  const st = { mood: mood || ci?.mood || 3, stress: ci?.stress || 3, feelings: [...(ci?.feelings || [])] };
  const draw = () => `
    <h2>Check in</h2><p class="muted">No right answers. Just notice.</p>
    <div class="moods">${MOODS.map((m, i) => `<button class="mood ${st.mood === i + 1 ? 'on' : ''}" data-m="${i + 1}">${m}</button>`).join('')}</div>
    <p class="faint" style="text-align:center;margin-top:6px">${MOOD_NAMES[st.mood - 1]}</p>
    <label class="field"><span>Stress level</span></label>
    <div class="chips">${[1, 2, 3, 4, 5].map((n) => `<button class="chip ${st.stress === n ? 'on' : ''}" data-s="${n}">${n}${n === 1 ? ' · relaxed' : n === 5 ? ' · maxed' : ''}</button>`).join('')}</div>
    <label class="field"><span>What's here right now?</span></label>
    <div class="chips">${FEELINGS.map((f) => `<button class="chip ${st.feelings.includes(f) ? 'on' : ''}" data-f="${f}">${f}</button>`).join('')}</div>
    <label class="field"><span>Note (optional)</span><textarea class="input" id="ciNote" placeholder="What's on your mind? Try one kind sentence to yourself.">${esc(ci && dk(new Date(ci.ts)) === dk() ? ci.note || '' : '')}</textarea></label>
    <button class="btn primary block" id="ciSave" style="margin-top:16px">Save check-in</button>`;
  openSheet(draw(), function mount(body) {
    body.onclick = (e) => {
      const b = e.target.closest('button'); if (!b) return;
      const note = $('#ciNote')?.value;
      if (b.dataset.m) st.mood = +b.dataset.m;
      else if (b.dataset.s) st.stress = +b.dataset.s;
      else if (b.dataset.f) { const f = b.dataset.f; st.feelings = st.feelings.includes(f) ? st.feelings.filter((x) => x !== f) : [...st.feelings, f]; }
      else if (b.id === 'ciSave') {
        S.checkins.push({ id: uid(), ts: Date.now(), ...st, note: note || '' }); save(); closeSheet(); rerender();
        toast(st.stress >= 4 ? 'Thanks for being honest. Try a 1-minute reset?' : 'Checked in. Nice one.');
        return;
      } else return;
      buzz(8); body.innerHTML = draw(); $('#ciNote').value = note || '';
    };
  });
}

/* ================================================================
   BREATHE
   ================================================================ */
function renderBreathe() {
  return `
  <section class="hero"><h2>Breathe</h2><p>Your breath is the remote control for your nervous system. Pick one and follow the light.</p></section>
  ${LULL.patterns.map((p) => `
    <div class="card">
      <div class="pattern"><span class="orbmini" style="background:radial-gradient(circle at 35% 30%,#fff9,${p.color} 45%,transparent 75%);box-shadow:0 0 24px -4px ${p.color}"></span>
        <div><b style="font-size:17px">${esc(p.name)}</b> <span class="pill">${esc(p.tag)}</span><small style="margin-top:4px">${esc(p.desc)}</small>
        <small class="faint" style="margin-top:4px">${p.phases.map((x) => x[2]).join(' · ')} seconds</small></div></div>
      <div class="dur" style="margin-top:12px">${[1, 3, 5, 10].map((m) => `<button class="btn sm ${m === 3 ? 'primary' : ''}" data-act="breath:${p.id}:${m}">${m} min</button>`).join('')}</div>
    </div>`).join('')}
  <div class="card" style="margin-top:12px">
    <div class="row between"><div><b>Soft chime</b><p class="faint">A gentle bell when the breath changes</p></div><label class="switch"><input type="checkbox" data-set="chime" ${S.settings.chime ? 'checked' : ''}><i></i></label></div>
    <div class="row between" style="margin-top:12px"><div><b>Vibration</b><p class="faint">Feel the rhythm with your eyes closed</p></div><label class="switch"><input type="checkbox" data-set="haptics" ${S.settings.haptics ? 'checked' : ''}><i></i></label></div>
  </div>`;
}
document.addEventListener('change', (e) => { const k = e.target.dataset?.set; if (k) { S.settings[k] = e.target.checked; save(); toast('Saved'); } });

function openBreath(pid, mins) {
  const p = LULL.patterns.find((x) => x.id === pid) || LULL.patterns[0];
  const total = mins * 60;
  const o = openOverlay(`
    <div class="ov-top">${closeBtn()}<span class="pill">${esc(p.name)} · ${mins} min</span><span style="width:42px"></span></div>
    <div class="ov-body" id="brBody">
      <div class="orb-wrap" style="--orb:${p.color}"><span class="halo"></span><span class="halo h2"></span><div class="orb" id="orb"></div>
        <div class="orb-label"><b id="phLabel">Get comfortable</b><span id="phCount"></span></div></div>
      <div class="time-bar"><div class="progress"><i id="brProg" style="width:0;transition:width 1s linear"></i></div><p class="faint" id="brLeft" style="margin-top:6px">${mins}:00 left</p></div>
      <div class="ov-controls"><button class="round-btn" id="brToggle" aria-label="Pause"><svg viewBox="0 0 24 24" id="brIcon"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/></svg></button></div>
    </div>`, () => { alive = false; });
  let alive = true, running = true, elapsed = 0, phaseIdx = -1, phaseEl = 0, last = performance.now(), cycles = 0;
  const orb = $('#orb', o), lab = $('#phLabel', o), cnt = $('#phCount', o);
  const SCALE = { in: 0.92, in2: 1, out: 0.45 };
  let prep = 3;
  function setPhase(i, remaining) {
    phaseIdx = i; const [kind, label, secs] = p.phases[i];
    const dur = remaining ?? secs;
    lab.textContent = label;
    if (SCALE[kind] != null) { orb.style.transitionDuration = dur + 's'; orb.style.transform = `scale(${SCALE[kind]})`; }
    if (remaining == null) {
      if (S.settings.chime && (kind === 'in' || kind === 'out')) Sound.chime(kind === 'in' ? 528 : 396, 0.08);
      buzz(kind === 'out' ? [15, 60, 15] : 25);
    }
  }
  function frame(now) {
    if (!alive) return;
    const dt = Math.min(0.25, (now - last) / 1000); last = now;
    if (running) {
      if (prep > 0) { prep -= dt; cnt.textContent = Math.ceil(prep); if (prep <= 0) { phaseEl = 0; setPhase(0); } }
      else {
        elapsed += dt; phaseEl += dt;
        const secs = p.phases[phaseIdx][2];
        if (phaseEl >= secs) {
          phaseEl = 0;
          let n = (phaseIdx + 1) % p.phases.length;
          if (n === 0) cycles++;
          if (n === 0 && elapsed >= total - 1) return finish();
          setPhase(n);
        }
        cnt.textContent = Math.max(1, Math.ceil(p.phases[phaseIdx][2] - phaseEl));
        const left = Math.max(0, total - elapsed);
        $('#brProg', o).style.width = Math.min(100, (elapsed / total) * 100) + '%';
        $('#brLeft', o).textContent = `${Math.floor(left / 60)}:${pad(Math.floor(left % 60))} left`;
      }
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  $('#brToggle', o).onclick = () => {
    running = !running;
    $('#brIcon', o).innerHTML = running ? '<path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/>' : '<path d="M8 5l11 7-11 7z"/>';
    if (!running) { const cs = getComputedStyle(orb).transform; orb.style.transitionDuration = '0s'; orb.style.transform = cs; lab.textContent = 'Paused'; }
    else if (phaseIdx >= 0) setPhase(phaseIdx, p.phases[phaseIdx][2] - phaseEl);
  };
  function finish() {
    alive = false;
    logSession('breathe', p.id, elapsed / 60);
    if (S.settings.chime) { Sound.chime(528, 0.1); setTimeout(() => Sound.chime(660, 0.08), 400); }
    $('#brBody', o).innerHTML = `<div class="fadein"><div class="celebrate">✨</div><h2>${Math.round(elapsed / 60)} calm ${Math.round(elapsed / 60) === 1 ? 'minute' : 'minutes'}</h2>
      <p class="lead">${cycles} slow breaths. How do you feel now?</p>
      <div class="moods" style="gap:8px;margin-top:22px">${MOODS.map((m, i) => `<button class="mood" data-after="${i + 1}">${m}</button>`).join('')}</div>
      <button class="btn block" data-close style="margin-top:22px">Done</button></div>`;
    sparkle(o);
    $('#brBody', o).onclick = (e) => { const b = e.target.closest('[data-after]'); if (!b) return; const s = S.sessions[S.sessions.length - 1]; s.moodAfter = +b.dataset.after; save(); toast('Noted. Well done.'); closeOverlay(); };
  }
}

/* ================================================================
   PAUSE (craving SOS)
   ================================================================ */
const NEEDS = [
  ['angry', 'Angry or anxious', 'Wound up, on edge'],
  ['lonely', 'Lonely', 'Wanting connection'],
  ['tired', 'Tired', 'Low energy, worn out'],
  ['bored', 'Bored', 'Restless, procrastinating'],
];
function openPause(opt = {}) {
  const P = { step: opt.jump === 'surf' ? 'surf' : 'urge', urge: 6, hungry: null, needs: [], after: null, start: Date.now(), surfSecs: 90, practice: opt.jump === 'surf' };
  let surfStop = null;
  const o = openOverlay(`<div class="ov-top">${closeBtn()}<div class="step-dots" id="dots"></div><span style="width:42px"></span></div><div class="ov-body" id="pb"></div>`, () => surfStop && surfStop());
  const body = $('#pb', o);
  const ORDER = ['urge', 'apple', 'needs', 'surf', 'rerate', 'choose', 'done'];
  const dots = () => { const i = ORDER.indexOf(P.step === 'hungry' ? 'needs' : P.step === 'swap' || P.step === 'mindful' ? 'choose' : P.step); $('#dots', o).innerHTML = ORDER.map((_, j) => `<i class="${j === i ? 'on' : ''}"></i>`).join(''); };
  const urgeSlider = (v) => `<div class="urge-num" id="un">${v}</div><p class="faint" id="ul">${urgeWord(v)}</p>
     <input type="range" class="big-range" id="ur" min="0" max="10" value="${v}" style="margin-top:14px">
     <div class="row between faint" style="width:100%"><span>barely there</span><span>overwhelming</span></div>`;
  const bindSlider = (key) => { const r = $('#ur', o); r.oninput = () => { P[key] = +r.value; $('#un', o).textContent = r.value; $('#ul', o).textContent = urgeWord(+r.value); buzz(5); }; };

  const steps = {
    urge: () => `<div class="fadein" style="width:100%"><h2>You paused.<br>That's the hardest part.</h2>
      <p class="lead">Take one slow breath. Now, how strong is the craving?</p>
      ${urgeSlider(P.urge)}
      <button class="btn primary block" data-go="apple" style="margin-top:26px">Next</button></div>`,
    apple: () => `<div class="fadein"><div style="font-size:64px">🍎</div><h2>The apple test</h2>
      <p class="lead">Would a plain apple, or a simple sandwich, sound good right now?</p>
      <button class="choice" data-go="hungry"><span class="ic">🙋</span><div><b>Yes, I'd eat that</b><small>My stomach is actually hungry</small></div></button>
      <button class="choice" data-go="needs"><span class="ic">🙅</span><div><b>No, I want something specific</b><small>Only the sweet / salty / crunchy thing will do</small></div></button></div>`,
    hungry: () => `<div class="fadein"><div style="font-size:64px">🥪</div><h2>Then listen to your body.</h2>
      <p class="lead">Real hunger deserves real food. Eat something nourishing, sit down, and take your time. That is not a slip; that is self-care.</p>
      <ul class="swap-list" style="text-align:left;color:var(--muted)">${LULL.swaps.hungry.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
      <button class="btn mint block" data-out="fed" style="margin-top:18px">I'll go eat properly</button>
      <button class="btn ghost block" data-go="needs" style="margin-top:8px">Actually, it might be emotional</button></div>`,
    needs: () => `<div class="fadein" style="width:100%"><h2>What's underneath?</h2>
      <p class="lead">Food often stands in for another need. Tap any that fit.</p>
      <div class="halt">${NEEDS.map(([id, t, s]) => `<button data-need="${id}" class="${P.needs.includes(id) ? 'on' : ''}"><b>${t}</b><small>${s}</small></button>`).join('')}</div>
      <button class="btn primary block" data-go="surf" style="margin-top:22px">Ride the wave</button>
      <button class="btn ghost block" data-go="choose" style="margin-top:6px">Skip to options</button></div>`,
    surf: () => `<div class="fadein" style="width:100%"><h2 style="font-size:24px">Surf the urge</h2>
      <canvas class="surf-canvas" id="sc"></canvas>
      <p class="surf-prompt" id="sp">${esc(LULL.surfPrompts[0])}</p>
      <p class="surf-time" id="st">Breathe in…</p>
      <div class="row" style="margin-top:22px;justify-content:center"><button class="btn" id="more">+60s</button><button class="btn primary" id="sdone" data-go="rerate">I'm through it</button></div></div>`,
    rerate: () => `<div class="fadein" style="width:100%"><h2>${P.practice ? 'How strong is it now?' : 'And now?'}</h2>
      <p class="lead">Before, it was a ${P.urge}. Where is the craving now?</p>
      ${urgeSlider(P.after ?? Math.max(0, P.urge - 2))}
      <button class="btn primary block" data-go="choose" style="margin-top:26px">Next</button></div>`,
    choose: () => {
      const drop = P.after != null ? P.urge - P.after : 0;
      return `<div class="fadein" style="width:100%">${drop > 0 ? `<p class="pill" style="background:rgba(127,224,195,.15);color:var(--mint)">Down ${drop} point${drop > 1 ? 's' : ''} 🌊</p>` : ''}
      <h2 style="margin-top:10px">What feels right?</h2><p class="lead">Every option here is okay. You're choosing on purpose now, not on autopilot.</p>
      <button class="choice" data-out="passed"><span class="ic">🌤️</span><div><b>The urge has passed</b><small>I'm good for now</small></div></button>
      <button class="choice" data-go="swap"><span class="ic">🔄</span><div><b>Try a swap</b><small>Meet the real need another way</small></div></button>
      <button class="choice" data-go="mindful"><span class="ic">🍫</span><div><b>Eat it, mindfully</b><small>A normal portion, slowly, guilt-free</small></div></button>
      <button class="choice" data-out="ate"><span class="ic">🫶</span><div><b>I already ate it</b><small>That's okay. Logging it is still a win</small></div></button></div>`;
    },
    swap: () => {
      const needs = P.needs.length ? P.needs : ['bored', 'angry'];
      return `<div class="fadein" style="width:100%;text-align:left"><h2>Pick one swap</h2><p class="lead">Matched to what you said you need. Do it for 5 minutes, then check in with the craving.</p>
      ${needs.map((n) => `<p class="faint" style="margin-top:18px;text-transform:uppercase;letter-spacing:.08em">${NEEDS.find((x) => x[0] === n)?.[1] || 'Hungry'}</p>${LULL.swaps[n].map((s) => `<button class="choice" data-swap="${esc(s)}"><span class="ic">→</span><div><b style="font-weight:500">${esc(s)}</b></div></button>`).join('')}`).join('')}</div>`;
    },
    mindful: () => `<div class="fadein" style="width:100%;text-align:left"><h2>Eat it like you mean it</h2><p class="lead">No guilt allowed. Just attention.</p>
      <ol style="color:#d6d8f0;line-height:1.8;padding-left:20px;margin-top:16px">${LULL.mindfulSteps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
      <button class="btn peach block" data-out="mindful" style="margin-top:18px">Okay, I'll eat it mindfully</button></div>`,
    done: () => {
      const msg = { passed: ['🌤️', 'You surfed it.', 'Every urge you ride out makes the next one a little weaker. That is real rewiring.'],
        swapped: ['🔄', 'Nice swap.', 'You gave yourself what you actually needed. Check back with the craving in a few minutes.'],
        mindful: ['🍫', 'Enjoy it. Really.', 'Notice when the pleasure fades. That is your brain learning what this food is really worth.'],
        ate: ['🫶', 'Thank you for being honest.', 'One moment does not undo anything. Be the kind voice tonight. Tomorrow is a fresh start.'],
        fed: ['🥪', 'Good call.', 'Feeding real hunger well makes stress cravings less likely later on.'] }[P.outcome];
      return `<div class="fadein"><div class="celebrate">${msg[0]}</div><h2>${msg[1]}</h2><p class="lead">${msg[2]}</p>
        <label class="field" style="text-align:left;width:100%"><span>What set it off? (optional)</span><input class="input" id="trig" placeholder="e.g. tough email, scrolling at night"></label>
        <button class="btn primary block" id="pfin" style="margin-top:18px">Done</button></div>`;
    },
  };

  function show(step) {
    if (surfStop) { surfStop(); surfStop = null; }
    P.step = step; body.innerHTML = steps[step](); dots(); o.scrollTop = 0;
    if (step === 'urge') bindSlider('urge');
    if (step === 'rerate') { if (P.after == null) P.after = Math.max(0, P.urge - 2); bindSlider('after'); }
    if (step === 'surf') surfStop = runSurf();
    if (step === 'done') {
      sparkle(o);
      $('#pfin', o).onclick = () => {
        S.cravings.push({ id: uid(), ts: P.start, urge: P.urge, after: P.after, hungry: P.hungry, needs: P.needs, outcome: P.outcome, swap: P.swap || '', trigger: $('#trig', o).value.trim(), practice: P.practice });
        save(); closeOverlay(); toast(P.outcome === 'ate' ? 'Logged. Be gentle with yourself.' : 'Logged. Proud of you.');
      };
    }
  }
  body.onclick = (e) => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.need) { const n = b.dataset.need; P.needs = P.needs.includes(n) ? P.needs.filter((x) => x !== n) : [...P.needs, n]; b.classList.toggle('on'); buzz(8); return; }
    if (b.dataset.go) { if (b.dataset.go === 'hungry') P.hungry = true; if (b.dataset.go === 'needs' && P.step === 'apple') P.hungry = false; buzz(10); return show(b.dataset.go); }
    if (b.dataset.swap) { P.swap = b.dataset.swap; P.outcome = 'swapped'; return show('done'); }
    if (b.dataset.out) { P.outcome = b.dataset.out; if (b.dataset.out === 'fed') P.hungry = true; return show('done'); }
  };

  function runSurf() {
    const c = $('#sc', o), g = c.getContext('2d');
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const fit = () => { c.width = c.clientWidth * dpr; c.height = c.clientHeight * dpr; };
    fit(); window.addEventListener('resize', fit);
    let alive = true, t0 = performance.now(), pi = 0, elapsed = 0, last = t0;
    const prompt = $('#sp', o), tm = $('#st', o);
    $('#more', o).onclick = () => { P.surfSecs += 60; toast('+60 seconds'); };
    const curve = (x) => { const peak = 0.33; return x < peak ? Math.sin((x / peak) * Math.PI / 2) ** 1.4 : 0.12 + 0.88 * Math.exp(-(((x - peak) / 0.3) ** 2)); };
    let breathIn = true;
    function draw(now) {
      if (!alive) return;
      elapsed += (now - last) / 1000; last = now;
      const W = c.width, H = c.height, prog = Math.min(1, elapsed / P.surfSecs);
      g.clearRect(0, 0, W, H);
      // water layers
      for (let k = 0; k < 3; k++) {
        g.beginPath(); g.moveTo(0, H);
        for (let x = 0; x <= W; x += 6) { const y = H * (0.78 + k * 0.06) + Math.sin(x / (60 + k * 30) / dpr + now / (900 - k * 200)) * (8 - k * 2) * dpr; g.lineTo(x, y); }
        g.lineTo(W, H); g.closePath();
        g.fillStyle = ['rgba(143,182,255,.18)', 'rgba(169,156,255,.16)', 'rgba(255,159,184,.14)'][k]; g.fill();
      }
      // urge curve
      const pad = 16 * dpr, top = H * 0.08, base = H * 0.72;
      const px = (x) => pad + x * (W - pad * 2), py = (x) => base - curve(x) * (base - top) * (0.4 + P.urge / 16);
      g.beginPath(); for (let i = 0; i <= 100; i++) { const x = i / 100; i ? g.lineTo(px(x), py(x)) : g.moveTo(px(x), py(x)); }
      g.strokeStyle = 'rgba(255,255,255,.15)'; g.lineWidth = 2 * dpr; g.stroke();
      g.beginPath(); for (let i = 0; i <= prog * 100; i++) { const x = i / 100; i ? g.lineTo(px(x), py(x)) : g.moveTo(px(x), py(x)); }
      const grad = g.createLinearGradient(0, 0, W, 0); grad.addColorStop(0, '#ff9fb8'); grad.addColorStop(1, '#a99cff');
      g.strokeStyle = grad; g.lineWidth = 3.5 * dpr; g.lineCap = 'round'; g.stroke();
      const dx = px(prog), dy = py(prog), pulse = 1 + Math.sin(now / 300) * 0.2;
      g.beginPath(); g.arc(dx, dy, 14 * dpr * pulse, 0, 7); g.fillStyle = 'rgba(255,159,184,.25)'; g.fill();
      g.beginPath(); g.arc(dx, dy, 6 * dpr, 0, 7); g.fillStyle = '#fff'; g.fill();
      g.font = `${11 * dpr}px Inter, sans-serif`; g.fillStyle = 'rgba(255,255,255,.4)'; g.textAlign = 'center';
      g.fillText('peak', px(0.33), py(0.33) - 12 * dpr); g.fillText('passes', px(0.93), py(0.93) - 12 * dpr);
      // prompts every 10s, breath cue 4 in / 6 out
      const np = Math.floor(elapsed / 10) % LULL.surfPrompts.length;
      if (np !== pi) { pi = np; prompt.style.opacity = 0; setTimeout(() => { prompt.textContent = LULL.surfPrompts[pi]; prompt.style.opacity = 1; }, 500); }
      const cyc = elapsed % 10, inNow = cyc < 4;
      if (inNow !== breathIn) { breathIn = inNow; buzz(inNow ? 20 : [10, 40, 10]); }
      const left = Math.max(0, Math.ceil(P.surfSecs - elapsed));
      tm.textContent = `${inNow ? 'Breathe in…' : 'and slowly out…'}  ·  ${Math.floor(left / 60)}:${pad2(left % 60)}`;
      if (elapsed >= P.surfSecs) { alive = false; logSession('surf', 'urge', elapsed / 60); if (S.settings.chime) Sound.chime(528, 0.1); return show('rerate'); }
      requestAnimationFrame(draw);
    }
    const pad2 = (n) => String(n).padStart(2, '0');
    requestAnimationFrame(draw);
    return () => { if (alive && elapsed > 20) logSession('surf', 'urge', elapsed / 60); alive = false; window.removeEventListener('resize', fit); };
  }
  show(P.step);
}
function urgeWord(v) { return v <= 2 ? 'A whisper' : v <= 4 ? 'Noticeable' : v <= 6 ? 'Strong' : v <= 8 ? 'Very strong' : 'Overwhelming'; }

function openMindful() {
  let i = 0;
  const o = openOverlay(`<div class="ov-top">${closeBtn()}<span class="pill">Mindful bite</span><span style="width:42px"></span></div><div class="ov-body" id="mb"></div>`);
  const draw = () => {
    $('#mb', o).innerHTML = i < LULL.mindfulSteps.length
      ? `<div class="fadein" style="width:100%"><p class="faint">Step ${i + 1} of ${LULL.mindfulSteps.length}</p><div style="font-size:60px;margin:16px 0">${['🍽️', '📵', '👃', '😋', '⏸️', '🌱'][i]}</div>
         <h2>${esc(LULL.mindfulSteps[i])}</h2><button class="btn peach block" id="mn" style="margin-top:30px">${i === LULL.mindfulSteps.length - 1 ? 'Finish' : 'Next'}</button></div>`
      : `<div class="fadein"><div class="celebrate">🌱</div><h2>That's mindful eating.</h2><p class="lead">The more you practise, the more your brain learns what food is really worth to you.</p><button class="btn block" data-close style="margin-top:22px">Done</button></div>`;
    const n = $('#mn', o); if (n) n.onclick = () => { i++; buzz(10); if (i === LULL.mindfulSteps.length) { logSession('mindful', 'eat', 3); sparkle(o); } draw(); };
  };
  draw();
}

/* ================================================================
   SLEEP
   ================================================================ */
const PRESETS = { 'Rainy cabin': { rain: 0.55, fire: 0.35 }, 'Seaside': { ocean: 0.6, wind: 0.15 }, 'Bushveld night': { crickets: 0.45, wind: 0.12, drone: 0.2 }, 'Deep rest': { brown: 0.6, drone: 0.15 } };
let timerEnds = 0, timerMins = 0;
function setTimer(m) { timerMins = m; timerEnds = m ? Date.now() + m * 60000 : 0; Sound.sleepTimer(m); if (Sound.active().length) toast(m ? `Sounds fade out in ${m} min` : 'Timer off'); rerender(); updateNP(); }
function applyMix(mix, name) { Sound.stopAll(true); Sound.set(mix); if (!timerMins) { timerMins = 45; timerEnds = Date.now() + 45 * 60000; Sound.sleepTimer(45); } rerender(); updateNP(); toast(`${name} · fades out in ${timerMins} min`); }
function saveMix() {
  const act = Sound.active(); if (!act.length) return toast('Turn on a sound or two first');
  const mix = {}; act.forEach((id) => (mix[id] = Math.round((Sound.vol(id) ?? 0.5) * 100) / 100));
  openSheet(`<h2>Save this mix</h2><p class="muted">${act.map((id) => LULL.sounds.find((s) => s.id === id).name).join(' + ')}</p>
    <label class="field"><span>Name</span><input class="input" id="mixName" maxlength="24" placeholder="e.g. Sunday nap"></label>
    <button class="btn primary block" id="mixSave" style="margin-top:16px">Save mix</button>`, () => {
    $('#mixName').focus();
    $('#mixSave').onclick = () => { const name = $('#mixName').value.trim() || `Mix ${S.mixes.length + 1}`; S.mixes.push({ name, mix }); save(); closeSheet(); rerender(); toast(`Saved “${name}”`); };
  });
}
function applyPreset(name) { Sound.set(PRESETS[name]); if (!timerMins) { timerMins = 45; timerEnds = Date.now() + 45 * 60000; Sound.sleepTimer(45); } rerender(); updateNP(); toast(`${name} · fades out in 45 min`); }

const PRESET_SCENE = { 'Rainy cabin': 'fire', 'Seaside': 'ocean', 'Bushveld night': 'crickets', 'Deep rest': 'aurora' };
const QUALITY = ['Restless sleep', 'Light sleep', 'Okay sleep', 'Peaceful sleep', 'Deep sleep'];
let statIdx = 0;
actions.stat = (i) => { statIdx = Number(i); rerender(); };
actions.melody = () => { const names = Object.keys(PRESETS); S.melody = names[(names.indexOf(S.melody) + 1) % names.length]; save(); rerender(); };

/* Sleep timer dial: drag the moon (bedtime) and bell (wake) around a 24h clock. */
const DIAL_R = 112;
const angOf = (t) => (toMin(t) / 1440) * Math.PI * 2;
const ptOf = (t, r = DIAL_R) => { const a = angOf(t); return [150 + r * Math.sin(a), 150 - r * Math.cos(a)]; };
function dialInner() {
  const [bx, by] = ptOf(S.bedtime), [wx, wy] = ptOf(S.wake);
  let span = toMin(S.wake) - toMin(S.bedtime); if (span <= 0) span += 1440;
  let ticks = '';
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * Math.PI * 2, hour = i % 2 === 0, major = i % 12 === 0;
    const r1 = major ? 76 : hour ? 82 : 86, r2 = 92;
    ticks += `<line x1="${150 + r1 * Math.sin(a)}" y1="${150 - r1 * Math.cos(a)}" x2="${150 + r2 * Math.sin(a)}" y2="${150 - r2 * Math.cos(a)}" stroke="#fff" stroke-opacity="${major ? 0.9 : hour ? 0.45 : 0.18}" stroke-width="${major ? 2 : 1.4}" stroke-linecap="round"/>`;
  }
  const lbl = (txt, a, r = 62, size = 12, op = 0.95) => `<text x="${150 + r * Math.sin(a)}" y="${150 - r * Math.cos(a) + 4}" text-anchor="middle" font-size="${size}" fill="#fff" fill-opacity="${op}" font-family="Outfit, sans-serif">${txt}</text>`;
  const small = [2, 4, 8, 10, 14, 16, 20, 22].map((h) => lbl(h, (h / 24) * Math.PI * 2, 66, 8, 0.3)).join('');
  return `<defs><linearGradient id="arcG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6a58c8"/><stop offset="1" stop-color="#b6a8ff"/></linearGradient>
      <radialGradient id="faceG" cx="50%" cy="40%"><stop offset="0" stop-color="#2e2440"/><stop offset="1" stop-color="#17111f"/></radialGradient></defs>
    <circle cx="150" cy="150" r="${DIAL_R + 18}" fill="url(#faceG)"/>
    <circle cx="150" cy="150" r="${DIAL_R}" fill="none" stroke="#fff" stroke-opacity=".05" stroke-width="30"/>
    <path d="M${bx} ${by} A ${DIAL_R} ${DIAL_R} 0 ${span > 720 ? 1 : 0} 1 ${wx} ${wy}" fill="none" stroke="url(#arcG)" stroke-width="30" stroke-linecap="round" style="filter:drop-shadow(0 0 10px rgba(156,140,242,.55))"/>
    ${ticks}${lbl('00', 0)}${lbl('06', Math.PI / 2)}${lbl('12', Math.PI)}${lbl('18', Math.PI * 1.5)}${small}
    <path d="M150 112 a7 7 0 1 0 6 10 a6 6 0 0 1 -6 -10z" fill="#9c8cf2"/>
    <g transform="translate(150 186)" stroke="#f2c27b" stroke-width="1.4" stroke-linecap="round"><circle r="4.5" fill="#f2c27b"/>${[0, 45, 90, 135, 180, 225, 270, 315].map((d) => `<line x1="${7 * Math.sin(d * Math.PI / 180)}" y1="${7 * Math.cos(d * Math.PI / 180)}" x2="${10 * Math.sin(d * Math.PI / 180)}" y2="${10 * Math.cos(d * Math.PI / 180)}"/>`).join('')}</g>
    <g class="knob" data-knob="bedtime" transform="translate(${bx} ${by})"><circle r="17" fill="#f4f0fb" style="filter:drop-shadow(0 4px 10px rgba(0,0,0,.45))"/><path d="M2 -8 a8 8 0 1 0 6 12 a7 7 0 0 1 -6 -12z" fill="#2a1f40"/></g>
    <g class="knob" data-knob="wake" transform="translate(${wx} ${wy})"><circle r="17" fill="#2a1f40" stroke="#f4f0fb" stroke-width="2" style="filter:drop-shadow(0 4px 10px rgba(0,0,0,.45))"/><path d="M-6 3 a6 6 0 0 1 12 0 v-3 a6 6 0 0 0 -12 0z M-7 3 h14 M-1.6 6 a1.6 1.6 0 0 0 3.2 0" fill="none" stroke="#f4f0fb" stroke-width="1.6" stroke-linecap="round"/></g>`;
}
function dialSummary() {
  let span = toMin(S.wake) - toMin(S.bedtime); if (span <= 0) span += 1440;
  const h = Math.floor(span / 60), m = span % 60;
  return `<b>${h} hrs${m ? ` ${m} min` : ''}</b><p>${span >= 450 ? 'Your sleep window meets your goal.' : `That's ${fmtDur(480 - span)} short of 8 hours.`}</p>`;
}
function bindDial() {
  const svg = $('#dial'); if (!svg) return;
  let drag = null;
  const toTime = (e) => {
    const r = svg.getBoundingClientRect();
    const x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2;
    let a = Math.atan2(x, -y); if (a < 0) a += Math.PI * 2;
    const mins = (Math.round(((a / (Math.PI * 2)) * 1440) / 5) * 5) % 1440;
    return `${pad(Math.floor(mins / 60))}:${pad(mins % 60)}`;
  };
  svg.addEventListener('pointerdown', (e) => {
    const k = e.target.closest('[data-knob]'); if (!k) return;
    drag = k.dataset.knob; svg.setPointerCapture(e.pointerId); buzz(10); e.preventDefault();
  });
  svg.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const t = toTime(e); if (t === S[drag]) return;
    S[drag] = t; svg.innerHTML = dialInner();
    $('#bwBed').textContent = S.bedtime; $('#bwWake').textContent = S.wake; $('#dialSum').innerHTML = dialSummary();
    if (t.endsWith(':00') || t.endsWith(':30')) buzz(4);
  });
  const end = () => { if (drag) { drag = null; save(); $('#bedPillText').textContent = S.bedtime; } };
  svg.addEventListener('pointerup', end); svg.addEventListener('pointercancel', end);
}

function renderSleep() {
  const wd = S.winddown[nightKey()] || {};
  const doneN = LULL.windDown.filter((w) => wd[w.id]).length;
  const act = Sound.active();
  const nights = S.sleep.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
  if (statIdx >= nights.length) statIdx = 0;
  const night = nights[statIdx];
  const dayLabel = (d) => d === dk() ? 'Today' : d === dk(daysAgo(1)) ? 'Yesterday' : new Date(d + 'T12:00').toLocaleDateString('en-ZA', { weekday: 'long' });
  const loggedToday = S.sleep.some((s) => s.date === dk());
  const chev = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M9 6l6 6-6 6"/></svg>';
  return `
  <section class="dial-head">
    <h2>Sleep Timer</h2>
    <div class="bw">
      <div><small><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M14 3a9 9 0 1 0 7 13A8 8 0 0 1 14 3z"/></svg>Bedtime</small><b id="bwBed">${S.bedtime}</b></div>
      <div><small><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 21h4"/></svg>Wake up</small><b id="bwWake">${S.wake}</b></div>
    </div>
    <svg id="dial" class="dial" viewBox="0 0 300 300" aria-label="Drag the moon and bell to set bedtime and wake-up">${dialInner()}</svg>
    <div class="dial-sum" id="dialSum">${dialSummary()}</div>
  </section>

  <div class="card list-card" style="margin-top:18px">
    <div class="list-row"><span>Bedtime nudge</span><label class="switch"><input type="checkbox" data-set="nudge" ${S.settings.nudge ? 'checked' : ''}><i></i></label></div>
    <button class="list-row" data-act="melody"><span>Melody</span><span class="val">${esc(S.melody)} ${chev}</span></button>
    <button class="list-row" data-act="sleeplog"><span>Last night</span><span class="val">${loggedToday ? fmtDur(sleepHours(S.sleep.find((s) => s.date === dk())) * 60) : 'Log it'} ${chev}</span></button>
  </div>

  <div class="section-title"><h3>Sleep statistics</h3><button class="plus" data-act="sleeplog" aria-label="Log sleep">+</button></div>
  ${nights.length ? `<div class="seg">${nights.map((x, i) => `<button class="${i === statIdx ? 'on' : ''}" data-act="stat:${i}">${dayLabel(x.date)}</button>`).join('')}</div>
  <div class="card">
    <p class="small muted">REST — ${night.bed} to ${night.wake}</p>
    <div class="glowline"><i style="width:0" data-w="${Math.min(100, (sleepHours(night) / 8) * 100)}%"></i></div>
    <b style="font-size:20px">${(() => { const t = Math.round(sleepHours(night) * 60); return `${Math.floor(t / 60)} hrs ${t % 60} min`; })()}</b>
    <div class="row small muted" style="margin-top:6px;gap:16px"><span><span style="color:var(--green)">●</span> ${QUALITY[night.q - 1]}</span><span>💬 ${sleepHours(night) >= 7 ? 'On target' : 'A bit short'}</span></div>
  </div>` : `<div class="card"><div class="empty" style="padding:12px"><span class="e">🌙</span>Log your first night to see your rest here.</div></div>`}

  <div class="showcase" style="margin-top:24px">
    <h2>Sleep<br>Soundscapes</h2>
    <p>Endless sounds, made live on your phone. Tap to mix, slide to blend.</p>
    <div class="scenes">${LULL.sounds.map((s) => { const on = act.includes(s.id); return `<button class="scene ${on ? 'on' : ''}" data-snd="${s.id}" aria-pressed="${on}">${Scenes.scene(s.id)}<span class="lbl">${s.name}</span>${on ? '<span class="on-dot"></span>' : ''}</button>`; }).join('')}</div>
    <div class="dots"><i class="on"></i><i></i><i></i></div>
    ${act.length ? `<div class="vols">${act.map((id) => `<div class="vol-row"><span>${LULL.sounds.find((s) => s.id === id).name}</span><input type="range" min="0" max="100" value="${Math.round((Sound.vol(id) ?? 0.5) * 100)}" data-vol="${id}" aria-label="volume"></div>`).join('')}</div>` : ''}
    <div class="vols"><p class="faint" style="margin-top:12px">Fade out ${timerEnds ? `at ${fmtTime(timerEnds)}` : 'after'}</p>
    <div class="chips" style="margin-top:8px;justify-content:center">${[0, 15, 30, 45, 60, 90].map((m) => `<button class="chip ${timerMins === m ? 'on' : ''}" data-act="timer:${m}">${m ? m + 'm' : 'Off'}</button>`).join('')}</div>
    ${act.length ? `<button class="btn sm ghost" data-act="stopsound" style="margin-top:8px">Stop all sounds</button>` : ''}</div>
    <div class="vols"><p class="faint" style="margin-top:16px">Signature mixes ${proBadge()}</p>
    <div class="chips" style="margin-top:8px;justify-content:center">${Object.keys(LULL.proMixes).map((n) => `<button class="chip" data-act="mix:${esc(n)}">${esc(n)}</button>`).join('')}</div>
    ${S.mixes.length ? `<p class="faint" style="margin-top:12px">Your mixes</p><div class="chips" style="margin-top:8px;justify-content:center">${S.mixes.map((m, i) => `<span class="chip mymix"><button data-act="mymix:${i}">${esc(m.name)}</button><button class="x" data-act="delmix:${i}" aria-label="Remove ${esc(m.name)}">×</button></span>`).join('')}</div>` : ''}
    ${act.length ? `<button class="btn sm ghost" data-act="savemix" style="margin-top:10px">Save this mix ${proBadge()}</button>` : ''}</div>
  </div>

  <div class="section-title"><h3>Sleep stories</h3></div>
  <div class="card list-card">${LULL.stories.map((s) => `<button class="list-row" data-act="story:${s.id}"><span>${esc(s.title)}</span><span class="val">${s.mins} min ${chev}</span></button>`).join('')}
    ${LULL.proStories.map((s) => `<button class="list-row" data-act="story:${s.id}"><span>${esc(s.title)} ${proBadge()}</span><span class="val">${s.mins} min ${chev}</span></button>`).join('')}</div>

  <div class="section-title"><h3>Tonight's wind-down</h3><span class="faint">${doneN}/${LULL.windDown.length}</span></div>
  <div class="card">
    <div class="progress" style="margin-bottom:6px"><i style="width:0" data-w="${(doneN / LULL.windDown.length) * 100}%"></i></div>
    ${LULL.windDown.map((w) => `<button class="check ${wd[w.id] ? 'on' : ''}" data-act="wd:${w.id}"><span class="box"></span><div><b>${esc(w.label)}</b><small>${esc(w.hint)}</small></div></button>`).join('')}
  </div>`;
}
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-snd]'); if (!b) return;
  const id = b.dataset.snd; buzz(10);
  if (Sound.active().includes(id)) Sound.stop(id); else Sound.start(id, 0.5);
  const sc = $('.scenes'); const x = sc ? sc.scrollLeft : 0;
  rerender(); if ($('.scenes')) $('.scenes').scrollLeft = x;
});
document.addEventListener('input', (e) => { const id = e.target.dataset?.vol; if (id) Sound.setVol(id, e.target.value / 100); });
document.addEventListener('scroll', (e) => {
  if (!e.target.classList?.contains('scenes')) return;
  const sc = e.target, p = sc.scrollLeft / Math.max(1, sc.scrollWidth - sc.clientWidth), i = Math.min(2, Math.round(p * 2));
  $$('.dots i').forEach((d, j) => d.classList.toggle('on', j === i));
}, true);

function toggleWind(id) {
  const k = nightKey(); const wd = (S.winddown[k] = S.winddown[k] || {});
  if (id === 'dump' && !wd.dump) return openDump();
  if (id === 'breathe' && !wd.breathe) { wd.breathe = true; save(); return openBreath('478', 3); }
  if (id === 'sound' && !wd.sound) { wd.sound = true; save(); rerender(); if (!Sound.active().length) applyPreset('Rainy cabin'); return; }
  wd[id] = !wd[id]; save(); rerender();
  if (LULL.windDown.every((w) => wd[w.id])) toast('Wind-down complete. Sleep well 🌙');
}
function openDump() {
  const k = nightKey(); const wd = (S.winddown[k] = S.winddown[k] || {});
  openSheet(`<h2>Brain dump</h2><p class="muted">Write down anything rattling around: tomorrow's to-dos, worries, ideas. It'll be here in the morning, so your mind can let go.</p>
    <textarea class="input" id="dumpTx" style="min-height:180px;margin-top:14px" placeholder="- Email Thandi about the report&#10;- Buy bread&#10;- Stop worrying about…">${esc(wd.dumpText || '')}</textarea>
    <button class="btn primary block" id="dumpSave" style="margin-top:14px">Out of my head</button>`, () => {
    $('#dumpTx').focus();
    $('#dumpSave').onclick = () => { wd.dumpText = $('#dumpTx').value; wd.dump = !!wd.dumpText.trim(); save(); closeSheet(); rerender(); toast('Saved. Let it go for tonight.'); };
  });
}
function openSleepLog() {
  const ex = S.sleep.find((s) => s.date === dk());
  const st = { bed: ex?.bed || S.bedtime, wake: ex?.wake || '06:30', q: ex?.q || 3 };
  openSheet(`<h2>Last night</h2><p class="muted">Roughly is fine.</p>
    <div class="grid2"><label class="field"><span>Went to sleep</span><input type="time" class="input" id="slB" value="${st.bed}"></label>
    <label class="field"><span>Woke up</span><input type="time" class="input" id="slW" value="${st.wake}"></label></div>
    <p class="faint" id="slDur" style="margin-top:8px"></p>
    <label class="field"><span>Sleep quality</span></label>
    <div class="chips" id="slQ">${[1, 2, 3, 4, 5].map((n) => `<button class="chip ${st.q === n ? 'on' : ''}" data-q="${n}">${'★'.repeat(n)}</button>`).join('')}</div>
    <button class="btn primary block" id="slSave" style="margin-top:18px">Save</button>`, () => {
    const upd = () => { $('#slDur').textContent = `That's ${fmtDur(sleepHours({ bed: $('#slB').value, wake: $('#slW').value }) * 60)} of sleep.`; };
    upd(); $('#slB').oninput = upd; $('#slW').oninput = upd;
    $('#slQ').onclick = (e) => { const b = e.target.closest('[data-q]'); if (!b) return; st.q = +b.dataset.q; $$('#slQ .chip').forEach((c) => c.classList.toggle('on', c === b)); };
    $('#slSave').onclick = () => {
      S.sleep = S.sleep.filter((s) => s.date !== dk());
      const entry = { date: dk(), bed: $('#slB').value, wake: $('#slW').value, q: st.q };
      S.sleep.push(entry); save(); closeSheet(); rerender();
      const h = sleepHours(entry);
      toast(h < 6.5 ? 'Short night. Cravings may be louder today; go easy.' : 'Logged. Nice rest.');
    };
  });
}

/* Sleep story player: device voice reads sentence by sentence over a soundscape */
let voices = [];
const loadVoices = () => { voices = (window.speechSynthesis?.getVoices() || []).filter((v) => /^en/i.test(v.lang)); };
if (window.speechSynthesis) { loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; }
function pickVoice() {
  if (S.settings.voiceName) { const v = voices.find((x) => x.name === S.settings.voiceName); if (v) return v; }
  return voices.find((v) => /en-ZA/i.test(v.lang)) || voices.find((v) => /natural|neural/i.test(v.name) && /en-GB/i.test(v.lang)) || voices.find((v) => /en-GB/i.test(v.lang)) || voices[0] || null;
}
function openStory(id) {
  const s = allStories().find((x) => x.id === id);
  const sentences = s.text.match(/[^.!?]+[.!?]+/g).map((x) => x.trim());
  const tts = S.settings.voice && 'speechSynthesis' in window;
  const o = openOverlay(`
    <div class="ov-top">${closeBtn()}<span class="pill">${esc(s.title)}</span><span style="width:42px"></span></div>
    <div class="ov-body top"><div class="story-art">${Scenes.scene(s.scene || s.id)}</div><div class="reader" id="rd">${sentences.map((t, i) => `<p data-i="${i}">${esc(t)}</p>`).join('')}</div>
    <div class="ov-controls" style="margin-top:20px"><button class="round-btn" id="stT"><svg viewBox="0 0 24 24" id="stI"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/></svg></button></div>
    <p class="faint" style="text-align:center;margin-top:12px">${tts ? 'Read by your device voice. Sounds keep playing after the story.' : 'Read along. Sounds keep playing after the story.'}</p></div>`,
    () => { gen++; window.speechSynthesis?.cancel(); });
  let i = 0, gen = 0, playing = true;
  const t0 = Date.now();
  Sound.set(s.sound); if (!timerMins) { timerMins = 45; timerEnds = Date.now() + 45 * 60000; Sound.sleepTimer(45); } updateNP();
  const rd = $('#rd', o);
  function highlight() {
    $$('p', rd).forEach((p) => p.classList.toggle('cur', +p.dataset.i === i));
    const cur = $(`p[data-i="${i}"]`, rd); if (cur) rd.scrollTo({ top: cur.offsetTop - rd.clientHeight / 2 + cur.clientHeight / 2, behavior: 'smooth' });
  }
  function speak() {
    const my = ++gen;
    if (i >= sentences.length) return end();
    highlight();
    const next = () => { if (my !== gen || !playing) return; i++; setTimeout(() => { if (my === gen && playing) speak(); }, 900); };
    if (tts) {
      const u = new SpeechSynthesisUtterance(sentences[i]);
      const v = pickVoice(); if (v) u.voice = v;
      u.rate = 0.82; u.pitch = 0.92; u.volume = 1;
      u.onend = next; u.onerror = next;
      speechSynthesis.speak(u);
    } else setTimeout(next, 1500 + sentences[i].split(' ').length * 420);
  }
  function end() {
    logSession('story', s.id, (Date.now() - t0) / 60000);
    rd.insertAdjacentHTML('beforeend', '<p class="cur" style="text-align:center">🌙 Sleep well.</p>');
    $('#stT', o).style.display = 'none';
    setTimeout(() => { rd.scrollTo({ top: rd.scrollHeight, behavior: 'smooth' }); }, 300);
  }
  $('#stT', o).onclick = () => {
    playing = !playing; gen++;
    window.speechSynthesis?.cancel();
    $('#stI', o).innerHTML = playing ? '<path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/>' : '<path d="M8 5l11 7-11 7z"/>';
    if (playing) speak();
  };
  window.speechSynthesis?.cancel();
  setTimeout(speak, 1500);
}

/* Lesson reader */
function openLesson(id) {
  const course = isSteady(id) ? LULL.steady : LULL.lessons;
  const l = course.find((x) => x.id === id), n = course.indexOf(l) + 1;
  const toolBtn = { pause: ['Try the Pause tool', 'pause'], surf: ['Practise an urge surf', 'surf'], mindful: ['Try a mindful bite', 'mindful'], breathe: ['1-minute Quick reset', 'breath:sigh:1'], sleep: ['Go to Sleep', 'tab:sleep'], journey: ['Open Journey', 'tab:journey'] }[l.tool];
  const o = openOverlay(`<div class="ov-top">${closeBtn()}<span class="pill">${course === LULL.steady ? 'Steady · ' : ''}Day ${n} of ${course.length}</span><span style="width:42px"></span></div>
    <div class="ov-body top fadein"><h2>${esc(l.title)}</h2><p class="faint" style="margin-top:6px">${l.mins} min read</p>
      <div class="lesson-body">${l.body.map((p) => `<p>${esc(p)}</p>`).join('')}</div>
      <div class="try"><b>Try this</b><p style="margin-top:6px">${esc(l.tryThis)}</p></div>
      <button class="btn primary block" id="lsDone" style="margin-top:22px">${S.lessonsDone.includes(id) ? 'Done' : 'Mark complete'}</button>
      <button class="btn block" id="lsTool" style="margin-top:10px">${toolBtn[0]}</button></div>`);
  const complete = () => { if (!S.lessonsDone.includes(id)) { S.lessonsDone.push(id); logSession('lesson', id, l.mins); save(); toast(`Day ${n} complete ✨`); } };
  $('#lsDone', o).onclick = () => { complete(); closeOverlay(); };
  $('#lsTool', o).onclick = () => { complete(); closeOverlay(); const [a, ...args] = toolBtn[1].split(':'); actions[a](...args); };
}

/* ================================================================
   JOURNEY (insights)
   ================================================================ */
function insights() {
  const out = [];
  const cr = S.cravings.filter((c) => !c.practice);
  if (cr.length >= 3) {
    const buckets = new Array(8).fill(0); cr.forEach((c) => buckets[Math.floor(new Date(c.ts).getHours() / 3)]++);
    const max = buckets.indexOf(Math.max(...buckets));
    out.push(['⏰', `Your cravings peak between <b>${pad(max * 3)}:00 and ${pad(max * 3 + 3)}:00</b>. Plan a swap or a snack before then.`]);
    const counts = {}; cr.forEach((c) => (c.needs || []).forEach((n) => (counts[n] = (counts[n] || 0) + 1)));
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    if (top) out.push(['🧭', `Most common need behind a craving: <b>${NEEDS.find((x) => x[0] === top[0])[1].toLowerCase()}</b> (${top[1]}×). Food can't fix that one; try the matching swaps.`]);
  }
  const withDrop = S.cravings.filter((c) => c.after != null);
  if (withDrop.length >= 2) { const avg = withDrop.reduce((a, c) => a + (c.urge - c.after), 0) / withDrop.length; if (avg > 0) out.push(['🌊', `Urge surfing lowers your cravings by <b>${avg.toFixed(1)} points</b> on average. The wave really does pass.`]); }
  // sleep vs cravings
  const nights = S.sleep.map((s) => ({ h: sleepHours(s), n: cr.filter((c) => dk(new Date(c.ts)) === s.date).length }));
  const short = nights.filter((x) => x.h < 7), good = nights.filter((x) => x.h >= 7);
  if (short.length >= 2 && good.length >= 2) {
    const a = short.reduce((s, x) => s + x.n, 0) / short.length, b = good.reduce((s, x) => s + x.n, 0) / good.length;
    out.push(['😴', a > b ? `After nights under 7 hours you have <b>${a.toFixed(1)}</b> cravings a day, vs <b>${b.toFixed(1)}</b> after a full night. Sleep is your secret weapon.` : `Your cravings don't seem to follow your sleep so far. Keep logging to be sure.`]);
  }
  const br = S.sessions.filter((s) => s.kind === 'breathe' && s.moodAfter);
  if (br.length >= 2) out.push(['🫧', `After breathing sessions you rate yourself <b>${(br.reduce((a, s) => a + s.moodAfter, 0) / br.length).toFixed(1)}/5</b> on average.`]);
  return out;
}
function renderJourney() {
  const cr = S.cravings.filter((c) => !c.practice);
  const okRate = cr.length ? Math.round((cr.filter((c) => c.outcome !== 'ate').length / cr.length) * 100) : 0;
  const nights = S.sleep.slice().sort((a, b) => a.date.localeCompare(b.date));
  const avgSleep = nights.length ? nights.slice(-7).reduce((a, s) => a + sleepHours(s), 0) / Math.min(7, nights.length) : 0;
  const ins = insights();
  // cravings by time of day
  const buckets = new Array(8).fill(0); cr.forEach((c) => buckets[Math.floor(new Date(c.ts).getHours() / 3)]++);
  const bmax = Math.max(1, ...buckets);
  // mood last 14 days
  const moodDays = Array.from({ length: 14 }, (_, k) => { const d = daysAgo(13 - k), key = dk(d); const list = S.checkins.filter((c) => dk(new Date(c.ts)) === key); return { d, v: list.length ? list.reduce((a, c) => a + c.mood, 0) / list.length : 0 }; });
  const moodCol = (v) => ['#ff8aa8', '#ffb38a', '#ffd88a', '#a9e0a0', '#7fe0c3'][Math.round(v) - 1] || 'transparent';
  // sleep last 7 nights
  const sleep7 = Array.from({ length: 7 }, (_, k) => { const d = daysAgo(6 - k); const s = S.sleep.find((x) => x.date === dk(d)); return { d, h: s ? sleepHours(s) : 0 }; });
  const needCounts = NEEDS.map(([id, label]) => [label, cr.filter((c) => (c.needs || []).includes(id)).length]);
  const nmax = Math.max(1, ...needCounts.map((x) => x[1]));
  const log = [
    ...S.cravings.map((c) => ({ ts: c.ts, ic: { passed: '🌤️', swapped: '🔄', mindful: '🍫', ate: '🫶', fed: '🥪' }[c.outcome] || '⏸️', t: c.practice ? 'Practice urge surf' : `Craving ${c.urge}/10${c.after != null ? ` → ${c.after}` : ''}`, s: [c.outcome === 'ate' ? 'Ate it, logged honestly' : c.outcome === 'passed' ? 'Urge passed' : c.outcome === 'swapped' ? `Swap: ${c.swap}` : c.outcome === 'mindful' ? 'Ate mindfully' : c.outcome === 'fed' ? 'Real hunger, ate a meal' : '', c.trigger].filter(Boolean).join(' · ') })),
    ...S.checkins.map((c) => ({ ts: c.ts, ic: MOODS[c.mood - 1], t: `Check-in · stress ${c.stress}/5`, s: [c.feelings?.join(', '), c.note].filter(Boolean).join(' · ') })),
    ...S.sessions.filter((s) => s.kind !== 'surf').map((s) => ({ ts: s.ts, ic: { breathe: '🫧', story: '🌙', lesson: '📖', mindful: '🍓' }[s.kind] || '✨', t: s.kind === 'breathe' ? `${LULL.patterns.find((p) => p.id === s.ref)?.name} · ${Math.max(1, Math.round(s.mins))} min` : s.kind === 'story' ? allStories().find((x) => x.id === s.ref)?.title : s.kind === 'lesson' ? `Lesson: ${allLessons().find((x) => x.id === s.ref)?.title}` : 'Mindful bite', s: '' })),
  ].sort((a, b) => b.ts - a.ts).slice(0, 25);

  return `
  <section class="hero"><h2>Your journey</h2><p>Patterns, not judgement. The more you log, the smarter this gets.</p></section>
  <div class="stats">
    <div class="stat"><b>${cr.length}</b><span>cravings paused</span></div>
    <div class="stat"><b>${cr.length ? okRate + '%' : '–'}</b><span>handled on purpose</span></div>
    <div class="stat"><b>${avgSleep ? avgSleep.toFixed(1) + 'h' : '–'}</b><span>avg sleep (7 nights)</span></div>
  </div>

  <div class="section-title"><h3>What Lull has noticed</h3></div>
  <div class="card stack">${ins.length ? ins.map(([ic, t]) => `<div class="insight"><span class="ic">${ic}</span><p>${t}</p></div>`).join('') : `<div class="empty"><span class="e">🔭</span>Use Pause a few times, log your sleep and check in. Personal insights show up here, like how your sleep affects your cravings.</div>`}</div>

  <button class="card sos-card insights90" data-act="insights90" style="margin-top:12px">
    <span class="ring" style="background:rgba(156,140,242,.22)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg></span>
    <div><h3>90-day insights ${proBadge()}</h3><p class="muted small">Three months of sleep, mood and cravings side by side, with the trends that matter.</p></div></button>

  <div class="section-title"><h3>Mood · last 14 days</h3></div>
  <div class="card"><div class="bars">${moodDays.map((m) => `<div class="bar"><i style="height:0;background:${m.v ? moodCol(m.v) : 'var(--card-hi)'}" data-h="${m.v ? (m.v / 5) * 100 : 3}%"></i><small>${m.d.toLocaleDateString('en-ZA', { weekday: 'narrow' })}</small></div>`).join('')}</div></div>

  <div class="section-title"><h3>Sleep · last 7 nights</h3></div>
  <div class="card"><div class="bars">${sleep7.map((s) => `<div class="bar"><small style="color:var(--muted)">${s.h ? s.h.toFixed(1) : ''}</small><i style="height:0;background:linear-gradient(180deg,${s.h >= 7 ? 'var(--sky)' : 'var(--peach)'},rgba(143,182,255,.25))" data-h="${s.h ? Math.min(100, (s.h / 10) * 100) : 3}%"></i><small>${s.d.toLocaleDateString('en-ZA', { weekday: 'short' }).slice(0, 2)}</small></div>`).join('')}</div>
    <p class="faint" style="margin-top:8px"><span style="color:var(--sky)">■</span> 7h+ &nbsp; <span style="color:var(--peach)">■</span> under 7h</p></div>

  <div class="section-title"><h3>When cravings hit</h3></div>
  <div class="card"><div class="bars">${buckets.map((b, i) => `<div class="bar"><small style="color:var(--muted)">${b || ''}</small><i style="height:0;background:linear-gradient(180deg,var(--rose),rgba(255,159,184,.25))" data-h="${b ? (b / bmax) * 100 : 3}%"></i><small>${pad(i * 3)}h</small></div>`).join('')}</div></div>

  <div class="section-title"><h3>What's underneath</h3></div>
  <div class="card">${needCounts.map(([l, n]) => `<div class="hbar"><div class="lbl"><span>${l}</span><span class="muted">${n}</span></div><div class="progress"><i style="width:0;background:linear-gradient(90deg,var(--rose),var(--lav))" data-w="${(n / nmax) * 100}%"></i></div></div>`).join('')}</div>

  <div class="section-title"><h3>Recent</h3></div>
  <div class="card">${log.length ? log.map((x) => `<div class="log-item"><span class="ic">${x.ic}</span><div><b style="font-weight:500">${esc(x.t)}</b><br><small>${fmtDay(x.ts)} · ${fmtTime(x.ts)}${x.s ? ' · ' + esc(x.s) : ''}</small></div></div>`).join('') : '<div class="empty"><span class="e">🌱</span>Nothing yet. Your story starts with one pause.</div>'}</div>`;
}

/* 90-day insights (Pro): three 30-day blocks and 13 weeks, side by side. */
function openInsights90() {
  const now = Date.now(), DAY = 86400000, start = now - 90 * DAY;
  const tsOfDate = (d) => new Date(d + 'T12:00').getTime();
  const cr = S.cravings.filter((c) => !c.practice && c.ts >= start);
  const ci = S.checkins.filter((c) => c.ts >= start);
  const sl = S.sleep.filter((s) => tsOfDate(s.date) >= start);
  const se = S.sessions.filter((s) => s.ts >= start);
  const block = (ts) => Math.min(2, Math.floor((ts - start) / (30 * DAY)));
  const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
  const blocks = [0, 1, 2].map((b) => ({
    cravings: cr.filter((c) => block(c.ts) === b).length,
    handled: (() => { const l = cr.filter((c) => block(c.ts) === b); return l.length ? Math.round((l.filter((c) => c.outcome !== 'ate').length / l.length) * 100) : null; })(),
    sleep: avg(sl.filter((s) => block(tsOfDate(s.date)) === b).map(sleepHours)),
    quality: avg(sl.filter((s) => block(tsOfDate(s.date)) === b).map((s) => s.q)),
    mood: avg(ci.filter((c) => block(c.ts) === b).map((c) => c.mood)),
    stress: avg(ci.filter((c) => block(c.ts) === b).map((c) => c.stress)),
    calm: Math.round(se.filter((s) => block(s.ts) === b).reduce((a, s) => a + (s.mins || 0), 0)),
  }));
  const weeks = Array.from({ length: 13 }, (_, w) => { const a = now - (13 - w) * 7 * DAY, z = a + 7 * DAY; return { a, n: cr.filter((c) => c.ts >= a && c.ts < z).length, h: avg(sl.filter((s) => { const t = tsOfDate(s.date); return t >= a && t < z; }).map(sleepHours)) }; });
  const wmax = Math.max(1, ...weeks.map((w) => w.n));
  const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], WDL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const byWd = WD.map((_, i) => ({ n: cr.filter((c) => new Date(c.ts).getDay() === i).length, m: avg(ci.filter((c) => new Date(c.ts).getDay() === i).map((c) => c.mood)) }));
  const wdMax = Math.max(1, ...byWd.map((x) => x.n));
  const fmt = (v, d = 1, u = '') => (v == null ? '–' : v.toFixed(d) + u);
  const label = ['Days 1–30', 'Days 31–60', 'Days 61–90'];

  const notes = [];
  const [f, , l] = blocks;
  if (f.cravings >= 3 && l.cravings >= 0 && cr.length >= 6) {
    const ch = Math.round(((l.cravings - f.cravings) / f.cravings) * 100);
    notes.push(ch < 0 ? `Cravings are <b>down ${-ch}%</b> from your first 30 days to your last 30. The loop is loosening.` : ch > 0 ? `Cravings are <b>up ${ch}%</b> on your first 30 days. A tough stretch; your Steady plan and Pause are there for it.` : 'Your cravings have held steady over three months.');
  }
  if (f.sleep != null && l.sleep != null) notes.push(`Average sleep went from <b>${fmtDur(f.sleep * 60)}</b> to <b>${fmtDur(l.sleep * 60)}</b>.`);
  if (f.mood != null && l.mood != null && Math.abs(l.mood - f.mood) >= 0.2) notes.push(`Your mood check-ins are <b>${l.mood > f.mood ? 'higher' : 'lower'}</b> lately (${f.mood.toFixed(1)} → ${l.mood.toFixed(1)} out of 5).`);
  const worst = byWd.reduce((b, x, i) => (x.n > byWd[b].n ? i : b), 0);
  if (byWd[worst].n >= 3) notes.push(`<b>${WDL[worst]}</b> is your hardest day for cravings (${byWd[worst].n} in 90 days). Plan something kind for it.`);
  const moodDays = byWd.map((x, i) => [x.m, i]).filter((x) => x[0] != null);
  if (moodDays.length >= 3) { const best = moodDays.sort((a, b) => b[0] - a[0])[0]; notes.push(`You feel best on <b>${WDL[best[1]]}s</b> (average mood ${best[0].toFixed(1)}/5).`); }
  const sw = weeks.filter((w) => w.h != null);
  const shortW = sw.filter((w) => w.h < 7), goodW = sw.filter((w) => w.h >= 7);
  if (shortW.length >= 2 && goodW.length >= 2) { const a = avg(shortW.map((w) => w.n)), b = avg(goodW.map((w) => w.n)); notes.push(`In weeks you averaged under 7 hours you had <b>${a.toFixed(1)}</b> cravings, vs <b>${b.toFixed(1)}</b> in well-slept weeks.`); }

  const row = (name, key, d, u) => `<tr><td>${name}</td>${blocks.map((b) => `<td>${typeof b[key] === 'number' ? (d == null ? b[key] + (u || '') : b[key].toFixed(d) + (u || '')) : '–'}</td>`).join('')}</tr>`;
  openOverlay(`<div class="ov-top">${closeBtn()}<span class="pill">90-day insights</span><span style="width:42px"></span></div>
    <div class="ov-body top fadein" style="text-align:left">
      <h2>Your last 90 days</h2><p class="faint" style="margin-top:6px">${new Date(start).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })} to today · ${cr.length} cravings, ${sl.length} nights, ${ci.length} check-ins</p>
      <div class="card stack" style="margin-top:16px">${notes.length ? notes.map((t) => `<div class="insight"><span class="ic">•</span><p>${t}</p></div>`).join('') : '<div class="empty">Keep logging sleep, check-ins and cravings. Trends show up here once there are a few weeks to compare.</div>'}</div>
      <div class="section-title"><h3>Month by month</h3></div>
      <div class="card"><table class="tbl90"><thead><tr><th></th>${label.map((x) => `<th>${x}</th>`).join('')}</tr></thead><tbody>
        ${row('Cravings', 'cravings')}${row('Handled on purpose', 'handled', null, '%')}${row('Avg sleep', 'sleep', 1, 'h')}${row('Sleep quality', 'quality', 1, '/5')}${row('Mood', 'mood', 1, '/5')}${row('Stress', 'stress', 1, '/5')}${row('Calm minutes', 'calm')}
      </tbody></table></div>
      <div class="section-title"><h3>Cravings · 13 weeks</h3></div>
      <div class="card"><div class="bars">${weeks.map((w) => `<div class="bar"><small style="color:var(--muted)">${w.n || ''}</small><i style="height:0;background:linear-gradient(180deg,var(--rose),rgba(255,159,184,.25))" data-h="${w.n ? (w.n / wmax) * 100 : 3}%"></i><small>${new Date(w.a).getDate()}</small></div>`).join('')}</div>
        <p class="faint" style="margin-top:8px">Each bar is a week, labelled by its first day.</p></div>
      <div class="section-title"><h3>Sleep · 13 weeks</h3></div>
      <div class="card"><div class="bars">${weeks.map((w) => `<div class="bar"><small style="color:var(--muted)">${w.h ? w.h.toFixed(1) : ''}</small><i style="height:0;background:linear-gradient(180deg,${w.h >= 7 ? 'var(--sky)' : 'var(--peach)'},rgba(143,182,255,.25))" data-h="${w.h ? Math.min(100, (w.h / 10) * 100) : 3}%"></i><small>${new Date(w.a).getDate()}</small></div>`).join('')}</div></div>
      <div class="section-title"><h3>By day of the week</h3></div>
      <div class="card"><div class="bars">${byWd.map((x, i) => `<div class="bar"><small style="color:var(--muted)">${x.n || ''}</small><i style="height:0;background:linear-gradient(180deg,var(--lav),rgba(156,140,242,.3))" data-h="${x.n ? (x.n / wdMax) * 100 : 3}%"></i><small>${WD[i].slice(0, 2)}</small></div>`).join('')}</div>
        <p class="faint" style="margin-top:8px">Cravings per weekday. Mood: ${byWd.map((x, i) => `${WD[i].slice(0, 2)} ${fmt(x.m)}`).join(' · ')}</p></div>
    </div>`);
  requestAnimationFrame(() => $$('#overlay [data-h]').forEach((el) => (el.style.height = el.dataset.h)));
}

/* ================================================================
   SETTINGS & ONBOARDING
   ================================================================ */
function openSettings() {
  openSheet(`<h2>Settings</h2>
    <label class="field"><span>Your name</span><input class="input" id="stName" value="${esc(S.name)}" placeholder="What should Lull call you?"></label>
    <label class="field"><span>Bedtime</span><input type="time" class="input" id="stBed" value="${S.bedtime}"></label>
    <div class="row between" style="margin-top:16px"><div><b>Read stories aloud</b><p class="faint">Uses your device's voice</p></div><label class="switch"><input type="checkbox" id="stVoice" ${S.settings.voice ? 'checked' : ''}><i></i></label></div>
    ${voices.length ? `<label class="field"><span>Story voice</span><select class="input" id="stVoiceName"><option value="">Automatic</option>${voices.map((v) => `<option ${v.name === S.settings.voiceName ? 'selected' : ''}>${esc(v.name)}</option>`).join('')}</select></label>` : ''}
    <div class="row between" style="margin-top:16px"><div><b>Soft chime</b></div><label class="switch"><input type="checkbox" id="stChime" ${S.settings.chime ? 'checked' : ''}><i></i></label></div>
    <div class="row between" style="margin-top:12px"><div><b>Vibration</b></div><label class="switch"><input type="checkbox" id="stHap" ${S.settings.haptics ? 'checked' : ''}><i></i></label></div>
    <button class="btn primary block" id="stSave" style="margin-top:18px">Save</button>

    <button class="card pro-row" id="proRow" data-act="pro" style="margin-top:22px">
      <div><b>NextWave Pro</b><p class="faint">${isPro() ? 'Lull Pro is unlocked on this device. Thank you.' : 'Extra stories, signature mixes, the Steady course and 90-day insights. R79 once-off.'}</p></div>
      <span class="link">${isPro() ? 'Manage' : 'Get Pro'}</span></button>

    <div class="card help" style="margin-top:12px"><b>🧡 If you're struggling</b>
      <p class="muted small" style="margin-top:6px">Lull is a self-help tool, not a treatment. If eating feels out of control, or you're feeling low for a long time, please talk to a doctor, psychologist or dietitian.</p>
      <p class="small" style="margin-top:8px">SADAG helpline: <a href="tel:0800456789" class="link">0800 456 789</a><br>Suicide crisis line: <a href="tel:0800567567" class="link">0800 567 567</a><br><a href="https://www.sadag.org" target="_blank" rel="noopener" class="link">sadag.org</a></p></div>

    <div class="card" style="margin-top:12px"><b>Your data</b><p class="faint">Everything stays on this device. No account, no tracking.</p>
      <div class="row" style="margin-top:12px;flex-wrap:wrap"><button class="btn sm" id="stExp">Export backup</button><label class="btn sm">Import<input type="file" id="stImp" accept=".json" hidden></label><button class="btn sm" id="stWipe" style="color:var(--rose)">Erase all</button></div></div>`, () => {
    $('#stSave').onclick = () => {
      S.name = $('#stName').value.trim(); S.bedtime = $('#stBed').value || '22:30';
      S.settings.voice = $('#stVoice').checked; S.settings.chime = $('#stChime').checked; S.settings.haptics = $('#stHap').checked;
      if ($('#stVoiceName')) S.settings.voiceName = $('#stVoiceName').value;
      save(); closeSheet(); rerender(); toast('Saved');
    };
    $('#stExp').onclick = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' })); a.download = `lull-backup-${dk()}.json`; a.click(); };
    $('#stImp').onchange = async (e) => { try { const d = JSON.parse(await e.target.files[0].text()); if (!d.checkins) throw 0; S = Object.assign(defaults(), d); save(); closeSheet(); go(tab); toast('Backup restored'); } catch { toast('That file did not look like a Lull backup'); } };
    $('#stWipe').onclick = () => { if (confirm('Erase all Lull data on this device? This cannot be undone.')) { localStorage.removeItem(KEY); location.reload(); } };
  });
}
$('#settingsBtn').onclick = openSettings;

function onboarding() {
  const st = { step: 0, name: '', goals: [], bedtime: '22:30' };
  const GOALS = [['eating', '🍫', 'Stress eating', 'Cravings when I\'m stressed, bored or tired'], ['stress', '🌪️', 'Stress & anxiety', 'A busy mind that won\'t settle'], ['sleep', '🌙', 'Sleep', 'Falling asleep or staying asleep']];
  const o = openOverlay('<div class="ov-body" id="ob"></div>');
  const draw = () => {
    const b = $('#ob', o);
    if (st.step === 0) b.innerHTML = `<div class="fadein"><div class="orb-wrap" style="--orb:#a99cff;width:200px;margin-bottom:10px"><span class="halo"></span><div class="orb" style="transform:scale(.7);animation:miniBreathe 6s ease-in-out infinite"></div></div>
      <h2>Welcome to Lull</h2><p class="lead">A calmer mind, fewer stress cravings and better sleep. Free, private, and it works offline.</p>
      <button class="btn primary block" data-n style="margin-top:28px">Let's begin</button></div>`;
    if (st.step === 1) b.innerHTML = `<div class="fadein" style="width:100%"><h2>What brings you here?</h2><p class="lead">Pick any. Lull adapts to you.</p>
      ${GOALS.map(([id, ic, t, s]) => `<button class="choice ${st.goals.includes(id) ? 'on' : ''}" data-g="${id}" style="${st.goals.includes(id) ? 'border-color:var(--lav);background:rgba(169,156,255,.18)' : ''}"><span class="ic">${ic}</span><div><b>${t}</b><small>${s}</small></div></button>`).join('')}
      <button class="btn primary block" data-n style="margin-top:22px">Next</button></div>`;
    if (st.step === 2) b.innerHTML = `<div class="fadein" style="width:100%;text-align:left"><h2>A couple of basics</h2>
      <label class="field"><span>What should we call you?</span><input class="input" id="obN" value="${esc(st.name)}" placeholder="Your first name"></label>
      <label class="field"><span>When would you like to be asleep?</span><input type="time" class="input" id="obB" value="${st.bedtime}"></label>
      <p class="faint" style="margin-top:8px">We'll nudge your wind-down in the app around then.</p>
      <button class="btn primary block" data-n style="margin-top:22px">Start</button></div>`;
  };
  o.onclick = (e) => {
    const g = e.target.closest('[data-g]');
    if (g) {
      const id = g.dataset.g, on = !st.goals.includes(id);
      st.goals = on ? [...st.goals, id] : st.goals.filter((x) => x !== id); buzz(8);
      g.style.borderColor = on ? 'var(--lav)' : ''; g.style.background = on ? 'rgba(169,156,255,.18)' : '';
      return;
    }
    if (e.target.closest('[data-n]')) {
      if (st.step === 2) {
        S.name = $('#obN').value.trim(); S.bedtime = $('#obB').value || '22:30'; S.goals = st.goals; S.onboarded = true; save();
        o.onclick = null; closeOverlay(); toast(S.name ? `Welcome, ${S.name} 🌙` : 'Welcome 🌙'); return;
      }
      st.step++; buzz(10); draw();
    }
  };
  draw();
}

/* ---------- now-playing bar ---------- */
function updateNP() {
  const act = Sound.active(); const np = $('#nowPlaying');
  np.hidden = !act.length;
  if (act.length) $('#npText').textContent = act.map((id) => LULL.sounds.find((s) => s.id === id).name).join(' + ') + (timerEnds ? ` · until ${fmtTime(timerEnds)}` : '');
  if (!act.length) { timerEnds = 0; timerMins = 0; }
}
Sound.onChange(() => { updateNP(); if (!Sound.active().length && tab === 'sleep' && $('#overlay').hidden) rerender(); });
$('#nowPlaying').onclick = (e) => { if (e.target.id === 'npStop') { Sound.stopAll(); updateNP(); if (tab === 'sleep') rerender(); } else go('sleep'); };

/* ---------- sparkles ---------- */
function sparkle(host) {
  const colors = ['#a99cff', '#7fe0c3', '#ffc59e', '#ff9fb8', '#8fb6ff', '#fff'];
  for (let i = 0; i < 28; i++) {
    const s = document.createElement('span');
    const a = Math.random() * Math.PI * 2, d = 80 + Math.random() * 160;
    s.style.cssText = `position:fixed;left:50%;top:38%;width:${4 + Math.random() * 6}px;height:${4 + Math.random() * 6}px;border-radius:50%;background:${colors[i % colors.length]};pointer-events:none;z-index:70;box-shadow:0 0 10px currentColor;`;
    host.appendChild(s);
    s.animate([{ transform: 'translate(-50%,-50%) scale(1)', opacity: 1 }, { transform: `translate(calc(-50% + ${Math.cos(a) * d}px), calc(-50% + ${Math.sin(a) * d}px)) scale(0)`, opacity: 0 }], { duration: 1200 + Math.random() * 800, easing: 'cubic-bezier(.2,.8,.2,1)' }).onfinish = () => s.remove();
  }
}

/* ---------- twinkling sky ---------- */
(function sky() {
  const c = $('#stars'), g = c.getContext('2d');
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  let stars = [], shoot = null;
  const fit = () => {
    c.width = innerWidth * dpr; c.height = innerHeight * dpr;
    stars = Array.from({ length: Math.round((innerWidth * innerHeight) / 9000) }, () => ({ x: Math.random() * c.width, y: Math.random() * c.height * 0.85, r: (Math.random() * 1.1 + 0.3) * dpr, p: Math.random() * 6.28, s: 0.5 + Math.random() * 1.5 }));
  };
  fit(); addEventListener('resize', fit);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function frame(t) {
    if (!document.hidden) {
      g.clearRect(0, 0, c.width, c.height);
      for (const s of stars) { const a = 0.35 + 0.5 * Math.sin(s.p + t / 1000 * s.s) ** 2; g.globalAlpha = a; g.beginPath(); g.arc(s.x, s.y, s.r, 0, 6.28); g.fillStyle = '#fff'; g.fill(); }
      if (!shoot && Math.random() < 0.002) shoot = { x: Math.random() * c.width * 0.7, y: Math.random() * c.height * 0.3, l: 0 };
      if (shoot) {
        shoot.l += 0.02; const len = 120 * dpr, x = shoot.x + shoot.l * 400 * dpr, y = shoot.y + shoot.l * 160 * dpr;
        const gr = g.createLinearGradient(x, y, x - len, y - len * 0.4); gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
        g.globalAlpha = 1 - shoot.l; g.strokeStyle = gr; g.lineWidth = 1.5 * dpr; g.beginPath(); g.moveTo(x, y); g.lineTo(x - len, y - len * 0.4); g.stroke();
        if (shoot.l >= 1) shoot = null;
      }
      g.globalAlpha = 1;
    }
    if (!reduce) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();

/* ---------- boot ---------- */
go('today');
if (!S.onboarded) onboarding();
if (location.hash === '#pause') openPause();
if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
})();
