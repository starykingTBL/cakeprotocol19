'use strict';
(()=>{
const THEMES={dark:{bg:'#0a0407',card:'#1a0810',cardFlip:'#2a0d14',match:'#1a3010',border:'#4a2a28',matchBorder:'#4a9b2a'},
  purple:{bg:'#08020e',card:'#180828',cardFlip:'#280a40',match:'#102010',border:'#3a1a5a',matchBorder:'#4a8a2a'},
  ocean:{bg:'#020a14',card:'#0a1a28',cardFlip:'#0a2a40',match:'#082018',border:'#1a3a5a',matchBorder:'#2a7a4a'}};
let themeKey='dark';
const EMOJI_SETS={love:['💕','🌹','💎','🌙','⭐','🎁','🦋','✨'],fun:['🎂','🎮','🎵','🏆','🎯','🎪','🎨','🎭'],nature:['🌸','🦋','🌊','🌿','🍀','🌺','🦚','🌙']};
let emojiSet='love';

window.GameRegistry=window.GameRegistry||{};
window.GameRegistry['memory']={
  mount(container){
    container.innerHTML=`
      <div class="game-ui">
        <div class="game-score-bar">
          <span class="game-score-label">Pairs</span>
          <span class="game-score-val" id="mm-pairs">0</span>
          <span class="game-score-label">Time</span>
          <span class="game-score-val" id="mm-time">60</span>
        </div>
        <div class="game-canvas-wrap">
          <canvas id="mm-canvas" class="game-canvas"></canvas>
          <div class="game-msg" id="mm-msg">
            <p class="game-msg-title">Memory Match</p>
            <p class="game-msg-sub">Find all pairs before time runs out</p>
            <button class="game-msg-btn" id="mm-start">Play</button>
          </div>
        </div>
      </div>`;

    const canvas=container.querySelector('#mm-canvas');
    const wrap=canvas.parentElement;
    const ctx=canvas.getContext('2d');
    const pairsEl=container.querySelector('#mm-pairs');
    const timeEl=container.querySelector('#mm-time');
    const msg=container.querySelector('#mm-msg');
    const sfx=window.SFX||{};

    const COLS=4,ROWS=4;
    let CELL,PAD,W,H;
    function resize(){
      const sw=wrap.clientWidth||320,sh=wrap.clientHeight||380;
      PAD=8;CELL=Math.floor(Math.min((sw-PAD*(COLS+1))/COLS,(sh-PAD*(ROWS+1))/ROWS));
      W=COLS*(CELL+PAD)+PAD;H=ROWS*(CELL+PAD)+PAD;
      canvas.width=W;canvas.height=H;
    }
    resize();window.addEventListener('resize',()=>{resize();draw();});

    let cards,flipped,matched,timeLeft,lastTick,raf,running=false,locked=false;

    function startGame(){
      const deck=[...EMOJI_SETS[emojiSet],...EMOJI_SETS[emojiSet]].sort(()=>Math.random()-0.5);
      cards=deck.map((emoji,i)=>({emoji,matched:false,flipped:false,x:PAD+(i%COLS)*(CELL+PAD),y:PAD+Math.floor(i/COLS)*(CELL+PAD),flip:0}));
      flipped=[];matched=0;timeLeft=60;running=true;locked=false;lastTick=Date.now();
      pairsEl.textContent='0';timeEl.textContent='60';msg.style.display='none';
      if(raf)cancelAnimationFrame(raf);loop();
    }

    function loop(){raf=requestAnimationFrame(()=>{update();draw();if(running)loop();});}

    function update(){
      const now=Date.now(),dt=(now-lastTick)/1000;lastTick=now;
      timeLeft=Math.max(0,timeLeft-dt);timeEl.textContent=Math.ceil(timeLeft);
      if(timeLeft<=0&&running){end(false);return;}
      cards.forEach(c=>{if(c.flipped&&c.flip<1)c.flip=Math.min(1,c.flip+0.14);if(!c.flipped&&c.flip>0)c.flip=Math.max(0,c.flip-0.14);});
    }

    function end(win){running=false;if(win&&sfx.arcade)sfx.arcade();if(!win&&sfx.die)sfx.die();msg.innerHTML=`<p class="game-msg-title">${win?'You Win! 💕':'Time\'s Up!'}</p><p class="game-msg-sub">Pairs: ${matched}</p><button class="game-msg-btn" id="mm-start">Again</button>`;msg.style.display='flex';msg.querySelector('#mm-start').addEventListener('click',startGame);}

    function draw(){
      const t=THEMES[themeKey];
      ctx.fillStyle=t.bg;ctx.fillRect(0,0,W,H);
      cards.forEach(c=>{
        const cx=c.x+CELL/2,cy=c.y+CELL/2,sc=Math.abs(Math.cos(c.flip*Math.PI));
        ctx.save();ctx.translate(cx,cy);ctx.scale(sc,1);ctx.translate(-cx,-cy);
        ctx.fillStyle=c.matched?t.match:c.flip<0.5?t.card:t.cardFlip;
        ctx.strokeStyle=c.matched?t.matchBorder:t.border;ctx.lineWidth=2;
        ctx.beginPath();if(ctx.roundRect)ctx.roundRect(c.x,c.y,CELL,CELL,8);else ctx.rect(c.x,c.y,CELL,CELL);ctx.fill();ctx.stroke();
        if(c.flip<0.5){ctx.fillStyle=t.border;ctx.font=`700 ${Math.floor(CELL*0.3)}px sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('?',cx,cy);}
        else{ctx.font=`${Math.floor(CELL*0.5)}px serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(c.emoji,cx,cy);}
        ctx.restore();
      });
    }

    function onTap(e){
      if(!running||locked)return;
      const rect=canvas.getBoundingClientRect();
      const cx=e.touches?e.touches[0].clientX:e.clientX;
      const cy=e.touches?e.touches[0].clientY:e.clientY;
      const x=(cx-rect.left)*(W/rect.width),y=(cy-rect.top)*(H/rect.height);
      const card=cards.find(c=>!c.flipped&&!c.matched&&x>c.x&&x<c.x+CELL&&y>c.y&&y<c.y+CELL);
      if(!card)return;
      card.flipped=true;flipped.push(card);if(sfx.flip)sfx.flip();
      if(flipped.length===2){locked=true;setTimeout(()=>{if(flipped[0].emoji===flipped[1].emoji){flipped[0].matched=true;flipped[1].matched=true;matched++;pairsEl.textContent=matched;if(sfx.match)sfx.match();if(matched===EMOJI_SETS[emojiSet].length)end(true);}else{flipped[0].flipped=false;flipped[1].flipped=false;}flipped=[];locked=false;},900);}
    }

    canvas.addEventListener('click',onTap);
    canvas.addEventListener('touchstart',e=>{e.preventDefault();onTap(e);},{passive:false});
    container.querySelector('#mm-start').addEventListener('click',startGame);
    draw();
    this._cleanup=()=>{window.removeEventListener('resize',resize);canvas.removeEventListener('click',onTap);cancelAnimationFrame(raf);running=false;};
  },
  getSettings(container){
    container.innerHTML=`
      <div class="settings-row"><span class="settings-row-label">Theme</span><div class="settings-swatches" id="mm-theme-opts"></div></div>
      <div class="settings-row"><span class="settings-row-label">Emoji Set</span><div class="settings-btns" id="mm-emoji-opts"></div></div>`;
    const to=container.querySelector('#mm-theme-opts');
    Object.entries(THEMES).forEach(([k,v])=>{const s=document.createElement('div');s.className='swatch'+(k===themeKey?' active':'');s.style.background=v.cardFlip;s.title=k;s.addEventListener('click',()=>{themeKey=k;to.querySelectorAll('.swatch').forEach(x=>x.classList.remove('active'));s.classList.add('active');});to.appendChild(s);});
    const eo=container.querySelector('#mm-emoji-opts');
    Object.keys(EMOJI_SETS).forEach(k=>{const b=document.createElement('button');b.className='settings-opt'+(k===emojiSet?' active':'');b.textContent=k+' '+EMOJI_SETS[k][0];b.addEventListener('click',()=>{emojiSet=k;eo.querySelectorAll('.settings-opt').forEach(x=>x.classList.remove('active'));b.classList.add('active');});eo.appendChild(b);});
  },
  destroy(){if(this._cleanup)this._cleanup();}
};
})();
