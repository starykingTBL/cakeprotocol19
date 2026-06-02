const Snake = (() => {
  let canvas,ctx,W,H,CELL,raf,running=false;
  let snake,dir,nextDir,food,score,speed,stepT;
  let cfg={colorIdx:0,foodIdx:0,bgIdx:0};
  const GRID=20;

  function getColor(){ return DATA.snakeColors[cfg.colorIdx]; }
  function getFood(){  return DATA.snakeFoods[cfg.foodIdx]; }
  function getBg(){    return DATA.snakeBgs[cfg.bgIdx]; }

  /* ── SETUP ────────────────────────────────────────────── */
  function setup() {
    canvas=document.getElementById('canvas-snake');
    const wrap=document.getElementById('wrap-snake');
    const rect=wrap.getBoundingClientRect();
    const dpr=window.devicePixelRatio||1;
    W=rect.width; H=rect.height;
    CELL=Math.floor(Math.min(W,H)/GRID);
    canvas.width=W*dpr; canvas.height=H*dpr;
    canvas.style.width=W+'px'; canvas.style.height=H+'px';
    ctx=canvas.getContext('2d'); ctx.scale(dpr,dpr);
  }

  function reset() {
    const midX=Math.floor(W/CELL/2), midY=Math.floor(H/CELL/2);
    snake=[{x:midX,y:midY},{x:midX-1,y:midY}];
    dir={x:1,y:0}; nextDir={x:1,y:0};
    score=0; speed=150; stepT=0;
    placeFood(); updateScore();
  }

  function placeFood() {
    const cols=Math.floor(W/CELL), rows=Math.floor(H/CELL);
    do {
      food={x:Math.floor(Math.random()*cols),y:Math.floor(Math.random()*rows)};
    } while(snake.some(s=>s.x===food.x&&s.y===food.y));
  }

  /* ── LOOP ────────────────────────────────────────────── */
  function loop(ts) {
    if(!running) return;
    raf=requestAnimationFrame(loop);
    if(!stepT) stepT=ts;
    if(ts-stepT<speed){draw();return;}
    stepT=ts;
    dir={...nextDir};
    const cols=Math.floor(W/CELL), rows=Math.floor(H/CELL);
    let head={x:snake[0].x+dir.x, y:snake[0].y+dir.y};
    // Wall wrap — goes off edge, appears on other side
    head.x=((head.x%cols)+cols)%cols;
    head.y=((head.y%rows)+rows)%rows;
    // Self collision
    if(snake.some(s=>s.x===head.x&&s.y===head.y)) return gameOver();
    snake.unshift(head);
    if(head.x===food.x&&head.y===food.y){
      score+=10; speed=Math.max(70,speed-2);
      placeFood(); updateScore();
      App.updateScore('snake',score); Audio.SFX.eat();
    } else { snake.pop(); }
    draw();
  }

  /* ── DRAW ────────────────────────────────────────────── */
  function draw() {
    const bg=getBg(), col=getColor();
    ctx.fillStyle=bg.bg; ctx.fillRect(0,0,W,H);
    // Grid
    const cols=Math.floor(W/CELL), rows=Math.floor(H/CELL);
    ctx.strokeStyle=bg.grid; ctx.lineWidth=.5;
    for(let x=0;x<=cols;x++){ctx.beginPath();ctx.moveTo(x*CELL,0);ctx.lineTo(x*CELL,H);ctx.stroke();}
    for(let y=0;y<=rows;y++){ctx.beginPath();ctx.moveTo(0,y*CELL);ctx.lineTo(W,y*CELL);ctx.stroke();}
    // Food
    ctx.font=`${CELL*.8}px sans-serif`;
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(getFood(),food.x*CELL+CELL/2,food.y*CELL+CELL/2);
    // Snake
    snake.forEach((seg,i)=>{
      ctx.fillStyle=i===0?col.head:col.body;
      ctx.shadowBlur=i===0?8:0; ctx.shadowColor=col.head;
      ctx.beginPath();
      ctx.roundRect(seg.x*CELL+1,seg.y*CELL+1,CELL-2,CELL-2,3);
      ctx.fill();
    });
    ctx.shadowBlur=0;
  }

  function gameOver() {
    running=false; Audio.SFX.die();
    App.updateScore('snake',score);
    App.toast('Game Over! Score: '+score,'🐍');
    setTimeout(()=>{
      document.getElementById('overlay-snake').classList.remove('hidden');
      document.getElementById('ob-snake').textContent=App.getState().scores.snake;
    },700);
  }

  function updateScore(){
    const el=document.getElementById('score-snake');
    if(el) el.textContent=score;
  }

  /* ── TOUCH CONTROLS ──────────────────────────────────── */
  let ts=null;
  function setupTouch() {
    canvas.addEventListener('touchstart',e=>{
      ts={x:e.touches[0].clientX,y:e.touches[0].clientY};
    },{passive:true});
    canvas.addEventListener('touchend',e=>{
      if(!ts) return;
      const dx=e.changedTouches[0].clientX-ts.x;
      const dy=e.changedTouches[0].clientY-ts.y;
      ts=null;
      if(Math.abs(dx)<10&&Math.abs(dy)<10) return;
      if(Math.abs(dx)>Math.abs(dy)){
        if(dx>0&&dir.x===0) nextDir={x:1,y:0};
        if(dx<0&&dir.x===0) nextDir={x:-1,y:0};
      } else {
        if(dy>0&&dir.y===0) nextDir={x:0,y:1};
        if(dy<0&&dir.y===0) nextDir={x:0,y:-1};
      }
    },{passive:true});
    document.addEventListener('keydown',e=>{
      if(!running) return;
      if(e.key==='ArrowRight'&&dir.x===0) nextDir={x:1,y:0};
      if(e.key==='ArrowLeft'&&dir.x===0)  nextDir={x:-1,y:0};
      if(e.key==='ArrowDown'&&dir.y===0)  nextDir={x:0,y:1};
      if(e.key==='ArrowUp'&&dir.y===0)    nextDir={x:0,y:-1};
    });
  }

  /* ── CUSTOMISATION ───────────────────────────────────── */
  function buildCustomUI() {
    // Colors
    const cs=document.getElementById('snake-color-swatches');
    if(cs) {
      cs.innerHTML='';
      DATA.snakeColors.forEach((c,i)=>{
        const sw=document.createElement('div');
        sw.className='color-swatch'+(i===cfg.colorIdx?' selected':'');
        sw.style.background=`linear-gradient(135deg,${c.head},${c.body})`;
        sw.title=c.name;
        sw.addEventListener('click',()=>{
          cfg.colorIdx=i; Audio.SFX.tap();
          cs.querySelectorAll('.color-swatch').forEach((s,j)=>
            s.classList.toggle('selected',j===i));
        });
        cs.appendChild(sw);
      });
    }
    // Foods
    const fe=document.getElementById('snake-food-emojis');
    if(fe) {
      fe.innerHTML='';
      DATA.snakeFoods.forEach((f,i)=>{
        const e=document.createElement('div');
        e.className='emoji-opt'+(i===cfg.foodIdx?' selected':'');
        e.textContent=f;
        e.addEventListener('click',()=>{
          cfg.foodIdx=i; Audio.SFX.tap();
          fe.querySelectorAll('.emoji-opt').forEach((s,j)=>
            s.classList.toggle('selected',j===i));
        });
        fe.appendChild(e);
      });
    }
    // Backgrounds
    const bg=document.getElementById('snake-bg-options');
    if(bg) {
      bg.innerHTML='';
      DATA.snakeBgs.forEach((b,i)=>{
        const e=document.createElement('div');
        e.className='bg-opt'+(i===cfg.bgIdx?' selected':'');
        e.textContent=b.name;
        e.addEventListener('click',()=>{
          cfg.bgIdx=i; Audio.SFX.tap();
          bg.querySelectorAll('.bg-opt').forEach((s,j)=>
            s.classList.toggle('selected',j===i));
        });
        bg.appendChild(e);
      });
    }
  }

  function start() {
    setup(); setupTouch(); reset(); running=true;
    document.getElementById('overlay-snake').classList.add('hidden');
    raf=requestAnimationFrame(loop);
  }

  function stop() {
    running=false;
    if(raf) cancelAnimationFrame(raf);
  }

  function init() {
    buildCustomUI();
    document.getElementById('start-snake')?.addEventListener('click',start);
    const screen=document.getElementById('screen-snake');
    new MutationObserver(()=>{
      if(!screen.classList.contains('hidden')) buildCustomUI();
    }).observe(screen,{attributes:true,attributeFilter:['class']});
  }

  document.addEventListener('DOMContentLoaded',init);
  return {stop};
})();
