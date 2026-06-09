'use strict';
(()=>{
window.GameRegistry=window.GameRegistry||{};
window.GameRegistry['taptarget']={
  mount(container){
    const sfx=window.SFX||{};
    container.innerHTML=`
      <div class="game-ui">
        <div class="game-score-bar">
          <span class="game-score-label">Score</span>
          <span class="game-score-val" id="tt-score">0</span>
          <span class="game-score-label">Time</span>
          <span class="game-score-val" id="tt-time">30</span>
        </div>
        <canvas id="tt-canvas" class="game-canvas"></canvas>
        <div class="game-msg" id="tt-msg">
          <p class="game-msg-title">Tap Target</p>
          <p class="game-msg-sub">Tap targets as fast as you can</p>
          <button class="game-msg-btn" id="tt-start">Play</button>
        </div>
      </div>`;

    const canvas=container.querySelector('#tt-canvas');
    const ctx=canvas.getContext('2d');
    const scoreEl=container.querySelector('#tt-score');
    const timeEl=container.querySelector('#tt-time');
    const msg=container.querySelector('#tt-msg');

    const W=340,H=380;
    canvas.width=W; canvas.height=H;

    let targets,score,timeLeft,raf,running=false,lastTick;

    function mkTarget(){
      const r=Math.random()*14+20;
      return{
        x:r+Math.random()*(W-r*2), y:r+Math.random()*(H-r*2),
        r, life:1, maxLife:Math.random()*1.5+0.8,
        color:`hsl(${340+Math.random()*30},${60+Math.random()*30}%,${30+Math.random()*20}%)`,
        pulse:0
      };
    }

    function startGame(){
      targets=[mkTarget(),mkTarget()];
      score=0; timeLeft=30; running=true; lastTick=Date.now();
      scoreEl.textContent='0'; timeEl.textContent='30';
      msg.style.display='none';
      if(raf) cancelAnimationFrame(raf);
      loop();
    }

    function loop(){
      raf=requestAnimationFrame(()=>{ update(); draw(); if(running) loop(); });
    }

    function update(){
      const now=Date.now();
      const dt=(now-lastTick)/1000;
      lastTick=now;
      timeLeft=Math.max(0,timeLeft-dt);
      timeEl.textContent=Math.ceil(timeLeft);
      if(timeLeft<=0){ die(); return; }
      targets.forEach(t=>{
        t.life-=dt/t.maxLife;
        t.pulse+=dt*3;
      });
      targets=targets.filter(t=>t.life>0);
      while(targets.length<3) targets.push(mkTarget());
    }

    function die(){
      running=false;
      if(sfx.arcade) sfx.arcade();
      msg.innerHTML=`<p class="game-msg-title">Time's Up!</p><p class="game-msg-sub">Score: ${score}</p><button class="game-msg-btn" id="tt-start">Try Again</button>`;
      msg.style.display='flex';
      msg.querySelector('#tt-start').addEventListener('click',startGame);
    }

    function draw(){
      ctx.fillStyle='#0a0407'; ctx.fillRect(0,0,W,H);
      targets.forEach(t=>{
        const alpha=Math.max(0,t.life);
        const pulse=Math.sin(t.pulse)*0.15+0.85;
        ctx.globalAlpha=alpha;
        ctx.beginPath(); ctx.arc(t.x,t.y,t.r*pulse,0,Math.PI*2);
        ctx.fillStyle=t.color; ctx.fill();
        ctx.strokeStyle='rgba(201,169,110,0.6)'; ctx.lineWidth=2;
        ctx.stroke();
        ctx.beginPath(); ctx.arc(t.x,t.y,t.r*0.4*pulse,0,Math.PI*2);
        ctx.fillStyle='rgba(255,255,255,0.3)'; ctx.fill();
        ctx.globalAlpha=1;
      });
    }

    function onTap(e){
      if(!running){ startGame(); return; }
      const rect=canvas.getBoundingClientRect();
      const cx=e.touches?e.touches[0].clientX:e.clientX;
      const cy=e.touches?e.touches[0].clientY:e.clientY;
      const x=(cx-rect.left)*(W/rect.width);
      const y=(cy-rect.top)*(H/rect.height);
      let hit=false;
      targets=targets.filter(t=>{
        const d=Math.hypot(x-t.x,y-t.y);
        if(d<t.r){ hit=true; score++; scoreEl.textContent=score; return false; }
        return true;
      });
      if(hit && sfx.tap) sfx.tap();
      while(targets.length<3) targets.push(mkTarget());
    }

    canvas.addEventListener('click',onTap);
    canvas.addEventListener('touchstart',e=>{ e.preventDefault(); onTap(e); },{passive:false});
    container.querySelector('#tt-start').addEventListener('click',startGame);
    draw();
    this._cleanup=()=>{
      canvas.removeEventListener('click',onTap);
      cancelAnimationFrame(raf); running=false;
    };
  },
  destroy(){ if(this._cleanup) this._cleanup(); }
};
})();
