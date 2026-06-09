'use strict';
(()=>{
const SKINS={
  classic:{head:'#8b1a2a',body:'#6b1a2a',food:'#c9a96e'},
  rose:   {head:'#c9507a',body:'#a03060',food:'#ffd166'},
  obsidian:{head:'#4a4a6a',body:'#2a2a4a',food:'#8b1a2a'},
  gold:   {head:'#c9a96e',body:'#a07840',food:'#8b1a2a'},
};
const FOODS=['🍎','🍓','🍇','💕','⭐'];
let skin='classic', foodEmoji='🍎';

window.GameRegistry=window.GameRegistry||{};
window.GameRegistry['snake']={
  mount(container){
    const sfx=window.SFX||{};
    container.innerHTML=`
      <div class="game-ui">
        <div class="game-score-bar">
          <span class="game-score-label">Score</span>
          <span class="game-score-val" id="sk-score">0</span>
          <span class="game-score-label">Best</span>
          <span class="game-score-val" id="sk-best">0</span>
        </div>
        <div class="snake-skin-bar">
          ${Object.keys(SKINS).map(k=>`<button class="skin-btn${k===skin?' active':''}" data-skin="${k}">${k}</button>`).join('')}
          ${FOODS.map(f=>`<button class="skin-btn${f===foodEmoji?' active':''}" data-food="${f}">${f}</button>`).join('')}
        </div>
        <canvas id="sk-canvas" class="game-canvas"></canvas>
        <div class="snake-controls">
          <div class="snake-row"><button class="dpad-btn" id="sk-up">▲</button></div>
          <div class="snake-row">
            <button class="dpad-btn" id="sk-left">◀</button>
            <button class="dpad-btn" id="sk-down">▼</button>
            <button class="dpad-btn" id="sk-right">▶</button>
          </div>
        </div>
        <div class="game-msg" id="sk-msg">
          <p class="game-msg-title">Snake</p>
          <p class="game-msg-sub">Swipe or use arrows</p>
          <button class="game-msg-btn" id="sk-start">Play</button>
        </div>
      </div>`;

    const canvas=container.querySelector('#sk-canvas');
    const ctx=canvas.getContext('2d');
    const scoreEl=container.querySelector('#sk-score');
    const bestEl=container.querySelector('#sk-best');
    const msg=container.querySelector('#sk-msg');

    const CELL=20, COLS=16, ROWS=20;
    canvas.width=COLS*CELL; canvas.height=ROWS*CELL;

    let snake,dir,next,food,score,best=0,raf,running=false,dead=false;
    let touchX=0,touchY=0;

    function rndFood(){
      let pos;
      do{ pos={x:Math.floor(Math.random()*COLS),y:Math.floor(Math.random()*ROWS)}; }
      while(snake.some(s=>s.x===pos.x&&s.y===pos.y));
      return pos;
    }

    function startGame(){
      snake=[{x:8,y:10},{x:7,y:10},{x:6,y:10}];
      dir={x:1,y:0}; next={x:1,y:0};
      food=rndFood(); score=0; dead=false; running=true;
      scoreEl.textContent='0';
      msg.style.display='none';
      if(raf) cancelAnimationFrame(raf);
      loop();
    }

    function loop(){
      raf=setTimeout(()=>{
        requestAnimationFrame(()=>{ update(); draw(); if(running) loop(); });
      },130);
    }

    function update(){
      dir={x:next.x,y:next.y};
      const head={x:(snake[0].x+dir.x+COLS)%COLS, y:(snake[0].y+dir.y+ROWS)%ROWS};
      if(snake.some(s=>s.x===head.x&&s.y===head.y)){ die(); return; }
      snake.unshift(head);
      if(head.x===food.x&&head.y===food.y){
        score++; scoreEl.textContent=score;
        if(score>best){ best=score; bestEl.textContent=best; }
        food=rndFood();
        if(sfx.score) sfx.score();
      } else { snake.pop(); }
    }

    function die(){
      running=false; dead=true;
      if(sfx.die) sfx.die();
      msg.innerHTML=`<p class="game-msg-title">Game Over</p><p class="game-msg-sub">Score: ${score}</p><button class="game-msg-btn" id="sk-start">Try Again</button>`;
      msg.style.display='flex';
      msg.querySelector('#sk-start').addEventListener('click',startGame);
    }

    function draw(){
      const s=SKINS[skin];
      ctx.fillStyle='#0a0a0a'; ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.strokeStyle='#1a0a0f'; ctx.lineWidth=0.5;
      for(let x=0;x<COLS;x++) for(let y=0;y<ROWS;y++){
        ctx.strokeRect(x*CELL,y*CELL,CELL,CELL);
      }
      snake.forEach((seg,i)=>{
        ctx.fillStyle=i===0?s.head:s.body;
        ctx.beginPath();
        ctx.roundRect?ctx.roundRect(seg.x*CELL+1,seg.y*CELL+1,CELL-2,CELL-2,4):ctx.rect(seg.x*CELL+1,seg.y*CELL+1,CELL-2,CELL-2);
        ctx.fill();
      });
      ctx.font=`${CELL-2}px serif`;
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(foodEmoji, food.x*CELL+CELL/2, food.y*CELL+CELL/2);
    }

    function setDir(x,y){
      if(dir.x===-x&&dir.y===-y) return;
      next={x,y};
    }

    container.querySelector('#sk-start').addEventListener('click',startGame);
    container.querySelector('#sk-up').addEventListener('click',()=>setDir(0,-1));
    container.querySelector('#sk-down').addEventListener('click',()=>setDir(0,1));
    container.querySelector('#sk-left').addEventListener('click',()=>setDir(-1,0));
    container.querySelector('#sk-right').addEventListener('click',()=>setDir(1,0));

    container.querySelectorAll('[data-skin]').forEach(btn=>{
      btn.addEventListener('click',()=>{
        skin=btn.dataset.skin;
        container.querySelectorAll('[data-skin]').forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
      });
    });
    container.querySelectorAll('[data-food]').forEach(btn=>{
      btn.addEventListener('click',()=>{
        foodEmoji=btn.dataset.food;
        container.querySelectorAll('[data-food]').forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    document.addEventListener('keydown',onKey);
    canvas.addEventListener('touchstart',onTouchStart,{passive:true});
    canvas.addEventListener('touchend',onTouchEnd,{passive:true});

    function onKey(e){
      if(e.key==='ArrowUp')    setDir(0,-1);
      if(e.key==='ArrowDown')  setDir(0,1);
      if(e.key==='ArrowLeft')  setDir(-1,0);
      if(e.key==='ArrowRight') setDir(1,0);
    }
    function onTouchStart(e){ touchX=e.touches[0].clientX; touchY=e.touches[0].clientY; }
    function onTouchEnd(e){
      const dx=e.changedTouches[0].clientX-touchX;
      const dy=e.changedTouches[0].clientY-touchY;
      if(Math.abs(dx)>Math.abs(dy)){ dx>0?setDir(1,0):setDir(-1,0); }
      else { dy>0?setDir(0,1):setDir(0,-1); }
    }

    this._cleanup=()=>{
      document.removeEventListener('keydown',onKey);
      canvas.removeEventListener('touchstart',onTouchStart);
      canvas.removeEventListener('touchend',onTouchEnd);
      clearTimeout(raf); running=false;
    };
    draw();
  },
  destroy(){ if(this._cleanup) this._cleanup(); }
};
})();
