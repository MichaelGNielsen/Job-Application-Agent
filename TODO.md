# 🚀 TODO: Layout & Template Engine Refactor

Dette er planen for at gøre systemet 100% skabelon-styret, så layout og AI-instrukser er adskilt fra koden.

## 1. 🎨 HTML & Design (CSS)
- [ ] **Opret `templates/master_layout.html`**: Flyt CSS og HTML-skelet (Header/Footer) ud af `backend/utils.js`.
- [ ] **Implementér Layout-skift**: Gør det muligt at bruge forskellige layouts (f.eks. "Moderne", "Klassisk" eller det "Gamle Tintin Layout").
- [ ] **Billed-support**: Sikre at profilbilleder og logoer fra `pictures/` mappen kan inkluderes dynamisk.

## 2. 🤖 AI & Prompter (Markdown)
- [ ] **Opret `templates/ai_instructions.md`**: Flyt AI'ens "opskrift" på de 4 dokumenter (Ansøgning, CV, Match, ICAN+) ud af `backend/worker.js`.
- [ ] **Sektions-styring**: Gøre det nemt at tilføje eller fjerne sektioner (f.eks. hvis man kun vil have CV og Match).

## 3. ⚙️ Engine Opdatering (Backend)
- [ ] **Dynamisk Indlæsning**: Opdater `server.js` og `worker.js` til at læse fra `templates/` mappen ved hvert job.
- [ ] **Variabel-injektion**: Sørg for at `.env_private` data (Navn, Adresse osv.) bliver flettet korrekt ind i HTML-skabelonen.

## 4. 📂 Output-håndtering
- [ ] **Organisering**: Sikre at alt output lander i `/output/[timestamp]_[firma]_[stilling]/`.
- [ ] **Cleanup**: Lav en funktion til at slette gamle/midlertidige filer i output-mapperne.

---
*Sidst opdateret: Fredag d. 13. marts 2026*
