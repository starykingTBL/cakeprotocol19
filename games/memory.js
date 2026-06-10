'use strict';
(()=>{
const TH={
  dark:{bg:'#0a0407',card:'#1a0810',cardFlip:'#2a0d14',match:'#1a3010',br:'#4a2a28',mbr:'#4a9b2a'},
  purple:{bg:'#08020e',card:'#180828',cardFlip:'#280a40',match:'#102010',br:'#3a1a5a',mbr:'#4a8a2a'},
  ocean:{bg:'#020a14',card:'#0a1a28',cardFlip:'#0a2a40',match:'#082018',br:'#1a3a5a',mbr:'#2a7a4a'},
};
let thk='dark';
const ES={love:['💕','🌹','💎','🌙','⭐','🎁','🦋','✨'],fun:['🎂','🎮','🎵','🏆','🎯','🎪','🎨','🎭'],nature:['🌸','🦋','🌊','🌿','🍀','🌺','🦚','🌙']};
let ek='love';
window.GameRegistry=window.GameRegistry||{};
window.GameRegistry['memory']={
  mount(container){
    container.innerHTML=`<div class="game-ui"><div class="game-score-bar"><span class="game-score-label">Pairs</span><span class="game-score-val" id="mm-p">0/8</span><span class="game-score-label">Time</span><span class="game-score-val" id="mm-t">60</span></div><div class="game-canvas-wrap"><canvas id="mm-c" class="game-canvas"></canvas><div class="game-msg" id="mm-msg"><p class="game-msg-title">Memory Match</p><p class="game-msg-sub">Find all 8 pairs before time runs out</p><button class="game-msg-btn" id="mm-s">Play</button></div></div></div>`;
    const canvas=container.querySelector('#mm-c'),wrap=canvas.parentElement,ctx=canvas.getContext('2d'),pEl=container.querySelector('#mm-p'),tEl=container.querySelector('#mm-t'),msg=container.querySelector('#mm-msg'),sfx=window.SFX||{};
    const COLS=4,ROWS=4,TOTAL=COLS*ROWS;
    let CELL=72,PAD=8,W,H;

    function calcSize(){
      const sw=wrap.clientWidth||320,sh=wrap.clientHeight||380;
      PAD=8;
      CELL=Math.floor(Math.min((sw-PAD*(COLS+1))/COLS,(sh-PAD*(ROWS+1))/ROWS));
      W=COLS*(CELL+PAD)+PAD;
      H=ROWS*(CELL+PAD)+PAD;
      canvas.width=W;canvas.height=H;
    }

    let cards=null,flipped,matched,tl,lt,raf,run=false,locked=false;

    const start=()=>{
      calcSize();
      const deck=[...ES[ek],...ES[ek]].sort(()=>Math.random()-.5);
      cards=deck.map((e,i)=>({
        e,matched:false,flipped:false,
        x:PAD+(i%COLS)*(CELL+PAD),
        y:PAD+Math.floor(i/COLS)*(CELL+PAD),
        flip:0
      }));
      flipped=[];matched=0;tl=60;run=true;locked=false;lt=Date.now();
      pEl.textContent='0/8';tEl.textContent='60';
      msg.style.display='none';
      if(raf)cancelAnimationFrame(raf);
      loop();
    };

    const loop=()=>{raf=requestAnimationFrame(()=>{update();draw();if(run)loop();});};

    const update=()=>{
      const now=Date.now(),dt=(now-lt)/1000;lt=now;
      tl=Math.max(0,tl-dt);tEl.textContent=Math.ceil(tl);
      if(tl<=0&&run){end(false);return;}
      cards.forEach(c=>{
        if(c.flipped||c.matched){if(c.flip<1)c.flip=Math.min(1,c.flip+.15);}
        else{if(c.flip>0)c.flip=Math.max(0,c.flip-.15);}
      });
    };

    const end=win=>{
      run=false;
      if(win&&sfx.arcade)sfx.arcade();
      if(!win&&sfx.die)sfx.die();
      msg.innerHTML=`<p class="game-msg-title">${win?'You Win! 💕':'Time\'s Up!'}</p><p class="game-msg-sub">Pairs found: ${matched}/8</p><button class="game-msg-btn" id="mm-s">Again</button>`;
      msg.style.display='flex';
      msg.querySelector('#mm-s').addEventListener('click',start);
    };

    const draw=()=>{
      if(!cards)return;
      const t=TH[thk];
      ctx.fillStyle=t.bg;ctx.fillRect(0,0,W,H);
      cards.forEach(c=>{
        const cx=c.x+CELL/2,cy=c.y+CELL/2;
        const sc2=Math.abs(Math.cos(c.flip*Math.PI));
        ctx.save();
        ctx.translate(cx,cy);ctx.scale(Math.max(sc2,.01),1);ctx.translate(-cx,-cy);
        // Determine face
        const showFront=c.flip>=.5;
        ctx.fillStyle=c.matched?t.match:showFront?t.cardFlip:t.card;
        ctx.strokeStyle=c.matched?t.mbr:t.br;ctx.lineWidth=2;
        ctx.beginPath();
        if(ctx.roundRect)ctx.roundRect(c.x,c.y,CELL,CELL,8);
        else ctx.rect(c.x,c.y,CELL,CELL);
        ctx.fill();ctx.stroke();
        if(showFront){
          ctx.font=`${Math.floor(CELL*.5)}px serif`;
          ctx.textAlign='center';ctx.textBaseline='middle';
          ctx.fillText(c.e,cx,cy);
        }else{
          ctx.fillStyle=t.br;
          ctx.font=`700 ${Math.floor(CELL*.32)}px sans-serif`;
          ctx.textAlign='center';ctx.textBaseline='middle';
          ctx.fillText('?',cx,cy);
        }
        ctx.restore();
      });
    };

    const onTap=e=>{
      if(!run||locked)return;
      const rect=canvas.getBoundingClientRect();
      const cx=e.touches?e.touches[0].clientX:e.clientX;
      const cy2=e.touches?e.touches[0].clientY:e.clientY;
      const x=(cx-rect.left)*(W/rect.width);
      const y=(cy2-rect.top)*(H/rect.height);
      const card=cards.find(c=>!c.flipped&&!c.matched&&x>c.x&&x<c.x+CELL&&y>c.y&&y<c.y+CELL);
      if(!card)return;
      card.flipped=true;flipped.push(card);
      if(sfx.flip)sfx.flip();
      if(flipped.length===2){
        locked=true;
        setTimeout(()=>{
          if(flipped[0].e===flipped[1].e){
            flipped[0].matched=true;flipped[1].matched=true;
            matched++;pEl.textContent=`${matched}/8`;
            if(sfx.match)sfx.match();
            if(matched===ES[ek].length)end(true);
          }else{
            flipped[0].flipped=false;flipped[1].flipped=false;
          }
          flipped=[];locked=false;
        },900);
      }
    };

    const onResize=()=>{if(cards){calcSize();cards.forEach((c,i)=>{c.x=PAD+(i%COLS)*(CELL+PAD);c.y=PAD+Math.floor(i/COLS)*(CELL+PAD);});draw();}};
    canvas.addEventListener('click',onTap);
    canvas.addEventListener('touchstart',e=>{e.preventDefault();onTap(e);},{passive:false});
    window.addEventListener('resize',onResize);
    container.querySelector('#mm-s').addEventListener('click',start);
    calcSize();draw();

    this._c=()=>{window.removeEventListener('resize',onResize);canvas.removeEventListener('click',onTap);cancelAnimationFrame(raf);run=false;};
  },
  getSettings(c){
    c.innerHTML=`<div class="settings-row"><span class="settings-row-label">Theme</span><div class="settings-swatches" id="mm-th"></div></div><div class="settings-row"><span class="settings-row-label">Emoji Set</span><div class="settings-btns" id="mm-ek"></div></div>`;
    const to=c.querySelector('#mm-th');Object.entries(TH).forEach(([k,v])=>{const s=document.createElement('div');s.className='swatch'+(k===thk?' active':'');s.style.background=v.cardFlip;s.title=k;s.onclick=()=>{thk=k;to.querySelectorAll('.swatch').forEach(x=>x.classList.remove('active'));s.classList.add('active');};to.appendChild(s);});
    const eo=c.querySelector('#mm-ek');Object.keys(ES).forEach(k=>{const b=document.createElement('button');b.className='settings-opt'+(k===ek?' active':'');b.textContent=k+' '+ES[k][0];b.onclick=()=>{ek=k;eo.querySelectorAll('.settings-opt').forEach(x=>x.classList.remove('active'));b.classList.add('active');};eo.appendChild(b);});
  },
  destroy(){if(this._c)this._c();}
};
})();
