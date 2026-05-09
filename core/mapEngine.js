
(function(){
  const STORAGE_KEY = 'istoria_v10_world_map_progress';
  const byId = (id)=>document.getElementById(id);
  let state = {data:null, activeLayer:'all', selected:null, unlocked:{}};

  const BOUNDS = {lonMin:-10, lonMax:45, latMin:20, latMax:48};
  function geo(lon,lat){
    const x = ((lon-BOUNDS.lonMin)/(BOUNDS.lonMax-BOUNDS.lonMin))*1000;
    const y = ((BOUNDS.latMax-lat)/(BOUNDS.latMax-BOUNDS.latMin))*600;
    return {x,y};
  }
  function poly(points){ return points.map(([lon,lat],i)=>`${i?'L':'M'} ${geo(lon,lat).x.toFixed(1)} ${geo(lon,lat).y.toFixed(1)}`).join(' ')+' Z'; }
  function line(points){ return points.map(([lon,lat],i)=>`${i?'L':'M'} ${geo(lon,lat).x.toFixed(1)} ${geo(lon,lat).y.toFixed(1)}`).join(' '); }
  function pointOf(h){
    if(typeof h.lon==='number' && typeof h.lat==='number') return geo(h.lon,h.lat);
    return {x:(h.x||50)*10, y:(h.y||50)*6};
  }
  const LAND = {
    iberia: [[-9.5,43.7],[-6.5,43.6],[-1.2,43.5],[3.0,42.4],[2.2,40.5],[-0.3,39.3],[0.2,37.5],[-2.0,36.1],[-5.5,36.0],[-7.2,37.2],[-8.9,38.6],[-9.5,41.0]],
    franceEurope: [[-5.0,48.0],[8.0,48.0],[13.5,47.0],[16.0,45.8],[16.5,44.0],[14.2,43.4],[10.5,44.0],[7.7,43.6],[4.8,43.3],[3.0,42.4],[-1.2,43.5],[-5.0,43.8]],
    italy: [[7.4,44.5],[9.5,44.1],[11.5,43.2],[12.8,41.8],[14.0,40.7],[15.8,39.7],[16.5,38.8],[16.2,37.8],[15.0,37.9],[13.9,39.1],[13.2,40.1],[12.2,41.2],[11.2,42.3],[10.2,43.3],[8.8,44.0]],
    balkans: [[13.8,45.8],[18.5,45.6],[22.5,44.6],[25.0,43.8],[28.0,43.3],[29.0,41.6],[27.2,40.7],[24.5,40.4],[23.2,39.6],[22.8,38.7],[23.8,37.8],[23.2,36.5],[21.5,36.6],[20.0,38.0],[19.0,39.5],[18.4,40.5],[16.8,41.6],[15.0,43.1]],
    peloponnese: [[20.8,38.2],[22.2,38.1],[23.5,37.8],[23.0,36.7],[22.0,36.3],[21.0,36.6],[20.5,37.4]],
    anatolia: [[26.0,41.7],[29.0,41.5],[32.0,41.4],[35.0,41.8],[39.0,41.1],[42.0,39.8],[44.5,38.0],[43.0,36.7],[39.5,36.0],[36.0,36.1],[33.0,36.6],[30.5,36.5],[28.0,37.2],[26.0,38.6]],
    levantArabia: [[34.0,36.0],[36.0,36.2],[37.0,34.5],[35.5,32.2],[34.8,30.0],[36.0,28.5],[39.5,26.0],[44.5,24.0],[45.0,20.0],[34.0,20.0],[31.5,24.0],[32.5,29.0],[33.5,31.5]],
    northAfrica: [[-10.0,35.6],[-5.5,35.4],[-1.0,36.5],[4.0,36.9],[9.0,37.0],[12.0,36.2],[15.0,33.2],[20.0,32.4],[25.0,31.6],[29.5,31.4],[32.2,31.3],[34.0,31.5],[32.4,29.0],[31.0,27.0],[30.0,24.0],[29.0,20.0],[-10.0,20.0]],
    sicily: [[12.2,38.2],[15.5,38.0],[15.2,36.9],[13.0,36.8],[12.0,37.4]],
    sardinia: [[8.0,41.3],[9.5,40.8],[9.3,39.0],[8.4,38.7],[7.8,40.0]],
    corsica: [[8.6,43.0],[9.6,42.7],[9.4,41.7],[8.8,41.4],[8.4,42.2]],
    crete: [[23.4,35.6],[26.5,35.6],[26.1,35.0],[24.0,34.8],[23.2,35.1]],
    cyprus: [[32.3,35.5],[34.6,35.3],[34.5,34.7],[33.0,34.6],[32.1,35.0]],
    blackSeaNorth: [[27.5,45.5],[31.0,46.2],[35.0,46.4],[39.0,46.2],[42.0,45.3],[43.0,43.8],[40.0,43.0],[36.0,43.5],[32.0,43.2],[29.0,43.5],[27.5,44.2]],
    aegeanIslands: [[24.7,39.0],[25.0,38.6],[25.4,38.7],[25.1,39.1]],
  };
  const RIVERS = { nile: [[31.2,20.0],[31.0,23.0],[30.8,26.0],[30.5,29.0],[31.2,31.2]], euphrates:[[38.5,37.0],[39.5,35.5],[40.3,34.0],[41.0,32.0],[42.0,30.0]] };

  function loadProgress(){ try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')}catch(e){return {}} }
  function saveProgress(){ try{localStorage.setItem(STORAGE_KEY, JSON.stringify({unlocked:state.unlocked,last:selectedId()}))}catch(e){} }
  function selectedId(){ return state.selected ? state.selected.id : null; }
  function visible(h){ return state.activeLayer==='all' || h.layer===state.activeLayer; }
  function coords(id){ const h = state.data.hotspots.find(x=>x.id===id); return h ? pointOf(h) : null; }
  function isUnlocked(h){ return true; }

  async function init(){
    const root = byId('worldMapApp'); if(!root) return;
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
        <div class="eyebrow">V10 Phase 10 — Real Geographic Map</div>
        <h1>🌍 Ιστορικός χάρτης Μεσογείου</h1>
        <p>Κανονικός γεωγραφικός χάρτης με Ελλάδα, Μικρά Ασία, Αίγυπτο, Ιταλία και Ανατολή. Τα σημεία είναι τοποθετημένα με πραγματικές συντεταγμένες ώστε ο μαθητής να καταλαβαίνει τον χώρο.</p>
        <div class="map-toolbar" id="mapToolbar"></div>
        <div class="map-layout">
          <div class="map-canvas real-map" id="mapCanvas">
            <svg class="geo-map-svg" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid meet" aria-label="Χάρτης ανατολικής Μεσογείου">
              <defs>
                <linearGradient id="seaGrad" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#bfe5f0"/><stop offset="1" stop-color="#6fb8d2"/></linearGradient>
                <linearGradient id="landGrad" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#e6d3a1"/><stop offset="1" stop-color="#bfa36a"/></linearGradient>
                <filter id="mapShadow"><feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#5c3b19" flood-opacity=".22"/></filter>
              </defs>
              <rect width="1000" height="600" fill="url(#seaGrad)"/>
              <g class="graticule">${[-5,5,15,25,35,45].map(l=>`<path d="${line([[l,20],[l,48]])}"/>`).join('')}${[25,30,35,40,45].map(l=>`<path d="${line([[-10,l],[45,l]])}"/>`).join('')}</g>
              <g class="land-layer" filter="url(#mapShadow)">
                ${Object.entries(LAND).map(([k,pts])=>`<path class="geo-land ${k}" d="${poly(pts)}"/>`).join('')}
              </g>
              <g class="coast-labels">
                <text x="335" y="425">ΜΕΣΟΓΕΙΟΣ ΘΑΛΑΣΣΑ</text><text x="500" y="365">ΑΙΓΑΙΟ ΠΕΛΑΓΟΣ</text><text x="615" y="210">ΜΙΚΡΑ ΑΣΙΑ</text><text x="390" y="245">ΕΛΛΑΔΑ</text><text x="380" y="120">ΜΑΚΕΔΟΝΙΑ</text><text x="120" y="225">ΙΤΑΛΙΑ</text><text x="650" y="470">ΑΙΓΥΠΤΟΣ</text><text x="735" y="330">ΣΥΡΙΑ</text><text x="780" y="250">ΜΕΣΟΠΟΤΑΜΙΑ</text><text x="620" y="100">ΕΥΞΕΙΝΟΣ ΠΟΝΤΟΣ</text>
              </g>
              <g class="rivers"><path d="${line(RIVERS.nile)}"/><path d="${line(RIVERS.euphrates)}"/></g>
              <svg class="route-svg" id="routeSvg" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid meet"></svg>
            </svg>
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
    el.innerHTML = state.data.hotspots.filter(visible).map(h=>{const p=pointOf(h);return `<button class="hotspot ${state.selected&&state.selected.id===h.id?'active':''} ${isUnlocked(h)?'':'locked'}" style="left:${(p.x/10).toFixed(2)}%;top:${(p.y/6).toFixed(2)}%" data-id="${h.id}" title="${h.name}"><span>${h.icon}</span><b>${h.name}</b></button>`}).join('');
    el.querySelectorAll('.hotspot').forEach(btn=>btn.addEventListener('click',()=>{state.selected=state.data.hotspots.find(h=>h.id===btn.dataset.id); state.unlocked[state.selected.id]=true; saveProgress(); renderHotspots(); renderSide();}));
  }
  function renderRoutes(){
    const svg = byId('routeSvg'); if(!svg) return;
    const routes = state.data.routes.filter(r=>state.activeLayer==='all'||r.layer===state.activeLayer);
    svg.innerHTML = routes.map(r=>{
      const pts = r.points.map(coords).filter(Boolean);
      if(pts.length<2) return '';
      const d = pts.map((p,i)=>`${i?'L':'M'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
      return `<path class="route-path ${r.layer}" d="${d}"><title>${r.title}</title></path>`;
    }).join('');
  }
  function renderSide(){
    const h = state.selected, side = byId('mapSide');
    const routeList = state.data.routes.map(r=>`<div class="route-item ${r.points.includes(h.id)?'active':''}" data-route="${r.id}">🧭 ${r.title}</div>`).join('');
    side.innerHTML = `
      <div style="font-size:48px">${h.icon}</div>
      <h2>${h.name}</h2>
      <div class="map-meta"><span class="map-chip">${h.chapter}</span><span class="map-chip">${h.mission}</span></div>
      <p>${h.text}</p>
      <p class="geo-hint">📍 Πραγματική θέση στον χάρτη: ${h.lat?.toFixed(2) || ''}°N, ${h.lon?.toFixed(2) || ''}°E</p>
      <div class="map-actions"><a href="${h.link}">Άνοιγμα αποστολής</a><a class="secondary" href="historical-campaign.html">Campaign Mode</a></div>
      <div class="route-panel"><strong>Ιστορικές διαδρομές</strong><div class="route-list">${routeList}</div></div>`;
    side.querySelectorAll('.route-item').forEach(item=>item.addEventListener('click',()=>{ const route = state.data.routes.find(r=>r.id===item.dataset.route); if(!route) return; state.activeLayer = route.layer; renderToolbar(); renderRoutes(); renderHotspots(); }));
  }
  document.addEventListener('DOMContentLoaded', init);
})();
