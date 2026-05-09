(function(){
  const LS_KEY = 'istoria_campaign_profile_v1';
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  function loadProfile(){
    try { return JSON.parse(localStorage.getItem(LS_KEY)) || {completed:{}, xp:0, bestScore:0, plays:0}; }
    catch(e){ return {completed:{}, xp:0, bestScore:0, plays:0}; }
  }
  function saveProfile(profile){ localStorage.setItem(LS_KEY, JSON.stringify(profile)); }
  function addJourneyXP(xp){
    try {
      if(window.IstoriaStorage && window.IstoriaStorage.addXP){ window.IstoriaStorage.addXP(xp); return; }
      const key='istoria_student_profile_v1';
      const p=JSON.parse(localStorage.getItem(key)||'{}');
      p.xp=(p.xp||0)+xp;
      localStorage.setItem(key, JSON.stringify(p));
    } catch(e){}
  }
  async function loadCampaign(){
    const res = await fetch('data/campaign.json');
    if(!res.ok) throw new Error('Δεν βρέθηκε το data/campaign.json');
    return await res.json();
  }
  function flattenMissions(data){
    return data.chapters.flatMap(ch => ch.missions.map(m => ({...m, chapterId: ch.id, chapterTitle: ch.title})));
  }
  function renderStats(profile, missions){
    const doneCount = Object.keys(profile.completed || {}).length;
    const total = missions.length;
    $('#campaignStats').innerHTML = `
      <div class="sim-stat"><strong>${doneCount}/${total}</strong><span>αποστολές</span></div>
      <div class="sim-stat"><strong>${profile.xp || 0}</strong><span>campaign XP</span></div>
      <div class="sim-stat"><strong>${profile.bestScore || 0}</strong><span>καλύτερη στρατηγική</span></div>
      <div class="sim-stat"><strong>${profile.plays || 0}</strong><span>προσπάθειες</span></div>`;
  }
  function renderMap(data, profile){
    const wrap = $('#campaignMap');
    wrap.innerHTML = '';
    data.chapters.forEach((ch, idx) => {
      const total = ch.missions.length;
      const done = ch.missions.filter(m => profile.completed && profile.completed[m.id]).length;
      const card = document.createElement('button');
      card.className = 'sim-chapter-card' + (done === total ? ' complete' : '') + (done > 0 && done < total ? ' active' : '');
      card.innerHTML = `<span class="sim-step">${idx+1}</span><strong>${ch.title}</strong><small>${done}/${total} αποστολές</small>`;
      card.onclick = () => document.getElementById('chapter-'+ch.id).scrollIntoView({behavior:'smooth', block:'start'});
      wrap.appendChild(card);
    });
  }
  function renderMissions(data, profile){
    const wrap = $('#missions');
    wrap.innerHTML = '';
    data.chapters.forEach(ch => {
      const section = document.createElement('section');
      section.className = 'sim-section';
      section.id = 'chapter-' + ch.id;
      section.innerHTML = `<h2>${ch.title}</h2><div class="sim-mission-grid"></div>`;
      const grid = $('.sim-mission-grid', section);
      ch.missions.forEach(m => {
        const completed = profile.completed && profile.completed[m.id];
        const card = document.createElement('article');
        card.className = 'sim-mission-card' + (completed ? ' complete' : '');
        card.innerHTML = `
          <div class="sim-emoji">${m.emoji}</div>
          <h3>${m.title}</h3>
          <p><strong>${m.period}</strong></p>
          <p>${m.role}</p>
          <div class="sim-card-footer">
            <span>${completed ? '✅ ολοκληρώθηκε' : '🎯 διαθέσιμη'}</span>
            <button class="sim-btn">Παίξε αποστολή</button>
          </div>`;
        $('.sim-btn', card).onclick = () => openMission(m);
        grid.appendChild(card);
      });
      wrap.appendChild(section);
    });
  }
  let currentMission = null;
  function openMission(m){
    currentMission = m;
    $('#missionTitle').textContent = `${m.emoji} ${m.title}`;
    $('#missionMeta').textContent = `${m.period} • ${m.chapterTitle || ''}`;
    $('#missionRole').textContent = m.role;
    $('#missionGoal').textContent = m.goal;
    $('#missionFact').textContent = m.fact;
    const choices = $('#missionChoices');
    choices.innerHTML = '';
    $('#missionResult').innerHTML = '';
    m.choices.forEach((c, idx) => {
      const btn = document.createElement('button');
      btn.className = 'choice-btn sim-choice';
      btn.innerHTML = `<strong>${idx+1}. ${c.text}</strong>`;
      btn.onclick = () => choose(c, idx);
      choices.appendChild(btn);
    });
    $('#missionModal').classList.add('open');
  }
  function choose(choice, idx){
    $$('.sim-choice').forEach(b => b.disabled = true);
    const scoreLabel = choice.score >= 3 ? 'Άριστη στρατηγική' : choice.score >= 2 ? 'Καλή στρατηγική' : choice.score >= 1 ? 'Μερικώς σωστή επιλογή' : 'Χρειάζεται επανεξέταση';
    $('#missionResult').innerHTML = `
      <div class="sim-result ${choice.score >= 3 ? 'good' : choice.score >= 1 ? 'mid' : 'bad'}">
        <h3>📜 Αποτέλεσμα: ${scoreLabel}</h3>
        <p>${choice.result}</p>
        <p><strong>🧠 Τι έμαθες:</strong> ${choice.lesson}</p>
        <p><strong>🎮 Rewards:</strong> +${choice.xp} XP</p>
      </div>`;
    const profile = loadProfile();
    profile.completed = profile.completed || {};
    if(!profile.completed[currentMission.id]) profile.xp = (profile.xp || 0) + choice.xp;
    profile.completed[currentMission.id] = {score: choice.score, xp: choice.xp, choice: idx, date: new Date().toISOString()};
    profile.bestScore = Math.max(profile.bestScore || 0, choice.score);
    profile.plays = (profile.plays || 0) + 1;
    saveProfile(profile);
    addJourneyXP(choice.xp);
    loadCampaign().then(data => init(data));
  }
  function init(data){
    const profile = loadProfile();
    const missions = flattenMissions(data);
    renderStats(profile, missions);
    renderMap(data, profile);
    renderMissions(data, profile);
  }
  window.IstoriaSimulation = { loadProfile, saveProfile };
  document.addEventListener('DOMContentLoaded', async () => {
    const close = $('#closeMission');
    if(close) close.onclick = () => $('#missionModal').classList.remove('open');
    const reset = $('#resetCampaign');
    if(reset) reset.onclick = () => { if(confirm('Να μηδενιστεί η πρόοδος Campaign;')){ localStorage.removeItem(LS_KEY); location.reload(); } };
    try { const data = await loadCampaign(); init(data); }
    catch(e){ $('#missions').innerHTML = `<div class="sim-error">${e.message}</div>`; }
  });
})();
