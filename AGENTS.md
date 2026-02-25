# AGENTS.md - Job Application Template

## Purpose
This is a template repository for generating targeted job applications and CVs. Each job application should be in its own subdirectory.

---

## Configuration

### Setup
1. Copy `.env_template` to `.env`
2. Fill in your personal values in `.env`

### Required Variables (in .env)
| Variable | Description |
|----------|-------------|
| `MINE_INITIALER` | Candidate initials (used in filenames) |
| `MIT_NAVN` | Full name |
| `MIN_ADRESSE` | Address |
| `MIN_EMAIL` | Email |
| `MIN_TELEFON` | Phone (with country code format) |
| `MIT_FIRMA_NAVN` | Company name (lowercase, from job posting) |
| `MIN_JOB_BESKRIVELSE` | Job description (lowercase, from job posting) |

> **Note:** Remember to update `MIT_FIRMA_NAVN` and `MIN_JOB_BESKRIVELSE` in `.env` for each new job application!

> **Note:** If company address is missing in job posting, search Google Maps for the nearest office to user's residence. Example: GomSpace → Langagervej 6, 9220 Aalborg

---

## Directory and File Naming Conventions

### Directory Name
Format: `{MINE_INITIALER}_{MIT_FIRMA_NAVN}_{MIN_JOB_BESKRIVELSE}` (lowercase, underscores)
- Example: `xxx_firma_automation_developer`

### File Names
Format: `{MINE_INITIALER}_{MIT_FIRMA_NAVN}_{MIN_JOB_BESKRIVELSE}_{TYPE}.md`
- Example: `xxx_firma_automation_developer_ansøgning.md`
- Example: `xxx_firma_automation_developer_cv.md`

Types: `ansøgning`, `cv`, `match`, `ICAN+`

---

## Directory Structure

```
Job-Application-Agent/
├── AGENTS.md                    # This file (root configuration)
├── {MINE_INITIALER}_cv_2026_bruto_dk.odt     # Source CV (bruto/template)
├── {MINE_INITIALER}_cv_2026_bruto_dk.pdf     # PDF version of brute CV
│
├── {MINE_INITIALER}_{MIT_FIRMA_NAVN}_{MIN_JOB_BESKRIVELSE}/   # One directory per job
│   ├── job.md                   # Job announcement (text version)
│   ├── *.mhtml                  # Original job posting (if applicable)
│   ├── job.pdf                  # PDF version of job posting
│   ├── {MINE_INITIALER}_{MIT_FIRMA_NAVN}_{MIN_JOB_BESKRIVELSE}_ansøgning.md
│   ├── {MINE_INITIALER}_{MIT_FIRMA_NAVN}_{MIN_JOB_BESKRIVELSE}_cv.md
│   ├── match.md                 # Match analysis with score
│   ├── ICAN+.md                # Interview elevator pitch
│   ├── {MINE_INITIALER}_{MIT_FIRMA_NAVN}_{MIN_JOB_BESKRIVELSE}_ansøgning.odt
│   ├── {MINE_INITIALER}_{MIT_FIRMA_NAVN}_{MIN_JOB_BESKRIVELSE}_ansøgning.pdf
│   ├── {MINE_INITIALER}_{MIT_FIRMA_NAVN}_{MIN_JOB_BESKRIVELSE}_cv.odt
│   └── {MINE_INITIALER}_{MIT_FIRMA_NAVN}_{MIN_JOB_BESKRIVELSE}_cv.pdf
│
├── {MINE_INITIALER}_{MIT_FIRMA_NAVN}_{MIN_JOB_BESKRIVELSE}_2/
│   └── ...
```

---

## Workflow: New Job Application

### 1. Update .env
Before generating files, update your `.env` with the new job:
- `MIT_FIRMA_NAVN` = company name from job posting (lowercase)
- `MIN_JOB_BESKRIVELSE` = job title from job posting (lowercase, underscores)

### 2. Create Job Directory
```bash
mkdir -p {MINE_INITIALER}_{MIT_FIRMA_NAVN}_{MIN_JOB_BESKRIVELSE}
cd {MINE_INITIALER}_{MIT_FIRMA_NAVN}_{MIN_JOB_BESKRIVELSE}
```

### 3. Add Job Posting
- Copy job text to `job.md`
- If .mhtml format, save it in the same directory
- **Convert mhtml to PDF** for better readability and archiving:
  ```bash
  soffice --headless --convert-to pdf "job_title.mhtml"
  ```
- If website offers "Save as PDF", use that instead of mhtml

