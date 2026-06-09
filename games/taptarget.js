'use strict';
(()=>{
const THEMES={dark:{bg:'#0a0407',target:'#8b1a2a',ring:'#c9a96e'},
  neon:{bg:'#020210',target:'#6a10c0',ring:'#40e0d0'},
  fire:{bg:'#0a0402',target:'#c04010',ring:'#f0a020'},
  ice:{bg:'#020814',target:'#1a60c0',ring:'#a0d0ff'}};
let themeKey='dark';

window.GameRegistry=window.GameRegistry||{};
window.GameRegistry['taptarget']={
  mount(container){
    container.innerHTML=`
      <div class="game-ui">
        <div class="game-score-bar">
          <span class="game-score-label">Score</span>
          <span class="game-score-val" id="tt-score">0</span>
          <span class="game-score-label">Time</span>
          <span class="game-score-val" id="tt-time">30</span>
        </div>
        <div class="game-canvas-wrap">
          <canvas id="tt-canvas" class="game-canvas"></canvas>
          <div class="game-msg" id="tt-msg">
            <p class="game-msg-title">Tap Target</p>
            <p class="game-msg-sub">Tap as fast as you can!</p>
            <button class="game-msg-btn" id="tt-start">Play</button>
          </div>
        </div>
      </div>`;

    const canvas=container.querySelector('#tt-canvas');
    const wrap=canvas.parentElement;
    const ctx=canvas.getContext('2d');
    const scoreEl=container.querySelector('#tt-score');
    const timeEl=container.querySelector('#tt-time');
    const msg=container.querySelector('#tt-msg');
    const sfx=window.SFX||{};

    function resize(){canvas.width=wrap.clientWidth||340;canvas.height=wrap.clientHeight||380;}
    resize();window.addEventListener('resize',resize);

    let targets,score,timeLeft,raf,running=false,lastTick;

    function mkTarget(){
      const W=canvas.width,H=canvas.height;
      const r=Math.random()*16+20;
      return{x:r+10+Math.random()*(W-r*2-20),y:r+10+Math.random()*(H-r*2-20),r,life:1,maxLife:Math.random()*1.5+0.7,pulse:0};
    }

    function startGame(){
      targets=[mkTarget(),mkTarget()];score=0;timeLeft=30;running=true;lastTick=Date.now();
      scoreEl.textContent='0';timeEl.textContent='30';msg.style.display='none';
      if(raf)cancelAnimationFrame(raf);loop();
    }

    function loop(){raf=requestAnimationFrame(()=>{update();draw();if(running)loop();});}

    function update(){
      const now=Date.now(),dt=(now-lastTick)/1000;lastTick=now;
      timeLeft=Math.max(0,timeLeft-dt);timeEl.textContent=Math.ceil(timeLeft);
      if(timeLeft<=0){die();return;}
      targets.forEach(t=>{t.life-=dt/t.maxLife;t.pulse+=dt*4;});
      targets=targets.filter(t=>t.life>0);
      while(targets.length<3)targets.push(mkTarget());
    }

    function die(){running=false;if(sfx.arcade)sfx.arcade();msg.innerHTML=`<p class="game-msg-title">Time's Up!</p><p class="game-msg-sub">Score: ${score}</p><button class="game-msg-btn" id="tt-start">Again</button>`;msg.style.display='flex';msg.querySelector('#tt-start').addEventListener('click',startGame);}

    function draw(){
      const t=THEMES[themeKey];
      ctx.fillStyle=t.bg;ctx.fillRect(0,0,canvas.width,canvas.height);
      targets.forEach(tg=>{
        const a=Math.max(0,tg.life),pulse=Math.sin(tg.pulse)*0.12+0.88;
        ctx.globalAlpha=a;
        ctx.beginPath();ctx.arc(tg.x,tg.y,tg.r*pulse,0,Math.PI*2);ctx.fillStyle=t.target;ctx.fill();
        ctx.strokeStyle=t.ring;ctx.lineWidth=2.5;ctx.stroke();
        ctx.beginPath();ctx.arc(tg.x,tg.y,tg.r*0.4*pulse,0,Math.PI*2);ctx.fillStyle='rgba(255,255,255,0.25)';ctx.fill();
        ctx.globalAlpha=1;
      });
    }

    function onTap(e){
      if(!running){startGame();return;}
      const rect=canvas.getBoundingClientRect();
      const cx=e.touches?e.touches[0].clientX:e.clientX;
      const cy=e.touches?e.touches[0].clientY:e.clientY;
      const x=(cx-rect.left)*(canvas.width/rect.width);
      const y=(cy-rect.top)*(canvas.height/rect.height);
      let hit=false;
      targets=targets.filter(tg=>{if(Math.hypot(x-tg.x,y-tg.y)<tg.r){hit=true;score++;scoreEl.textContent=score;return false;}return true;});
      if(hit&&sfx.tap)sfx.tap();
      while(targets.length<3)targets.push(mkTarget());
    }

    canvas.addEventListener('click',onTap);
    canvas.addEventListener('touchstart',e=>{e.preventDefault();onTap(e);},{passive:false});
    container.querySelector('#tt-start').addEventListener('click',startGame);
    draw();
    this._cleanup=()=>{window.removeEventListener('resize',resize);canvas.removeEventListener('click',onTap);cancelAnimationFrame(raf);running=false;};
  },
  getSettings(container){
    container.innerHTML=`<div class="settings-row"><span class="settings-row-label">Theme</span><div class="settings-swatches" id="tt-theme-opts"></div></div>`;
    const to=container.querySelector('#tt-theme-opts');
    Object.entries(THEMES).forEach(([k,v])=>{const s=document.createElement('div');s.className='swatch'+(k===themeKey?' active':'');s.style.background=v.target;s.title=k;s.addEventListener('click',()=>{themeKey=k;to.querySelectorAll('.swatch').forEach(x=>x.classList.remove('active'));s.classList.add('active');});to.appendChild(s);});
  },
  destroy(){if(this._cleanup)this._cleanup();}
};
})();
