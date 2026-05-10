let DATA=null, currentId=null, currentTab='book', currentChapterId=null;
const $=id=>document.getElementById(id);

function esc(s){
  return String(s??'').replace(/[&<>"']/g,c=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
  }[c]));
}

async function init(){
  try{
    const r=await fetch('teacher-notes-module/data/teacher-notes.json?ts=' + Date.now());
    if(!r.ok) throw new Error('JSON not found');
    DATA=await r.json();
    buildMenu();
    const firstChapter=DATA.chapters?.[0];
    const first=firstChapter?.sections?.[0];
    if(first){
      currentChapterId=firstChapter.id;
      show(first.id);
    }
  }catch(e){
    $('tnContent').innerHTML='<h2>Σφάλμα φόρτωσης</h2><p>Βεβαιώσου ότι υπάρχει ο φάκελος <strong>teacher-notes-module</strong> δίπλα στο <strong>teacher-notes.html</strong>.</p>';
    console.error(e);
  }
}

function buildMenu(){
  const m=$('tnMenu');
  m.innerHTML=`
    <div class="tn-selector-box">
      <label for="tnChapterSelect">1. Διάλεξε κεφάλαιο</label>
      <select id="tnChapterSelect" class="tn-select"></select>

      <label for="tnSectionSelect">2. Διάλεξε υποκεφάλαιο</label>
      <select id="tnSectionSelect" class="tn-select"></select>
    </div>

    <div class="tn-chapter-preview" id="tnChapterPreview"></div>
  `;

  const chapterSelect=$('tnChapterSelect');
  DATA.chapters.forEach(ch=>{
    const opt=document.createElement('option');
    opt.value=ch.id;
    opt.textContent=ch.title;
    chapterSelect.appendChild(opt);
  });

  chapterSelect.onchange=()=>{
    currentChapterId=chapterSelect.value;
    populateSections();
    const firstSection=getChapter(currentChapterId)?.sections?.[0];
    if(firstSection) show(firstSection.id);
  };

  currentChapterId=currentChapterId || DATA.chapters?.[0]?.id;
  chapterSelect.value=currentChapterId;
  populateSections();
}

function getChapter(id){
  return DATA.chapters.find(ch=>ch.id===id);
}

function populateSections(){
  const sectionSelect=$('tnSectionSelect');
  const preview=$('tnChapterPreview');
  const ch=getChapter(currentChapterId);

  sectionSelect.innerHTML='';
  preview.innerHTML='';

  if(!ch || !ch.sections?.length){
    sectionSelect.innerHTML='<option>Δεν υπάρχουν υποκεφάλαια</option>';
    return;
  }

  ch.sections.forEach(s=>{
    const opt=document.createElement('option');
    opt.value=s.id;
    opt.textContent=s.title;
    sectionSelect.appendChild(opt);
  });

  sectionSelect.onchange=()=>show(sectionSelect.value);

  preview.innerHTML=`
    <div class="tn-preview-title">${esc(ch.title)}</div>
    <div class="tn-preview-count">${ch.sections.length} υποκεφάλαια διαθέσιμα</div>
  `;
}

function find(id){
  for(const ch of DATA.chapters){
    const s=ch.sections.find(x=>x.id===id);
    if(s) return {section:s, chapter:ch};
  }
  return null;
}

function show(id){
  const found=find(id);
  if(!found) return;

  currentId=id;
  currentChapterId=found.chapter.id;
  currentTab='book';

  const chapterSelect=$('tnChapterSelect');
  const sectionSelect=$('tnSectionSelect');

  if(chapterSelect && chapterSelect.value!==currentChapterId){
    chapterSelect.value=currentChapterId;
    populateSections();
  }
  if(sectionSelect) sectionSelect.value=id;

  render();
}

function tab(t){
  currentTab=t;
  render();
}

function render(){
  const found=find(currentId);
  if(!found) return;

  const s=found.section;
  const ch=found.chapter;

  $('tnContent').innerHTML=`
    <div class="tn-breadcrumb">${esc(ch.title)} &gt; ${esc(s.title)}</div>
    <h2>${esc(s.title)}</h2>
    <div class="tn-tabs">
      <button class="tn-tab ${currentTab==='book'?'active':''}" onclick="tab('book')">📖 Σχολικό Βιβλίο</button>
      <button class="tn-tab ${currentTab==='diagrams'?'active':''}" onclick="tab('diagrams')">🧠 Σχεδιαγράμματα</button>
      <button class="tn-tab ${currentTab==='qa'?'active':''}" onclick="tab('qa')">❓ Ερωτήσεις / Απαντήσεις</button>
    </div>
    <div>${currentTab==='book'?book(s.book):currentTab==='diagrams'?diagrams(s.diagrams):qa(s.qa)}</div>`;
}

function book(a){
  return a?.length
    ? a.map(x=>`<article class="tn-note"><h3>${esc(x.heading)}</h3><p>${esc(x.body)}</p></article>`).join('')
    : '<div class="tn-empty">Δεν έχει προστεθεί υλικό.</div>';
}

function diagrams(a){
  return a?.length
    ? a.map(x=>`<article class="tn-diagram"><h3>${esc(x.heading)}</h3><ul>${(x.points||[]).map(p=>`<li>${esc(p)}</li>`).join('')}</ul></article>`).join('')
    : '<div class="tn-empty">Δεν έχει προστεθεί σχεδιάγραμμα.</div>';
}

function qa(a){
  return a?.length
    ? a.map(x=>`<details class="tn-qa"><summary>${esc(x.q)}</summary><p>${esc(x.a)}</p></details>`).join('')
    : '<div class="tn-empty">Δεν έχουν προστεθεί ερωτήσεις.</div>';
}

document.addEventListener('DOMContentLoaded',init);