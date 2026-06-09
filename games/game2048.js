'use strict';
(()=>{
const PALETTE={
  dark:{bg:'#0a0407',grid:'#1a0810',c0:'#1a0810',c2:'#2a0d14',c4:'#3a1020',c8:'#6b1a2a',c16:'#8b1a2a',c32:'#a01a2a',c64:'#b52238',c128:'#c9a96e',c256:'#d4b87a',c512:'#dfc886',c1024:'#ead896',c2048:'#f5e8a6',txt:'#fff'},
  ocean:{bg:'#020a14',grid:'#0a1a2a',c0:'#0a1a2a',c2:'#0a2a3a',c4:'#0a3a4a',c8:'#1a506a',c16:'#1a608a',c32:'#1a70aa',c64:'#2a80c0',c128:'#40a0d0',c256:'#60b8e0',c512:'#80d0f0',c1024:'#a0e4ff',c2048:'#c0f0ff',txt:'#fff'},
  forest:{bg:'#020a04',grid:'#0a1a0a',c0:'#0a1a0a',c2:'#0a2a0a',c4:'#1a3a10',c8:'#1a5020',c16:'#2a6a2a',c32:'#3a7a2a',c64:'#4a8a30',c128:'#60a040',c256:'#80b850',c512:'#a0d060',c1024:'#c0e880',c2048:'#e0ffa0',txt:'#fff'},
};
let palKey='dark';

window.GameRegistry=window.GameRegistry||{};
window.GameRegistry['2048']={
  mount(container){
    container.innerHTML=`
      <div class="game-ui">
        <div class="game-score-bar">
          <span class="game-score-label">Score</span>
          <span class="game-score-val" id="g2-score">0</span>
          <span class="game-score-label">Best</span>
          <span class="game-score-val" id="g2-best">0</span>
        </div>
        <div class="game-canvas-wrap">
          <canvas id="g2-canvas" class="game-canvas"></canvas>
          <div class="game-msg" id="g2-msg">
            <p class="game-msg-title">2048</p>
            <p class="game-msg-sub">Swipe to merge tiles</p>
            <button class="game-msg-btn" id="g2-start">Play</button>
          </div>
        </div>
      </div>`;

    const canvas=container.querySelector('#g2-canvas');
    const wrap=canvas.parentElement;
    const ctx=canvas.getContext('2d');
    const scoreEl=container.querySelector('#g2-score');
    const bestEl=container.querySelector('#g2-best');
    const msg=container.querySelector('#g2-msg');
    const sfx=window.SFX||{};

    const SIZE=4;
    let CELL,PAD,W;
    function resize(){
      const sz=Math.min(wrap.clientWidth||320,wrap.clientHeight||320);
      PAD=Math.floor(sz*0.025)+4;
      CELL=Math.floor((sz-PAD*(SIZE+1))/SIZE);
      W=CELL*SIZE+PAD*(SIZE+1);
      canvas.width=W;canvas.height=W;
    }
    resize();window.addEventListener('resize',()=>{resize();if(grid)draw();});

    let grid,score,best=0;
    let tx=0,ty=0;

    function newGrid(){return Array.from({length:SIZE},()=>Array(SIZE).fill(0));}
    function addRandom(g){const e=[];for(let r=0;r<SIZE;r++)for(let c=0;c<SIZE;c++)if(!g[r][c])e.push([r,c]);if(!e.length)return;const[r,c]=e[Math.floor(Math.random()*e.length)];g[r][c]=Math.random()<0.85?2:4;}

    function startGame(){grid=newGrid();score=0;addRandom(grid);addRandom(grid);running=true;scoreEl.textContent='0';msg.style.display='none';draw();}

    let running=false;

    function slide(row){let a=row.filter(v=>v),pts=0;for(let i=0;i<a.length-1;i++)if(a[i]===a[i+1]){a[i]*=2;pts+=a[i];a.splice(i+1,1);}while(a.length<SIZE)a.push(0);return{row:a,pts};}

    function move(dir){
      if(!running)return;let moved=false,pts=0;const g=grid.map(r=>[...r]);
      if(dir==='left'){for(let r=0;r<SIZE;r++){const{row,pts:p}=slide(g[r]);if(row.join()!==g[r].join())moved=true;g[r]=row;pts+=p;}}
      else if(dir==='right'){for(let r=0;r<SIZE;r++){const{row,pts:p}=slide([...g[r]].reverse());const rv=row.reverse();if(rv.join()!==g[r].join())moved=true;g[r]=rv;pts+=p;}}
      else if(dir==='up'){for(let c=0;c<SIZE;c++){const col=g.map(r=>r[c]);const{row,pts:p}=slide(col);if(row.join()!==col.join())moved=true;for(let r=0;r<SIZE;r++)g[r][c]=row[r];pts+=p;}}
      else if(dir==='down'){for(let c=0;c<SIZE;c++){const col=g.map(r=>r[c]).reverse();const{row,pts:p}=slide(col);const rv=row.reverse();const orig=g.map(r=>r[c]);if(rv.join()!==orig.join())moved=true;for(let r=0;r<SIZE;r++)g[r][c]=rv[r];pts+=p;}}
      if(!moved)return;grid=g;score+=pts;if(score>best){best=score;bestEl.textContent=best;}scoreEl.textContent=score;addRandom(grid);if(sfx.flip)sfx.flip();if(pts>0&&sfx.match)sfx.match();draw();
      if(isGameOver()){setTimeout(()=>{running=false;if(sfx.die)sfx.die();msg.innerHTML=`<p class="game-msg-title">Game Over</p><p class="game-msg-sub">Score: ${score}</p><button class="game-msg-btn" id="g2-start">Again</button>`;msg.style.display='flex';msg.querySelector('#g2-start').addEventListener('click',startGame);},300);}
    }

    function isGameOver(){for(let r=0;r<SIZE;r++)for(let c=0;c<SIZE;c++){if(!grid[r][c])return false;if(c<SIZE-1&&grid[r][c]===grid[r][c+1])return false;if(r<SIZE-1&&grid[r][c]===grid[r+1][c])return false;}return true;}

    function getColor(val){const p=PALETTE[palKey];return p['c'+Math.min(val,2048)]||p.c2048;}

    function draw(){
      const p=PALETTE[palKey];
      ctx.fillStyle=p.grid;ctx.beginPath();if(ctx.roundRect)ctx.roundRect(0,0,W,W,10);else ctx.rect(0,0,W,W);ctx.fill();
      for(let r=0;r<SIZE;r++)for(let c=0;c<SIZE;c++){
        const x=PAD+c*(CELL+PAD),y=PAD+r*(CELL+PAD),val=grid[r][c];
        ctx.fillStyle=getColor(val);ctx.beginPath();if(ctx.roundRect)ctx.roundRect(x,y,CELL,CELL,6);else ctx.rect(x,y,CELL,CELL);ctx.fill();
        if(val){ctx.fillStyle=p.txt;const fs=val<100?Math.floor(CELL*0.38):val<1000?Math.floor(CELL*0.3):Math.floor(CELL*0.22);ctx.font=`700 ${fs}px 'DM Sans',sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(val,x+CELL/2,y+CELL/2);}
      }
    }

    const onKey=e=>{const m={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down'};if(m[e.key]){e.preventDefault();move(m[e.key]);}};
    const onTS=e=>{tx=e.touches[0].clientX;ty=e.touches[0].clientY;};
    const onTE=e=>{const dx=e.changedTouches[0].clientX-tx,dy=e.changedTouches[0].clientY-ty;if(Math.abs(dx)<10&&Math.abs(dy)<10)return;if(Math.abs(dx)>Math.abs(dy))move(dx>0?'right':'left');else move(dy>0?'down':'up');};
    document.addEventListener('keydown',onKey);
    canvas.addEventListener('touchstart',onTS,{passive:true});
    canvas.addEventListener('touchend',onTE,{passive:true});
    container.querySelector('#g2-start').addEventListener('click',startGame);
    draw();
    this._cleanup=()=>{window.removeEventListener('resize',resize);document.removeEventListener('keydown',onKey);canvas.removeEventListener('touchstart',onTS);canvas.removeEventListener('touchend',onTE);};
  },
  getSettings(container){
    container.innerHTML=`<div class="settings-row"><span class="settings-row-label">Colour Palette</span><div class="settings-swatches" id="g2-pal-opts"></div></div>`;
    const po=container.querySelector('#g2-pal-opts');
    Object.entries(PALETTE).forEach(([k,v])=>{const s=document.createElement('div');s.className='swatch'+(k===palKey?' active':'');s.style.background=v.c64;s.title=k;s.addEventListener('click',()=>{palKey=k;po.querySelectorAll('.swatch').forEach(x=>x.classList.remove('active'));s.classList.add('active');});po.appendChild(s);});
  },
  destroy(){if(this._cleanup)this._cleanup();}
};
})();
