'use strict';

const MUSIC_TRACKS = [
  'https://cdn.pixabay.com/audio/2023/10/09/audio_f4c6f5d3e6.mp3',
  'https://cdn.pixabay.com/audio/2022/10/25/audio_946ff838d6.mp3',
];

const INTRO_LINES = [
  'Yoo Nigga',
  "Just like I said, I've decided to add 'H' to Omosile",
  'So OMOSHILE',
  'Nineteen looks good on you',
  'Really, really good',
  'I made something for you',
];

const CAKE_LINES = [
  'Happy Birthday Omoshile',
  'Nineteen never looked this good',
  'This one is all for you ♥',
];

const GAME_META = {
  snake:        { title:'Snake' },
  runner:       { title:'Endless Runner' },
  brickbreaker: { title:'Brick Breaker' },
  taptarget:    { title:'Tap Target' },
  '2048':       { title:'2048' },
  memory:       { title:'Memory Match' },
  flappy:       { title:'Flappy Style' },
};

const $  = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

const stageIntro    = $('#stage-intro');
const stageCake     = $('#stage-cake');
const stageEnvelope = $('#stage-envelope');
const stageLetter   = $('#stage-letter');
const sectionArcade = $('#section-arcade');
const introTextEl   = $('#intro-text');
const cakeGreeting  = $('#cake-greeting');
const envelopeWrap  = $('#envelope-wrap');
const letterSalut   = $('.letter-salutation');
const letterParas   = $$('#letter-body p');
const letterSign    = $('.letter-sign');
const arcadeBtn     = $('#btn-enter-arcade');
const btnOpenGift   = $('#btn-open-gift');
const gameOverlay   = $('#game-overlay');
const gameMount     = $('#game-mount');
const gameOverTitle = $('#game-overlay-title');
const btnBack       = $('#btn-back-arcade');
const ambientCanvas = $('#ambient-canvas');
const bgMusic       = $('#bg-music');
const btnMute       = $('#btn-mute');
const btnVolUp      = $('#btn-vol-up');
const btnVolDown    = $('#btn-vol-down');
const volFill       = $('#vol-fill');
const iconSound     = $('#icon-sound');
const iconMute      = $('#icon-mute');
const btnTheme      = $('#btn-theme');
const iconMoon      = $('#icon-moon');
const iconSun       = $('#icon-sun');

function wait(ms){ return new Promise(r => setTimeout(r, ms)); }

function showStage(el, delay = 0){
  return new Promise(r => {
    setTimeout(() => { el.classList.add('active'); r(); }, delay);
  });
}

function hideStage(el){
  el.classList.remove('active');
}

