'use strict';

const MUSIC_URL = 'https://cdn.pixabay.com/audio/2024/11/13/audio_7c80a526db.mp3';

const INTRO_LINES = [
  'Yoo Nigga',
  "Just like I said, I've decided to add 'H' to Omosile",
  'So OMOSHILE',
  'Nineteen looks good on you',
  'Really, really good',
  'I made something for you',
];

const CAKE_PARTS = ['c-plate','c-bottom','c-mid','c-top','c-deco','c-candle'];

const GREETING_LINES = [
  'Nineteen never looked this good 🎂',
  'God did good with you 🤍',
  'This whole thing is for you ♥',
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

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

const stageIntro    = $('#stage-intro');
const stageCake     = $('#stage-cake');
const stageEnvelope = $('#stage-envelope');
const stageLetter   = $('#stage-letter');
const sectionArcade = $('#section-arcade');
const introTextEl   = $('#intro-text');
const cakeTitleEl   = $('#cake-title');
const cakeGreetings = $('#cake-greetings');
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
const iconMuteSvg   = $('#icon-mute');
const btnTheme      = $('#btn-theme');
const iconMoon      = $('#icon-moon');
const iconSun       = $('#icon-sun');
const vnAudio       = $('#vn-audio');
const vnPlayBtn     = $('#vn-play-btn');
const vnIconPlay    = $('#vn-icon-play');
const vnIconPause   = $('#vn-icon-pause');
const vnWaveform    = $('#vn-waveform');
const vnProgress    = $('#vn-progress-overlay');
const vnTimeCurrent = $('#vn-time-current');
const vnTimeTotal   = $('#vn-time-total');

function wait(ms){ return new Promise(r => setTimeout(r, ms)); }
function showStage(el, delay = 0){
  return new Promise(r => setTimeout(() => { el.classList.add('active'); r(); }, delay));
}
function hideStage(el){ el.classList.remove('active'); }
function fmtTime(s){
  const m = Math.floor(s/60);
  return m+':'+(String(Math.floor(s%60)).padStart(2,'0'));
}

let audioCtx = null;
function getACtx(){
  if(!audioCtx) audioCtx = new (window.AudioContext||window.webkitAudioContext)();
  return audioCtx;
}
function tone(freq,type,dur,vol=0.12){
  try{
    const c=getACtx(),o=c.createOscillator(),g=c.createGain();
    o.connect(g);g.connect(c.destination);
    o.type=type;o.frequency.setValueAtTime(freq,c.currentTime);
    g.gain.setValueAtTime(vol,c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+dur);
    o.start(c.currentTime);o.stop(c.currentTime+dur);
  }catch(e){}
}
const SFX = {
  click()  { tone(520,'sine',0.1,0.08); },
  whoosh() { tone(200,'sawtooth',0.25,0.07);setTimeout(()=>tone(420,'sine',0.18,0.05),90); },
  reveal() { tone(660,'sine',0.22,0.06); },
  seal()   { tone(300,'triangle',0.35,0.1);setTimeout(()=>tone(180,'triangle',0.25,0.08),140); },
  paper()  { tone(800,'sawtooth',0.12,0.035);setTimeout(()=>tone(580,'sawtooth',0.1,0.035),70); },
  arcade() { [523,659,784,1047].forEach((f,i)=>setTimeout(()=>tone(f,'square',0.16,0.07),i*75)); },
};

let volume=0.75, muted=false;
function initMusic(){
  bgMusic.src=MUSIC_URL;
  bgMusic.volume=volume;
  bgMusic.loop=true;
  updateVolUI();
}
function tryPlay(){
  bgMusic.play().catch(()=>{
    const go=()=>bgMusic.play().catch(()=>{});
    document.addEventListener('touchstart',go,{once:true});
    document.addEventListener('click',go,{once:true});
  });
}
function updateVolUI(){
  volFill.style.width=(muted?0:volume*100)+'%';
  iconSound.style.display=muted?'none':'block';
  iconMuteSvg.style.display=muted?'block':'none';
}
btnMute.addEventListener('click',()=>{ muted=!muted;bgMusic.muted=muted;updateVolUI();SFX.click(); });
btnVolUp.addEventListener('click',()=>{ volume=Math.min(1,volume+0.1);bgMusic.volume=volume;muted=false;bgMusic.muted=false;updateVolUI();SFX.click(); });
btnVolDown.addEventListener('click',()=>{ volume=Math.max(0,volume-0.1);bgMusic.volume=volume;updateVolUI();SFX.click(); });

let isDark=true;
btnTheme.addEventListener('click',()=>{
  isDark=!isDark;
  document.documentElement.setAttribute('data-theme',isDark?'dark':'light');
  iconMoon.style.display=isDark?'block':'none';
  iconSun.style.display=isDark?'none':'block';
  SFX.click();
});

const Ambient=(()=>{
  const ctx=ambientCanvas.getContext('2d');
  let W,H,parts,raf,last=0;
  const DELAY=1000/30,N=window.innerWidth<500?16:28;
  function resize(){ W=ambientCanvas.width=window.innerWidth;H=ambientCanvas.height=window.innerHeight; }
  function mk(){ return{x:Math.random()*(W||window.innerWidth),y:Math.random()*(H||window.innerHeight),r:Math.random()*1.5+0.3,a:Math.random()*Math.PI*2,s:Math.random()*0.15+0.04,o:Math.random()*0.35+0.05,do:(Math.random()-0.5)*0.005}; }
  function draw(ts){
    raf=requestAnimationFrame(draw);
    if(ts-last<DELAY)return;
    last=ts;ctx.clearRect(0,0,W,H);
    for(const p of parts){
      p.x+=Math.cos(p.a)*p.s;p.y+=Math.sin(p.a)*p.s;
      p.o=Math.max(0.04,Math.min(0.4,p.o+p.do));
      if(p.o<=0.04||p.o>=0.4)p.do*=-1;
      p.a+=0.004;
      if(p.x<0)p.x=W;if(p.x>W)p.x=0;
      if(p.y<0)p.y=H;if(p.y>H)p.y=0;
      ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle=`rgba(139,26,42,${p.o})`;ctx.fill();
    }
  }
  return{ start(){ resize();parts=Array.from({length:N},mk);window.addEventListener('resize',resize);raf=requestAnimationFrame(draw); } };
})();

async function phaseIntro(){
  await showStage(stageIntro);
  for(let i=0;i<INTRO_LINES.length;i++){
    introTextEl.style.cssText='opacity:0;transform:translateY(18px);transition:none;';
    introTextEl.textContent=INTRO_LINES[i];
    await wait(80);
    introTextEl.style.cssText='opacity:1;transform:translateY(0);transition:opacity 0.7s ease,transform 0.7s ease;';
    SFX.reveal();
    await wait(i===2?2200:1800);
    introTextEl.style.cssText='opacity:0;transform:translateY(-12px);transition:opacity 0.5s ease,transform 0.5s ease;';
    await wait(600);
  }
  hideStage(stageIntro);
}

async function phaseCake(){
  await showStage(stageCake,200);
  SFX.whoosh();
  for(let i=0;i<CAKE_PARTS.length;i++){
    await wait(i===0?100:550);
    const el=document.getElementById(CAKE_PARTS[i]);
    if(el){
      el.style.cssText='transition:opacity 0.8s ease,transform 0.8s cubic-bezier(0.16,1,0.3,1);opacity:0;transform:translateY(-10px);';
      await wait(30);
      el.style.opacity='1';el.style.transform='translateY(0)';
      CAKE_PARTS[i]==='c-candle'?SFX.reveal():SFX.click();
    }
  }
  await wait(600);
  cakeTitleEl.textContent='Happy Birthday Omoshile';
  cakeTitleEl.classList.add('show');
  SFX.reveal();
  await wait(800);
  for(let i=0;i<GREETING_LINES.length;i++){
    await wait(700);
    const line=document.createElement('p');
    line.className='cake-greeting-line';
    line.textContent=GREETING_LINES[i];
    cakeGreetings.appendChild(line);
    await wait(30);
    line.classList.add('show');
    SFX.reveal();
  }
  await wait(800);
  btnOpenGift.style.cssText='opacity:1;transition:opacity 0.8s ease;';
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
  await wait(400);SFX.paper();
  await wait(700);
  hideStage(stageEnvelope);
  await wait(300);
  showStage(stageLetter);
  await wait(700);
  letterSalut.classList.add('reveal');SFX.reveal();
  for(let i=0;i<letterParas.length;i++){
    await wait(i===0?600:340);
    letterParas[i].style.animationDelay='0s';
    letterParas[i].classList.add('reveal');
  }
  await wait(600);letterSign.classList.add('reveal');
  await wait(600);arcadeBtn.classList.add('reveal');
}

async function phaseArcade(){
  SFX.arcade();
  hideStage(stageLetter);
  await wait(500);
  sectionArcade.classList.add('active');
}

$$('.tab-btn').forEach(btn=>{
  btn.addEventListener('click',()=>{
    $$('.tab-btn').forEach(b=>b.classList.remove('active'));
    $$('.tab-panel').forEach(p=>p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-'+btn.dataset.tab).classList.add('active');
    SFX.click();
  });
});

function drawWaveform(){
  const canvas=vnWaveform;
  const ctx=canvas.getContext('2d');
  const W=canvas.offsetWidth||300;
  const H=canvas.offsetHeight||56;
  canvas.width=W;canvas.height=H;
  const bars=60;const gap=2;const bw=(W-(bars-1)*gap)/bars;
  ctx.clearRect(0,0,W,H);
  for(let i=0;i<bars;i++){
    const h=Math.random()*0.7*H+0.1*H;
    const x=i*(bw+gap);
    const y=(H-h)/2;
    ctx.fillStyle='rgba(139,26,42,0.5)';
    ctx.beginPath();
    ctx.roundRect?ctx.roundRect(x,y,bw,h,2):ctx.rect(x,y,bw,h);
    ctx.fill();
  }
}

vnAudio.src='media/voicenote.mp3';
vnAudio.addEventListener('loadedmetadata',()=>{ vnTimeTotal.textContent=fmtTime(vnAudio.duration); });
vnAudio.addEventListener('timeupdate',()=>{
  const pct=vnAudio.duration?(vnAudio.currentTime/vnAudio.duration)*100:0;
  vnProgress.style.width=pct+'%';
  vnTimeCurrent.textContent=fmtTime(vnAudio.currentTime);
});
vnAudio.addEventListener('ended',()=>{
  vnIconPlay.style.display='block';vnIconPause.style.display='none';
  vnProgress.style.width='0%';vnTimeCurrent.textContent='0:00';
});
vnPlayBtn.addEventListener('click',()=>{
  if(vnAudio.paused){
    vnAudio.play().catch(()=>{});
    vnIconPlay.style.display='none';vnIconPause.style.display='block';
  } else {
    vnAudio.pause();
    vnIconPlay.style.display='block';vnIconPause.style.display='none';
  }
  SFX.click();
});

let activeGame=null;
function openGame(key){
  const meta=GAME_META[key];if(!meta)return;
  SFX.whoosh();
  gameOverTitle.textContent=meta.title;
  gameMount.innerHTML=`
    <div class="game-placeholder">
      <span class="game-placeholder-label">coming soon</span>
      <p class="game-placeholder-title">${meta.title}</p>
      <p class="game-placeholder-sub">Being built. Worth the wait.</p>
    </div>`;
  gameOverlay.setAttribute('aria-hidden','false');
  gameOverlay.classList.add('active');
  history.pushState({gameOpen:true},'');
}
function closeGame(){
  SFX.click();
  if(activeGame&&typeof activeGame.destroy==='function')activeGame.destroy();
  activeGame=null;
  gameOverlay.classList.remove('active');
  gameOverlay.setAttribute('aria-hidden','true');
  gameMount.innerHTML='';
}

btnOpenGift.addEventListener('click',()=>{ SFX.click();phaseEnvelope(); });
envelopeWrap.addEventListener('click',()=>phaseLetter());
envelopeWrap.addEventListener('keydown',e=>{ if(e.key==='Enter'||e.key===' '){e.preventDefault();phaseLetter();} });
$('#btn-enter-arcade').addEventListener('click',()=>phaseArcade());
document.addEventListener('click',e=>{
  const c=e.target.closest('.game-card[data-game]');if(c)openGame(c.dataset.game);
});
document.addEventListener('keydown',e=>{
  if(e.key==='Enter'||e.key===' '){
    const c=e.target.closest('.game-card[data-game]');
    if(c){e.preventDefault();openGame(c.dataset.game);}
  }
});
btnBack.addEventListener('click',closeGame);
window.addEventListener('popstate',()=>{ if(gameOverlay.classList.contains('active'))closeGame(); });

window.addEventListener('DOMContentLoaded',async()=>{
  window.GameRegistry=window.GameRegistry||{};
  Ambient.start();
  initMusic();
  tryPlay();
  setTimeout(drawWaveform,500);
  await phaseIntro();
  await phaseCake();
});
