'use strict';
(()=>{
const SKINS={crimson:{h:'#b52238',b:'#6b1a2a'},gold:{h:'#c9a96e',b:'#a07840'},midnight:{h:'#5a5aaa',b:'#2a2a5a'},rose:{h:'#d4607a',b:'#a03060'},forest:{h:'#3a8a4a',b:'#1a5a2a'}};
const FOODS=['🍎','🍓','💕','⭐','🎂'];
const BGS={'#0a0407':'Dark','#0a0a1a':'Navy','#020a04':'Forest','#100a00':'Amber'};
let sk='crimson',food='🍎',bg='#0a0407';
window.GameRegistry=window.GameRegistry||{};
window.GameRegistry['snake']={
  mount(container){
    container.innerHTML=`<div class="game-ui"><div class="game-score-bar"><span class="game-score-label">Score</span><span class="game-score-val" id="sk-sc">0</span><span class="game-score-label">Best</span><span class="game-score-val" id="sk-bst">0</span></div><div class="game-canvas-wrap"><canvas id="sk-c" class="game-canvas"></canvas><div class="game-msg" id="sk-msg"><p class="game-msg-title">Snake</p><p class="game-msg-sub">Swipe or use D-pad</p><button class="game-msg-btn" id="sk-s">Play</button></div></div><div class="snake-dpad"><div class="dpad-row"><button class="dpad-btn" id="sk-u">▲</button></div><div class="dpad-row"><button class="dpad-btn" id="sk-l">◀</button><button class="dpad-btn" id="sk-d">▼</button><button class="dpad-btn" id="sk-r">▶</button></div></div></div>`;
    const canvas=container.querySelector('#sk-c'),ctx=canvas.getContext('2d'),scEl=container.querySelector('#sk-sc'),bEl=container.querySelector('#sk-bst'),msg=container.querySelector('#sk-msg'),sfx=window.SFX||{};
    const CELL=22,COLS=15,ROWS=18;canvas.width=COLS*CELL;canvas.height=ROWS*CELL;
    let snake,dir,nxt,fd,sc,best=0,timer,run=false,tx=0,ty=0;
    const rnd=()=>{let p;do{p={x:Math.floor(Math.random()*COLS),y:Math.floor(Math.random()*ROWS)};}while(snake.some(s=>s.x===p.x&&s.y===p.y));return p;};
    const start=()=>{snake=[{x:7,y:9},{x:6,y:9},{x:5,y:9}];dir={x:1,y:0};nxt={x:1,y:0};fd=rnd();sc=0;run=true;scEl.textContent='0';msg.style.display='none';clearInterval(timer);timer=setInterval(tick,130);};
    const tick=()=>{dir={...nxt};const h={x:(snake[0].x+dir.x+COLS)%COLS,y:(snake[0].y+dir.y+ROWS)%ROWS};if(snake.some(s=>s.x===h.x&&s.y===h.y)){die();return;}snake.unshift(h);if(h.x===fd.x&&h.y===fd.y){sc++;scEl.textContent=sc;if(sc>best){best=sc;bEl.textContent=best;}fd=rnd();if(sfx.score)sfx.score();}else snake.pop();draw();};
    const die=()=>{clearInterval(timer);run=false;if(sfx.die)sfx.die();msg.innerHTML=`<p class="game-msg-title">Game Over</p><p class="game-msg-sub">Score: ${sc}</p><button class="game-msg-btn" id="sk-s">Again</button>`;msg.style.display='flex';msg.querySelector('#sk-s').addEventListener('click',start);};
    const draw=()=>{const s=SKINS[sk];ctx.fillStyle=bg;ctx.fillRect(0,0,canvas.width,canvas.height);snake.forEach((seg,i)=>{ctx.fillStyle=i===0?s.h:s.b;ctx.beginPath();if(ctx.roundRect)ctx.roundRect(seg.x*CELL+1,seg.y*CELL+1,CELL-2,CELL-2,5);else ctx.rect(seg.x*CELL+1,seg.y*CELL+1,CELL-2,CELL-2);ctx.fill();});ctx.font=`${CELL-3}px serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(food,fd.x*CELL+CELL/2,fd.y*CELL+CELL/2);};
    const sd=(x,y)=>{if(dir.x===-x&&dir.y===-y)return;nxt={x,y};};
    container.querySelector('#sk-s').addEventListener('click',start);
    container.querySelector('#sk-u').addEventListener('click',()=>sd(0,-1));
    container.querySelector('#sk-d').addEventListener('click',()=>sd(0,1));
    container.querySelector('#sk-l').addEventListener('click',()=>sd(-1,0));
    container.querySelector('#sk-r').addEventListener('click',()=>sd(1,0));
    const onK=e=>{const m={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0]};if(m[e.key]){e.preventDefault();sd(...m[e.key]);}};
    document.addEventListener('keydown',onK);
    canvas.addEventListener('touchstart',e=>{tx=e.touches[0].clientX;ty=e.touches[0].clientY;},{passive:true});
    canvas.addEventListener('touchend',e=>{const dx=e.changedTouches[0].clientX-tx,dy=e.changedTouches[0].clientY-ty;Math.abs(dx)>Math.abs(dy)?(dx>0?sd(1,0):sd(-1,0)):(dy>0?sd(0,1):sd(0,-1));},{passive:true});
    draw();
    this._c=()=>{clearInterval(timer);document.removeEventListener('keydown',onK);run=false;};
  },
  getSettings(c){
    c.innerHTML=`<div class="settings-row"><span class="settings-row-label">Snake Colour</span><div class="settings-swatches" id="sk-sk"></div></div><div class="settings-row"><span class="settings-row-label">Food</span><div class="settings-btns" id="sk-fd"></div></div><div class="settings-row"><span class="settings-row-label">Background</span><div class="settings-swatches" id="sk-bg"></div></div>`;
    const so=c.querySelector('#sk-sk');Object.entries(SKINS).forEach(([k,v])=>{const s=document.createElement('div');s.className='swatch'+(k===sk?' active':'');s.style.background=v.h;s.title=k;s.onclick=()=>{sk=k;so.querySelectorAll('.swatch').forEach(x=>x.classList.remove('active'));s.classList.add('active');};so.appendChild(s);});
    const fo=c.querySelector('#sk-fd');FOODS.forEach(f=>{const b=document.createElement('button');b.className='settings-opt'+(f===food?' active':'');b.textContent=f;b.onclick=()=>{food=f;fo.querySelectorAll('.settings-opt').forEach(x=>x.classList.remove('active'));b.classList.add('active');};fo.appendChild(b);});
    const bo=c.querySelector('#sk-bg');Object.entries(BGS).forEach(([h,n])=>{const s=document.createElement('div');s.className='swatch'+(h===bg?' active':'');s.style.background=h;s.title=n;s.onclick=()=>{bg=h;bo.querySelectorAll('.swatch').forEach(x=>x.classList.remove('active'));s.classList.add('active');};bo.appendChild(s);});
  },
  destroy(){if(this._c)this._c();}
};
})();
