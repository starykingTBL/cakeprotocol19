'use strict';

// ── STATE ─────────────────────────────────────────────────
let currentStage = 0;
const TOTAL = 10;
const gamesDone = { 3: false, 5: false, 6: false };
let _particleAnimId = null, _breakerAnimId = null;
let _starAnimId = null, _fireworksAnimId = null;

// ── AUDIO ─────────────────────────────────────────────────
let _audioCtx = null;
function getAudioCtx() {
  if (!_audioCtx) {
    try { _audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch(e) {}
  }
  return _audioCtx;
}

// Play a soft chime tone at given frequency
function playChime(freq, dur, vol) {
  freq = freq || 880; dur = dur || 0.7; vol = vol || 0.055;
  try {
    const ctx = getAudioCtx(); if (!ctx) return;
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = freq; osc.type = 'sine';
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.start(); osc.stop(ctx.currentTime + dur);
  } catch(e) {}
}

// Phone vibration on star find
function vibrate(pattern) {
  try { if (navigator.vibrate) navigator.vibrate(pattern || [30, 10, 20]); }
  catch(e) {}
}

// ── CANVAS POLYFILL ───────────────────────────────────────
(function() {
  const p = CanvasRenderingContext2D.prototype;
  if (!p.roundRect) {
    p.roundRect = function(x, y, w, h, r) {
      r = Math.min(r, w/2, h/2);
      this.moveTo(x+r, y); this.lineTo(x+w-r, y);
      this.arcTo(x+w, y, x+w, y+r, r); this.lineTo(x+w, y+h-r);
      this.arcTo(x+w, y+h, x+w-r, y+h, r); this.lineTo(x+r, y+h);
      this.arcTo(x, y+h, x, y+h-r, r); this.lineTo(x, y+r);
      this.arcTo(x, y, x+r, y, r); this.closePath();
    };
  }
})();

// ── NAV ───────────────────────────────────────────────────
const globalNav = document.getElementById('global-nav');
const btnBack   = document.getElementById('btn-back');
const btnNext   = document.getElementById('btn-next');
const counterEl = document.getElementById('stage-counter');
const dotsEl    = document.getElementById('progress-dots');

function buildDots() {
  dotsEl.innerHTML = '';
  for (let i = 1; i <= TOTAL; i++) {
    const d = document.createElement('div');
    d.className = 'p-dot' + (i === currentStage ? ' active' : '');
    dotsEl.appendChild(d);
  }
}

function updateNav() {
  buildDots();
  counterEl.textContent =
    String(currentStage).padStart(2,'0') + ' / ' + String(TOTAL).padStart(2,'0');

  if (currentStage === 0) { globalNav.classList.remove('visible'); return; }
  globalNav.classList.add('visible');
  btnBack.disabled = (currentStage <= 1);

  const locked  = [3, 5, 6].includes(currentStage) && !gamesDone[currentStage];
  const noNext  = locked || currentStage === 9 || currentStage === TOTAL;
  btnNext.style.opacity       = noNext ? '0' : '1';
  btnNext.style.pointerEvents = noNext ? 'none' : 'all';
}

function cleanupStage(n) {
  if (n === 0  && _particleAnimId)  { cancelAnimationFrame(_particleAnimId);  _particleAnimId  = null; }
  if (n === 3  && _breakerAnimId)   { cancelAnimationFrame(_breakerAnimId);   _breakerAnimId   = null; }
  if (n === 5  && _starAnimId)      { cancelAnimationFrame(_starAnimId);      _starAnimId      = null; }
  if (n === 10 && _fireworksAnimId) { cancelAnimationFrame(_fireworksAnimId); _fireworksAnimId = null; }
}

function goTo(n, dir) {
  if (n < 0 || n > TOTAL || n === currentStage) return;
  if (dir === undefined) dir = n > currentStage ? 1 : -1;
  cleanupStage(currentStage);

  const fromEl = document.getElementById('s' + currentStage);
  const toEl   = document.getElementById('s' + n);
  const xOut   = dir > 0 ? '-105%' : '105%';
  const xIn    = dir > 0 ? '105%'  : '-105%';

  gsap.set(toEl, { x: xIn, opacity: 0 });
  toEl.classList.add('active');

  gsap.timeline({ onComplete() {
    fromEl.classList.remove('active');
    gsap.set(fromEl, { x: 0, opacity: 1 });
    currentStage = n;
    updateNav();
    initStage(n);
  }})
  .to(fromEl, { x: xOut, opacity: 0, duration: 0.42, ease: 'power2.in' })
  .to(toEl,   { x: 0,    opacity: 1, duration: 0.42, ease: 'power2.out' }, '-=0.08');
}

btnNext.addEventListener('click', () => goTo(currentStage + 1, 1));
btnBack.addEventListener('click', () => goTo(currentStage - 1, -1));

// ── STAGE DISPATCHER ──────────────────────────────────────
function initStage(n) {
  const fns = [
    initGate, initOrigin, initCall, initBreaker,
    initJokes, initStarHunt, initMemoryMatch,
    initGallery, initConfession, initAsk, initEnding
  ];
  if (fns[n]) fns[n]();
}

// ════════════════════════════════════════════════════════
// STAGE 0 — GATE
// ════════════════════════════════════════════════════════
function initGate() {
  initParticles();
  const nameEl = document.getElementById('gate-name');
  nameEl.innerHTML = '';
  [...'Omosile'].forEach(ch => {
    const s = document.createElement('span');
    s.className = 'letter'; s.textContent = ch;
    nameEl.appendChild(s);
  });
  const tl = gsap.timeline({ delay: 0.4 });
  tl.to('.letter',      { opacity: 1, y: 0, duration: 0.65, stagger: 0.1, ease: 'power3.out' })
    .to('#gate-tagline', { opacity: 0.85, duration: 1.2 }, '+=0.3')
    .to('#btn-enter',    { opacity: 1,    duration: 0.9  }, '+=0.3');
  document.getElementById('btn-enter').onclick = () => goTo(1, 1);
}

function initParticles() {
  const c = document.getElementById('particle-canvas'); if (!c) return;
  const ctx = c.getContext('2d');
  c.width = window.innerWidth; c.height = window.innerHeight;
  const pts = Array.from({ length: 65 }, () => ({
    x: Math.random() * c.width, y: Math.random() * c.height,
    r: 0.5 + Math.random() * 1.4,
    vx: (Math.random()-0.5)*0.28, vy: -0.18 - Math.random()*0.35,
    a: 0.08 + Math.random()*0.35,
  }));
  function tick() {
    ctx.clearRect(0, 0, c.width, c.height);
    pts.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.y < -4) p.y = c.height + 4;
      if (p.x < 0) p.x = c.width; if (p.x > c.width) p.x = 0;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
      ctx.fillStyle = 'rgba(201,168,124,' + p.a + ')'; ctx.fill();
    });
    _particleAnimId = requestAnimationFrame(tick);
  }
  tick();
}

