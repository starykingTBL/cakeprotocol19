'use strict';
(()=>{
const THEMES={dark:{sky:'#050208',ground:'#1a0810',player:'#c9a96e',obs:'#8b1a2a'},
  purple:{sky:'#0a0520',ground:'#1a0a30',player:'#e8a0e0',obs:'#6a1a8a'},
  forest:{sky:'#020a04',ground:'#0a2010',player:'#a0d060',obs:'#2a6a1a'},
  sunset:{sky:'#1a0808',ground:'#2a1008',player:'#f0c060',obs:'#c04020'}};
let themeKey='dark';

window.GameRegistry=window.GameRegistry||{};
window.GameRegistry['runner']={
  mount(container){
    container.innerHTML=`
      <div class="game-ui">
        <div class="game-score-bar">
          <span class="game-score-label">Score</span>
          <span class="game-score-val" id="rn-score">0</span>
          <span class="game-score-label">Best</span>
          <span class="game-score-val" id="rn-best">0</span>
        </div>
        <div class="game-canvas-wrap">
          <canvas id="rn-canvas" class="game-canvas"></canvas>
          <div class="game-msg" id="rn-msg">
            <p class="game-msg-title">Runner</p>
            <p class="game-msg-sub">Tap or Space to jump • Double jump!</p>
            <button class="game-msg-btn" id="rn-start">Play</button>
          </div>
        </div>
      </div>`;

    const canvas=container.querySelector('#rn-canvas');
    const ctx=canvas.getContext('2d');
    const scoreEl=container.querySelector('#rn-score');
    const bestEl=container.querySelector('#rn-best');
    const msg=container.querySelector('#rn-msg');
    const sfx=window.SFX||{};

    function resize(){
      const wrap=canvas.parentElement;
      canvas.width=wrap.clientWidth||360;
      canvas.height=wrap.clientHeight||260;
    }
    resize();
    window.addEventListener('resize',resize);

    const GND=()=>canvas.height-50;
    let player,obstacles,particles,stars,score,best=0,speed,raf,running=false,frame=0;

    function mkStars(){return Array.from({length:40},()=>({x:Math.random()*canvas.width,y:Math.random()*(GND()-20),s:Math.random()*1.5+0.3,sp:Math.random()*0.3+0.1}));}

    function startGame(){
      player={x:60,y:GND(),w:22,h:28,vy:0,onGround:true,jumps:0};
      obstacles=[];particles=[];stars=mkStars();score=0;speed=3.2;frame=0;running=true;
      scoreEl.textContent='0';msg.style.display='none';
      if(raf)cancelAnimationFrame(raf);loop();
    }

    function jump(){
      if(!running){startGame();return;}
      if(player.jumps<2){player.vy=-11;player.onGround=false;player.jumps++;if(sfx.click)sfx.click();}
    }

    function loop(){raf=requestAnimationFrame(()=>{update();draw();if(running)loop();});}

    function update(){
      const W=canvas.width,H=canvas.height,gnd=GND();
      frame++;speed+=0.0015;score=Math.floor(frame/6);scoreEl.textContent=score;
      if(score>best){best=score;bestEl.textContent=best;}
      player.vy+=0.65;player.y+=player.vy;
      if(player.y>=gnd){player.y=gnd;player.vy=0;player.onGround=true;player.jumps=0;}
      stars.forEach(s=>{s.x-=s.sp;if(s.x<0)s.x=W;});
      if(frame%Math.max(55,90-Math.floor(score/20))===0){
        const h=Math.random()<0.4?50:28;
        obstacles.push({x:W+10,y:gnd+28-h,w:18,h,type:Math.random()<0.3?'tall':'normal'});
      }
      obstacles.forEach(o=>o.x-=speed);
      obstacles=obstacles.filter(o=>o.x>-30);
      particles.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=0.15;p.life-=0.06;});
      particles=particles.filter(p=>p.life>0);
      for(const o of obstacles){
        if(player.x+player.w-4>o.x+4&&player.x+4<o.x+o.w-4&&player.y+player.h-4>o.y+4&&player.y+4<o.y+o.h-4){
          for(let i=0;i<4;i++)particles.push({x:player.x+player.w/2,y:player.y+player.h/2,vx:(Math.random()-0.5)*3,vy:-Math.random()*3-1,life:1});
          die();return;
        }
      }
    }

    function die(){running=false;if(sfx.die)sfx.die();msg.innerHTML=`<p class="game-msg-title">Game Over</p><p class="game-msg-sub">Score: ${score}</p><button class="game-msg-btn" id="rn-start">Again</button>`;msg.style.display='flex';msg.querySelector('#rn-start').addEventListener('click',startGame);}

    function draw(){
      const W=canvas.width,H=canvas.height,gnd=GND(),t=THEMES[themeKey];
      ctx.fillStyle=t.sky;ctx.fillRect(0,0,W,H);
      stars.forEach(s=>{ctx.fillStyle=`rgba(255,200,200,${s.s*0.4})`;ctx.beginPath();ctx.arc(s.x,s.y,s.s,0,Math.PI*2);ctx.fill();});
      const g=ctx.createLinearGradient(0,gnd+28,0,H);g.addColorStop(0,t.ground);g.addColorStop(1,t.sky);
      ctx.fillStyle=g;ctx.fillRect(0,gnd+28,W,H-gnd-28);
      obstacles.forEach(o=>{ctx.fillStyle=o.type==='tall'?t.obs+'99':t.obs;ctx.beginPath();if(ctx.roundRect)ctx.roundRect(o.x,o.y,o.w,o.h,3);else ctx.rect(o.x,o.y,o.w,o.h);ctx.fill();});
      ctx.fillStyle=t.player;ctx.beginPath();if(ctx.roundRect)ctx.roundRect(player.x,player.y,player.w,player.h,5);else ctx.rect(player.x,player.y,player.w,player.h);ctx.fill();
      ctx.fillStyle='#0a0407';ctx.fillRect(player.x+6,player.y+8,4,4);ctx.fillRect(player.x+14,player.y+8,4,4);
      particles.forEach(p=>{ctx.globalAlpha=p.life;ctx.fillStyle=t.obs;ctx.beginPath();ctx.arc(p.x,p.y,3,0,Math.PI*2);ctx.fill();});
      ctx.globalAlpha=1;
    }

    const onKey=e=>{if(e.code==='Space'){e.preventDefault();jump();}};
    document.addEventListener('keydown',onKey);
    canvas.addEventListener('click',jump);
    canvas.addEventListener('touchstart',e=>{e.preventDefault();jump();},{passive:false});
    container.querySelector('#rn-start').addEventListener('click',startGame);
    draw();
    this._cleanup=()=>{window.removeEventListener('resize',resize);document.removeEventListener('keydown',onKey);canvas.removeEventListener('click',jump);cancelAnimationFrame(raf);running=false;};
  },
  getSettings(container){
    container.innerHTML=`<div class="settings-row"><span class="settings-row-label">Theme</span><div class="settings-btns" id="rn-theme-opts"></div></div>`;
    const to=container.querySelector('#rn-theme-opts');
    Object.keys(THEMES).forEach(k=>{const b=document.createElement('button');b.className='settings-opt'+(k===themeKey?' active':'');b.textContent=k;b.addEventListener('click',()=>{themeKey=k;to.querySelectorAll('.settings-opt').forEach(x=>x.classList.remove('active'));b.classList.add('active');});to.appendChild(b);});
  },
  destroy(){if(this._cleanup)this._cleanup();}
};
})();
