const App = (() => {
  const KEY = 'omosile19_app';
  const DEF = {
    v:1, keys:0,
    scores:{ snake:0, runner:0, breaker:0, taptarget:0, game2048:0, memory:'--' },
    customSnake:{ colorIdx:0, foodIdx:0, bgIdx:0 },
    customRunner:{ charIdx:0, sceneIdx:0 },
  };
  let state=null;

  function load() {
    try {
      const r=localStorage.getItem(KEY);
      state=r?Object.assign({},DEF,JSON.parse(r)):{...DEF};
      state.scores=Object.assign({},DEF.scores,state.scores||{});
      state.customSnake=Object.assign({},DEF.customSnake,state.customSnake||{});
      state.customRunner=Object.assign({},DEF.customRunner,state.customRunner||{});
    } catch(e) { state={...DEF}; }
  }

  function save() {
    try { localStorage.setItem(KEY,JSON.stringify(state)); } catch(e) {}
  }

  function updateScore(game, score) {
    if (game==='memory') {
      const prev=state.scores.memory;
      if (prev==='--' || score<parseInt(prev)) {
        state.scores.memory=score;
        save(); refreshHubScores();
      }
    } else {
      if (score>state.scores[game]) {
        state.scores[game]=score;
        save(); refreshHubScores();
      }
    }
  }

  function refreshHubScores() {
    ['snake','runner','breaker','taptarget','game2048'].forEach(g=>{
      const e=document.getElementById('best-'+g);
      if(e) e.textContent='Best: '+(state.scores[g]||0);
      const o=document.getElementById('ob-'+g);
      if(o) o.textContent=state.scores[g]||0;
    });
    const me=document.getElementById('best-memory');
    if(me) me.textContent='Best: '+(state.scores.memory==='--'?'--':state.scores.memory+' flips');
    const om=document.getElementById('ob-memory');
    if(om) om.textContent=state.scores.memory==='--'?'--':state.scores.memory+' flips';
  }

  /* ── SCREEN ROUTER ──────────────────────────────────── */
  function show(id) {
    document.querySelectorAll('.screen').forEach(s=>{
      s.classList.add('hidden'); s.classList.remove('active');
    });
    const el=document.getElementById('screen-'+id);
    if (!el) return;
    el.classList.remove('hidden'); el.classList.add('active');
    if (id==='hub') refreshHubScores();
    if (id==='finale') {
      Confetti.launch();
      setTimeout(()=>document.getElementById('finale-emojis')?.classList.add('show'),300);
    }
  }

  /* ── TABS ───────────────────────────────────────────── */
  function setupTabs() {
    document.querySelectorAll('.nav-tab').forEach(btn=>{
      btn.addEventListener('click',()=>{
        const tab=btn.dataset.tab;
        document.querySelectorAll('.hub-panel').forEach(p=>{
          p.classList.add('hidden'); p.classList.remove('active');
        });
        document.querySelectorAll('.nav-tab').forEach(b=>b.classList.remove('active'));
        document.getElementById('panel-'+tab)?.classList.remove('hidden');
        document.getElementById('panel-'+tab)?.classList.add('active');
        btn.classList.add('active');
        Audio.SFX.tap();
      });
    });
  }

  /* ── GAME CARDS ─────────────────────────────────────── */
  function setupGameCards() {
    document.querySelectorAll('.game-card').forEach(card=>{
      card.addEventListener('click',()=>{
        Audio.SFX.tap();
        show(card.dataset.game);
      });
    });
    ['snake','runner','breaker','taptarget','game2048','memory'].forEach(g=>{
      const id=g==='game2048'?'2048':g==='taptarget'?'taptarget':g;
      document.getElementById('back-'+g)?.addEventListener('click',()=>{
        stopGame(g); show('hub'); Audio.SFX.tap();
      });
    });
  }

  function stopGame(g) {
    if (g==='snake'&&window.Snake)       Snake.stop?.();
    if (g==='runner'&&window.Runner)     Runner.stop?.();
    if (g==='breaker'&&window.Breaker)   Breaker.stop?.();
    if (g==='taptarget'&&window.TapTarget) TapTarget.stop?.();
    if (g==='game2048'&&window.Game2048) Game2048.stop?.();
    if (g==='memory'&&window.MemMatch)   MemMatch.stop?.();
  }

  /* ── TOAST ──────────────────────────────────────────── */
  let toastT=null;
  function toast(msg,icon='✓') {
    const el=document.getElementById('toast');
    if(!el) return;
    if(toastT){clearTimeout(toastT);el.classList.add('hidden')}
    document.getElementById('toast-icon').textContent=icon;
    document.getElementById('toast-msg').textContent=msg;
    void el.offsetWidth;
    el.classList.remove('hidden');
    toastT=setTimeout(()=>el.classList.add('hidden'),3000);
  }

  /* ── SPARKLES ───────────────────────────────────────── */
  function spawnSparkles() {
    const c=document.getElementById('landing-sparkles');
    if(!c) return;
    const icons=['✨','🌸','💙','⭐','🌟','💫','🎀'];
    for(let i=0;i<12;i++){
      const s=document.createElement('span');
      s.className='sparkle'; s.textContent=icons[i%icons.length];
      s.style.left=Math.random()*100+'%';
      s.style.top=Math.random()*100+'%';
      s.style.animationDelay=Math.random()*4+'s';
      s.style.animationDuration=(2+Math.random()*3)+'s';
      c.appendChild(s);
    }
  }

  /* ── VOICE NOTE CHECK ───────────────────────────────── */
  function checkVoice() {
    const audio=document.getElementById('voice-player');
    const miss=document.getElementById('voice-missing');
    if(!audio||!miss) return;
    audio.addEventListener('error',()=>{
      audio.style.display='none'; miss.style.display='block';
    });
    fetch('assets/audio/voice.mp3',{method:'HEAD'}).catch(()=>{
      audio.style.display='none'; miss.style.display='block';
    });
  }

  /* ── INIT ───────────────────────────────────────────── */
  function init() {
    load(); spawnSparkles(); setupTabs(); setupGameCards(); checkVoice();

    document.getElementById('btn-open')?.addEventListener('click',()=>{
      Audio.startAmbient(); Audio.SFX.tap(); show('letter');
    });
    document.getElementById('btn-letter-next')?.addEventListener('click',()=>{
      Audio.SFX.tap(); show('finale');
    });
    document.getElementById('btn-to-writeup')?.addEventListener('click',()=>{
      Confetti.stop(); Audio.SFX.tap(); show('writeup');
    });
    document.getElementById('btn-enter-arcade')?.addEventListener('click',()=>{
      Audio.SFX.tap(); show('hub');
    });
    document.getElementById('btn-new-2048')?.addEventListener('click',()=>{
      window.Game2048?.newGame?.(); Audio.SFX.tap();
    });
  }

  document.addEventListener('DOMContentLoaded',init);

  return {
    getState:()=>state, save, updateScore, toast, show,
  };
})();
