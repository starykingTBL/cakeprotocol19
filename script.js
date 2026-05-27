'use strict';

// ── AURORA BACKGROUND ─────────────────────────────────────
const auroraCanvas = document.getElementById('aurora-bg');
const aC = auroraCanvas.getContext('2d');
function resizeAurora() {
  auroraCanvas.width  = window.innerWidth;
  auroraCanvas.height = window.innerHeight;
}
resizeAurora();
window.addEventListener('resize', resizeAurora);

const auroraWaves = [
  { y: 0.35, color: [0,255,153],   speed: 0.0008, amp: 0.12, phase: 0 },
  { y: 0.50, color: [187,68,255],  speed: 0.0006, amp: 0.10, phase: 2 },
  { y: 0.62, color: [0,170,255],   speed: 0.0010, amp: 0.08, phase: 4 },
  { y: 0.40, color: [255,100,180], speed: 0.0007, amp: 0.09, phase: 1 },
];

let auroraT = 0;
function drawAurora() {
  const W = auroraCanvas.width, H = auroraCanvas.height;
  aC.clearRect(0, 0, W, H);
  aC.fillStyle = '#010308';
  aC.fillRect(0, 0, W, H);

  // stars
  for (let i = 0; i < 120; i++) {
    const sx = (Math.sin(i * 127.1 + 0.3) * 0.5 + 0.5) * W;
    const sy = (Math.sin(i * 311.7 + 0.7) * 0.5 + 0.5) * H * 0.85;
    const sa = 0.15 + (Math.sin(i * 74.3 + auroraT * 0.5) * 0.5 + 0.5) * 0.5;
    const sr = 0.4 + (Math.sin(i * 53.1) * 0.5 + 0.5) * 0.9;
    aC.beginPath();
    aC.arc(sx, sy, sr, 0, Math.PI * 2);
    aC.fillStyle = 'rgba(255,255,255,' + sa + ')';
    aC.fill();
  }

  // aurora waves
  auroraWaves.forEach(w => {
    w.phase += w.speed;
    const baseY = w.y * H;
    const grad = aC.createLinearGradient(0, baseY - H * 0.18, 0, baseY + H * 0.18);
    const [r,g,b] = w.color;
    grad.addColorStop(0,   'rgba(' + r + ',' + g + ',' + b + ',0)');
    grad.addColorStop(0.4, 'rgba(' + r + ',' + g + ',' + b + ',0.13)');
    grad.addColorStop(0.5, 'rgba(' + r + ',' + g + ',' + b + ',0.22)');
    grad.addColorStop(0.6, 'rgba(' + r + ',' + g + ',' + b + ',0.13)');
    grad.addColorStop(1,   'rgba(' + r + ',' + g + ',' + b + ',0)');
    aC.fillStyle = grad;
    aC.beginPath();
    aC.moveTo(0, H);
    for (let x = 0; x <= W; x += 4) {
      const t = x / W;
      const y = baseY
        + Math.sin(t * Math.PI * 3 + w.phase)       * H * w.amp
        + Math.sin(t * Math.PI * 5 + w.phase * 1.3) * H * w.amp * 0.4
        + Math.sin(t * Math.PI * 7 + w.phase * 0.7) * H * w.amp * 0.2;
      aC.lineTo(x, y);
    }
    aC.lineTo(W, H); aC.lineTo(0, H);
    aC.closePath(); aC.fill();
  });

  auroraT += 0.016;
  requestAnimationFrame(drawAurora);
}
drawAurora();

// ── FLOATIES ─────────────────────────────────────────────
const floatiesEl = document.getElementById('floaties');
const FLOATY_SYMBOLS = ['🌸','💫','⭐','🌷','✨','💕','🎀','🌺','💖','🌙'];
let floatyInterval = null;

function spawnFloaty() {
  const el = document.createElement('div');
  el.className = 'floaty';
  el.textContent = FLOATY_SYMBOLS[Math.floor(Math.random() * FLOATY_SYMBOLS.length)];
  const dur = 5 + Math.random() * 6;
  el.style.cssText = 'left:' + (Math.random() * 95) + '%;'
    + 'animation-duration:' + dur + 's;'
    + 'animation-delay:' + (Math.random() * 2) + 's;'
    + 'font-size:' + (0.7 + Math.random() * 1.2) + 'rem;'
    + 'opacity:' + (0.3 + Math.random() * 0.5) + ';';
  floatiesEl.appendChild(el);
  setTimeout(() => el.remove(), (dur + 2.5) * 1000);
}

