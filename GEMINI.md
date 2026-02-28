# GEMINI.md

## Project Overview
**Job-Application-Agent** is a specialized framework designed to automate and standardize the creation of targeted job applications and CVs. It leverages AI-driven workflows (specifically optimized for tools like Gemini/OpenCode) to transform a master CV ("brutto-CV") and a job posting into tailored documents.

The project uses:
- **HTML/CSS** for high-quality, professional PDF layouts.
- **Markdown** for draft generation and analysis (match scoring, interview prep).
- **Environment Variables** (`.env`) to store persistent personal contact information.
- **CLI Tools** like `pandoc`, `chromium`, and `libreoffice` for document conversion.

## Directory Overview
The root directory serves as the template and documentation hub. Individual job applications are organized into their own subdirectories to keep the workspace clean and maintain history.

### Root Files
- `AGENTS.md`: The primary "source of truth" for the AI workflow. It contains prompt templates, file naming conventions, and conversion instructions.
- `README.md`: General project setup, prerequisites, and quick-start guide.
- `TEMPLATE_ansøgning.html` & `TEMPLATE_cv.html`: Base layouts for cover letters and CVs.
- `.env_template`: Template for personal information (Name, Address, Email, etc.).
- `tintin_*`: Example files demonstrating the output of a "Senior Investigator" application to Interpol for a fictional character (Tintin).
- `pictures/`: Asset folder for images used in the HTML templates (e.g., profile pictures or logos).

### Key Files & Their Purpose
| File | Description |
| :--- | :--- |
| `AGENTS.md` | **Critical Context.** Defines how the AI should behave, what files to generate, and which placeholders to use. |
| `job.md` | A temporary file used to store the text of the job advertisement being targeted. |
| `TEMPLATE_cv.html` | The master layout for CVs. Uses CSS `@page` rules optimized for A4 PDF output. |
| `.env` | (User-created) Stores variables like `MIT_NAVN` and `MIN_EMAIL` to be injected into templates. |

## Usage & Workflow
To use this project effectively, follow the standard development lifecycle:

1.  **Preparation**: Ensure `.env` is populated with your personal details.
2.  **Job Setup**: Create a new directory following the pattern `{INITIALS}_{COMPANY}_{POSITION}` (e.g., `mgn_google_software_engineer`).
3.  **Analysis**: Paste the job description into `job.md` within the new directory.
4.  **Generation**: Use the prompt template found in `AGENTS.md` to have an AI agent generate:
    - `match_dk.md` (Score and gap analysis)
    - `{INITIALS}_{COMPANY}_ansøgning.md` (Tailored cover letter)
    - `{INITIALS}_{COMPANY}_cv.md` (Tailored CV)
5.  **Conversion**: Convert Markdown drafts to HTML using the templates, then print to PDF using a browser or Chromium:
    ```bash
    chromium-browser --headless --disable-gpu --print-to-pdf=output.pdf input.html --no-pdf-header-footer
    ```

## Conventions
- **Language**: The output language (Danish or English) must strictly match the language of the job posting.
- **Naming**: All job-specific files and directories should be lowercase with underscores.
- **Separation of Documents**: **NEVER** combine the application and CV into a single file. They must remain separate deliverables to ensure correct formatting and to stay within page limits.
- **Templates**: Prefer HTML-based templates over legacy ODT/Word formats for better layout control.
- **AI Instructions**: Always refer to `AGENTS.md` when starting a new generation task to ensure consistency with the established persona and formatting rules.
