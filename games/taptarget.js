'use strict';
(()=>{
const TH={dark:{bg:'#0a0407',t:'#8b1a2a',r:'#c9a96e'},neon:{bg:'#020210',t:'#6a10c0',r:'#40e0d0'},fire:{bg:'#0a0402',t:'#c04010',r:'#f0a020'},ice:{bg:'#020814',t:'#1a60c0',r:'#a0d0ff'}};
let thk='dark';
window.GameRegistry=window.GameRegistry||{};
window.GameRegistry['taptarget']={
  mount(container){
    container.innerHTML=`<div class="game-ui"><div class="game-score-bar"><span class="game-score-label">Score</span><span class="game-score-val" id="tt-sc">0</span><span class="game-score-label">Time</span><span class="game-score-val" id="tt-tm">30</span></div><div class="game-canvas-wrap"><canvas id="tt-c" class="game-canvas"></canvas><div class="game-msg" id="tt-msg"><p class="game-msg-title">Tap Target</p><p class="game-msg-sub">Tap targets as fast as you can!</p><button class="game-msg-btn" id="tt-s">Play</button></div></div></div>`;
    const canvas=container.querySelector('#tt-c'),wrap=canvas.parentElement,ctx=canvas.getContext('2d'),scEl=container.querySelector('#tt-sc'),tmEl=container.querySelector('#tt-tm'),msg=container.querySelector('#tt-msg'),sfx=window.SFX||{};
    const resize=()=>{canvas.width=wrap.clientWidth||340;canvas.height=wrap.clientHeight||380;};resize();window.addEventListener('resize',resize);
    let tgts,sc,tl,raf,run=false,lt;
    const mk=()=>{const W=canvas.width,H=canvas.height,r=Math.random()*16+20;return{x:r+10+Math.random()*(W-r*2-20),y:r+10+Math.random()*(H-r*2-20),r,life:1,ml:Math.random()*1.5+.7,p:0};};
    const start=()=>{tgts=[mk(),mk()];sc=0;tl=30;run=true;lt=Date.now();scEl.textContent='0';tmEl.textContent='30';msg.style.display='none';if(raf)cancelAnimationFrame(raf);loop();};
    const loop=()=>{raf=requestAnimationFrame(()=>{update();draw();if(run)loop();});};
    const update=()=>{const now=Date.now(),dt=(now-lt)/1000;lt=now;tl=Math.max(0,tl-dt);tmEl.textContent=Math.ceil(tl);if(tl<=0){die();return;}tgts.forEach(t=>{t.life-=dt/t.ml;t.p+=dt*4;});tgts=tgts.filter(t=>t.life>0);while(tgts.length<3)tgts.push(mk());};
    const die=()=>{run=false;if(sfx.arcade)sfx.arcade();msg.innerHTML=`<p class="game-msg-title">Time's Up!</p><p class="game-msg-sub">Score: ${sc}</p><button class="game-msg-btn" id="tt-s">Again</button>`;msg.style.display='flex';msg.querySelector('#tt-s').addEventListener('click',start);};
    const draw=()=>{const t=TH[thk];ctx.fillStyle=t.bg;ctx.fillRect(0,0,canvas.width,canvas.height);tgts.forEach(tg=>{const a=Math.max(0,tg.life),pl=Math.sin(tg.p)*.12+.88;ctx.globalAlpha=a;ctx.beginPath();ctx.arc(tg.x,tg.y,tg.r*pl,0,Math.PI*2);ctx.fillStyle=t.t;ctx.fill();ctx.strokeStyle=t.r;ctx.lineWidth=2.5;ctx.stroke();ctx.beginPath();ctx.arc(tg.x,tg.y,tg.r*.4*pl,0,Math.PI*2);ctx.fillStyle='rgba(255,255,255,.25)';ctx.fill();ctx.globalAlpha=1;});};
    const onTap=e=>{if(!run){start();return;}const rect=canvas.getBoundingClientRect();const cx=e.touches?e.touches[0].clientX:e.clientX,cy=e.touches?e.touches[0].clientY:e.clientY;const x=(cx-rect.left)*(canvas.width/rect.width),y=(cy-rect.top)*(canvas.height/rect.height);let hit=false;tgts=tgts.filter(tg=>{if(Math.hypot(x-tg.x,y-tg.y)<tg.r){hit=true;sc++;scEl.textContent=sc;return false;}return true;});if(hit&&sfx.tap)sfx.tap();while(tgts.length<3)tgts.push(mk());};
    canvas.addEventListener('click',onTap);canvas.addEventListener('touchstart',e=>{e.preventDefault();onTap(e);},{passive:false});
    container.querySelector('#tt-s').addEventListener('click',start);draw();
    this._c=()=>{window.removeEventListener('resize',resize);canvas.removeEventListener('click',onTap);cancelAnimationFrame(raf);run=false;};
  },
  getSettings(c){c.innerHTML=`<div class="settings-row"><span class="settings-row-label">Theme</span><div class="settings-swatches" id="tt-t"></div></div>`;const to=c.querySelector('#tt-t');Object.entries(TH).forEach(([k,v])=>{const s=document.createElement('div');s.className='swatch'+(k===thk?' active':'');s.style.background=v.t;s.title=k;s.onclick=()=>{thk=k;to.querySelectorAll('.swatch').forEach(x=>x.classList.remove('active'));s.classList.add('active');};to.appendChild(s);});},
  destroy(){if(this._c)this._c();}
};
})();
