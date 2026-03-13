# GEMINI.md - Tintin Demo Version (v2.2.0)

## 🎯 Status for Præsentations-version
Denne mappe (`release_candidate`) er clonet fra `Job-Application-Agent` repoet og er nu din **officielle demo-version**. Den er 100% GDPR-sikker, da den udelukkende bruger Tintins data.

### Gennemførte forbedringer (Flyttet fra MGN-workspace):
- **4-Boks Layout:** Stabil klassisk visning af Ansøgning, CV, Match og ICAN+.
- **Robust Parsing:** Bruger RegEx-tags til at adskille dokumenter fejlfrit.
- **AI Ræsonnement:** Blå boks i toppen der viser AI'ens redaktør-tanker.
- **Direkte Print:** "Åben HTML" knap til manuel browser-print (Ctrl+P).
- **Auto-Sync:** Rettelser i MD opdaterer HTML-filer med det samme.

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

**Sidst opdateret:** 12. marts 2026
