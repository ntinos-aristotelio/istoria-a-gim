(function(){
  const STORAGE_KEY = 'istoria_v10_world_map_progress';
  const byId = (id)=>document.getElementById(id);
  let state = {data:null, activeLayer:'all', selected:null, unlocked:{}};

  function loadProgress(){ try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')}catch(e){return {}} }
  function saveProgress(){ try{localStorage.setItem(STORAGE_KEY, JSON.stringify({unlocked:state.unlocked,last:selectedId()}))}catch(e){} }
  function selectedId(){ return state.selected ? state.selected.id : null; }
  function visible(h){ return state.activeLayer==='all' || h.layer===state.activeLayer; }
  function coords(id){ const h = state.data.hotspots.find(x=>x.id===id); return h ? {x:h.x,y:h.y} : null; }
  function isUnlocked(){ return true; }

  async function init(){
    const root = byId('worldMapApp');
    if(!root) return;
    const res = await fetch('data/world-map.json');
    state.data = await res.json();
    const progress = loadProgress();
    state.unlocked = progress.unlocked || {};
    state.selected = state.data.hotspots.find(h=>h.id===progress.last) || state.data.hotspots.find(h=>h.id==='athens') || state.data.hotspots[0];
    render(root);
  }

  function baseMapSvg(){
    return `
      <svg class="geo-map" viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="Ιστορικός χάρτης Μεσογείου">
        <defs>
          <linearGradient id="seaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#bfe5ef"/><stop offset="55%" stop-color="#7fc5d7"/><stop offset="100%" stop-color="#55a8c4"/>
          </linearGradient>
          <linearGradient id="landGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#d9c392"/><stop offset="100%" stop-color="#b78d55"/>
          </linearGradient>
          <linearGradient id="mountGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#8fb86a"/><stop offset="100%" stop-color="#d0b083"/>
          </linearGradient>
          <filter id="mapShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="2" stdDeviation="1.1" flood-color="#4b2a14" flood-opacity=".28"/>
          </filter>
        </defs>
        <rect class="sea" width="100" height="100" fill="url(#seaGrad)"/>
        <path class="coast north-africa" d="M0,74 C12,70 22,69 32,70 C42,71 50,74 61,72 C72,69 83,66 100,67 L100,100 L0,100 Z"/>
        <path class="coast europe" d="M0,0 L100,0 L100,31 C91,30 86,27 78,29 C71,30 67,34 61,33 C55,32 50,29 45,32 C39,36 34,34 29,30 C22,25 16,27 9,31 C5,33 2,34 0,34 Z"/>
        <path class="coast balkans" d="M42,28 C47,29 50,33 51,38 C52,43 49,47 50,52 C50,55 53,57 55,60 C50,60 47,58 45,55 C43,51 40,49 40,44 C40,39 39,34 42,28 Z"/>
        <path class="coast italy" d="M24,31 C29,33 31,39 30,45 C29,51 34,54 34,61 C32,64 28,62 26,58 C23,54 21,49 21,44 C21,39 22,34 24,31 Z"/>
        <path class="coast sicily" d="M28,65 C33,63 38,64 41,67 C36,69 31,69 28,65 Z"/>
        <path class="coast asia-minor" d="M55,35 C62,31 70,31 78,34 C85,37 89,40 96,39 C98,41 97,46 93,48 C86,51 79,49 72,52 C65,55 59,53 54,49 C50,45 50,39 55,35 Z"/>
        <path class="coast levant" d="M80,53 C84,56 83,63 79,68 C76,72 74,76 72,82 C70,76 72,68 74,61 C76,57 77,54 80,53 Z"/>
        <path class="coast egypt" d="M59,70 C65,70 70,73 72,82 C68,83 62,82 56,79 C53,76 54,72 59,70 Z"/>
        <path class="island crete" d="M45,61 C50,59 58,59 64,61 C59,64 50,65 45,61 Z"/>
        <path class="island cyprus" d="M72,62 C76,60 81,61 84,63 C79,65 75,65 72,62 Z"/>
        <path class="sea-shape black-sea" d="M62,22 C70,17 82,18 92,22 C88,27 77,29 68,27 C63,26 60,24 62,22 Z"/>
        <g class="aegean-islands">
          <circle cx="51.5" cy="49" r=".55"/><circle cx="53.5" cy="51" r=".45"/><circle cx="55" cy="48" r=".5"/><circle cx="49.5" cy="53" r=".45"/><circle cx="57" cy="54" r=".5"/>
        </g>
        <g class="map-labels">
          <text x="13" y="58">Ιταλία</text><text x="42" y="37">Ελλάδα</text><text x="60" y="40">Μικρά Ασία</text>
          <text x="57" y="78">Αίγυπτος</text><text x="76" y="75">Ανατολή</text><text x="42" y="54">ΑΙΓΑΙΟ</text>
          <text x="18" y="82">ΜΕΣΟΓΕΙΟΣ ΘΑΛΑΣΣΑ</text><text x="67" y="24">ΕΥΞΕΙΝΟΣ ΠΟΝΤΟΣ</text>
        </g>
        <g class="route-layer"><slot></slot></g>
      </svg>`;
  }

  function render(root){
    root.innerHTML = `
      <section class="world-map-shell">
        <div class="eyebrow">V10 Phase 10</div>
        <h1>🌍 Κανονικός Ιστορικός Χάρτης</h1>
        <p>Πραγματικός χάρτης Μεσογείου με πόλεις, μάχες, διαδρομές και αποστολές πάνω στις σωστές γεωγραφικές περιοχές.</p>
        <div class="map-toolbar" id="mapToolbar"></div>
        <div class="map-layout">
          <div class="map-canvas" id="mapCanvas">
            ${baseMapSvg()}
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
    el.innerHTML = state.data.hotspots.filter(visible).map(h=>`<button class="hotspot ${h.layer} ${state.selected&&state.selected.id===h.id?'active':''} ${isUnlocked(h)?'':'locked'}" style="left:${h.x}%;top:${h.y}%" data-id="${h.id}" title="${h.name}"><span>${h.icon}</span><small>${h.name}</small></button>`).join('');
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
      <div class="side-icon ${h.layer}">${h.icon}</div>
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
