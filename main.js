'use strict';
const MUSIC_URL='https://cdn.pixabay.com/audio/2023/05/16/audio_b6e8892e4a.mp3';
const MUSIC_FB='https://cdn.pixabay.com/audio/2022/10/30/audio_6ac1cef9af.mp3';
const INTRO_LINES=['Yoo Nigga',"Just like I said, I've decided to add 'H' to Omosile",'So OMOSHILE','Nineteen looks good on you','Really, really good','I made something for you'];
const CAKE_PARTS=['c-plate','c-bottom','c-mid','c-top','c-deco','c-candle'];
const GREET=['Nineteen never looked this good 🎂','God did good with you 🤍','This whole thing is for you ♥'];
const GAME_META={snake:{title:'Snake'},runner:{title:'Endless Runner'},brickbreaker:{title:'Brick Breaker'},taptarget:{title:'Tap Target'},'2048':{title:'2048'},memory:{title:'Memory Match'},flappy:{title:'Flappy Style'}};
const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const stageIntro=$('#stage-intro'),stageCake=$('#stage-cake'),stageEnv=$('#stage-envelope'),stageLetter=$('#stage-letter'),arcade=$('#section-arcade');
const introEl=$('#intro-text'),cakeTitle=$('#cake-title'),cakeGreets=$('#cake-greetings');
const envWrap=$('#envelope-wrap'),salut=$('.letter-salutation'),paras=$$('#letter-body p'),sign=$('.letter-sign'),arcBtn=$('#btn-enter-arcade'),giftBtn=$('#btn-open-gift');
const overlay=$('#game-overlay'),mount=$('#game-mount'),overlayTitle=$('#game-overlay-title'),backBtn=$('#btn-back-arcade');
const amb=$('#ambient-canvas'),bgMusic=$('#bg-music');
const btnMute=$('#btn-mute'),btnUp=$('#btn-vol-up'),btnDown=$('#btn-vol-down'),volFill=$('#vol-fill');
const iSound=$('#icon-sound'),iMute=$('#icon-mute'),btnTheme=$('#btn-theme'),iMoon=$('#icon-moon'),iSun=$('#icon-sun');
const vnAudio=$('#vn-audio'),vnBtn=$('#vn-play-btn'),vnPlay=$('#vn-icon-play'),vnPause=$('#vn-icon-pause');
const vnCanvas=$('#vn-waveform'),vnProg=$('#vn-progress-overlay'),vnCur=$('#vn-time-current'),vnTot=$('#vn-time-total');
const settPanel=$('#settings-panel'),settContent=$('#settings-content'),settClose=$('#btn-close-settings'),settBtn=$('#btn-game-settings');

const wait=ms=>new Promise(r=>setTimeout(r,ms));
function show(el,d=0){return new Promise(r=>setTimeout(()=>{el.classList.add('active');r();},d));}
function hide(el){el.classList.remove('active');}
function fmt(s){if(!isFinite(s)||isNaN(s))return'0:00';return Math.floor(s/60)+':'+(String(Math.floor(s%60)).padStart(2,'0'));}

let aCtx=null;
function getACtx(){if(!aCtx)aCtx=new(window.AudioContext||window.webkitAudioContext)();return aCtx;}
let vol=0.75,muted=false;
function tone(f,t,d,v=0.12){try{const vv=v*vol;if(vv<=0)return;const c=getACtx(),o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.type=t;o.frequency.setValueAtTime(f,c.currentTime);g.gain.setValueAtTime(vv,c.currentTime);g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+d);o.start(c.currentTime);o.stop(c.currentTime+d);}catch(e){}}
window.SFX={
  click(){tone(520,'sine',.1,.08);},
  whoosh(){tone(200,'sawtooth',.25,.07);setTimeout(()=>tone(420,'sine',.18,.05),90);},
  reveal(){tone(660,'sine',.22,.06);},
  seal(){tone(300,'triangle',.35,.1);setTimeout(()=>tone(180,'triangle',.25,.08),140);},
  paper(){tone(800,'sawtooth',.12,.035);setTimeout(()=>tone(580,'sawtooth',.1,.035),70);},
  arcade(){[523,659,784,1047].forEach((f,i)=>setTimeout(()=>tone(f,'square',.16,.07),i*75));},
  score(){tone(880,'sine',.15,.1);},
  die(){[400,300,200].forEach((f,i)=>setTimeout(()=>tone(f,'sawtooth',.2,.1),i*80));},
  flip(){tone(740,'sine',.1,.07);},
  match(){tone(880,'sine',.12,.08);setTimeout(()=>tone(1100,'sine',.1,.08),100);},
  tap(){tone(600,'sine',.08,.06);},
};

