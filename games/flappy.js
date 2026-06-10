'use strict';
(()=>{
const TH={dark:{s1:'#050208',s2:'#150810',pipe:'#2a0d14',pd:'#6b1a2a',bird:'#c9a96e'},day:{s1:'#1a2a6c',s2:'#b21f1f',pipe:'#2a6a2a',pd:'#1a4a1a',bird:'#ffd166'},neon:{s1:'#020210',s2:'#100220',pipe:'#0a3a5a',pd:'#1a6a8a',bird:'#40e0d0'},sunset:{s1:'#1a0808',s2:'#3a1808',pipe:'#4a2010',pd:'#8a3010',bird:'#f0a040'}};
let thk='dark';
window.GameRegistry=window.GameRegistry||{};
window.GameRegistry['flappy']={
  mount(container){
    container.innerHTML=`<div class="game-ui"><div class="game-score-bar"><span class="game-score-label">Score</span><span class="game-score-val" id="fl-sc">0</span><span class="game-score-label">Best</span><span class="game-score-val" id="fl-bst">0</span></div><div class="game-canvas-wrap"><canvas id="fl-c" class="game-canvas"></canvas><div class="game-msg" id="fl-msg"><p class="game-msg-title">Flappy</p><p class="game-msg-sub">Tap to fly through the gaps</p><button class="game-msg-btn" id="fl-s">Play</button></div></div></div>`;
    const canvas=container.querySelector('#fl-c'),wrap=canvas.parentElement,ctx=canvas.getContext('2d'),scEl=container.querySelector('#fl-sc'),bEl=container.querySelector('#fl-bst'),msg=container.querySelector('#fl-msg'),sfx=window.SFX||{};
    const resize=()=>{canvas.width=wrap.clientWidth||320;canvas.height=wrap.clientHeight||420;};resize();window.addEventListener('resize',resize);
    const GR=0.5,JMP=-9,PW=52,PS=2.6;
    let bird,pipes,sc,best=0,raf,run=false,stars;
    const mkS=()=>Array.from({length:35},()=>({x:Math.random()*canvas.width,y:Math.random()*canvas.height,r:Math.random()*1.2+.3,o:Math.random()*.5+.2}));
    const GAP=()=>Math.min(160,canvas.height*.36);
    const start=()=>{bird={x:Math.floor(canvas.width*.25),y:canvas.height/2,vy:0,r:14,a:0};pipes=[];sc=0;run=true;stars=mkS();scEl.textContent='0';msg.style.display='none';if(raf)cancelAnimationFrame(raf);loop();};
    const flap=()=>{if(!run){start();return;}bird.vy=JMP;if(sfx.click)sfx.click();};
    const loop=()=>{raf=requestAnimationFrame(()=>{update();draw();if(run)loop();});};
    const update=()=>{const W=canvas.width,H=canvas.height,gap=GAP();bird.vy+=GR;bird.y+=bird.vy;bird.a=Math.max(-.5,Math.min(1.2,bird.vy*.06));if(bird.y-bird.r<0){bird.y=bird.r;bird.vy=0;}if(bird.y+bird.r>H){die();return;}if(!pipes.length||pipes[pipes.length-1].x<W-Math.max(160,W*.45)){const top=60+Math.random()*(H-gap-120);pipes.push({x:W+10,top,scored:false});}pipes.forEach(p=>p.x-=PS);pipes=pipes.filter(p=>p.x>-PW-10);for(const p of pipes){const inX=bird.x+bird.r>p.x&&bird.x-bird.r<p.x+PW;const inY=bird.y-bird.r<p.top||bird.y+bird.r>p.top+gap;if(inX&&inY){die();return;}if(!p.scored&&p.x+PW<bird.x){p.scored=true;sc++;scEl.textContent=sc;if(sc>best){best=sc;bEl.textContent=best;}if(sfx.score)sfx.score();}}};
    const die=()=>{run=false;if(sfx.die)sfx.die();msg.innerHTML=`<p class="game-msg-title">Game Over</p><p class="game-msg-sub">Score: ${sc}</p><button class="game-msg-btn" id="fl-s">Again</button>`;msg.style.display='flex';msg.querySelector('#fl-s').addEventListener('click',start);};
    const dp=(x,h,flip)=>{const t=TH[thk],H=canvas.height;const g=ctx.createLinearGradient(x,0,x+PW,0);g.addColorStop(0,t.pd);g.addColorStop(.5,t.pipe);g.addColorStop(1,t.pd);ctx.fillStyle=g;ctx.beginPath();if(ctx.roundRect)ctx.roundRect(x,flip?0:H-h,PW,h,flip?[0,0,6,6]:[6,6,0,0]);else ctx.rect(x,flip?0:H-h,PW,h);ctx.fill();ctx.fillStyle=t.pd;const ch=14;ctx.beginPath();if(ctx.roundRect)ctx.roundRect(x-4,flip?h-ch:H-h,PW+8,ch,4);else ctx.rect(x-4,flip?h-ch:H-h,PW+8,ch);ctx.fill();};
    const draw=()=>{const t=TH[thk],W=canvas.width,H=canvas.height,gap=GAP();const sky=ctx.createLinearGradient(0,0,0,H);sky.addColorStop(0,t.s1);sky.addColorStop(1,t.s2);ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);stars.forEach(s=>{ctx.globalAlpha=s.o*(0.7+Math.sin(Date.now()*.001+s.x)*.3);ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);ctx.fill();});ctx.globalAlpha=1;pipes.forEach(p=>{dp(p.x,p.top,true);dp(p.x,H-p.top-gap,false);});ctx.save();ctx.translate(bird.x,bird.y);ctx.rotate(bird.a);const bg=ctx.createRadialGradient(-2,-2,0,0,0,bird.r);bg.addColorStop(0,'#fff');bg.addColorStop(1,t.bird);ctx.fillStyle=bg;ctx.beginPath();ctx.arc(0,0,bird.r,0,Math.PI*2);ctx.fill();ctx.fillStyle='#0a0407';ctx.beginPath();ctx.arc(5,-3,3,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(6,-4,1.2,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ff6b35';ctx.beginPath();ctx.moveTo(10,2);ctx.lineTo(16,0);ctx.lineTo(10,4);ctx.fill();ctx.restore();ctx.fillStyle='rgba(255,255,255,.9)';ctx.font=`700 28px 'DM Sans',sans-serif`;ctx.textAlign='center';ctx.textBaseline='top';ctx.fillText(sc,W/2,12);};
    const onTap=()=>flap();const onK=e=>{if(e.code==='Space'){e.preventDefault();flap();}};
    canvas.addEventListener('click',onTap);canvas.addEventListener('touchstart',e=>{e.preventDefault();onTap();},{passive:false});document.addEventListener('keydown',onK);
    container.querySelector('#fl-s').addEventListener('click',start);draw();
    this._c=()=>{window.removeEventListener('resize',resize);canvas.removeEventListener('click',onTap);canvas.removeEventListener('touchstart',onTap);document.removeEventListener('keydown',onK);cancelAnimationFrame(raf);run=false;};
  },
  getSettings(c){c.innerHTML=`<div class="settings-row"><span class="settings-row-label">Sky Theme</span><div class="settings-swatches" id="fl-t"></div></div>`;const to=c.querySelector('#fl-t');Object.entries(TH).forEach(([k,v])=>{const s=document.createElement('div');s.className='swatch'+(k===thk?' active':'');s.style.background=v.s2;s.title=k;s.onclick=()=>{thk=k;to.querySelectorAll('.swatch').forEach(x=>x.classList.remove('active'));s.classList.add('active');};to.appendChild(s);});},
  destroy(){if(this._c)this._c();}
};
})();
