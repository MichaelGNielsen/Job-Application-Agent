# Job Application Agent - Tintin Demo (v2.6.1)

![Gromit laying tracks](pictures/grommit-train-tracks.gif)

*AI der lægger skinnerne i vildskab, mens jobansøgningen buldrer afsted!* 🚂🐶🛠️

Velkommen til den officielle demo af **Job Application Agent**. Dette projekt demonstrerer, hvordan AI transformerer en personlig erfaringsbase (Master CV) til 4 professionelle, målrettede dokumenter på få sekunder. 

Dette er den **officielle præsentations-version (v2.6.1)**, som er 100% GDPR-sikker og baseret udelukkende på Tintins data.

## ⚙️ Miljø-konfiguration (.env)
For at systemet kan køre (især på nye enheder som **Raspberry Pi 5**), skal du oprette to `.env` filer i projektets rodmappe. Brug de medfølgende skabeloner som udgangspunkt:

1.  **`.env_ai`**: Indeholder din Gemini API-nøgle og model-valg.
    *   Kopier fra `.env_ai_template`.
    *   Hent din nøgle her: [Google AI Studio](https://aistudio.google.com/app/apikey).
2.  **`.env_private`**: Indeholder personlige data (Navn, Adresse, Email osv.), som flettes ind i dine dokumenter.
    *   Kopier fra `.env_private_template`.
    *   Her styres identiteten (f.eks. Tintin eller dit eget navn).

## 🚀 Kom i gang med Demoen (RPi5 / Docker)
1.  **Opsæt .env:** Opret de to filer nævnt ovenfor.
2.  **Start Systemet:** Kør `docker compose up -d --build`.
    *(Bemærk: På ældre systemer bruges `docker-compose` med bindestreg).*
3.  **Adgang:** Åbn browseren på `http://[RPi-IP-adresse]:3000`.

## 🔍 Overvågning og Fejlfinding
Hvis systemet driller (f.eks. på en **RPi5**), kan du se loggene live med disse kommandoer:

1.  **Backend (Hjernen):**
    `docker compose logs -f backend`
2.  **Frontend (Brugerfladen):**
    `docker compose logs -f frontend`
3.  **Hele Systemet:**
    `docker compose logs -f`

*(Brug `Ctrl + C` for at stoppe med at følge loggen).*

## 🛠️ Den Nye Skabelon-Motor (v2.6.3)
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