function startFloaties(fast) {
  if (floatyInterval) clearInterval(floatyInterval);
  floatyInterval = setInterval(spawnFloaty, fast ? 280 : 900);
}
startFloaties(false);

// ── PHASE MANAGER ─────────────────────────────────────────
let activePhase = null;

function showPhase(id) {
  if (activePhase) {
    const old = document.getElementById(activePhase);
    if (old) { old.classList.remove('active'); }
  }
  const el = document.getElementById(id);
  if (el) { el.classList.add('active'); }
  activePhase = id;
}

// ── FIREWORKS ─────────────────────────────────────────────
const fwCanvas = document.getElementById('fireworks-bg');
const fwC = fwCanvas.getContext('2d');
let fwRunning = false, fwAnimId = null;

function resizeFW() {
  fwCanvas.width  = window.innerWidth;
  fwCanvas.height = window.innerHeight;
}
resizeFW();

const FW_COLORS = ['#FFB6C1','#BB44FF','#00FF99','#00AAFF','#FF85A1','#C9A87C','#ffffff','#ffeb3b'];

class FWRocket {
  constructor() {
    this.x  = fwCanvas.width  * (0.15 + Math.random() * 0.7);
    this.y  = fwCanvas.height;
    this.tx = fwCanvas.width  * (0.1  + Math.random() * 0.8);
    this.ty = fwCanvas.height * (0.06 + Math.random() * 0.45);
    const dx = this.tx - this.x, dy = this.ty - this.y;
    const d  = Math.hypot(dx, dy), sp = 8 + Math.random() * 4;
    this.vx = dx / d * sp; this.vy = dy / d * sp;
    this.color = FW_COLORS[Math.floor(Math.random() * FW_COLORS.length)];
    this.alive = true;
  }
  step(sparks) {
    this.x += this.vx; this.y += this.vy;
    if (Math.hypot(this.tx - this.x, this.ty - this.y) < 14) {
      this.alive = false;
      const n = 55 + Math.floor(Math.random() * 30);
      for (let i = 0; i < n; i++) {
        const a = (Math.PI * 2 / n) * i;
        const sp = 2.5 + Math.random() * 5;
        const life = 55 + Math.random() * 35;
        sparks.push({ x:this.x, y:this.y,
          vx:Math.cos(a)*sp, vy:Math.sin(a)*sp,
          color:this.color, life, maxLife:life });
      }
    }
  }
  draw() {
    fwC.beginPath(); fwC.arc(this.x, this.y, 2.2, 0, Math.PI*2);
    fwC.fillStyle = this.color; fwC.fill();
  }
}

function startFireworks() {
  fwCanvas.classList.add('show');
  fwRunning = true;
  resizeFW();
  const rockets = [], sparks = [];
  let frame = 0;
  function loop() {
    if (!fwRunning) return;
    frame++;
    fwC.fillStyle = 'rgba(1,3,8,0.18)';
    fwC.fillRect(0, 0, fwCanvas.width, fwCanvas.height);
    if (frame % 38 === 0) rockets.push(new FWRocket());
    for (let i = rockets.length-1; i >= 0; i--) {
      if (!rockets[i].alive) { rockets.splice(i,1); continue; }
      rockets[i].step(sparks); rockets[i].draw();
    }
    for (let i = sparks.length-1; i >= 0; i--) {
      const p = sparks[i];
      p.x += p.vx; p.y += p.vy; p.vy += 0.08; p.life--;
      fwC.beginPath(); fwC.arc(p.x, p.y, 1.7, 0, Math.PI*2);
      fwC.fillStyle = p.color;
      fwC.globalAlpha = p.life / p.maxLife;
      fwC.fill(); fwC.globalAlpha = 1;
      if (p.life <= 0) sparks.splice(i,1);
    }
    fwAnimId = requestAnimationFrame(loop);
  }
  loop();
}

function stopFireworks() {
  fwRunning = false;
  if (fwAnimId) cancelAnimationFrame(fwAnimId);
  fwCanvas.classList.remove('show');
  fwC.clearRect(0, 0, fwCanvas.width, fwCanvas.height);
}

