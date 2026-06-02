const Game2048 = (() => {
  let grid, score, running=false;

  /* ── GRID LOGIC ──────────────────────────────────────── */
  function emptyGrid() {
    return Array.from({length:4},()=>[0,0,0,0]);
  }

  function addTile(g) {
    const empty=[];
    g.forEach((row,r)=>row.forEach((v,c)=>{if(!v) empty.push({r,c})}));
    if(!empty.length) return;
    const {r,c}=empty[Math.floor(Math.random()*empty.length)];
    g[r][c]=Math.random()<.9?2:4;
  }

  function slideRow(row) {
    let tiles=row.filter(x=>x);
    let merged=false;
    for(let i=0;i<tiles.length-1;i++){
      if(!merged&&tiles[i]===tiles[i+1]){
        tiles[i]*=2; score+=tiles[i];
        tiles.splice(i+1,1); merged=true;
        Audio.SFX.score();
        if(tiles[i]===2048) Audio.SFX.win();
      } else { merged=false; }
    }
    while(tiles.length<4) tiles.push(0);
    return tiles;
  }

  function transpose(g){
    return g[0].map((_,i)=>g.map(row=>row[i]));
  }

  function moved(prev,next){
    return prev.some((row,r)=>row.some((v,c)=>v!==next[r][c]));
  }

  function move(dir) {
    if(!running) return;
    const prev=grid.map(r=>[...r]);
    let g=grid.map(r=>[...r]);
    switch(dir){
      case 'left':  g=g.map(r=>slideRow(r)); break;
      case 'right': g=g.map(r=>slideRow([...r].reverse()).reverse()); break;
      case 'up':    g=transpose(transpose(g).map(r=>slideRow(r))); break;
      case 'down':  g=transpose(transpose(g).map(r=>slideRow([...r].reverse()).reverse())); break;
    }
    if(!moved(prev,g)) return;
    grid=g; addTile(grid);
    render();
    App.updateScore('game2048',score);
    if(isGameOver()) endGame();
  }

  function isGameOver() {
    for(let r=0;r<4;r++)for(let c=0;c<4;c++){
      if(!grid[r][c]) return false;
      if(c<3&&grid[r][c]===grid[r][c+1]) return false;
      if(r<3&&grid[r][c]===grid[r+1][c]) return false;
    }
    return true;
  }

  /* ── RENDER ──────────────────────────────────────────── */
  function render() {
    const el=document.getElementById('g2048-grid');
    if(!el) return;
    el.innerHTML='';
    grid.forEach((row,r)=>row.forEach((val,c)=>{
      const cell=document.createElement('div');
      cell.className='g2048-cell'+(val?' merge':'');
      if(val){
        const tc=DATA.tileColors[val]||{bg:'#1e293b',color:'#e2e8f0'};
        cell.style.background=tc.bg;
        cell.style.color=tc.color;
        if(val>=128) cell.style.boxShadow=`0 0 12px ${tc.bg}88`;
        cell.textContent=val;
        // Font size based on digit count
        const fs=val>=1000?'.75rem':val>=100?'.9rem':'1.1rem';
        cell.style.fontSize=fs;
      }
      el.appendChild(cell);
    }));
    document.getElementById('g2048-score').textContent=score;
    const best=App.getState().scores.game2048;
    document.getElementById('g2048-best').textContent=best;
  }

  function endGame() {
    running=false;
    Audio.SFX.die();
    App.toast('Game Over! Score: '+score,'🔢');
    setTimeout(()=>{
      document.getElementById('overlay-2048').classList.remove('hidden');
      document.getElementById('ob-2048').textContent=App.getState().scores.game2048;
    },600);
  }

  function newGame() {
    score=0; grid=emptyGrid();
    addTile(grid); addTile(grid);
    running=true;
    document.getElementById('overlay-2048').classList.add('hidden');
    render();
  }

  /* ── INPUT ────────────────────────────────────────────── */
  function setupInput() {
    // Keyboard
    document.addEventListener('keydown',e=>{
      const screen=document.getElementById('screen-2048');
      if(screen?.classList.contains('hidden')) return;
      const map={'ArrowLeft':'left','ArrowRight':'right',
                 'ArrowUp':'up','ArrowDown':'down'};
      if(map[e.key]){ e.preventDefault(); move(map[e.key]); }
    });
    // Touch swipe
    let ts=null;
    const grid=document.getElementById('g2048-grid');
    grid?.addEventListener('touchstart',e=>{
      ts={x:e.touches[0].clientX,y:e.touches[0].clientY};
    },{passive:true});
    grid?.addEventListener('touchend',e=>{
      if(!ts) return;
      const dx=e.changedTouches[0].clientX-ts.x;
      const dy=e.changedTouches[0].clientY-ts.y;
      ts=null;
      if(Math.max(Math.abs(dx),Math.abs(dy))<15) return;
      if(Math.abs(dx)>Math.abs(dy))
        move(dx>0?'right':'left');
      else
        move(dy>0?'down':'up');
    },{passive:true});
  }

  function start() {
    newGame();
    document.getElementById('overlay-2048').classList.add('hidden');
  }

  function stop() { running=false; }

  function init() {
    setupInput();
    document.getElementById('start-2048')?.addEventListener('click',start);
    // Build empty grid visual immediately
    const el=document.getElementById('g2048-grid');
    if(el){
      el.innerHTML='';
      for(let i=0;i<16;i++){
        const c=document.createElement('div');
        c.className='g2048-cell'; el.appendChild(c);
      }
    }
  }

  document.addEventListener('DOMContentLoaded',init);
  return {stop, newGame};
})();