// ════════════════════════════════════════════════════════
// STAGE 1 — ORIGIN
// ════════════════════════════════════════════════════════
function initOrigin() {
  const box  = document.getElementById('s1-text');
  const card = document.getElementById('snap-card');
  box.textContent = '';
  gsap.set(card, { opacity: 0, y: 14 });
  const lines = [
    "He wasn't supposed to be on Snapchat that day.",
    '\nA random recommendation.\nA profile that just said "Me\uD83D\uDE0C\u2764\uFE0F"\nlike that was enough of a reason.',
    '\nIt was.'
  ];
  let li = 0, ci = 0;
  function type() {
    if (li >= lines.length) {
      gsap.to(card, { opacity: 1, y: 0, duration: 0.9, ease: 'power2.out', delay: 0.4 });
      return;
    }
    if (ci < lines[li].length) { box.textContent += lines[li][ci++]; setTimeout(type, 34); }
    else { li++; ci = 0; setTimeout(type, 500); }
  }
  setTimeout(type, 400);
}

// ════════════════════════════════════════════════════════
// STAGE 2 — THE CALL
// ════════════════════════════════════════════════════════
function initCall() {
  const phoneEl = document.getElementById('phone-icon');
  const ringEl  = document.getElementById('ring-label');
  const cLines  = document.querySelectorAll('.c-line');
  phoneEl.style.animation = 'phoneRing 0.5s ease-in-out infinite';
  ringEl.textContent = 'ringing...';
  cLines.forEach(l => { l.style.opacity = '0'; l.style.transition = 'none'; });
  setTimeout(() => {
    phoneEl.style.animation = 'none';
    ringEl.textContent = 'answered. \u2713';
    cLines.forEach((line, i) => {
      setTimeout(() => {
        line.style.transition = 'opacity 0.7s ease';
        line.style.opacity = '1';
      }, 550 * (i + 1));
    });
  }, 2200);
}

