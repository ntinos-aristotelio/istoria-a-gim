/* Istoria V10 Phase 3 Adaptive Engine - weak points, recommendations, daily revision */
(function(){
  const TOPIC_HINTS = [
    {key:'χρονολογίες', words:['π.Χ','μ.Χ','αιώνα','χρόνο','χρονολογία','πότε','timeline','χρον']},
    {key:'πολιτεύματα', words:['δημοκρατία','ολιγαρχία','τυραννίδα','βασιλεία','πολίτευμα','άρχοντες','σύγκλητος']},
    {key:'πόλεμοι και μάχες', words:['πόλεμος','μάχη','συγκρού','εκστρατεία','στρατός','φάλαγγα','νίκη','ήττα']},
    {key:'πολιτισμοί', words:['πολιτισμός','τέχνη','γράμματα','θρησκεία','αγγεία','ειδώλια','γραφή']},
    {key:'γεωγραφία και αποικισμός', words:['θάλασσα','αποικ','πόλη','Μεσόγειο','Αίγυπτο','Ασία','Ελλάδα','Μακεδονία','Ρώμη']},
    {key:'καθημερινή ζωή', words:['καθημερινή','ζωή','εργασία','οικονομία','γεωργία','κτηνοτροφία','εμπόριο']}
  ];
  function now(){ return new Date().toISOString(); }
  function getChapterId(){
    const m = (location.pathname || '').match(/chapter(\d+)\.html/i);
    if(m) return m[1];
    if(document.body && document.body.dataset && document.body.dataset.chapter) return document.body.dataset.chapter;
    return 'general';
  }
  function topicFromText(text){
    const t = String(text || '').toLowerCase();
    let best = {key:'γενική κατανόηση', score:0};
    TOPIC_HINTS.forEach(function(topic){
      let score = 0;
      topic.words.forEach(function(w){ if(t.indexOf(String(w).toLowerCase()) !== -1) score++; });
      if(score > best.score) best = {key:topic.key, score:score};
    });
    return best.key;
  }
  function ensureAdaptive(profile){
    profile.adaptive = profile.adaptive || {attempts:[], topics:{}, recommendations:[], lastDailyRevision:null};
    profile.adaptive.attempts = Array.isArray(profile.adaptive.attempts) ? profile.adaptive.attempts : [];
    profile.adaptive.topics = profile.adaptive.topics || {};
    profile.adaptive.recommendations = Array.isArray(profile.adaptive.recommendations) ? profile.adaptive.recommendations : [];
    return profile.adaptive;
  }
  function recordTopic(profile, topic, correct){
    const adaptive = ensureAdaptive(profile);
    const item = adaptive.topics[topic] || {attempts:0, correct:0, mistakes:0, lastSeen:null};
    item.attempts += 1;
    if(correct) item.correct += 1; else item.mistakes += 1;
    item.lastSeen = now();
    item.mastery = item.attempts ? Math.round((item.correct / item.attempts) * 100) : 0;
    adaptive.topics[topic] = item;
  }
  function buildRecommendations(profile){
    const adaptive = ensureAdaptive(profile);
    const weak = Object.keys(adaptive.topics).map(function(key){
      const t = adaptive.topics[key];
      return {topic:key, mastery:t.mastery||0, mistakes:t.mistakes||0, attempts:t.attempts||0};
    }).filter(function(t){ return t.attempts >= 1 && (t.mastery < 70 || t.mistakes >= 2); })
      .sort(function(a,b){ return (b.mistakes-a.mistakes) || (a.mastery-b.mastery); });
    adaptive.recommendations = weak.slice(0,5).map(function(t){
      return {
        topic:t.topic,
        message:'Κάνε σύντομη επανάληψη στο θέμα: ' + t.topic,
        reason:'Επίδοση ' + t.mastery + '% σε ' + t.attempts + ' προσπάθειες.',
        createdAt:now()
      };
    });
    profile.weakTopics = profile.weakTopics || {};
    weak.forEach(function(t){ profile.weakTopics[t.topic] = {mastery:t.mastery, mistakes:t.mistakes, attempts:t.attempts, updatedAt:now()}; });
    return adaptive.recommendations;
  }
  function recordQuizAttempt(payload){
    payload = payload || {};
    if(!window.IstoriaStorage) return;
    window.IstoriaStorage.update(function(profile){
      const adaptive = ensureAdaptive(profile);
      const chapterId = payload.chapterId || getChapterId();
      const questions = payload.questions || window.questions || [];
      const answers = payload.answers || [];
      questions.forEach(function(q, index){
        const selected = answers[index];
        const correct = Number(selected) === Number(q.a);
        const topic = q.topic || topicFromText((q.q || '') + ' ' + (q.options || []).join(' '));
        recordTopic(profile, topic, correct);
      });
      adaptive.attempts.push({
        type:'quiz', chapterId:chapterId, score:payload.score||0, total:payload.total||questions.length||0,
        percent:payload.total ? Math.round((payload.score/payload.total)*100) : 0,
        createdAt:now()
      });
      if(adaptive.attempts.length > 80) adaptive.attempts = adaptive.attempts.slice(-80);
      buildRecommendations(profile);
    });
  }
  function getSummary(){
    const profile = window.IstoriaStorage ? window.IstoriaStorage.load() : {};
    const adaptive = ensureAdaptive(profile);
    const topics = Object.keys(adaptive.topics).map(function(key){ return Object.assign({topic:key}, adaptive.topics[key]); })
      .sort(function(a,b){ return (a.mastery||0)-(b.mastery||0); });
    return {profile:profile, topics:topics, recommendations:adaptive.recommendations || []};
  }
  function renderAdaptivePanel(targetId){
    const target = document.getElementById(targetId || 'adaptivePanel');
    if(!target) return;
    const summary = getSummary();
    const recs = summary.recommendations || [];
    const weak = summary.topics.slice(0,4);
    const recHtml = recs.length ? recs.map(function(r){ return '<li><strong>'+r.topic+'</strong>: '+r.reason+'</li>'; }).join('') : '<li>Δεν υπάρχουν ακόμα αρκετά δεδομένα. Κάνε ένα quiz για να φτιαχτεί προφίλ.</li>';
    const weakHtml = weak.length ? weak.map(function(t){ return '<div class="weak-card '+((t.mastery||0)<60?'urgent':'ok')+'">'+t.topic+'<br><small>Mastery: '+(t.mastery||0)+'% • Λάθη: '+(t.mistakes||0)+'</small></div>'; }).join('') : '<div class="weak-card">Ξεκίνα με ένα quiz για να δω τι χρειάζεται επανάληψη.</div>';
    target.innerHTML = '<div class="weak-panel"><h2>🧠 Έξυπνη επανάληψη</h2><p>Το app παρακολουθεί λάθη και προτείνει τα σημεία που χρειάζονται ενίσχυση.</p><div class="weak-list">'+weakHtml+'</div><div class="note"><strong>Προτάσεις:</strong><ul>'+recHtml+'</ul></div></div>';
  }
  function autoMount(){
    if(document.getElementById('adaptivePanel')) renderAdaptivePanel('adaptivePanel');
  }
  window.IstoriaAdaptive = {recordQuizAttempt:recordQuizAttempt, topicFromText:topicFromText, getSummary:getSummary, render:renderAdaptivePanel, buildRecommendations:buildRecommendations};
  document.addEventListener('DOMContentLoaded', autoMount);
})();
