const TapTarget = (() => {
  let canvas,ctx,W,H,raf,running=false;
  let score,combo,timeLeft,targets,timerInterval;

  function setup() {
    canvas=document.getElementById('canvas-taptarget');
    const wrap=document.getElementById('wrap-taptarget');
    const rect=wrap.getBoundingClientRect();
    const dpr=window.devicePixelRatio||1;
    W=rect.width; H=rect.height;
    canvas.width=W*dpr; canvas.height=H*dpr;
    canvas.style.width=W+'px'; canvas.style.height=H+'px';
    ctx=canvas.getContext('2d'); ctx.scale(dpr,dpr);
  }

  function spawnTarget() {
    const r=15+Math.random()*35;
    const margin=r+10;
    const headerH=100; // below header/hud
    targets.push({
      x:margin+Math.random()*(W-margin*2),
      y:headerH+margin+Math.random()*(H-headerH-margin*2),
      r, maxR:r, life:1,
      decay:.008+Math.random()*.006,
      color:`hsl(${200+Math.random()*60},80%,${50+Math.random()*20}%)`,
      points:Math.floor(500/r),
    });
  }

  function reset() {
    score=0; combo=1; timeLeft=30; targets=[];
    updateScore(); updateTimerDisplay(); updateComboDisplay();
  }

  function startTimer() {
    clearInterval(timerInterval);
    timerInterval=setInterval(()=>{
      timeLeft--;
      updateTimerDisplay();
      if(timeLeft<=0){clearInterval(timerInterval);endGame();}
    },1000);
  }

  function endGame() {
    running=false;
    if(raf) cancelAnimationFrame(raf);
    Audio.SFX.die();
    App.updateScore('taptarget',score);
    App.toast('Game Over! Score: '+score,'🎯');
    setTimeout(()=>{
      document.getElementById('overlay-taptarget').classList.remove('hidden');
      document.getElementById('ob-taptarget').textContent=App.getState().scores.taptarget;
    },600);
  }

  function loop() {
    if(!running) return;
    raf=requestAnimationFrame(loop);
    // Spawn
    if(Math.random()<.025&&targets.length<8) spawnTarget();
    // Update
    targets.forEach(t=>{t.life-=t.decay;t.r=t.maxR*t.life});
    targets=targets.filter(t=>t.life>0.05);
    draw();
  }

  function draw() {
    ctx.fillStyle='#020817'; ctx.fillRect(0,0,W,H);
    // Grid dots
    ctx.fillStyle='rgba(59,130,246,.04)';
    for(let x=0;x<W;x+=30)for(let y=0;y<H;y+=30){
      ctx.beginPath();ctx.arc(x,y,1,0,Math.PI*2);ctx.fill();
    }
    targets.forEach(t=>{
      const alpha=Math.min(1,t.life*2);
      ctx.globalAlpha=alpha;
      // Outer ring
      ctx.beginPath(); ctx.arc(t.x,t.y,t.r,0,Math.PI*2);
      ctx.strokeStyle=t.color; ctx.lineWidth=2; ctx.stroke();
      // Inner fill
      ctx.beginPath(); ctx.arc(t.x,t.y,t.r*.6,0,Math.PI*2);
      ctx.fillStyle=t.color+'44'; ctx.fill();
      // Centre dot
      ctx.beginPath(); ctx.arc(t.x,t.y,4,0,Math.PI*2);
      ctx.fillStyle=t.color; ctx.fill();
      // Points label
      ctx.fillStyle='#fff';
      ctx.font=`bold ${t.r*.35}px DM Mono`;
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(t.points,t.x,t.y);
    });
    ctx.globalAlpha=1;
  }

  function onTap(cx,cy) {
    if(!running) return;
    const rect=canvas.getBoundingClientRect();
    const x=cx-rect.left, y=cy-rect.top;
    let hit=false;
    for(let i=targets.length-1;i>=0;i--){
      const t=targets[i];
      if(Math.hypot(x-t.x,y-t.y)<t.r+5){
        hit=true;
        const pts=t.points*combo;
        score+=pts; combo++;
        targets.splice(i,1);
        Audio.SFX.tap(); Audio.SFX.combo();
        App.updateScore('taptarget',score);
        updateScore(); updateComboDisplay();
        // Pop effect
        showPop(t.x,t.y,'+'+pts);
        break;
      }
    }
    if(!hit){combo=1;updateComboDisplay();}
  }

  let popEls=[];
  function showPop(x,y,text) {
    // Create floating text on canvas via temporary overlay element
    const el=document.createElement('div');
    el.textContent=text;
    el.style.cssText=`position:absolute;left:${x}px;top:${y}px;
      color:#60a5fa;font-family:DM Mono,monospace;font-size:.8rem;
      font-weight:bold;pointer-events:none;transform:translate(-50%,-50%);
      animation:pop-float .8s ease-out forwards;z-index:20;`;
    const wrap=document.getElementById('wrap-taptarget');
    if(wrap){ wrap.appendChild(el); setTimeout(()=>el.remove(),800); }
  }

  function updateScore(){
    const e=document.getElementById('score-taptarget');
    if(e) e.textContent=score;
  }
  function updateTimerDisplay(){
    const e=document.getElementById('tt-timer');
    if(e) e.textContent=timeLeft;
  }
  function updateComboDisplay(){
    const e=document.getElementById('tt-combo');
    if(e) e.textContent=combo;
  }

  function setupInput() {
    canvas.addEventListener('touchend',e=>{
      e.preventDefault();
      onTap(e.changedTouches[0].clientX,e.changedTouches[0].clientY);
    },{passive:false});
    canvas.addEventListener('click',e=>onTap(e.clientX,e.clientY));
  }

  function start() {
    setup(); setupInput(); reset(); running=true;
    startTimer();
    document.getElementById('overlay-taptarget').classList.add('hidden');
    raf=requestAnimationFrame(loop);
  }

  function stop() {
    running=false;
    clearInterval(timerInterval);
    if(raf) cancelAnimationFrame(raf);
  }

  function init() {
    document.getElementById('start-taptarget')?.addEventListener('click',start);
  }

  // Add pop-float keyframe to document
  document.addEventListener('DOMContentLoaded',()=>{
    const style=document.createElement('style');
    style.textContent=`@keyframes pop-float{0%{opacity:1;transform:translate(-50%,-50%) scale(1.2)}100%{opacity:0;transform:translate(-50%,-120%) scale(.8)}}`;
    document.head.appendChild(style);
    init();
  });
  return {stop};
})();