// ════════════════════════════════════════════════════════
// STAGE 3 — BLOCK BREAKER
// ════════════════════════════════════════════════════════
function initBreaker() {
  const canvas = document.getElementById('breaker-canvas');
  const wrap   = canvas.parentElement;
  const W = Math.min(wrap.clientWidth - 16, 480);
  const H = Math.min(wrap.clientHeight - 4, 400);
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (_breakerAnimId) cancelAnimationFrame(_breakerAnimId);

  const cinema = document.getElementById('breaker-cinema');
  cinema.classList.remove('active', 'darkened');
  document.getElementById('cinema-lines').innerHTML = '';
  const cont = document.getElementById('cinema-continue');
  cont.classList.remove('visible');

  document.getElementById('breaker-lose').classList.remove('show');

  const COLS = 8, ROWS = 4, GAP = 4;
  const bW = Math.floor((W - GAP * (COLS + 1)) / COLS);
  const bH = 18;
  const ROW_COLORS = ['#6B4C7A','#8B1A1A','#A0522D','#C9A87C'];

  let bricks = [];
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      bricks.push({
        x: GAP + c * (bW + GAP), y: 36 + r * (bH + GAP),
        w: bW, h: bH, alive: true, color: ROW_COLORS[r]
      });

  const PW = Math.floor(W * 0.22), PH = 9;
  let paddle = { x: W/2 - PW/2, y: H - PH - 12, w: PW, h: PH };
  const BR = 6;
  let ball   = { x: W/2, y: H - 55, vx: 3.2, vy: -3.8, r: BR };
  let lives  = 3, running = true;

  function setLives() {
    document.getElementById('lives-display').textContent =
      '\u2764\uFE0F '.repeat(lives).trim() + ' \uD83D\uDDA4'.repeat(3 - lives).trim();
  }
  setLives();

  function movePaddle(cx) {
    const rect = canvas.getBoundingClientRect();
    paddle.x = Math.max(0, Math.min(W - paddle.w, cx - rect.left - paddle.w/2));
  }
  canvas.addEventListener('touchmove', e => { e.preventDefault(); movePaddle(e.touches[0].clientX); }, { passive: false });
  canvas.addEventListener('mousemove', e => movePaddle(e.clientX));

  function loop() {
    if (!running) return;
    ctx.fillStyle = '#07070f'; ctx.fillRect(0, 0, W, H);
    ball.x += ball.vx; ball.y += ball.vy;
    if (ball.x - ball.r < 0) { ball.x = ball.r; ball.vx *= -1; }
    if (ball.x + ball.r > W) { ball.x = W - ball.r; ball.vx *= -1; }
    if (ball.y - ball.r < 0) { ball.y = ball.r; ball.vy *= -1; }
    if (ball.y - ball.r > H) {
      lives--; setLives();
      if (lives <= 0) {
        running = false;
        document.getElementById('breaker-lose').classList.add('show');
        return;
      }
      ball = { x: paddle.x + paddle.w/2, y: H - 70,
               vx: 3*(Math.random()>0.5?1:-1), vy: -3.8, r: BR };
    }
    if (ball.y + ball.r >= paddle.y && ball.y - ball.r <= paddle.y + paddle.h &&
        ball.x >= paddle.x - ball.r && ball.x <= paddle.x + paddle.w + ball.r) {
      ball.vy = -Math.abs(ball.vy);
      ball.vx = ((ball.x - paddle.x) / paddle.w - 0.5) * 8;
    }
    let allGone = true;
    bricks.forEach(b => {
      if (!b.alive) return; allGone = false;
      if (ball.x+ball.r > b.x && ball.x-ball.r < b.x+b.w &&
          ball.y+ball.r > b.y && ball.y-ball.r < b.y+b.h) {
        b.alive = false; ball.vy *= -1;
      }
    });
    if (allGone) {
      running = false;
      breakerCinematicWin();
      return;
    }
    bricks.forEach(b => {
      if (!b.alive) return;
      ctx.fillStyle = b.color;
      ctx.beginPath(); ctx.roundRect(b.x, b.y, b.w, b.h, 3); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.07)';
      ctx.fillRect(b.x+2, b.y+2, b.w-4, 3);
    });
    const pg = ctx.createLinearGradient(paddle.x, 0, paddle.x+paddle.w, 0);
    pg.addColorStop(0, '#6B3A1F'); pg.addColorStop(0.5, '#C9A87C'); pg.addColorStop(1, '#6B3A1F');
    ctx.fillStyle = pg;
    ctx.beginPath(); ctx.roundRect(paddle.x, paddle.y, paddle.w, paddle.h, 5); ctx.fill();
    ctx.shadowBlur = 12; ctx.shadowColor = 'rgba(201,168,124,0.65)';
    ctx.fillStyle = '#F5ECD7';
    ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur = 0;
    _breakerAnimId = requestAnimationFrame(loop);
  }
  _breakerAnimId = requestAnimationFrame(loop);

  document.getElementById('breaker-retry').onclick = () => { running = false; if (_breakerAnimId) cancelAnimationFrame(_breakerAnimId); initBreaker(); };
}

