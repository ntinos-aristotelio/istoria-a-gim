
(function(){
  const visitMap={
    'world-map.html':{type:'atlas',xp:15,msg:'Εξερεύνηση Άτλαντα'},
    'historical-campaign.html':{type:'simulation',xp:20,msg:'Ιστορική αποστολή'},
    'intelligent-revision.html':{type:'revision',xp:15,msg:'Έξυπνη επανάληψη'},
    'smart-study.html':{type:'progress',xp:10,msg:'Smart Study'},
    'narration.html':{type:'narration',xp:10,msg:'Ιστορική αφήγηση'},
    'mentor.html':{type:'mentor',xp:10,msg:'Ιστορικός οδηγός'}
  };
  const chapters=[['chapter1','Η Εποχή του Λίθου'],['chapter2','Η Εποχή του Χαλκού'],['chapter3','1100-800 π.Χ.'],['chapter4','Αρχαϊκή εποχή'],['chapter5','Ηγεμονία Αθήνας'],['chapter6','Πελοποννησιακός πόλεμος'],['chapter7','Μακεδονία'],['chapter8','Ελληνιστικός κόσμος'],['chapter9','Ρώμη και ελληνικός κόσμος'],['chapter10','Ρωμαϊκή αυτοκρατορία']];
  function toast(title,sub){
    if(document.querySelector('.v13-toast')) return;
    const t=document.createElement('div'); t.className='v13-toast'; t.innerHTML='🏆 '+title+'<small>'+sub+'</small>'; document.body.appendChild(t);
    setTimeout(()=>t.classList.add('show'),50); setTimeout(()=>t.classList.remove('show'),3600); setTimeout(()=>t.remove(),4100);
  }
  function ensureApi(){return window.IstoriaAchievements&&window.IstoriaMastery}
  function state(){return window.IstoriaAchievements?window.IstoriaAchievements.state():{xp:0,counts:{},unlocked:{}}}
  function track(){
    if(!ensureApi()) return;
    const page=(location.pathname.split('/').pop()||'index.html'); const cfg=visitMap[page]; if(!cfg) return;
    const key='v13_visit_'+page; if(sessionStorage.getItem(key)) return; sessionStorage.setItem(key,'1');
    IstoriaAchievements.addXP(cfg.xp); IstoriaAchievements.count(cfg.type,1);
    if(cfg.type==='simulation') IstoriaMastery.add('chapter4','simulation',8);
    if(cfg.type==='atlas') IstoriaMastery.add('chapter2','revision',5);
    if(cfg.type==='revision') IstoriaMastery.add('chapter5','revision',8);
    toast('Πρόοδος καταγράφηκε',cfg.msg+' • +'+cfg.xp+' XP');
  }
  function avgMastery(){let a=0;chapters.forEach(c=>a+=window.IstoriaMastery?IstoriaMastery.pct(c[0]):0);return Math.round(a/chapters.length)}
  function renderProfile(){
    const roots=document.querySelectorAll('[data-v13-profile]'); if(!roots.length||!ensureApi()) return;
    const s=state(); const xp=s.xp||0; const unlocked=Object.keys(s.unlocked||{}).length; const avg=avgMastery();
    roots.forEach(root=>{root.innerHTML='<div class="v13-profile-card"><div class="eyebrow">V13 Student Profile</div><h2>Πρόοδος & Mastery</h2><div class="v13-profile-grid"><div class="v13-profile-stat"><span class="num">'+xp+'</span>XP</div><div class="v13-profile-stat"><span class="num">'+avg+'%</span>Μέσο mastery<div class="v13-mini-bar"><div class="v13-mini-fill" style="width:'+avg+'%"></div></div></div><div class="v13-profile-stat"><span class="num">'+unlocked+'</span>Achievements</div><div class="v13-profile-stat"><a class="gold" href="achievements.html">Άνοιγμα επιτευγμάτων</a></div></div></div>'})
  }
  function renderTeacherMastery(){
    const root=document.getElementById('v13TeacherMastery'); if(!root||!window.IstoriaMastery) return;
    root.innerHTML='<div class="v13-teacher-mastery"><div class="eyebrow">V13 Mastery</div><h2>Mastery ανά κεφάλαιο</h2>'+chapters.map(c=>{const p=IstoriaMastery.pct(c[0]);return '<div class="v13-master-row"><strong>'+c[1]+'</strong><div>'+p+'%<div class="v13-mini-bar"><div class="v13-mini-fill" style="width:'+p+'%"></div></div></div></div>'}).join('')+'</div>';
  }
  function renderMentorReaction(){
    const root=document.getElementById('v13MentorReaction'); if(!root||!ensureApi()) return;
    const avg=avgMastery(); const msg=avg>=70?'Εξαιρετικά! Ο μαθητής δείχνει σταθερή κατανόηση. Προτείνεται σύνθετη επανάληψη με χάρτη και campaign.':'Ο οδηγός προτείνει μικρή επανάληψη σε 2-3 αδύναμα κεφάλαια πριν συνεχίσει σε νέο simulation.';
    root.innerHTML='<div class="v13-mentor-reaction">🧭 Mentor feedback: '+msg+'</div>';
  }
  function init(){track();renderProfile();renderTeacherMastery();renderMentorReaction();}
  document.addEventListener('DOMContentLoaded',()=>setTimeout(init,80));
  window.IstoriaV13Integration={track,renderProfile,renderTeacherMastery,renderMentorReaction};
})();
