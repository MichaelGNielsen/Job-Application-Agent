# Systemarkitektur: Job Application Agent (v2.4)

Dette dokument beskriver arkitekturen for den moderne web-baserede version af Job Application Agent, som findes i `demo/aka-torsdag` branchen.

## 🏗 Overordnet Arkitektur

Systemet er bygget som en moderne **Producer-Consumer** arkitektur, der sikrer en responsiv brugeroplevelse selv ved tunge AI-operationer.

```mermaid
graph TD
    User((Bruger)) --> Frontend[Frontend: React/Vite/TS]
    Frontend -- REST API --> Backend[Backend: Express.js]
    Frontend -- Socket.io --> Backend
    Backend -- Tilføj Job --> Queue[(Redis: BullMQ)]
    Queue -- Hent Job --> Worker[Worker: Node.js]
    Worker -- AI Prompt --> GeminiCLI[Gemini CLI]
    GeminiCLI -- Resultat --> Worker
    Worker -- MD til HTML --> Pandoc[Pandoc CLI]
    Worker -- HTML til PDF --> Chromium[Chromium Headless]
    Worker -- Status --> Backend
    Backend -- Status --> Frontend
```

## 🔍 Architecture Overview

1. **Frontend (React/Vite)**
  * En moderne, mørk-tema brugerflade, der styrer Master CV, job-input og viser resultater i realtid.
2. **Backend (Express)**
  * Håndterer API-anmodninger, serverer genererede filer og administrerer BullMQ-jobkøen.
3. **Worker (Node.js)**
  * Forbruger jobs fra køen, orkestrerer AI-kald til `gemini` CLI og håndterer filgenerering/konvertering.
4. **Redis**
  * Rygraden i jobkøen og kommunikationen mellem processer.
5. **Eksterne Værktøjer**
  * Systemet afhænger af `gemini` (AI), `pandoc` (Markdown til HTML) og `chromium` (HTML til PDF).

## 🧩 Komponenter

### 1. Frontend (React / Vite)

1. **Formål**
  * WYSIWYG editor til Master CV og jobopslag.
2. **Teknologier**
  * TypeScript, Tailwind CSS, Socket.io-client.
3. **Nøglefunktioner**
  * Live-editering af genereret Markdown.
  * Realtidsvisning af PDF-previews via iFrame.
  * Statusopdateringer fra Worker via Socket.io.

### 2. Backend (Express.js)

1. **Formål**
  * API Gateway og orkestrering.
2. **Teknologier**
  * Node.js, Express, BullMQ, Socket.io.
3. **Ansvarsområder**
  * Håndtering af Master CV (Læs/Skriv).
  * Oprettelse af baggrundsjobs i BullMQ.
  * Servering af statiske filer (PDF/HTML/MD) fra de genererede job-mapper.

### 3. Worker (Node.js)

1. **Formål**
  * Tungt arbejde (Heavy Lifting).
2. **Teknologier**
  * BullMQ, `child_process`, `dotenv`.
3. **Workflow**
  * Modtager job-data (Jobtekst, URL, hints).
  * Identificerer sprog (DK/EN).
  * Udfører AI-prompter via `gemini` CLI.
  * Opdeler AI-svar i sektioner (Ansøgning, CV, Match, ICAN+).
  * Konverterer Markdown til HTML (Pandoc) og PDF (Chromium).
  * Udgiver resultater til filsystemet og opdaterer status via Socket.io.

### 4. Infrastruktur

1. **Redis**
  * Bruges som besked-broker for BullMQ.
2. **Docker Compose**
  * Orkestrerer 3 containere: `frontend`, `backend` og `redis`.
3. **Delt Volumen**
  * Backend og Worker deler adgang til rodmappen for at kunne læse/skrive job-filer.

## 🛠 Eksterne Værktøjer

Systemet er afhængigt af følgende CLI-værktøjer installeret i miljøet:

1. **`gemini`**
  * Bruges til AI-generering og oversættelse.
2. **`pandoc`**
  * Konverterer Markdown til ren HTML.
3. **`chromium-browser`**
  * Genererer pixel-perfekte PDF'er fra HTML-skabeloner.

## 📂 Filstruktur & Oprydning (Planlagt)

For at holde projektet overskueligt flyttes skabeloner og demo-filer til dedikerede mapper:

1. `/templates/`
  * HTML-layout og base CSS.
2. `/resources/`
  * ICAN+ definitioner og reference-data.
3. `/demo/`
  * Tintin-specifikke filer og eksempler.
4. `/[timestamp]_.../`
  * Automatiske output-mapper for hver ansøgning.
