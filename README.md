# Job Application Agent - Tintin Demo (v2.4)

Velkommen til den officielle demo af **Job Application Agent**. Dette projekt demonstrerer, hvordan AI kan transformere en personlig erfaringsbase (Master CV) til målrettede ansøgningsdokumenter på få sekunder. Læs mere om systemets opbygning i [Architecture Documentation](docs/architecture.md).

## 🚀 Kom i gang med Demoen
1.  Åbn terminalen i denne mappe (`web_demo_tintin`).
2.  Kør: `docker-compose up -d`.
3.  Åbn: [http://localhost:3000](http://localhost:3000) i din browser.

## 🛠 Web Workflow (WYSIWYG)
Systemet er nu fuldt automatiseret via en web-grænseflade:

1.  **Master CV Management:** Rediger og opdater din kilde-data direkte i UI'et. Brug "Oversæt"-knappen til lynhurtigt at gøre dig klar til internationale jobs.
2.  **Job Input:** Indsæt et jobopslag (f.eks. fra INTERPOL) og et personligt hint.
3.  **Real-tids AI:** Se AI'en analysere jobbet og generere 4 skræddersyede dokumenter live.
4.  **Live Edit:** Ret i Markdown-teksten og se det færdige print-layout (HTML/PDF) opdatere sig med det samme i preview-vinduet.
5.  **Print:** Brug "Åben i ny tab"-knappen til at printe de færdige dokumenter direkte fra browseren.

## 📂 Demo Filer (Kilder)
- [Master CV (DK)](tintin_brutto_cv.md)
- [ICAN+ Definition](ICAN+_DEF.md)
- [Test Job (DK)](job_dk.md)
- [Test Job (EN)](job_en.md)

## 🎯 Fokusområder til AKA Præsentationen
*   **Match Analyse:** Vis hvordan AI'en giver en ærlig score og gap-analyse.
*   **ICAN+ Pitch:** Vis hvordan man bliver klædt på til selve jobsamtalen.
*   **Sprog:** Demonstrer hvordan systemet skifter mellem dansk og engelsk baseret på jobopslaget.

---
*Sidst opdateret: 13. marts 2026*
