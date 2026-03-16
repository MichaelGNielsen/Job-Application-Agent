# GEMINI.md - Tintin Demo Version (v2.7.3)

## 🎯 Status for Præsentations-version

Denne mappe (`release_candidate`) er clonet fra `Job-Application-Agent` repoet og er nu din **officielle demo-version**. Den er 100% GDPR-sikker, da den udelukkende bruger Tintins data.

### Gennemførte forbedringer (Flyttet fra MGN-workspace)

* **4-Boks Layout:** Stabil klassisk visning af Ansøgning, CV, Match og ICAN+.
* **Robust Parsing:** Bruger RegEx-tags til at adskille dokumenter fejlfrit.
* **AI Ræsonnement:** Blå boks i toppen der viser AI'ens redaktør-tanker.
* **Direkte Print:** "Åben HTML" knap til manuel browser-print (Ctrl+P).
* **Auto-Sync:** Rettelser i MD opdaterer HTML-filer med det samme.

## 🚀 Sådan starter du i morgen

1. Åbn terminalen i `/mnt/e/src/my-applications/release_candidate`.
2. Kør: `docker-compose up -d`
3. Åbn: `http://localhost:3000`

## 📝 Demo Flow (Til AKA mødet)

1. Indsæt et spændende job (f.eks. "Efterforsker hos INTERPOL").
2. Vis hvordan AI'en tænker (AI Ræsonnement boksen).
3. Vis hvordan den matcher Tintins erfaring som reporter med jobbet.
4. Lav en rettelse i MD og vis at HTML-previewet opdateres.
5. Åbn HTML og vis den professionelle PDF-klar visning.

## 📝 Markdown Formatering (Vigtigt for Editor-kompatibilitet)

For at sikre korrekt visning i alle editorer, skal disse regler altid følges:

1. **Overskrifter:** Altid en tom linje (`\n`) efter enhver overskrift (`#`, `##`, `###`, osv.).
2. **Kodeblokke:** Altid en tom linje (`\n`) før og efter kodeblokke (```` ``` ````).
3. **Lister:** Altid en tom linje før en ny liste starter.
4. **List-markører:** Altid kun ét mellemrum efter en list-markør (`* `, `1. `).
5. **Punktopstillinger:** Brug altid asterisk (`*`) i stedet for bindestreg (`-`) til uordnede lister.
6. **Trailing Spaces:** Brug enten 0 eller 2 mellemrum i slutningen af en linje (aldrig nøjagtigt 1).
7. **Tomme linjer:** Maksimalt én tom linje i træk (ingen multiple consecutive blank lines).
8. **Top-level overskrifter:** Kun én top-level overskrift (`#`) pr. dokument.
9. **Overskrifts-tegnsætning:** Ingen afsluttende tegnsætning som f.eks. kolon (`:`) i overskrifter.
10. **Overskrifts-niveauer (MD001):** Overskriftsniveauer må kun stige med ét niveau ad gangen (f.eks. fra `#` til `##`, aldrig direkte til `###`).
11. **Ingen pseudo-overskrifter (MD036):** Brug ikke fed eller kursiv tekst på en linje alene som en overskrift; brug rigtige Markdown-overskrifter (`##`, `###` osv.).
12. **Nummererede lister (MD030):** Brug altid præcis ét mellemrum efter punktummet i en nummereret liste (f.eks. `1. ` i stedet for `1.  `).
13. **Indrykkede lister (MD007):** Brug 2 mellemrum til indrykning. For bedste kompatibilitet: Brug nummerering (`1.`) til det yderste niveau og asterisk (`*`) til det indrykkede niveau.

**Sidst opdateret:** 16. marts 2026 (v2.7.3)
