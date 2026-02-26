# AGENTS.md - Job Application Template

## Purpose
This is a template repository for generating targeted job applications and CVs. Each job application should be in its own subdirectory.

---

## Quick Start

### 1. Copy .env_template to .env and fill in your details
### 2. Create a new job directory: `mkdir -p mgn_firma_jobbeskrivelse`
### 3. Copy job posting to job.md in the new directory

---

## Configuration

### Required .env Variables
| Variable | Description | Example |
|----------|-------------|---------|
| `MINE_INITIALER` | Your initials | `mgn` |
| `MIT_NAVN` | Full name | `Michael G. Nielsen` |
| `MIN_ADRESSE` | Address | `Vej 123, 8000 Aarhus` |
| `MIN_EMAIL` | Email | `michael@example.com` |
| `MIN_TELEFON` | Phone (with country code) | `+45 12 34 56 78` |
| `MIT_FIRMA_NAVN` | Target company (lowercase) | `nordlys` |
| `MIN_JOB_BESKRIVELSE` | Job title (lowercase, underscores) | `automation_developer` |

> **Note**: If company address is missing in job posting, search Google Maps for the nearest office.

---

## File Naming Conventions

### Directory
`{MINE_INITIALER}_{FIRMA}_{JOB}` (lowercase, underscores)
- Example: `mgn_nordlys_automation_developer`

### Files in Job Directory
| File | Description |
|------|-------------|
| `job.md` | Job posting text |
| `job.pdf` | Job posting PDF (optional) |
| `{INITIALER}_{FIRMA}_{JOB}_ansøgning.md` | Application letter (matches job posting language) |
| `{INITIALER}_{FIRMA}_{JOB}_cv.md` | Targeted CV |
| `match_dk.md` | Match analysis (Danish) |
| `match_en.md` | Match analysis (English, only if job posting is in English) |
| `ICAN+_dk.md` | Interview elevator pitch (Danish) |
| `ICAN+_en.md` | Interview elevator pitch (English, only if job posting is in English) |

---

## HTML Templates (Recommended)

The repository includes HTML templates for professional PDF output:

### Templates (in root directory)
- `TEMPLATE_ansøgning.html` - Application letter template
- `TEMPLATE_cv.html` - CV template

### Placeholders
| Placeholder | Description |
|-------------|-------------|
| `{{NAVN}}` | Full name |
| `{{ADRESSE}}` | Address |
| `{{TELEFON}}` | Phone number |
| `{{EMAIL}}` | Email address |
| `{{DATO}}` | Date (DD. MMMM YYYY) |
| `{{KONTAKT}}` | Contact person |
| `{{FIRMA}}` | Company name |
| `{{BY}}` | City |
| `{{EMNE}}` | Subject line |
| `{{INDHOLD}}` | Main content |
| `{{AFSLUTNING}}` | Closing (e.g., "Best regards") |
| `{{POSITION}}` | Job position |

---

## Convert Documents

### Method 1: HTML → PDF via Browser (Recommended)
```bash
# Open HTML in browser and print to PDF
# This gives the best layout control
```

### Method 2: HTML → PDF via Chromium
```bash
# Alternative: Generate PDF with Chromium
chromium-browser --headless --disable-gpu --print-to-pdf=output.pdf input.html
```

### Method 3: Markdown → ODT → PDF (Legacy)
```bash
# Markdown → ODT
pandoc -o output.odt input.md

# ODT → PDF
soffice --headless --convert-to pdf input.odt
```

---

## Workflow

### 1. Prepare Job Posting
- Save job posting as PDF from browser OR
- Copy text to `job.md` in job directory
- If .mhtml format: `soffice --headless --convert-to pdf job.mhtml`

### 2. Generate Application Materials
**Rule**: The language of the application and CV must match the job posting language. If the job posting is in English, always create both Danish and English versions of match and ICAN+.

Use this prompt template:
```
Read AGENTS.md and job.md. Use my brutto-CV as the source.

IMPORTANT: Language in application and CV must match job posting language:
- If job posting is in Danish → application and CV in Danish
- If job posting is in English → application and CV in English

If job posting is in English, always make Danish and English versions of match and ICAN+.

Files to generate:
- match_dk.md (score 0-100%, gap analysis, Danish)
- match_en.md (score 0-100%, gap analysis, English) - only if job posting is in English
- ansøgning_{firma}.md (max 1 page, matching job posting)
- cv_{firma}.md (max 2 pages)
- ICAN+_dk.md (interview guide: I-C-A-N-+ format, Danish)
- ICAN+_en.md (interview guide: I-C-A-N-+ format, English) - only if job posting is in English
```

### 3. Generate HTML Files
Create HTML files using the templates:
- `MGN_firma_job_ansøgning.html` - Application letter
- `MGN_firma_job_cv.html` - CV

### 4. Convert to PDF
Open the HTML files in a browser and print to PDF (recommended), or use:
```bash
chromium-browser --headless --disable-gpu --print-to-pdf=output.pdf input.html
```

---

## Generated File Formats

### ansøgning_{firma}.md
- Max 1 page
- Language matches job posting
- Structure: Header → Recipient → Subject → Intro → Why company → Competencies → Examples → CTA

### cv_{firma}.md
- Max 2 pages, reverse chronological
- Sections: Contact + Summary → Competencies → Experience → Education → Projects → Languages → Personal

### match.md
- First line: Score (0-100%)
- Strengths (bullets)
- Gaps / Transferable skills (bullets)
- Recommendations (bullets)

### ICAN+.md
- I: Who are you
- C: What can you do
- A: What have you achieved
- N: Why are you here
- +: Personal touch

---

## Best Practices

1. **Match keywords** - Use exact terms from job posting
2. **Show, don't tell** - Concrete examples with numbers
3. **Be specific** - Mention relevant tech stack
4. **Tailor each application** - Never send generic applications
5. **Manual review** - Always check formatting before sending
6. **Company address** - If missing in job posting, ask user or search Google Maps

---

## Tools Setup

```bash
# LibreOffice (PDF conversion)
sudo apt-get install -y libreoffice-writer

# Pandoc (Markdown → ODT)
sudo apt-get install -y pandoc

# Python ODT library (optional, for reading ODT)
pip install --user odfpy

# Chromium (HTML → PDF)
# Usually pre-installed on Linux systems
```

---

## Directory Structure

```
Job-Application-Agent/
├── AGENTS.md                    # This file
├── .env                         # Your personal config
├── TEMPLATE_ansøgning.html      # Application HTML template
├── TEMPLATE_cv.html             # CV HTML template
├── {MINE_INITIALER}_template_brutto_cv.odt   # Master CV template
│
└── {MINE_INITIALER}_{firma}_{job}/           # One directory per application
    ├── job.md
    ├── job.pdf
    ├── match_dk.md
    ├── match_en.md
    ├── ICAN+_dk.md
    ├── ICAN+_en.md
    ├── {MINE_INITIALER}_{firma}_{job}_ansøgning.md
    ├── {MINE_INITIALER}_{firma}_{job}_cv.md
    ├── {MINE_INITIALER}_{firma}_{job}_ansøgning.html
    ├── {MINE_INITIALER}_{firma}_{job}_cv.html
    ├── {MINE_INITIALER}_{firma}_{job}_ansøgning.pdf
    └── {MINE_INITIALER}_{firma}_{job}_cv.pdf
```

---

## Current Applications

| Directory | Company | Position | Status |
|-----------|---------|----------|--------|
| | | | |

<!-- Add your job applications here -->
