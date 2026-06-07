/**
 * CAKEPROTOL19 — main.js
 * Cinematic Sequencer · Ambient Canvas · Arcade Router
 * Pure Vanilla JS. Zero dependencies. Mobile-first.
 */

'use strict';

/* ─────────────────────────────────────────────────────────────
   CONSTANTS & CONFIG
───────────────────────────────────────────────────────────── */
const GAME_META = {
  snake:        { title: 'Snake',         file: 'games/snake.js'        },
  runner:       { title: 'Endless Runner',file: 'games/runner.js'       },
  brickbreaker: { title: 'Brick Breaker', file: 'games/brickbreaker.js' },
  taptarget:    { title: 'Tap Target',    file: 'games/taptarget.js'    },
  '2048':       { title: '2048',          file: 'games/game2048.js'     },
  memory:       { title: 'Memory Match',  file: 'games/memory.js'       },
  flappy:       { title: 'Flappy Style',  file: 'games/flappy.js'       },
};

/* ─────────────────────────────────────────────────────────────
   DOM REFERENCES
───────────────────────────────────────────────────────────── */
const $  = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

const stageHello    = $('#stage-hello');
const stageCake     = $('#stage-cake');
const stageEnvelope = $('#stage-envelope');
const stageLetter   = $('#stage-letter');
const sectionArcade = $('#section-arcade');

const cakeWrapper   = $('.cake-wrapper');
const envelopeWrap  = $('#envelope-wrap');
const letterSalut   = $('.letter-salutation');
const letterParas   = $$('#letter-body p');
const letterSign    = $('.letter-sign');
const arcadeBtn     = $('#btn-enter-arcade');

const btnOpenGift   = $('#btn-open-gift');
const btnEnterArcade= $('#btn-enter-arcade');
const btnBackArcade = $('#btn-back-arcade');

const gameOverlay   = $('#game-overlay');
const gameMount     = $('#game-mount');
const gameOverTitle = $('#game-overlay-title');

const ambientCanvas = $('#ambient-canvas');

/* ─────────────────────────────────────────────────────────────
   STAGE UTILITIES
───────────────────────────────────────────────────────────── */
function showStage(el, delay = 0) {
  return new Promise(resolve => {
    setTimeout(() => {
      el.classList.add('active');
      el.classList.remove('exit');
      resolve();
    }, delay);
  });
}

