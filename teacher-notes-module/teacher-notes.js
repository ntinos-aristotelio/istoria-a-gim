
let DATA=null, currentId=null, currentTab='book';
const $=id=>document.getElementById(id);
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}
async function init(){
  try{
    const r=await fetch('teacher-notes-module/data/teacher-notes.json?ts=' + Date.now());
    if(!r.ok) throw new Error('JSON not found');
    DATA=await r.json();
    buildMenu();
    const first=DATA.chapters?.[0]?.sections?.[0];
    if(first) show(first.id);
  }catch(e){
    $('tnContent').innerHTML='<h2>Σφάλμα φόρτωσης</h2><p>Βεβαιώσου ότι υπάρχει ο φάκελος <strong>teacher-notes-module</strong> δίπλα στο <strong>teacher-notes.html</strong>.</p>';
    console.error(e);
  }
}
function buildMenu(){
  const m=$('tnMenu'); m.innerHTML='';
  DATA.chapters.forEach(ch=>{
    const h=document.createElement('h3'); h.textContent=ch.title; m.appendChild(h);
    ch.sections.forEach(s=>{
      const b=document.createElement('button');
      b.className='tn-menu-btn'; b.dataset.id=s.id; b.textContent=s.title;
      b.onclick=()=>show(s.id); m.appendChild(b);
    });
  });
}
function find(id){for(const ch of DATA.chapters){const s=ch.sections.find(x=>x.id===id); if(s)return s;} return null;}
function show(id){currentId=id;currentTab='book';document.querySelectorAll('.tn-menu-btn').forEach(b=>b.classList.toggle('active',b.dataset.id===id));render();}
function tab(t){currentTab=t;render();}
function render(){
  const s=find(currentId); if(!s)return;
  $('tnContent').innerHTML=`
    <h2>${esc(s.title)}</h2>
    <div class="tn-tabs">
      <button class="tn-tab ${currentTab==='book'?'active':''}" onclick="tab('book')">📖 Σχολικό Βιβλίο</button>
      <button class="tn-tab ${currentTab==='diagrams'?'active':''}" onclick="tab('diagrams')">🧠 Σχεδιαγράμματα</button>
      <button class="tn-tab ${currentTab==='qa'?'active':''}" onclick="tab('qa')">❓ Ερωτήσεις / Απαντήσεις</button>
    </div>
    <div>${currentTab==='book'?book(s.book):currentTab==='diagrams'?diagrams(s.diagrams):qa(s.qa)}</div>`;
}
function book(a){return a?.length?a.map(x=>`<article class="tn-note"><h3>${esc(x.heading)}</h3><p>${esc(x.body)}</p></article>`).join(''):'<div class="tn-empty">Δεν έχει προστεθεί υλικό.</div>'}
function diagrams(a){return a?.length?a.map(x=>`<article class="tn-diagram"><h3>${esc(x.heading)}</h3><ul>${(x.points||[]).map(p=>`<li>${esc(p)}</li>`).join('')}</ul></article>`).join(''):'<div class="tn-empty">Δεν έχει προστεθεί σχεδιάγραμμα.</div>'}
function qa(a){
  if(!a?.length) return '<div class="tn-empty">Δεν έχουν προστεθεί ερωτήσεις.</div>';
  return a.map(group=>{
    if(group.items){
      return `<section class="tn-qa-category"><h3>${esc(group.category)}</h3>${group.items.map(x=>`<details class="tn-qa"><summary>${esc(x.q)}</summary><p>${esc(x.a)}</p></details>`).join('')}</section>`;
    }
    return `<details class="tn-qa"><summary>${esc(group.q)}</summary><p>${esc(group.a)}</p></details>`;
  }).join('');
}
document.addEventListener('DOMContentLoaded',init);