// ── PHASE 1: OPENING ──────────────────────────────────────
showPhase('ph-opening');

setTimeout(() => {
  runStory();
}, 3200);

// ── PHASE 2: STORY AUTO-SCROLL ────────────────────────────
function runStory() {
  showPhase('ph-story');
  const textEl = document.getElementById('story-text');
  const maskEl = document.getElementById('story-mask');
  const totalH = textEl.scrollHeight;
  const viewH  = maskEl.clientHeight;
  const scrollDist = totalH - viewH;
  const DURATION = 38000; // 38 seconds to read comfortably
  let start = null;
  let animId = null;

  function step(ts) {
    if (!start) start = ts;
    const elapsed = ts - start;
    const progress = Math.min(elapsed / DURATION, 1);
    // ease-in-out so it starts and ends gently
    const eased = progress < 0.5
      ? 2 * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 2) / 2;
    textEl.style.transform = 'translateY(' + (-(eased * scrollDist)) + 'px)';
    if (progress < 1) {
      animId = requestAnimationFrame(step);
    } else {
      setTimeout(runReveal, 1200);
    }
  }
  animId = requestAnimationFrame(step);
}

// ── PHASE 3: REVEAL ───────────────────────────────────────
function runReveal() {
  showPhase('ph-reveal');
  setTimeout(runBirthday, 4000);
}

// ── PHASE 4: BIRTHDAY ─────────────────────────────────────
function runBirthday() {
  showPhase('ph-birthday');
  startFireworks();
  startFloaties(true);

  document.getElementById('btn-party').addEventListener('click', function() {
    stopFireworks();
    startFloaties(false);
    openMenu();
  });
}

// ── PHASE 5: MENU (24hr) ─────────────────────────────────
const STORAGE_KEY = 'omosile_party_start';
const PARTY_DURATION = 24 * 60 * 60 * 1000; // 24 hours ms

function openMenu() {
  // Check 24hr timer
  let startTime = localStorage.getItem(STORAGE_KEY);
  if (!startTime) {
    startTime = Date.now();
    localStorage.setItem(STORAGE_KEY, startTime);
  } else {
    startTime = parseInt(startTime);
    const elapsed = Date.now() - startTime;
    if (elapsed >= PARTY_DURATION) {
      showPhase('ph-over');
      return;
    }
  }

  showPhase('ph-menu');
  buildGallery();
  buildStoryCard();
  startTimer(startTime);
  setupTabs();
  setupGames();
}

// Timer countdown
function startTimer(startTime) {
  function tick() {
    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, PARTY_DURATION - elapsed);
    if (remaining === 0) {
      showPhase('ph-over');
      return;
    }
    const h = Math.floor(remaining / 3600000);
    const m = Math.floor((remaining % 3600000) / 60000);
    const s = Math.floor((remaining % 60000) / 1000);
    document.getElementById('timer-display').textContent =
      String(h).padStart(2,'0') + ':' +
      String(m).padStart(2,'0') + ':' +
      String(s).padStart(2,'0');
  }
  tick();
  setInterval(tick, 1000);
}

// Tabs
function setupTabs() {
  document.querySelectorAll('.m-tab').forEach(tab => {
    tab.addEventListener('click', function() {
      document.querySelectorAll('.m-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.m-content').forEach(c => c.classList.remove('active'));
      this.classList.add('active');
      document.getElementById('tab-' + this.dataset.tab).classList.add('active');
    });
  });
}

// ── GALLERY ───────────────────────────────────────────────
// Add your real filenames below.
// For videos use: { type:'video', src:'assets/videos/video1.mp4', caption:'' }
const MEDIA = [
  { type:'image', src:'assets/images/photo1.jpg', caption:'Okomi 🤍' },
  { type:'image', src:'assets/images/photo2.jpg', caption:'' },
  { type:'image', src:'assets/images/photo3.jpg', caption:'' },
  { type:'image', src:'assets/images/photo4.jpg', caption:'' },
  { type:'image', src:'assets/images/photo5.jpg', caption:'' },
  { type:'image', src:'assets/images/photo6.jpg', caption:'' },
  { type:'image', src:'assets/images/photo7.jpg', caption:'' },
  { type:'image', src:'assets/images/photo8.jpg', caption:'' },
  { type:'image', src:'assets/images/photo9.jpg', caption:'' },
  { type:'image', src:'assets/images/photo10.jpg', caption:'' },
];

