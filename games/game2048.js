'use strict';
(()=>{
window.GameRegistry=window.GameRegistry||{};
window.GameRegistry['2048']={
  mount(container){
    const sfx=window.SFX||{};
    container.innerHTML=`
      <div class="game-ui">
        <div class="game-score-bar">
          <span class="game-score-label">Score</span>
          <span class="game-score-val" id="g2-score">0</span>
          <span class="game-score-label">Best</span>
          <span class="game-score-val" id="g2-best">0</span>
        </div>
        <canvas id="g2-canvas" class="game-canvas"></canvas>
        <div class="game-msg" id="g2-msg">
          <p class="game-msg-title">2048</p>
          <p class="game-msg-sub">Swipe to merge tiles</p>
          <button class="game-msg-btn" id="g2-start">Play</button>
        </div>
      </div>`;

    const canvas=container.querySelector('#g2-canvas');
    const ctx=canvas.getContext('2d');
    const scoreEl=container.querySelector('#g2-score');
    const bestEl=container.querySelector('#g2-best');
    const msg=container.querySelector('#g2-msg');

    const SIZE=4, CELL=80, PAD=8;
    const W=SIZE*CELL+(SIZE+1)*PAD;
    canvas.width=W; canvas.height=W;

    let grid, score, best=0, running=false;
    let touchX=0, touchY=0;

    const COLORS={
      0:'#1a0810',2:'#2a0d14',4:'#3a1020',8:'#6b1a2a',
      16:'#8b1a2a',32:'#a01a2a',64:'#b52238',
      128:'#c9a96e',256:'#d4b87a',512:'#dfc886',
      1024:'#ead896',2048:'#f5e8a6',
    };

    function newGrid(){ return Array.from({length:SIZE},()=>Array(SIZE).fill(0)); }

    function addRandom(g){
      const empty=[];
      for(let r=0;r<SIZE;r++) for(let c=0;c<SIZE;c++) if(!g[r][c]) empty.push([r,c]);
      if(!empty.length) return;
      const [r,c]=empty[Math.floor(Math.random()*empty.length)];
      g[r][c]=Math.random()<0.85?2:4;
    }

    function startGame(){
      grid=newGrid(); score=0;
      addRandom(grid); addRandom(grid);
      running=true; scoreEl.textContent='0';
      msg.style.display='none';
      draw();
    }

    function slide(row){
      let arr=row.filter(v=>v);
      let pts=0;
      for(let i=0;i<arr.length-1;i++){
        if(arr[i]===arr[i+1]){ arr[i]*=2; pts+=arr[i]; arr.splice(i+1,1); }
      }
      while(arr.length<SIZE) arr.push(0);
      return{row:arr,pts};
    }

    function move(dir){
      if(!running) return;
      let moved=false;
      let pts=0;
      const g=grid.map(r=>[...r]);
      if(dir==='left'){
        for(let r=0;r<SIZE;r++){
          const {row,pts:p}=slide(g[r]);
          if(row.join()!==g[r].join()) moved=true;
          g[r]=row; pts+=p;
        }
      } else if(dir==='right'){
        for(let r=0;r<SIZE;r++){
          const {row,pts:p}=slide([...g[r]].reverse());
          const rev=row.reverse();
          if(rev.join()!==g[r].join()) moved=true;
          g[r]=rev; pts+=p;
        }
      } else if(dir==='up'){
        for(let c=0;c<SIZE;c++){
          const col=g.map(r=>r[c]);
          const {row,pts:p}=slide(col);
          if(row.join()!==col.join()) moved=true;
          for(let r=0;r<SIZE;r++) g[r][c]=row[r];
          pts+=p;
        }
      } else if(dir==='down'){
        for(let c=0;c<SIZE;c++){
          const col=g.map(r=>r[c]).reverse();
          const {row,pts:p}=slide(col);
          const rev=row.reverse();
          const orig=g.map(r=>r[c]);
          if(rev.join()!==orig.join()) moved=true;
          for(let r=0;r<SIZE;r++) g[r][c]=rev[r];
          pts+=p;
        }
      }
      if(!moved) return;
      grid=g; score+=pts;
      if(score>best){ best=score; bestEl.textContent=best; }
      scoreEl.textContent=score;
      addRandom(grid);
      if(sfx.flip) sfx.flip();
      if(pts>0&&sfx.match) sfx.match();
      draw();
      if(isGameOver()){ showOver(); }
    }

    function isGameOver(){
      for(let r=0;r<SIZE;r++) for(let c=0;c<SIZE;c++){
        if(!grid[r][c]) return false;
        if(c<SIZE-1&&grid[r][c]===grid[r][c+1]) return false;
        if(r<SIZE-1&&grid[r][c]===grid[r+1][c]) return false;
      }
      return true;
    }

    function showOver(){
      running=false;
      if(sfx.die) sfx.die();
      msg.innerHTML=`<p class="game-msg-title">Game Over</p><p class="game-msg-sub">Score: ${score}</p><button class="game-msg-btn" id="g2-start">Try Again</button>`;
      msg.style.display='flex';
      msg.querySelector('#g2-start').addEventListener('click',startGame);
    }

    function draw(){
      ctx.fillStyle='#0a0407'; ctx.fillRect(0,0,W,W);
      ctx.fillStyle='#1a0810';
      if(ctx.roundRect) ctx.roundRect(0,0,W,W,8); else ctx.rect(0,0,W,W);
      ctx.fill();
      for(let r=0;r<SIZE;r++) for(let c=0;c<SIZE;c++){
        const x=PAD+c*(CELL+PAD), y=PAD+r*(CELL+PAD);
        const val=grid[r][c];
        ctx.fillStyle=COLORS[Math.min(val,2048)]||'#f5e8a6';
        ctx.beginPath();
        if(ctx.roundRect) ctx.roundRect(x,y,CELL,CELL,6);
        else ctx.rect(x,y,CELL,CELL);
        ctx.fill();
        if(val){
          ctx.fillStyle=val<=4?'#c9a96e':'#ffffff';
          const fs=val<100?28:val<1000?22:16;
          ctx.font=`700 ${fs}px 'DM Sans',sans-serif`;
          ctx.textAlign='center'; ctx.textBaseline='middle';
          ctx.fillText(val,x+CELL/2,y+CELL/2);
        }
      }
    }

    const onKey=e=>{
      const map={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down'};
      if(map[e.key]){ e.preventDefault(); move(map[e.key]); }
    };
    const onTS=e=>{ touchX=e.touches[0].clientX; touchY=e.touches[0].clientY; };
    const onTE=e=>{
      const dx=e.changedTouches[0].clientX-touchX;
      const dy=e.changedTouches[0].clientY-touchY;
      if(Math.abs(dx)<10&&Math.abs(dy)<10) return;
      if(Math.abs(dx)>Math.abs(dy)) move(dx>0?'right':'left');
      else move(dy>0?'down':'up');
    };

    document.addEventListener('keydown',onKey);
    canvas.addEventListener('touchstart',onTS,{passive:true});
    canvas.addEventListener('touchend',onTE,{passive:true});
    container.querySelector('#g2-start').addEventListener('click',startGame);
    draw();
    this._cleanup=()=>{
      document.removeEventListener('keydown',onKey);
      canvas.removeEventListener('touchstart',onTS);
      canvas.removeEventListener('touchend',onTE);
    };
  },
  destroy(){ if(this._cleanup) this._cleanup(); }
};
})();
