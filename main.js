'use strict';
const MUSIC_URL='https://cdn.pixabay.com/audio/2022/10/30/audio_6ac1cef9af.mp3';
const MUSIC_FB='https://cdn.pixabay.com/audio/2021/10/25/audio_5d3af65b77.mp3';
const INTRO_LINES=['Yoo Nigga',"Just like I said, I've decided to add 'H' to Omosile",'So OMOSHILE','Nineteen looks good on you','Really, really good','I made something for you'];
const CAKE_PARTS=['c-plate','c-bottom','c-mid','c-top','c-deco','c-candle'];
const GREETING_LINES=['Nineteen never looked this good 🎂','God did good with you 🤍','This whole thing is for you ♥'];
const GAME_META={snake:{title:'Snake'},runner:{title:'Endless Runner'},brickbreaker:{title:'Brick Breaker'},taptarget:{title:'Tap Target'},'2048':{title:'2048'},memory:{title:'Memory Match'},flappy:{title:'Flappy Style'}};
const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const stageIntro=$('#stage-intro'),stageCake=$('#stage-cake'),stageEnvelope=$('#stage-envelope'),stageLetter=$('#stage-letter'),sectionArcade=$('#section-arcade');
const introTextEl=$('#intro-text'),cakeTitleEl=$('#cake-title'),cakeGreetings=$('#cake-greetings');
const envelopeWrap=$('#envelope-wrap'),letterSalut=$('.letter-salutation'),letterParas=$$('#letter-body p'),letterSign=$('.letter-sign'),arcadeBtn=$('#btn-enter-arcade'),btnOpenGift=$('#btn-open-gift');
const gameOverlay=$('#game-overlay'),gameMount=$('#game-mount'),gameOverTitle=$('#game-overlay-title'),btnBack=$('#btn-back-arcade');
const ambientCanvas=$('#ambient-canvas'),bgMusic=$('#bg-music');
const btnMute=$('#btn-mute'),btnVolUp=$('#btn-vol-up'),btnVolDown=$('#btn-vol-down'),volFill=$('#vol-fill');
const iconSound=$('#icon-sound'),iconMuteSvg=$('#icon-mute'),btnTheme=$('#btn-theme'),iconMoon=$('#icon-moon'),iconSun=$('#icon-sun');
const vnAudio=$('#vn-audio'),vnPlayBtn=$('#vn-play-btn'),vnIconPlay=$('#vn-icon-play'),vnIconPause=$('#vn-icon-pause');
const vnWaveform=$('#vn-waveform'),vnProgress=$('#vn-progress-overlay'),vnTimeCurrent=$('#vn-time-current'),vnTimeTotal=$('#vn-time-total');
const btnGameSettings=$('#btn-game-settings'),settingsPanel=$('#settings-panel'),settingsContent=$('#settings-content'),btnCloseSettings=$('#btn-close-settings');

function wait(ms){return new Promise(r=>setTimeout(r,ms));}
function showStage(el,delay=0){return new Promise(r=>setTimeout(()=>{el.classList.add('active');r();},delay));}
function hideStage(el){el.classList.remove('active');}
function fmtTime(s){if(isNaN(s)||!isFinite(s))return'0:00';return Math.floor(s/60)+':'+(String(Math.floor(s%60)).padStart(2,'0'));}

let audioCtx=null;
function getACtx(){if(!audioCtx)audioCtx=new(window.AudioContext||window.webkitAudioContext)();return audioCtx;}
let masterVol=0.8;
function tone(freq,type,dur,vol=0.12){
  try{const v=vol*masterVol;if(v<=0)return;
  const c=getACtx(),o=c.createOscillator(),g=c.createGain();
  o.connect(g);g.connect(c.destination);o.type=type;
  o.frequency.setValueAtTime(freq,c.currentTime);
  g.gain.setValueAtTime(v,c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+dur);
  o.start(c.currentTime);o.stop(c.currentTime+dur);}catch(e){}
}
window.SFX={
  click(){tone(520,'sine',0.1,0.08);},
  whoosh(){tone(200,'sawtooth',0.25,0.07);setTimeout(()=>tone(420,'sine',0.18,0.05),90);},
  reveal(){tone(660,'sine',0.22,0.06);},
  seal(){tone(300,'triangle',0.35,0.1);setTimeout(()=>tone(180,'triangle',0.25,0.08),140);},
  paper(){tone(800,'sawtooth',0.12,0.035);setTimeout(()=>tone(580,'sawtooth',0.1,0.035),70);},
  arcade(){[523,659,784,1047].forEach((f,i)=>setTimeout(()=>tone(f,'square',0.16,0.07),i*75));},
  score(){tone(880,'sine',0.15,0.1);},
  die(){[400,300,200].forEach((f,i)=>setTimeout(()=>tone(f,'sawtooth',0.2,0.1),i*80));},
  flip(){tone(740,'sine',0.1,0.07);},
  match(){tone(880,'sine',0.12,0.08);setTimeout(()=>tone(1100,'sine',0.1,0.08),100);},
  tap(){tone(600,'sine',0.08,0.06);},
};

