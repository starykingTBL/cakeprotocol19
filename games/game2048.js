'use strict';
(()=>{
const PAL={
  dark:{bg:'#1a0810',grid:'#2a0d14',c0:'#2a0d14',c2:'#3a1020',c4:'#4a1828',c8:'#6b1a2a',c16:'#8b1a2a',c32:'#a01a2a',c64:'#b52238',c128:'#c9a96e',c256:'#d4b87a',c512:'#dfc886',c1024:'#ead896',c2048:'#f5e8a6',tx:'#fff'},
  ocean:{bg:'#020a14',grid:'#0a1a2a',c0:'#0a1a2a',c2:'#0a2a3a',c4:'#0a3a4a',c8:'#1a506a',c16:'#1a608a',c32:'#1a70aa',c64:'#2a80c0',c128:'#40a0d0',c256:'#60b8e0',c512:'#80d0f0',c1024:'#a0e4ff',c2048:'#c0f0ff',tx:'#fff'},
  forest:{bg:'#020a04',grid:'#0a1a0a',c0:'#0a1a0a',c2:'#0a2a0a',c4:'#1a3a10',c8:'#1a5020',c16:'#2a6a2a',c32:'#3a7a2a',c64:'#4a8a30',c128:'#60a040',c256:'#80b850',c512:'#a0d060',c1024:'#c0e880',c2048:'#e0ffa0',tx:'#fff'},
};
let pk='dark';
window.GameRegistry=window.GameRegistry||{};
window.GameRegistry['2048']={
  mount(container){
    container.innerHTML=`<div class="game-ui"><div class="game-score-bar"><span class="game-score-label">Score</span><span class="game-score-val" id="g2-sc">0</span><span class="game-score-label">Best</span><span class="game-score-val" id="g2-bst">0</span></div><div class="game-canvas-wrap"><canvas id="g2-c" class="game-canvas"></canvas><div class="game-msg" id="g2-msg"><p class="game-msg-title">2048</p><p class="game-msg-sub">Swipe to merge tiles</p><button class="game-msg-btn" id="g2-s">Play</button></div></div></div>`;
    const canvas=container.querySelector('#g2-c'),wrap=canvas.parentElement,ctx=canvas.getContext('2d'),scEl=container.querySelector('#g2-sc'),bEl=container.querySelector('#g2-bst'),msg=container.querySelector('#g2-msg'),sfx=window.SFX||{};
    const SZ=4;
    let CELL=80,PAD=10,W=SZ*CELL+PAD*(SZ+1);
    let grid=null,sc=0,best=0,run=false,tx=0,ty=0;

    function calcSize(){
      const sz=Math.min(wrap.clientWidth||320,wrap.clientHeight||320,380);
      PAD=Math.max(6,Math.floor(sz*.028));
      CELL=Math.floor((sz-PAD*(SZ+1))/SZ);
      W=CELL*SZ+PAD*(SZ+1);
      canvas.width=W;canvas.height=W;
    }

    const ng=()=>Array.from({length:SZ},()=>Array(SZ).fill(0));
    const ar=g=>{const e=[];for(let r=0;r<SZ;r++)for(let c=0;c<SZ;c++)if(!g[r][c])e.push([r,c]);if(!e.length)return;const[r,c]=e[Math.floor(Math.random()*e.length)];g[r][c]=Math.random()<.85?2:4;};

    const start=()=>{
      calcSize();
      grid=ng();sc=0;ar(grid);ar(grid);run=true;
      scEl.textContent='0';msg.style.display='none';
      draw();
    };

    const slide=row=>{let a=row.filter(v=>v),pts=0;for(let i=0;i<a.length-1;i++)if(a[i]===a[i+1]){a[i]*=2;pts+=a[i];a.splice(i+1,1);}while(a.length<SZ)a.push(0);return{row:a,pts};};

    const move=dir=>{
      if(!run||!grid)return;
      let mv=false,pts=0;
      const g=grid.map(r=>[...r]);
      if(dir==='left'){for(let r=0;r<SZ;r++){const{row,pts:p}=slide(g[r]);if(row.join()!==g[r].join())mv=true;g[r]=row;pts+=p;}}
      else if(dir==='right'){for(let r=0;r<SZ;r++){const{row,pts:p}=slide([...g[r]].reverse());const rv=row.reverse();if(rv.join()!==g[r].join())mv=true;g[r]=rv;pts+=p;}}
      else if(dir==='up'){for(let c=0;c<SZ;c++){const col=g.map(r=>r[c]);const{row,pts:p}=slide(col);if(row.join()!==col.join())mv=true;for(let r=0;r<SZ;r++)g[r][c]=row[r];pts+=p;}}
      else if(dir==='down'){for(let c=0;c<SZ;c++){const col=g.map(r=>r[c]).reverse();const{row,pts:p}=slide(col);const rv=row.reverse();if(rv.join()!==g.map(r=>r[c]).join())mv=true;for(let r=0;r<SZ;r++)g[r][c]=rv[r];pts+=p;}}
      if(!mv)return;
      grid=g;sc+=pts;
      if(sc>best){best=sc;bEl.textContent=best;}
      scEl.textContent=sc;
      ar(grid);
      if(sfx.flip)sfx.flip();
      if(pts>0&&sfx.match)sfx.match();
      draw();
      if(isOver()){
        setTimeout(()=>{
          run=false;if(sfx.die)sfx.die();
          msg.innerHTML=`<p class="game-msg-title">Game Over</p><p class="game-msg-sub">Score: ${sc}</p><button class="game-msg-btn" id="g2-s">Again</button>`;
          msg.style.display='flex';
          msg.querySelector('#g2-s').addEventListener('click',start);
        },400);
      }
    };

    const isOver=()=>{
      for(let r=0;r<SZ;r++)for(let c=0;c<SZ;c++){
        if(!grid[r][c])return false;
        if(c<SZ-1&&grid[r][c]===grid[r][c+1])return false;
        if(r<SZ-1&&grid[r][c]===grid[r+1][c])return false;
      }return true;
    };

    const gc=v=>{const p=PAL[pk];return p['c'+Math.min(v,2048)]||p.c2048;};

    const draw=()=>{
      if(!grid)return;
      const p=PAL[pk];
      ctx.fillStyle=p.grid;
      ctx.beginPath();if(ctx.roundRect)ctx.roundRect(0,0,W,W,10);else ctx.rect(0,0,W,W);ctx.fill();
      for(let r=0;r<SZ;r++)for(let c=0;c<SZ;c++){
        const x=PAD+c*(CELL+PAD),y=PAD+r*(CELL+PAD),v=grid[r][c];
        ctx.fillStyle=gc(v);
        ctx.beginPath();if(ctx.roundRect)ctx.roundRect(x,y,CELL,CELL,6);else ctx.rect(x,y,CELL,CELL);ctx.fill();
        if(v){
          ctx.fillStyle=p.tx;
          const fs=v<100?Math.floor(CELL*.38):v<1000?Math.floor(CELL*.3):Math.floor(CELL*.22);
          ctx.font=`700 ${fs}px 'DM Sans',sans-serif`;
          ctx.textAlign='center';ctx.textBaseline='middle';
          ctx.fillText(v,x+CELL/2,y+CELL/2);
        }
      }
    };

    const onK=e=>{const m={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down'};if(m[e.key]){e.preventDefault();move(m[e.key]);}};
    const onTS=e=>{tx=e.touches[0].clientX;ty=e.touches[0].clientY;};
    const onTE=e=>{const dx=e.changedTouches[0].clientX-tx,dy=e.changedTouches[0].clientY-ty;if(Math.abs(dx)<8&&Math.abs(dy)<8)return;Math.abs(dx)>Math.abs(dy)?move(dx>0?'right':'left'):move(dy>0?'down':'up');};
    const onResize=()=>{if(grid){calcSize();draw();}};

    document.addEventListener('keydown',onK);
    canvas.addEventListener('touchstart',onTS,{passive:true});
    canvas.addEventListener('touchend',onTE,{passive:true});
    window.addEventListener('resize',onResize);
    container.querySelector('#g2-s').addEventListener('click',start);
    // Draw empty board immediately
    calcSize();draw();

    this._c=()=>{window.removeEventListener('resize',onResize);document.removeEventListener('keydown',onK);canvas.removeEventListener('touchstart',onTS);canvas.removeEventListener('touchend',onTE);};
  },
  getSettings(c){c.innerHTML=`<div class="settings-row"><span class="settings-row-label">Palette</span><div class="settings-swatches" id="g2-p"></div></div>`;const po=c.querySelector('#g2-p');Object.entries(PAL).forEach(([k,v])=>{const s=document.createElement('div');s.className='swatch'+(k===pk?' active':'');s.style.background=v.c64;s.title=k;s.onclick=()=>{pk=k;po.querySelectorAll('.swatch').forEach(x=>x.classList.remove('active'));s.classList.add('active');};po.appendChild(s);});},
  destroy(){if(this._c)this._c();}
};
})();
