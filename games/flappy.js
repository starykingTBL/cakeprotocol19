'use strict';
(()=>{
const TH={
  dark:{s1:'#050208',s2:'#150810',pipe:'#2a0d14',pd:'#6b1a2a',bird:'#c9a96e',coin:'#ffd700',shield:'#4a90e2',magnet:'#e24a90'},
  day:{s1:'#1a2a6c',s2:'#4a6aa0',pipe:'#2a6a2a',pd:'#1a4a1a',bird:'#ffd166',coin:'#ffd700',shield:'#4a90e2',magnet:'#e24a90'},
  neon:{s1:'#020210',s2:'#100220',pipe:'#0a3a5a',pd:'#1a6a8a',bird:'#40e0d0',coin:'#ffd700',shield:'#4a90e2',magnet:'#e24a90'},
  sunset:{s1:'#1a0808',s2:'#3a1808',pipe:'#4a2010',pd:'#8a3010',bird:'#f0a040',coin:'#ffd700',shield:'#4a90e2',magnet:'#e24a90'},
};
let thk='dark';

// Stage config: {speed, gapRatio, pipeInterval, label}
const STAGES=[
  {spd:2.0,gap:.46,intv:200,label:'Breeze'},
  {spd:2.5,gap:.42,intv:180,label:'Wind'},
  {spd:3.0,gap:.38,intv:160,label:'Storm'},
  {spd:3.6,gap:.34,intv:140,label:'Danger'},
  {spd:4.2,gap:.30,intv:120,label:'Chaos'},
];

window.GameRegistry=window.GameRegistry||{};
window.GameRegistry['flappy']={
  mount(container){
    container.innerHTML=`
      <div class="game-ui">
        <div class="game-score-bar">
          <span class="game-score-label">Score</span>
          <span class="game-score-val" id="fl-sc">0</span>
          <span class="game-score-label">Best</span>
          <span class="game-score-val" id="fl-bst">0</span>
          <span class="game-score-label">Stage</span>
          <span class="game-score-val" id="fl-stage">1</span>
          <div class="lives-display" id="fl-lives">❤️❤️❤️</div>
        </div>
        <div class="game-canvas-wrap">
          <canvas id="fl-c" class="game-canvas"></canvas>
          <div class="game-msg" id="fl-msg">
            <p class="game-msg-title">Flappy</p>
            <p class="game-msg-sub">Tap gently to fly<br/>Collect coins • Find power-ups!</p>
            <div style="display:flex;gap:.5rem;justify-content:center;margin:.5rem 0;font-size:.75rem;color:#c9a96e;font-weight:700">
              <span>🛡 Shield</span><span>🧲 Magnet</span><span>⭐ Score×2</span>
            </div>
            <button class="game-msg-btn" id="fl-s">Play</button>
          </div>
        </div>
      </div>`;

    const canvas=container.querySelector('#fl-c'),wrap=canvas.parentElement,ctx=canvas.getContext('2d');
    const scEl=container.querySelector('#fl-sc'),bEl=container.querySelector('#fl-bst');
    const stageEl=container.querySelector('#fl-stage'),livesEl=container.querySelector('#fl-lives');
    const msg=container.querySelector('#fl-msg'),sfx=window.SFX||{};

    const resize=()=>{canvas.width=wrap.clientWidth||320;canvas.height=wrap.clientHeight||420;};
    resize();window.addEventListener('resize',resize);

    const GRAV=0.26,JMP=-5.2,PW=48,BIRD_R=13;
    let bird,pipes,coins,powerups,particles,sc,best=0,lives,run=false,raf,stars;
    let frame=0,invincible=0,shield=0,magnet=0,doubleScore=0,stageIdx=0;
    let stageBanner=null,stageTimer=0;

    const mkStars=()=>Array.from({length:35},()=>({
      x:Math.random()*canvas.width,y:Math.random()*canvas.height,
      r:Math.random()*1.2+.3,o:Math.random()*.5+.2,
      sp:Math.random()*.3+.05,
    }));

    const updLives=()=>livesEl.textContent='❤️'.repeat(Math.max(0,lives));

    const getStage=()=>STAGES[Math.min(stageIdx,STAGES.length-1)];

    const start=()=>{
      bird={x:Math.floor(canvas.width*.25),y:canvas.height/2,vy:0,a:0};
      pipes=[];coins=[];powerups=[];particles=[];
      stars=mkStars();sc=0;lives=3;frame=0;stageIdx=0;
      invincible=0;shield=0;magnet=0;doubleScore=0;
      stageBanner=null;stageTimer=0;
      run=true;
      scEl.textContent='0';stageEl.textContent='1';updLives();
      msg.style.display='none';
      if(raf)cancelAnimationFrame(raf);loop();
    };

    const flap=()=>{
      if(!run){start();return;}
      bird.vy=JMP;
      if(sfx.click)sfx.click();
    };

    const loop=()=>{raf=requestAnimationFrame(()=>{update();draw();if(run)loop();});};

    const spawnParticle=(x,y,color,count=6)=>{
      for(let i=0;i<count;i++)particles.push({
        x,y,vx:(Math.random()-.5)*5,vy:-Math.random()*4-1,
        life:1,color,r:Math.random()*4+2,
      });
    };

    const update=()=>{
      const W=canvas.width,H=canvas.height;
      const st=getStage();
      frame++;

      // Stage progression every 10 points
      const newStage=Math.min(Math.floor(sc/10),STAGES.length-1);
      if(newStage>stageIdx){
        stageIdx=newStage;stageEl.textContent=stageIdx+1;
        stageBanner=STAGES[stageIdx].label;stageTimer=120;
        if(sfx.arcade)sfx.arcade();
      }
      if(stageTimer>0)stageTimer--;

      if(invincible>0)invincible--;
      if(shield>0)shield--;
      if(magnet>0)magnet--;
      if(doubleScore>0)doubleScore--;

      // Bird physics
      bird.vy+=GRAV;
      bird.vy=Math.min(bird.vy,7);
      bird.y+=bird.vy;
      bird.a=Math.max(-.4,Math.min(1.0,bird.vy*.07));

      if(bird.y-BIRD_R<0){bird.y=BIRD_R;bird.vy=0;}
      if(bird.y+BIRD_R>H){hit();return;}

      // Stars parallax
      stars.forEach(s=>{s.x-=s.sp*st.spd/2;if(s.x<0)s.x=W;});

      // Spawn pipes
      if(frame%Math.max(st.intv,80)===0){
        const gap=H*st.gap;
        const minTop=60,maxTop=H-gap-80;
        const top=minTop+Math.random()*(maxTop-minTop);
        pipes.push({x:W+10,top,gap,scored:false,hasBlock:Math.random()<.25});
      }

      // Spawn coins
      if(frame%55===0){
        coins.push({x:W+10,y:60+Math.random()*(H-120),r:9,collected:false,pulse:0});
      }

      // Spawn powerups
      if(frame%180===0){
        const types=['shield','magnet','double'];
        const type=types[Math.floor(Math.random()*types.length)];
        powerups.push({x:W+10,y:80+Math.random()*(H-160),r:14,type,collected:false,pulse:0});
      }

      // Move pipes
      pipes.forEach(p=>p.x-=st.spd);
      pipes=pipes.filter(p=>p.x>-PW-20);

      // Move coins
      coins.forEach(c=>{c.x-=st.spd;c.pulse+=.1;});
      coins=coins.filter(c=>c.x>-20&&!c.collected);

      // Move powerups
      powerups.forEach(p=>{p.x-=st.spd*.9;p.pulse+=.08;});
      powerups=powerups.filter(p=>p.x>-20&&!p.collected);

      // Particles
      particles.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.15;p.life-=.04;});
      particles=particles.filter(p=>p.life>0);

      // Coin collection — magnetic pull
      coins.forEach(c=>{
        if(c.collected)return;
        const dx=bird.x-c.x,dy=bird.y-c.y,dist=Math.hypot(dx,dy);
        const pullRange=magnet>0?120:BIRD_R+c.r+4;
        if(magnet>0&&dist<120){c.x+=dx*.08;c.y+=dy*.08;}
        if(dist<BIRD_R+c.r){
          c.collected=true;
          const pts=doubleScore>0?2:1;
          sc+=pts;scEl.textContent=sc;
          spawnParticle(c.x,c.y,'#ffd700',8);
          if(sfx.score)sfx.score();
        }
      });

      // Powerup collection
      powerups.forEach(p=>{
        if(p.collected)return;
        if(Math.hypot(bird.x-p.x,bird.y-p.y)<BIRD_R+p.r){
          p.collected=true;
          spawnParticle(p.x,p.y,p.type==='shield'?'#4a90e2':p.type==='magnet'?'#e24a90':'#ffd700',10);
          if(p.type==='shield')shield=300;
          else if(p.type==='magnet')magnet=400;
          else if(p.type==='double')doubleScore=300;
          if(sfx.match)sfx.match();
        }
      });

      // Pipe scoring & collision
      for(const p of pipes){
        // Score
        if(!p.scored&&p.x+PW<bird.x){
          p.scored=true;
          const pts=doubleScore>0?2:1;
          sc+=pts;scEl.textContent=sc;
          if(sc>best){best=sc;bEl.textContent=best;}
          if(sfx.tap)sfx.tap();
        }
        // Block (safe zone)
        if(p.hasBlock){
          const bx=p.x+PW/2-14,by=p.top+p.gap/2-14;
          if(Math.hypot(bird.x-bx-14,bird.y-by-14)<BIRD_R+14&&invincible===0&&shield===0){
            // Block protects — bounce instead
            bird.vy=-4;continue;
          }
        }
        // Pipe collision
        if(invincible===0){
          const inX=bird.x+BIRD_R-4>p.x+4&&bird.x-BIRD_R+4<p.x+PW-4;
          const inY=bird.y-BIRD_R+4<p.top||bird.y+BIRD_R-4>p.top+p.gap;
          if(inX&&inY){
            if(shield>0){shield=0;invincible=90;spawnParticle(bird.x,bird.y,'#4a90e2',12);if(sfx.life)sfx.life();}
            else{hit();return;}
          }
        }
      }
    };

    const hit=()=>{
      spawnParticle(bird.x,bird.y,'#ff4444',14);
      lives--;updLives();
      if(sfx.die)sfx.die();
      if(lives<=0){gameOver();return;}
      invincible=100;
      bird.vy=-3;
    };

    const gameOver=()=>{
      run=false;
      msg.innerHTML=`<p class="game-msg-title">Game Over</p><p class="game-msg-sub">Score: ${sc} • Stage: ${stageIdx+1}</p><button class="game-msg-btn" id="fl-s">Again</button>`;
      msg.style.display='flex';
      msg.querySelector('#fl-s').addEventListener('click',start);
    };

    const drawPipe=(p)=>{
      const t=TH[thk],H=canvas.height;
      const grad=ctx.createLinearGradient(p.x,0,p.x+PW,0);
      grad.addColorStop(0,t.pd);grad.addColorStop(.5,t.pipe);grad.addColorStop(1,t.pd);
      ctx.fillStyle=grad;
      // Top pipe
      ctx.beginPath();if(ctx.roundRect)ctx.roundRect(p.x,0,PW,p.top,[0,0,6,6]);else ctx.rect(p.x,0,PW,p.top);ctx.fill();
      ctx.fillStyle=t.pd;ctx.beginPath();if(ctx.roundRect)ctx.roundRect(p.x-4,p.top-12,PW+8,12,4);else ctx.rect(p.x-4,p.top-12,PW+8,12);ctx.fill();
      // Bottom pipe
      const bTop=p.top+p.gap;
      ctx.fillStyle=grad;
      ctx.beginPath();if(ctx.roundRect)ctx.roundRect(p.x,bTop,PW,H-bTop,[6,6,0,0]);else ctx.rect(p.x,bTop,PW,H-bTop);ctx.fill();
      ctx.fillStyle=t.pd;ctx.beginPath();if(ctx.roundRect)ctx.roundRect(p.x-4,bTop,PW+8,12,4);else ctx.rect(p.x-4,bTop,PW+8,12);ctx.fill();
      // Safe block
      if(p.hasBlock){
        const bx=p.x+PW/2-14,by=p.top+p.gap/2-14;
        ctx.fillStyle='rgba(74,144,226,.35)';
        ctx.strokeStyle='rgba(74,144,226,.9)';ctx.lineWidth=2;
        ctx.beginPath();if(ctx.roundRect)ctx.roundRect(bx,by,28,28,6);else ctx.rect(bx,by,28,28);
        ctx.fill();ctx.stroke();
        ctx.fillStyle='rgba(255,255,255,.8)';ctx.font='16px serif';
        ctx.textAlign='center';ctx.textBaseline='middle';
        ctx.fillText('🛡',bx+14,by+14);
      }
    };

    const draw=()=>{
      const t=TH[thk],W=canvas.width,H=canvas.height;
      const sky=ctx.createLinearGradient(0,0,0,H);sky.addColorStop(0,t.s1);sky.addColorStop(1,t.s2);
      ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);

      // Stars
      stars.forEach(s=>{
        ctx.globalAlpha=s.o*(0.7+Math.sin(Date.now()*.001+s.x)*.3);
        ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);ctx.fill();
      });
      ctx.globalAlpha=1;

      // Pipes
      pipes.forEach(drawPipe);

      // Coins
      coins.forEach(c=>{
        if(c.collected)return;
        const pulse=Math.sin(c.pulse)*.15+.85;
        ctx.save();ctx.translate(c.x,c.y);ctx.scale(pulse,pulse);
        ctx.fillStyle=t.coin;ctx.beginPath();ctx.arc(0,0,c.r,0,Math.PI*2);ctx.fill();
        ctx.fillStyle='rgba(255,255,200,.5)';ctx.beginPath();ctx.arc(-2,-2,c.r*.4,0,Math.PI*2);ctx.fill();
        ctx.fillStyle='#a07000';ctx.font=`bold ${c.r}px sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('$',0,1);
        ctx.restore();
      });

      // Powerups
      powerups.forEach(p=>{
        if(p.collected)return;
        const pulse=Math.sin(p.pulse)*.2+.8;
        const icons={shield:'🛡',magnet:'🧲',double:'⭐'};
        const colors={shield:'rgba(74,144,226,.3)',magnet:'rgba(226,74,144,.3)',double:'rgba(255,215,0,.3)'};
        ctx.save();ctx.translate(p.x,p.y);ctx.scale(pulse,pulse);
        ctx.fillStyle=colors[p.type];ctx.beginPath();ctx.arc(0,0,p.r,0,Math.PI*2);ctx.fill();
        ctx.strokeStyle=colors[p.type].replace('.3','.9');ctx.lineWidth=2;ctx.stroke();
        ctx.font=`${p.r*1.2}px serif`;ctx.textAlign='center';ctx.textBaseline='middle';
        ctx.fillText(icons[p.type],0,1);
        ctx.restore();
      });

      // Magnet field visual
      if(magnet>0){
        const alpha=(magnet/400)*.2;
        ctx.strokeStyle=`rgba(226,74,144,${alpha})`;ctx.lineWidth=2;
        ctx.setLineDash([5,5]);ctx.beginPath();ctx.arc(bird.x,bird.y,120,0,Math.PI*2);ctx.stroke();
        ctx.setLineDash([]);
      }

      // Particles
      particles.forEach(p=>{
        ctx.globalAlpha=p.life;ctx.fillStyle=p.color;
        ctx.beginPath();ctx.arc(p.x,p.y,p.r*p.life,0,Math.PI*2);ctx.fill();
      });
      ctx.globalAlpha=1;

      // Bird
      ctx.save();ctx.translate(bird.x,bird.y);ctx.rotate(bird.a);
      // Shield glow
      if(shield>0){
        ctx.globalAlpha=.4+Math.sin(Date.now()*.01)*.2;
        ctx.fillStyle='#4a90e2';ctx.beginPath();ctx.arc(0,0,BIRD_R+8,0,Math.PI*2);ctx.fill();
        ctx.globalAlpha=1;
      }
      // Invincible flash
      if(invincible===0||Math.floor(invincible/6)%2===0){
        const bg=ctx.createRadialGradient(-2,-2,0,0,0,BIRD_R);
        bg.addColorStop(0,'#fff');bg.addColorStop(1,t.bird);
        ctx.fillStyle=bg;ctx.beginPath();ctx.arc(0,0,BIRD_R,0,Math.PI*2);ctx.fill();
        ctx.fillStyle='#0a0407';ctx.beginPath();ctx.arc(5,-3,2.5,0,Math.PI*2);ctx.fill();
        ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(5.5,-3.5,1,0,Math.PI*2);ctx.fill();
        ctx.fillStyle='#ff6b35';ctx.beginPath();ctx.moveTo(9,1);ctx.lineTo(14,0);ctx.lineTo(9,3);ctx.fill();
        // Double score indicator
        if(doubleScore>0){
          ctx.fillStyle='#ffd700';ctx.font='bold 10px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
          ctx.fillText('×2',-1,-BIRD_R-7);
        }
      }
      ctx.restore();

      // HUD — active powerup icons
      let hudX=8;
      if(shield>0){ctx.font='16px serif';ctx.fillText('🛡',hudX,H-8);hudX+=24;}
      if(magnet>0){ctx.font='16px serif';ctx.fillText('🧲',hudX,H-8);hudX+=24;}
      if(doubleScore>0){ctx.font='16px serif';ctx.fillText('⭐',hudX,H-8);}

      // Score
      ctx.fillStyle='rgba(255,255,255,.9)';
      ctx.font=`700 26px 'DM Sans',sans-serif`;
      ctx.textAlign='center';ctx.textBaseline='top';
      ctx.fillText(sc,W/2,10);

      // Stage banner
      if(stageBanner&&stageTimer>0){
        const a=Math.min(1,stageTimer/30)*Math.min(1,(stageTimer)/30);
        ctx.globalAlpha=a;
        ctx.fillStyle='rgba(10,4,6,.7)';ctx.fillRect(0,H/2-30,W,60);
        ctx.fillStyle='#c9a96e';ctx.font=`700 14px 'DM Sans',sans-serif`;
        ctx.textAlign='center';ctx.textBaseline='middle';
        ctx.fillText(`STAGE ${stageIdx+1} — ${stageBanner.toUpperCase()}`,W/2,H/2);
        ctx.globalAlpha=1;
      }
    };

    const onTap=()=>flap();
    const onK=e=>{if(e.code==='Space'){e.preventDefault();flap();}};
    canvas.addEventListener('click',onTap);
    canvas.addEventListener('touchstart',e=>{e.preventDefault();onTap();},{passive:false});
    document.addEventListener('keydown',onK);
    container.querySelector('#fl-s').addEventListener('click',start);
    draw();

    this._c=()=>{
      window.removeEventListener('resize',resize);
      canvas.removeEventListener('click',onTap);
      canvas.removeEventListener('touchstart',onTap);
      document.removeEventListener('keydown',onK);
      cancelAnimationFrame(raf);run=false;
    };
  },
  getSettings(c){
    c.innerHTML=`<div class="settings-row"><span class="settings-row-label">Sky Theme</span><div class="settings-swatches" id="fl-t"></div></div>`;
    const to=c.querySelector('#fl-t');
    Object.entries(TH).forEach(([k,v])=>{
      const s=document.createElement('div');s.className='swatch'+(k===thk?' active':'');
      s.style.background=v.s2;s.title=k;
      s.onclick=()=>{thk=k;to.querySelectorAll('.swatch').forEach(x=>x.classList.remove('active'));s.classList.add('active');};
      to.appendChild(s);
    });
  },
  destroy(){if(this._c)this._c();}
};
})();
