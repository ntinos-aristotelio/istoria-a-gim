/* Istoria V10 Phase 8 - Intelligent Revision Scheduler */
(function(){
  const DAY = 24*60*60*1000;
  const PLAN_KEY = 'istoriaRevisionPlan';
  const DEFAULT_TOPICS = ['Εποχή του Λίθου','Εποχή του Χαλκού','Πόλη-κράτος','Αθήνα','Πελοποννησιακός πόλεμος','Μέγας Αλέξανδρος','Ελληνιστικά χρόνια','Ρώμη','Pax Romana'];
  function todayISO(){ return new Date().toISOString().slice(0,10); }
  function addDays(n){ return new Date(Date.now()+n*DAY).toISOString().slice(0,10); }
  function loadPlan(){ try{return JSON.parse(localStorage.getItem(PLAN_KEY))||{};}catch(e){return{};} }
  function savePlan(plan){ localStorage.setItem(PLAN_KEY, JSON.stringify(plan)); return plan; }
  function weakTopics(){
    const p = window.IstoriaStorage ? IstoriaStorage.load() : {};
    const weak = p.weakTopics || {};
    const keys = Object.keys(weak).sort((a,b)=>(weak[b]||0)-(weak[a]||0));
    return keys.length ? keys : DEFAULT_TOPICS.slice(0,4);
  }
  function generatePlan(){
    const topics = weakTopics();
    const plan = {createdAt:new Date().toISOString(), today:todayISO(), items:[]};
    topics.slice(0,8).forEach(function(topic, i){
      const interval = i < 2 ? 0 : (i < 5 ? 2 : 4);
      plan.items.push({topic:topic, due:addDays(interval), status:'open', priority:i<2?'high':'normal'});
    });
    return savePlan(plan);
  }
  function getPlan(){
    const plan = loadPlan();
    if(!plan.items || !plan.items.length || plan.today !== todayISO()) return generatePlan();
    return plan;
  }
  function completeTopic(topic){
    const plan = getPlan();
    plan.items = plan.items.map(function(item){
      if(item.topic === topic){
        item.status='done'; item.completedAt=new Date().toISOString(); item.nextDue=addDays(item.priority==='high'?2:4);
      }
      return item;
    });
    return savePlan(plan);
  }
  function dueItems(){
    const t = todayISO();
    return getPlan().items.filter(item => item.status !== 'done' && item.due <= t);
  }
  function render(containerId){
    const el = document.getElementById(containerId);
    if(!el) return;
    const plan = getPlan();
    const due = dueItems();
    el.innerHTML = '<div class="revision-hero-box"><h2>🧠 Intelligent Revision</h2><p>Σήμερα έχεις '+due.length+' προτεραιότητες επανάληψης.</p></div>'+
      '<div class="revision-grid">'+plan.items.map(function(item){
        return '<div class="revision-card '+(item.priority==='high'?'urgent':'')+' '+(item.status==='done'?'done':'')+'"><strong>'+item.topic+'</strong><small>Προθεσμία: '+item.due+'</small><button onclick="IstoriaRevision.completeTopic(\''+item.topic.replace(/'/g,'')+'\'); location.reload();">Το έκανα</button></div>';
      }).join('')+'</div>';
  }
  window.IstoriaRevision = {getPlan:getPlan, generatePlan:generatePlan, completeTopic:completeTopic, dueItems:dueItems, render:render};
})();
