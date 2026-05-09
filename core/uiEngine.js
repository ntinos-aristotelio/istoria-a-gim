/* Istoria V10 UI Engine - shared page/drawing/lesson helpers */
(function(){
  let slide = 0;
  let slides = [];
  function injectDrawings(){
    document.querySelectorAll('[data-draw]').forEach(function(el){
      const id = el.getAttribute('data-draw');
      const tpl = document.getElementById(id);
      if(tpl) el.innerHTML = tpl.innerHTML;
    });
  }
  function showPage(id){
    document.querySelectorAll('.page').forEach(function(p){ p.classList.remove('active'); });
    const page = document.getElementById(id);
    if(page) page.classList.add('active');
    window.scrollTo(0,0);
  }
  function openLesson(){
    const id = 'chapter' + (window.CHAPTER_ID || 1);
    showPage(id);
    slide = 0;
    showSlide();
  }
  function collectSlides(){ slides = Array.from(document.querySelectorAll('.lesson-slide')); }
  function showSlide(){
    if(!slides.length) collectSlides();
    if(!slides.length) return;
    slides.forEach(function(s){ s.classList.remove('active'); });
    slide = Math.max(0, Math.min(slide, slides.length - 1));
    slides[slide].classList.add('active');
    const counter = document.getElementById('counter');
    const progress = document.getElementById('progress');
    if(counter) counter.textContent = (slide + 1) + ' / ' + slides.length;
    if(progress) progress.style.width = ((slide + 1) / slides.length * 100) + '%';
    window.scrollTo(0,0);
  }
  function nextSlide(){ if(slide < slides.length - 1){ slide++; showSlide(); } }
  function prevSlide(){ if(slide > 0){ slide--; showSlide(); } }
  function doneMsg(btn){ if(btn){ btn.textContent = '✅ Ολοκληρώθηκε'; btn.style.background = '#2d8a4d'; } }
  function setText(id, text){ const el = document.getElementById(id); if(el) el.textContent = text; }
  window.showPage = showPage;
  window.openLesson = openLesson;
  window.showSlide = showSlide;
  window.nextSlide = nextSlide;
  window.prevSlide = prevSlide;
  window.doneMsg = doneMsg;
  window.IstoriaUI = {injectDrawings:injectDrawings, collectSlides:collectSlides, showSlide:showSlide, setText:setText};
})();