function buildGallery() {
  const wrap = document.getElementById('gallery-wrap');
  if (wrap.childElementCount > 0) return;
  MEDIA.forEach(item => {
    const div = document.createElement('div');
    div.className = 'gal-item';
    if (item.type === 'image') {
      const img = document.createElement('img');
      img.src = item.src; img.alt = 'Omosile';
      img.loading = 'lazy';
      div.appendChild(img);
      const bottom = document.createElement('div');
      bottom.className = 'gal-bottom';
      const cap = document.createElement('span');
      cap.className = 'gal-cap'; cap.textContent = item.caption;
      const dl = document.createElement('a');
      dl.className = 'gal-dl'; dl.textContent = 'Save';
      dl.href = item.src; dl.download = '';
      bottom.appendChild(cap); bottom.appendChild(dl);
      div.appendChild(bottom);
    } else {
      const vid = document.createElement('video');
      vid.src = item.src; vid.controls = true;
      vid.setAttribute('playsinline','');
      div.appendChild(vid);
      const bottom = document.createElement('div');
      bottom.className = 'gal-bottom';
      const cap = document.createElement('span');
      cap.className = 'gal-cap'; cap.textContent = item.caption;
      bottom.appendChild(cap);
      div.appendChild(bottom);
    }
    wrap.appendChild(div);
  });
}

// ── STORY CARD ────────────────────────────────────────────
function buildStoryCard() {
  const card = document.getElementById('story-card');
  if (card.textContent.trim()) return;
  card.textContent = `Once upon a time, a young lad was minding his business on Snapchat.

Not looking for anyone. Not expecting anything. Just... there.

Then the algorithm decided to slide a profile his way. Just a name and a vibe that said "Me😌❤️" — like that was reason enough.

He added her. She accepted. He played it cool and didn't text that day. Very classic of him.

But then she posted a horror video on her story. He had literally just finished watching one. So he slid into her DMs. He doesn't remember exactly what he said — but the energy? That, he remembers.

They talked about horror. Then books. Then life. The kind of conversation that sneaks up on you and suddenly it's 3am and neither of you wants to stop.

Then came the call. She says it was a mistake. He picked up anyway. And what was supposed to be a two-second "oops" turned into something that changed everything.

He saved her as Okomi 🤍
She saved him as Iyawomi 🤍

And somewhere between the inside jokes, the late-night calls, and the conversations that hit different when they come from the right person —

They became each other's favourite part of the day.

© starykingTBL`;
}

// ── GAMES ─────────────────────────────────────────────────
function setupGames() {
  document.querySelectorAll('.game-card').forEach(card => {
    card.addEventListener('click', function() {
      const game = this.dataset.game;
      document.getElementById('game-list').style.display = 'none';
      const area = document.getElementById('game-area');
      area.innerHTML = '';
      if (game === 'blockBreaker') launchBlockBreaker(area);
      else if (game === 'bubblePop')   launchBubblePop(area);
      else if (game === 'wordScramble') launchWordScramble(area);
      else if (game === 'memoryMatch') launchMemoryMatch(area);
      else if (game === 'heartCatcher') launchHeartCatcher(area);
    });
  });
}

function backBtn(area) {
  const btn = document.createElement('button');
  btn.className = 'game-back'; btn.textContent = '← Games';
  btn.addEventListener('click', () => {
    area.innerHTML = '';
    document.getElementById('game-list').style.display = 'grid';
  });
  return btn;
}

