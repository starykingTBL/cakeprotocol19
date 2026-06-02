const Story = (() => {

  function renderParas(containerId, items) {
    const el=document.getElementById(containerId);
    if(!el) return;
    el.innerHTML='';
    items.forEach((item,i)=>{
      const p=document.createElement('p');
      p.className=item.cls;
      p.innerHTML=item.text;
      p.style.transitionDelay=(i*0.1)+'s';
      el.appendChild(p);
    });
  }

  function revealAll(containerId) {
    const el=document.getElementById(containerId);
    if(!el) return;
    const paras=el.querySelectorAll('.story-para,.writeup-para');
    paras.forEach((p,i)=>{
      if(i<3) p.classList.add('revealed');
    });
    const obs=new IntersectionObserver(entries=>{
      entries.forEach(e=>{
        if(e.isIntersecting){
          e.target.classList.add('revealed');
          obs.unobserve(e.target);
        }
      });
    },{threshold:.1});
    paras.forEach(p=>{
      if(!p.classList.contains('revealed')) obs.observe(p);
    });
  }

  function watchScreen(screenId, action) {
    const screen=document.getElementById(screenId);
    if(!screen) return;
    new MutationObserver(()=>{
      if(!screen.classList.contains('hidden')) action();
    }).observe(screen,{attributes:true,attributeFilter:['class']});
  }

  function init() {
    renderParas('letter-body', DATA.letter);
    renderParas('writeup-content', DATA.writeup);
    const us=document.getElementById('us-story-text');
    if(us) us.textContent=DATA.storyShort;

    watchScreen('screen-letter',()=>revealAll('letter-body'));
    watchScreen('screen-writeup',()=>{
      document.querySelectorAll('#writeup-content .writeup-para').forEach(p=>{
        p.style.opacity='1'; p.style.transform='none';
      });
    });
  }

  document.addEventListener('DOMContentLoaded',init);
})();