function initMusic(){bgMusic.volume=vol;bgMusic.loop=true;bgMusic.src=MUSIC_URL;bgMusic.onerror=()=>{bgMusic.src=MUSIC_FB;bgMusic.play().catch(()=>{});};updateVol();}
function tryPlay(){bgMusic.play().catch(()=>{const g=()=>{if(aCtx&&aCtx.state==='suspended')aCtx.resume();bgMusic.play().catch(()=>{});};['touchstart','touchend','click','keydown'].forEach(e=>document.addEventListener(e,g,{once:true}));});}
function updateVol(){volFill.style.width=(muted?0:vol*100)+'%';iSound.style.display=muted?'none':'block';iMute.style.display=muted?'block':'none';}
btnMute.addEventListener('click',()=>{muted=!muted;bgMusic.muted=muted;updateVol();window.SFX.click();});
btnUp.addEventListener('click',()=>{vol=Math.min(1,vol+.1);bgMusic.volume=vol;muted=false;bgMusic.muted=false;updateVol();window.SFX.click();});
btnDown.addEventListener('click',()=>{vol=Math.max(0,vol-.1);bgMusic.volume=vol;updateVol();window.SFX.click();});

let dark=true;
btnTheme.addEventListener('click',()=>{dark=!dark;document.documentElement.setAttribute('data-theme',dark?'dark':'light');iMoon.style.display=dark?'block':'none';iSun.style.display=dark?'none':'block';window.SFX.click();});

const Ambient=(()=>{
  const ctx=amb.getContext('2d');let W,H,pts,raf,last=0;const DL=1000/30,N=window.innerWidth<500?16:28;
  function resize(){W=amb.width=window.innerWidth;H=amb.height=window.innerHeight;}
  function mk(){return{x:Math.random()*(W||window.innerWidth),y:Math.random()*(H||window.innerHeight),r:Math.random()*1.8+.4,a:Math.random()*Math.PI*2,s:Math.random()*.15+.04,o:Math.random()*.4+.06,do:(Math.random()-.5)*.005};}
  function draw(ts){raf=requestAnimationFrame(draw);if(ts-last<DL)return;last=ts;ctx.clearRect(0,0,W,H);for(const p of pts){p.x+=Math.cos(p.a)*p.s;p.y+=Math.sin(p.a)*p.s;p.o=Math.max(.05,Math.min(.45,p.o+p.do));if(p.o<=.05||p.o>=.45)p.do*=-1;p.a+=.004;if(p.x<0)p.x=W;if(p.x>W)p.x=0;if(p.y<0)p.y=H;if(p.y>H)p.y=0;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fillStyle=`rgba(139,26,42,${p.o})`;ctx.fill();}}
  return{start(){resize();pts=Array.from({length:N},mk);window.addEventListener('resize',resize);raf=requestAnimationFrame(draw);}};
})();

async function phaseIntro(){
  await show(stageIntro);
  for(let i=0;i<INTRO_LINES.length;i++){
    introEl.style.cssText='opacity:0;transform:translateY(18px);transition:none;font-family:\'Cormorant Garamond\',Georgia,serif;font-size:clamp(1.8rem,7vw,3.6rem);font-style:italic;font-weight:700;color:var(--c-text);text-align:center;padding:2rem;max-width:700px;line-height:1.3;text-shadow:0 2px 20px rgba(139,26,42,.5);';
    introEl.textContent=INTRO_LINES[i];await wait(80);
    introEl.style.transition='opacity .7s ease,transform .7s ease';introEl.style.opacity='1';introEl.style.transform='translateY(0)';
    window.SFX.reveal();await wait(i===2?2200:1800);
    introEl.style.transition='opacity .5s ease,transform .5s ease';introEl.style.opacity='0';introEl.style.transform='translateY(-12px)';
    await wait(600);
  }
  hide(stageIntro);
}

async function phaseCake(){
  await show(stageCake,200);window.SFX.whoosh();
  for(let i=0;i<CAKE_PARTS.length;i++){
    await wait(i===0?100:550);const el=document.getElementById(CAKE_PARTS[i]);
    if(el){el.style.transition='opacity .8s ease,transform .8s cubic-bezier(0.16,1,0.3,1)';el.style.opacity='0';el.style.transform='translateY(-10px)';await wait(30);el.style.opacity='1';el.style.transform='translateY(0)';CAKE_PARTS[i]==='c-candle'?window.SFX.reveal():window.SFX.click();}
  }
  await wait(600);cakeTitle.textContent='Happy Birthday Omoshile';cakeTitle.classList.add('show');window.SFX.reveal();
  await wait(800);
  for(let i=0;i<GREET.length;i++){await wait(700);const l=document.createElement('p');l.className='cake-greeting-line';l.textContent=GREET[i];cakeGreets.appendChild(l);await wait(30);l.classList.add('show');window.SFX.reveal();}
  await wait(800);giftBtn.style.transition='opacity .8s ease';giftBtn.style.opacity='1';
}