### 4. Generate These Files (use MINE_INITIALER from .env)
**Regel**: Sproget i ansøgning og CV skal matche jobopslagets sprog (detekteres fra job.md).

| File | Description |
|------|-------------|
| `{MINE_INITIALER}_{MIT_FIRMA_NAVN}_{MIN_JOB_BESKRIVELSE}_ansøgning.md` | Targeted application letter (max 1 page, matches job posting language) |
| `{MINE_INITIALER}_{MIT_FIRMA_NAVN}_{MIN_JOB_BESKRIVELSE}_cv.md` | Targeted CV (max 2 pages) |
| `match.md` | Match analysis with score (0-100%, matches job posting language) |
| `ICAN+.md` | ICAN+ process framework (matches job posting language) |

### 5. Convert to ODT/PDF (optional - uses template)
```bash
# Uses MINE_INITIALER_template_ansøgning.odt as base
python3 create_odt.py {MINE_INITIALER}_{MIT_FIRMA_NAVN}_{MIN_JOB_BESKRIVELSE}_ansøgning.md

# MANUAL STEP: Open ODT in LibreOffice Writer
# Set font size 11 and A4 format in LibreOffice Writer
soffice --headless --convert-to pdf {MINE_INITIALER}_{MIT_FIRMA_NAVN}_{MIN_JOB_BESKRIVELSE}_ansøgning.odt
```

---

## Full Workflow Prompt

Copy and paste this prompt to generate job application materials:

```
Læs AGENTS.md og job.md for kontekst. Brug dit brutto-CV som kilde.

**VIGTIGT**: Sproget i ansøgning og CV skal matche jobopslagets sprog:
- Hvis jobopslag er på dansk → alt på dansk
- Hvis jobopslag er på engelsk → alt på engelsk

Generér derefter følgende filer:
1. match.md: Match-analyse med score (0-100%) og gap-analyse
2. ansøgning_[virksomhed].md: Målrettet ansøgning (max 1 side)
3. cv_[virksomhed].md: Målrettet CV (max 2 sider)
4. ICAN+.md: Samtalestøtte-guide med I, C, A, N og +

Konverter .md-filerne til .odt med 'pandoc', finpudse layout manuelt, og konverter til .pdf med 'soffice --headless'.
```

---

## Generated Files Format

### ansøgning_[INITIALS].md
- Max 1 page, language matches job posting
- Structure:
  1. Header with contact info and date
  2. Recipient address
  3. Subject line
  4. Introduction (position, source)
  5. Why this company and position
  6. Relevant competencies (cross-reference job keywords)
  7. Concrete examples from career
  8. Closing with call-to-action

### cv_[INITIALS].md
- Max 2 pages
- Reverse chronological order
- Sections:
  - Contact info + Professional summary
  - Core competencies (categorized)
  - Work experience
  - Education
  - Projects (with tech stack)
  - Languages
  - Personal

### match.md
- Score (0-100%) as first line
- Strengths (bullets)
- Gaps/transferable skills (bullets)
- Recommendations (bullets)

### ICAN+.md
- I (Intro): Who are you
- C (Competence): What can you do
- A (Ambition/Achievement): What have you achieved
- N (Next/Need): Why are you here
- + (Plus): Personal touch

---

## Best Practices

1. **Match keywords** - Use terms from job description explicitly
2. **Show, don't tell** - Give concrete examples
3. **Be specific** - Mention relevant tech stack
4. **Quantify** - Add numbers where possible
5. **Team focus** - Mention mentorship willingness
6. **Tailor each application** - Never send generic applications
7. **Company address** - If missing in job posting, ask user or search Google Maps for the nearest office to user's residence

---

## Tools

### Setup (for new PC)

```bash
# 1. LibreOffice (for ODT to PDF conversion)
sudo apt-get install -y libreoffice-writer

# 2. Python packages for ODT reading/writing (--user avoids system pollution)
pip install --user odfpy
```

### ODT Reading
```bash
python3 -c "
from odf import text, teletype
from odf.opendocument import load
doc = load('MINE_INITIALER_template_brutto_cv.odt')
for p in doc.getElementsByType(text.P):
    print(teletype.extractText(p))
"
```

### PDF Conversion
```bash
# Requires LibreOffice
soffice --headless --convert-to pdf input.md
```

---

## Current Job Applications

| Directory | Company | Position | Status |
|-----------|---------|----------|--------|
| `xxx_firma_jobbeskrivelse/` | EXAMPLE: Company | EXAMPLE: Position | Active |

<!-- Add your own job applications here -->

<!-- Example:
| `mgn_firma_automation_developer/` | Company | Position | Active |
-->
