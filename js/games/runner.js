const Runner = (() => {
  let canvas,ctx,W,H,raf,running=false;
  let score,speed,frame,player,obstacles,stars,coins,particles;
  let groundY,jumpCount;
  let cfg={charIdx:0,sceneIdx:0};

  const GRAVITY=0.55, JUMP=-13;

  function getScene(){ return DATA.runnerScenes[cfg.sceneIdx]; }
  function getChar(){  return DATA.runnerChars[cfg.charIdx]; }

  /* ── SETUP ────────────────────────────────────────────── */
  function setup() {
    canvas=document.getElementById('canvas-runner');
    const wrap=document.getElementById('wrap-runner');
    const rect=wrap.getBoundingClientRect();
    const dpr=window.devicePixelRatio||1;
    W=rect.width; H=rect.height;
    canvas.width=W*dpr; canvas.height=H*dpr;
    canvas.style.width=W+'px'; canvas.style.height=H+'px';
    ctx=canvas.getContext('2d'); ctx.scale(dpr,dpr);
    groundY=H*.75;
  }

  function reset() {
    score=0; speed=4; frame=0; jumpCount=0;
    player={x:W*.15,y:groundY,w:28,h:28,vy:0,onGround:true,squash:1,stretch:1};
    obstacles=[]; coins=[]; particles=[];
    const s=getScene();
    stars=s.stars?Array.from({length:50},()=>({
      x:Math.random()*W, y:Math.random()*groundY*.9,
      r:Math.random()*1.5+.3, a:Math.random(),
    })):[];
    updateScore();
  }

  /* ── PHYSICS ─────────────────────────────────────────── */
  function jump() {
    if(!running) return;
    if(player.onGround){
      player.vy=JUMP; player.onGround=false; jumpCount=1;
      player.stretch=1.4; player.squash=.7;
      Audio.SFX.jump();
      spawnJumpParticles();
    } else if(jumpCount<2){
      player.vy=JUMP*.85; jumpCount=2;
      Audio.SFX.jump();
    }
  }

  function spawnJumpParticles() {
    for(let i=0;i<6;i++){
      particles.push({
        x:player.x+player.w/2, y:player.y,
        vx:(Math.random()-.5)*4, vy:Math.random()*2+1,
        life:1, color:'rgba(59,130,246,'
      });
    }
  }

  function spawnObstacle() {
    const h=30+Math.random()*50, w=18+Math.random()*18;
    const type=Math.random()<.3?'double':'single';
    obstacles.push({x:W+50,y:groundY-h,w,h,type});
    if(type==='double'){
      obstacles.push({x:W+50+w+30,y:groundY-(h*.6),w:w*.8,h:h*.6,type:'single'});
    }
  }

  function spawnCoin() {
    coins.push({
      x:W+50, y:groundY-50-Math.random()*60,
      r:8, alive:true,
    });
  }

  /* ── UPDATE ───────────────────────────────────────────── */
  function update() {
    if(!running) return;
    raf=requestAnimationFrame(update);
    frame++;
    if(frame%200===0) speed=Math.min(speed+.3,10);
    score=Math.floor(frame/6); updateScore();

    // Player
    player.vy+=GRAVITY; player.y+=player.vy;
    player.squash+=(1-player.squash)*.2;
    player.stretch+=(1-player.stretch)*.2;
    if(player.y>=groundY){
      player.y=groundY; player.vy=0; player.onGround=true; jumpCount=0;
    }

    // Obstacles
    if(obstacles.length===0||
       (W-obstacles[obstacles.length-1].x)>(W*.4+Math.random()*W*.3))
      spawnObstacle();
    obstacles.forEach(o=>o.x-=speed);
    obstacles=obstacles.filter(o=>o.x+o.w>-10);

    // Coins
    if(Math.random()<.015) spawnCoin();
    coins.forEach(c=>c.x-=speed);
    coins=coins.filter(c=>c.alive&&c.x+c.r>-10);

    // Coin collection
    coins.forEach(c=>{
      if(!c.alive) return;
      const dx=c.x-(player.x+player.w/2), dy=c.y-(player.y-player.h/2);
      if(Math.hypot(dx,dy)<c.r+16){
        c.alive=false; score+=5; Audio.SFX.score();
        App.updateScore('runner',score);
      }
    });

    // Particles
    particles.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.1;p.life-=.05});
    particles=particles.filter(p=>p.life>0);

    // Collision
    for(const o of obstacles){
      if(player.x+player.w-6>o.x&&player.x+6<o.x+o.w&&
         player.y>o.y-player.h&&player.y<o.y+o.h)
        return gameOver();
    }
    draw();
  }

  /* ── DRAW ────────────────────────────────────────────── */
  function draw() {
    const sc=getScene();
    // Sky gradient
    const sky=ctx.createLinearGradient(0,0,0,groundY);
    sky.addColorStop(0,sc.sky1); sky.addColorStop(1,sc.sky2);
    ctx.fillStyle=sky; ctx.fillRect(0,0,W,H);

    // Stars
    if(sc.stars) stars.forEach(s=>{
      ctx.fillStyle=`rgba(148,163,184,${.3+.5*s.a})`;
      ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2); ctx.fill();
    });

    // Parallax bg layer (slow-moving shapes)
    ctx.fillStyle='rgba(59,130,246,.03)';
    for(let i=0;i<5;i++){
      const ox=((frame*speed*.2+i*W/5)%W);
      ctx.fillRect(ox,groundY*.3,2,groundY*.4);
    }

    // Ground
    ctx.fillStyle=sc.ground; ctx.fillRect(0,groundY+2,W,H-groundY-2);
    ctx.fillStyle='rgba(59,130,246,.5)'; ctx.fillRect(0,groundY,W,2);

    // Coins
    coins.forEach(c=>{
      if(!c.alive) return;
      ctx.fillStyle='#fbbf24'; ctx.shadowBlur=8; ctx.shadowColor='#fbbf24';
      ctx.beginPath(); ctx.arc(c.x,c.y,c.r,0,Math.PI*2); ctx.fill();
      ctx.shadowBlur=0;
      ctx.fillStyle='rgba(255,255,255,.5)';
      ctx.font=`${c.r*1.2}px sans-serif`;
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('⭐',c.x,c.y);
    });

    // Particles
    particles.forEach(p=>{
      ctx.fillStyle=p.color+p.life+')';
      ctx.beginPath(); ctx.arc(p.x,p.y,3*p.life,0,Math.PI*2); ctx.fill();
    });

    // Obstacles
    obstacles.forEach(o=>{
      ctx.fillStyle='#7209b7'; ctx.shadowBlur=6; ctx.shadowColor='rgba(114,9,183,.5)';
      ctx.beginPath(); ctx.roundRect(o.x,o.y,o.w,o.h,4); ctx.fill();
      ctx.shadowBlur=0;
    });

    // Player with squash/stretch
    ctx.save();
    ctx.translate(player.x+player.w/2,player.y-player.h/2);
    ctx.scale(player.squash,player.stretch);
    ctx.font=`${player.w*.9}px sans-serif`;
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(getChar(),0,0);
    ctx.restore();
  }

  function gameOver() {
    running=false; Audio.SFX.die();
    App.updateScore('runner',score);
    App.toast('Game Over! Score: '+score,'🏃‍♀️');
    setTimeout(()=>{
      document.getElementById('overlay-runner').classList.remove('hidden');
      document.getElementById('ob-runner').textContent=App.getState().scores.runner;
    },700);
  }

  function updateScore(){
    const el=document.getElementById('score-runner');
    if(el) el.textContent=score;
  }

  /* ── INPUT ────────────────────────────────────────────── */
  function setupInput() {
    canvas.addEventListener('touchstart',jump,{passive:true});
    canvas.addEventListener('click',jump);
  }

  /* ── CUSTOMISATION ───────────────────────────────────── */
  function buildCustomUI() {
    const cr=document.getElementById('runner-chars');
    if(cr){
      cr.innerHTML='';
      DATA.runnerChars.forEach((c,i)=>{
        const e=document.createElement('div');
        e.className='emoji-opt'+(i===cfg.charIdx?' selected':'');
        e.textContent=c;
        e.addEventListener('click',()=>{
          cfg.charIdx=i; Audio.SFX.tap();
          cr.querySelectorAll('.emoji-opt').forEach((s,j)=>
            s.classList.toggle('selected',j===i));
        });
        cr.appendChild(e);
      });
    }
    const sc=document.getElementById('runner-scenes');
    if(sc){
      sc.innerHTML='';
      DATA.runnerScenes.forEach((s,i)=>{
        const e=document.createElement('div');
        e.className='bg-opt'+(i===cfg.sceneIdx?' selected':'');
        e.textContent=s.name;
        e.addEventListener('click',()=>{
          cfg.sceneIdx=i; Audio.SFX.tap();
          sc.querySelectorAll('.bg-opt').forEach((x,j)=>
            x.classList.toggle('selected',j===i));
        });
        sc.appendChild(e);
      });
    }
  }

  function start() {
    setup(); setupInput(); reset(); running=true;
    document.getElementById('overlay-runner').classList.add('hidden');
    raf=requestAnimationFrame(update);
  }

  function stop() {
    running=false;
    if(raf) cancelAnimationFrame(raf);
  }

  function init() {
    buildCustomUI();
    document.getElementById('start-runner')?.addEventListener('click',start);
  }

  document.addEventListener('DOMContentLoaded',init);
  return {stop};
})();
