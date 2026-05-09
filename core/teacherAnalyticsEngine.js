
(function(){
  const chapters = [
    'Η Εποχή του Λίθου','Η Εποχή του Χαλκού','Ο ελληνικός κόσμος 1100-800 π.Χ.','Αρχαϊκή εποχή','Η ηγεμονία της Αθήνας','Ο Πελοποννησιακός πόλεμος','Η Μακεδονία και ο Μέγας Αλέξανδρος','Τα ελληνιστικά χρόνια','Η Ρώμη και ο ελληνικός κόσμος','Η Ρωμαϊκή αυτοκρατορία'
  ];
  function readJSON(key, fallback){ try{return JSON.parse(localStorage.getItem(key)||'') || fallback;}catch(e){return fallback;} }
  function getProfile(){ return readJSON('istoriaV10Profile', {xp:0,level:1,rank:'Αρχάριος',streak:0,completedChapters:[],quizScores:{},mistakes:[],weakTopics:[]}); }
  function legacyProgress(){ return readJSON('istoriaProgress', {}); }
  function pct(n){ return Math.max(0, Math.min(100, Math.round(n))); }
  function chapterScore(i, profile, legacy){
    const keys = [`chapter${i}Quiz`,`chapter${i}`,`ch${i}`];
    let score = null;
    for(const k of keys){ if(profile.quizScores && profile.quizScores[k]!=null) score = Number(profile.quizScores[k]); }
    if(score==null && legacy[`chapter${i}`] && legacy[`chapter${i}`].score!=null) score = Number(legacy[`chapter${i}`].score);
    return Number.isFinite(score) ? score : null;
  }
  function completed(i, profile, legacy){
    return (profile.completedChapters||[]).includes(i) || (profile.completedChapters||[]).includes(String(i)) || !!(legacy[`chapter${i}`] && legacy[`chapter${i}`].completed);
  }
  function buildAnalytics(){
    const profile=getProfile(), legacy=legacyProgress();
    const rows=[]; let completedCount=0, scoreSum=0, scoreCount=0;
    for(let i=1;i<=10;i++){
      const done=completed(i,profile,legacy); if(done) completedCount++;
      const score=chapterScore(i,profile,legacy); if(score!=null){scoreSum+=score;scoreCount++;}
      let status = done ? 'Ολοκληρωμένο' : 'Σε εξέλιξη';
      let risk = score==null ? 'medium' : score>=75 ? 'good' : score>=50 ? 'medium' : 'weak';
      if(!done && score==null) risk='medium';
      rows.push({i,title:chapters[i-1],done,score,status,risk});
    }
    const avg = scoreCount ? Math.round(scoreSum/scoreCount) : null;
    const weakTopics = Array.from(new Set([...(profile.weakTopics||[]),...(profile.mistakes||[]).map(m=>m.topic||m.chapter||m.question).filter(Boolean)])).slice(0,8);
    return {profile,rows,completedCount,avg,weakTopics};
  }
  function recommendation(data){
    const weak=data.rows.filter(r=>r.risk==='weak');
    const unfinished=data.rows.filter(r=>!r.done);
    if(weak.length) return `Προτεραιότητα: επανάληψη στο ${weak[0].title}. Υπάρχει χαμηλή επίδοση ή συχνά λάθη.`;
    if(unfinished.length) return `Επόμενος στόχος: ολοκλήρωση στο ${unfinished[0].title}.`;
    if(data.avg!==null && data.avg<80) return 'Καλή συνολική πορεία. Πρότεινε στοχευμένο Mega Quiz για βελτίωση ακρίβειας.';
    return 'Πολύ δυνατή πορεία. Πρότεινε σύνθετες αποστολές και ερωτήσεις αιτίας-αποτελέσματος.';
  }
  function renderTeacherAnalytics(){
    const data=buildAnalytics();
    const set=(id,val)=>{const el=document.getElementById(id); if(el) el.textContent=val;};
    set('taCompleted', `${data.completedCount}/10`);
    set('taAverage', data.avg==null?'—':data.avg+'%');
    set('taXP', data.profile.xp||0);
    set('taRank', data.profile.rank || ('Level '+(data.profile.level||1)));
    const tbody=document.getElementById('taTableBody');
    if(tbody){ tbody.innerHTML=data.rows.map(r=>`<tr><td>Κεφ. ${r.i}</td><td>${r.title}</td><td>${r.status}</td><td>${r.score==null?'—':r.score+'%'}</td><td>${r.risk==='good'?'Δυνατό':r.risk==='weak'?'Θέλει δουλειά':'Μέτριο/άγνωστο'}</td></tr>`).join(''); }
    const heat=document.getElementById('taHeatmap');
    if(heat){ heat.innerHTML=data.rows.map(r=>`<div class="heat-cell ${r.risk}">Κ${r.i}<br><small>${r.score==null?'—':r.score+'%'}</small></div>`).join(''); }
    const weak=document.getElementById('taWeakTopics');
    if(weak){ weak.innerHTML = data.weakTopics.length ? data.weakTopics.map(w=>`<div class="heat-cell weak">${String(w).slice(0,42)}</div>`).join('') : '<div class="heat-cell good">Δεν έχουν καταγραφεί αδύναμα σημεία ακόμα</div>'; }
    set('taRecommendation', recommendation(data));
    const report=document.getElementById('taExport');
    if(report){
      report.value = `Teacher Analytics - Ιστορία Α Γυμνασίου\n\nΟλοκληρωμένα κεφάλαια: ${data.completedCount}/10\nΜέσο σκορ: ${data.avg==null?'Δεν υπάρχουν αρκετά δεδομένα':data.avg+'%'}\nXP: ${data.profile.xp||0}\nRank: ${data.profile.rank||'—'}\n\nΠρόταση: ${recommendation(data)}\n\nΑνά κεφάλαιο:\n` + data.rows.map(r=>`Κ${r.i}: ${r.title} | ${r.status} | Σκορ: ${r.score==null?'—':r.score+'%'} | ${r.risk}`).join('\n');
    }
  }
  window.renderTeacherAnalytics=renderTeacherAnalytics;
  window.copyTeacherReport=function(){ const el=document.getElementById('taExport'); if(!el)return; el.select(); navigator.clipboard?.writeText(el.value).then(()=>alert('Η αναφορά εκπαιδευτικού αντιγράφηκε.')).catch(()=>document.execCommand('copy')); };
  window.resetTeacherDemo=function(){ if(confirm('Να καθαριστούν τα αποθηκευμένα demo/progress δεδομένα από αυτόν τον browser;')){ ['istoriaV10Profile','istoriaProgress'].forEach(k=>localStorage.removeItem(k)); renderTeacherAnalytics(); } };
})();
