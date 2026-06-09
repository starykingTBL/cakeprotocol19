'use strict';
(()=>{
window.GameRegistry=window.GameRegistry||{};
window.GameRegistry['brickbreaker']={
  mount(container){
    const sfx=window.SFX||{};
    container.innerHTML=`
      <div class="game-ui">
        <div class="game-score-bar">
          <span class="game-score-label">Score</span>
          <span class="game-score-val" id="bb-score">0</span>
          <span class="game-score-label">Level</span>
          <span class="game-score-val" id="bb-level">1</span>
        </div>
        <canvas id="bb-canvas" class="game-canvas"></canvas>
        <div class="game-msg" id="bb-msg">
          <p class="game-msg-title">Brick Breaker</p>
          <p class="game-msg-sub">Drag paddle • Break all bricks</p>
          <button class="game-msg-btn" id="bb-start">Play</button>
        </div>
      </div>`;

    const canvas=container.querySelector('#bb-canvas');
    const ctx=canvas.getContext('2d');
    const scoreEl=container.querySelector('#bb-score');
    const levelEl=container.querySelector('#bb-level');
    const msg=container.querySelector('#bb-msg');

    const W=320,H=420;
    canvas.width=W; canvas.height=H;

    let paddle,ball,bricks,score,level,raf,running=false;

    const BRICK_TYPES=[
      {hp:1,color:'#8b1a2a',pts:10},
      {hp:2,color:'#4a4a8a',pts:20},
      {hp:0,color:'#3a3a3a',pts:0},
    ];

    function mkBricks(lvl){
      const rows=4+Math.min(lvl-1,4), cols=7;
      const bw=(W-20)/cols-4, bh=16;
      const arr=[];
      for(let r=0;r<rows;r++) for(let c=0;c<cols;c++){
        const typeIdx=lvl>3&&Math.random()<0.15?2:lvl>1&&Math.random()<0.2?1:0;
        arr.push({x:10+c*(bw+4),y:40+r*(bh+5),w:bw,h:bh,...BRICK_TYPES[typeIdx],maxHp:BRICK_TYPES[typeIdx].hp});
      }
      return arr;
    }

    function startGame(lvl=1){
      level=lvl; score=lvl===1?0:score;
      levelEl.textContent=level; scoreEl.textContent=score;
      const spd=3.5+level*0.4;
      paddle={x:W/2-35,y:H-28,w:70,h=12,w:70};
      ball={x:W/2,y:H-50,vx:spd*(Math.random()<0.5?1:-1)*0.7,vy:-spd,r:7};
      bricks=mkBricks(level);
      running=true;
      msg.style.display='none';
      if(raf) cancelAnimationFrame(raf);
      loop();
    }

    function loop(){
      raf=requestAnimationFrame(()=>{ update(); draw(); if(running) loop(); });
    }

    function update(){
      ball.x+=ball.vx; ball.y+=ball.vy;
      if(ball.x-ball.r<0){ ball.x=ball.r; ball.vx*=-1; }
      if(ball.x+ball.r>W){ ball.x=W-ball.r; ball.vx*=-1; }
      if(ball.y-ball.r<0){ ball.y=ball.r; ball.vy*=-1; }
      if(ball.y+ball.r>H+ball.r*2){ die(); return; }
      if(ball.y+ball.r>paddle.y&&ball.y+ball.r<paddle.y+paddle.h&&
         ball.x>paddle.x&&ball.x<paddle.x+paddle.w){
        ball.vy=-Math.abs(ball.vy);
        ball.vx=((ball.x-(paddle.x+paddle.w/2))/(paddle.w/2))*5;
        if(sfx.click) sfx.click();
      }
      for(const b of bricks){
        if(b.hp===0) continue;
        if(ball.x+ball.r>b.x&&ball.x-ball.r<b.x+b.w&&
           ball.y+ball.r>b.y&&ball.y-ball.r<b.y+b.h){
          b.hp--;
          if(b.hp<=0){ score+=b.pts; scoreEl.textContent=score; if(sfx.score) sfx.score(); }
          else { if(sfx.flip) sfx.flip(); }
          const overlapL=ball.x+ball.r-b.x;
          const overlapR=b.x+b.w-ball.x+ball.r;
          const overlapT=ball.y+ball.r-b.y;
          const overlapB=b.y+b.h-ball.y+ball.r;
          const minH=Math.min(overlapL,overlapR);
          const minV=Math.min(overlapT,overlapB);
          if(minH<minV) ball.vx*=-1; else ball.vy*=-1;
          break;
        }
      }
      const alive=bricks.filter(b=>b.hp>0&&b.pts>0);
      if(alive.length===0){ nextLevel(); }
    }

    function nextLevel(){
      running=false;
      cancelAnimationFrame(raf);
      msg.innerHTML=`<p class="game-msg-title">Level ${level} Clear!</p><p class="game-msg-sub">Score: ${score}</p><button class="game-msg-btn" id="bb-start">Next Level</button>`;
      msg.style.display='flex';
      msg.querySelector('#bb-start').addEventListener('click',()=>startGame(level+1));
      if(sfx.arcade) sfx.arcade();
    }

    function die(){
      running=false;
      if(sfx.die) sfx.die();
      msg.innerHTML=`<p class="game-msg-title">Game Over</p><p class="game-msg-sub">Score: ${score}</p><button class="game-msg-btn" id="bb-start">Try Again</button>`;
      msg.style.display='flex';
      msg.querySelector('#bb-start').addEventListener('click',()=>startGame(1));
    }

    function draw(){
      ctx.fillStyle='#0a0407'; ctx.fillRect(0,0,W,H);
      bricks.forEach(b=>{
        if(b.hp<=0&&b.maxHp>0) return;
        const alpha=b.hp===0?0.3:b.maxHp>1?0.5+0.5*(b.hp/b.maxHp):1;
        ctx.globalAlpha=alpha;
        ctx.fillStyle=b.color;
        ctx.beginPath();
        if(ctx.roundRect) ctx.roundRect(b.x,b.y,b.w,b.h,3);
        else ctx.rect(b.x,b.y,b.w,b.h);
        ctx.fill();
        ctx.globalAlpha=0.3;
        ctx.fillStyle='#ffffff';
        ctx.fillRect(b.x+2,b.y+2,b.w-4,3);
        ctx.globalAlpha=1;
      });
      const pg=ctx.createLinearGradient(paddle.x,0,paddle.x+paddle.w,0);
      pg.addColorStop(0,'#6b1a2a'); pg.addColorStop(0.5,'#c9a96e'); pg.addColorStop(1,'#6b1a2a');
      ctx.fillStyle=pg;
      ctx.beginPath();
      if(ctx.roundRect) ctx.roundRect(paddle.x,paddle.y,paddle.w,paddle.h,6);
      else ctx.rect(paddle.x,paddle.y,paddle.w,paddle.h);
      ctx.fill();
      const bg=ctx.createRadialGradient(ball.x,ball.y,0,ball.x,ball.y,ball.r);
      bg.addColorStop(0,'#ffffff'); bg.addColorStop(1,'#c9a96e');
      ctx.fillStyle=bg;
      ctx.beginPath(); ctx.arc(ball.x,ball.y,ball.r,0,Math.PI*2); ctx.fill();
    }

    const onMove=e=>{
      const rect=canvas.getBoundingClientRect();
      const clientX=e.touches?e.touches[0].clientX:e.clientX;
      const x=(clientX-rect.left)*(W/rect.width);
      paddle.x=Math.max(0,Math.min(W-paddle.w,x-paddle.w/2));
    };
    canvas.addEventListener('mousemove',onMove);
    canvas.addEventListener('touchmove',onMove,{passive:true});
    container.querySelector('#bb-start').addEventListener('click',()=>startGame(1));
    draw();
    this._cleanup=()=>{
      canvas.removeEventListener('mousemove',onMove);
      canvas.removeEventListener('touchmove',onMove);
      cancelAnimationFrame(raf); running=false;
    };
  },
  destroy(){ if(this._cleanup) this._cleanup(); }
};
})();
