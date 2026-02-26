# Job-Application-Agent

Template til at generere målrettede jobansøgninger og CV'er.

## Brug OpenCode

Denne template er designet til at arbejde med [OpenCode](https://opencode.ai). 

Når du har sat projektet op, kan du bruge OpenCode til at:
- Generere målrettede ansøgninger og CV'er
- Konvertere MD/HTML til PDF
- Analysere match mellem din profil og jobannoncen

```bash
opencode .
```

---

## Kom i gang

### 1. Klon projektet
```bash
git clone https://github.com/MichaelGNielsen/Job-Application-Agent.git
cd Job-Application-Agent
```

### 2. Omdøb skabelon-filer (erstat MINE_INITIALER med dine initialer)
```bash
cp MINE_INITIALER_template_ansøgning.odt xxx_template_ansøgning.odt
cp MINE_INITIALER_template_brutto_cv.odt xxx_template_brutto_cv.odt
```

### 3. Kopier .env_template til .env og udfyld
```bash
cp .env_template .env
# Åbn .env og udfyld dine oplysninger
```

### 4. Gem jobannoncen
Kopier din jobannonse ind i roden som:
- `job.pdf` (PDF gemt fra browser)
- `job.mhtml` (webarkiv)
- `job.md` (kopieret tekst)

---

## HTML Templates (Anbefalet)

Projektet inkluderer HTML-skabeloner for professionel PDF-output:

### Skabeloner
- `TEMPLATE_ansøgning.html` - Ansøgningsskabelon
- `TEMPLATE_cv.html` - CV-skabelon

### Brug
1. Åbn HTML-filen i en browser
2. Verificer layoutet
3. Print til PDF (Ctrl+P → Gem som PDF)

---

## Eksempel med Tintin

Se eksempler på output i browser:

### Ansøgning
Åbn `tintin_template_ansøgning.html` i en browser for at se eksempel på ansøgning med Tintin som kandidat.

### CV  
Åbn `tintin_template_cv.html` i en browser for at se eksempel på CV med Tintins erfaringer.

---

## Layout Eksempler (Tintin Case Study)

Herunder ses eksempler på de dokumenter, som agenten genererer. Dette eksempel viser en ansøgning fra Tintin til Professor Tournesol på Møllenborg Slot.

| Ansøgning (Template) | CV (Template) |
| :--- | :--- |
| [Åbn PDF](tintin_template_ansøgning.pdf) | [Åbn PDF](tintin_template_cv.pdf) |

*Layoutet er optimeret til PDF-konvertering via Chromium med `--no-pdf-header-footer`.*

---

## Filer i denne template

### Skabeloner (skal omdøbes)
| Fil | Beskrivelse |
|-----|-------------|
| `TEMPLATE_ansøgning.html` | HTML skabelon til ansøgning (anbefalet) |
| `TEMPLATE_cv.html` | HTML skabelon til CV (anbefalet) |
| `MINE_INITIALER_template_ansøgning.odt` | Legacy ODT skabelon til ansøgning |
| `MINE_INITIALER_template_brutto_cv.odt` | Legacy ODT skabelon til CV |

### Filer der skal tilføjes af brugeren
| Fil | Beskrivelse |
|-----|-------------|
| `.env` | Dine personlige oplysninger (kopier fra .env_template) |
| `job.md` / `job.pdf` / `job.mhtml` | Jobannonse du søger |

### Dokumentation
| Fil | Beskrivelse |
|-----|-------------|
| `AGENTS.md` | Komplet dokumentation & workflow |
| `README.md` | Denne fil |

---

## Workflow

Se [AGENTS.md](./AGENTS.md) for detaljeret workflow.