// ── CINEMATIC WIN SEQUENCE ────────────────────────────────
function breakerCinematicWin() {
  gamesDone[3] = true;
  updateNav();

  const cinema = document.getElementById('breaker-cinema');
  const linesEl = document.getElementById('cinema-lines');
  const cont    = document.getElementById('cinema-continue');

  // Cinema text lines — the emotional sequence
  const lines = [
    { text: 'You broke through every wall\u2026', cls: 'cinema-line' },
    { text: 'But there\u2019s something else\nI\u2019ve been trying to break through too.', cls: 'cinema-line' },
    { text: 'My fear of telling you\nhow special you are to me.', cls: 'cinema-line gold' },
  ];

  linesEl.innerHTML = '';
  lines.forEach(l => {
    const el = document.createElement('p');
    el.className = l.cls; el.textContent = l.text;
    linesEl.appendChild(el);
  });

  // Fade canvas overlay in
  cinema.classList.add('active');
  requestAnimationFrame(() => cinema.classList.add('darkened'));

  // Reveal lines one by one
  const lineEls = linesEl.querySelectorAll('.cinema-line');
  lineEls.forEach((el, i) => {
    setTimeout(() => {
      el.classList.add('visible');
      playChime(528 - i * 44, 1.1, 0.04);
    }, 1200 + i * 2200);
  });

  // Show continue button after all lines
  setTimeout(() => {
    cont.classList.add('visible');
  }, 1200 + lines.length * 2200 + 600);

  cont.onclick = () => goTo(4, 1);
}

// ════════════════════════════════════════════════════════
// STAGE 4 — JOKES
// ════════════════════════════════════════════════════════
function initJokes() {
  gsap.set(['#cc1','#cc2'], { opacity: 0, y: 22 });
  document.getElementById('fish-box').classList.remove('revealed');
  gsap.to('#cc1', { opacity: 1, y: 0, duration: 0.75, delay: 0.4 });
  gsap.to('#cc2', { opacity: 1, y: 0, duration: 0.75, delay: 0.7 });
  document.getElementById('fish-box').onclick = function() {
    if (this.classList.contains('revealed')) return;
    this.classList.add('revealed');
    spawnConfetti();
  };
}

function spawnConfetti() {
  const colors = ['#C9A87C','#8B1A1A','#F5ECD7','#6B4C7A','#D4956A','#ffb6c1','#fff'];
  for (let i = 0; i < 70; i++) {
    const el = document.createElement('div');
    el.className = 'confetti-piece';
    const dur = 1.3 + Math.random() * 1.4;
    el.style.cssText = 'left:' + (15+Math.random()*70) + '%;top:-12px;background:' +
      colors[Math.floor(Math.random()*colors.length)] + ';border-radius:' +
      (Math.random()>0.5?'50%':'2px') + ';width:' + (6+Math.random()*6) + 'px;height:' +
      (6+Math.random()*6) + 'px;animation-duration:' + dur + 's;animation-delay:' +
      (Math.random()*0.45) + 's;';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), (dur+0.6)*1000);
  }
}

