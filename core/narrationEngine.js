(function(){
  const state = { scenes: [], selected: null, voices: [], filter: 'all' };
  const icons = { calm:'🏺', hopeful:'🌾', discovery:'🛶', bright:'🏛️', journey:'⛵', battle:'⚔️', city:'🗳️', tense:'🛡️', epic:'🦁', transition:'🏰' };
  function qs(id){ return document.getElementById(id); }
  function moodIcon(mood){ return icons[mood] || '📜'; }
  function canSpeak(){ return 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window; }
  function loadVoices(){
    if(!canSpeak()) return;
    state.voices = window.speechSynthesis.getVoices();
    const sel = qs('voiceSelect');
    if(!sel) return;
    const greek = state.voices.filter(v => (v.lang||'').toLowerCase().startsWith('el'));
    const list = greek.length ? greek : state.voices;
    sel.innerHTML = list.map((v,i)=>`<option value="${state.voices.indexOf(v)}">${v.name} (${v.lang})</option>`).join('');
  }
  async function init(){
    try{
      const res = await fetch('data/narration.json');
      const data = await res.json();
      state.scenes = data.scenes || [];
      state.selected = state.scenes[0] || null;
      renderFilters(); renderList(); renderScene();
      loadVoices();
      if(canSpeak()) window.speechSynthesis.onvoiceschanged = loadVoices;
    }catch(e){
      const root = qs('storyStage');
      if(root) root.innerHTML = '<div class="story-content"><h2>Δεν φορτώθηκε η αφήγηση</h2><p>Έλεγξε ότι υπάρχει το αρχείο data/narration.json.</p></div>';
    }
  }
  function periods(){ return ['all', ...Array.from(new Set(state.scenes.map(s=>s.period)))]; }
  function renderFilters(){
    const el = qs('sceneFilters'); if(!el) return;
    el.innerHTML = periods().map(p=>`<button class="${p===state.filter?'active':''}" data-filter="${p}">${p==='all'?'Όλα':p}</button>`).join('');
    el.querySelectorAll('button').forEach(b=>b.onclick=()=>{state.filter=b.dataset.filter; renderFilters(); renderList();});
  }
  function visibleScenes(){ return state.filter==='all' ? state.scenes : state.scenes.filter(s=>s.period===state.filter); }
  function renderList(){
    const el = qs('sceneList'); if(!el) return;
    el.innerHTML = visibleScenes().map(s=>`<button class="scene-btn ${state.selected&&state.selected.id===s.id?'active':''}" data-id="${s.id}">${moodIcon(s.mood)} ${s.title}<small>Κεφ. ${s.chapter} • ${s.period}</small></button>`).join('');
    el.querySelectorAll('.scene-btn').forEach(btn=>btn.onclick=()=>{state.selected=state.scenes.find(s=>s.id===btn.dataset.id); stop(); renderList(); renderScene();});
  }
  function renderScene(){
    const s = state.selected; const el = qs('storyStage'); if(!s||!el) return;
    el.innerHTML = `
      <div class="story-banner"><div><div class="scene-icon">${moodIcon(s.mood)}</div><h2>${s.title}</h2><p>${s.location}</p></div></div>
      <div class="story-content">
        <div class="story-meta"><span class="story-chip">Κεφάλαιο ${s.chapter}</span><span class="story-chip">${s.period}</span><span class="story-chip">${s.duration}</span></div>
        <div class="story-text" id="storyText">${s.text}</div>
        <div class="story-controls"><button onclick="NarrationEngine.play()">▶️ Αφήγηση</button><button class="secondary" onclick="NarrationEngine.pauseResume()">⏸️ Παύση / συνέχεια</button><button class="gold" onclick="NarrationEngine.stop()">⏹️ Διακοπή</button></div>
        <div class="voice-box"><label>Ταχύτητα <input id="rateControl" type="range" min="0.75" max="1.25" step="0.05" value="0.95"></label><label>Φωνή <select id="voiceSelect"></select></label></div>
        <h3>Τι πρέπει να κρατήσει ο μαθητής</h3><div class="learn-grid">${(s.learn||[]).map(x=>`<div class="learn-card">${x}</div>`).join('')}</div>
        <div class="story-note">Μετά την αφήγηση, ο μαθητής μπορεί να πάει στο αντίστοιχο κεφάλαιο, στον Ιστορικό Άτλαντα ή στο Campaign Mode για ενεργή εξάσκηση.</div>
      </div>`;
    loadVoices();
  }
  function play(){
    if(!state.selected) return;
    if(!canSpeak()){ alert('Ο browser δεν υποστηρίζει αυτόματη φωνητική αφήγηση. Το κείμενο εμφανίζεται για ανάγνωση.'); return; }
    stop();
    const u = new SpeechSynthesisUtterance(state.selected.text);
    u.lang = 'el-GR';
    u.rate = parseFloat((qs('rateControl')||{}).value || '0.95');
    const idx = parseInt((qs('voiceSelect')||{}).value,10);
    if(!Number.isNaN(idx) && state.voices[idx]) u.voice = state.voices[idx];
    window.speechSynthesis.speak(u);
    try{ if(window.IstoriaJourney && window.IstoriaJourney.addXP) window.IstoriaJourney.addXP(10,'Άκουσε ιστορική αφήγηση'); }catch(e){}
  }
  function pauseResume(){ if(!canSpeak()) return; const s=window.speechSynthesis; if(s.paused) s.resume(); else if(s.speaking) s.pause(); }
  function stop(){ if(canSpeak()) window.speechSynthesis.cancel(); }
  window.NarrationEngine = { init, play, pauseResume, stop };
  document.addEventListener('DOMContentLoaded', init);
})();
