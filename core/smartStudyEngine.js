/* Istoria V10 Phase 5 - Smart Study Mode Engine */
(function(){
  const esc = (s) => String(s || '').replace(/[&<>\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const $ = (id) => document.getElementById(id);

  async function loadJSON(path){
    const res = await fetch(path, {cache:'no-store'});
    if(!res.ok) throw new Error('Δεν φορτώθηκε: ' + path);
    return res.json();
  }

  function getProfile(){
    return window.IstoriaStorage ? window.IstoriaStorage.load() : {chapters:{}, adaptive:{topics:{}, recommendations:[]}};
  }

  function getAdaptiveSummary(){
    if(window.IstoriaAdaptive) return window.IstoriaAdaptive.getSummary();
    const profile = getProfile();
    const topics = Object.keys((profile.adaptive && profile.adaptive.topics) || {}).map(k => Object.assign({topic:k}, profile.adaptive.topics[k]));
    return {profile, topics, recommendations:[]};
  }

  function topicFromQuestion(q){
    const text = (q.q || '') + ' ' + (q.options || []).join(' ');
    return window.IstoriaAdaptive ? window.IstoriaAdaptive.topicFromText(text) : 'γενική κατανόηση';
  }

  function completionStats(profile, manifest){
    const total = (manifest.chapters || []).length;
    const chapters = profile.chapters || {};
    let completed = 0;
    let bestScores = [];
    Object.keys(chapters).forEach(id => {
      const c = chapters[id] || {};
      if(c.completed || c.bestScore >= 70 || c.lessonCompleted) completed++;
      if(typeof c.bestScore === 'number') bestScores.push(c.bestScore);
    });
    const avg = bestScores.length ? Math.round(bestScores.reduce((a,b)=>a+b,0)/bestScores.length) : 0;
    return {total, completed, avg};
  }

  function buildTopicMap(chapters){
    const map = {};
    chapters.forEach(ch => {
      (ch.quiz || []).forEach((q, qi) => {
        const topic = q.topic || topicFromQuestion(q);
        map[topic] = map[topic] || [];
        map[topic].push({chapter:ch, question:q, questionIndex:qi, topic});
      });
    });
    return map;
  }

  function selectQuestions(chapters, topic, limit){
    const topicMap = buildTopicMap(chapters);
    let pool = topic && topicMap[topic] ? topicMap[topic].slice() : [];
    if(pool.length < limit){
      const all = [];
      Object.keys(topicMap).forEach(k => all.push(...topicMap[k]));
      pool = pool.concat(all.filter(x => pool.indexOf(x) === -1));
    }
    return pool.sort(() => Math.random() - 0.5).slice(0, limit || 5);
  }

  function renderStats(profile, manifest, summary){
    const stats = completionStats(profile, manifest);
    const topicCount = (summary.topics || []).length;
    const weak = (summary.topics || []).filter(t => (t.mastery || 0) < 70 && (t.attempts || 0) > 0).length;
    const box = $('smartStats');
    if(!box) return;
    box.innerHTML = `
      <div class="smart-stat"><strong>${stats.completed}/${stats.total}</strong>Κεφάλαια με πρόοδο</div>
      <div class="smart-stat"><strong>${stats.avg}%</strong>Μέσο καλύτερο σκορ</div>
      <div class="smart-stat"><strong>${topicCount}</strong>Θέματα που μετρήθηκαν</div>
      <div class="smart-stat"><strong>${weak}</strong>Θέματα για επανάληψη</div>
    `;
  }

  function buildMissions(profile, manifest, chapters, summary){
    const topics = (summary.topics || []).slice().sort((a,b) => (a.mastery||0)-(b.mastery||0));
    const missions = [];
    topics.filter(t => (t.attempts||0) > 0 && (t.mastery||0) < 70).slice(0,3).forEach(t => {
      missions.push({
        type:'topic', status:'urgent', icon:'🧠', title:'Επανάληψη αδύναμου σημείου',
        subtitle:t.topic, detail:'Mastery ' + (t.mastery||0) + '% • Λάθη ' + (t.mistakes||0),
        topic:t.topic, count:5
      });
    });

    const chapterProgress = profile.chapters || {};
    const next = (manifest.chapters || []).find(ch => {
      const p = chapterProgress[ch.id] || {};
      return !(p.completed || p.bestScore >= 70 || p.lessonCompleted);
    });
    if(next){
      missions.push({type:'chapter', status:'ready', icon:'🎯', title:'Επόμενο κεφάλαιο', subtitle:next.title, detail:'Συνέχισε τη μαθησιακή διαδρομή.', chapterId:next.id, count:5});
    }

    missions.push({type:'mixed', status:'ready', icon:'⚡', title:'Γρήγορη έξυπνη επανάληψη', subtitle:'5 ερωτήσεις από όλη την ύλη', detail:'Ιδανικό για ζέσταμα πριν το διάβασμα.', count:5});
    missions.push({type:'timeline', status:'ready', icon:'⏳', title:'Χρονολογική σκέψη', subtitle:'Γεγονότα, αιτίες και συνέχεια', detail:'Μικρή αποστολή κατανόησης της ιστορικής ακολουθίας.', count:5});
    return missions.slice(0,6);
  }

  function renderMissions(missions){
    const box = $('smartMissions');
    if(!box) return;
    box.innerHTML = missions.map((m, i) => `
      <div class="smart-mission-card ${esc(m.status)}" data-mission-index="${i}">
        <h3>${esc(m.icon)} ${esc(m.title)}</h3>
        <p><strong>${esc(m.subtitle)}</strong></p>
        <p>${esc(m.detail)}</p>
        <span class="smart-meta ${m.status==='urgent'?'bad':'warn'}">${m.count || 5} ερωτήσεις</span>
        <span class="smart-meta">Smart Study</span>
      </div>
    `).join('');
    Array.from(box.querySelectorAll('[data-mission-index]')).forEach(el => {
      el.addEventListener('click', () => startMission(Number(el.dataset.missionIndex)));
    });
  }

  function renderRecommendations(summary){
    const box = $('smartRecommendations');
    if(!box) return;
    const recs = summary.recommendations || [];
    if(!recs.length){
      box.innerHTML = '<div class="note">Κάνε μερικά quiz για να δημιουργηθούν προσωποποιημένες προτάσεις. Μέχρι τότε, ξεκίνα με τη Γρήγορη έξυπνη επανάληψη.</div>';
      return;
    }
    box.innerHTML = '<ul>' + recs.slice(0,5).map(r => `<li><strong>${esc(r.topic)}</strong>: ${esc(r.reason || r.message)}</li>`).join('') + '</ul>';
  }

  let state = {manifest:null, chapters:[], missions:[], activeQuestions:[], answers:[]};

  function renderQuiz(items, title){
    state.activeQuestions = items || [];
    state.answers = [];
    const box = $('smartQuiz');
    if(!box) return;
    if(!items.length){
      box.innerHTML = '<div class="smart-result">Δεν βρέθηκαν αρκετές ερωτήσεις για αυτή την αποστολή.</div>';
      return;
    }
    box.innerHTML = `
      <h2>${esc(title || 'Smart Quiz')}</h2>
      <p>Απάντησε στις ερωτήσεις. Στο τέλος το σύστημα θα ενημερώσει το μαθησιακό προφίλ.</p>
      ${items.map((item, index) => {
        const q = item.question;
        return `<div class="smart-question" data-q="${index}">
          <h3>${index+1}. ${esc(q.q)}</h3>
          ${(q.options || []).map((opt, oi) => `<button class="smart-option" data-q="${index}" data-a="${oi}">${esc(opt)}</button>`).join('')}
          <span class="smart-meta">${esc(item.chapter.logo || item.chapter.title)}</span>
          <span class="smart-meta warn">${esc(item.topic)}</span>
        </div>`;
      }).join('')}
      <div class="smart-actions">
        <button class="secondary" id="smartGradeBtn">Ολοκλήρωση αποστολής</button>
        <button class="gold" id="smartNewBtn">Νέα έξυπνη αποστολή</button>
      </div>
      <div id="smartResult"></div>
    `;
    Array.from(box.querySelectorAll('.smart-option')).forEach(btn => {
      btn.addEventListener('click', () => chooseAnswer(btn));
    });
    const grade = $('smartGradeBtn');
    if(grade) grade.addEventListener('click', gradeMission);
    const fresh = $('smartNewBtn');
    if(fresh) fresh.addEventListener('click', () => startMission(state.missions.findIndex(m => m.type === 'mixed')));
    box.scrollIntoView({behavior:'smooth', block:'start'});
  }

  function chooseAnswer(btn){
    const qIndex = Number(btn.dataset.q);
    const aIndex = Number(btn.dataset.a);
    state.answers[qIndex] = aIndex;
    const parent = btn.closest('.smart-question');
    Array.from(parent.querySelectorAll('.smart-option')).forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
  }

  function gradeMission(){
    let score = 0;
    state.activeQuestions.forEach((item, index) => {
      const correctIndex = Number(item.question.a);
      const selected = Number(state.answers[index]);
      if(selected === correctIndex) score++;
      const parent = document.querySelector('.smart-question[data-q="'+index+'"]');
      if(parent){
        Array.from(parent.querySelectorAll('.smart-option')).forEach(btn => {
          const ai = Number(btn.dataset.a);
          if(ai === correctIndex) btn.classList.add('correct');
          else if(ai === selected) btn.classList.add('wrong');
          btn.disabled = true;
        });
      }
    });
    const total = state.activeQuestions.length;
    const questions = state.activeQuestions.map(x => Object.assign({}, x.question, {topic:x.topic}));
    if(window.IstoriaAdaptive) window.IstoriaAdaptive.recordQuizAttempt({score, total, questions, answers:state.answers, chapterId:'smart-study'});
    if(window.IstoriaStorage){
      window.IstoriaStorage.update(profile => {
        profile.smartStudy = profile.smartStudy || {attempts:0,bestScore:0,history:[]};
        profile.smartStudy.attempts += 1;
        profile.smartStudy.bestScore = Math.max(profile.smartStudy.bestScore || 0, Math.round((score/total)*100));
        profile.smartStudy.history.push({score,total,percent:Math.round((score/total)*100),createdAt:new Date().toISOString()});
        if(profile.smartStudy.history.length > 30) profile.smartStudy.history = profile.smartStudy.history.slice(-30);
      });
    }
    const result = $('smartResult');
    if(result){
      result.className = 'smart-result';
      result.innerHTML = `Αποτέλεσμα: ${score}/${total}. ${score >= Math.ceil(total*.7) ? 'Πολύ καλή προσπάθεια!' : 'Θέλει λίγη επανάληψη ακόμη — το σύστημα το κράτησε στα αδύναμα σημεία.'}`;
    }
    init(false);
  }

  function startMission(index){
    const mission = state.missions[index] || state.missions[0];
    if(!mission) return;
    let questions = [];
    if(mission.type === 'topic') questions = selectQuestions(state.chapters, mission.topic, mission.count || 5);
    else if(mission.type === 'chapter'){
      const chapter = state.chapters.find(ch => String(ch.id) === String(mission.chapterId));
      questions = ((chapter && chapter.quiz) || []).map((q, qi) => ({chapter, question:q, questionIndex:qi, topic:q.topic || topicFromQuestion(q)})).sort(() => Math.random()-.5).slice(0, mission.count || 5);
    } else if(mission.type === 'timeline'){
      const pool = [];
      state.chapters.forEach(ch => (ch.quiz || []).forEach((q, qi) => {
        const topic = q.topic || topicFromQuestion(q);
        if(topic === 'χρονολογίες' || /π\.Χ|μ\.Χ|πότε|αιώνα|χρόνο|μετά|πριν/i.test((q.q||'') + ' ' + (q.options||[]).join(' '))) pool.push({chapter:ch, question:q, questionIndex:qi, topic});
      }));
      questions = (pool.length ? pool : selectQuestions(state.chapters, null, 20)).sort(() => Math.random()-.5).slice(0, mission.count || 5);
    } else questions = selectQuestions(state.chapters, null, mission.count || 5);
    renderQuiz(questions, mission.icon + ' ' + mission.title);
  }

  async function init(scrollTop){
    const status = $('smartStatus');
    try{
      const manifest = await loadJSON('data/manifest.json');
      const chapters = [];
      for(const meta of manifest.chapters || []) chapters.push(await loadJSON('data/' + meta.file));
      const profile = getProfile();
      const summary = getAdaptiveSummary();
      state.manifest = manifest;
      state.chapters = chapters;
      renderStats(profile, manifest, summary);
      renderRecommendations(summary);
      state.missions = buildMissions(profile, manifest, chapters, summary);
      renderMissions(state.missions);
      if(status) status.textContent = '✅ Smart Study Mode ενεργό: χρησιμοποιεί το μαθησιακό προφίλ και τα data chapters.';
      if(scrollTop !== false && $('smartMissions')) $('smartMissions').scrollIntoView({behavior:'smooth', block:'nearest'});
    }catch(err){
      console.error(err);
      if(status) status.textContent = '⚠️ ' + err.message + ' — Άνοιξε το project μέσα από local server για να δουλέψει το fetch.';
    }
  }

  window.IstoriaSmartStudy = {init, startMission};
  document.addEventListener('DOMContentLoaded', () => init(true));
})();
