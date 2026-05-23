// ============================================================
// OMOSILE — MAIN SCRIPT
// 11 stages | 3 games | cinematic transitions
// ============================================================
'use strict';

// ── STATE ────────────────────────────────────────────────────
let currentStage = 0;
const TOTAL = 10; // stages 0–10

// Game completion tracker — prevents nav from re-locking
const gamesDone = { 3: false, 5: false, 6: false };

// Animation frame IDs for cleanup
let _particleAnimId = null;
let _breakerAnimId  = null;
let _starAnimId     = null;
let _fireworksAnimId = null;

// ── DOM ──────────────────────────────────────────────────────
const globalNav   = document.getElementById('global-nav');
const btnBack     = document.getElementById('btn-back');
const btnNext     = document.getElementById('btn-next');
const counterEl   = document.getElementById('stage-counter');
const dotsEl      = document.getElementById('progress-dots');

// Canvas roundRect polyfill for older Android
(function() {
  const proto = CanvasRenderingContext2D.prototype;
  if (!proto.roundRect) {
    proto.roundRect = function(x, y, w, h, r) {
      r = Math.min(r, w/2, h/2);
      this.moveTo(x + r, y);
      this.lineTo(x + w - r, y);
      this.arcTo(x + w, y, x + w, y + r, r);
      this.lineTo(x + w, y + h - r);
      this.arcTo(x + w, y + h, x + w - r, y + h, r);
      this.lineTo(x + r, y + h);
      this.arcTo(x, y + h, x, y + h - r, r);
      this.lineTo(x, y + r);
      this.arcTo(x, y, x + r, y, r);
      this.closePath();
    };
  }
})();

// ── NAVIGATION ───────────────────────────────────────────────
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

  if (currentStage === 0) {
    globalNav.classList.remove('visible');
    return;
  }
  globalNav.classList.add('visible');

  btnBack.disabled = (currentStage <= 1);

  // Game stages: hide Next until game is won
  const isGameStage = [3, 5, 6].includes(currentStage) && !gamesDone[currentStage];
  const isAskStage  = currentStage === 9;
  const isEndStage  = currentStage === TOTAL;

  const hideNext = isGameStage || isAskStage || isEndStage;
  btnNext.style.opacity       = hideNext ? '0' : '1';
  btnNext.style.pointerEvents = hideNext ? 'none' : 'all';
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

  const xOut = dir > 0 ? '-105%' : '105%';
  const xIn  = dir > 0 ? '105%'  : '-105%';

  gsap.set(toEl, { x: xIn, opacity: 0 });
  toEl.classList.add('active');

  const tl = gsap.timeline({
    onComplete() {
      fromEl.classList.remove('active');
      gsap.set(fromEl, { x: 0, opacity: 1 });
      currentStage = n;
      updateNav();
      initStage(n);
    }
  });

  tl.to(fromEl, { x: xOut, opacity: 0, duration: 0.42, ease: 'power2.in' })
    .to(toEl,   { x: 0,    opacity: 1, duration: 0.42, ease: 'power2.out' }, '-=0.08');
}

btnNext.addEventListener('click', () => goTo(currentStage + 1, 1));
btnBack.addEventListener('click', () => goTo(currentStage - 1, -1));

// ── STAGE DISPATCHER ─────────────────────────────────────────
function initStage(n) {
  const fns = [
    initGate, initOrigin, initCall, initBreaker,
    initJokes, initStarHunt, initMemoryMatch,
    initGallery, initConfession, initAsk, initEnding
  ];
  if (fns[n]) fns[n]();
}

// ════════════════════════════════════════════════════════════
// STAGE 0 — GATE
// ════════════════════════════════════════════════════════════
function initGate() {
  initParticles();

  const nameEl = document.getElementById('gate-name');
  nameEl.innerHTML = '';
  [...'Omosile'].forEach(ch => {
    const s = document.createElement('span');
    s.className = 'letter';
    s.textContent = ch;
    nameEl.appendChild(s);
  });

  const tl = gsap.timeline({ delay: 0.4 });
  tl.to('.letter',      { opacity: 1, y: 0, duration: 0.65, stagger: 0.1, ease: 'power3.out' })
    .to('#gate-tagline', { opacity: 0.85, duration: 1.2 }, '+=0.3')
    .to('#btn-enter',    { opacity: 1,    duration: 0.9  }, '+=0.3');

  document.getElementById('btn-enter').onclick = () => goTo(1, 1);
}

