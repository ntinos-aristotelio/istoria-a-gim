(function(){
  const STORAGE_KEY = 'istoria_v10_historical_atlas_progress';
  const byId = (id)=>document.getElementById(id);
  const BOUNDS = {lonMin:-10, lonMax:45, latMin:20, latMax:48};
  let state = {data:null, activeLayer:'all', selected:null, unlocked:{}};
  const MAJOR_HOTSPOTS = new Set(['athens','macedonia','rome','constantinople','egypt','miletus','carthage']);

  function geo(lon,lat){
    const x = ((lon-BOUNDS.lonMin)/(BOUNDS.lonMax-BOUNDS.lonMin))*1000;
    const y = ((BOUNDS.latMax-lat)/(BOUNDS.latMax-BOUNDS.latMin))*600;
    return {x,y};
  }
  function pointOf(h){return geo(h.lon, h.lat)}
  function coords(id){const h=state.data.hotspots.find(x=>x.id===id);return h?pointOf(h):null}
  function visible(h){return state.activeLayer==='all' ? MAJOR_HOTSPOTS.has(h.id) : h.layer===state.activeLayer}
  function loadProgress(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')}catch(e){return {}}}
  function saveProgress(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify({unlocked:state.unlocked,last:state.selected?.id||null}))}catch(e){}}
  function isUnlocked(){return true}

  async function init(){
    const root=byId('worldMapApp'); if(!root) return;
    try{
      const inline = document.getElementById('worldMapData');
      if(inline && inline.textContent.trim()){
        state.data = JSON.parse(inline.textContent);
      }else{
        const res=await fetch('data/world-map.json');
        state.data=await res.json();
      }
    }catch(e){
      root.innerHTML='<section class="world-map-shell"><h1>Δεν φορτώθηκε ο χάρτης</h1><p>Λείπει ή δεν διαβάζεται το αρχείο δεδομένων του άτλαντα.</p></section>'; return;
    }
    const progress=loadProgress();
    state.unlocked=progress.unlocked||{};
    state.selected=state.data.hotspots.find(h=>h.id===progress.last)||state.data.hotspots.find(h=>h.id==='athens')||state.data.hotspots[0];
    render(root);
  }

  function render(root){
    root.innerHTML=`
      <section class="world-map-shell">
        <div class="eyebrow">V10 Phase 10 — Interactive Historical Atlas</div>
        <h1>🌍 Ιστορικός Άτλαντας Μεσογείου</h1>
        <p class="atlas-intro">Ο χάρτης είναι πλέον πραγματικός γεωγραφικός άτλαντας της Μεσογείου, όχι αφηρημένο game-board. Βλέπεις καθαρές ακτογραμμές, χώρες, θάλασσες και σημεία ιστορικών γεγονότων σε σωστές θέσεις.</p>
        <div class="atlas-note">Στόχος: ο μαθητής να συνδέει την Ιστορία με τον πραγματικό χώρο — πρώτα βλέπει τα βασικά σημεία και μετά ανοίγει κάθε ιστορικό επίπεδο ξεχωριστά.</div>
        <div class="map-toolbar" id="mapToolbar"></div>
        <div class="region-jump" id="regionJump"></div>
        <div class="map-layout">
          <div class="map-canvas" id="mapCanvas" aria-label="Γεωγραφικός χάρτης Μεσογείου">
            <img class="atlas-map-img" src="assets/mediterranean_atlas_map.png" alt="Γεωγραφικός χάρτης Μεσογείου και Ανατολικής Μεσογείου">
            <svg class="route-svg" id="routeSvg" viewBox="0 0 1000 600" preserveAspectRatio="none"></svg>
            <div id="hotspots"></div>
            <div class="map-legend">
              <div><span class="legend-dot dot-prehistory"></span>Προϊστορία / Χαλκός</div>
              <div><span class="legend-dot dot-persian"></span>Περσικοί Πόλεμοι</div>
              <div><span class="legend-dot dot-alexander"></span>Μέγας Αλέξανδρος</div>
              <div><span class="legend-dot dot-rome"></span>Ρώμη / Βυζάντιο</div>
              <div><span class="legend-dot dot-colonies"></span>Αποικισμός</div>
            </div>
            <div class="atlas-scale"><span></span>περ. 1.000 χλμ.</div>
          </div>
          <aside class="map-side" id="mapSide"></aside>
        </div>
      </section>`;
    renderToolbar(); renderRegionJump(); renderRoutes(); renderHotspots(); renderSide();
  }

  function renderToolbar(){
    const el=byId('mapToolbar');
    el.innerHTML=state.data.layers.map(l=>`<button class="map-filter ${state.activeLayer===l.id?'active':''}" data-layer="${l.id}">${l.title}</button>`).join('');
    el.querySelectorAll('button').forEach(btn=>btn.addEventListener('click',()=>{
      state.activeLayer=btn.dataset.layer; renderToolbar(); renderRoutes(); renderHotspots();
    }));
  }

  function renderRegionJump(){
    const el=byId('regionJump');
    const regions=[
      ['athens','Ελλάδα / Αιγαίο'],['constantinople','Μικρά Ασία'],['egypt','Αίγυπτος'],['rome','Ρώμη'],['gaugamela','Ανατολή']
    ];
    el.innerHTML=regions.map(([id,label])=>`<button data-id="${id}">📍 ${label}</button>`).join('');
    el.querySelectorAll('button').forEach(btn=>btn.addEventListener('click',()=>{
      const h=state.data.hotspots.find(x=>x.id===btn.dataset.id); if(!h) return;
      state.selected=h; state.activeLayer='all'; saveProgress(); renderToolbar(); renderRoutes(); renderHotspots(); renderSide();
    }));
  }

  function renderHotspots(){
    const el=byId('hotspots');
    el.innerHTML=state.data.hotspots.filter(visible).map(h=>{
      const p=pointOf(h);
      return `<button class="hotspot ${h.layer} ${MAJOR_HOTSPOTS.has(h.id)?'major':''} ${state.selected&&state.selected.id===h.id?'active':''} ${isUnlocked(h)?'':'locked'}" style="left:${(p.x/10).toFixed(2)}%;top:${(p.y/6).toFixed(2)}%" data-id="${h.id}" title="${h.name}"><span>${h.icon}</span><b>${h.name}</b></button>`;
    }).join('');
    el.querySelectorAll('.hotspot').forEach(btn=>btn.addEventListener('click',()=>{
      state.selected=state.data.hotspots.find(h=>h.id===btn.dataset.id); state.unlocked[state.selected.id]=true; saveProgress(); renderHotspots(); renderSide();
    }));
  }

  function renderRoutes(){
    const svg=byId('routeSvg'); if(!svg) return;
    const routes=state.activeLayer==='all' ? [] : state.data.routes.filter(r=>r.layer===state.activeLayer);
    svg.innerHTML=routes.map(r=>{
      const pts=r.points.map(coords).filter(Boolean);
      if(pts.length<2) return '';
      const d=pts.map((p,i)=>`${i?'L':'M'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
      return `<path class="route-path ${r.layer}" d="${d}"><title>${r.title}</title></path>`;
    }).join('');
  }

  function renderSide(){
    const h=state.selected, side=byId('mapSide'); if(!h||!side) return;
    const routeList=state.data.routes.map(r=>`<div class="route-item ${r.points.includes(h.id)?'active':''}" data-route="${r.id}">🧭 ${r.title}</div>`).join('');
    side.innerHTML=`
      <div class="map-side-icon">${h.icon}</div>
      <h2>${h.name}</h2>
      <div class="map-meta"><span class="map-chip">${h.chapter}</span><span class="map-chip">${h.mission}</span><span class="map-chip">${h.region}</span></div>
      <p>${h.text}</p>
      <p class="geo-hint">📍 Πραγματική θέση: ${h.lat.toFixed(2)}°N, ${h.lon.toFixed(2)}°E</p>
      <div class="map-checklist"><strong>Τι πρέπει να προσέξει ο μαθητής:</strong><ul>${(h.learning||[]).map(x=>`<li>${x}</li>`).join('')}</ul></div>
      <div class="map-actions"><a href="${h.link}">Άνοιγμα αποστολής</a><a class="secondary" href="historical-campaign.html">Campaign Mode</a></div>
      <div class="route-panel"><strong>Ιστορικές διαδρομές</strong><div class="route-list">${routeList}</div></div>`;
    side.querySelectorAll('.route-item').forEach(item=>item.addEventListener('click',()=>{
      const route=state.data.routes.find(r=>r.id===item.dataset.route); if(!route) return;
      state.activeLayer=route.layer; renderToolbar(); renderRoutes(); renderHotspots();
    }));
  }
  document.addEventListener('DOMContentLoaded',init);
})();