async function phaseEnv(){window.SFX.whoosh();hide(stageCake);await wait(400);await show(stageEnv);envWrap.classList.add('animate-in');}
async function phaseLetter(){
  window.SFX.seal();envWrap.classList.add('opening');await wait(400);window.SFX.paper();await wait(700);
  hide(stageEnv);await wait(300);show(stageLetter);await wait(700);
  salut.classList.add('reveal');window.SFX.reveal();
  for(let i=0;i<paras.length;i++){await wait(i===0?600:340);paras[i].style.animationDelay='0s';paras[i].classList.add('reveal');}
  await wait(600);sign.classList.add('reveal');await wait(600);arcBtn.classList.add('reveal');
}
async function phaseArcade(){window.SFX.arcade();hide(stageLetter);await wait(500);arcade.classList.add('active');}

$$('.tab-btn').forEach(b=>b.addEventListener('click',()=>{$$('.tab-btn').forEach(x=>x.classList.remove('active'));$$('.tab-panel').forEach(x=>x.classList.remove('active'));b.classList.add('active');document.getElementById('tab-'+b.dataset.tab).classList.add('active');window.SFX.click();}));

function drawWave(){const c=vnCanvas,ctx=c.getContext('2d');const W=c.offsetWidth||300,H=c.offsetHeight||58;c.width=W;c.height=H;const bars=64,gap=2,bw=(W-(bars-1)*gap)/bars;ctx.clearRect(0,0,W,H);for(let i=0;i<bars;i++){const h=(Math.random()*.65+.15)*H,x=i*(bw+gap),y=(H-h)/2;ctx.fillStyle='rgba(139,26,42,.55)';ctx.beginPath();if(ctx.roundRect)ctx.roundRect(x,y,Math.max(bw,1),h,2);else ctx.rect(x,y,Math.max(bw,1),h);ctx.fill();}}
vnAudio.src='media/voicenote.mp3';
vnAudio.addEventListener('loadedmetadata',()=>vnTot.textContent=fmt(vnAudio.duration));
vnAudio.addEventListener('timeupdate',()=>{const p=vnAudio.duration?(vnAudio.currentTime/vnAudio.duration)*100:0;vnProg.style.width=p+'%';vnCur.textContent=fmt(vnAudio.currentTime);});
vnAudio.addEventListener('ended',()=>{vnPlay.style.display='block';vnPause.style.display='none';vnProg.style.width='0%';vnCur.textContent='0:00';});
vnBtn.addEventListener('click',()=>{if(vnAudio.paused){vnAudio.play().catch(()=>{});vnPlay.style.display='none';vnPause.style.display='block';}else{vnAudio.pause();vnPlay.style.display='block';vnPause.style.display='none';}window.SFX.click();});

window.GameRegistry=window.GameRegistry||{};
let activeGame=null;

function openGame(key){
  const meta=GAME_META[key];if(!meta)return;
  window.SFX.whoosh();
  bgMusic.pause();
  overlayTitle.textContent=meta.title;mount.innerHTML='';
  settPanel.style.display='none';
  overlay.classList.add('active');
  history.pushState({g:true},'');
  if(window.GameRegistry[key]){activeGame=window.GameRegistry[key];activeGame.mount(mount);}
  else{mount.innerHTML=`<div class="game-msg"><p class="game-msg-title">${meta.title}</p><p class="game-msg-sub">Loading...</p></div>`;}
}
function closeGame(){
  window.SFX.click();
  if(activeGame&&activeGame.destroy)activeGame.destroy();
  activeGame=null;overlay.classList.remove('active');mount.innerHTML='';settPanel.style.display='none';
  bgMusic.play().catch(()=>{});
}

settBtn.addEventListener('click',()=>{
  if(settPanel.style.display==='none'){settPanel.style.display='flex';settContent.innerHTML='';if(activeGame&&activeGame.getSettings)activeGame.getSettings(settContent);else settContent.innerHTML='<p style="color:var(--c-dim);text-align:center;font-size:.82rem">No settings available</p>';}
  else settPanel.style.display='none';
  window.SFX.click();
});
settClose.addEventListener('click',()=>{settPanel.style.display='none';window.SFX.click();});
giftBtn.addEventListener('click',()=>{window.SFX.click();phaseEnv();});
envWrap.addEventListener('click',()=>phaseLetter());
envWrap.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();phaseLetter();}});
arcBtn.addEventListener('click',()=>phaseArcade());
document.addEventListener('click',e=>{const c=e.target.closest('.game-card[data-game]');if(c)openGame(c.dataset.game);});
backBtn.addEventListener('click',closeGame);
window.addEventListener('popstate',()=>{if(overlay.classList.contains('active'))closeGame();});

window.addEventListener('DOMContentLoaded',async()=>{
  window.GameRegistry=window.GameRegistry||{};
  Ambient.start();initMusic();tryPlay();setTimeout(drawWave,600);
  await phaseIntro();
  await phaseCake();
});
