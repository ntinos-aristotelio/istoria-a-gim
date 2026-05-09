/* Istoria V10 Chapter Engine - shared progress + badges */
(function(){
  function chapterId(){ return String(window.CHAPTER_ID || ''); }
  function chapterTitle(){ return window.CHAPTER_TITLE || ('Κεφάλαιο ' + chapterId()); }
  function saveChapterProgress(update){
    const id = chapterId();
    const progress = IstoriaStorage.update(function(progress){
      progress.chapters = progress.chapters || {};
      const previous = progress.chapters[id] || {};
      progress.chapters[id] = Object.assign({}, previous, update, {title:chapterTitle(), updatedAt:new Date().toISOString()});
      progress.history = progress.history || [];
      progress.history.push({type:'chapter-update', chapter:id, update:update, at:new Date().toISOString()});
      if(progress.history.length > 80) progress.history = progress.history.slice(-80);
    });
    renderChapterProgress(progress);
  }
  function renderChapterProgress(progress){
    progress = progress || IstoriaStorage.load();
    const chapter = (progress.chapters || {})[chapterId()] || {};
    const fill = document.getElementById('chapterProgressFill');
    const text = document.getElementById('chapterProgressText');
    const badges = document.getElementById('chapterBadgeList');
    if(!fill || !text || !badges) return;
    let percent = 0;
    if(typeof chapter.score === 'number' && chapter.total) percent = Math.round((chapter.score / chapter.total) * 70);
    if(chapter.completed) percent = 100;
    fill.style.width = percent + '%';
    const scoreText = chapter.total ? ('Τελευταίο σκορ quiz: ' + chapter.score + ' / ' + chapter.total + '.') : 'Δεν έχει γίνει ακόμη quiz.';
    text.textContent = chapter.completed ? ('✅ Το κεφάλαιο ολοκληρώθηκε! ' + scoreText) : ('Πρόοδος: ' + percent + '%. ' + scoreText);
    badges.innerHTML = chapter.completed ? '<span class="progress-badge-chip">🏆 Badge κεφαλαίου</span><span class="progress-badge-chip">✅ Ολοκληρώθηκε</span>' : '<span class="progress-badge-chip">🎯 Στόχος: κάνε το quiz</span><span class="progress-badge-chip">🏁 Πάτησε ολοκλήρωση</span>';
  }
  function badge(){
    saveChapterProgress({completed:true});
    if(window.playUISound) playUISound('badge');
    const box = document.getElementById('badgeBox');
    if(box) box.innerHTML = '<div class="badge">🏆 Ολοκλήρωσες το Κεφάλαιο ' + chapterId() + '!</div>';
  }
  window.saveChapterProgress = saveChapterProgress;
  window.renderChapterProgress = renderChapterProgress;
  window.badge = badge;
  window.IstoriaChapter = {init:function(){ if(window.IstoriaUI){IstoriaUI.injectDrawings(); IstoriaUI.collectSlides();} renderChapterProgress(); if(window.renderQuiz) renderQuiz(); if(window.showSlide) showSlide(); }, save:saveChapterProgress, render:renderChapterProgress};
})();
