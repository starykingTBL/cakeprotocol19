'use strict';
(()=>{
const TH={dark:{sky:'#050208',gnd:'#1a0810',pl:'#c9a96e',ob:'#8b1a2a',coin:'#ffd700'},
  purple:{sky:'#0a0520',gnd:'#1a0a30',pl:'#e8a0e0',ob:'#6a1a8a',coin:'#ffd700'},
  forest:{sky:'#020a04',gnd:'#0a2010',pl:'#a0d060',ob:'#2a6a1a',coin:'#ffd700'},
  sunset:{sky:'#1a0808',gnd:'#2a1008',pl:'#f0c060',ob:'#c04020',coin:'#fff'}};
let thk='dark';
window.GameRegistry=window.GameRegistry||{};
window.GameRegistry['runner']={
  mount(container){
    container.innerHTML=`<div class="game-ui"><div class="game-score-bar"><span class="game-score-label">Score</span><span class="game-score-val" id="rn-sc">0</span><span class="game-score-label">Lives</span><div class="lives-display" id="rn-lives">❤️❤️❤️</div><span class="game-score-label">Best</span><span class="game-score-val" id="rn-bst">0</span></div><div class="game-canvas-wrap"><canvas id="rn-c" class="game-canvas"></canvas><div class="game-msg" id="rn-msg"><p class="game-msg-title">Runner</p><p class="game-msg-sub">Tap to jump • Double jump • Collect coins!</p><button class="game-msg-btn" id="rn-s">Play</button></div></div></div>`;
    const canvas=container.querySelector('#rn-c'),wrap=canvas.parentElement,ctx=canvas.getContext('2d');
    const scEl=container.querySelector('#rn-sc'),bEl=container.querySelector('#rn-bst'),livesEl=container.querySelector('#rn-lives'),msg=container.querySelector('#rn-msg'),sfx=window.SFX||{};
    let W,H;
    const resize=()=>{W=canvas.width=wrap.clientWidth||360;H=canvas.height=wrap.clientHeight||260;};
    resize();window.addEventListener('resize',resize);
    const GND=()=>H-50;
    let pl,obs,coins,parts,stars,sc,best=0,lives,spd,raf,run=false,fr=0,invincible=0;
    const mkStars=()=>Array.from({length:40},()=>({x:Math.random()*W,y:Math.random()*(GND()-20),s:Math.random()*1.5+.3,sp:Math.random()*.3+.1}));
    const updateLives=()=>{livesEl.textContent='❤️'.repeat(Math.max(0,lives));};
    const start=()=>{pl={x:60,y:GND(),w:22,h:28,vy:0,j:0};obs=[];coins=[];parts=[];stars=mkStars();sc=0;lives=3;spd=3;fr=0;run=true;invincible=0;scEl.textContent='0';updateLives();msg.style.display='none';if(raf)cancelAnimationFrame(raf);loop();};
    const jump=()=>{if(!run){start();return;}if(pl.j<2){pl.vy=-10;pl.j++;if(sfx.click)sfx.click();}};
    const loop=()=>{raf=requestAnimationFrame(()=>{if(run){update();draw();}loop();});};
    const update=()=>{
      const gnd=GND();fr++;
      spd=3+Math.min(fr/300,3);
      sc=Math.floor(fr/6);scEl.textContent=sc;if(sc>best){best=sc;bEl.textContent=best;}
      if(invincible>0)invincible--;
      pl.vy+=.55;pl.y+=pl.vy;if(pl.y>=gnd){pl.y=gnd;pl.vy=0;pl.j=0;}
      stars.forEach(s=>{s.x-=s.sp;if(s.x<0)s.x=W;});
      // Spawn obstacles
      if(fr%Math.max(50,80-Math.floor(sc/30))===0){
        const h=Math.random()<.35?55:30;
        obs.push({x:W+10,y:gnd+28-h,w:16,h});
      }
      // Spawn coins
      if(fr%60===0){
        coins.push({x:W+10,y:gnd-Math.random()*60-20,r:8,collected:false});
      }
      obs.forEach(o=>o.x-=spd);obs=obs.filter(o=>o.x>-30);
      coins.forEach(c=>c.x-=spd);coins=coins.filter(c=>c.x>-20&&!c.collected);
      parts.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.12;p.life-=.05;});parts=parts.filter(p=>p.life>0);
      // Coin collision
      coins.forEach(c=>{if(!c.collected&&Math.hypot(pl.x+pl.w/2-c.x,pl.y+pl.h/2-c.y)<c.r+12){c.collected=true;sc+=5;scEl.textContent=sc;if(sfx.score)sfx.score();}});
      // Obstacle collision
      if(invincible===0){
        for(const o of obs){
          if(pl.x+pl.w-5>o.x+4&&pl.x+5<o.x+o.w-4&&pl.y+pl.h-5>o.y+4&&pl.y+5<o.y+o.h-4){
            for(let i=0;i<5;i++)parts.push({x:pl.x+pl.w/2,y:pl.y+pl.h/2,vx:(Math.random()-.5)*4,vy:-Math.random()*4-1,life:1});
            lives--;updateLives();if(sfx.life)sfx.life();invincible=90;
            if(lives<=0){die();return;}
            break;
          }
        }
      }
    };
    const die=()=>{run=false;if(sfx.die)sfx.die();msg.innerHTML=`<p class="game-msg-title">Game Over</p><p class="game-msg-sub">Score: ${sc}</p><button class="game-msg-btn" id="rn-s">Again</button>`;msg.style.display='flex';msg.querySelector('#rn-s').addEventListener('click',start);};
    const draw=()=>{
      const t=TH[thk],gnd=GND();
      ctx.fillStyle=t.sky;ctx.fillRect(0,0,W,H);
      stars.forEach(s=>{ctx.fillStyle=`rgba(255,200,200,${s.s*.4})`;ctx.beginPath();ctx.arc(s.x,s.y,s.s,0,Math.PI*2);ctx.fill();});
      const g=ctx.createLinearGradient(0,gnd+28,0,H);g.addColorStop(0,t.gnd);g.addColorStop(1,t.sky);
      ctx.fillStyle=g;ctx.fillRect(0,gnd+28,W,H-gnd-28);
      // Coins
      coins.forEach(c=>{if(c.collected)return;ctx.fillStyle=t.coin;ctx.beginPath();ctx.arc(c.x,c.y,c.r,0,Math.PI*2);ctx.fill();ctx.fillStyle='rgba(255,255,255,.4)';ctx.beginPath();ctx.arc(c.x-2,c.y-2,c.r*.4,0,Math.PI*2);ctx.fill();});
      // Obstacles
      obs.forEach(o=>{ctx.fillStyle=t.ob;ctx.beginPath();if(ctx.roundRect)ctx.roundRect(o.x,o.y,o.w,o.h,3);else ctx.rect(o.x,o.y,o.w,o.h);ctx.fill();});
      // Player (flash when invincible)
      if(invincible===0||Math.floor(invincible/6)%2===0){
        ctx.fillStyle=t.pl;ctx.beginPath();if(ctx.roundRect)ctx.roundRect(pl.x,pl.y,pl.w,pl.h,5);else ctx.rect(pl.x,pl.y,pl.w,pl.h);ctx.fill();
        ctx.fillStyle='#0a0407';ctx.fillRect(pl.x+6,pl.y+8,4,4);ctx.fillRect(pl.x+14,pl.y+8,4,4);
      }
      parts.forEach(p=>{ctx.globalAlpha=p.life;ctx.fillStyle=t.ob;ctx.beginPath();ctx.arc(p.x,p.y,3,0,Math.PI*2);ctx.fill();});
      ctx.globalAlpha=1;
    };
    const onK=e=>{if(e.code==='Space'){e.preventDefault();jump();}};
    document.addEventListener('keydown',onK);
    canvas.addEventListener('click',jump);
    canvas.addEventListener('touchstart',e=>{e.preventDefault();jump();},{passive:false});
    container.querySelector('#rn-s').addEventListener('click',start);
    draw();
    this._c=()=>{window.removeEventListener('resize',resize);document.removeEventListener('keydown',onK);canvas.removeEventListener('click',jump);cancelAnimationFrame(raf);run=false;};
  },
  getSettings(c){c.innerHTML=`<div class="settings-row"><span class="settings-row-label">Theme</span><div class="settings-btns" id="rn-t"></div></div>`;const to=c.querySelector('#rn-t');Object.keys(TH).forEach(k=>{const b=document.createElement('button');b.className='settings-opt'+(k===thk?' active':'');b.textContent=k;b.onclick=()=>{thk=k;to.querySelectorAll('.settings-opt').forEach(x=>x.classList.remove('active'));b.classList.add('active');};to.appendChild(b);});},
  destroy(){if(this._c)this._c();}
};
})();