function initParticles() {
  const c = document.getElementById('particle-canvas');
  if (!c) return;
  const ctx = c.getContext('2d');
  c.width  = window.innerWidth;
  c.height = window.innerHeight;

  const pts = Array.from({ length: 65 }, () => ({
    x: Math.random() * c.width,
    y: Math.random() * c.height,
    r: 0.5 + Math.random() * 1.4,
    vx: (Math.random() - 0.5) * 0.28,
    vy: -0.18 - Math.random() * 0.35,
    a: 0.08 + Math.random() * 0.35,
  }));

  function tick() {
    ctx.clearRect(0, 0, c.width, c.height);
    pts.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.y < -4) p.y = c.height + 4;
      if (p.x < 0) p.x = c.width;
      if (p.x > c.width) p.x = 0;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(201,168,124,${p.a})`;
      ctx.fill();
    });
    _particleAnimId = requestAnimationFrame(tick);
  }
  tick();
}

// ════════════════════════════════════════════════════════════
// STAGE 1 — ORIGIN
// ════════════════════════════════════════════════════════════
function initOrigin() {
  const box = document.getElementById('s1-text');
  box.textContent = '';
  const card = document.getElementById('snap-card');
  gsap.set(card, { opacity: 0, y: 14 });

  const lines = [
    "He wasn't supposed to be on Snapchat that day.",
    '\nA random recommendation.\nA profile that just said "Me😌❤️"\nlike that was enough of a reason.',
    '\nIt was.'
  ];

  let li = 0, ci = 0;
  function type() {
    if (li >= lines.length) {
      gsap.to(card, { opacity: 1, y: 0, duration: 0.9, ease: 'power2.out', delay: 0.4 });
      return;
    }
    if (ci < lines[li].length) {
      box.textContent += lines[li][ci++];
      setTimeout(type, 34);
    } else {
      li++; ci = 0;
      setTimeout(type, 500);
    }
  }
  setTimeout(type, 400);
}

// ════════════════════════════════════════════════════════════
// STAGE 2 — THE CALL
// ════════════════════════════════════════════════════════════
function initCall() {
  const phoneEl  = document.getElementById('phone-icon');
  const ringEl   = document.getElementById('ring-label');
  const cLines   = document.querySelectorAll('.c-line');

  // Reset
  phoneEl.style.animation = 'phoneRing 0.5s ease-in-out infinite';
  ringEl.textContent = 'ringing...';
  cLines.forEach(l => { l.style.opacity = '0'; l.style.transition = 'none'; });

  setTimeout(() => {
    phoneEl.style.animation = 'none';
    ringEl.textContent = 'answered. ✓';
    cLines.forEach((line, i) => {
      setTimeout(() => {
        line.style.transition = 'opacity 0.7s ease';
        line.style.opacity = '1';
      }, 550 * (i + 1));
    });
  }, 2200);
}

// ════════════════════════════════════════════════════════════
// STAGE 3 — BLOCK BREAKER
// ════════════════════════════════════════════════════════════
function initBreaker() {
  const canvas = document.getElementById('breaker-canvas');
  const wrap   = canvas.parentElement;

  const W = Math.min(wrap.clientWidth - 16, 480);
  const H = Math.min(wrap.clientHeight - 4, 400);
  canvas.width = W; canvas.height = H;

  const ctx = canvas.getContext('2d');
  if (_breakerAnimId) cancelAnimationFrame(_breakerAnimId);

  document.getElementById('breaker-win').classList.remove('show');
  document.getElementById('breaker-lose').classList.remove('show');

  const COLS = 8, ROWS = 4, GAP = 4;
  const bW = Math.floor((W - GAP * (COLS + 1)) / COLS);
  const bH = 18;
  const ROW_COLORS = ['#6B4C7A','#8B1A1A','#A0522D','#C9A87C'];

  let bricks = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      bricks.push({
        x: GAP + c * (bW + GAP),
        y: 36 + r * (bH + GAP),
        w: bW, h: bH, alive: true,
        color: ROW_COLORS[r],
      });
    }
  }

  const PW = Math.floor(W * 0.22);
  const PH = 9;
  let paddle = { x: W/2 - PW/2, y: H - PH - 12, w: PW, h: PH };
  const BR = 6;
  let ball   = { x: W/2, y: H - 55, vx: 3.2, vy: -3.8, r: BR };
  let lives  = 3;
  let running = true;

  function setLives() {
    document.getElementById('lives-display').textContent =
      '❤️ '.repeat(lives).trim() + ' 🖤'.repeat(3 - lives).trim();
  }
  setLives();

  function movePaddle(cx) {
    const rect = canvas.getBoundingClientRect();
    paddle.x = Math.max(0, Math.min(W - paddle.w, cx - rect.left - paddle.w/2));
  }
  canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    movePaddle(e.touches[0].clientX);
  }, { passive: false });
  canvas.addEventListener('mousemove', e => movePaddle(e.clientX));

  function loop() {
    if (!running) return;
    ctx.fillStyle = '#07070f';
    ctx.fillRect(0, 0, W, H);

    // Move ball
    ball.x += ball.vx; ball.y += ball.vy;

    // Wall bounces
    if (ball.x - ball.r < 0)  { ball.x = ball.r;    ball.vx *= -1; }
    if (ball.x + ball.r > W)  { ball.x = W - ball.r; ball.vx *= -1; }
    if (ball.y - ball.r < 0)  { ball.y = ball.r;    ball.vy *= -1; }

    // Bottom — lose life
    if (ball.y - ball.r > H) {
      lives--;
      setLives();
      if (lives <= 0) {
        running = false;
        document.getElementById('breaker-lose').classList.add('show');
        return;
      }
      ball = { x: paddle.x + paddle.w/2, y: H - 70,
               vx: 3 * (Math.random() > 0.5 ? 1 : -1), vy: -3.8, r: BR };
    }

    // Paddle hit
    if (ball.y + ball.r >= paddle.y &&
        ball.y - ball.r <= paddle.y + paddle.h &&
        ball.x >= paddle.x - ball.r &&
        ball.x <= paddle.x + paddle.w + ball.r) {
      ball.vy = -Math.abs(ball.vy);
      const hit = (ball.x - paddle.x) / paddle.w;
      ball.vx = (hit - 0.5) * 8;
    }

    // Brick hits
    let allGone = true;
    bricks.forEach(b => {
      if (!b.alive) return;
      allGone = false;
      if (ball.x + ball.r > b.x && ball.x - ball.r < b.x + b.w &&
          ball.y + ball.r > b.y && ball.y - ball.r < b.y + b.h) {
        b.alive = false;
        ball.vy *= -1;
      }
    });

    if (allGone) {
      running = false;
      gamesDone[3] = true;
      updateNav();
      document.getElementById('breaker-win').classList.add('show');
      return;
    }

    // Draw bricks
    bricks.forEach(b => {
      if (!b.alive) return;
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.roundRect(b.x, b.y, b.w, b.h, 3);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.07)';
      ctx.fillRect(b.x + 2, b.y + 2, b.w - 4, 3);
    });

    // Draw paddle
    const pg = ctx.createLinearGradient(paddle.x, 0, paddle.x + paddle.w, 0);
    pg.addColorStop(0, '#6B3A1F'); pg.addColorStop(0.5, '#C9A87C'); pg.addColorStop(1, '#6B3A1F');
    ctx.fillStyle = pg;
    ctx.beginPath(); ctx.roundRect(paddle.x, paddle.y, paddle.w, paddle.h, 5); ctx.fill();

    // Draw ball
    ctx.shadowBlur = 12; ctx.shadowColor = 'rgba(201,168,124,0.65)';
    ctx.fillStyle = '#F5ECD7';
    ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;

    _breakerAnimId = requestAnimationFrame(loop);
  }

  _breakerAnimId = requestAnimationFrame(loop);

  document.getElementById('breaker-retry').onclick = () => {
    running = false;
    if (_breakerAnimId) cancelAnimationFrame(_breakerAnimId);
    initBreaker();
  };
  document.getElementById('breaker-next').onclick = () => goTo(4, 1);
}

// ════════════════════════════════════════════════════════════
// STAGE 4 — JOKES
// ════════════════════════════════════════════════════════════
function initJokes() {
  gsap.set(['#cc1','#cc2'], { opacity: 0, y: 22 });
  const fish = document.getElementById('fish-box');
  fish.classList.remove('revealed');

  gsap.to('#cc1', { opacity: 1, y: 0, duration: 0.75, delay: 0.4 });
  gsap.to('#cc2', { opacity: 1, y: 0, duration: 0.75, delay: 0.7 });

  fish.onclick = function() {
    if (this.classList.contains('revealed')) return;
    this.classList.add('revealed');
    spawnConfetti();
  };
}

function spawnConfetti() {
  const colors = ['#C9A87C','#8B1A1A','#F5ECD7','#6B4C7A','#D4956A','#ffffff'];
  for (let i = 0; i < 65; i++) {
    const el = document.createElement('div');
    el.className = 'confetti-piece';
    const dur = 1.3 + Math.random() * 1.4;
    el.style.cssText = `
      left:${15 + Math.random() * 70}%;
      top:-12px;
      background:${colors[Math.floor(Math.random() * colors.length)]};
      border-radius:${Math.random() > 0.5 ? '50%' : '2px'};
      width:${6 + Math.random() * 6}px;
      height:${6 + Math.random() * 6}px;
      animation-duration:${dur}s;
      animation-delay:${Math.random() * 0.45}s;
    `;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), (dur + 0.5) * 1000);
  }
}

// ════════════════════════════════════════════════════════════
// STAGE 5 — STAR HUNT
// ════════════════════════════════════════════════════════════
function initStarHunt() {
  const canvas = document.getElementById('star-canvas');
  const ctx    = canvas.getContext('2d');
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;

  if (_starAnimId) cancelAnimationFrame(_starAnimId);

  let found = 0;
  document.getElementById('star-count').textContent = '0';

  const memories = [
    'He added a stranger. You accepted.',
    'Two horror fans. One story post. Everything changed.',
    "He said something. He doesn't remember what. But he remembers the energy.",
    'The accidental call that started everything.',
    'Iyawomi. Okomi. Names that mean everything.',
    'You be fish. He started it. Obviously.',
    'This moment. Right now. This was always the destination.'
  ];

  // Positions as fractions of screen — below the header (~40% down)
  const positions = [
    [0.18, 0.52], [0.78, 0.46], [0.45, 0.65],
    [0.68, 0.72], [0.22, 0.76], [0.58, 0.55], [0.40, 0.85],
  ];

  const stars = positions.map(([fx, fy], i) => ({
    x: fx * canvas.width,
    y: fy * canvas.height,
    tap: 22,
    found: false,
    twinkle: Math.random() * Math.PI * 2,
    memory: memories[i],
    isFirst: i === 0,
  }));

  // Ambient star field
  const bg = Array.from({ length: 110 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: 0.3 + Math.random() * 0.9,
    a: 0.03 + Math.random() * 0.07,
  }));

  const foundOrder = [];

  function frame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background stars
    bg.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(245,236,215,${s.a})`;
      ctx.fill();
    });

    // Constellation lines between found stars
    if (foundOrder.length > 1) {
      ctx.strokeStyle = 'rgba(201,168,124,0.28)';
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(foundOrder[0].x, foundOrder[0].y);
      foundOrder.slice(1).forEach(s => ctx.lineTo(s.x, s.y));
      ctx.stroke();
    }

    stars.forEach(s => {
      s.twinkle += 0.025;
      if (s.found) {
        // Glow
        const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, 22);
        g.addColorStop(0,   'rgba(201,168,124,0.9)');
        g.addColorStop(0.5, 'rgba(201,168,124,0.2)');
        g.addColorStop(1,   'rgba(201,168,124,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(s.x, s.y, 22, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#F5ECD7';
        ctx.beginPath(); ctx.arc(s.x, s.y, 2.8, 0, Math.PI * 2); ctx.fill();
      } else {
        // Hidden — barely visible
        const pulse = s.isFirst
          ? 0.07 + Math.sin(s.twinkle) * 0.05
          : 0.03 + Math.sin(s.twinkle) * 0.018;
        ctx.fillStyle = `rgba(245,236,215,${pulse})`;
        ctx.beginPath(); ctx.arc(s.x, s.y, 2.2, 0, Math.PI * 2); ctx.fill();
      }
    });

    _starAnimId = requestAnimationFrame(frame);
  }
  frame();

  function handleTap(cx, cy) {
    stars.forEach(s => {
      if (s.found) return;
      if (Math.hypot(cx - s.x, cy - s.y) < s.tap) {
        s.found = true;
        foundOrder.push(s);
        found++;
        document.getElementById('star-count').textContent = found;
        showMemFlash(s.memory);
        if (found === 7) {
          setTimeout(() => {
            showMemFlash('You found them all. Just like I found you — by not even looking.');
            gamesDone[5] = true;
            updateNav();
          }, 1200);
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

function showMemFlash(text) {
  const el = document.getElementById('mem-flash');
  const tx = document.getElementById('mem-text');
  tx.textContent = text;
  el.classList.add('show');
  clearTimeout(window._memT);
  window._memT = setTimeout(() => el.classList.remove('show'), 3200);
}

// ════════════════════════════════════════════════════════════
// STAGE 6 — MEMORY MATCH
// ════════════════════════════════════════════════════════════
function initMemoryMatch() {
  const grid = document.getElementById('match-grid');
  grid.innerHTML = '';
  document.getElementById('match-win-box').classList.remove('show');

  // 4 unique photos — 4 pairs
  const photos = [
    'assets/images/photo1.jpg',
    'assets/images/photo2.jpg',
    'assets/images/photo3.jpg',
    'assets/images/photo4.jpg',
  ];

  const deck = [...photos, ...photos].sort(() => Math.random() - 0.5);
  let flipped = [], matched = 0, busy = false;

  deck.forEach(src => {
    const card = document.createElement('div');
    card.className = 'm-card';
    card.dataset.src = src;
    card.innerHTML = `
      <div class="m-card-inner">
        <div class="m-front">✦</div>
        <div class="m-back"><img src="${src}" alt="Omosile" loading="lazy"></div>
      </div>`;

    card.addEventListener('click', function() {
      if (busy || this.classList.contains('flipped') || this.classList.contains('matched')) return;
      this.classList.add('flipped');
      flipped.push(this);
      if (flipped.length === 2) {
        busy = true;
        setTimeout(() => {
          const [a, b] = flipped;
          if (a.dataset.src === b.dataset.src) {
            a.classList.add('matched');
            b.classList.add('matched');
            matched++;
            if (matched === 4) {
              setTimeout(() => {
                document.getElementById('match-win-box').classList.add('show');
                gamesDone[6] = true;
                updateNav();
              }, 500);
            }
          } else {
            a.classList.remove('flipped');
            b.classList.remove('flipped');
          }
          flipped = []; busy = false;
        }, 950);
      }
    });
    grid.appendChild(card);
  });

  document.getElementById('match-continue').onclick = () => goTo(7, 1);
}

// ════════════════════════════════════════════════════════════
// STAGE 7 — GALLERY
// ════════════════════════════════════════════════════════════
function initGallery() {
  // Add your real photo & video filenames here.
  // For videos add: { type:'video', src:'assets/videos/yourfile.mp4', caption:'' }
  const media = [
    { type: 'image', src: 'assets/images/photo1.jpg', caption: '' },
    { type: 'image', src: 'assets/images/photo2.jpg', caption: '' },
    { type: 'image', src: 'assets/images/photo3.jpg', caption: '' },
    { type: 'image', src: 'assets/images/photo4.jpg', caption: '' },
    { type: 'image', src: 'assets/images/photo5.jpg', caption: '' },
  ];

  let idx = 0;
  const imgEl  = document.getElementById('gal-img');
  const vidEl  = document.getElementById('gal-vid');
  const capEl  = document.getElementById('gal-caption');
  const dotsEl = document.getElementById('gal-dots');

  dotsEl.innerHTML = '';
  media.forEach((_, i) => {
    const d = document.createElement('div');
    d.className = 'gal-dot' + (i === 0 ? ' active' : '');
    dotsEl.appendChild(d);
  });

  function show(n) {
    const item = media[n];
    gsap.to([imgEl, vidEl], {
      opacity: 0, duration: 0.3, onComplete() {
        imgEl.style.display = item.type === 'image' ? 'block' : 'none';
        vidEl.style.display = item.type === 'video' ? 'block' : 'none';
        if (item.type === 'image') { imgEl.src = item.src; gsap.to(imgEl, { opacity: 1, duration: 0.5 }); }
        else { vidEl.src = item.src; vidEl.play(); gsap.to(vidEl, { opacity: 1, duration: 0.5 }); }
        capEl.textContent = item.caption;
        dotsEl.querySelectorAll('.gal-dot').forEach((d, i) => d.classList.toggle('active', i === n));
      }
    });
  }

  // Initial show
  imgEl.src = media[0].src; imgEl.style.display = 'block';
  vidEl.style.display = 'none';

  document.getElementById('gal-prev').onclick = () => { idx = (idx - 1 + media.length) % media.length; show(idx); };
  document.getElementById('gal-next').onclick = () => { idx = (idx + 1) % media.length; show(idx); };
}

// ════════════════════════════════════════════════════════════
// STAGE 8 — CONFESSION
// ════════════════════════════════════════════════════════════
function initConfession() {
  // Each page is an array of { text, cls }
  const pages = [
    [{ text: "I wasn't even supposed to be on Snapchat that day.", cls: 'conf-line' }],
    [{ text: "I don't know what made me open the app. I don't know what made me stop at your profile. I don't know what made me add someone I didn't know, in a country I've never been to, with a name that just said \"Me😌❤️\" like that was enough of a reason.", cls: 'conf-line' }],
    [{ text: 'But it was.', cls: 'conf-line conf-em' }],
    [{ text: "You posted a horror video on your story.\nI had just finished watching one.\nI said something — I don't even remember what.\nBut I remember the energy.\nI remember thinking \"this person is different.\"", cls: 'conf-line' }],
    [
      { text: 'Then you called.', cls: 'conf-line' },
      { text: 'You said it was a mistake.', cls: 'conf-line' },
    ],
    [{ text: "Okomi — that was the best mistake you've ever made.", cls: 'conf-line conf-highlight' }],
    [{ text: "We talked about horror.\nThen books.\nThen life.\nThen everything.\nThen nothing — just talking because stopping felt wrong.", cls: 'conf-line' }],
    [{ text: "I've called you okomi.\nYou've called me Iyawomi.\nI don't know when this became the realest thing in my life but it did.", cls: 'conf-line' }],
    [{ text: "Your father named you Omosile because you completed the house when you arrived.\n\nI believe that.\n\nBecause ever since you arrived in my world —\nsomething in me that I didn't know was unfinished\nfinally felt complete.", cls: 'conf-line' }],
    [{ text: "I'm not good at grand gestures.\nI'm not good at perfect timing.\nBut I built this.\nEvery scene. Every word. Every star you collected.\nAll of it was just me trying to say one thing\nthat I keep almost saying and never do.", cls: 'conf-line' }],
    [
      { text: 'OMOSILE —', cls: 'conf-line conf-name' },
      { text: 'I love you.', cls: 'conf-line conf-declaration' },
    ],
    [{ text: "Not the casual kind.\nThe kind that made me build a whole website\non a phone\njust so the moment I said it\nwould feel as big as it actually is.", cls: 'conf-line' }],
  ];

  let pi = 0;
  const pageEl  = document.getElementById('confession-page');
  const progEl  = document.getElementById('conf-prog');
  const prevBtn = document.getElementById('conf-prev');
  const nextBtn = document.getElementById('conf-next');

  function showPage(n) {
    pageEl.innerHTML = '';
    progEl.textContent = (n + 1) + ' / ' + pages.length;
    prevBtn.disabled = (n === 0);

    pages[n].forEach((item, i) => {
      const el = document.createElement('p');
      el.className = item.cls;
      el.textContent = item.text;
      pageEl.appendChild(el);
      setTimeout(() => el.classList.add('visible'), 80 + i * 220);
    });
  }

  showPage(0);

  nextBtn.onclick = () => {
    if (pi < pages.length - 1) { pi++; showPage(pi); }
    else goTo(9, 1);
  };
  prevBtn.onclick = () => {
    if (pi > 0) { pi--; showPage(pi); }
  };
}

// ════════════════════════════════════════════════════════════
// STAGE 9 — THE ASK
// ════════════════════════════════════════════════════════════
function initAsk() {
  const noBtn  = document.getElementById('btn-no');
  const noMsg  = document.getElementById('no-msg');

  let tries = 0;
  noMsg.textContent = ''; noMsg.classList.remove('show');
  gsap.set(noBtn, { x: 0, y: 0, opacity: 1, scale: 1 });
  noBtn.style.display = 'block';

  const msgs = ['', "That's not it.", 'Nope.', "That's not an option.", "I'm not accepting that."];

  noBtn.onclick = function() {
    tries++;
    if (tries >= 5) {
      gsap.to(noBtn, { opacity: 0, scale: 0, duration: 0.38,
        onComplete: () => { noBtn.style.display = 'none'; } });
      noMsg.textContent = "I'm not accepting that.";
      noMsg.classList.add('show');
      return;
    }
    gsap.to(noBtn, {
      x: (Math.random() - 0.5) * 200,
      y: (Math.random() - 0.5) * 70,
      duration: 0.18, ease: 'power3.out'
    });
    if (msgs[tries]) {
      noMsg.textContent = msgs[tries];
      noMsg.classList.add('show');
    }
  };

  document.getElementById('btn-yes').onclick = () => goTo(10, 1);
}

// ════════════════════════════════════════════════════════════
// STAGE 10 — ENDING (Fireworks)
// ════════════════════════════════════════════════════════════
function initEnding() {
  const canvas = document.getElementById('fireworks-canvas');
  const ctx    = canvas.getContext('2d');
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;

  if (_fireworksAnimId) cancelAnimationFrame(_fireworksAnimId);

  const particles = [];
  const colors = ['#C9A87C','#8B1A1A','#F5ECD7','#6B4C7A','#D4956A','#ffffff','#ffb347'];

  class Rocket {
    constructor() {
      this.x  = canvas.width * (0.2 + Math.random() * 0.6);
      this.y  = canvas.height;
      this.tx = canvas.width * (0.15 + Math.random() * 0.7);
      this.ty = canvas.height * (0.1 + Math.random() * 0.45);
      const dx = this.tx - this.x, dy = this.ty - this.y;
      const d  = Math.hypot(dx, dy);
      const sp = 7 + Math.random() * 4;
      this.vx = dx / d * sp; this.vy = dy / d * sp;
      this.color = colors[Math.floor(Math.random() * colors.length)];
      this.alive = true;
    }
    step() {
      this.x += this.vx; this.y += this.vy;
      if (Math.hypot(this.tx - this.x, this.ty - this.y) < 12) {
        this.alive = false;
        const n = 55 + Math.floor(Math.random() * 35);
        for (let i = 0; i < n; i++) {
          const a = (Math.PI * 2 / n) * i;
          const sp = 2 + Math.random() * 4.5;
          particles.push({
            x: this.x, y: this.y,
            vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
            color: this.color, life: 65 + Math.random() * 35
          });
          particles[particles.length-1].maxLife = particles[particles.length-1].life;
        }
      }
    }
    draw() {
      ctx.beginPath(); ctx.arc(this.x, this.y, 2.2, 0, Math.PI * 2);
      ctx.fillStyle = this.color; ctx.fill();
    }
  }

  const rockets = [];
  let frame = 0;

  function loop() {
    frame++;
    ctx.fillStyle = 'rgba(3,3,5,0.22)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (frame % 42 === 0) rockets.push(new Rocket());

    for (let i = rockets.length - 1; i >= 0; i--) {
      if (!rockets[i].alive) { rockets.splice(i,1); continue; }
      rockets[i].step(); rockets[i].draw();
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx; p.y += p.vy; p.vy += 0.07; p.life--;
      ctx.beginPath(); ctx.arc(p.x, p.y, 1.6, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life / p.maxLife;
      ctx.fill(); ctx.globalAlpha = 1;
      if (p.life <= 0) particles.splice(i, 1);
    }

    _fireworksAnimId = requestAnimationFrame(loop);
  }

  loop();

  // Fade in ending text after fireworks begin
  setTimeout(() => {
    gsap.to('#end-content', { opacity: 1, y: 0, duration: 1.6, ease: 'power2.out' });
  }, 1400);
}

// ════════════════════════════════════════════════════════════
// BOOT
// ════════════════════════════════════════════════════════════
const s0 = document.getElementById('s0');
s0.classList.add('active');
buildDots();
initGate();
