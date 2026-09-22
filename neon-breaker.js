/* Neon Breaker: Reactor Run — simulation is DOM-free and shared with tests. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.NeonBreaker = api;
})(typeof window === 'undefined' ? globalThis : window, function () {
  'use strict';
  const W = 720, H = 590, PY = 532, R = 9;
  const LEVELS = [
    { name: 'IGNITION', hint: 'Find your angle. Open a path through the wall.', speed: 335, par: 65, rows: ['........','..1111..','.111111.','11111111','.11CC11.'] },
    { name: 'SPLIT CURRENT', hint: 'Slip around the armor. The sides are your way in.', speed: 350, par: 80, rows: ['11....11','12.11.21','12.CC.21','11.11.11','.111111.'] },
    { name: 'CHAIN REACTION', hint: 'Orange cores detonate. Make every shot count.', speed: 365, par: 90, rows: ['..1221..','.12CC21.','12C11C21','.121121.','..1111..'] },
    { name: 'THE VAULT', hint: 'Charge a pulse to punch through layered armor.', speed: 380, par: 100, rows: ['22222222','211CC112','21.22.12','21111112','.222222.'] },
    { name: 'LAST LIGHT', hint: 'A narrow opening. One final reactor to bring down.', speed: 395, par: 115, rows: ['..2222..','.22CC22.','22C22C22','12.22.21','111CC111','.111111.'] }
  ];
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  function makeBricks(level) {
    return LEVELS[level].rows.flatMap((row, y) => [...row].flatMap((t, x) => t === '.' ? [] : [{ x: 44 + x * 80, y: 95 + y * 36, w: 72, h: 26, hp: t === '2' ? 2 : 1, max: t === '2' ? 2 : 1, core: t === 'C', flash: 0, alive: true }]));
  }
  function createState(level = 0) {
    return { level: clamp(level, 0, 4), mode: 'ready', paddle: W / 2, width: 112, ball: { x: W / 2, y: PY - 14, vx: 0, vy: 0 }, aim: -.25,
      bricks: makeBricks(clamp(level, 0, 4)), lives: 3, score: 0, combo: 0, maxCombo: 0, energy: 0, pulse: 0, elapsed: 0, misses: 0, broken: 0, hits: 0, upgrades: [], events: [], speedScale: 1, stageScore: 0, campaign: level === 0, totalTime: 0, clears: [] };
  }
  function emit(s, type, extra = {}) { s.events.push({ type, ...extra }); }
  function serve(s) {
    if (s.mode !== 'ready') return;
    const speed = LEVELS[s.level].speed * s.speedScale;
    s.ball.vx = Math.sin(s.aim) * speed; s.ball.vy = -Math.cos(s.aim) * speed;
    s.mode = 'playing'; emit(s, 'launch');
  }
  function pulse(s) {
    if (s.mode !== 'playing' || s.energy < 6) return false;
    s.energy = 0; s.pulse = 4; emit(s, 'pulse'); return true;
  }
  function hitBrick(s, b, chain = false) {
    if (!b.alive) return;
    b.hp -= s.pulse > 0 || chain ? 2 : 1; b.flash = .12;
    if (b.hp > 0) { emit(s, 'armor', { x: b.x + b.w / 2, y: b.y + b.h / 2 }); return; }
    b.alive = false; s.broken++; s.combo++; s.maxCombo = Math.max(s.maxCombo, s.combo);
    s.energy = Math.min(6, s.energy + 1);
    const gain = (b.core ? 150 : b.max === 2 ? 100 : 60) * Math.min(5, 1 + Math.floor((s.combo - 1) / 3));
    s.score += gain; emit(s, 'break', { x: b.x + b.w / 2, y: b.y + b.h / 2, core: b.core, gain, combo: s.combo });
    if (b.core) {
      emit(s, 'core', { x: b.x + b.w / 2, y: b.y + b.h / 2 });
      for (const other of s.bricks) if (other.alive && Math.hypot(other.x - b.x, other.y - b.y) < 91) hitBrick(s, other, true);
    }
  }
  function clearStage(s) {
    s.mode = 'clear';
    const timeBonus = Math.max(0, Math.round((LEVELS[s.level].par - s.elapsed) * 20));
    const medal = s.misses === 0 && s.elapsed <= LEVELS[s.level].par ? 3 : s.misses === 0 || s.elapsed <= LEVELS[s.level].par ? 2 : 1;
    const bonus = 500 + timeBonus + (s.misses === 0 ? 500 : 0);
    s.score += bonus; s.clears.push({ level: s.level, medal, seconds: Math.round(s.elapsed), bonus });
    emit(s, 'clear', { medal, bonus, timeBonus });
  }
  function nextStage(s, upgrade) {
    if (s.mode !== 'clear' || s.level >= 4) return false;
    if (upgrade === 'wide') { s.width = Math.min(172, s.width + 15); s.upgrades.push('wide'); }
    else if (upgrade === 'control') { s.speedScale = Math.max(.76, s.speedScale - .06); s.upgrades.push('control'); }
    else return false;
    s.level++; s.bricks = makeBricks(s.level); s.mode = 'ready'; s.elapsed = 0; s.misses = 0; s.combo = 0; s.pulse = 0; s.stageScore = s.score;
    s.lives = Math.min(5, s.lives + 1); s.paddle = W / 2; s.ball = { x: W / 2, y: PY - 14, vx: 0, vy: 0 }; emit(s, 'stage'); return true;
  }
  // Small fixed steps keep the fastest ball from traversing a brick in one step.
  function step(s, dt, input = {}) {
    if (!['ready', 'playing'].includes(s.mode)) return;
    if (Number.isFinite(input.target)) s.paddle = input.target;
    if (input.direction) s.paddle += input.direction * 620 * dt;
    s.paddle = clamp(s.paddle, 23 + s.width / 2, W - 23 - s.width / 2);
    if (s.mode === 'ready') { s.ball.x = s.paddle; s.ball.y = PY - 14; return; }
    s.elapsed += dt; s.totalTime += dt; s.pulse = Math.max(0, s.pulse - dt);
    for (const b of s.bricks) b.flash = Math.max(0, b.flash - dt);
    const ball = s.ball, px = ball.x, py = ball.y;
    ball.x += ball.vx * dt; ball.y += ball.vy * dt;
    if (ball.x < 23 + R) { ball.x = 23 + R; ball.vx = Math.abs(ball.vx); emit(s, 'wall'); }
    if (ball.x > W - 23 - R) { ball.x = W - 23 - R; ball.vx = -Math.abs(ball.vx); emit(s, 'wall'); }
    if (ball.y < 43 + R) { ball.y = 43 + R; ball.vy = Math.abs(ball.vy); emit(s, 'wall'); }
    if (ball.vy > 0 && py + R <= PY + 2 && ball.y + R >= PY && ball.x >= s.paddle - s.width / 2 - R && ball.x <= s.paddle + s.width / 2 + R) {
      ball.y = PY - R; const angle = clamp((ball.x - s.paddle) / (s.width / 2), -.95, .95) * 1.12;
      const speed = Math.min(510, (LEVELS[s.level].speed + Math.min(s.hits * 2, 60)) * s.speedScale);
      ball.vx = Math.sin(angle) * speed; ball.vy = -Math.cos(angle) * speed;
      s.combo = 0; s.hits++; emit(s, 'paddle', { x: ball.x, y: PY });
    }
    for (const b of s.bricks) {
      if (!b.alive || ball.x + R <= b.x || ball.x - R >= b.x + b.w || ball.y + R <= b.y || ball.y - R >= b.y + b.h) continue;
      const pierce = s.pulse > 0;
      hitBrick(s, b);
      if (!pierce) {
        if (px + R <= b.x && ball.vx > 0) { ball.x = b.x - R; ball.vx = -Math.abs(ball.vx); }
        else if (px - R >= b.x + b.w && ball.vx < 0) { ball.x = b.x + b.w + R; ball.vx = Math.abs(ball.vx); }
        else if (py + R <= b.y && ball.vy > 0) { ball.y = b.y - R; ball.vy = -Math.abs(ball.vy); }
        else if (py - R >= b.y + b.h && ball.vy < 0) { ball.y = b.y + b.h + R; ball.vy = Math.abs(ball.vy); }
        else { ball.y = ball.vy > 0 ? b.y - R : b.y + b.h + R; ball.vy *= -1; }
        break;
      }
    }
    if (s.bricks.every(b => !b.alive)) { clearStage(s); return; }
    if (ball.y > H + R) {
      s.lives--; s.misses++; s.combo = 0; s.pulse = 0; s.energy = Math.max(0, s.energy - 2);
      s.mode = s.lives > 0 ? 'ready' : 'over'; ball.x = s.paddle; ball.y = PY - 14; ball.vx = 0; ball.vy = 0;
      emit(s, 'miss');
    }
  }
  function mount({ stage, controls, status, best, record }) {
    const doc = stage.ownerDocument;
    let data = { best: 0, unlocked: 0, medals: [0, 0, 0, 0, 0], muted: false };
    try { const old = JSON.parse(localStorage.getItem('marveto-breaker-v2')); if (old) data = { best: Math.max(0, Number(old.best) || 0), unlocked: clamp(Number(old.unlocked) || 0, 0, 4), medals: Array.from({ length: 5 }, (_, i) => clamp(Number(old.medals?.[i]) || 0, 0, 3)), muted: old.muted === true }; } catch {}
    let storageFailed = false;
    function save() { try { localStorage.setItem('marveto-breaker-v2', JSON.stringify(data)); } catch { storageFailed = true; } }
    stage.classList.add('reactor-stage'); stage.innerHTML = '<canvas class="reactor-canvas" aria-label="Neon Breaker reactor game. Move using mouse, drag, or arrow keys. Launch with Space. Pulse with E."></canvas><div class="reactor-ui"></div>';
    const canvas = stage.querySelector('canvas'), ctx = canvas.getContext('2d'), ui = stage.querySelector('.reactor-ui');
    canvas.width = W * 2; canvas.height = H * 2;
    controls.classList.add('reactor-controls'); controls.innerHTML = '<button data-action="left" aria-label="Move paddle left">←</button><button data-action="launch">Launch <kbd>SPACE</kbd></button><button data-action="pulse" disabled>Pulse <kbd>E</kbd></button><button data-action="right" aria-label="Move paddle right">→</button><button data-action="pause" aria-label="Pause game">Ⅱ</button><button data-action="sound" aria-label="Mute sound" aria-pressed="false">Sound on</button>';
    const buttons = Object.fromEntries([...controls.querySelectorAll('[data-action]')].map(b => [b.dataset.action, b]));
    const listeners = [], keys = new Set(); let state = createState(), mode = 'menu', previousMode = 'ready', disposed = false, raf = 0, last = 0, accumulator = 0, pointer = null, particles = [], rings = [], floats = [], trail = [], shake = 0, age = 0, audio = null, lastSound = 0;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    function on(el, type, fn, opts) { el.addEventListener(type, fn, opts); listeners.push(() => el.removeEventListener(type, fn, opts)); }
    function unlockAudio() { if (data.muted) return; try { if (!audio) audio = new (window.AudioContext || window.webkitAudioContext)(); if (audio.state === 'suspended') audio.resume().catch(() => {}); } catch {} }
    function tone(freq, duration = .06, type = 'sine', volume = .045, end = freq) {
      if (!audio || data.muted || audio.state !== 'running') return;
      const now = audio.currentTime; if (now - lastSound < .018) return; lastSound = now;
      const o = audio.createOscillator(), g = audio.createGain(); o.type = type; o.frequency.setValueAtTime(freq, now); o.frequency.exponentialRampToValueAtTime(Math.max(20, end), now + duration); g.gain.setValueAtTime(volume, now); g.gain.exponentialRampToValueAtTime(.001, now + duration); o.connect(g); g.connect(audio.destination); o.start(); o.stop(now + duration);
    }
    function soundLabel() { buttons.sound.textContent = data.muted ? 'Sound off' : 'Sound on'; buttons.sound.setAttribute('aria-label', data.muted ? 'Enable sound' : 'Mute sound'); buttons.sound.setAttribute('aria-pressed', String(data.muted)); }
    function panel(html) { ui.innerHTML = `<div class="reactor-panel">${html}</div>`; ui.hidden = false; }
    function menu() {
      mode = 'menu'; panel(`<span class="reactor-kicker">MARVETO ARCADE / 01</span><h2>NEON<br><em>BREAKER</em></h2><p class="reactor-subtitle">R E A C T O R &nbsp; R U N</p><p>Find the angle. Crack the core.<br>Five chambers. One clean run.</p><button class="reactor-primary" data-do="start">Enter the reactor <span>↗</span></button><div class="reactor-chambers" aria-label="Practice unlocked chambers">${LEVELS.map((l, i) => `<button data-level="${i}" ${i > data.unlocked ? 'disabled' : ''} aria-label="Practice chamber ${i + 1}: ${l.name}"><b>${String(i + 1).padStart(2, '0')}</b><small>${i > data.unlocked ? 'LOCKED' : data.medals[i] ? '★'.repeat(data.medals[i]) : 'OPEN'}</small></button>`).join('')}</div><small class="reactor-fine">MOVE: MOUSE / DRAG / ← → &nbsp; · &nbsp; LAUNCH: SPACE<br>Break six bricks to charge a piercing pulse. Press E to fire.</small>`);
    }
    function begin(level = 0) { state = createState(level); mode = 'game'; pointer = null; particles = []; trail = []; floats = []; rings = []; ui.hidden = true; ui.innerHTML = ''; keys.clear(); accumulator = 0; unlockAudio(); }
    function finishRun() { if (state.campaign) { data.best = Math.max(data.best, state.score); save(); record(state.score); } best.textContent = `Run best: ${data.best.toLocaleString()}`; }
    function pause() {
      if (mode !== 'game' || !['ready', 'playing'].includes(state.mode)) return;
      previousMode = state.mode; state.mode = 'paused'; keys.clear(); pointer = null; mode = 'paused';
      panel('<span class="reactor-kicker">TAKE A BREATHER</span><h2>PAUSED</h2><p>Your run is right where you left it.</p><button class="reactor-primary" data-do="resume">Back to the reactor →</button><button class="reactor-secondary" data-do="menu">End run</button>');
    }
    function resume() { if (mode !== 'paused') return; state.mode = previousMode; mode = 'game'; ui.hidden = true; accumulator = 0; last = performance.now(); unlockAudio(); }
    function burst(x, y, color, count = 12) { if (reduced) count = 3; for (let i = 0; i < count; i++) { const a = Math.random() * Math.PI * 2, speed = 45 + Math.random() * 150; particles.push({ x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, life: .35 + Math.random() * .3, max: .65, color }); } if (particles.length > 200) particles.splice(0, particles.length - 200); }
    function events() {
      for (const e of state.events.splice(0)) {
        if (e.type === 'break') { burst(e.x, e.y, e.core ? '#ffb56b' : '#81efcf'); floats.push({ x: e.x, y: e.y, text: `+${e.gain}`, life: .7 }); tone(330 + Math.min(e.combo, 12) * 44, .09, 'triangle', .04, 220); }
        if (e.type === 'armor') { burst(e.x, e.y, '#9dadd0', 5); tone(175, .06, 'square', .025, 110); }
        if (e.type === 'core') { rings.push({ x: e.x, y: e.y, life: .45 }); if (!reduced) shake = 5; tone(90, .18, 'sawtooth', .04, 30); }
        if (e.type === 'paddle') { burst(e.x, e.y, '#9affdf', 5); tone(270, .045, 'sine', .05, 400); }
        if (e.type === 'wall') tone(520, .025, 'sine', .012);
        if (e.type === 'launch') tone(200, .13, 'triangle', .05, 700);
        if (e.type === 'pulse') { rings.push({ x: state.ball.x, y: state.ball.y, life: .45 }); tone(100, .24, 'sawtooth', .035, 1000); }
        if (e.type === 'miss') { trail = []; tone(200, .25, 'triangle', .05, 40); if (state.mode === 'over') { finishRun(); mode = 'result'; panel(`<span class="reactor-kicker">RUN COMPLETE / CHAMBER ${state.level + 1}</span><h2>ONE MORE<br><em>RUN?</em></h2><div class="reactor-result">${state.score.toLocaleString()}<small>POINTS · BEST CHAIN ${state.maxCombo}</small></div><p>Aim with the paddle edges to reach the corners.<br>Save your pulse for armored clusters.</p><button class="reactor-primary" data-do="start">Try a fresh run ↗</button><button class="reactor-secondary" data-do="menu">Chamber select</button>`); } }
        if (e.type === 'clear') {
          trail = []; data.unlocked = Math.max(data.unlocked, Math.min(4, state.level + 1)); data.medals[state.level] = Math.max(data.medals[state.level], e.medal); save(); tone(660, .3, 'triangle', .05, 1320);
          mode = 'result';
          if (state.level === 4) { finishRun(); panel(`<span class="reactor-kicker">ALL FIVE CHAMBERS CLEARED</span><h2>LIGHTS<br><em>OUT.</em></h2><div class="reactor-result">${state.score.toLocaleString()}<small>${state.campaign ? 'FULL RUN' : 'PRACTICE RUN'} · BEST CHAIN ${state.maxCombo}</small></div><p>Reactor offline. Nicely done.<br>Come back for a cleaner, faster run.</p><button class="reactor-primary" data-do="start">Run it back ↗</button><button class="reactor-secondary" data-do="menu">Chamber select</button>`); }
          else panel(`<span class="reactor-kicker">CHAMBER ${state.level + 1} / ${LEVELS[state.level].name}</span><h2>CORE<br><em>CLEARED.</em></h2><div class="reactor-stars">${'★'.repeat(e.medal)}${'☆'.repeat(3 - e.medal)}</div><p>${Math.round(state.elapsed)} seconds · ${state.misses} misses · +${e.bonus} bonus<br>+1 life restored. Choose your next upgrade.</p><div class="reactor-upgrades"><button data-upgrade="wide"><b>WIDER PADDLE</b><span>+15 reach. More room for a save.</span></button><button data-upgrade="control"><b>MORE CONTROL</b><span>−6% ball speed. More time to aim.</span></button></div><small class="reactor-fine">Three stars: no misses and finish within ${LEVELS[state.level].par}s.<br>${storageFailed ? 'Storage unavailable — progress kept for this session.' : 'Chamber and medal saved on this device.'}</small>`);
        }
      }
    }
    on(ui, 'click', e => { const b = e.target.closest('button'); if (!b) return; unlockAudio(); if (b.dataset.do === 'start') begin(); if (b.dataset.do === 'resume') resume(); if (b.dataset.do === 'menu') { if (state.campaign && state.score) finishRun(); menu(); } if (b.dataset.level !== undefined) begin(Number(b.dataset.level)); if (b.dataset.upgrade && nextStage(state, b.dataset.upgrade)) { mode = 'game'; ui.hidden = true; pointer = null; accumulator = 0; particles = []; } });
    function launch() { if (mode === 'game') { unlockAudio(); serve(state); } }
    function firePulse() { if (mode === 'game') { unlockAudio(); pulse(state); } }
    on(buttons.launch, 'click', launch); on(buttons.pulse, 'click', firePulse); on(buttons.pause, 'click', () => mode === 'paused' ? resume() : pause());
    on(buttons.sound, 'click', () => { data.muted = !data.muted; save(); soundLabel(); if (!data.muted) unlockAudio(); });
    for (const dir of ['left', 'right']) { on(buttons[dir], 'pointerdown', e => { e.preventDefault(); pointer = null; keys.add(dir); buttons[dir].setPointerCapture(e.pointerId); }); for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) on(buttons[dir], type, () => keys.delete(dir)); }
    function point(e) { const box = canvas.getBoundingClientRect(), scale = Math.min(box.width / W, box.height / H), left = (box.width - W * scale) / 2; return clamp((e.clientX - box.left - left) / scale, 0, W); }
    on(canvas, 'pointermove', e => { if (mode === 'game') pointer = point(e); });
    on(canvas, 'pointerdown', e => { if (mode !== 'game') return; e.preventDefault(); pointer = point(e); step(state, 0, { target: pointer }); canvas.setPointerCapture(e.pointerId); unlockAudio(); if (e.pointerType === 'mouse') launch(); });
    on(canvas, 'pointerup', e => { if (e.pointerType !== 'mouse') launch(); });
    on(doc, 'keydown', e => {
      if (e.target.tagName === 'INPUT') return;
      if (['ArrowLeft', 'ArrowRight', 'a', 'd', ' ', 'e', 'E', 'p', 'P', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        if (e.target.tagName === 'BUTTON' && [' ', 'ArrowUp', 'ArrowDown'].includes(e.key) && mode !== 'game') return;
        e.preventDefault();
        if (['ArrowLeft', 'a'].includes(e.key)) { pointer = null; keys.add('left'); }
        if (['ArrowRight', 'd'].includes(e.key)) { pointer = null; keys.add('right'); }
        if (!e.repeat && e.key === ' ') launch(); if (!e.repeat && e.key.toLowerCase() === 'e') firePulse();
        if (!e.repeat && e.key.toLowerCase() === 'p') mode === 'paused' ? resume() : pause();
        if (state.mode === 'ready' && e.key === 'ArrowUp') state.aim = clamp(state.aim + .12, -.9, .9);
        if (state.mode === 'ready' && e.key === 'ArrowDown') state.aim = clamp(state.aim - .12, -.9, .9);
      }
    });
    on(doc, 'keyup', e => { if (['ArrowLeft', 'a'].includes(e.key)) keys.delete('left'); if (['ArrowRight', 'd'].includes(e.key)) keys.delete('right'); });
    on(window, 'blur', pause); on(doc, 'visibilitychange', () => { if (doc.hidden) pause(); });
    // The aim slider is available with touch, mouse, and keyboard.
    const aim = doc.createElement('label'); aim.className = 'reactor-aim'; aim.innerHTML = '<span>LAUNCH ANGLE</span><input aria-label="Launch angle" type="range" min="-90" max="90" value="-25"><span>↗</span>'; controls.before(aim);
    const tip = doc.createElement('p'); tip.className = 'reactor-tip'; controls.before(tip);
    const aimInput = aim.querySelector('input');
    on(aimInput, 'input', e => { state.aim = Number(e.target.value) / 100; });
    function rr(x, y, w, h, r, color) { ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill(); }
    function label(text, x, y, size, color, align = 'left', weight = 700) { ctx.fillStyle = color; ctx.font = `${weight} ${size}px ui-monospace, SFMono-Regular, Menlo, monospace`; ctx.textAlign = align; ctx.fillText(text, x, y); }
    function draw(dt) {
      ctx.setTransform(2, 0, 0, 2, 0, 0); ctx.clearRect(0, 0, W, H);
      const bg = ctx.createLinearGradient(0, 0, W, H); bg.addColorStop(0, '#182b35'); bg.addColorStop(.6, '#101d29'); bg.addColorStop(1, '#162d31'); ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
      ctx.save(); if (shake > 0 && !reduced) { ctx.translate((Math.random() - .5) * shake, (Math.random() - .5) * shake); shake *= .8; }
      ctx.strokeStyle = '#718d9a0c'; ctx.lineWidth = 1; for (let x = 40; x < W; x += 32) { ctx.beginPath(); ctx.moveTo(x, 42); ctx.lineTo(x, H); ctx.stroke(); } for (let y = 42; y < H; y += 32) { ctx.beginPath(); ctx.moveTo(23, y); ctx.lineTo(W - 23, y); ctx.stroke(); }
      // Architectural frame, side lights, reactor aperture and hazard stripe.
      rr(11, 36, 12, H - 58, 4, '#243e48'); rr(W - 23, 36, 12, H - 58, 4, '#243e48');
      for (let y = 58; y < H - 50; y += 62) { rr(15, y, 3, 23, 1, state.pulse ? '#fbbb72' : '#65b7a588'); rr(W - 18, y, 3, 23, 1, state.pulse ? '#fbbb72' : '#65b7a588'); }
      rr(23, 35, W - 46, 6, 2, '#3e6469'); label('RX // ' + String(state.level + 1).padStart(2, '0'), 39, 25, 12, '#88a1a5'); label(LEVELS[state.level].name, W / 2, 25, 12, '#b8d2d0', 'center'); label('SECTOR ' + (state.level + 1) + '/5', W - 39, 25, 11, '#88a1a5', 'right');
      ctx.globalAlpha = .12; ctx.strokeStyle = '#80cbb9'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(W / 2, 344, 85, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.arc(W / 2, 344, 66, 0, Math.PI * 2); ctx.stroke(); label(String(state.level + 1).padStart(2, '0'), W / 2, 369, 64, '#83c6b5', 'center', 900); ctx.globalAlpha = 1;
      for (const b of state.bricks) {
        if (!b.alive) continue;
        rr(b.x, b.y + 4, b.w, b.h, 5, '#0006');
        const color = b.flash > 0 ? '#f9f7d7' : b.core ? '#f5a664' : b.hp > 1 ? '#8b9caf' : b.max > 1 ? '#b3ced0' : '#71d9ba';
        rr(b.x, b.y, b.w, b.h, 4, color); rr(b.x + 3, b.y + 3, b.w - 6, 2, 1, '#ffffff77'); rr(b.x + 3, b.y + b.h - 5, b.w - 6, 3, 1, '#122b3544');
        if (b.core) { const cx = b.x + b.w / 2, cy = b.y + b.h / 2; ctx.strokeStyle = '#583d28'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx, cy - 7); ctx.lineTo(cx + 7, cy); ctx.lineTo(cx, cy + 7); ctx.lineTo(cx - 7, cy); ctx.closePath(); ctx.stroke(); }
        else if (b.hp > 1) { for (const x of [b.x + 8, b.x + b.w - 10]) rr(x, b.y + 10, 3, 5, 1, '#43596b'); rr(b.x + 28, b.y + 10, 16, 5, 1, '#d9e5ec'); }
        else if (b.max > 1) { ctx.strokeStyle = '#38595f'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(b.x + 31, b.y); ctx.lineTo(b.x + 41, b.y + 10); ctx.lineTo(b.x + 32, b.y + 17); ctx.lineTo(b.x + 39, b.y + b.h); ctx.stroke(); }
      }
      if (state.mode === 'ready' && mode === 'game') {
        ctx.setLineDash([3, 7]); ctx.strokeStyle = '#c7f8df99'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(state.ball.x, state.ball.y); ctx.lineTo(state.ball.x + Math.sin(state.aim) * 105, state.ball.y - Math.cos(state.aim) * 105); ctx.stroke(); ctx.setLineDash([]);
        label(state.misses ? 'RESET YOUR ANGLE. YOU’VE GOT THIS.' : 'POSITION · AIM · LAUNCH', W / 2, 359, 15, '#d8f0df', 'center');
        label('Click, tap LAUNCH, or press SPACE', W / 2, 384, 11, '#829ba8', 'center', 500);
      }
      if (!reduced && mode === 'game' && state.mode === 'playing') { trail.push({ x: state.ball.x, y: state.ball.y }); if (trail.length > 10) trail.shift(); }
      trail.forEach((p, i) => { ctx.fillStyle = state.pulse ? `rgba(255,181,105,${i / 30})` : `rgba(169,255,224,${i / 38})`; ctx.beginPath(); ctx.arc(p.x, p.y, R * i / 10, 0, Math.PI * 2); ctx.fill(); });
      const pc = state.pulse ? '#ffba76' : '#baf9d8'; rr(state.paddle - state.width / 2, PY + 5, state.width, 13, 6, '#020c1477'); rr(state.paddle - state.width / 2, PY, state.width, 13, 5, '#91cbbd'); rr(state.paddle - state.width / 2 + 13, PY + 2, state.width - 26, 4, 2, pc); rr(state.paddle - state.width / 2, PY, 12, 13, 4, '#edf8e9'); rr(state.paddle + state.width / 2 - 12, PY, 12, 13, 4, '#edf8e9');
      ctx.shadowBlur = reduced ? 0 : 12; ctx.shadowColor = pc; ctx.fillStyle = '#fff9dc'; ctx.beginPath(); ctx.arc(state.ball.x, state.ball.y, R, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
      for (let x = 24; x < W - 24; x += 18) { ctx.fillStyle = '#ffb17422'; ctx.beginPath(); ctx.moveTo(x, H - 12); ctx.lineTo(x + 6, H - 12); ctx.lineTo(x + 14, H - 4); ctx.lineTo(x + 8, H - 4); ctx.fill(); }
      for (const p of particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 160 * dt; p.life -= dt; ctx.globalAlpha = Math.max(0, p.life / p.max); rr(p.x, p.y, 4, 3, 1, p.color); } particles = particles.filter(p => p.life > 0); ctx.globalAlpha = 1;
      for (const ring of rings) { ring.life -= dt; ctx.globalAlpha = Math.max(0, ring.life * 1.5); ctx.strokeStyle = '#ffca8c'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(ring.x, ring.y, (1 - ring.life / .45) * 105, 0, Math.PI * 2); ctx.stroke(); } rings = rings.filter(r => r.life > 0); ctx.globalAlpha = 1;
      for (const f of floats) { f.life -= dt; f.y -= dt * 25; ctx.globalAlpha = Math.max(0, f.life / .7); label(f.text, f.x, f.y, 14, '#ecffcf', 'center'); } floats = floats.filter(f => f.life > 0); ctx.globalAlpha = 1;
      if (state.combo >= 3 && mode === 'game') label(`${state.combo} CHAIN · ×${Math.min(5, 1 + Math.floor((state.combo - 1) / 3))}`, W / 2, 73, 14, '#ffe7ad', 'center');
      if (state.pulse > 0) label(`PULSE ACTIVE  ${state.pulse.toFixed(1)}s`, W / 2, 566, 11, '#ffc88a', 'center');
      ctx.restore();
    }
    function frame(now) {
      if (disposed) return;
      const dt = Math.min(.05, (now - last) / 1000 || 0); last = now; age += dt;
      if (mode === 'game') { accumulator += dt; while (accumulator >= 1 / 240) { step(state, 1 / 240, { target: pointer, direction: (keys.has('right') ? 1 : 0) - (keys.has('left') ? 1 : 0) }); accumulator -= 1 / 240; } events(); }
      const drawDt = mode === 'paused' ? 0 : dt;
      draw(drawDt);
      status.textContent = mode === 'menu' ? 'Five chambers. Make them count.' : `${String(state.score).padStart(5, '0')}  ·  ${'♥'.repeat(Math.max(0, state.lives))}  ·  ${state.campaign ? 'RUN' : 'PRACTICE'} ${state.level + 1}/5`;
      best.textContent = `Run best: ${data.best.toLocaleString()}`;
      buttons.launch.disabled = mode !== 'game' || state.mode !== 'ready';
      buttons.pulse.disabled = mode !== 'game' || state.mode !== 'playing' || state.energy < 6;
      const pulseLabel = state.energy >= 6 ? 'PULSE READY <kbd>E</kbd>' : `Pulse ${state.energy}/6 <kbd>E</kbd>`;
      if (buttons.pulse.innerHTML !== pulseLabel) buttons.pulse.innerHTML = pulseLabel;
      buttons.pulse.classList.toggle('charged', state.energy >= 6);
      buttons.pause.disabled = !['game', 'paused'].includes(mode); buttons.pause.textContent = mode === 'paused' ? '▶' : 'Ⅱ'; buttons.pause.setAttribute('aria-label', mode === 'paused' ? 'Resume game' : 'Pause game');
      aim.hidden = mode !== 'game' || state.mode !== 'ready';
      tip.hidden = mode !== 'game';
      tip.textContent = state.mode === 'ready' ? 'Drag or use arrows to move · Aim, then tap Launch' : state.energy >= 6 ? 'Pulse charged — tap it to pierce armor for 4 seconds' : 'Paddle edges steer the ball · Break 6 bricks to charge Pulse';
      if (doc.activeElement !== aimInput) aimInput.value = Math.round(state.aim * 100);
      raf = requestAnimationFrame(frame);
    }
    soundLabel(); menu(); raf = requestAnimationFrame(frame);
    return () => { disposed = true; cancelAnimationFrame(raf); listeners.forEach(f => f()); if (audio) audio.close().catch(() => {}); stage.classList.remove('reactor-stage'); controls.classList.remove('reactor-controls'); aim.remove(); tip.remove(); };
  }
  return { LEVELS, createState, makeBricks, serve, pulse, hitBrick, nextStage, step, mount, W, H, PY, R };
});
