'use strict';
(()=>{
window.GameRegistry=window.GameRegistry||{};
window.GameRegistry['memory']={
  mount(container){
    const sfx=window.SFX||{};
    container.innerHTML=`
      <div class="game-ui">
        <div class="game-score-bar">
          <span class="game-score-label">Pairs</span>
          <span class="game-score-val" id="mm-pairs">0</span>
          <span class="game-score-label">Time</span>
          <span class="game-score-val" id="mm-time">60</span>
        </div>
        <canvas id="mm-canvas" class="game-canvas"></canvas>
        <div class="game-msg" id="mm-msg">
          <p class="game-msg-title">Memory Match</p>
          <p class="game-msg-sub">Find all pairs before time runs out</p>
          <button class="game-msg-btn" id="mm-start">Play</button>
        </div>
      </div>`;

    const canvas=container.querySelector('#mm-canvas');
    const ctx=canvas.getContext('2d');
    const pairsEl=container.querySelector('#mm-pairs');
    const timeEl=container.querySelector('#mm-time');
    const msg=container.querySelector('#mm-msg');

    const COLS=4, ROWS=4, TOTAL=COLS*ROWS;
    const EMOJIS=['💕','🎂','🌹','⭐','🎁','💎','🌙','🦋'];
    const CELL=72, PAD=8;
    const W=COLS*(CELL+PAD)+PAD;
    const H=ROWS*(CELL+PAD)+PAD;
    canvas.width=W; canvas.height=H;

    let cards,flipped,matched,timeLeft,lastTick,raf,running=false,locked=false;

    function startGame(){
      const deck=[...EMOJIS,...EMOJIS].sort(()=>Math.random()-0.5);
      cards=deck.map((emoji,i)=>({
        emoji, matched:false, flipped:false,
        x:PAD+(i%COLS)*(CELL+PAD),
        y:PAD+Math.floor(i/COLS)*(CELL+PAD),
        flip:0
      }));
      flipped=[]; matched=0; timeLeft=60;
      running=true; locked=false; lastTick=Date.now();
      pairsEl.textContent='0'; timeEl.textContent='60';
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
      if(timeLeft<=0&&running){ endGame(false); }
      cards.forEach(c=>{
        if(c.flipped&&c.flip<1) c.flip=Math.min(1,c.flip+0.12);
        if(!c.flipped&&c.flip>0) c.flip=Math.max(0,c.flip-0.12);
      });
    }

    function endGame(win){
      running=false;
      if(win&&sfx.arcade) sfx.arcade();
      if(!win&&sfx.die) sfx.die();
      const title=win?'You Win! 💕':'Time\'s Up!';
      msg.innerHTML=`<p class="game-msg-title">${title}</p><p class="game-msg-sub">Pairs: ${matched}</p><button class="game-msg-btn" id="mm-start">Play Again</button>`;
      msg.style.display='flex';
      msg.querySelector('#mm-start').addEventListener('click',startGame);
    }

    function draw(){
      ctx.fillStyle='#0a0407'; ctx.fillRect(0,0,W,H);
      cards.forEach(c=>{
        const cx=c.x+CELL/2, cy=c.y+CELL/2;
        const scale=Math.abs(Math.cos(c.flip*Math.PI));
        ctx.save();
        ctx.translate(cx,cy); ctx.scale(scale,1); ctx.translate(-cx,-cy);
        if(c.flip<0.5){
          ctx.fillStyle=c.matched?'#1a3010':'#1a0810';
          ctx.strokeStyle=c.matched?'#2a6b1a':'#4a2a28';
          ctx.lineWidth=2;
          ctx.beginPath();
          if(ctx.roundRect) ctx.roundRect(c.x,c.y,CELL,CELL,8);
          else ctx.rect(c.x,c.y,CELL,CELL);
          ctx.fill(); ctx.stroke();
          ctx.fillStyle='#4a2a28';
          ctx.font='700 22px serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
          ctx.fillText('?',cx,cy);
        } else {
          ctx.fillStyle=c.matched?'#1a3010':'#2a0d14';
          ctx.strokeStyle=c.matched?'#4a9b2a':'#8b1a2a';
          ctx.lineWidth=2;
          ctx.beginPath();
          if(ctx.roundRect) ctx.roundRect(c.x,c.y,CELL,CELL,8);
          else ctx.rect(c.x,c.y,CELL,CELL);
          ctx.fill(); ctx.stroke();
          ctx.font=`${CELL*0.45}px serif`;
          ctx.textAlign='center'; ctx.textBaseline='middle';
          ctx.fillText(c.emoji,cx,cy);
        }
        ctx.restore();
      });
    }

    function onTap(e){
      if(!running||locked) return;
      const rect=canvas.getBoundingClientRect();
      const cx=e.touches?e.touches[0].clientX:e.clientX;
      const cy=e.touches?e.touches[0].clientY:e.clientY;
      const x=(cx-rect.left)*(W/rect.width);
      const y=(cy-rect.top)*(H/rect.height);
      const card=cards.find(c=>!c.flipped&&!c.matched&&x>c.x&&x<c.x+CELL&&y>c.y&&y<c.y+CELL);
      if(!card) return;
      card.flipped=true; flipped.push(card);
      if(sfx.flip) sfx.flip();
      if(flipped.length===2){
        locked=true;
        setTimeout(()=>{
          if(flipped[0].emoji===flipped[1].emoji){
            flipped[0].matched=true; flipped[1].matched=true;
            matched++;
            pairsEl.textContent=matched;
            if(sfx.match) sfx.match();
            if(matched===EMOJIS.length) endGame(true);
          } else {
            flipped[0].flipped=false; flipped[1].flipped=false;
          }
          flipped=[]; locked=false;
        },900);
      }
    }

    canvas.addEventListener('click',onTap);
    canvas.addEventListener('touchstart',e=>{ e.preventDefault(); onTap(e); },{passive:false});
    container.querySelector('#mm-start').addEventListener('click',startGame);
    draw();
    this._cleanup=()=>{
      canvas.removeEventListener('click',onTap);
      cancelAnimationFrame(raf); running=false;
    };
  },
  destroy(){ if(this._cleanup) this._cleanup(); }
};
})();
