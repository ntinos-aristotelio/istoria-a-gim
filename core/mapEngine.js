
(function(){
  const STORAGE_KEY = 'istoria_v10_world_map_progress';
  const byId = (id)=>document.getElementById(id);
  let state = {data:null, activeLayer:'all', selected:null, unlocked:{}};

  function loadProgress(){
    try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')}catch(e){return {}}
  }
  function saveProgress(){
    try{localStorage.setItem(STORAGE_KEY, JSON.stringify({unlocked:state.unlocked,last:selectedId()}))}catch(e){}
  }
  function selectedId(){ return state.selected ? state.selected.id : null; }
  function visible(h){ return state.activeLayer==='all' || h.layer===state.activeLayer; }
  function coords(id){
    const h = state.data.hotspots.find(x=>x.id===id); return h ? {x:h.x,y:h.y} : null;
  }
  function isUnlocked(h){
    // first hotspots and all chapter links are available; route progression is visual, not blocking
    return true;
  }
  async function init(){
    const root = byId('worldMapApp');
    if(!root) return;
    const res = await fetch('data/world-map.json');
    state.data = await res.json();
    const progress = loadProgress();
    state.unlocked = progress.unlocked || {};
    state.selected = state.data.hotspots.find(h=>h.id===progress.last) || state.data.hotspots[0];
    render(root);
  }
  function render(root){
    root.innerHTML = `
      <section class="world-map-shell">
        <div class="eyebrow">V10 Phase 10</div>
        <h1>🌍 Interactive World Map</h1>
        <p>Ταξίδεψε στον ιστορικό χάρτη, άνοιξε περιοχές, δες αποστολές και σύνδεσε τα γεγονότα με τον χώρο.</p>
        <div class="map-toolbar" id="mapToolbar"></div>
        <div class="map-layout">
          <div class="map-canvas" id="mapCanvas">
            <div class="land europe"></div><div class="land asia"></div><div class="land africa"></div>
            <div class="map-sea-label" style="left:38%;top:48%">Αιγαίο</div>
            <div class="map-sea-label" style="left:13%;top:70%">Μεσόγειος</div>
            <svg class="route-svg" id="routeSvg" viewBox="0 0 100 100" preserveAspectRatio="none"></svg>
            <div id="hotspots"></div>
          </div>
          <aside class="map-side" id="mapSide"></aside>
        </div>
      </section>`;
    renderToolbar(); renderRoutes(); renderHotspots(); renderSide();
  }
  function renderToolbar(){
    const el = byId('mapToolbar');
    el.innerHTML = state.data.layers.map(l=>`<button class="map-filter ${state.activeLayer===l.id?'active':''}" data-layer="${l.id}">${l.title}</button>`).join('');
    el.querySelectorAll('button').forEach(btn=>btn.addEventListener('click',()=>{state.activeLayer=btn.dataset.layer; renderToolbar(); renderRoutes(); renderHotspots();}));
  }
  function renderHotspots(){
    const el = byId('hotspots');
    el.innerHTML = state.data.hotspots.filter(visible).map(h=>`<button class="hotspot ${state.selected&&state.selected.id===h.id?'active':''} ${isUnlocked(h)?'':'locked'}" style="left:${h.x}%;top:${h.y}%" data-id="${h.id}" title="${h.name}">${h.icon}</button>`).join('');
    el.querySelectorAll('.hotspot').forEach(btn=>btn.addEventListener('click',()=>{state.selected=state.data.hotspots.find(h=>h.id===btn.dataset.id); state.unlocked[state.selected.id]=true; saveProgress(); renderHotspots(); renderSide();}));
  }
  function renderRoutes(){
    const svg = byId('routeSvg');
    const routes = state.data.routes.filter(r=>state.activeLayer==='all'||r.layer===state.activeLayer);
    svg.innerHTML = routes.map(r=>{
      const pts = r.points.map(coords).filter(Boolean);
      if(pts.length<2) return '';
      const d = pts.map((p,i)=>`${i?'L':'M'} ${p.x} ${p.y}`).join(' ');
      return `<path class="route-path ${r.layer}" d="${d}"><title>${r.title}</title></path>`;
    }).join('');
  }
  function renderSide(){
    const h = state.selected;
    const side = byId('mapSide');
    const routeList = state.data.routes.map(r=>`<div class="route-item ${r.points.includes(h.id)?'active':''}" data-route="${r.id}">🧭 ${r.title}</div>`).join('');
    side.innerHTML = `
      <div style="font-size:48px">${h.icon}</div>
      <h2>${h.name}</h2>
      <div class="map-meta"><span class="map-chip">${h.chapter}</span><span class="map-chip">${h.mission}</span></div>
      <p>${h.text}</p>
      <div class="map-actions"><a href="${h.link}">Άνοιγμα αποστολής</a><a class="secondary" href="historical-campaign.html">Campaign Mode</a></div>
      <div class="route-panel"><strong>Ιστορικές διαδρομές</strong><div class="route-list">${routeList}</div></div>`;
    side.querySelectorAll('.route-item').forEach(item=>item.addEventListener('click',()=>{
      const route = state.data.routes.find(r=>r.id===item.dataset.route); if(!route) return;
      state.activeLayer = route.layer; renderToolbar(); renderRoutes(); renderHotspots();
    }));
  }
  document.addEventListener('DOMContentLoaded', init);
})();
