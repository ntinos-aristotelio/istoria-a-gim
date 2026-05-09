/* Istoria V10 Phase 4 - Data-driven Chapter Generator */
(function(){
  const $ = (sel) => document.querySelector(sel);
  const esc = (s) => String(s || '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

  function getChapterId(){
    const params = new URLSearchParams(location.search);
    return params.get('chapter') || params.get('id') || '1';
  }

  async function loadJSON(path){
    const response = await fetch(path, {cache:'no-store'});
    if(!response.ok) throw new Error('Δεν βρέθηκε το αρχείο: ' + path);
    return response.json();
  }

  function renderNav(data){
    const logo = $('#generatorLogo');
    if(logo) logo.textContent = data.logo || data.title || 'Ιστορία Α΄ Γυμνασίου';
    const old = $('#legacyLink');
    if(old) old.href = data.sourceFile || ('chapter' + data.id + '.html');
  }

  function renderHome(data){
    const title = $('#heroTitle');
    const eyebrow = $('#heroEyebrow');
    const sub = $('#heroSubtitle');
    const cards = $('#generatedCards');
    if(title) title.textContent = data.heroTitle || data.title;
    if(eyebrow) eyebrow.textContent = data.eyebrow || 'Generated chapter';
    if(sub) sub.textContent = 'Αυτό το κεφάλαιο φορτώνεται από JSON data και αποδίδεται από κοινό generator engine.';
    if(cards){
      cards.innerHTML = (data.cards || []).map(card => `
        <div class="card">
          <div>
            <div class="icon">${esc(card.icon || '📌')}</div>
            <h3>${esc(card.title)}</h3>
            <p>${esc(card.text)}</p>
          </div>
        </div>`).join('') || '<div class="notice">Δεν υπάρχουν ακόμη cards στο data αρχείο.</div>';
    }
  }

  function renderQuiz(data){
    window.CHAPTER_ID = String(data.id || getChapterId());
    window.CHAPTER_TITLE = data.title || 'Generated chapter';
    window.questions = data.quiz || [];
    if(window.renderQuiz) window.renderQuiz();
  }

  function renderGlossary(data){
    const box = $('#generatedGlossary');
    if(!box) return;
    box.innerHTML = (data.glossary || []).map(item => `
      <div class="mini"><h3>${esc(item.term)}</h3><p>${esc(item.definition)}</p></div>
    `).join('') || '<div class="notice">Δεν υπάρχει ακόμη λεξικό στο data αρχείο.</div>';
  }

  function renderChecklist(data){
    const box = $('#generatedChecklist');
    if(!box) return;
    box.innerHTML = (data.checklist || []).map(item => `
      <label><input type="checkbox"> ${esc(item)}</label>
    `).join('') || '<div class="notice">Δεν υπάρχει checklist στο data αρχείο.</div>';
  }

  function renderManifest(manifest){
    const list = $('#chapterManifestList');
    if(!list) return;
    list.innerHTML = (manifest.chapters || []).map(ch => `
      <a class="btn" href="chapter-template.html?chapter=${encodeURIComponent(ch.id)}">Κεφ. ${esc(ch.id)}</a>
    `).join('');
  }

  async function init(){
    const status = $('#generatorStatus');
    try{
      const id = getChapterId();
      const manifest = await loadJSON('data/manifest.json');
      renderManifest(manifest);
      const chapterMeta = (manifest.chapters || []).find(ch => String(ch.id) === String(id));
      const dataPath = chapterMeta ? ('data/' + chapterMeta.file) : ('data/chapter' + id + '.json');
      const data = await loadJSON(dataPath);
      window.CHAPTER_ID = String(data.id || id);
      window.CHAPTER_TITLE = data.title || 'Generated chapter';
      renderNav(data);
      renderHome(data);
      renderQuiz(data);
      renderGlossary(data);
      renderChecklist(data);
      if(window.IstoriaChapter) IstoriaChapter.render();
      if(status) status.textContent = '✅ Φορτώθηκε από ' + dataPath;
    }catch(err){
      console.error(err);
      if(status) status.textContent = '⚠️ ' + err.message + ' — Άνοιξε το project μέσα από local server για να δουλέψει το fetch.';
    }
  }

  window.IstoriaGenerator = {init, loadJSON};
  document.addEventListener('DOMContentLoaded', init);
})();