// ════════════════════════════════════════════════════════
// STAGE 5 — STAR HUNT (19 DOTS — She's Turning 19)
// ════════════════════════════════════════════════════════
function initStarHunt() {
  const canvas = document.getElementById('star-canvas');
  const ctx    = canvas.getContext('2d');
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  if (_starAnimId) cancelAnimationFrame(_starAnimId);

  let foundCount = 0;
  document.getElementById('star-count').textContent = '0';

  // 19 messages — building emotionally from cute → deep → birthday → final
  const messages = [
    // 1-5: Cute / Funny / Flirty
    'Birthday girl detected \uD83C\uDF82',
    "You\u2019re suspiciously adorable.",
    'Warning: your smile is distracting.',
    'You make normal conversations feel illegal.',
    "I was going to make a normal birthday site\u2026\nthen you happened.",
    // 6-10: Soft Emotional
    'You have no idea how calming your presence feels.',
    'Some people enter your life loudly.\nYou somehow entered mine softly.',
    'You became important to me so naturally.',
    'Talking to you became part of my favourite days.',
    'You make warmth look effortless.',
    // 11-15: Romantic Build-Up
    "You\u2019re honestly hard not to care about.",
    'You somehow became my favourite notification.',
    'I catch myself smiling at your messages too much.',
    'You make my heart act unprofessional.',
    'Somewhere between the jokes and the conversations\u2026\nI started falling for you.',
    // 16-18: Birthday + Deep
    '19 looks beautiful on you already.',
    'I hope this new chapter gives you everything you deserve.',
    'You deserve the kind of love that feels safe, soft, and intentional.',
    // 19: FINAL — triggers transition
    "There\u2019s one more thing\nI\u2019ve been trying to find\u2026\n\nThe courage to ask you this.",
  ];

  // Chime pitches — get warmer as messages deepen
  const chimePitches = [
    1047,990,932,880,831,   // 1-5: bright
    740,698,659,622,587,   // 6-10: mid
    523,494,466,440,415,   // 11-15: warm
    392,370,349,           // 16-18: deep
    330,                   // 19: final
  ];

  // Generate 19 safe positions spread across the screen
  // Safe area: x 5%-93%, y 38%-86% (avoids header and nav)
  const W = canvas.width, H = canvas.height;
  // Predefined grid positions — 19 cells in a 4x5 rough grid with variation
  const rawPositions = [
    [0.12, 0.39],[0.68, 0.41],[0.38, 0.44],[0.88, 0.40],[0.24, 0.49],
    [0.58, 0.52],[0.82, 0.55],[0.15, 0.58],[0.44, 0.60],[0.72, 0.63],
    [0.06, 0.67],[0.33, 0.68],[0.62, 0.70],[0.87, 0.68],[0.20, 0.75],
    [0.78, 0.76],[0.48, 0.79],[0.10, 0.83],[0.50, 0.86],
  ];

  const stars = rawPositions.map(([fx, fy], i) => ({
    x: fx * W, y: fy * H,
    found: false,
    tapR: 28,
    twinkle: Math.random() * Math.PI * 2,
    memory: messages[i],
    pitch: chimePitches[i],
    isFinal: i === 18,
    isFirst: i === 0,
    pulseScale: 1,
  }));

  // Background star field
  const bgStars = Array.from({ length: 130 }, () => ({
    x: Math.random() * W, y: Math.random() * H,
    r: 0.2 + Math.random() * 0.8,
    a: 0.02 + Math.random() * 0.06,
  }));

  const foundOrder = [];
  // Track which star was last found (for re-tap to show message)
  const foundMap = {};

  // Background warmth — shifts from cold dark to warm as stars found
  function getBgColor(n) {
    // 0 found: #050507, 19 found: #100a10
    const t = n / 19;
    const r = Math.round(5  + t * 11);
    const g = Math.round(5  + t * 5);
    const b = Math.round(7  + t * 9);
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }

  function frame() {
    ctx.fillStyle = getBgColor(foundCount);
    ctx.fillRect(0, 0, W, H);

    // Background star brightness increases as stars found
    const bgAlphaBoost = foundCount / 19 * 0.06;
    bgStars.forEach(s => {
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
      ctx.fillStyle = 'rgba(245,236,215,' + (s.a + bgAlphaBoost) + ')';
      ctx.fill();
    });

    // Draw constellation lines between found stars
    if (foundOrder.length > 1) {
      ctx.strokeStyle = 'rgba(201,168,124,0.25)';
      ctx.lineWidth = 0.85;
      ctx.beginPath();
      ctx.moveTo(foundOrder[0].x, foundOrder[0].y);
      foundOrder.slice(1).forEach(s => ctx.lineTo(s.x, s.y));
      ctx.stroke();
    }

    stars.forEach(s => {
      s.twinkle += 0.022;
      if (s.found) {
        // Glow for found star
        const gSize = s.isFinal ? 32 : 20;
        const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, gSize);
        const col = s.isFinal ? 'rgba(220,160,180,' : 'rgba(201,168,124,';
        g.addColorStop(0, col + '0.95)');
        g.addColorStop(0.5, col + '0.2)');
        g.addColorStop(1, col + '0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(s.x, s.y, gSize, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = s.isFinal ? '#E8C4CC' : '#F5ECD7';
        ctx.beginPath(); ctx.arc(s.x, s.y, 2.8, 0, Math.PI*2); ctx.fill();
      } else {
        // Hidden — barely visible; first star pulses slightly as hint
        const base = s.isFirst ? 0.06 : 0.025;
        const pulse = base + Math.sin(s.twinkle) * (s.isFirst ? 0.04 : 0.012);
        ctx.fillStyle = 'rgba(245,236,215,' + pulse + ')';
        ctx.beginPath(); ctx.arc(s.x, s.y, 2, 0, Math.PI*2); ctx.fill();
      }
    });

    _starAnimId = requestAnimationFrame(frame);
  }
  frame();

  // ── MEMORY FLASH LOGIC ──────────────────────────────
  const flashEl = document.getElementById('mem-flash');
  const textEl  = document.getElementById('mem-text');
  let _flashT = null;

  function showFlash(text, persistent) {
    textEl.textContent = text;
    flashEl.classList.add('show');
    clearTimeout(_flashT);
    if (!persistent) {
      _flashT = setTimeout(() => flashEl.classList.remove('show'), 5500);
    }
  }

  // Tap flash to close
  flashEl.addEventListener('click', () => {
    flashEl.classList.remove('show');
    clearTimeout(_flashT);
  });

  // ── TAP HANDLER ──────────────────────────────────────
  function handleTap(cx, cy) {
    stars.forEach(s => {
      if (Math.hypot(cx - s.x, cy - s.y) < s.tapR) {
        if (s.found) {
          // Re-tap found star → show message again
          showFlash(s.memory, false);
          vibrate(20);
          return;
        }
        // First tap — find the star
        s.found = true;
        foundOrder.push(s);
        foundCount++;
        document.getElementById('star-count').textContent = foundCount;

        playChime(s.pitch, 0.9, 0.055);
        vibrate([30, 10, 20]);

        if (s.isFinal) {
          // Final star — special dramatic treatment
          showFlash(s.memory, true);
          playChime(330, 1.4, 0.06);
          vibrate([40, 20, 40, 20, 60]);
          setTimeout(() => {
            flashEl.classList.remove('show');
            gamesDone[5] = true;
            updateNav();
            goTo(6, 1);
          }, 4200);
        } else {
          showFlash(s.memory, false);
        }
      }
    });
  }

  canvas.addEventListener('click', e => {
    const r = canvas.getBoundingClientRect();
    handleTap(e.clientX - r.left, e.clientY - r.top);
  });
  canvas.addEventListener('touchend', e => {
    e.preventDefault();
    const t = e.changedTouches[0];
    const r = canvas.getBoundingClientRect();
    handleTap(t.clientX - r.left, t.clientY - r.top);
  }, { passive: false });
}

