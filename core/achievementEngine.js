
(function(){
  const KEY='istoria_v13_achievements';
  function state(){try{return JSON.parse(localStorage.getItem(KEY)||'{"xp":0,"counts":{},"unlocked":{}}')}catch(e){return {xp:0,counts:{},unlocked:{}}}}
  function save(s){localStorage.setItem(KEY,JSON.stringify(s));}
  function addXP(n){const s=state();s.xp=(s.xp||0)+n;save(s);return s.xp;}
  function count(type,n=1){const s=state();s.counts=s.counts||{};s.counts[type]=(s.counts[type]||0)+n;save(s);return s.counts[type];}
  function unlock(id){const s=state();s.unlocked=s.unlocked||{};s.unlocked[id]=true;save(s);}
  function currentRank(ranks){const s=state();let r=ranks[0];for(const x of ranks){if((s.xp||0)>=x.xp)r=x}return r;}
  async function render(){
    const root=document.getElementById('achievementApp'); if(!root) return;
    const data=await fetch('data/achievements.json').then(r=>r.json()); const s=state();
    const chapters=data.chapters||[]; const ach=data.achievements||[]; const ranks=data.ranks||[]; const rank=currentRank(ranks);
    const avg=chapters.length?Math.round(chapters.reduce((a,c)=>a+(window.IstoriaMastery?IstoriaMastery.pct(c.id):0),0)/chapters.length):0;
    root.innerHTML=`<section class="ach-hero"><div class="muted">V13 Mastery System</div><h1>🏆 Επιτεύγματα & Mastery</h1><p>Εδώ ο μαθητής βλέπει συνολική πρόοδο, τίτλους, στόχους και ποια κεφάλαια χρειάζονται επανάληψη.</p><div class="ach-grid"><div class="rank-card active"><div class="kpi">${s.xp||0}</div><strong>XP</strong><div class="muted">Τρέχων τίτλος: ${rank?rank.title:'Νέος Ιστορικός'}</div></div><div class="rank-card"><div class="kpi">${avg}%</div><strong>Μέσο Mastery</strong><div class="muted">Με βάση quiz, επανάληψη και missions.</div></div><div class="rank-card"><div class="kpi">${Object.keys(s.unlocked||{}).length}</div><strong>Ξεκλειδωμένα</strong><div class="muted">Achievements</div></div></div><div class="ach-actions"><button onclick="IstoriaAchievements.demoProgress()">+ Demo πρόοδος</button><a class="green" href="smart-study.html">Smart Study</a><a class="gold" href="teacher.html">Teacher Analytics</a></div></section><h2 class="section-title">Ιστορικοί Τίτλοι</h2><div class="ach-grid">${ranks.map(x=>`<div class="rank-card ${(rank&&rank.id===x.id)?'active':''}"><h3>${x.title}</h3><div class="muted">Ξεκλειδώνει στα ${x.xp} XP</div></div>`).join('')}</div><h2 class="section-title">Mastery ανά κεφάλαιο</h2><div class="ach-grid">${chapters.map(c=>{let p=window.IstoriaMastery?IstoriaMastery.pct(c.id):0;return `<div class="mastery-card"><h3>${c.title}</h3><div class="muted">${c.group}</div><div class="mastery-bar"><div class="mastery-fill" style="width:${p}%"></div></div><strong>${p}% mastery</strong></div>`}).join('')}</div><h2 class="section-title">Achievements</h2><div class="ach-grid">${ach.map(a=>{let got=(s.unlocked||{})[a.id]||((s.counts||{})[a.type]||0)>=a.target;return `<div class="ach-card ${got?'unlocked':'locked'}"><div class="ach-icon">${a.icon}</div><h3>${a.title}</h3><p>${a.desc}</p><div class="muted">${got?'Ξεκλειδώθηκε':'Κλειδωμένο'} • στόχος ${a.target}</div></div>`}).join('')}</div>`;
  }
  function demoProgress(){addXP(120);count('progress',1);count('atlas',1);count('revision',1);if(window.IstoriaMastery){IstoriaMastery.add('chapter4','quiz',18);IstoriaMastery.add('chapter5','revision',12);IstoriaMastery.add('chapter7','simulation',20)}render();}
  window.IstoriaAchievements={state,save,addXP,count,unlock,render,demoProgress}; document.addEventListener('DOMContentLoaded',render);
})();
