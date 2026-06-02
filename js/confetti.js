const Confetti = (() => {
  let canvas, ctx, particles=[], raf=null, running=false;
  const COLORS=['#3b82f6','#60a5fa','#22d3ee','#e2e8f0','#a5b4fc','#f0f4ff'];

  function Particle() {
    this.x = Math.random() * window.innerWidth;
    this.y = -10 - Math.random()*80;
    this.w = Math.random()*10+5; this.h = Math.random()*5+3;
    this.color = COLORS[Math.floor(Math.random()*COLORS.length)];
    this.vx = (Math.random()-.5)*5; this.vy = Math.random()*3+1.5;
    this.rot = Math.random()*360; this.rotV = (Math.random()-.5)*8;
    this.alpha = 1;
  }
  Particle.prototype.update = function() {
    this.x+=this.vx; this.y+=this.vy; this.vy+=.04;
    this.rot+=this.rotV;
    if (this.y > window.innerHeight+20) this.alpha=0;
  };
  Particle.prototype.draw = function() {
    ctx.save(); ctx.globalAlpha=this.alpha;
    ctx.translate(this.x,this.y);
    ctx.rotate(this.rot*Math.PI/180);
    ctx.fillStyle=this.color;
    ctx.fillRect(-this.w/2,-this.h/2,this.w,this.h);
    ctx.restore();
  };

  function loop() {
    if (!running) return;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    particles.forEach(p=>{p.update();p.draw()});
    particles=particles.filter(p=>p.alpha>0);
    if (particles.length>0) raf=requestAnimationFrame(loop);
    else running=false;
  }

  function launch() {
    canvas=document.getElementById('confetti-canvas');
    if (!canvas) return;
    ctx=canvas.getContext('2d');
    const dpr=window.devicePixelRatio||1;
    canvas.width=window.innerWidth*dpr;
    canvas.height=window.innerHeight*dpr;
    canvas.style.width=window.innerWidth+'px';
    canvas.style.height=window.innerHeight+'px';
    ctx.scale(dpr,dpr);
    running=true;
    particles=Array.from({length:200},()=>new Particle());
    setTimeout(()=>particles.push(...Array.from({length:100},()=>new Particle())),600);
    if (raf) cancelAnimationFrame(raf);
    raf=requestAnimationFrame(loop);
  }

  function stop() {
    running=false;
    if (raf) cancelAnimationFrame(raf);
    if (ctx&&canvas) ctx.clearRect(0,0,canvas.width,canvas.height);
  }

  return {launch,stop};
})();
