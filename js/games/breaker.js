const Breaker = (() => {
  let canvas,ctx,W,H,raf,running=false;
  let ball,paddle,bricks,score,lives,level,currentLevel;
  const DPR=window.devicePixelRatio||1;

  const BRICK_COLORS={
    1:'#1e3a5f', 2:'#1565a0', 3:'#7209b7', 4:'#1e293b', 5:'#ca8a04',
  };

  function setup() {
    canvas=document.getElementById('canvas-breaker');
    const wrap=document.getElementById('wrap-breaker');
    const rect=wrap.getBoundingClientRect();
    W=rect.width; H=rect.height;
    canvas.width=W*DPR; canvas.height=H*DPR;
    canvas.style.width=W+'px'; canvas.style.height=H+'px';
    ctx=canvas.getContext('2d'); ctx.scale(DPR,DPR);
  }

  function buildBricks(lvlData) {
    bricks=[];
    const layout=lvlData.layout;
    const PAD=5, BRICK_H=24, TOP=50, ROW_GAP=5;
    layout.forEach((row,ri)=>{
      const count=row.filter(v=>v>0).length;
      const totalCols=row.length;
      const brickW=(W-PAD*(totalCols+1))/totalCols;
      row.forEach((type,ci)=>{
        if(type===0) return;
        const hitsMap={1:1,2:2,3:3,4:Infinity,5:1};
        const pointsMap={1:100,2:200,3:300,4:0,5:500};
        bricks.push({
          x:PAD+ci*(brickW+PAD),
          y:TOP+ri*(BRICK_H+ROW_GAP),
          w:brickW, h:BRICK_H,
          type, maxHits:hitsMap[type],
          hitsLeft:hitsMap[type],
          points:pointsMap[type],
          boss:false, flash:false,
        });
      });
    });
    // Boss brick on level 5+
    if(lvlData.boss){
      const bw=W-PAD*2;
      bricks.push({
        x:PAD, y:TOP+layout.length*(BRICK_H+ROW_GAP)+10,
        w:bw, h:28, type:'boss',
        maxHits:5, hitsLeft:5, points:1000,
        boss:true, flash:false,
      });
    }
  }

  function initLevel(lvl) {
    level=lvl;
    currentLevel=DATA.breakerLevels[Math.min(lvl-1,DATA.breakerLevels.length-1)];
    const spd=currentLevel.ballSpeed+(lvl>DATA.breakerLevels.length?(lvl-DATA.breakerLevels.length)*.3:0);
    buildBricks(currentLevel);
    paddle={x:W/2-50,y:H-38,w:100,h:14};
    ball={x:W/2,y:H*.65,dx:spd*(Math.random()>.5?1:-1),dy:-spd,r:8};
    updateHUD();
  }

  function resetGame() {
    score=0; lives=3;
    updateScore(); updateHUD();
    initLevel(1);
  }

  function updateHUD() {
    const le=document.getElementById('breaker-level');
    if(le) le.textContent=level;
    const lv=document.getElementById('breaker-lives-display');
    if(lv) lv.textContent='❤️'.repeat(lives);
  }

  function updateScore(){
    const el=document.getElementById('score-breaker');
    if(el) el.textContent=score;
  }

  /* ── GAME LOOP ────────────────────────────────────────── */
  function loop() {
    if(!running) return;
    raf=requestAnimationFrame(loop);
    update(); draw();
  }

  function update() {
    ball.x+=ball.dx; ball.y+=ball.dy;
    if(ball.x-ball.r<=0){ball.x=ball.r;ball.dx=Math.abs(ball.dx)}
    if(ball.x+ball.r>=W){ball.x=W-ball.r;ball.dx=-Math.abs(ball.dx)}
    if(ball.y-ball.r<=0){ball.y=ball.r;ball.dy=Math.abs(ball.dy)}
    if(ball.y+ball.r>=H) return loseLife();

    // Paddle
    if(ball.y+ball.r>=paddle.y&&ball.y+ball.r<=paddle.y+paddle.h+4&&
       ball.x>=paddle.x-4&&ball.x<=paddle.x+paddle.w+4){
      const hit=(ball.x-paddle.x)/paddle.w;
      const spd=Math.sqrt(ball.dx*ball.dx+ball.dy*ball.dy);
      ball.dx=(hit-.5)*2*spd*1.2;
      ball.dy=-Math.abs(ball.dy);
      ball.y=paddle.y-ball.r;
      Audio.SFX.hit();
    }

    // Bricks
    for(let i=bricks.length-1;i>=0;i--){
      const b=bricks[i];
      if(b.hitsLeft<=0||b.hitsLeft===Infinity) continue;
      const cx=Math.max(b.x,Math.min(ball.x,b.x+b.w));
      const cy=Math.max(b.y,Math.min(ball.y,b.y+b.h));
      if(Math.hypot(ball.x-cx,ball.y-cy)<ball.r){
        b.hitsLeft--;
        b.flash=true;
        setTimeout(()=>{if(b) b.flash=false},80);
        if(b.type==='boss') Audio.SFX.combo();
        else Audio.SFX.hit();
        if(Math.abs(ball.x-cx)>Math.abs(ball.y-cy)) ball.dx=-ball.dx;
        else ball.dy=-ball.dy;
        if(b.hitsLeft<=0){
          score+=b.points; updateScore();
          App.updateScore('breaker',score);
          if(b.boss){
            running=false; Audio.SFX.win();
            App.toast('🎉 DISTANCE Destroyed! Level cleared!','💙');
            App.setBreakerComplete?.();
            setTimeout(()=>nextLevel(),1500);
            return;
          }
          if(b.type===5) { Audio.SFX.bonus(); App.toast('+500 Bonus!','⭐'); }
        }
        break;
      }
    }

    // Check level clear (all non-indestructible bricks gone)
    const remaining=bricks.filter(b=>b.hitsLeft>0&&b.hitsLeft!==Infinity&&!b.boss);
    if(remaining.length===0){
      // Check if boss brick exists and isn't defeated
      const boss=bricks.find(b=>b.boss&&b.hitsLeft>0);
      if(!boss){
        running=false; Audio.SFX.levelUp();
        App.toast('Level '+level+' cleared! 🎉','💙');
        setTimeout(()=>nextLevel(),1200);
      }
    }
  }

  function loseLife() {
    lives--;
    updateHUD();
    if(lives<=0){
      running=false; Audio.SFX.die();
      App.updateScore('breaker',score);
      App.toast('Game Over! Score: '+score,'💔');
      setTimeout(()=>{
        document.getElementById('overlay-breaker').classList.remove('hidden');
        document.getElementById('ob-breaker').textContent=App.getState().scores.breaker;
      },700);
      return;
    }
    Audio.SFX.die();
    App.toast('💔 '+lives+(lives===1?' life':' lives')+' left','💔');
    ball.x=paddle.x+paddle.w/2; ball.y=paddle.y-30;
    const spd=currentLevel.ballSpeed;
    ball.dx=spd*(Math.random()>.5?1:-1); ball.dy=-spd;
  }

  function nextLevel() {
    initLevel(level+1);
    running=true;
    raf=requestAnimationFrame(loop);
  }

  /* ── DRAW ────────────────────────────────────────────── */
  function draw() {
    ctx.fillStyle='#020817'; ctx.fillRect(0,0,W,H);

    bricks.forEach(b=>{
      if(b.hitsLeft<=0) return;
      let fill=b.flash?'#ffffff':
               b.boss?['#e2e8f0','#60a5fa','#3b82f6','#1d4ed8','#1e3a5f'][5-b.hitsLeft]:
               BRICK_COLORS[b.type]||'#1e3a5f';
      const prog=b.hitsLeft/b.maxHits;
      if(!b.boss&&b.maxHits>1) fill=lerpColor(BRICK_COLORS[b.type],'#020817',1-prog);
      ctx.fillStyle=fill;
      ctx.shadowBlur=b.boss?14:0;
      ctx.shadowColor=b.boss?'#60a5fa':'transparent';
      ctx.beginPath(); ctx.roundRect(b.x,b.y,b.w,b.h,4); ctx.fill();
      ctx.shadowBlur=0;
      ctx.strokeStyle=b.boss?'rgba(96,165,250,.6)':'rgba(59,130,246,.15)';
      ctx.lineWidth=1; ctx.stroke();
      ctx.fillStyle=b.boss?'#020817':'rgba(241,245,249,.8)';
      ctx.font=`${b.boss?W*.028:W*.022}px DM Mono,monospace`;
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(b.boss?'DISTANCE':b.type===5?'★':'',b.x+b.w/2,b.y+b.h/2,b.w-8);
      if(b.boss){
        ctx.fillStyle='rgba(0,0,0,.4)';
        ctx.font=`${W*.02}px DM Mono`;
        ctx.textAlign='right'; ctx.textBaseline='top';
        ctx.fillText(b.hitsLeft+' HP',b.x+b.w-4,b.y+4);
      }
    });

    // Paddle
    const pg=ctx.createLinearGradient(paddle.x,0,paddle.x+paddle.w,0);
    pg.addColorStop(0,'#3b82f6'); pg.addColorStop(1,'#22d3ee');
    ctx.fillStyle=pg;
    ctx.shadowBlur=10; ctx.shadowColor='rgba(59,130,246,.4)';
    ctx.beginPath(); ctx.roundRect(paddle.x,paddle.y,paddle.w,paddle.h,7); ctx.fill();
    ctx.shadowBlur=0;
    ctx.fillStyle='#fff';
    ctx.font=`bold ${W*.025}px DM Mono,monospace`;
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('IFE 🤍',paddle.x+paddle.w/2,paddle.y+paddle.h/2);

    // Ball
    ctx.beginPath(); ctx.arc(ball.x,ball.y,ball.r,0,Math.PI*2);
    ctx.fillStyle='#60a5fa';
    ctx.shadowBlur=12; ctx.shadowColor='#3b82f6';
    ctx.fill(); ctx.shadowBlur=0;
  }

  function lerpColor(c1,c2,t) {
    const h=(c)=>parseInt(c.replace('#',''),16);
    const n1=h(c1),n2=h(c2);
    const r=Math.round(((n1>>16)&255)*(1-t)+((n2>>16)&255)*t);
    const g=Math.round(((n1>>8)&255)*(1-t)+((n2>>8)&255)*t);
    const b=Math.round((n1&255)*(1-t)+(n2&255)*t);
    return `rgb(${r},${g},${b})`;
  }

  /* ── TOUCH ────────────────────────────────────────────── */
  function setupInput() {
    const move=(cx)=>{
      if(!running) return;
      const rect=canvas.getBoundingClientRect();
      paddle.x=Math.max(0,Math.min(W-paddle.w,cx-rect.left-paddle.w/2));
    };
    canvas.addEventListener('touchmove',e=>{
      e.preventDefault(); move(e.touches[0].clientX);
    },{passive:false});
    canvas.addEventListener('mousemove',e=>move(e.clientX));
  }

  function start() {
    setup(); setupInput(); resetGame(); running=true;
    document.getElementById('overlay-breaker').classList.add('hidden');
    raf=requestAnimationFrame(loop);
  }

  function stop() {
    running=false;
    if(raf) cancelAnimationFrame(raf);
  }

  function init() {
    document.getElementById('start-breaker')?.addEventListener('click',start);
  }

  document.addEventListener('DOMContentLoaded',init);
  return {stop};
})();