// ════════════════════════════════════════════════════════
// STAGE 6 — MEMORY MATCH
// ════════════════════════════════════════════════════════
function initMemoryMatch() {
  const grid = document.getElementById('match-grid');
  grid.innerHTML = '';
  document.getElementById('match-win-box').classList.remove('show');
  const photos = [
    'assets/images/photo1.jpg','assets/images/photo2.jpg',
    'assets/images/photo3.jpg','assets/images/photo4.jpg',
  ];
  const deck = [...photos, ...photos].sort(() => Math.random() - 0.5);
  let flipped = [], matched = 0, busy = false;
  deck.forEach(src => {
    const card = document.createElement('div');
    card.className = 'm-card'; card.dataset.src = src;
    card.innerHTML = '<div class="m-card-inner"><div class="m-front">\u2736</div><div class="m-back"><img src="' + src + '" alt="Omosile" loading="lazy"></div></div>';
    card.addEventListener('click', function() {
      if (busy || this.classList.contains('flipped') || this.classList.contains('matched')) return;
      this.classList.add('flipped'); flipped.push(this);
      if (flipped.length === 2) {
        busy = true;
        setTimeout(() => {
          const [a, b] = flipped;
          if (a.dataset.src === b.dataset.src) {
            a.classList.add('matched'); b.classList.add('matched'); matched++;
            if (matched === 4) {
              setTimeout(() => {
                document.getElementById('match-win-box').classList.add('show');
                gamesDone[6] = true; updateNav();
              }, 500);
            }
          } else { a.classList.remove('flipped'); b.classList.remove('flipped'); }
          flipped = []; busy = false;
        }, 950);
      }
    });
    grid.appendChild(card);
  });
  document.getElementById('match-continue').onclick = () => goTo(7, 1);
}

// ════════════════════════════════════════════════════════
// STAGE 7 — GALLERY
// ════════════════════════════════════════════════════════
function initGallery() {
  // Add real filenames here. For videos: { type:'video', src:'assets/videos/name.mp4', caption:'' }
  const media = [
    { type: 'image', src: 'assets/images/photo1.jpg', caption: '' },
    { type: 'image', src: 'assets/images/photo2.jpg', caption: '' },
    { type: 'image', src: 'assets/images/photo3.jpg', caption: '' },
    { type: 'image', src: 'assets/images/photo4.jpg', caption: '' },
    { type: 'image', src: 'assets/images/photo5.jpg', caption: '' },
  ];
  let idx = 0;
  const imgEl = document.getElementById('gal-img');
  const vidEl = document.getElementById('gal-vid');
  const capEl = document.getElementById('gal-caption');
  const dts   = document.getElementById('gal-dots');
  dts.innerHTML = '';
  media.forEach((_,i) => {
    const d = document.createElement('div');
    d.className = 'gal-dot' + (i===0?' active':'');
    dts.appendChild(d);
  });
  function show(n) {
    const item = media[n];
    gsap.to([imgEl, vidEl], { opacity: 0, duration: 0.3, onComplete() {
      imgEl.style.display = item.type==='image' ? 'block' : 'none';
      vidEl.style.display = item.type==='video' ? 'block' : 'none';
      if (item.type==='image') { imgEl.src = item.src; gsap.to(imgEl, { opacity:1, duration:0.5 }); }
      else { vidEl.src = item.src; vidEl.play(); gsap.to(vidEl, { opacity:1, duration:0.5 }); }
      capEl.textContent = item.caption;
      dts.querySelectorAll('.gal-dot').forEach((d,i) => d.classList.toggle('active', i===n));
    }});
  }
  imgEl.src = media[0].src; imgEl.style.display = 'block'; vidEl.style.display = 'none';
  document.getElementById('gal-prev').onclick = () => { idx=(idx-1+media.length)%media.length; show(idx); };
  document.getElementById('gal-next').onclick = () => { idx=(idx+1)%media.length; show(idx); };
}

