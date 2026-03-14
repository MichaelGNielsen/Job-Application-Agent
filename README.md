# Job Application Agent - Tintin Demo (v2.6.1)

![Gromit laying tracks](pictures/grommit-train-tracks.gif)

*AI der lægger skinnerne i vildskab, mens jobansøgningen buldrer afsted!* 🚂🐶🛠️

Velkommen til den officielle demo af **Job Application Agent**. Dette projekt demonstrerer, hvordan AI transformerer en personlig erfaringsbase (Master CV) til 4 professionelle, målrettede dokumenter på få sekunder. 

Dette er den **officielle præsentations-version (v2.6.1)**, som er 100% GDPR-sikker og baseret udelukkende på Tintins data.

## 🚀 Kom i gang med Demoen
1.  Åbn terminalen i denne mappe.
2.  Kør: `docker-compose up -d`.
3.  Åbn: [http://localhost:3000](http://localhost:3000) i din browser.

## ⚙️ Den Nye Skabelon-Motor (v2.6.1)
Systemet er nu 100% skabelon-styret via `templates/` mappen:
- **`ai_instructions.md`**: Her ligger AI'ens "hjerne" og opskrift på de 4 dokumenter.
- **`master_layout.html`**: Her styres det visuelle design (CSS) og de unikke "Tintin Highlights"-billeder.
- **Pandoc GFM**: Den professionelle Markdown-motor (GitHub Flavored) sikrer perfekt formatering af bullets, fed skrift og lister.

## 📄 De 4 Magiske Dokumenter
Hver kørsel genererer automatisk en komplet pakke i `output/` mappen:
1.  **Ansøgning (PDF)**: Målrettet, professionel og med automatisk signatur.
2.  **CV (PDF)**: Skræddersyet profil med visuelle "Mission Highlights" (billeder).
3.  **Match Analyse (PDF)**: En ærlig score og gap-analyse mellem job og profil.
4.  **ICAN+ Pitch (PDF)**: Din færdige strategi til selve jobsamtalen.


---
*Sidst opdateret: 14. marts 2026 - Klar til AKA-præsentation!* 🏁🏆🎩
