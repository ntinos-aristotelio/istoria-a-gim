
(function(){
  const state = { knowledge:null, activeTopic:null };
  const norm = s => (s||'').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  async function loadKnowledge(){
    if(state.knowledge) return state.knowledge;
    try{
      const r = await fetch('data/mentorKnowledge.json');
      state.knowledge = await r.json();
    }catch(e){
      state.knowledge = {topics:[],quickPrompts:[]};
    }
    return state.knowledge;
  }
  function getProfileSummary(){
    let out = {xp:0,level:1,completed:0,weak:0};
    try{
      const raw = localStorage.getItem('istoriaStudentProfile') || localStorage.getItem('istoria_v10_profile');
      const p = raw ? JSON.parse(raw) : {};
      out.xp = p.xp || p.totalXp || 0;
      out.level = p.level || Math.max(1, Math.floor(out.xp/300)+1);
      out.completed = Array.isArray(p.completedChapters) ? p.completedChapters.length : (p.completed||0);
      out.weak = Array.isArray(p.weakTopics) ? p.weakTopics.length : 0;
    }catch(e){}
    return out;
  }
  function matchTopic(question, topics){
    const q = norm(question);
    let best = null, score = 0;
    for(const t of topics){
      let s = 0;
      for(const k of (t.keywords||[])) if(q.includes(norm(k))) s += 2;
      if(q.includes(norm(t.title))) s += 3;
      if(s > score){score=s; best=t;}
    }
    return best || topics[0];
  }
  function renderTopics(){
    const box = document.getElementById('mentorTopics'); if(!box || !state.knowledge) return;
    box.innerHTML = state.knowledge.topics.map(t=>`<button class="topic-btn" data-topic="${t.id}">📌 ${t.title}</button>`).join('');
    box.querySelectorAll('button').forEach(btn=>btn.addEventListener('click',()=>selectTopic(btn.dataset.topic)));
  }
  function renderQuickPrompts(){
    const box = document.getElementById('quickPrompts'); if(!box || !state.knowledge) return;
    box.innerHTML = state.knowledge.quickPrompts.map(p=>`<button class="prompt-chip">${p}</button>`).join('');
    box.querySelectorAll('button').forEach(btn=>btn.addEventListener('click',()=>{document.getElementById('mentorQuestion').value=btn.textContent; askMentor();}));
  }
  function selectTopic(id){
    const t = state.knowledge.topics.find(x=>x.id===id) || state.knowledge.topics[0];
    state.activeTopic = t;
    document.querySelectorAll('.topic-btn').forEach(b=>b.classList.toggle('active', b.dataset.topic===id));
    showAnswer(`<strong>${t.title}</strong><br><br><b>Hint:</b> ${t.hint}<br><br><b>Εξήγηση:</b> ${t.explain}`);
  }
  function showAnswer(html){
    const ans = document.getElementById('mentorAnswer'); if(ans) ans.innerHTML = html;
  }
  function askMentor(){
    const input = document.getElementById('mentorQuestion');
    const q = input ? input.value.trim() : '';
    if(!q){ showAnswer('Γράψε μια απορία ή διάλεξε ένα θέμα από τη λίστα.'); return; }
    const t = matchTopic(q, state.knowledge.topics||[]);
    state.activeTopic = t;
    const study = getProfileSummary();
    const extra = study.weak ? 'Βλέπω ότι υπάρχουν αδύναμα σημεία στο προφίλ σου· ξεκίνα με σύντομη επανάληψη και μετά κάνε 3 ερωτήσεις.' : 'Καλή στιγμή για σύντομη επανάληψη και ένα mini quiz.';
    showAnswer(`<strong>Οδηγός:</strong> Νομίζω ότι η απορία σου ανήκει στο θέμα <b>${t.title}</b>.<br><br><b>Σκέψου πρώτα:</b> ${t.hint}<br><br><b>Γιατί:</b> ${t.explain}<br><br><b>Πρόταση μελέτης:</b> ${extra}`);
  }
  function explainCorrectWrong(kind){
    const t = state.activeTopic || (state.knowledge.topics||[])[0];
    if(kind==='correct'){
      showAnswer(`<strong>Γιατί είναι σωστό;</strong><br>Η απάντηση ταιριάζει με το βασικό νόημα του θέματος <b>${t.title}</b>.<br><br>${t.explain}`);
    }else{
      showAnswer(`<strong>Γιατί μπορεί να είναι λάθος;</strong><br>Συνήθως το λάθος γίνεται όταν μπερδεύουμε τόπο, εποχή ή αιτία-αποτέλεσμα.<br><br><b>Hint:</b> ${t.hint}`);
    }
  }
  async function init(){
    await loadKnowledge(); renderTopics(); renderQuickPrompts();
    const profile = getProfileSummary();
    const stats = document.getElementById('mentorStats');
    if(stats) stats.innerHTML = `<div class="feedback-card good">Level ${profile.level}</div><div class="feedback-card">XP ${profile.xp}</div><div class="feedback-card">Κεφάλαια ${profile.completed}/10</div><div class="feedback-card ${profile.weak?'warn':''}">Αδύναμα σημεία ${profile.weak}</div>`;
    if(state.knowledge.topics && state.knowledge.topics[0]) selectTopic(state.knowledge.topics[0].id);
  }
  window.askMentor = askMentor;
  window.explainMentor = explainCorrectWrong;
  window.addMentorFloatingButton = function(){
    if(document.querySelector('.floating-mentor')) return;
    const a = document.createElement('a'); a.href='mentor.html'; a.className='floating-mentor'; a.textContent='🧭 Ιστορικός Οδηγός'; document.body.appendChild(a);
  };
  document.addEventListener('DOMContentLoaded', init);
})();