// ════════════════════════════════════════════════════════
// STAGE 8 — CONFESSION
// ════════════════════════════════════════════════════════
function initConfession() {
  const pages = [
    [{ text: "I wasn\u2019t even supposed to be on Snapchat that day.", cls: 'conf-line' }],
    [{ text: "I don\u2019t know what made me open the app. I don\u2019t know what made me stop at your profile. I don\u2019t know what made me add someone I didn\u2019t know, in a country I\u2019ve never been to, with a name that just said \u201CMe\uD83D\uDE0C\u2764\uFE0F\u201D like that was enough of a reason.", cls: 'conf-line' }],
    [{ text: 'But it was.', cls: 'conf-line conf-em' }],
    [{ text: "You posted a horror video on your story.\nI had just finished watching one.\nI said something \u2014 I don\u2019t even remember what.\nBut I remember the energy.\nI remember thinking \u201Cthis person is different.\u201D", cls: 'conf-line' }],
    [{ text: 'Then you called.', cls: 'conf-line' },
     { text: 'You said it was a mistake.', cls: 'conf-line' }],
    [{ text: "Okomi \u2014 that was the best mistake you\u2019ve ever made.", cls: 'conf-line conf-highlight' }],
    [{ text: "We talked about horror.\nThen books.\nThen life.\nThen everything.\nThen nothing \u2014 just talking because stopping felt wrong.", cls: 'conf-line' }],
    [{ text: "I\u2019ve called you okomi.\nYou\u2019ve called me Iyawomi.\nI don\u2019t know when this became the realest thing in my life but it did.", cls: 'conf-line' }],
    [{ text: "Your father named you Omosile because you completed the house when you arrived.\n\nI believe that.\n\nBecause ever since you arrived in my world \u2014\nsomething in me that I didn\u2019t know was unfinished\nfinally felt complete.", cls: 'conf-line' }],
    [{ text: "I\u2019m not good at grand gestures.\nI\u2019m not good at perfect timing.\nBut I built this.\nEvery scene. Every word. Every star you collected.\nAll of it was just me trying to say one thing\nthat I keep almost saying and never do.", cls: 'conf-line' }],
    [{ text: 'OMOSILE \u2014', cls: 'conf-line conf-name' },
     { text: 'I love you.', cls: 'conf-line conf-declaration' }],
    [{ text: "Not the casual kind.\nThe kind that made me build a whole website\non a phone\njust so the moment I said it\nwould feel as big as it actually is.", cls: 'conf-line' }],
  ];
  let pi = 0;
  const pageEl  = document.getElementById('confession-page');
  const progEl  = document.getElementById('conf-prog');
  const prevBtn = document.getElementById('conf-prev');
  const nextBtn = document.getElementById('conf-next');
  function showPage(n) {
    pageEl.innerHTML = '';
    progEl.textContent = (n+1) + ' / ' + pages.length;
    prevBtn.disabled = (n===0);
    pages[n].forEach((item, i) => {
      const el = document.createElement('p');
      el.className = item.cls; el.textContent = item.text;
      pageEl.appendChild(el);
      setTimeout(() => el.classList.add('visible'), 80 + i*220);
    });
  }
  showPage(0);
  nextBtn.onclick = () => { if (pi<pages.length-1) { pi++; showPage(pi); } else goTo(9,1); };
  prevBtn.onclick = () => { if (pi>0) { pi--; showPage(pi); } };
}

// ════════════════════════════════════════════════════════
// STAGE 9 — THE ASK
// ════════════════════════════════════════════════════════
function initAsk() {
  const noBtn = document.getElementById('btn-no');
  const noMsg = document.getElementById('no-msg');
  let tries = 0;
  noMsg.textContent = ''; noMsg.classList.remove('show');
  gsap.set(noBtn, { x:0, y:0, opacity:1, scale:1 });
  noBtn.style.display = 'block';
  const msgs = ['', "That\u2019s not it.", 'Nope.', "That\u2019s not an option.", "I\u2019m not accepting that."];
  noBtn.onclick = function() {
    tries++;
    if (tries >= 5) {
      gsap.to(noBtn, { opacity:0, scale:0, duration:0.38, onComplete:() => { noBtn.style.display='none'; } });
      noMsg.textContent = "I\u2019m not accepting that.";
      noMsg.classList.add('show'); return;
    }
    gsap.to(noBtn, { x:(Math.random()-0.5)*200, y:(Math.random()-0.5)*70, duration:0.18, ease:'power3.out' });
    if (msgs[tries]) { noMsg.textContent = msgs[tries]; noMsg.classList.add('show'); }
  };
  document.getElementById('btn-yes').onclick = () => goTo(10, 1);
}

