
let teacherNotesData = null;
let currentSectionId = null;
let currentTab = "book";

function escapeHTML(value){
  return String(value ?? "").replace(/[&<>"']/g, ch => ({
    "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"
  }[ch]));
}

async function loadTeacherNotes(){
  try{
    const response = await fetch("data/teacher-notes.json");
    teacherNotesData = await response.json();
    buildMenu();
    const first = teacherNotesData.chapters?.[0]?.sections?.[0];
    if(first) showSection(first.id);
  }catch(error){
    document.getElementById("tnContent").innerHTML = `
      <h2>Δεν φορτώθηκαν οι σημειώσεις</h2>
      <p>Έλεγξε ότι υπάρχει το αρχείο <strong>data/teacher-notes.json</strong>.</p>
    `;
    console.error(error);
  }
}

function buildMenu(){
  const menu = document.getElementById("tnMenu");
  menu.innerHTML = "";
  teacherNotesData.chapters.forEach(chapter => {
    const title = document.createElement("h3");
    title.textContent = chapter.title;
    menu.appendChild(title);
    chapter.sections.forEach(section => {
      const btn = document.createElement("button");
      btn.className = "tn-menu-btn";
      btn.dataset.sectionId = section.id;
      btn.textContent = section.title;
      btn.onclick = () => showSection(section.id);
      menu.appendChild(btn);
    });
  });
}

function findSection(sectionId){
  for(const chapter of teacherNotesData.chapters){
    const section = chapter.sections.find(s => s.id === sectionId);
    if(section) return section;
  }
  return null;
}

function showSection(sectionId){
  currentSectionId = sectionId;
  currentTab = "book";
  document.querySelectorAll(".tn-menu-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.sectionId === sectionId);
  });
  renderSection();
}

function setTab(tab){
  currentTab = tab;
  renderSection();
}

function renderSection(){
  const section = findSection(currentSectionId);
  if(!section) return;
  const content = document.getElementById("tnContent");
  content.innerHTML = `
    <div class="tn-section-title">
      <h2>${escapeHTML(section.title)}</h2>
    </div>
    <div class="tn-tabs">
      <button class="tn-tab ${currentTab === "book" ? "active" : ""}" onclick="setTab('book')">📖 Σχολικό Βιβλίο</button>
      <button class="tn-tab ${currentTab === "diagrams" ? "active" : ""}" onclick="setTab('diagrams')">🧠 Σχεδιαγράμματα</button>
      <button class="tn-tab ${currentTab === "qa" ? "active" : ""}" onclick="setTab('qa')">❓ Ερωτήσεις / Απαντήσεις</button>
    </div>
    <div class="tn-panel ${currentTab === "book" ? "active" : ""}">
      ${renderBook(section.book)}
    </div>
    <div class="tn-panel ${currentTab === "diagrams" ? "active" : ""}">
      ${renderDiagrams(section.diagrams)}
    </div>
    <div class="tn-panel ${currentTab === "qa" ? "active" : ""}">
      ${renderQA(section.qa)}
    </div>
  `;
}

function renderBook(items){
  if(!items || !items.length) return `<div class="tn-empty">Δεν έχει προστεθεί ακόμα υλικό.</div>`;
  return items.map(item => `
    <article class="tn-note-card">
      <h3>${escapeHTML(item.heading)}</h3>
      <p>${escapeHTML(item.body)}</p>
    </article>
  `).join("");
}

function renderDiagrams(items){
  if(!items || !items.length) return `<div class="tn-empty">Δεν έχει προστεθεί ακόμα σχεδιάγραμμα.</div>`;
  return items.map(item => `
    <article class="tn-diagram">
      <h3>${escapeHTML(item.heading)}</h3>
      <ul>
        ${(item.points || []).map(point => `<li>${escapeHTML(point)}</li>`).join("")}
      </ul>
    </article>
  `).join("");
}

function renderQA(items){
  if(!items || !items.length) return `<div class="tn-empty">Δεν έχουν προστεθεί ακόμα ερωτήσεις.</div>`;
  return items.map(item => `
    <details class="tn-qa">
      <summary>${escapeHTML(item.q)}</summary>
      <div><p>${escapeHTML(item.a)}</p></div>
    </details>
  `).join("");
}

document.addEventListener("DOMContentLoaded", loadTeacherNotes);