// ── GAME 1: BLOCK BREAKER ────────────────────────────────
function launchBlockBreaker(area) {
  area.appendChild(backBtn(area));
  const score = document.createElement('p');
  score.className = 'game-score'; score.textContent = 'SCORE: 0';
  area.appendChild(score);

  const canvas = document.createElement('canvas');
  canvas.id = 'game-canvas';
  const W = Math.min(window.innerWidth - 24, 420);
  const H = Math.round(W * 0.75);
  canvas.width = W; canvas.height = H;
  area.appendChild(canvas);

  const msg = document.createElement('p');
  msg.className = 'game-msg'; area.appendChild(msg);

  const ctx = canvas.getContext('2d');
  const COLS = 7, ROWS = 4, GAP = 4;
  const bW = Math.floor((W - GAP*(COLS+1)) / COLS), bH = 16;
  const BCOLS = ['#FF85A1','#BB44FF','#00AAFF','#C9A87C'];
  let bricks = [], sc = 0, lives = 3, running = true;

  for (let r=0; r<ROWS; r++)
    for (let c=0; c<COLS; c++)
      bricks.push({ x:GAP+c*(bW+GAP), y:32+r*(bH+GAP), w:bW, h:bH, alive:true, color:BCOLS[r] });

  const PW = Math.floor(W*0.22), PH = 8;
  let pad = { x:W/2-PW/2, y:H-PH-10, w:PW, h:PH };
  const BR = 6;
  let ball = { x:W/2, y:H-55, vx:3, vy:-3.5, r:BR };

  function movePad(cx) {
    const r = canvas.getBoundingClientRect();
    pad.x = Math.max(0, Math.min(W-pad.w, cx - r.left - pad.w/2));
  }
  canvas.addEventListener('touchmove', e => { e.preventDefault(); movePad(e.touches[0].clientX); }, { passive:false });
  canvas.addEventListener('mousemove', e => movePad(e.clientX));

  function loop() {
    if (!running) return;
    ctx.fillStyle = '#050510'; ctx.fillRect(0,0,W,H);
    ball.x += ball.vx; ball.y += ball.vy;
    if (ball.x-ball.r<0) { ball.x=ball.r; ball.vx*=-1; }
    if (ball.x+ball.r>W) { ball.x=W-ball.r; ball.vx*=-1; }
    if (ball.y-ball.r<0) { ball.y=ball.r; ball.vy*=-1; }
    if (ball.y-ball.r>H) {
      lives--;
      if (lives<=0) {
        running=false;
        msg.textContent = "So close! Try again 💕";
        ctx.fillStyle='rgba(5,5,16,0.85)'; ctx.fillRect(0,0,W,H);
        ctx.fillStyle='#FFB6C1'; ctx.font='bold 1.1rem DM Sans,sans-serif';
        ctx.textAlign='center'; ctx.fillText('Game Over — Try Again!', W/2, H/2);
        return;
      }
      ball={ x:pad.x+pad.w/2, y:H-70, vx:3*(Math.random()>0.5?1:-1), vy:-3.5, r:BR };
    }
    if (ball.y+ball.r>=pad.y && ball.y-ball.r<=pad.y+pad.h &&
        ball.x>=pad.x-ball.r && ball.x<=pad.x+pad.w+ball.r) {
      ball.vy=-Math.abs(ball.vy);
      ball.vx=((ball.x-pad.x)/pad.w-0.5)*8;
    }
    let allGone=true;
    bricks.forEach(b => {
      if (!b.alive) return; allGone=false;
      if (ball.x+ball.r>b.x && ball.x-ball.r<b.x+b.w &&
          ball.y+ball.r>b.y && ball.y-ball.r<b.y+b.h) {
        b.alive=false; ball.vy*=-1; sc+=10;
        score.textContent='SCORE: '+sc;
      }
    });
    if (allGone) {
      running=false;
      msg.textContent='"You broke through everything. That\'s kind of what you did to me too." 💖';
      return;
    }
    bricks.forEach(b => {
      if (!b.alive) return;
      ctx.fillStyle=b.color;
      ctx.beginPath(); ctx.roundRect(b.x,b.y,b.w,b.h,3); ctx.fill();
    });
    // lives hearts
    for (let i=0;i<lives;i++) {
      ctx.font='12px serif'; ctx.fillText('❤',6+i*16, 16);
    }
    const pg=ctx.createLinearGradient(pad.x,0,pad.x+pad.w,0);
    pg.addColorStop(0,'#8B1A4A'); pg.addColorStop(0.5,'#FFB6C1'); pg.addColorStop(1,'#8B1A4A');
    ctx.fillStyle=pg;
    ctx.beginPath(); ctx.roundRect(pad.x,pad.y,pad.w,pad.h,5); ctx.fill();
    ctx.shadowBlur=10; ctx.shadowColor='rgba(255,182,193,0.7)';
    ctx.fillStyle='#fff';
    ctx.beginPath(); ctx.arc(ball.x,ball.y,ball.r,0,Math.PI*2); ctx.fill();
    ctx.shadowBlur=0;
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}

// ── GAME 2: BUBBLE POP ────────────────────────────────────
function launchBubblePop(area) {
  area.appendChild(backBtn(area));
  const score = document.createElement('p');
  score.className = 'game-score'; score.textContent = 'POP: 0';
  area.appendChild(score);
  const canvas = document.createElement('canvas');
  canvas.id = 'game-canvas';
  const W = Math.min(window.innerWidth-24, 420);
  const H = Math.round(W * 1.1);
  canvas.width=W; canvas.height=H;
  area.appendChild(canvas);
  const msg = document.createElement('p');
  msg.className='game-msg'; area.appendChild(msg);

  const ctx = canvas.getContext('2d');
  const COLORS=['#FF85A1','#BB44FF','#00AAFF','#00FF99','#FFB6C1','#ffeb3b'];
  let bubbles=[], popped=0, timer=30, running=true, lastT=null;

  function spawn() {
    bubbles.push({
      x: 20+Math.random()*(W-40),
      y: H+30,
      r: 18+Math.random()*22,
      vy: -(0.8+Math.random()*1.4),
      color: COLORS[Math.floor(Math.random()*COLORS.length)],
      alive: true
    });
  }

  let spawnInt = setInterval(spawn, 700);

  function loop(ts) {
    if (!running) return;
    if (!lastT) lastT=ts;
    const dt=(ts-lastT)/1000; lastT=ts;
    timer=Math.max(0,timer-dt);
    if (timer<=0) {
      running=false;
      clearInterval(spawnInt);
      msg.textContent='You popped '+popped+' bubbles! 💖';
      ctx.fillStyle='rgba(5,5,16,0.8)'; ctx.fillRect(0,0,W,H);
      return;
    }
    ctx.fillStyle='#050510'; ctx.fillRect(0,0,W,H);
    // timer bar
    ctx.fillStyle='rgba(255,182,193,0.15)';
    ctx.fillRect(0,H-6,W,6);
    ctx.fillStyle='#FFB6C1';
    ctx.fillRect(0,H-6,(timer/30)*W,6);

    bubbles.forEach(b => {
      if (!b.alive) return;
      b.y+=b.vy;
      if (b.y+b.r<0) b.alive=false;
      const g=ctx.createRadialGradient(b.x-b.r*0.3,b.y-b.r*0.3,b.r*0.1,b.x,b.y,b.r);
      g.addColorStop(0,'rgba(255,255,255,0.55)');
      g.addColorStop(0.5,b.color+'bb');
      g.addColorStop(1,b.color+'44');
      ctx.fillStyle=g;
      ctx.beginPath(); ctx.arc(b.x,b.y,b.r,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.lineWidth=1.2;
      ctx.stroke();
    });
    bubbles=bubbles.filter(b=>b.alive);

    ctx.fillStyle='rgba(255,182,193,0.6)';
    ctx.font='0.7rem DM Sans,sans-serif'; ctx.textAlign='right';
    ctx.fillText(Math.ceil(timer)+'s', W-8, 18);
    requestAnimationFrame(loop);
  }

  canvas.addEventListener('click', e => {
    const r=canvas.getBoundingClientRect();
    const cx=e.clientX-r.left, cy=e.clientY-r.top;
    bubbles.forEach(b => {
      if (!b.alive) return;
      if (Math.hypot(cx-b.x,cy-b.y)<b.r) {
        b.alive=false; popped++;
        score.textContent='POP: '+popped;
      }
    });
  });
  canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    const r=canvas.getBoundingClientRect();
    [...e.changedTouches].forEach(t => {
      const cx=t.clientX-r.left, cy=t.clientY-r.top;
      bubbles.forEach(b => {
        if (!b.alive) return;
        if (Math.hypot(cx-b.x,cy-b.y)<b.r) { b.alive=false; popped++; score.textContent='POP: '+popped; }
      });
    });
  }, { passive:false });

  requestAnimationFrame(loop);
}