// ════════════════════════════════════════════════════════
// STAGE 10 — BIRTHDAY ENDING
// Fireworks + hearts/petals + Happy 19th Birthday
// ════════════════════════════════════════════════════════
function initEnding() {
  const canvas = document.getElementById('fireworks-canvas');
  const ctx    = canvas.getContext('2d');
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  if (_fireworksAnimId) cancelAnimationFrame(_fireworksAnimId);

  const COLORS = ['#C9A87C','#8B1A1A','#F5ECD7','#6B4C7A','#D4956A','#E8B4B8','#ffb6c1','#fff'];

  // ── ROCKETS ─────────────────────────────────────────
  class Rocket {
    constructor() {
      this.x  = canvas.width  * (0.2 + Math.random() * 0.6);
      this.y  = canvas.height;
      this.tx = canvas.width  * (0.15 + Math.random() * 0.7);
      this.ty = canvas.height * (0.08 + Math.random() * 0.42);
      const dx = this.tx - this.x, dy = this.ty - this.y;
      const d  = Math.hypot(dx, dy), sp = 7 + Math.random() * 4;
      this.vx = dx/d*sp; this.vy = dy/d*sp;
      this.color = COLORS[Math.floor(Math.random()*COLORS.length)];
      this.alive = true;
    }
    step(particles) {
      this.x += this.vx; this.y += this.vy;
      if (Math.hypot(this.tx-this.x, this.ty-this.y) < 12) {
        this.alive = false;
        const n = 50 + Math.floor(Math.random()*30);
        for (let i=0; i<n; i++) {
          const a  = (Math.PI*2/n)*i;
          const sp = 2 + Math.random()*4.5;
          particles.push({ x:this.x, y:this.y,
            vx:Math.cos(a)*sp, vy:Math.sin(a)*sp,
            color:this.color, life:60+Math.random()*35,
            maxLife:60+Math.random()*35 });
        }
      }
    }
    draw() {
      ctx.beginPath(); ctx.arc(this.x, this.y, 2.2, 0, Math.PI*2);
      ctx.fillStyle = this.color; ctx.fill();
    }
  }

  // ── PETALS / HEARTS ──────────────────────────────────
  class Petal {
    constructor() {
      this.reset();
    }
    reset() {
      this.x = Math.random() * canvas.width;
      this.y = -15;
      this.size = 4 + Math.random() * 7;
      this.vx = (Math.random()-0.5) * 1.2;
      this.vy = 0.7 + Math.random() * 1.1;
      this.rot = Math.random() * Math.PI * 2;
      this.rotV = (Math.random()-0.5) * 0.04;
      this.alpha = 0.5 + Math.random() * 0.45;
      this.isHeart = Math.random() > 0.55;
      this.color = ['#E8B4B8','#C9A87C','#F5ECD7','#D4956A','#ffb6c1'][Math.floor(Math.random()*5)];
    }
    step() {
      this.x += this.vx + Math.sin(Date.now()*0.001 + this.x*0.01) * 0.25;
      this.y += this.vy; this.rot += this.rotV;
      if (this.y > canvas.height + 20) this.reset();
    }
    draw() {
      ctx.save();
      ctx.globalAlpha = this.alpha;
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rot);
      ctx.fillStyle = this.color;
      if (this.isHeart) {
        const s = this.size / 2;
        ctx.beginPath();
        ctx.moveTo(0, s*0.3);
        ctx.bezierCurveTo(-s, -s*0.3, -s*2, s*0.8, 0, s*2);
        ctx.bezierCurveTo(s*2, s*0.8, s, -s*0.3, 0, s*0.3);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.ellipse(0, 0, this.size/2, this.size, 0, 0, Math.PI*2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  const rockets  = [];
  const sparks   = [];
  const petals   = Array.from({ length: 22 }, () => {
    const p = new Petal();
    p.y = Math.random() * canvas.height; // start scattered
    return p;
  });
  let fframe = 0;

  function loop() {
    fframe++;
    ctx.fillStyle = 'rgba(3,3,5,0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Launch rocket every 45 frames
    if (fframe % 45 === 0) rockets.push(new Rocket());

    for (let i=rockets.length-1; i>=0; i--) {
      if (!rockets[i].alive) { rockets.splice(i,1); continue; }
      rockets[i].step(sparks); rockets[i].draw();
    }
    for (let i=sparks.length-1; i>=0; i--) {
      const p = sparks[i];
      p.x += p.vx; p.y += p.vy; p.vy += 0.07; p.life--;
      ctx.beginPath(); ctx.arc(p.x, p.y, 1.6, 0, Math.PI*2);
      ctx.fillStyle = p.color; ctx.globalAlpha = p.life/p.maxLife;
      ctx.fill(); ctx.globalAlpha = 1;
      if (p.life<=0) sparks.splice(i,1);
    }
    petals.forEach(p => { p.step(); p.draw(); });

    _fireworksAnimId = requestAnimationFrame(loop);
  }
  loop();

  // Fade in birthday content
  setTimeout(() => {
    gsap.to('#end-content', { opacity:1, y:0, duration:1.8, ease:'power2.out' });
    playChime(660, 1.5, 0.04);
    setTimeout(() => playChime(784, 1.5, 0.04), 400);
    setTimeout(() => playChime(880, 2, 0.05), 800);
  }, 1200);
}

// ════════════════════════════════════════════════════════
// BOOT
// ════════════════════════════════════════════════════════
const s0 = document.getElementById('s0');
s0.classList.add('active');
buildDots();
initGate();