function hideStage(el, delay = 0) {
  return new Promise(resolve => {
    setTimeout(() => {
      el.classList.remove('active');
      el.classList.add('exit');
      // Remove exit class after transition so it doesn't linger
      el.addEventListener('transitionend', () => el.classList.remove('exit'), { once: true });
      resolve();
    }, delay);
  });
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/* ─────────────────────────────────────────────────────────────
   AMBIENT PARTICLE CANVAS
   Lightweight, RAF-throttled, low particle count for mobile
───────────────────────────────────────────────────────────── */
const AmbientCanvas = (() => {
  const ctx    = ambientCanvas.getContext('2d');
  let W, H, particles, raf, lastFrame = 0;
  const FPS    = 30;
  const FDELAY = 1000 / FPS;
  const COUNT  = window.innerWidth < 500 ? 18 : 32;

  function resize() {
    W = ambientCanvas.width  = window.innerWidth;
    H = ambientCanvas.height = window.innerHeight;
  }

  function mkParticle() {
    return {
      x:  Math.random() * (W || window.innerWidth),
      y:  Math.random() * (H || window.innerHeight),
      r:  Math.random() * 1.5 + 0.3,
      a:  Math.random() * Math.PI * 2,
      s:  Math.random() * 0.18 + 0.04,   // speed
      o:  Math.random() * 0.4 + 0.05,    // opacity
      do: (Math.random() - 0.5) * 0.006, // opacity drift
    };
  }

  function init() {
    resize();
    particles = Array.from({ length: COUNT }, mkParticle);
    window.addEventListener('resize', () => { resize(); });
  }

  function draw(ts) {
    raf = requestAnimationFrame(draw);
    if (ts - lastFrame < FDELAY) return;
    lastFrame = ts;

    ctx.clearRect(0, 0, W, H);

    for (const p of particles) {
      p.x += Math.cos(p.a) * p.s;
      p.y += Math.sin(p.a) * p.s;
      p.o  = Math.max(0.04, Math.min(0.45, p.o + p.do));
      if (p.o <= 0.04 || p.o >= 0.45) p.do *= -1;
      p.a += 0.005;  // slow angle drift

      // Wrap around
      if (p.x < 0) p.x = W;
      if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H;
      if (p.y > H) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(139, 26, 42, ${p.o})`;
      ctx.fill();
    }
  }

  return {
    start() { init(); raf = requestAnimationFrame(draw); },
    stop()  { cancelAnimationFrame(raf); },
  };
})();

/* ─────────────────────────────────────────────────────────────
   CINEMATIC SEQUENCER
───────────────────────────────────────────────────────────── */
const Sequencer = (() => {

  /* ── Phase 1: Hello ─────────────────────────────────────── */
  async function phaseHello() {
    await showStage(stageHello);
    // Hello animation is CSS-driven (5s fade in→out)
    // We wait for it to finish, then transition to cake
    await wait(6200);
    await hideStage(stageHello);
  }

  /* ── Phase 2: Cake ──────────────────────────────────────── */
  async function phaseCake() {
    await showStage(stageCake, 200);
    // Trigger CSS animation on cake wrapper
    await wait(100);
    cakeWrapper.classList.add('animate-in');
  }

  /* ── Phase 3: Envelope ──────────────────────────────────── */
  async function phaseEnvelope() {
    hideStage(stageCake);
    await wait(400);
    await showStage(stageEnvelope);
    await wait(200);
    envelopeWrap.classList.add('animate-in');
  }

  /* ── Phase 4: Letter ────────────────────────────────────── */
  async function phaseLetter() {
    // Envelope "opening" animation
    envelopeWrap.classList.add('opening');
    await wait(600);
    hideStage(stageEnvelope);
    await wait(300);
    showStage(stageLetter);

    // Cascade letter elements in with staggered delays
    await wait(600);
    letterSalut.classList.add('reveal');

    for (let i = 0; i < letterParas.length; i++) {
      await wait(i === 0 ? 500 : 380);
      letterParas[i].style.animationDelay = '0s';
      letterParas[i].classList.add('reveal');
    }

    await wait(600);
    letterSign.classList.add('reveal');
    await wait(500);
    arcadeBtn.classList.add('reveal');
  }

  /* ── Phase 5: Arcade Hub ────────────────────────────────── */
  async function phaseArcade() {
    hideStage(stageLetter);
    await wait(500);
    showArcade();
  }

  /* ── Boot ───────────────────────────────────────────────── */
  async function boot() {
    AmbientCanvas.start();
    await phaseHello();
    await phaseCake();
  }

  return { boot, phaseEnvelope, phaseLetter, phaseArcade };
})();

/* ─────────────────────────────────────────────────────────────
   ARCADE HUB
───────────────────────────────────────────────────────────── */

/** Tracks the currently loaded game module so we can clean up */
let activeGameModule = null;

function showArcade() {
  sectionArcade.classList.add('active');
  document.body.style.overflow = ''; // allow arcade to scroll
}

function openGame(gameKey) {
  const meta = GAME_META[gameKey];
  if (!meta) return;

  gameOverTitle.textContent = meta.title;
  gameMount.innerHTML = '';

  // Show placeholder UI immediately
  gameMount.innerHTML = `
    <div class="game-placeholder">
      <span class="game-placeholder-label">loading</span>
      <p class="game-placeholder-title">${meta.title}</p>
      <p class="game-placeholder-sub">Game module will be injected here.</p>
    </div>
  `;

  gameOverlay.setAttribute('aria-hidden', 'false');
  gameOverlay.classList.add('active');

  // Attempt to dynamically load game script
  loadGameScript(meta.file, gameKey);
}

function loadGameScript(src, gameKey) {
  // Remove old script if present
  const old = document.querySelector(`script[data-game="${gameKey}"]`);
  if (old) old.remove();

  const script = document.createElement('script');
  script.src = src;
  script.dataset.game = gameKey;
  script.onload = () => {
    // Each game script should expose window.GameRegistry[gameKey]
    const registry = window.GameRegistry;
    if (registry && registry[gameKey]) {
      gameMount.innerHTML = '';
      activeGameModule = registry[gameKey];
      activeGameModule.mount(gameMount);
    }
  };
  script.onerror = () => {
    // Script not yet built — placeholder stays, no crash
    const ph = gameMount.querySelector('.game-placeholder-label');
    if (ph) ph.textContent = 'coming soon';
  };
  document.body.appendChild(script);
}

function closeGame() {
  if (activeGameModule && typeof activeGameModule.destroy === 'function') {
    activeGameModule.destroy();
  }
  activeGameModule = null;
  gameOverlay.classList.remove('active');
  gameOverlay.setAttribute('aria-hidden', 'true');
  gameMount.innerHTML = '';
}

/* ─────────────────────────────────────────────────────────────
   EVENT LISTENERS
───────────────────────────────────────────────────────────── */

/* Open Gift → Envelope */
btnOpenGift.addEventListener('click', () => {
  Sequencer.phaseEnvelope();
});

/* Envelope → Letter */
function handleEnvelopeOpen() {
  Sequencer.phaseLetter();
}
envelopeWrap.addEventListener('click',   handleEnvelopeOpen);
envelopeWrap.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    handleEnvelopeOpen();
  }
});

/* Enter Arcade */
btnEnterArcade.addEventListener('click', () => {
  Sequencer.phaseArcade();
});

/* Game card clicks */
document.addEventListener('click', e => {
  const card = e.target.closest('.game-card[data-game]');
  if (card) openGame(card.dataset.game);
});

/* Game card keyboard */
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') {
    const card = e.target.closest('.game-card[data-game]');
    if (card) {
      e.preventDefault();
      openGame(card.dataset.game);
    }
  }
});

/* Back to arcade */
btnBackArcade.addEventListener('click', closeGame);

/* Hardware back / swipe back on mobile (popstate) */
window.addEventListener('popstate', () => {
  if (gameOverlay.classList.contains('active')) closeGame();
});

/* Push a state so back button closes overlay instead of navigating away */
document.addEventListener('click', e => {
  if (e.target.closest('.game-card[data-game]')) {
    history.pushState({ gameOpen: true }, '');
  }
});

/* ─────────────────────────────────────────────────────────────
   BOOT
───────────────────────────────────────────────────────────── */
window.addEventListener('DOMContentLoaded', () => {
  // Expose a global registry for game modules to hook into
  window.GameRegistry = window.GameRegistry || {};

  // Kick off the cinematic sequence
  Sequencer.boot();
});
