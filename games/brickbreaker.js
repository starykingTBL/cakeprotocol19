'use strict';
(()=>{
const TH={dark:{bg:'#0a0407',b1:'#8b1a2a',b2:'#4a4a8a',b3:'#3a3a3a',pad:'#c9a96e',ball:'#fff'},ocean:{bg:'#020a14',b1:'#1a6a8a',b2:'#0a3a5a',b3:'#2a2a4a',pad:'#60c0e0',ball:'#e0f0ff'},forest:{bg:'#020a04',b1:'#2a7a3a',b2:'#1a4a6a',b3:'#3a3a2a',pad:'#a0d060',ball:'#e0ffd0'},fire:{bg:'#0a0402',b1:'#c04020',b2:'#a02010',b3:'#4a3a2a',pad:'#f0a020',ball:'#fff0c0'}};
let thk='dark';
window.GameRegistry=window.GameRegistry||{};
window.GameRegistry['brickbreaker']={
  mount(container){
    container.innerHTML=`<div class="game-ui"><div class="game-score-bar"><span class="game-score-label">Score</span><span class="game-score-val" id="bb-sc">0</span><span class="game-score-label">Lives</span><div class="lives-display" id="bb-lives">❤️❤️❤️</div><span class="game-score-label">Lv</span><span class="game-score-val" id="bb-lv">1</span></div><div class="game-canvas-wrap" id="bb-wrap"><canvas id="bb-c" class="game-canvas"></canvas><div class="game-msg" id="bb-msg"><p class="game-msg-title">Brick Breaker</p><p class="game-msg-sub">Drag paddle • 3 lives • Break all bricks</p><button class="game-msg-btn" id="bb-s">Play</button></div></div></div>`;
    const canvas=container.querySelector('#bb-c'),wrap=container.querySelector('#bb-wrap'),ctx=canvas.getContext('2d');
    const scEl=container.querySelector('#bb-sc'),lvEl=container.querySelector('#bb-lv'),livesEl=container.querySelector('#bb-lives'),msg=container.querySelector('#bb-msg'),sfx=window.SFX||{};
    const resize=()=>{canvas.width=wrap.clientWidth||320;canvas.height=wrap.clientHeight||400;};
    resize();window.addEventListener('resize',resize);
    let pad,ball,bricks,sc=0,lv=1,lives=3,raf,run=false;
    const PW=()=>Math.min(90,canvas.width*.3);const PH=14;
    const updLives=()=>livesEl.textContent='❤️'.repeat(Math.max(0,lives));
    const mkBricks=l=>{
      const cols=6,bw=(canvas.width-20)/cols-4,bh=18,rows=3+Math.min(l-1,4),arr=[];
      for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
        const t=l>3&&Math.random()<.15?2:l>1&&Math.random()<.2?1:0;
        const hp=[1,2,0][t];arr.push({x:10+c*(bw+4),y:45+r*(bh+5),w:bw,h:bh,hp,mhp:hp,t});
      }return arr;
    };
    const resetBall=()=>{
      const spd=3.5+lv*.5;const pw=PW();
      pad={x:canvas.width/2-pw/2,y:canvas.height-36,w:pw,h:PH};
      ball={x:canvas.width/2,y:canvas.height-65,vx:spd*(Math.random()<.5?.8:-.8),vy:-spd,r:8,launched:false};
    };
    const startLv=()=>{resetBall();bricks=mkBricks(lv);run=true;msg.style.display='none';if(raf)cancelAnimationFrame(raf);loop();};
    const startGame=()=>{sc=0;lv=1;lives=3;lvEl.textContent=1;scEl.textContent=0;updLives();startLv();};
    const loop=()=>{raf=requestAnimationFrame(()=>{update();draw();if(run)loop();});};
    const update=()=>{
      const W=canvas.width,H=canvas.height;
      if(!ball.launched){ball.x=pad.x+pad.w/2;return;}
      ball.x+=ball.vx;ball.y+=ball.vy;
      if(ball.x-ball.r<0){ball.x=ball.r;ball.vx=Math.abs(ball.vx);}
      if(ball.x+ball.r>W){ball.x=W-ball.r;ball.vx=-Math.abs(ball.vx);}
      if(ball.y-ball.r<0){ball.y=ball.r;ball.vy=Math.abs(ball.vy);}
      if(ball.y>H+20){
        lives--;updLives();if(sfx.life)sfx.life();
        if(lives<=0){die();return;}
        resetBall();ball.launched=false;return;
      }
      if(ball.y+ball.r>=pad.y&&ball.y+ball.r<=pad.y+pad.h+ball.r*2&&ball.x>=pad.x-ball.r&&ball.x<=pad.x+pad.w+ball.r){
        ball.vy=-Math.abs(ball.vy);
        ball.vx=((ball.x-(pad.x+pad.w/2))/(pad.w/2))*5;
        ball.y=pad.y-ball.r;
        if(sfx.click)sfx.click();
      }
      for(const b of bricks){
        if(b.hp===0)continue;
        if(ball.x+ball.r>b.x&&ball.x-ball.r<b.x+b.w&&ball.y+ball.r>b.y&&ball.y-ball.r<b.y+b.h){
          b.hp--;if(b.hp<=0){sc+=b.t===1?20:10;scEl.textContent=sc;if(sfx.score)sfx.score();}else if(sfx.flip)sfx.flip();
          const ol=ball.x+ball.r-b.x,or2=b.x+b.w-(ball.x-ball.r),ot=ball.y+ball.r-b.y,ob=b.y+b.h-(ball.y-ball.r);
          if(Math.min(ol,or2)<Math.min(ot,ob))ball.vx*=-1;else ball.vy*=-1;break;
        }
      }
      if(bricks.filter(b=>b.hp>0&&b.t!==2).length===0)nextLv();
    };
    const nextLv=()=>{run=false;cancelAnimationFrame(raf);lv++;if(sfx.arcade)sfx.arcade();lvEl.textContent=lv;msg.innerHTML=`<p class="game-msg-title">Level ${lv-1} Clear!</p><p class="game-msg-sub">Score: ${sc} • Lives: ${lives}</p><button class="game-msg-btn" id="bb-s">Next</button>`;msg.style.display='flex';msg.querySelector('#bb-s').addEventListener('click',startLv);};
    const die=()=>{run=false;if(sfx.die)sfx.die();msg.innerHTML=`<p class="game-msg-title">Game Over</p><p class="game-msg-sub">Score: ${sc}</p><button class="game-msg-btn" id="bb-s">Again</button>`;msg.style.display='flex';msg.querySelector('#bb-s').addEventListener('click',startGame);};
    const draw=()=>{
      const t=TH[thk],W=canvas.width,H=canvas.height;
      ctx.fillStyle=t.bg;ctx.fillRect(0,0,W,H);
      bricks.forEach(b=>{if(b.hp<=0&&b.mhp>0)return;ctx.globalAlpha=b.mhp===0?.35:b.mhp>1?(.4+.6*(b.hp/b.mhp)):1;ctx.fillStyle=[t.b1,t.b2,t.b3][b.t];ctx.beginPath();if(ctx.roundRect)ctx.roundRect(b.x,b.y,b.w,b.h,4);else ctx.rect(b.x,b.y,b.w,b.h);ctx.fill();ctx.globalAlpha=.2;ctx.fillStyle='#fff';ctx.fillRect(b.x+2,b.y+2,b.w-4,4);ctx.globalAlpha=1;});
      const pg=ctx.createLinearGradient(pad.x,0,pad.x+pad.w,0);pg.addColorStop(0,t.b1);pg.addColorStop(.5,t.pad);pg.addColorStop(1,t.b1);ctx.fillStyle=pg;ctx.beginPath();if(ctx.roundRect)ctx.roundRect(pad.x,pad.y,pad.w,pad.h,7);else ctx.rect(pad.x,pad.y,pad.w,pad.h);ctx.fill();
      if(!ball.launched){ctx.setLineDash([4,4]);ctx.strokeStyle='rgba(255,255,255,.3)';ctx.beginPath();ctx.moveTo(ball.x,ball.y);ctx.lineTo(ball.x,ball.y-40);ctx.stroke();ctx.setLineDash([]);}
      const bg2=ctx.createRadialGradient(ball.x,ball.y,0,ball.x,ball.y,ball.r);bg2.addColorStop(0,'#fff');bg2.addColorStop(1,t.pad);ctx.fillStyle=bg2;ctx.beginPath();ctx.arc(ball.x,ball.y,ball.r,0,Math.PI*2);ctx.fill();
    };
    const onMove=e=>{const rect=canvas.getBoundingClientRect();const cx=e.touches?e.touches[0].clientX:e.clientX;const x=(cx-rect.left)*(canvas.width/rect.width);pad.x=Math.max(0,Math.min(canvas.width-pad.w,x-pad.w/2));};
    const onTap=e=>{if(ball&&!ball.launched){ball.launched=true;if(sfx.click)sfx.click();}};
    canvas.addEventListener('mousemove',onMove);
    canvas.addEventListener('touchmove',e=>{e.preventDefault();onMove(e);},{passive:false});
    canvas.addEventListener('click',onTap);
    canvas.addEventListener('touchstart',e=>{onMove(e);},{passive:true});
    container.querySelector('#bb-s').addEventListener('click',startGame);
    draw();
    this._c=()=>{window.removeEventListener('resize',resize);canvas.removeEventListener('mousemove',onMove);cancelAnimationFrame(raf);run=false;};
  },
  getSettings(c){c.innerHTML=`<div class="settings-row"><span class="settings-row-label">Theme</span><div class="settings-swatches" id="bb-t"></div></div>`;const to=c.querySelector('#bb-t');Object.entries(TH).forEach(([k,v])=>{const s=document.createElement('div');s.className='swatch'+(k===thk?' active':'');s.style.background=v.b1;s.title=k;s.onclick=()=>{thk=k;to.querySelectorAll('.swatch').forEach(x=>x.classList.remove('active'));s.classList.add('active');};to.appendChild(s);});},
  destroy(){if(this._c)this._c();}
};
})();
