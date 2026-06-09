'use strict';
(()=>{
const SKINS={
  crimson:{head:'#b52238',body:'#6b1a2a'},
  gold:{head:'#c9a96e',body:'#a07840'},
  midnight:{head:'#4a4a8a',body:'#2a2a5a'},
  rose:{head:'#d4607a',body:'#a03060'},
  forest:{head:'#2a7a3a',body:'#1a4a22'},
};
const FOODS=['🍎','🍓','💕','⭐','🎂'];
const BG_COLORS={'#0a0407':'Dark','#0a0a1a':'Navy','#0a1a0a':'Forest','#1a0a00':'Amber'};
let skinKey='crimson',foodEmoji='🍎',bgColor='#0a0407';

window.GameRegistry=window.GameRegistry||{};
window.GameRegistry['snake']={
  mount(container){
    container.innerHTML=`
      <div class="game-ui">
        <div class="game-score-bar">
          <span class="game-score-label">Score</span>
          <span class="game-score-val" id="sk-score">0</span>
          <span class="game-score-label">Best</span>
          <span class="game-score-val" id="sk-best">0</span>
        </div>
        <div class="game-canvas-wrap" id="sk-wrap">
          <canvas id="sk-canvas" class="game-canvas"></canvas>
          <div class="game-msg" id="sk-msg">
            <p class="game-msg-title">Snake</p>
            <p class="game-msg-sub">Swipe or use D-pad</p>
            <button class="game-msg-btn" id="sk-start">Play</button>
          </div>
        </div>
        <div class="snake-dpad">
          <div class="dpad-row"><button class="dpad-btn" id="sk-up">▲</button></div>
          <div class="dpad-row">
            <button class="dpad-btn" id="sk-left">◀</button>
            <button class="dpad-btn" id="sk-down">▼</button>
            <button class="dpad-btn" id="sk-right">▶</button>
          </div>
        </div>
      </div>`;

    const canvas=container.querySelector('#sk-canvas');
    const wrap=container.querySelector('#sk-wrap');
    const ctx=canvas.getContext('2d');
    const scoreEl=container.querySelector('#sk-score');
    const bestEl=container.querySelector('#sk-best');
    const msg=container.querySelector('#sk-msg');
    const sfx=window.SFX||{};

    const CELL=22,COLS=15,ROWS=18;
    canvas.width=COLS*CELL;canvas.height=ROWS*CELL;

    let snake,dir,next,food,score,best=0,timer,running=false;
    let tx=0,ty=0;

    function rndFood(){let p;do{p={x:Math.floor(Math.random()*COLS),y:Math.floor(Math.random()*ROWS)};}while(snake.some(s=>s.x===p.x&&s.y===p.y));return p;}

    function startGame(){
      snake=[{x:7,y:9},{x:6,y:9},{x:5,y:9}];
      dir={x:1,y:0};next={x:1,y:0};food=rndFood();score=0;running=true;
      scoreEl.textContent='0';msg.style.display='none';
      clearInterval(timer);timer=setInterval(tick,130);
    }

    function tick(){
      dir={x:next.x,y:next.y};
      const h={x:(snake[0].x+dir.x+COLS)%COLS,y:(snake[0].y+dir.y+ROWS)%ROWS};
      if(snake.some(s=>s.x===h.x&&s.y===h.y)){die();return;}
      snake.unshift(h);
      if(h.x===food.x&&h.y===food.y){score++;scoreEl.textContent=score;if(score>best){best=score;bestEl.textContent=best;}food=rndFood();if(sfx.score)sfx.score();}
      else snake.pop();
      draw();
    }

    function die(){clearInterval(timer);running=false;if(sfx.die)sfx.die();msg.innerHTML=`<p class="game-msg-title">Game Over</p><p class="game-msg-sub">Score: ${score}</p><button class="game-msg-btn" id="sk-start">Again</button>`;msg.style.display='flex';msg.querySelector('#sk-start').addEventListener('click',startGame);}

    function draw(){
      const s=SKINS[skinKey];
      ctx.fillStyle=bgColor;ctx.fillRect(0,0,canvas.width,canvas.height);
      snake.forEach((seg,i)=>{
        ctx.fillStyle=i===0?s.head:s.body;
        ctx.beginPath();
        if(ctx.roundRect)ctx.roundRect(seg.x*CELL+1,seg.y*CELL+1,CELL-2,CELL-2,5);
        else ctx.rect(seg.x*CELL+1,seg.y*CELL+1,CELL-2,CELL-2);
        ctx.fill();
      });
      ctx.font=`${CELL-3}px serif`;ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillText(foodEmoji,food.x*CELL+CELL/2,food.y*CELL+CELL/2);
    }

    function setDir(x,y){if(dir.x===-x&&dir.y===-y)return;next={x,y};}

    container.querySelector('#sk-start').addEventListener('click',startGame);
    container.querySelector('#sk-up').addEventListener('click',()=>setDir(0,-1));
    container.querySelector('#sk-down').addEventListener('click',()=>setDir(0,1));
    container.querySelector('#sk-left').addEventListener('click',()=>setDir(-1,0));
    container.querySelector('#sk-right').addEventListener('click',()=>setDir(1,0));

    const onKey=e=>{if(e.key==='ArrowUp')setDir(0,-1);if(e.key==='ArrowDown')setDir(0,1);if(e.key==='ArrowLeft')setDir(-1,0);if(e.key==='ArrowRight')setDir(1,0);};
    document.addEventListener('keydown',onKey);
    canvas.addEventListener('touchstart',e=>{tx=e.touches[0].clientX;ty=e.touches[0].clientY;},{passive:true});
    canvas.addEventListener('touchend',e=>{const dx=e.changedTouches[0].clientX-tx,dy=e.changedTouches[0].clientY-ty;if(Math.abs(dx)>Math.abs(dy)){dx>0?setDir(1,0):setDir(-1,0);}else{dy>0?setDir(0,1):setDir(0,-1);}},{passive:true});

    draw();
    this._cleanup=()=>{clearInterval(timer);document.removeEventListener('keydown',onKey);running=false;};
  },
  getSettings(container){
    container.innerHTML=`
      <div class="settings-row"><span class="settings-row-label">Snake Colour</span><div class="settings-swatches" id="sk-skin-opts"></div></div>
      <div class="settings-row"><span class="settings-row-label">Food</span><div class="settings-btns" id="sk-food-opts"></div></div>
      <div class="settings-row"><span class="settings-row-label">Background</span><div class="settings-swatches" id="sk-bg-opts"></div></div>`;
    const so=container.querySelector('#sk-skin-opts');
    Object.entries(SKINS).forEach(([k,v])=>{const s=document.createElement('div');s.className='swatch'+(k===skinKey?' active':'');s.style.background=v.head;s.title=k;s.addEventListener('click',()=>{skinKey=k;so.querySelectorAll('.swatch').forEach(x=>x.classList.remove('active'));s.classList.add('active');});so.appendChild(s);});
    const fo=container.querySelector('#sk-food-opts');
    FOODS.forEach(f=>{const b=document.createElement('button');b.className='settings-opt'+(f===foodEmoji?' active':'');b.textContent=f;b.addEventListener('click',()=>{foodEmoji=f;fo.querySelectorAll('.settings-opt').forEach(x=>x.classList.remove('active'));b.classList.add('active');});fo.appendChild(b);});
    const bo=container.querySelector('#sk-bg-opts');
    Object.entries(BG_COLORS).forEach(([hex,name])=>{const s=document.createElement('div');s.className='swatch'+(hex===bgColor?' active':'');s.style.background=hex;s.title=name;s.addEventListener('click',()=>{bgColor=hex;bo.querySelectorAll('.swatch').forEach(x=>x.classList.remove('active'));s.classList.add('active');});bo.appendChild(s);});
  },
  destroy(){if(this._cleanup)this._cleanup();}
};
})();
