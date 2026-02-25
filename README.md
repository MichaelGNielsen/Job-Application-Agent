# Job-Application-Agent

Template til at generere målrettede jobansøgninger og CV'er.

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

## Filer i denne template

### Skabeloner (skal omdøbes)
| Fil | Beskrivelse |
|-----|-------------|
| `MINE_INITIALER_template_ansøgning.odt` | ODT skabelon til ansøgning |
| `MINE_INITIALER_template_brutto_cv.odt` | ODT skabelon til CV |

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
