'use strict';
(()=>{
const THEMES={
  dark:{bg:'#0a0407',brick1:'#8b1a2a',brick2:'#4a4a8a',brick3:'#3a3a3a',paddle:'#c9a96e',ball:'#ffffff'},
  ocean:{bg:'#020a14',brick1:'#1a6a8a',brick2:'#0a3a5a',brick3:'#2a2a4a',paddle:'#60c0e0',ball:'#e0f0ff'},
  forest:{bg:'#020a04',brick1:'#2a7a3a',brick2:'#1a4a6a',brick3:'#3a3a2a',paddle:'#a0d060',ball:'#e0ffd0'},
  fire:{bg:'#0a0402',brick1:'#c04020',brick2:'#a02010',brick3:'#4a3a2a',paddle:'#f0a020',ball:'#fff0c0'},
};
let themeKey='dark';

window.GameRegistry=window.GameRegistry||{};
window.GameRegistry['brickbreaker']={
  mount(container){
    container.innerHTML=`
      <div class="game-ui">
        <div class="game-score-bar">
          <span class="game-score-label">Score</span>
          <span class="game-score-val" id="bb-score">0</span>
          <span class="game-score-label">Level</span>
          <span class="game-score-val" id="bb-level">1</span>
        </div>
        <div class="game-canvas-wrap" id="bb-wrap">
          <canvas id="bb-canvas" class="game-canvas"></canvas>
          <div class="game-msg" id="bb-msg">
            <p class="game-msg-title">Brick Breaker</p>
            <p class="game-msg-sub">Drag or move paddle • Break all bricks</p>
            <button class="game-msg-btn" id="bb-start">Play</button>
          </div>
        </div>
      </div>`;

    const canvas=container.querySelector('#bb-canvas');
    const wrap=container.querySelector('#bb-wrap');
    const ctx=canvas.getContext('2d');
    const scoreEl=container.querySelector('#bb-score');
    const levelEl=container.querySelector('#bb-level');
    const msg=container.querySelector('#bb-msg');
    const sfx=window.SFX||{};

    function resize(){
      canvas.width=wrap.clientWidth||320;
      canvas.height=wrap.clientHeight||420;
    }
    resize();
    window.addEventListener('resize',resize);

    let paddle,ball,bricks,score=0,level=1,raf,running=false;
    const PH=14,PW=()=>Math.min(90,canvas.width*0.28);

    function mkBricks(lvl){
      const cols=6,bw=(canvas.width-20)/cols-4,bh=18,rows=3+Math.min(lvl-1,4);
      const arr=[];
      for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
        const t=lvl>3&&Math.random()<0.15?2:lvl>1&&Math.random()<0.2?1:0;
        const hp=[1,2,0][t];
        arr.push({x:10+c*(bw+4),y:45+r*(bh+5),w:bw,h:bh,hp,maxHp:hp,type:t});
      }
      return arr;
    }

    function startLevel(){
      const spd=3.5+level*0.5;
      const pw=PW();
      paddle={x:canvas.width/2-pw/2,y:canvas.height-32,w:pw,h:PH};
      ball={x:canvas.width/2,y:canvas.height-60,vx:spd*(Math.random()<0.5?0.7:-0.7),vy:-spd,r:8};
      bricks=mkBricks(level);
      running=true;msg.style.display='none';
      if(raf)cancelAnimationFrame(raf);loop();
    }

    function startGame(){score=0;level=1;levelEl.textContent=1;scoreEl.textContent=0;startLevel();}

    function loop(){raf=requestAnimationFrame(()=>{update();draw();if(running)loop();});}

    function update(){
      const W=canvas.width,H=canvas.height;
      ball.x+=ball.vx;ball.y+=ball.vy;
      if(ball.x-ball.r<0){ball.x=ball.r;ball.vx=Math.abs(ball.vx);}
      if(ball.x+ball.r>W){ball.x=W-ball.r;ball.vx=-Math.abs(ball.vx);}
      if(ball.y-ball.r<0){ball.y=ball.r;ball.vy=Math.abs(ball.vy);}
      if(ball.y>H+20){die();return;}
      if(ball.y+ball.r>paddle.y&&ball.y+ball.r<paddle.y+paddle.h+ball.r&&ball.x>paddle.x-ball.r&&ball.x<paddle.x+paddle.w+ball.r){
        ball.vy=-Math.abs(ball.vy);
        ball.vx=((ball.x-(paddle.x+paddle.w/2))/(paddle.w/2))*5;
        ball.y=paddle.y-ball.r;
        if(sfx.click)sfx.click();
      }
      let hitCount=0;
      for(const b of bricks){
        if(b.hp===0)continue;
        if(ball.x+ball.r>b.x&&ball.x-ball.r<b.x+b.w&&ball.y+ball.r>b.y&&ball.y-ball.r<b.y+b.h){
          b.hp--;
          if(b.hp<=0){score+=b.type===1?20:10;scoreEl.textContent=score;if(sfx.score)sfx.score();}
          else if(sfx.flip)sfx.flip();
          const ol=ball.x+ball.r-b.x,or2=b.x+b.w-(ball.x-ball.r);
          const ot=ball.y+ball.r-b.y,ob=b.y+b.h-(ball.y-ball.r);
          if(Math.min(ol,or2)<Math.min(ot,ob))ball.vx*=-1;else ball.vy*=-1;
          hitCount++;if(hitCount>1)break;
        }
      }
      if(bricks.filter(b=>b.hp>0&&b.type!==2).length===0)nextLevel();
    }

    function nextLevel(){
      running=false;cancelAnimationFrame(raf);level++;
      if(sfx.arcade)sfx.arcade();
      levelEl.textContent=level;
      msg.innerHTML=`<p class="game-msg-title">Level ${level-1} Clear!</p><p class="game-msg-sub">Score: ${score}</p><button class="game-msg-btn" id="bb-start">Next</button>`;
      msg.style.display='flex';
      msg.querySelector('#bb-start').addEventListener('click',startLevel);
    }

    function die(){
      running=false;if(sfx.die)sfx.die();
      msg.innerHTML=`<p class="game-msg-title">Game Over</p><p class="game-msg-sub">Score: ${score}</p><button class="game-msg-btn" id="bb-start">Again</button>`;
      msg.style.display='flex';
      msg.querySelector('#bb-start').addEventListener('click',startGame);
    }

    function draw(){
      const t=THEMES[themeKey],W=canvas.width,H=canvas.height;
      ctx.fillStyle=t.bg;ctx.fillRect(0,0,W,H);
      bricks.forEach(b=>{
        if(b.hp<=0&&b.maxHp>0)return;
        ctx.globalAlpha=b.maxHp===0?0.35:b.maxHp>1?(0.4+0.6*(b.hp/b.maxHp)):1;
        ctx.fillStyle=[t.brick1,t.brick2,t.brick3][b.type];
        ctx.beginPath();if(ctx.roundRect)ctx.roundRect(b.x,b.y,b.w,b.h,4);else ctx.rect(b.x,b.y,b.w,b.h);ctx.fill();
        ctx.globalAlpha=0.25;ctx.fillStyle='#fff';ctx.fillRect(b.x+2,b.y+2,b.w-4,4);
        ctx.globalAlpha=1;
      });
      const pg=ctx.createLinearGradient(paddle.x,0,paddle.x+paddle.w,0);
      pg.addColorStop(0,t.brick1);pg.addColorStop(0.5,t.paddle);pg.addColorStop(1,t.brick1);
      ctx.fillStyle=pg;ctx.beginPath();if(ctx.roundRect)ctx.roundRect(paddle.x,paddle.y,paddle.w,paddle.h,7);else ctx.rect(paddle.x,paddle.y,paddle.w,paddle.h);ctx.fill();
      const bg=ctx.createRadialGradient(ball.x,ball.y,0,ball.x,ball.y,ball.r);
      bg.addColorStop(0,'#fff');bg.addColorStop(1,t.paddle);
      ctx.fillStyle=bg;ctx.beginPath();ctx.arc(ball.x,ball.y,ball.r,0,Math.PI*2);ctx.fill();
    }

    const onMove=e=>{
      const rect=canvas.getBoundingClientRect();
      const cx=e.touches?e.touches[0].clientX:e.clientX;
      const x=(cx-rect.left)*(canvas.width/rect.width);
      paddle.x=Math.max(0,Math.min(canvas.width-paddle.w,x-paddle.w/2));
    };
    canvas.addEventListener('mousemove',onMove);
    canvas.addEventListener('touchmove',e=>{e.preventDefault();onMove(e);},{passive:false});
    container.querySelector('#bb-start').addEventListener('click',startGame);
    draw();
    this._cleanup=()=>{window.removeEventListener('resize',resize);canvas.removeEventListener('mousemove',onMove);cancelAnimationFrame(raf);running=false;};
  },
  getSettings(container){
    container.innerHTML=`<div class="settings-row"><span class="settings-row-label">Theme</span><div class="settings-swatches" id="bb-theme-opts"></div></div>`;
    const to=container.querySelector('#bb-theme-opts');
    Object.entries(THEMES).forEach(([k,v])=>{const s=document.createElement('div');s.className='swatch'+(k===themeKey?' active':'');s.style.background=v.brick1;s.title=k;s.addEventListener('click',()=>{themeKey=k;to.querySelectorAll('.swatch').forEach(x=>x.classList.remove('active'));s.classList.add('active');});to.appendChild(s);});
  },
  destroy(){if(this._cleanup)this._cleanup();}
};
})();
