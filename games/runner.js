'use strict';
(()=>{
const TH={dark:{sky:'#050208',gnd:'#1a0810',pl:'#c9a96e',ob:'#8b1a2a'},purple:{sky:'#0a0520',gnd:'#1a0a30',pl:'#e8a0e0',ob:'#6a1a8a'},forest:{sky:'#020a04',gnd:'#0a2010',pl:'#a0d060',ob:'#2a6a1a'},sunset:{sky:'#1a0808',gnd:'#2a1008',pl:'#f0c060',ob:'#c04020'}};
let thk='dark';
window.GameRegistry=window.GameRegistry||{};
window.GameRegistry['runner']={
  mount(container){
    container.innerHTML=`<div class="game-ui"><div class="game-score-bar"><span class="game-score-label">Score</span><span class="game-score-val" id="rn-sc">0</span><span class="game-score-label">Best</span><span class="game-score-val" id="rn-bst">0</span></div><div class="game-canvas-wrap"><canvas id="rn-c" class="game-canvas"></canvas><div class="game-msg" id="rn-msg"><p class="game-msg-title">Runner</p><p class="game-msg-sub">Tap or Space to jump • Double jump!</p><button class="game-msg-btn" id="rn-s">Play</button></div></div></div>`;
    const canvas=container.querySelector('#rn-c'),wrap=canvas.parentElement,ctx=canvas.getContext('2d'),scEl=container.querySelector('#rn-sc'),bEl=container.querySelector('#rn-bst'),msg=container.querySelector('#rn-msg'),sfx=window.SFX||{};
    const resize=()=>{canvas.width=wrap.clientWidth||360;canvas.height=wrap.clientHeight||260;};
    resize();window.addEventListener('resize',resize);
    const GND=()=>canvas.height-50;
    let pl,obs,parts,stars,sc,best=0,spd,raf,run=false,fr=0;
    const mkStars=()=>Array.from({length:40},()=>({x:Math.random()*canvas.width,y:Math.random()*(GND()-20),s:Math.random()*1.5+.3,sp:Math.random()*.3+.1}));
    const start=()=>{pl={x:60,y:GND(),w:22,h:28,vy:0,j:0};obs=[];parts=[];stars=mkStars();sc=0;spd=3.2;fr=0;run=true;scEl.textContent='0';msg.style.display='none';if(raf)cancelAnimationFrame(raf);loop();};
    const jump=()=>{if(!run){start();return;}if(pl.j<2){pl.vy=-11;pl.j++;if(sfx.click)sfx.click();}};
    const loop=()=>{raf=requestAnimationFrame(()=>{update();draw();if(run)loop();});};
    const update=()=>{const W=canvas.width,H=canvas.height,gnd=GND();fr++;spd+=.0015;sc=Math.floor(fr/6);scEl.textContent=sc;if(sc>best){best=sc;bEl.textContent=best;}pl.vy+=.65;pl.y+=pl.vy;if(pl.y>=gnd){pl.y=gnd;pl.vy=0;pl.j=0;}stars.forEach(s=>{s.x-=s.sp;if(s.x<0)s.x=W;});if(fr%Math.max(55,90-Math.floor(sc/20))===0){const h=Math.random()<.4?50:28;obs.push({x:W+10,y:gnd+28-h,w:18,h,t:Math.random()<.3?1:0});}obs.forEach(o=>o.x-=spd);obs=obs.filter(o=>o.x>-30);parts.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.15;p.life-=.06;});parts=parts.filter(p=>p.life>0);for(const o of obs){if(pl.x+pl.w-4>o.x+4&&pl.x+4<o.x+o.w-4&&pl.y+pl.h-4>o.y+4&&pl.y+4<o.y+o.h-4){for(let i=0;i<4;i++)parts.push({x:pl.x+pl.w/2,y:pl.y+pl.h/2,vx:(Math.random()-.5)*3,vy:-Math.random()*3-1,life:1});die();return;}}};
    const die=()=>{run=false;if(sfx.die)sfx.die();msg.innerHTML=`<p class="game-msg-title">Game Over</p><p class="game-msg-sub">Score: ${sc}</p><button class="game-msg-btn" id="rn-s">Again</button>`;msg.style.display='flex';msg.querySelector('#rn-s').addEventListener('click',start);};
    const draw=()=>{const t=TH[thk],W=canvas.width,H=canvas.height,gnd=GND();ctx.fillStyle=t.sky;ctx.fillRect(0,0,W,H);stars.forEach(s=>{ctx.fillStyle=`rgba(255,200,200,${s.s*.4})`;ctx.beginPath();ctx.arc(s.x,s.y,s.s,0,Math.PI*2);ctx.fill();});const g=ctx.createLinearGradient(0,gnd+28,0,H);g.addColorStop(0,t.gnd);g.addColorStop(1,t.sky);ctx.fillStyle=g;ctx.fillRect(0,gnd+28,W,H-gnd-28);obs.forEach(o=>{ctx.fillStyle=o.t===1?t.ob+'99':t.ob;ctx.beginPath();if(ctx.roundRect)ctx.roundRect(o.x,o.y,o.w,o.h,3);else ctx.rect(o.x,o.y,o.w,o.h);ctx.fill();});ctx.fillStyle=t.pl;ctx.beginPath();if(ctx.roundRect)ctx.roundRect(pl.x,pl.y,pl.w,pl.h,5);else ctx.rect(pl.x,pl.y,pl.w,pl.h);ctx.fill();ctx.fillStyle='#0a0407';ctx.fillRect(pl.x+6,pl.y+8,4,4);ctx.fillRect(pl.x+14,pl.y+8,4,4);parts.forEach(p=>{ctx.globalAlpha=p.life;ctx.fillStyle=t.ob;ctx.beginPath();ctx.arc(p.x,p.y,3,0,Math.PI*2);ctx.fill();});ctx.globalAlpha=1;};
    const onK=e=>{if(e.code==='Space'){e.preventDefault();jump();}};
    document.addEventListener('keydown',onK);canvas.addEventListener('click',jump);canvas.addEventListener('touchstart',e=>{e.preventDefault();jump();},{passive:false});
    container.querySelector('#rn-s').addEventListener('click',start);draw();
    this._c=()=>{window.removeEventListener('resize',resize);document.removeEventListener('keydown',onK);canvas.removeEventListener('click',jump);cancelAnimationFrame(raf);run=false;};
  },
  getSettings(c){c.innerHTML=`<div class="settings-row"><span class="settings-row-label">Theme</span><div class="settings-btns" id="rn-t"></div></div>`;const to=c.querySelector('#rn-t');Object.keys(TH).forEach(k=>{const b=document.createElement('button');b.className='settings-opt'+(k===thk?' active':'');b.textContent=k;b.onclick=()=>{thk=k;to.querySelectorAll('.settings-opt').forEach(x=>x.classList.remove('active'));b.classList.add('active');};to.appendChild(b);});},
  destroy(){if(this._c)this._c();}
};
})();
