const Gallery = (() => {
  function init() {
    const slider=document.getElementById('gallery-slider');
    const dots=document.getElementById('gallery-dots');
    if(!slider||!dots) return;
    const slides=slider.querySelectorAll('.gallery-slide');
    slides.forEach((_,i)=>{
      const d=document.createElement('div');
      d.className='gallery-dot'+(i===0?' active':'');
      d.addEventListener('click',()=>slider.scrollTo({
        left:i*slider.clientWidth,behavior:'smooth'
      }));
      dots.appendChild(d);
    });
    slider.addEventListener('scroll',()=>{
      const idx=Math.round(slider.scrollLeft/slider.clientWidth);
      dots.querySelectorAll('.gallery-dot').forEach((d,i)=>
        d.classList.toggle('active',i===idx));
    },{passive:true});
  }
  document.addEventListener('DOMContentLoaded',init);
})();
