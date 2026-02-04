document.addEventListener("DOMContentLoaded", () => {
  gsap.registerPlugin(MotionPathPlugin);

  const STORAGE_KEY = "stackdarker.portfolio.progress.v1";

  const XP_TABLE = [100, 180, 260, 350, 450, 560, 680, 820, 970, 1130];

  const ACHIEVEMENTS = [
    { id: "enter_night", name: "First Contact", desc: "Entered the portfolio." },
    { id: "visit_all_zones", name: "World Explorer", desc: "Visited About, Projects, Skills, and Contact." },
    { id: "inspect_3_projects", name: "Investigator", desc: "Inspected 3 project missions." },
    { id: "copy_channel", name: "Comms Operator", desc: "Copied a contact channel." },
    { id: "skill_perk_selected", name: "Perk Unlocked", desc: "Selected a skill perk node." },
    { id: "toggle_sound", name: "Audio Online", desc: "Enabled the sound system." }
  ];

  const state = loadState();
  const visited = new Set(state.visitedZones || []);
  const DATA_URL = "data/portfolio.json";

let portfolioData = { projects: [], quests: [] };

let questView = "all"; 


(async function loadPortfolioData() {
  try {
    const res = await fetch(DATA_URL, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to load ${DATA_URL}: ${res.status}`);
    portfolioData = await res.json();

    renderQuests(portfolioData.quests || []);
    bindQuestFilters();
    renderProjects(sortByCompletionStatus(portfolioData.projects || []));

    renderProjects(sortByCompletionStatus(portfolioData.projects || []));
  } catch (err) {
    console.error(err);
    showToast("Data load failed", "Could not load portfolio.json", 2200);
  }
})();


  // DOM
  const enterBtn = document.getElementById("enter-btn");
  const sunsetScene = document.getElementById("sunset-scene");
  const nightScene = document.getElementById("night-scene");
  const plane = document.getElementById("plane");
  const app = document.getElementById("app");

  const hudLevel = document.getElementById("hud-level");
  const hudXp = document.getElementById("hud-xp");
  const hudNext = document.getElementById("hud-next");

  const btnSound = document.getElementById("btn-sound");
  const btnAchievements = document.getElementById("btn-achievements");

  const projectModal = document.getElementById("project-modal");
  const trophyModal = document.getElementById("trophy-modal");
  const trophyGrid = document.getElementById("trophy-grid");
  const toastWrap = document.getElementById("toast-wrap");

  const filterSel = document.getElementById("filter");
  const sortSel = document.getElementById("sort");
  const btnRandom = document.getElementById("btn-random");

  document.getElementById("year").textContent = String(new Date().getFullYear());

  // Lock app initially
  app.classList.add("app-locked");
  app.classList.remove("app-unlocked");
  app.setAttribute("aria-hidden", "true");

  // Sound
  let audioCtx = null;
  function ensureAudio() {
    if (audioCtx) return audioCtx;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return audioCtx;
  }

const SFX_PATHS = {
  confirm: "assets/sfx/confirm.mp3",
};

let sfx = null;

function initSfx() {
  if (sfx) return sfx;

  sfx = {
    confirm: new Audio(SFX_PATHS.confirm),
  };

  Object.values(sfx).forEach(a => {
    a.preload = "auto";
    a.volume = 0.45; 
  });

  return sfx;
}

function playSfx(name) {
  if (!state.soundOn) return;

  const bank = initSfx();
  const a = bank[name];
  if (!a) return;
  a.currentTime = 0;
  a.play().catch(() => {
  });
}


let skillsBound = false;

function bindSkillsOnce() {
  if (skillsBound) return;
  skillsBound = true;
  initSkillTree();
}


function renderQuests(quests) {
  const wrap = document.getElementById("quest-list");
  if (!wrap) return;

  const all = quests || [];

const filtered =
  questView === "all"
    ? all
    : all.filter(q => (q.status || "in_progress") === questView);


    filtered.sort((a, b) => {
    const rank = s => (s === "future" ? 0 : s === "in_progress" ? 1 : 2);

    return rank(a.status || "in_progress") - rank(b.status || "in_progress");
});

  wrap.innerHTML = "";

  filtered.forEach(q => {
    const el = document.createElement("div");
    el.className = "quest-item";
    el.dataset.questId = q.id;

    const status = (q.status || "in_progress"); 

    const statusLabel =
      status === "completed" ? "Completed" :
      status === "future"    ? "Future" :
                               "In Progress";
    
    const rewardClass =
      status === "completed" ? "reward--done" :
      status === "future"    ? "reward--future" :
                               "reward--progress";    

    el.innerHTML = `
      <div class="quest-title">${escapeHTML(q.title)}</div>
      <div class="quest-desc">${escapeHTML(q.desc || "")}</div>
      <div class="quest-rewards">
        <span class="reward ${rewardClass}">${statusLabel}</span>
      </div>
    `;
    wrap.appendChild(el);
  });
}

function bindQuestFilters() {
  const btns = Array.from(document.querySelectorAll("[data-quest-filter]"));
  if (!btns.length) return;

  btns.forEach(btn => {
    btn.addEventListener("click", () => {
      questView = btn.dataset.questFilter;

      btns.forEach(b => {
        const active = b.dataset.questFilter === questView;
        b.classList.toggle("is-active", active);
        b.setAttribute("aria-pressed", String(active));
      });

      renderQuests(portfolioData.quests || []);
    });
  });
}


  
  function renderProjects(projects) {
    const grid = document.getElementById("project-grid");
    if (!grid) return;
  
    grid.innerHTML = "";
  
    projects.forEach(p => {
      const card = document.createElement("article");
      card.className = "card";
      card.dataset.type = p.type || "all";
      card.dataset.difficulty = p.difficulty || "B";
      card.dataset.featured = p.featured ? "1" : "0";
  
      const updatedText = p.repo ? "Loading…" : formatDate(p.lastUpdated);
      const statusText = formatStatus(p.status);
  
      const previewSrc = p.images?.preview ? escapeHTML(p.images.preview) : "";
      card.innerHTML = `
        <div class="card-top">
        <div class="thumb">
            ${
            previewSrc
              ? `<img class="thumb-img" src="${previewSrc}" alt="${escapeHTML(p.title)} preview" loading="lazy">`
              : `<div class="thumb thumb-placeholder" aria-hidden="true"></div>`
              }
        </div>
        </div>

        <div class="card-meta">
          <h3 class="card-title">${escapeHTML(p.title)}</h3>

          <div class="chips chips--clamp">
            ${(p.tags || [])
              .slice(0, 5)
              .map(t => `<span class="chip">${escapeHTML(t)}</span>`)
              .join("")}

            <span class="chips-break" aria-hidden="true"></span>

            <span class="pill-group">
              <span class="pill">Difficulty: ${escapeHTML(p.difficulty || "B")}</span>
              <span class="pill">Boss: ${escapeHTML(p.boss || "Polish")}</span>
            </span>
          </div>
        </div>
  
        <div class="card-bottom">
          <div class="card-meta-row">
            <span class="meta-inline">
              <span class="meta-inline-key">Last updated</span>
              <time
                  class="meta-inline-val"
                  datetime="${escapeHTML(p.lastUpdated || "")}"
                  data-fallback="${escapeHTML(formatDate(p.lastUpdated))}">
                  ${escapeHTML(updatedText)}
              </time>

            </span>
  
            ${p.questId ? `
              <button class="link-btn open-quest" type="button" data-quest="${escapeHTML(p.questId)}">
                Quest: ${escapeHTML(statusText)}
              </button>
            ` : ""}
          </div>
  
          <p class="card-desc">${escapeHTML(p.desc || "")}</p>
  
          <div class="card-actions">
            <button class="btn btn-ghost open-project" type="button" data-project="${escapeHTML(p.id)}">Inspect</button>
            ${p.links?.github ? `<a class="btn" href="${escapeHTML(p.links.github)}" target="_blank" rel="noopener">GitHub</a>` : ""}
          </div>
        </div>
      `;
              
      grid.appendChild(card);

      if (p.repo) {
        fetchGitHubLastUpdated(p.repo, card.querySelector("time"));
      }

    });
  
    wireDynamicProjectButtons();
    wireDynamicQuestButtons();
  }
  
// skill tree

   let skillTreeFilter = null;          
   let skillTreeTracked = new Set();    
   
   function initSkillTree() {
     const tree = document.getElementById("skillTree");
     if (!tree) return;
   
     const root = tree.querySelector('[data-node="root"]');
     const catsWrap = tree.querySelector("#skillCats");
     const colsWrap = tree.querySelector("#skillCols");
     const svg = tree.querySelector("#skillLines");
   
     if (!root || !catsWrap || !colsWrap || !svg) return;
   
     const SKILL_TREE = {
       title: "SOFTWARE ENGINEER",
       branches: [
         {
           id: "frontend",
           label: "FRONTEND",
           cards: [
             { title: "LANGUAGES", items: ["TypeScript", "JavaScript", "HTML" , "CSS"] },
             { title: "FRAMEWORKS", items: ["Angular (v15–19)", "React"] },
             { title: "UI + UX", items: ["Scalable UI design", "UX polish", "Responsive layout"] }
           ]
         },
         {
           id: "backend",
           label: "BACKEND",
           cards: [
             { title: "CORE", items: ["Java", "Python", "Spring Boot", "REST APIs"] },
             { title: "SERVER UI", items: ["Thymeleaf"] },
             { title: "RUNTIME", items: ["Node.js", "npm"] },
             { title: "QUALITY", items: ["Input validation", "Test planning / execution / reporting"] },
             { title: "ARCHITECTURE", items: ["OOP", "MVC/MVVM", "Repository pattern"] }
           ]
         },
         {
           id: "database",
           label: "DATABASE",
           cards: [
             { title: "RDBMS", items: ["MySQL", "SQL"] },
             { title: "MOBILE DATA", items: ["SQLite", "Room ORM", "Room DAOs"] },
             { title: "PATTERNS", items: ["Repository pattern", "Entity relationships"] },
             { title: "SECURITY", items: ["Parameterized queries (SQL injection prevention)"] },
             { title: "MODELING", items: ["Data modeling", "Schema design", "Indexing basics"] }
           ]
         },
         {
           id: "devops",
           label: "DEVOPS",
           cards: [
             { title: "CONTAINERS", items: ["Docker", "Containerization"] },
             { title: "CI/CD", items: ["GitLab CI/CD"] },
             { title: "APIS", items: ["World Bank API", "REST APIs", "Internationalization"] },
             { title: "FORMATTING", items: ["Currency + time zone formatting"] },
             { title: "TOOLS", items: ["Postman", "Git/GitLab", "VS Code", "IntelliJ", "PyCharm"] },
             { title: "AI TOOLS", items: ["GitHub Copilot", "ChatGPT"] }
           ]
         },
         {
           id: "mobile",
           label: "MOBILE",
           cards: [
             { title: "PLATFORM", items: ["Android Studio", "Android SDK (API 26+ / Android 8.0+)"] },
             { title: "UI", items: ["XML layouts", "Material components", "RecyclerView + Adapters"] },
             { title: "SYSTEM", items: ["Intents (explicit/implicit)", "Notifications", "AlarmManager"] },
             { title: "BUILD", items: ["Gradle", "APK generation", "AAB signing"] },
             { title: "RELEASE", items: ["Google Play Console (deployment)"] }
           ]
         }
       ]
     };
   
     renderSkillTree();
     bindSkillPlanner();
     wireTrackPills(tree);
     wireCardInspect(tree);
   
     requestAnimationFrame(() => drawSkillLines(tree));
     window.addEventListener("resize", () => drawSkillLines(tree), { passive: true });
   
     window.addEventListener("scroll", () => drawSkillLines(tree), { passive: true });
   
     function renderSkillTree() {
       const titleEl = tree.querySelector("[data-skill-title]");
       const subEl = tree.querySelector("[data-skill-subtitle]");
       if (titleEl) titleEl.textContent = SKILL_TREE.title;
       if (subEl) subEl.textContent = SKILL_TREE.subtitle;
   
       catsWrap.innerHTML = "";
       SKILL_TREE.branches.forEach((b) => {
         const pill = document.createElement("button");
         pill.type = "button";
         pill.className = "cat-pill";
         pill.dataset.node = `cat-${b.id}`;
         pill.dataset.branch = b.id;
         pill.dataset.track = b.id;
         pill.setAttribute("aria-pressed", "false");
         pill.innerHTML = `
           <div class="cat-label">${escapeHTML(b.label)}</div>
         `;
         catsWrap.appendChild(pill);
       });
   
       colsWrap.innerHTML = "";
       SKILL_TREE.branches.forEach((b) => {
         const col = document.createElement("div");
         col.className = "skill-col";
         col.dataset.branch = b.id;
   
         b.cards.forEach((c, idx) => {
           const card = document.createElement("button");
           card.type = "button";
           card.className = "skill-card";
           card.dataset.branch = b.id;
           card.dataset.cardIndex = String(idx);
           card.innerHTML = `
             <div class="skill-card-title">${escapeHTML(c.title)}</div>
             <div class="skill-card-items">
               ${c.items.map(x => `<div class="skill-item">${escapeHTML(x)}</div>`).join("")}
             </div>
           `;
           col.appendChild(card);
         });
   
         colsWrap.appendChild(col);
       });
   
       applySkillTreeFilter(skillTreeFilter);
     }
   
     function applySkillTreeFilter(filter) {
       const isFiltering = !!filter || (skillTreeTracked && skillTreeTracked.size > 0);
       tree.classList.toggle("is-filtering", isFiltering);
   
       const activeBranches = new Set();
   
       skillTreeTracked.forEach((b) => activeBranches.add(b));
   
       if (filter === "fullstack") {
         SKILL_TREE.branches.forEach((b) => activeBranches.add(b.id));
       } else if (filter) {
         activeBranches.add(filter);
       }
   
       tree.querySelectorAll(".cat-pill").forEach((pill) => {
         const b = pill.dataset.branch;
         const active = activeBranches.has(b);
         pill.classList.toggle("is-active", active);
       });
   
       tree.querySelectorAll(".skill-card").forEach((card) => {
         const b = card.dataset.branch;
         const active = activeBranches.has(b);
         card.classList.toggle("is-active", active);
       });
   
       drawSkillLines(tree);
     }
   
    function bindSkillPlanner(){
      const skillsZone = document.querySelector('#skills');
      if (!skillsZone) return;
    
      const planner = skillsZone.querySelector('.planner');
      const treeEl  = skillsZone.querySelector('#skillTree');
      if (!planner || !treeEl) return;
    
      function setActivePlannerButton(value){
        planner.querySelectorAll('button[data-skill-filter]').forEach(b => {
          b.classList.toggle('is-active', b.dataset.skillFilter === value);
        });
      }
    
      planner.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-skill-filter]');
        if (!btn) return;
    
        e.preventDefault();
        e.stopPropagation();
    
        const filter = btn.dataset.skillFilter;

        if (filter === 'reset') {
          setActivePlannerButton(null);
        
          // clear ALL tree state (including clicking the column title pills)
          skillTreeFilter = null;
          skillTreeTracked.clear();
        
          // clear pill UI states
          treeEl.querySelectorAll(".cat-pill").forEach(p => {
            p.classList.remove("is-tracked", "is-active");
            p.setAttribute("aria-pressed", "false");
          });
        
          // clear card highlights
          treeEl.querySelectorAll(".skill-card").forEach(c => c.classList.remove("is-active"));
        
          // reset perk detail panel text 
          const perkTitle = document.querySelector("#perk-detail .perk-title");
          const perkBody  = document.querySelector("#perk-detail .perk-body");
          if (perkTitle) perkTitle.textContent = "Select a perk";
          if (perkBody)  perkBody.textContent = "Click a node to view details.";
        
          if (typeof applySkillTreeFilter === "function") applySkillTreeFilter(null);
          return;
        }        
    
        setActivePlannerButton(filter);
        if (typeof applySkillTreeFilter === 'function') applySkillTreeFilter(filter);
      });
    }
    

     function wireTrackPills(treeEl) {
       treeEl.querySelectorAll(".cat-pill").forEach((pill) => {
         pill.addEventListener("click", (e) => {
           e.preventDefault();
           e.stopPropagation();
   
           const branch = pill.dataset.branch;
           if (!branch) return;
   
           const isTracked = skillTreeTracked.has(branch);
           if (isTracked) skillTreeTracked.delete(branch);
           else skillTreeTracked.add(branch);
   
           pill.setAttribute("aria-pressed", String(!isTracked));
           pill.classList.toggle("is-tracked", !isTracked);
   
           applySkillTreeFilter(skillTreeFilter);
         });
       });
     }
   
     function wireCardInspect(treeEl) {
      const perkBox = document.getElementById("perk-detail");
      const perkTitle = perkBox?.querySelector(".perk-title");
      const perkBody  = perkBox?.querySelector(".perk-body");      
   
       treeEl.querySelectorAll(".skill-card").forEach((card) => {
         card.addEventListener("click", (e) => {
           e.preventDefault();
           e.stopPropagation();
   
           const branch = card.dataset.branch;
           const idx = Number(card.dataset.cardIndex || 0);
           const b = SKILL_TREE.branches.find(x => x.id === branch);
           if (!b) return;
           const c = b.cards[idx];
           if (!c) return;
   
           if (perkTitle) perkTitle.textContent = c.title;
           if (perkBody) perkBody.innerHTML = c.items.map(i => `<div>• ${escapeHTML(i)}</div>`).join("");

          applySkillTreeFilter(branch);

          awardXP(8, "Selected perk");
          playSfx("confirm");
          unlock("skill_perk_selected");

         });
       });
     }
   
     function drawSkillLines(treeEl) {

      const canvas = treeEl.querySelector("#skillCanvas") || treeEl;
      const canvasRect = canvas.getBoundingClientRect();


       const svgEl = treeEl.querySelector("#skillLines");
       const rootEl = treeEl.querySelector('[data-node="root"]');
       if (!svgEl || !rootEl) return;
   
       const treeRect = treeEl.getBoundingClientRect();
       const rootRect = rootEl.getBoundingClientRect();
   
       const width = Math.max(1, canvasRect.width);
       const height = Math.max(1, canvasRect.height);
   
       svgEl.setAttribute("viewBox", `0 0 ${width} ${height}`);
       svgEl.setAttribute("width", `${width}`);
       svgEl.setAttribute("height", `${height}`);
       svgEl.setAttribute("preserveAspectRatio", "none");
   
       // clear
       while (svgEl.firstChild) svgEl.removeChild(svgEl.firstChild);
   
       const rootX = rootRect.left + rootRect.width / 2 - canvasRect.left;
       const rootY = rootRect.top + rootRect.height - canvasRect.top;
   
       const activeBranches = new Set();
       if (skillTreeFilter === "fullstack") {
         SKILL_TREE.branches.forEach(b => activeBranches.add(b.id));
       } else if (skillTreeFilter) {
         activeBranches.add(skillTreeFilter);
       }
       skillTreeTracked.forEach(b => activeBranches.add(b));
   
       const cats = Array.from(treeEl.querySelectorAll('.cat-pill[data-node^="cat-"]'));
   
       const CAT_DOT_R = 4;
       const CARD_DOT_R = 3;
       const GAP = 8; 
   
       cats.forEach((cat) => {
         const catId = (cat.dataset.node || "").replace("cat-", "");
         const catRect = cat.getBoundingClientRect();
   
         const cx = catRect.left + catRect.width / 2 - canvasRect.left;
         const cy = catRect.top - canvasRect.top;
   
         const isActive = activeBranches.has(catId);
         const lineClass = isActive ? "branch-strong" : "branch";
   
         const rootLine = lineNS("line", {
           x1: rootX, y1: rootY,
           x2: cx, y2: cy,
           class: lineClass,
           "stroke-linecap": "round"
         });
         svgEl.appendChild(rootLine);
   
   
         const cards = Array.from(treeEl.querySelectorAll(`.skill-card[data-branch="${catId}"]`));
         if (cards.length === 0) return;
   
         const points = cards.map((card) => {
           const r = card.getBoundingClientRect();
           const cardX = r.left + r.width * 0.15 - canvasRect.left;
           const cardY = r.top + r.height / 2 - canvasRect.top;
           return { card, x: cardX, y: cardY };
         });
   
         const spineX = cx;
  
         points.sort((a, b) => a.y - b.y);
   
         let prevY = cy;
   
         points.forEach((pt, i) => {
           const nextY = pt.y;
   
           const y1 = prevY + (i === 0 ? (CAT_DOT_R + GAP) : (CARD_DOT_R + GAP));
           const y2 = nextY - (CARD_DOT_R + GAP);
   
           if (y2 > y1) {
             svgEl.appendChild(lineNS("line", {
               x1: spineX, y1,
               x2: spineX, y2,
               class: "branch-spine",
               "stroke-linecap": "round"
             }));
           }
   
           const cardActive = pt.card.classList.contains("is-active");
           const drawStrong = isActive || cardActive;
   
           const hx1 = spineX;
           const hx2 = pt.x - (CARD_DOT_R + GAP);
   
           if (hx2 > hx1) {
             svgEl.appendChild(lineNS("line", {
               x1: hx1, y1: pt.y,
               x2: hx2, y2: pt.y,
               class: drawStrong ? "branch-strong" : "branch",
               "stroke-linecap": "round"
             }));
           }
   
   
           prevY = nextY;
         });
       });
   
       function lineNS(tag, attrs) {
         const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
         Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, String(v)));
         return el;
       }
       function circleNS(x, y, r, fill) {
         const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
         c.setAttribute("cx", String(x));
         c.setAttribute("cy", String(y));
         c.setAttribute("r", String(r));
         c.setAttribute("fill", fill);
         return c;
       }
     }
   }

  function nextXPFor(level) {
    const idx = Math.max(1, level) - 1;
    if (idx < XP_TABLE.length) return XP_TABLE[idx];
    return 1200 + (level - XP_TABLE.length) * 180;
  }
  function syncHUD() {
    const lvl = state.level || 1;
    const xp = state.xp || 0;
    const next = nextXPFor(lvl);
    hudLevel.textContent = String(lvl);
    hudXp.textContent = String(xp);
    hudNext.textContent = String(next);
  }
  syncHUD();

  let introComplete = false;


  let didAutoScroll = false;

  function revealApp(skipAutoScroll = false) {
    if (!introComplete) return;
    if (app.classList.contains("app-unlocked")) return;
  
    nightScene.classList.add("released");
  
    app.classList.remove("app-locked");
    app.classList.add("app-unlocked");
    app.setAttribute("aria-hidden", "false");
  
    if (!skipAutoScroll && !didAutoScroll) {
      didAutoScroll = true;
      requestAnimationFrame(() => scrollToZone("about"));
    }
  }  

  

  window.addEventListener("wheel", () => { if (introComplete) revealApp(); }, { passive: true });
  window.addEventListener("touchmove", () => { if (introComplete) revealApp(); }, { passive: true });
  window.addEventListener("keydown", (e) => {
    if (!introComplete) return;
    if (["ArrowDown", "PageDown", " "].includes(e.key)) revealApp();
  });

  // Intro transition
  let transitioned = false;
  enterBtn.addEventListener("click", async (e) => {
    e.stopPropagation();
    if (transitioned) return;
    transitioned = true;
    unlock("enter_night");
    awardXP(25, "Entered portfolio");    
    nightScene.style.pointerEvents = "auto";

    const tl = gsap.timeline();
    tl.set(plane, { opacity: 1 });

    tl.to(plane, {
      duration: 2.6,
      ease: "power2.inOut",
      motionPath: {
        path: [
          { x: -200, y: 0 },
          { x: window.innerWidth * 0.25, y: -80 },
          { x: window.innerWidth * 1.15, y: 50 }
        ]
      }
    }, 0);

    tl.to(sunsetScene, { duration: 2.0, opacity: 0, ease: "power2.inOut" }, 0.35);
    tl.to(nightScene, { duration: 2.0, opacity: 1, ease: "power2.inOut" }, 0.35);

    tl.add(() => {
      sunsetScene.classList.add("hidden");
      gsap.set(plane, { opacity: 0 });

      introComplete = true;
      startOrbit(); 
      bindSkillsOnce();
    }, "+=0.1");
  });

  // Orbit nav
  function createNavStar(label, sectionId) {
    const star = document.createElement("div");
    star.className = "nav-star";
    star.innerHTML = `
      <img src="assets/star-nav.svg" alt="${label}">
      <span>${label}</span>
    `;
    star.addEventListener("click", () => {
      revealApp(true); // prevent forced scroll
      playSfx("confirm");
      awardXP(10, `Navigated to ${label}`);
      scrollToZone(sectionId);
      trackVisit(sectionId);
    });    
    return star;
  }

  function startOrbit() {
    const backOrbit = document.getElementById("orbit-back");
    const frontOrbit = document.getElementById("orbit-front");
    if (!backOrbit || !frontOrbit) return;

    backOrbit.innerHTML = "";
    frontOrbit.innerHTML = "";

    const stars = [
      createNavStar("About", "about"),
      createNavStar("Projects", "projects"),
      createNavStar("Skills", "skills"),
      createNavStar("Contact", "contact")
    ];
    stars.forEach(s => backOrbit.appendChild(s));

    const orbitRect = backOrbit.getBoundingClientRect();
    const cx = orbitRect.width / 2;
    const cy = orbitRect.height / 2;

    const rx = Math.min(250, orbitRect.width * 0.46);
    const ry = Math.min(190, orbitRect.height * 0.36);

    const offsetsDeg = [0, 90, 180, 270];
    const secondsPerRev = 20;
    const degPerSec = 360 / secondsPerRev;

    const FRONT_THRESHOLD = 0.62;

    const start = performance.now();

    function frame(now) {
      const t = (now - start) / 1000;

      stars.forEach((star, i) => {
        const deg = offsetsDeg[i] + t * degPerSec;
        const rad = (deg * Math.PI) / 180;

        const x = cx + Math.cos(rad) * rx;
        const y = cy + Math.sin(rad) * ry;

        star.style.left = `${x}px`;
        star.style.top = `${y}px`;
        star.style.transform = "translate(-50%, -50%)";

        const shouldBeFront = Math.cos(rad) > FRONT_THRESHOLD;
        if (shouldBeFront) {
          if (star.parentElement !== frontOrbit) frontOrbit.appendChild(star);
        } else {
          if (star.parentElement !== backOrbit) backOrbit.appendChild(star);
        }
      });

      requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
  }

  function trackVisit(zoneId) {
    visited.add(zoneId);
    state.visitedZones = Array.from(visited);
    saveState();

    const needed = ["about", "projects", "skills", "contact"];
    const allVisited = needed.every(id => visited.has(id));
    if (allVisited) unlock("visit_all_zones");
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach((ent) => {
      if (ent.isIntersecting) trackVisit(ent.target.id);
    });
  }, { threshold: 0.35 });

  ["about", "projects", "skills", "contact"].forEach(id => {
    const el = document.getElementById(id);
    if (el) io.observe(el);
  });
  
  document.querySelectorAll(".open-project").forEach(btn => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.project;
      const info = projectData[key];
      if (!info) return;

      openModal(projectModal, { title: info.title, body: info.body });

      state.projectsInspected = (state.projectsInspected || 0) + 1;
      saveState();

      awardXP(15, "Inspected project");
      playSfx("confirm");

      if (state.projectsInspected >= 3) unlock("inspect_3_projects");
    });
  });

  btnRandom?.addEventListener("click", () => {
    const cards = Array.from(document.querySelectorAll("#project-grid .card:not(.card-placeholder)"));
    if (!cards.length) return;
    const pick = cards[Math.floor(Math.random() * cards.length)];
    pick.scrollIntoView({ behavior: "smooth", block: "center" });
    awardXP(5, "Random mission");
    playSfx("confirm");
    });

  filterSel?.addEventListener("change", applyProjectView);
  sortSel?.addEventListener("change", applyProjectView);

  function applyProjectView() {
    const filter = filterSel?.value || "all";
    const sort = sortSel?.value || "featured";
    const grid = document.getElementById("project-grid");
    if (!grid) return;

    const cards = Array.from(grid.children);

    cards.forEach(card => {
      if (card.classList.contains("card-placeholder")) return;
      const type = card.getAttribute("data-type") || "all";
      card.style.display = (filter === "all" || type === filter) ? "" : "none";
    });

    const real = cards.filter(c => !c.classList.contains("card-placeholder"));
    const placeholders = cards.filter(c => c.classList.contains("card-placeholder"));

    const visible = real.filter(c => c.style.display !== "none");
    const hidden = real.filter(c => c.style.display === "none");

    visible.sort((a, b) => {
      if (sort === "featured") return (Number(b.dataset.featured || 0) - Number(a.dataset.featured || 0));
      if (sort === "difficulty") {
        const rank = { S: 4, A: 3, B: 2, C: 1 };
        return (rank[b.dataset.difficulty] || 0) - (rank[a.dataset.difficulty] || 0);
      }
      return 0;
    });

    grid.innerHTML = "";
    visible.forEach(c => grid.appendChild(c));
    hidden.forEach(c => grid.appendChild(c));
    placeholders.forEach(c => grid.appendChild(c));

    awardXP(2, "Adjusted projects");
  }

  function sortByCompletionStatus(projects){
    return [...projects].sort((a, b) => {
      const rank = status =>
        status?.toLowerCase() === "completed" ? 0 : 1;
  
      const statusDiff = rank(a.status) - rank(b.status);
      if (statusDiff !== 0) return statusDiff;
  
      // command to sort by newly updated first inside completed - commenting ut for now: return new Date(b.lastUpdated) - new Date(a.lastUpdated);
    });
  }  

  const treeWrap = document.getElementById("tree-wrap");
  const treeLines = document.getElementById("tree-lines");
  const perkDetail = document.getElementById("perk-detail");

  const NODE_INFO = {
    core: { title: "Core", body: "Fundamentals: clean code, modularity, docs, testing habits.", build: ["all","frontend","backend","fullstack"] },
    frontend: { title: "Frontend", body: "Components, state, accessibility, performance, UX polish.", build: ["all","frontend","fullstack"] },
    backend: { title: "Backend", body: "REST design, caching, reliability, integrations.", build: ["all","backend","fullstack"] },
    angular: { title: "Angular", body: "Typed services, routing, feature modules, UI states.", build: ["all","frontend","fullstack"] },
    ux: { title: "UX Polish", body: "Micro-interactions, spacing, keyboard nav, reduced motion.", build: ["all","frontend","fullstack"] },
    spring: { title: "Spring Boot", body: "Layering, validation, DTOs, caching, clean services.", build: ["all","backend","fullstack"] },
    apis: { title: "API Design", body: "Stable contracts, consistent errors, integration safety.", build: ["all","backend","fullstack"] },
    db: { title: "SQL", body: "Schema design, joins, indexes, query performance.", build: ["all","backend","fullstack"] },
    testing: { title: "Testing", body: "Unit + integration tests, testable architecture.", build: ["all","backend","fullstack"] },
    devops: { title: "CI/CD", body: "Pipelines, env config, deployment readiness.", build: ["all","backend","fullstack"] }
  };

  const EDGES = [
    ["core","frontend"],["core","backend"],
    ["frontend","angular"],["frontend","ux"],
    ["backend","spring"],["backend","apis"],
    ["spring","db"],["apis","testing"],
    ["ux","devops"],["db","devops"]
  ];

  function drawEdges() {
    if (!treeWrap || !treeLines) return;
    const rect = treeWrap.getBoundingClientRect();
    treeLines.setAttribute("viewBox", `0 0 ${rect.width} ${rect.height}`);
    treeLines.innerHTML = "";

    const nodeEls = new Map();
    document.querySelectorAll(".node").forEach(n => nodeEls.set(n.dataset.node, n));

    EDGES.forEach(([a, b]) => {
      const na = nodeEls.get(a);
      const nb = nodeEls.get(b);
      if (!na || !nb) return;

      const ra = na.getBoundingClientRect();
      const rb = nb.getBoundingClientRect();

      const ax = (ra.left + ra.width/2) - rect.left;
      const ay = (ra.top + ra.height/2) - rect.top;
      const bx = (rb.left + rb.width/2) - rect.left;
      const by = (rb.top + rb.height/2) - rect.top;

      const mx = (ax + bx) / 2;
      const my = (ay + by) / 2;
      const curve = 40;

      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", `M ${ax} ${ay} Q ${mx} ${my - curve} ${bx} ${by}`);
      path.setAttribute("fill", "none");
      path.setAttribute("stroke", "rgba(255,255,255,0.22)");
      path.setAttribute("stroke-width", "2");
      treeLines.appendChild(path);
    });
  }

  setTimeout(drawEdges, 200);
  window.addEventListener("resize", () => {
    clearTimeout(window.__treeResizeT);
    window.__treeResizeT = setTimeout(drawEdges, 120);
  });

  document.querySelectorAll(".copy-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const sel = btn.dataset.copy;
      const el = sel ? document.querySelector(sel) : null;
      if (!el) return;
      try {
        await navigator.clipboard.writeText(el.textContent || "");
        showToast("Copied", el.textContent || "", 1400);
        awardXP(10, "Copied channel");
        playSfx("confirm");        
        unlock("copy_channel");
      } catch {
        showToast("Copy failed", "Clipboard blocked by browser.", 1800);
      }
    });
  });

  document.getElementById("btn-resume")?.addEventListener("click", () => {
    const resumeUrl = "assets/resume/resumeKDaniel.pdf";
      if (typeof playSfx === "function") playSfx("confirm");
    else beep({ freq: 660, dur: 0.04, gain: 0.02 });
  
    awardXP(5, "Downloaded resume");
      const a = document.createElement("a");
    a.href = resumeUrl;
    a.download = "resumeKDaniel.pdf"; 
    a.target = "_blank";           
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
  
    showToast("Resume", "Downloading…", 1200);
  });
  

  // Sound toggle
  btnSound.setAttribute("aria-pressed", String(state.soundOn));
  btnSound.textContent = `Sound: ${state.soundOn ? "On" : "Off"}`;

  btnSound.addEventListener("click", async () => {
    state.soundOn = !state.soundOn;
    saveState();

    btnSound.setAttribute("aria-pressed", String(state.soundOn));
    btnSound.textContent = `Sound: ${state.soundOn ? "On" : "Off"}`;

    if (state.soundOn) {
      ensureAudio();
      if (audioCtx?.state === "suspended") await audioCtx.resume();
      initSfx();
      playSfx("confirm");
      unlock("toggle_sound");
      showToast("Audio Online", "Sound effects enabled.", 1300);
    } else {
      showToast("Audio Offline", "Sound effects disabled.", 1300);
    }
  });

  // Trophies
  btnAchievements.addEventListener("click", () => {
    renderTrophies();
    openModal(trophyModal);
    awardXP(3, "Opened trophies");
    playSfx("confirm");
  });

  document.getElementById("btn-reset-progress")?.addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEY);
    location.reload();
  });

  document.querySelectorAll("[data-close='1']").forEach(el => {
    el.addEventListener("click", () => closeAnyModal());
  });
  document.getElementById("modal-close")?.addEventListener("click", () => closeModal(projectModal));
  document.getElementById("trophy-close")?.addEventListener("click", () => closeModal(trophyModal));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeAnyModal(); });

  function closeAnyModal() { closeModal(projectModal); closeModal(trophyModal); }
  function openModal(modalEl, content) {
    if (!modalEl) return;
    if (content && modalEl === projectModal) {
      document.getElementById("modal-title").textContent = content.title || "Project";
      document.getElementById("modal-body").innerHTML = content.body || "";
    }
    modalEl.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }
  function closeModal(modalEl) {
    if (!modalEl) return;
    modalEl.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }


  function wireModalGallery(modalEl) {
    if (!modalEl) return;
  
    modalEl.querySelectorAll(".shot").forEach(btn => {
      btn.onclick = () => {
        const src = btn.dataset.img;
        if (!src) return;
        openImageModal(src);
      };
    });
  }

  document.addEventListener("click", (e) => {
    const close = e.target.closest("[data-close='true']");
    if (!close) return;
    const modal = e.target.closest(".modal");
    if (!modal) return;
    modal.setAttribute("aria-hidden", "true");
  });
  
  
  function openImageModal(src) {
    const modal = document.getElementById("image-modal");
    const img = modal?.querySelector("img");
    if (!modal || !img) return;
  
    img.src = src;
    modal.setAttribute("aria-hidden", "false");
  }
  
  // Achievements
  function unlock(id) {
    state.achievements = state.achievements || {};
    if (state.achievements[id]) return;
    state.achievements[id] = true;
    saveState();
    const a = ACHIEVEMENTS.find(x => x.id === id);
    if (a) {
      showToast("Trophy Unlocked", a.name, 6000);
      playSfx("confirm");
      awardXP(20, `Trophy: ${a.name}`, { silent: true });
    }
  }

  function renderTrophies() {
    trophyGrid.innerHTML = "";
    const unlocked = state.achievements || {};
    ACHIEVEMENTS.forEach(a => {
      const el = document.createElement("div");
      const isUnlocked = !!unlocked[a.id];
      el.className = `trophy ${isUnlocked ? "" : "locked"}`;
      el.innerHTML = `
        <div class="trophy-name">${escapeHTML(a.name)}</div>
        <div class="trophy-desc">${escapeHTML(a.desc)}</div>
        <div class="trophy-state">${isUnlocked ? "Unlocked" : "Locked"}</div>
      `;
      trophyGrid.appendChild(el);
    });
  }
  
  // places user at correct section upon scrolling
  function scrollToZone(id) {
    const target = document.getElementById(id);
    if (!target) return;
  
    const nav = document.querySelector(".hud");
    const navH = nav ? nav.getBoundingClientRect().height : 80;
  
    const y =
      window.scrollY +
      target.getBoundingClientRect().top -
      navH -
      0; 
  
    window.scrollTo({ top: y, behavior: "smooth" });
  }
  

  // XP/level
  function awardXP(amount, reason, opts = {}) {
    if (!Number.isFinite(amount) || amount <= 0) return;
    state.xp = (state.xp || 0) + amount;

    while (true) {
      const lvl = state.level || 1;
      const next = nextXPFor(lvl);
      if (state.xp >= next) {
        state.xp -= next;
        state.level = lvl + 1;
        saveState();
        syncHUD();
        showToast("Level Up", `Reached level ${state.level}`, 6000);
        if (!opts.silent) playSfx("confirm");        
      } else break;
    }

    saveState();
    syncHUD();
    if (reason && !opts.silent && amount >= 10) showToast("+XP", `${amount} XP · ${reason}`, 6000);
  }


  function getQuestsForProject(projectId) {
    return (portfolioData.quests || [])
      .filter(q => q.projectId === projectId)
      .sort((a, b) => {
        const ad = a.completedOn ? new Date(a.completedOn).getTime() : Infinity;
        const bd = b.completedOn ? new Date(b.completedOn).getTime() : Infinity;
        return ad - bd;
      });
  }
  
  function showToast(title, body, ms = 1600) {
    const el = document.createElement("div");
    el.className = "toast";
    el.innerHTML = `
      <div class="toast-title">${escapeHTML(title)}</div>
      <div class="toast-body">${escapeHTML(body)}</div>
    `;
    toastWrap.appendChild(el);
    setTimeout(() => {
      el.style.opacity = "0";
      el.style.transform = "translateY(6px)";
      setTimeout(() => el.remove(), 250);
    }, ms);
  }

  function escapeHTML(str) {
    return String(str).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");
  }

  function formatDate(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
  }

  function formatStatus(status) {
    const s = String(status || "")
      .trim()
      .toLowerCase()
      .replace(/[\s-]+/g, "_"); 
  
    if (s === "completed") return "Completed";
    if (s === "in_progress") return "In Progress";
    return "—";
  }
  
  

  async function fetchGitHubLastUpdated(repo, timeEl) {
    if (!repo || !timeEl) return;
  
    try {
      const res = await fetch(`https://api.github.com/repos/${repo}`, {
        headers: { "Accept": "application/vnd.github+json" }
      });
  
      if (!res.ok) throw new Error("GitHub API error");
  
      const data = await res.json();
      if (!data.pushed_at) throw new Error("No pushed_at");
  
      const date = formatDate(data.pushed_at);
      timeEl.textContent = date;
      timeEl.setAttribute("datetime", data.pushed_at);
  
    } catch (err) {
      console.warn("GitHub date fallback for", repo);
      if (timeEl.dataset.fallback) {
        timeEl.textContent = timeEl.dataset.fallback;
      }
    }
    
  }
  
  
  function wireDynamicQuestButtons() {
    document.querySelectorAll(".open-quest").forEach(btn => {
      btn.onclick = () => {
        if (typeof revealApp === "function") revealApp();
        document.getElementById("about")?.scrollIntoView({ behavior: "smooth" });
  
        const questId = btn.dataset.quest;
        setTimeout(() => {
          const target = document.querySelector(`.quest-item[data-quest-id="${questId}"]`);
          if (!target) return;
          target.classList.add("quest-highlight");
          target.scrollIntoView({ behavior: "smooth", block: "center" });
          setTimeout(() => target.classList.remove("quest-highlight"), 1600);
        }, 350);
      };
    });
  }
  
  function wireDynamicProjectButtons() {
    document.querySelectorAll(".open-project").forEach(btn => {
      btn.onclick = () => {
        const projectId = btn.dataset.project;
        const p = (portfolioData.projects || []).find(x => x.id === projectId);
        if (!p) return;
  
        const quests = getQuestsForProject(p.id);

        const questHtml = quests.length
          ? `<div class="divider"></div>
            <h4 class="modal-h">Quest Log</h4>
            <div class="quest-list">
              ${quests.map(q => `
                <div class="quest-row ${q.status === "completed" ? "is-done" : ""}">
                  <div class="quest-row-title">${escapeHTML(q.title)}</div>
                  <div class="quest-row-meta">
                    <span class="quest-chip">${q.status === "completed" ? "Completed" : "In Progress"}</span>
                    ${q.completedOn ? `<span class="quest-date">${escapeHTML(formatDate(q.completedOn))}</span>` : ""}
                  </div>
                  ${q.desc ? `<div class="quest-row-desc">${escapeHTML(q.desc)}</div>` : ""}
                </div>
              `).join("")}
            </div>`
          : "";

        const gallery = (p.images?.gallery || []).slice(0, 8);
        const galleryHtml = gallery.length
          ? `<div class="divider"></div>
            <h4 class="modal-h">Screenshots</h4>
            <div class="shot-grid">
              ${gallery.map(src => `
                <button class="shot" type="button" data-img="${escapeHTML(src)}" aria-label="Open screenshot">
                  <img src="${escapeHTML(src)}" alt="" loading="lazy">
                </button>
              `).join("")}
            </div>`
          : "";

        openModal(projectModal, {
          title: p.title,
          body: `
            <p class="muted">${escapeHTML(p.desc || "")}</p>

            <div class="divider"></div>
            <p><b>Status:</b> ${formatStatus(p.status)}</p>
            ${galleryHtml}
            ${questHtml}
          `
        });

        wireModalGallery(projectModal);

          
                state.projectsInspected = (state.projectsInspected || 0) + 1;
                saveState();
                awardXP(15, "Inspected project");
                if (state.projectsInspected >= 3) unlock("inspect_3_projects");
              };
            });
          }
          
        
  // Persistence
  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { level: 1, xp: 0, achievements: {}, soundOn: false, visitedZones: [], projectsInspected: 0 };
      const p = JSON.parse(raw);
      return {
        level: p.level ?? 1,
        xp: p.xp ?? 0,
        achievements: p.achievements ?? {},
        soundOn: p.soundOn ?? false,
        visitedZones: p.visitedZones ?? [],
        projectsInspected: p.projectsInspected ?? 0
      };
    } catch {
      return { level: 1, xp: 0, achievements: {}, soundOn: false, visitedZones: [], projectsInspected: 0 };
    }
  }
  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  renderTrophies();
});
