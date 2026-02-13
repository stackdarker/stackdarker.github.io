# stackdarker.github.io

A gamified personal portfolio built with vanilla HTML, CSS, and JavaScript. Projects are framed as missions, skills as a skill tree, and user interactions earn XP and unlock achievements — all without a single framework dependency.

**Live site:** [stackdarker.github.io](https://stackdarker.github.io)

---

## Features

### Intro & Navigation
- Animated sunset-to-night scene transition powered by GSAP
- Orbital star navigation that rotates around a central avatar
- Smooth scroll between zones with keyboard, scroll, and touch support

### Character Sheet
- Profile photo carousel on hover
- Stat ratings (UI, Backend, Data, Ship) with interactive tooltips
- Certification badges (AWS CCP, ITIL 4, CompTIA Project+)

### Mission Select (Projects)
- Filterable project card grid (Full-Stack, Front-End, Back-End, Infrastructure)
- Sortable by Featured or Difficulty (S/A/B rank system)
- Hover-to-cycle image previews with crossfade transitions
- Inspect modals with screenshot galleries, quest logs, and GitHub links
- Random Mission button

### Skill Tree
- Interactive build planner with category filters (Frontend, Backend, Database, DevOps, Mobile)
- Hierarchical skill nodes connected by dynamic SVG lines
- Click nodes to view perk details and track categories

### Gamification
- XP & leveling system with a 10-tier progression table
- 6 unlockable achievements (First Contact, World Explorer, Investigator, etc.)
- Persistent progress saved to localStorage
- HUD displaying live LVL, XP, and trophy count
- Optional sound effects

### Comms Terminal (Contact)
- Copy-to-clipboard for Email, GitHub, and LinkedIn
- Resume PDF download

---

## Tech Stack

| Layer       | Technology                          |
|-------------|-------------------------------------|
| Markup      | HTML5, semantic with ARIA labels    |
| Styling     | CSS3 (variables, grid, flexbox, animations) |
| Logic       | Vanilla JavaScript (~1,200 lines)   |
| Animation   | GSAP 3.12.5 + MotionPathPlugin     |
| Graphics    | Custom SVGs (sun, moon, clouds, plane, avatar) |
| Data        | JSON (`data/portfolio.json`)        |
| Hosting     | GitHub Pages                        |

No build tools, no bundlers, no compilation step.

---

## Project Structure

```
stackdarker.github.io/
├── index.html              # Single-page markup
├── main.js                 # All application logic
├── style.css               # All styling
├── data/
│   └── portfolio.json      # Projects and quest data
├── assets/
│   ├── svg/                # Animated scene elements
│   ├── projects/           # Project screenshots by folder
│   ├── resume/             # Downloadable resume PDF
│   └── sfx/                # Sound effects
└── README.md
```

---

## Data Format

Projects and quests are driven by `data/portfolio.json`. Adding a new project is as simple as appending to the array:

```json
{
  "id": "project-id",
  "title": "Project Name",
  "type": "fullstack",
  "difficulty": "S",
  "boss": "Challenge Name",
  "desc": "Short description.",
  "repo": "owner/repo",
  "tags": ["Tech1", "Tech2"],
  "links": { "github": "https://...", "live": "" },
  "status": "Completed",
  "images": {
    "preview": "assets/projects/folder/preview.png",
    "gallery": ["assets/projects/folder/1.png"]
  }
}
```

---

## Running Locally

No install required — just serve the static files:

```bash
# Python
python -m http.server 8000

# Or use VS Code Live Server extension
# Right-click index.html → "Open with Live Server"
```

Then open `http://localhost:8000`.

---

## Design Notes

- **Color palette:** Dark theme anchored on `#050607` with `#e6e9ee` text
- **Typography:** System font stack + JetBrains Mono for nav labels
- **Accessibility:** Semantic HTML, ARIA attributes, keyboard navigation, `prefers-reduced-motion` support
- **Responsive:** CSS grid adapts from 3-column (desktop) to single-column (mobile)