let audioCtx = null;
function getAudioCtx(){
  if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function playTone(freq, type, duration, vol = 0.15){
  try {
    const ctx  = getAudioCtx();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch(e){}
}

const SFX = {
  click()     { playTone(520,'sine',0.12,0.1); },
  whoosh()    { playTone(200,'sawtooth',0.3,0.08); setTimeout(()=>playTone(400,'sine',0.2,0.06),100); },
  reveal()    { playTone(660,'sine',0.25,0.07); },
  seal()      { playTone(300,'triangle',0.4,0.12); setTimeout(()=>playTone(180,'triangle',0.3,0.1),150); },
  paper()     { playTone(800,'sawtooth',0.15,0.04); setTimeout(()=>playTone(600,'sawtooth',0.12,0.04),80); },
  arcade()    { [523,659,784,1047].forEach((f,i)=>setTimeout(()=>playTone(f,'square',0.18,0.08),i*80)); },
};

let volume = 0.8;
let muted  = false;

function initMusic(){
  bgMusic.src    = MUSIC_TRACKS[0];
  bgMusic.volume = volume;
  bgMusic.loop   = true;
  bgMusic.onerror = () => { bgMusic.src = MUSIC_TRACKS[1]; bgMusic.play().catch(()=>{}); };
  updateVolUI();
}

function tryPlayMusic(){
  bgMusic.play().catch(() => {
    const play = () => { bgMusic.play().catch(()=>{}); };
    document.addEventListener('touchstart', play, { once:true });
    document.addEventListener('click',      play, { once:true });
  });
}

function updateVolUI(){
  volFill.style.width      = (muted ? 0 : volume * 100) + '%';
  iconSound.style.display  = muted ? 'none'  : 'block';
  iconMute.style.display   = muted ? 'block' : 'none';
}

btnMute.addEventListener('click', () => {
  muted = !muted; bgMusic.muted = muted; updateVolUI(); SFX.click();
});
btnVolUp.addEventListener('click', () => {
  volume = Math.min(1, volume + 0.1); bgMusic.volume = volume;
  muted = false; bgMusic.muted = false; updateVolUI(); SFX.click();
});
btnVolDown.addEventListener('click', () => {
  volume = Math.max(0, volume - 0.1); bgMusic.volume = volume; updateVolUI(); SFX.click();
});

let isDark = true;
btnTheme.addEventListener('click', () => {
  isDark = !isDark;
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  iconMoon.style.display = isDark ? 'block' : 'none';
  iconSun.style.display  = isDark ? 'none'  : 'block';
  SFX.click();
});

const Ambient = (() => {
  const ctx = ambientCanvas.getContext('2d');
  let W, H, parts, raf, last = 0;
  const DELAY = 1000 / 30;
  const N = window.innerWidth < 500 ? 16 : 28;
  function resize(){ W = ambientCanvas.width = window.innerWidth; H = ambientCanvas.height = window.innerHeight; }
  function mk(){ return { x:Math.random()*(W||window.innerWidth), y:Math.random()*(H||window.innerHeight), r:Math.random()*1.5+0.3, a:Math.random()*Math.PI*2, s:Math.random()*0.15+0.04, o:Math.random()*0.35+0.05, do:(Math.random()-0.5)*0.005 }; }
  function draw(ts){
    raf = requestAnimationFrame(draw);
    if(ts - last < DELAY) return;
    last = ts;
    ctx.clearRect(0,0,W,H);
    for(const p of parts){
      p.x += Math.cos(p.a)*p.s; p.y += Math.sin(p.a)*p.s;
      p.o  = Math.max(0.04, Math.min(0.4, p.o+p.do));
      if(p.o<=0.04||p.o>=0.4) p.do *= -1;
      p.a += 0.004;
      if(p.x<0) p.x=W; if(p.x>W) p.x=0;
      if(p.y<0) p.y=H; if(p.y>H) p.y=0;
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle = `rgba(139,26,42,${p.o})`; ctx.fill();
    }
  }
  return {
    start(){ resize(); parts = Array.from({length:N},mk); window.addEventListener('resize',resize); raf = requestAnimationFrame(draw); }
  };
})();

async function phaseIntro(){
  await showStage(stageIntro);
  for(let i = 0; i < INTRO_LINES.length; i++){
    introTextEl.style.opacity   = '0';
    introTextEl.style.transform = 'translateY(18px)';
    introTextEl.style.transition= 'none';
    introTextEl.textContent     = INTRO_LINES[i];
    await wait(80);
    introTextEl.style.transition = 'opacity 0.7s ease, transform 0.7s ease';
    introTextEl.style.opacity    = '1';
    introTextEl.style.transform  = 'translateY(0)';
    SFX.reveal();
    await wait(i === 2 ? 2200 : 1800);
    introTextEl.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    introTextEl.style.opacity    = '0';
    introTextEl.style.transform  = 'translateY(-12px)';
    await wait(600);
  }
  hideStage(stageIntro);
}

async function phaseCake(){
  await showStage(stageCake, 200);
  SFX.whoosh();
  const parts = ['c-plate','c-bottom','c-mid','c-top','c-deco','c-candle'];
  for(let i = 0; i < parts.length; i++){
    await wait(i === 0 ? 100 : 600);
    const el = document.getElementById(parts[i]);
    if(el){
      el.style.transition = 'opacity 0.8s ease, transform 0.8s cubic-bezier(0.16,1,0.3,1)';
      el.style.transform  = 'translateY(-10px)';
      el.style.opacity    = '0';
      await wait(30);
      el.style.opacity    = '1';
      el.style.transform  = 'translateY(0)';
      parts[i] === 'c-candle' ? SFX.reveal() : SFX.click();
    }
  }
  await wait(800);
  for(let i = 0; i < CAKE_LINES.length; i++){
    cakeGreeting.textContent = CAKE_LINES[i];
    cakeGreeting.classList.add('show');
    await wait(1800);
    cakeGreeting.classList.remove('show');
    await wait(400);
  }
  await wait(200);
  btnOpenGift.style.transition = 'opacity 0.8s ease';
  btnOpenGift.style.opacity    = '1';
}

async function phaseEnvelope(){
  SFX.whoosh();
  hideStage(stageCake);
  await wait(400);
  await showStage(stageEnvelope);
  envelopeWrap.classList.add('animate-in');
}

async function phaseLetter(){
  SFX.seal();
  envelopeWrap.classList.add('opening');
  await wait(400);
  SFX.paper();
  await wait(700);
  hideStage(stageEnvelope);
  await wait(300);
  showStage(stageLetter);
  await wait(700);
  letterSalut.classList.add('reveal');
  SFX.reveal();
  for(let i = 0; i < letterParas.length; i++){
    await wait(i === 0 ? 600 : 350);
    letterParas[i].style.animationDelay = '0s';
    letterParas[i].classList.add('reveal');
  }
  await wait(600);
  letterSign.classList.add('reveal');
  await wait(600);
  arcadeBtn.classList.add('reveal');
}

async function phaseArcade(){
  SFX.arcade();
  hideStage(stageLetter);
  await wait(500);
  sectionArcade.classList.add('active');
}

let activeGame = null;

function openGame(key){
  const meta = GAME_META[key];
  if(!meta) return;
  SFX.whoosh();
  gameOverTitle.textContent = meta.title;
  gameMount.innerHTML = `
    <div class="game-placeholder">
      <span class="game-placeholder-label">coming soon</span>
      <p class="game-placeholder-title">${meta.title}</p>
      <p class="game-placeholder-sub">This game is being built. It's going to be worth it.</p>
    </div>`;
  gameOverlay.setAttribute('aria-hidden','false');
  gameOverlay.classList.add('active');
  history.pushState({ gameOpen:true }, '');
}

function closeGame(){
  SFX.click();
  if(activeGame && typeof activeGame.destroy === 'function') activeGame.destroy();
  activeGame = null;
  gameOverlay.classList.remove('active');
  gameOverlay.setAttribute('aria-hidden','true');
  gameMount.innerHTML = '';
}

btnOpenGift.addEventListener('click', () => { SFX.click(); phaseEnvelope(); });
envelopeWrap.addEventListener('click', () => phaseLetter());
envelopeWrap.addEventListener('keydown', e => {
  if(e.key==='Enter'||e.key===' '){ e.preventDefault(); phaseLetter(); }
});
$('#btn-enter-arcade').addEventListener('click', () => phaseArcade());
document.addEventListener('click', e => {
  const c = e.target.closest('.game-card[data-game]');
  if(c) openGame(c.dataset.game);
});
document.addEventListener('keydown', e => {
  if(e.key==='Enter'||e.key===' '){
    const c = e.target.closest('.game-card[data-game]');
    if(c){ e.preventDefault(); openGame(c.dataset.game); }
  }
});
btnBack.addEventListener('click', closeGame);
window.addEventListener('popstate', () => {
  if(gameOverlay.classList.contains('active')) closeGame();
});

window.addEventListener('DOMContentLoaded', async () => {
  window.GameRegistry = window.GameRegistry || {};
  Ambient.start();
  initMusic();
  tryPlayMusic();
  await phaseIntro();
  await phaseCake();
});