// ── GAME 3: WORD SCRAMBLE ─────────────────────────────────
function launchWordScramble(area) {
  area.appendChild(backBtn(area));
  const WORDS = [
    { word:'OMOSILE',  hint:'Her favourite name 💕' },
    { word:'OKOMI',    hint:'What he calls her 🤍' },
    { word:'IYAWOMI',  hint:'What she calls him 🤍' },
    { word:'HORROR',   hint:'How they started talking 🎬' },
    { word:'SNAPCHAT', hint:'Where it all began 👻' },
    { word:'BIRTHDAY', hint:'What today is 🎂' },
    { word:'LONDON',   hint:'Where she lives ✨' },
  ];
  let idx=0, correct=0;

  function scramble(w) {
    let arr=[...w];
    for (let i=arr.length-1;i>0;i--) {
      const j=Math.floor(Math.random()*(i+1));
      [arr[i],arr[j]]=[arr[j],arr[i]];
    }
    return arr.join('');
  }

  function render() {
    area.innerHTML='';
    area.appendChild(backBtn(area));
    if (idx>=WORDS.length) {
      const done=document.createElement('p');
      done.className='game-msg';
      done.textContent='You got them all! You\'re a genius 💖 (obviously)';
      area.appendChild(done);
      return;
    }
    const item=WORDS[idx];
    let sc=scramble(item.word);
    while (sc===item.word) sc=scramble(item.word);

    const prog=document.createElement('p');
    prog.className='scramble-progress';
    prog.textContent=(idx+1)+' / '+WORDS.length+' · '+correct+' correct';
    area.appendChild(prog);

    const sw=document.createElement('p');
    sw.className='scramble-word'; sw.textContent=sc;
    area.appendChild(sw);

    const hint=document.createElement('p');
    hint.className='scramble-hint'; hint.textContent=item.hint;
    area.appendChild(hint);

    const input=document.createElement('input');
    input.className='scramble-input';
    input.type='text'; input.placeholder='TYPE YOUR ANSWER';
    input.maxLength=item.word.length+2;
    area.appendChild(input);

    const row=document.createElement('div');
    row.className='scramble-row';

    const submit=document.createElement('button');
    submit.className='scramble-btn'; submit.textContent='Check ✓';
    const skip=document.createElement('button');
    skip.className='scramble-btn'; skip.textContent='Skip →';
    row.appendChild(submit); row.appendChild(skip);
    area.appendChild(row);

    const msg=document.createElement('p');
    msg.className='game-msg'; area.appendChild(msg);

    function check() {
      if (input.value.toUpperCase().trim()===item.word) {
        correct++; idx++;
        msg.textContent='Correct! 🎉'; msg.style.color='#00FF99';
        setTimeout(render, 900);
      } else {
        msg.textContent='Not quite... try again 💕'; msg.style.color='#FFB6C1';
      }
    }
    submit.addEventListener('click', check);
    input.addEventListener('keydown', e => { if (e.key==='Enter') check(); });
    skip.addEventListener('click', () => { idx++; render(); });
    setTimeout(() => input.focus(), 100);
  }
  render();
}

