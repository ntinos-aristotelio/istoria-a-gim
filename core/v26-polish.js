(function(){
  function readJSON(key, fallback){try{return JSON.parse(localStorage.getItem(key)||'null')||fallback}catch(e){return fallback}}
  function getProgress(){
    const p=readJSON('istoria_profile',{}); const completed=p.completedChapters||p.completed||[];
    const scores=p.quizScores||p.scores||{}; const xp=p.xp||p.totalXP||0; const streak=p.streak||0;
    return {completed:Array.isArray(completed)?completed.length:Object.keys(completed||{}).length,scores,xp,streak};
  }
  window.IstoriaV26={renderHub:function(){
    const host=document.getElementById('v26StudentHub'); if(!host) return; const st=getProgress();
    const scoreVals=Object.values(st.scores||{}).map(Number).filter(n=>!isNaN(n));
    const avg=scoreVals.length?Math.round(scoreVals.reduce((a,b)=>a+b,0)/scoreVals.length)+'%':'—';
    host.innerHTML=`<section class="v26-hub-panel"><div class="eyebrow">V26 Student Hub</div><h2>Συνέχισε τη μαθησιακή διαδρομή</h2><div class="v26-hub-grid"><div class="v26-hub-card"><h3>Προτεινόμενο επόμενο βήμα</h3><p>Ξεκίνα από Smart Study για να δεις τι χρειάζεται επανάληψη και μετά άνοιξε τον Άτλαντα για χωρική κατανόηση.</p><div class="v26-actions"><a class="gold" href="smart-study.html">Smart Study</a><a class="secondary" href="world-map.html">Άτλαντας</a><a class="blue" href="intelligent-revision.html">Revision</a></div></div><div class="v26-hub-card"><div class="v26-stat">${st.completed}/10</div><div class="v26-muted">Κεφάλαια</div><p>Πρόοδος κεφαλαίων</p></div><div class="v26-hub-card"><div class="v26-stat">${avg}</div><div class="v26-muted">Μέσο σκορ</div><p>Από διαθέσιμα quiz</p></div><div class="v26-hub-card"><div class="v26-stat">${st.xp}</div><div class="v26-muted">XP</div><p>Journey progress</p><span class="v26-pill">Streak: ${st.streak}</span></div></div></section>`;
  }};
  document.addEventListener('DOMContentLoaded',function(){window.IstoriaV26.renderHub();});
})();
