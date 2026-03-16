# 🚀 TODO: Layout, Template Engine & Profiler

Dette er planen for at gøre systemet 100% skabelon-styret og klar til både Tintin og "rigtige" personer.

## 🔜 Kommende (v2.7.0+) - "Rigtige Ansøgere" & Profiler

### 🚀 Næste Store Skridt: Fra Tintin til Rigtige Personer

* [ ] **Profil-Selector:** Mulighed for at vælge mellem "Tintin-mode" og "Standard-mode" i `.env`.
* [ ] **Dynamiske Placeholders:** Erstat alle hårkodede "Tintin"-referencer i `backend/worker.js` med `{{CANDIDATE_NAME}}` fra `.env`.
* [ ] **Konditionel AI-logik:** Juster `ai_instructions.md`, så den kun bruger Milou/Dupont-referencer, når "Tintin-mode" er aktiv.
* [ ] **Master-CV Mapping:** Gør det muligt at indlæse forskellige `brutto_cv.md` filer (f.eks. `brutto_mgn.md`) baseret på den valgte profil.

### 🎨 HTML & Design (CSS)

* [x] **Opret `templates/master_layout.html`**: Flyt CSS og HTML-skelet (Header/Footer) ud af `backend/utils.js`.
* [ ] **Centreret Layout:** Genskab den centrerede "body" i browseren, så indholdet følger med skærmstørrelsen og altid er i midten af vinduet.
* [ ] **Implementér Layout-skift**: Gør det muligt at bruge forskellige layouts (f.eks. "Moderne", "Klassisk").
* [ ] **Billed-support**: Sikre at profilbilleder og logoer fra `pictures/` mappen kan inkluderes dynamisk.

### 🤖 AI & Prompter (Markdown)

* [x] **Opret `templates/ai_instructions.md`**: Flyt AI'ens "opskrift" på de 4 dokumenter (Ansøgning, CV, Match, ICAN+) ud af `backend/worker.js`.
* [ ] **Sektions-styring**: Gøre det nemt at tilføje eller fjerne sektioner.
* [ ] **Markdown Regler (v2.7.0):**

  * [ ] Sikre at der kun er én top-level overskrift (#) per dokument.
  * [ ] Sikre at der kun er ét mellemrum efter liste-markører (- eller *).

### ⚙️ Engine Opdatering (Backend)

* [x] **Dynamisk Indlæsning**: Opdater `server.js` og `worker.js` til at læse fra `templates/` mappen ved hvert job.
* [x] **Variabel-injektion**: Sørg for at `.env_private` data (Navn, Adresse osv.) bliver flettet korrekt ind i HTML-skabelonen.

### 📂 Output-håndtering

* [x] **Organisering**: Sikre at alt output lander i `/output/[timestamp]_[firma]_[stilling]/`.
* [ ] **Cleanup**: Lav en funktion til at slette gamle/midlertidige filer i output-mapperne.

---

*Sidst opdateret: 15. marts 2026 (v2.6.17)*