// ── GAME 4: MEMORY MATCH ─────────────────────────────────
function launchMemoryMatch(area) {
  area.appendChild(backBtn(area));
  const score=document.createElement('p');
  score.className='game-score'; score.textContent='MATCHES: 0 / 4';
  area.appendChild(score);

  const photos=['assets/images/photo1.jpg','assets/images/photo2.jpg',
                'assets/images/photo3.jpg','assets/images/photo4.jpg'];
  const deck=[...photos,...photos].sort(()=>Math.random()-0.5);
  let flipped=[],matched=0,busy=false;

  const grid=document.createElement('div');
  grid.className='match-grid'; area.appendChild(grid);
  const msg=document.createElement('p');
  msg.className='game-msg'; area.appendChild(msg);

  deck.forEach(src => {
    const card=document.createElement('div');
    card.className='mc'; card.dataset.src=src;
    card.innerHTML='<div class="mc-inner"><div class="mc-front">✦</div><div class="mc-back"><img src="'+src+'" alt="" loading="lazy"></div></div>';
    card.addEventListener('click', function() {
      if (busy||this.classList.contains('flipped')||this.classList.contains('matched')) return;
      this.classList.add('flipped'); flipped.push(this);
      if (flipped.length===2) {
        busy=true;
        setTimeout(() => {
          const [a,b]=flipped;
          if (a.dataset.src===b.dataset.src) {
            a.classList.add('matched'); b.classList.add('matched');
            matched++;
            score.textContent='MATCHES: '+matched+' / 4';
            if (matched===4) msg.textContent='You matched them all! You\'ve always been unforgettable. 💖';
          } else { a.classList.remove('flipped'); b.classList.remove('flipped'); }
          flipped=[]; busy=false;
        }, 900);
      }
    });
    grid.appendChild(card);
  });
}

