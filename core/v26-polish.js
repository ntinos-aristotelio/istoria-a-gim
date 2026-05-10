(function(){
  const TOTAL_CHAPTERS = 10;

  function readJSON(key, fallback){
    try{
      const raw = localStorage.getItem(key);
      if(!raw) return fallback;
      const parsed = JSON.parse(raw);
      return parsed || fallback;
    }catch(e){
      return fallback;
    }
  }

  function isCompleted(value){
    if(value === true) return true;
    if(!value || typeof value !== 'object') return false;
    return value.completed === true || value.done === true || value.status === 'completed';
  }

  function collectFromUnified(progress, result){
    const chapters = progress && progress.chapters ? progress.chapters : {};
    Object.keys(chapters).forEach(function(id){
      const chapter = chapters[id] || {};
      if(isCompleted(chapter)) result.completed.add(String(id));
      const score = Number(chapter.bestScore ?? chapter.score ?? chapter.quizScore ?? chapter.lastScore);
      if(!Number.isNaN(score)) result.scores['chapter' + id] = score;
    });

    if(progress && progress.daily){
      const dailyScore = Number(progress.daily.bestScore ?? progress.daily.lastScore);
      if(!Number.isNaN(dailyScore)) result.scores.daily = dailyScore;
      if(progress.daily.streak != null) result.streak = Math.max(result.streak, Number(progress.daily.streak) || 0);
    }
  }

  function collectFromLegacy(legacy, result){
    Object.keys(legacy || {}).forEach(function(key){
      const match = key.match(/^chapter(\d+)$/);
      if(!match) return;
      const id = match[1];
      const chapter = legacy[key] || {};
      if(isCompleted(chapter)) result.completed.add(String(id));
      const score = Number(chapter.bestScore ?? chapter.score ?? chapter.quizScore ?? chapter.lastScore);
      if(!Number.isNaN(score)) result.scores[key] = score;
    });

    if(legacy && legacy.dailyChallenge){
      const dailyScore = Number(legacy.dailyChallenge.bestScore ?? legacy.dailyChallenge.lastScore);
      if(!Number.isNaN(dailyScore)) result.scores.dailyChallenge = dailyScore;
      if(legacy.dailyChallenge.streak != null) result.streak = Math.max(result.streak, Number(legacy.dailyChallenge.streak) || 0);
    }
  }

  function collectFromProfile(profile, result){
    if(!profile || typeof profile !== 'object') return;

    const completed = profile.completedChapters || profile.completed || [];
    if(Array.isArray(completed)){
      completed.forEach(function(id){ result.completed.add(String(id).replace(/^chapter/, '')); });
    }else if(completed && typeof completed === 'object'){
      Object.keys(completed).forEach(function(id){ if(isCompleted(completed[id]) || completed[id] === true) result.completed.add(String(id).replace(/^chapter/, '')); });
    }

    const scores = profile.quizScores || profile.scores || {};
    Object.keys(scores).forEach(function(key){
      const score = Number(scores[key]);
      if(!Number.isNaN(score)) result.scores[key] = score;
    });

    result.xp = Math.max(result.xp, Number(profile.xp || profile.totalXP || 0) || 0);
    result.streak = Math.max(result.streak, Number(profile.streak || 0) || 0);
  }

  function getProgress(){
    const result = {completed:new Set(), scores:{}, xp:0, streak:0};

    collectFromUnified(readJSON('istoriaAGymnasiouProgress', {}), result);
    collectFromLegacy(readJSON('istoriaProgress', {}), result);
    collectFromProfile(readJSON('istoriaV10Profile', {}), result);
    collectFromProfile(readJSON('istoria_profile', {}), result);

    const campaign = readJSON('istoriaCampaignProfile', {});
    result.xp += Number(campaign.xp || 0) || 0;

    const daily = readJSON('istoriaDaily', {});
    if(daily && daily.streak != null) result.streak = Math.max(result.streak, Number(daily.streak) || 0);

    return {
      completed: result.completed.size,
      scores: result.scores,
      xp: result.xp,
      streak: result.streak
    };
  }

  function renderHub(){
    const host = document.getElementById('v26StudentHub');
    if(!host) return;

    const st = getProgress();
    const scoreVals = Object.values(st.scores || {}).map(Number).filter(function(n){ return !Number.isNaN(n); });
    const avg = scoreVals.length ? Math.round(scoreVals.reduce(function(a,b){ return a + b; }, 0) / scoreVals.length) + '%' : '—';

    host.innerHTML = '<section class="v26-hub-panel">' +
      '<div class="eyebrow">V26 Student Hub</div>' +
      '<h2>Συνέχισε τη μαθησιακή διαδρομή</h2>' +
      '<div class="v26-hub-grid">' +
        '<div class="v26-hub-card">' +
          '<h3>Προτεινόμενο επόμενο βήμα</h3>' +
          '<p>Ξεκίνα από Smart Study για να δεις τι χρειάζεται επανάληψη και μετά άνοιξε τον Άτλαντα για χωρική κατανόηση.</p>' +
          '<div class="v26-actions">' +
            '<a class="gold" href="smart-study.html">Smart Study</a>' +
            '<a class="secondary" href="world-map.html">Άτλαντας</a>' +
            '<a class="blue" href="intelligent-revision.html">Revision</a>' +
          '</div>' +
        '</div>' +
        '<div class="v26-hub-card"><div class="v26-stat">' + st.completed + '/' + TOTAL_CHAPTERS + '</div><div class="v26-muted">Κεφάλαια</div><p>Πρόοδος κεφαλαίων</p></div>' +
        '<div class="v26-hub-card"><div class="v26-stat">' + avg + '</div><div class="v26-muted">Μέσο σκορ</div><p>Από διαθέσιμα quiz</p></div>' +
        '<div class="v26-hub-card"><div class="v26-stat">' + st.xp + '</div><div class="v26-muted">XP</div><p>Journey progress</p><span class="v26-pill">Streak: ' + st.streak + '</span></div>' +
      '</div>' +
    '</section>';
  }

  window.IstoriaV26 = window.IstoriaV26 || {};
  window.IstoriaV26.renderHub = renderHub;

  document.addEventListener('DOMContentLoaded', renderHub);
  window.addEventListener('storage', renderHub);
})();
