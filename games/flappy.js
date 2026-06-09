'use strict';
(()=>{
const THEMES={dark:{sky1:'#050208',sky2:'#150810',pipe:'#2a0d14',pipeDark:'#6b1a2a',bird:'#c9a96e',star:'rgba(255,200,200,'},
  day:{sky1:'#1a2a6c',sky2:'#b21f1f',pipe:'#2a6a2a',pipeDark:'#1a4a1a',bird:'#ffd166',star:'rgba(255,255,255,'},
  neon:{sky1:'#020210',sky2:'#100220',pipe:'#0a3a5a',pipeDark:'#1a6a8a',bird:'#40e0d0',star:'rgba(100,200,255,'},
  sunset:{sky1:'#1a0808',sky2:'#3a1808',pipe:'#4a2010',pipeDark:'#8a3010',bird:'#f0a040',star:'rgba(255,200,100,'}};
let themeKey='dark';

window.GameRegistry=window.GameRegistry||{};
window.GameRegistry['flappy']={
  mount(container){
    container.innerHTML=`
      <div class="game-ui">
        <div class="game-score-bar">
          <span class="game-score-label">Score</span>
          <span class="game-score-val" id="fl-score">0</span>
          <span class="game-score-label">Best</span>
          <span class="game-score-val" id="fl-best">0</span>
        </div>
        <div class="game-canvas-wrap">
          <canvas id="fl-canvas" class="game-canvas"></canvas>
          <div class="game-msg" id="fl-msg">
            <p class="game-msg-title">Flappy</p>
            <p class="game-msg-sub">Tap to fly through the gaps</p>
            <button class="game-msg-btn" id="fl-start">Play</button>
          </div>
        </div>
      </div>`;

    const canvas=container.querySelector('#fl-canvas');
    const wrap=canvas.parentElement;
    const ctx=canvas.getContext('2d');
    const scoreEl=container.querySelector('#fl-score');
    const bestEl=container.querySelector('#fl-best');
    const msg=container.querySelector('#fl-msg');
    const sfx=window.SFX||{};

    function resize(){canvas.width=wrap.clientWidth||320;canvas.height=wrap.clientHeight||420;}
    resize();window.addEventListener('resize',resize);

    const GRAV=0.5,JUMP=-9,PIPE_W=52,PIPE_SPD=2.6;
    let bird,pipes,score,best=0,raf,running=false,stars;

    function mkStars(){return Array.from({length:35},()=>({x:Math.random()*canvas.width,y:Math.random()*canvas.height,r:Math.random()*1.2+0.3,o:Math.random()*0.5+0.2}));}

    function GAP(){return Math.min(160,canvas.height*0.36);}

    function startGame(){
      bird={x:Math.floor(canvas.width*0.25),y:canvas.height/2,vy:0,r:14,angle:0};
      pipes=[];score=0;running=true;stars=mkStars();
      scoreEl.textContent='0';msg.style.display='none';
      if(raf)cancelAnimationFrame(raf);loop();
    }

    function flap(){
      if(!running){startGame();return;}
      bird.vy=JUMP;if(sfx.click)sfx.click();
    }

    function loop(){raf=requestAnimationFrame(()=>{update();draw();if(running)loop();});}

    function update(){
      const W=canvas.width,H=canvas.height,gap=GAP();
      bird.vy+=GRAV;bird.y+=bird.vy;bird.angle=Math.max(-0.5,Math.min(1.2,bird.vy*0.06));
      if(bird.y-bird.r<0){bird.y=bird.r;bird.vy=0;}
      if(bird.y+bird.r>H){die();return;}
      if(!pipes.length||pipes[pipes.length-1].x<W-Math.max(160,W*0.45)){
        const top=60+Math.random()*(H-gap-120);
        pipes.push({x:W+10,top,scored:false});
      }
      pipes.forEach(p=>p.x-=PIPE_SPD);
      pipes=pipes.filter(p=>p.x>-PIPE_W-10);
      for(const p of pipes){
        const inX=bird.x+bird.r>p.x&&bird.x-bird.r<p.x+PIPE_W;
        const inY=bird.y-bird.r<p.top||bird.y+bird.r>p.top+gap;
        if(inX&&inY){die();return;}
        if(!p.scored&&p.x+PIPE_W<bird.x){p.scored=true;score++;scoreEl.textContent=score;if(score>best){best=score;bestEl.textContent=best;}if(sfx.score)sfx.score();}
      }
    }

    function die(){running=false;if(sfx.die)sfx.die();msg.innerHTML=`<p class="game-msg-title">Game Over</p><p class="game-msg-sub">Score: ${score}</p><button class="game-msg-btn" id="fl-start">Again</button>`;msg.style.display='flex';msg.querySelector('#fl-start').addEventListener('click',startGame);}

    function drawPipe(x,h,flip){
      const t=THEMES[themeKey],W=canvas.width,H=canvas.height;
      const g=ctx.createLinearGradient(x,0,x+PIPE_W,0);
      g.addColorStop(0,t.pipeDark);g.addColorStop(0.5,t.pipe);g.addColorStop(1,t.pipeDark);
      ctx.fillStyle=g;
      ctx.beginPath();if(ctx.roundRect)ctx.roundRect(x,flip?0:H-h,PIPE_W,h,flip?[0,0,6,6]:[6,6,0,0]);else ctx.rect(x,flip?0:H-h,PIPE_W,h);ctx.fill();
      ctx.fillStyle=t.pipeDark;const ch=14;
      ctx.beginPath();if(ctx.roundRect)ctx.roundRect(x-4,flip?h-ch:H-h,PIPE_W+8,ch,4);else ctx.rect(x-4,flip?h-ch:H-h,PIPE_W+8,ch);ctx.fill();
    }

    function draw(){
      const t=THEMES[themeKey],W=canvas.width,H=canvas.height,gap=GAP();
      const sky=ctx.createLinearGradient(0,0,0,H);sky.addColorStop(0,t.sky1);sky.addColorStop(1,t.sky2);
      ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
      stars.forEach(s=>{ctx.globalAlpha=s.o*(0.7+Math.sin(Date.now()*0.001+s.x)*0.3);ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);ctx.fill();});
      ctx.globalAlpha=1;
      pipes.forEach(p=>{drawPipe(p.x,p.top,true);drawPipe(p.x,H-p.top-gap,false);});
      ctx.save();ctx.translate(bird.x,bird.y);ctx.rotate(bird.angle);
      const bg=ctx.createRadialGradient(-2,-2,0,0,0,bird.r);bg.addColorStop(0,'#fff');bg.addColorStop(1,t.bird);
      ctx.fillStyle=bg;ctx.beginPath();ctx.arc(0,0,bird.r,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#0a0407';ctx.beginPath();ctx.arc(5,-3,3,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(6,-4,1.2,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#ff6b35';ctx.beginPath();ctx.moveTo(10,2);ctx.lineTo(16,0);ctx.lineTo(10,4);ctx.fill();
      ctx.restore();
      ctx.fillStyle='rgba(255,255,255,0.9)';ctx.font=`700 28px 'DM Sans',sans-serif`;ctx.textAlign='center';ctx.textBaseline='top';ctx.fillText(score,W/2,12);
    }

    const onTap=()=>flap();
    const onKey=e=>{if(e.code==='Space'){e.preventDefault();flap();}};
    canvas.addEventListener('click',onTap);
    canvas.addEventListener('touchstart',e=>{e.preventDefault();onTap();},{passive:false});
    document.addEventListener('keydown',onKey);
    container.querySelector('#fl-start').addEventListener('click',startGame);
    draw();
    this._cleanup=()=>{window.removeEventListener('resize',resize);canvas.removeEventListener('click',onTap);canvas.removeEventListener('touchstart',onTap);document.removeEventListener('keydown',onKey);cancelAnimationFrame(raf);running=false;};
  },
  getSettings(container){
    container.innerHTML=`<div class="settings-row"><span class="settings-row-label">Sky Theme</span><div class="settings-swatches" id="fl-theme-opts"></div></div>`;
    const to=container.querySelector('#fl-theme-opts');
    Object.entries(THEMES).forEach(([k,v])=>{const s=document.createElement('div');s.className='swatch'+(k===themeKey?' active':'');s.style.background=v.sky2;s.title=k;s.addEventListener('click',()=>{themeKey=k;to.querySelectorAll('.swatch').forEach(x=>x.classList.remove('active'));s.classList.add('active');});to.appendChild(s);});
  },
  destroy(){if(this._cleanup)this._cleanup();}
};
})();