// ── GAME 5: HEART CATCHER ─────────────────────────────────
function launchHeartCatcher(area) {
  area.appendChild(backBtn(area));
  const score=document.createElement('p');
  score.className='game-score'; score.textContent='CAUGHT: 0';
  area.appendChild(score);

  const canvas=document.createElement('canvas');
  canvas.id='game-canvas';
  const W=Math.min(window.innerWidth-24,420);
  const H=Math.round(W*0.85);
  canvas.width=W; canvas.height=H;
  area.appendChild(canvas);
  const msg=document.createElement('p');
  msg.className='game-msg'; area.appendChild(msg);

  const ctx=canvas.getContext('2d');
  const HEARTS=['💖','💕','💗','💓','💞','🩷'];
  let items=[],caught=0,missed=0,running=true,lastT=null,timer=40;

  let basketX=W/2;
  const BW=70, BH=18;

  function moveBk(cx) {
    const r=canvas.getBoundingClientRect();
    basketX=Math.max(BW/2,Math.min(W-BW/2,cx-r.left));
  }
  canvas.addEventListener('touchmove',e=>{e.preventDefault();moveBk(e.touches[0].clientX);},{passive:false});
  canvas.addEventListener('mousemove',e=>moveBk(e.clientX));

  let spawnInt=setInterval(()=>{
    items.push({
      x:20+Math.random()*(W-40), y:-20,
      vy:1.5+Math.random()*2.5,
      sym:HEARTS[Math.floor(Math.random()*HEARTS.length)],
      size:18+Math.random()*16, alive:true
    });
  },800);

  function loop(ts) {
    if (!running) return;
    if (!lastT) lastT=ts;
    const dt=(ts-lastT)/1000; lastT=ts;
    timer=Math.max(0,timer-dt);

    ctx.fillStyle='#050510'; ctx.fillRect(0,0,W,H);

    // timer bar
    ctx.fillStyle='rgba(255,182,193,0.15)'; ctx.fillRect(0,H-5,W,5);
    ctx.fillStyle='#FFB6C1'; ctx.fillRect(0,H-5,(timer/40)*W,5);

    // basket
    const g=ctx.createLinearGradient(basketX-BW/2,0,basketX+BW/2,0);
    g.addColorStop(0,'#8B1A4A'); g.addColorStop(0.5,'#FFB6C1'); g.addColorStop(1,'#8B1A4A');
    ctx.fillStyle=g;
    ctx.beginPath(); ctx.roundRect(basketX-BW/2,H-BH-20,BW,BH,8); ctx.fill();

    items.forEach(it=>{
      if (!it.alive) return;
      it.y+=it.vy;
      // catch
      if (it.y+it.size/2>=H-BH-20 && it.y-it.size/2<=H-20 &&
          it.x>=basketX-BW/2-10 && it.x<=basketX+BW/2+10) {
        it.alive=false; caught++;
        score.textContent='CAUGHT: '+caught;
      }
      if (it.y-it.size>H) { it.alive=false; missed++; }
      if (it.alive) {
        ctx.font=it.size+'px serif'; ctx.textAlign='center';
        ctx.fillText(it.sym,it.x,it.y);
      }
    });
    items=items.filter(i=>i.alive);

    if (timer<=0) {
      running=false; clearInterval(spawnInt);
      msg.textContent='You caught '+caught+' hearts! 💖 I\'d catch them all for you.';
      ctx.fillStyle='rgba(5,5,16,0.8)'; ctx.fillRect(0,0,W,H);
      return;
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}

// ── CHECK 24HR ON LOAD ────────────────────────────────────
// If user returns and party is over, show over screen
const existingStart = localStorage.getItem(STORAGE_KEY);
if (existingStart) {
  const elapsed = Date.now() - parseInt(existingStart);
  if (elapsed >= PARTY_DURATION) {
    showPhase('ph-over');
  }
}
