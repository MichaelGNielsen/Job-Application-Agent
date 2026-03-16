# Job Application Agent - Tintin Demo (v2.7.0)

![Gromit laying tracks](pictures/grommit-train-tracks.gif)

## Det går stærkt i AI-verdenen lige nu 🚂🐶🛠️

At bygge denne agent føles præcis som scenen fra *The Wrong Trousers*, hvor Gromit lægger skinnerne, mens toget kører i fuld fart. Projektet demonstrerer, hvordan AI transformerer en personlig erfaringsbase (Master CV) til 4 professionelle, målrettede dokumenter på få sekunder.

Dette er den **officielle præsentations-version (v2.7.0)**, som er 100% GDPR-sikker og baseret udelukkende på Tintins data.

## ⚙️ Miljø-konfiguration (.env)

For at systemet kan køre (især på nye enheder som **Raspberry Pi 5**), skal du oprette én `.env` fil i projektets rodmappe:

1. **`.env_ai`**: Indeholder din Gemini API-nøgle og model-valg.

  * Kopier fra `.env_ai_template`.
  * Hent din nøgle her: [Google AI Studio](https://aistudio.google.com/app/apikey).

## 🚀 Kom i gang med Demoen (RPi5 / Docker)

1. **Opsæt .env:** Opret `.env_ai` filen nævnt ovenfor.
2. **Master CV:** Dine personlige data og din erhvervserfaring styres nu direkte i `data/brutto_cv.md` (eller via web-interfacet).
3. **Start Systemet:** Kør `docker compose up -d --build`.
    *(Bemærk: På ældre systemer bruges `docker-compose` med bindestreg).*
4. **Adgang:** Åbn browseren på `http://[RPi-IP-adresse]:3000`.

## 📄 De 4 Magiske Dokumenter

Hver kørsel genererer automatisk en komplet pakke i `output/` mappen:

1. **Ansøgning (PDF)**
  * Målrettet, professionel og med automatisk signatur.
2. **CV (PDF)**
  * Skræddersyet profil med visuelle "Mission Highlights" (billeder).
3. **Match Analyse (PDF)**
  * En ærlig score og gap-analyse mellem job og profil.
4. **ICAN+ Pitch (PDF)**
  * Din færdige strategi til selve jobsamtalen.

---

## 📚 Dokumentation & Ressourcer

Her finder du dybere indsigt i systemets opbygning og brug:

* [Systemarkitektur](docs/architecture.md): Teknisk overblik og skabelon-motor.
* [Docker Setup](docs/docker_setup.md): Trin-for-trin guide til installation.
* [Docker Brug](docs/docker_usage.md): Kommandoer til daglig drift og logning.
* [Projekt Journal](docs/journal.md): Udviklingshistorik og fremtidige overvejelser.
* [Debug Guide](docs/curl_debug.md): Værktøjer til teknisk fejlfinding.

*Sidst opdateret: 16. marts 2026* 🎩🚀🏁
