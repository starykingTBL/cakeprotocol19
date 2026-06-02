const MemMatch = (() => {
  let cards=[], flipped=[], matched=0;
  let flips=0, timerInterval=null, seconds=0;
  let locked=false, running=false;

  /* ── BUILD GRID ──────────────────────────────────────── */
  function buildGrid() {
    const emojis=DATA.memoryEmojis;
    const pairs=[...emojis,...emojis];
    // Fisher-Yates shuffle
    for(let i=pairs.length-1;i>0;i--){
      const j=Math.floor(Math.random()*(i+1));
      [pairs[i],pairs[j]]=[pairs[j],pairs[i]];
    }
    cards=pairs.map((e,i)=>({id:i,emoji:e,flipped:false,matched:false}));
  }

  function render() {
    const grid=document.getElementById('memory-grid');
    if(!grid) return;
    grid.innerHTML='';
    cards.forEach((card,i)=>{
      const el=document.createElement('div');
      el.className='mem-card'+(card.flipped||card.matched?' flipped':'')+
                   (card.matched?' matched':'');
      el.innerHTML=`
        <div class="mem-card-inner">
          <div class="mem-card-front">?</div>
          <div class="mem-card-back">${card.emoji}</div>
        </div>`;
      el.addEventListener('click',()=>onCardClick(i,el));
      grid.appendChild(el);
    });
  }

  function onCardClick(idx,el) {
    if(!running||locked) return;
    const card=cards[idx];
    if(card.flipped||card.matched) return;
    card.flipped=true;
    el.classList.add('flipped');
    flipped.push(idx);
    flips++; updateFlips();
    Audio.SFX.flip();

    if(flipped.length===2){
      locked=true;
      const [a,b]=flipped;
      if(cards[a].emoji===cards[b].emoji){
        // Match
        setTimeout(()=>{
          cards[a].matched=cards[b].matched=true;
          document.querySelectorAll('.mem-card')[a]?.classList.add('matched');
          document.querySelectorAll('.mem-card')[b]?.classList.add('matched');
          matched++;
          flipped=[];
          locked=false;
          Audio.SFX.match();
          if(matched===DATA.memoryEmojis.length) onWin();
        },400);
      } else {
        // No match — flip back
        setTimeout(()=>{
          cards[a].flipped=cards[b].flipped=false;
          document.querySelectorAll('.mem-card')[a]?.classList.remove('flipped');
          document.querySelectorAll('.mem-card')[b]?.classList.remove('flipped');
          flipped=[]; locked=false;
          Audio.SFX.hit();
        },900);
      }
    }
  }

  function onWin() {
    running=false;
    clearInterval(timerInterval);
    Audio.SFX.win();
    App.updateScore('memory',flips);
    App.toast(`🃏 Done in ${flips} flips & ${formatTime(seconds)}!`,'🎉');
    setTimeout(()=>{
      document.getElementById('overlay-memory').classList.remove('hidden');
      const s=App.getState().scores.memory;
      document.getElementById('ob-memory').textContent=s==='--'?'--':s+' flips';
    },600);
  }

  /* ── TIMER ────────────────────────────────────────────── */
  function startTimer() {
    seconds=0; clearInterval(timerInterval);
    timerInterval=setInterval(()=>{
      seconds++;
      document.getElementById('mem-timer').textContent=formatTime(seconds);
    },1000);
  }

  function formatTime(s) {
    return Math.floor(s/60)+':'+(s%60).toString().padStart(2,'0');
  }

  function updateFlips() {
    const e=document.getElementById('mem-flips');
    if(e) e.textContent=flips+' flips';
  }

  function reset() {
    flipped=[]; matched=0; flips=0; locked=false; seconds=0;
    updateFlips();
    document.getElementById('mem-timer').textContent='0:00';
  }

  function start() {
    reset(); buildGrid(); render(); running=true; startTimer();
    document.getElementById('overlay-memory').classList.add('hidden');
  }

  function stop() {
    running=false;
    clearInterval(timerInterval);
  }

  function init() {
    document.getElementById('start-memory')?.addEventListener('click',start);
    // Pre-render empty grid
    render();
  }

  document.addEventListener('DOMContentLoaded',init);
  return {stop};
})();