let muted=false;
function initMusic(){bgMusic.volume=masterVol;bgMusic.loop=true;bgMusic.src=MUSIC_URL;bgMusic.onerror=()=>{bgMusic.src=MUSIC_FB;bgMusic.play().catch(()=>{});};updateVolUI();}
function tryPlay(){bgMusic.play().catch(()=>{const go=()=>{if(audioCtx&&audioCtx.state==='suspended')audioCtx.resume();bgMusic.play().catch(()=>{});};['touchstart','touchend','click','keydown'].forEach(ev=>document.addEventListener(ev,go,{once:true}));});}
function updateVolUI(){volFill.style.width=(muted?0:masterVol*100)+'%';iconSound.style.display=muted?'none':'block';iconMuteSvg.style.display=muted?'block':'none';}
btnMute.addEventListener('click',()=>{muted=!muted;bgMusic.muted=muted;updateVolUI();window.SFX.click();});
btnVolUp.addEventListener('click',()=>{masterVol=Math.min(1,masterVol+0.1);bgMusic.volume=masterVol;muted=false;bgMusic.muted=false;updateVolUI();window.SFX.click();});
btnVolDown.addEventListener('click',()=>{masterVol=Math.max(0,masterVol-0.1);bgMusic.volume=masterVol;updateVolUI();window.SFX.click();});

let isDark=true;
btnTheme.addEventListener('click',()=>{isDark=!isDark;document.documentElement.setAttribute('data-theme',isDark?'dark':'light');iconMoon.style.display=isDark?'block':'none';iconSun.style.display=isDark?'none':'block';window.SFX.click();});

const Ambient=(()=>{
  const ctx=ambientCanvas.getContext('2d');let W,H,parts,raf,last=0;
  const DELAY=1000/30,N=window.innerWidth<500?16:28;
  function resize(){W=ambientCanvas.width=window.innerWidth;H=ambientCanvas.height=window.innerHeight;}
  function mk(){return{x:Math.random()*(W||window.innerWidth),y:Math.random()*(H||window.innerHeight),r:Math.random()*1.8+0.4,a:Math.random()*Math.PI*2,s:Math.random()*0.15+0.04,o:Math.random()*0.4+0.06,do:(Math.random()-0.5)*0.005};}
  function draw(ts){raf=requestAnimationFrame(draw);if(ts-last<DELAY)return;last=ts;ctx.clearRect(0,0,W,H);for(const p of parts){p.x+=Math.cos(p.a)*p.s;p.y+=Math.sin(p.a)*p.s;p.o=Math.max(0.05,Math.min(0.45,p.o+p.do));if(p.o<=0.05||p.o>=0.45)p.do*=-1;p.a+=0.004;if(p.x<0)p.x=W;if(p.x>W)p.x=0;if(p.y<0)p.y=H;if(p.y>H)p.y=0;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fillStyle=`rgba(139,26,42,${p.o})`;ctx.fill();}}
  return{start(){resize();parts=Array.from({length:N},mk);window.addEventListener('resize',resize);raf=requestAnimationFrame(draw);}};
})();

async function phaseIntro(){
  await showStage(stageIntro);
  for(let i=0;i<INTRO_LINES.length;i++){
    introTextEl.style.cssText='opacity:0;transform:translateY(18px);transition:none;';
    introTextEl.textContent=INTRO_LINES[i];await wait(80);
    introTextEl.style.cssText='opacity:1;transform:translateY(0);transition:opacity 0.7s ease,transform 0.7s ease;';
    window.SFX.reveal();await wait(i===2?2200:1800);
    introTextEl.style.cssText='opacity:0;transform:translateY(-12px);transition:opacity 0.5s ease,transform 0.5s ease;';
    await wait(600);
  }
  hideStage(stageIntro);
}

async function phaseCake(){
  await showStage(stageCake,200);window.SFX.whoosh();
  for(let i=0;i<CAKE_PARTS.length;i++){
    await wait(i===0?100:550);const el=document.getElementById(CAKE_PARTS[i]);
    if(el){el.style.cssText='transi
