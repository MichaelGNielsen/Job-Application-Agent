const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');

const execPromise = promisify(exec);

const cleanMarkdown = (md) => {
    if (!md) return "";
    // Fjern AI-signaturer (udvidet liste til både dansk og engelsk)
    const signOffPatterns = [
        /(?:Med venlig hilsen|Venlig hilsen|De bedste hilsner|Hilsen),?[\s\n\r]*(?:Tintin|Michael G\. Nielsen)[\s\n\r]*\.?$/gi,
        /(?:Sincerely|Best regards|Kind regards|Regards|Yours faithfully|Yours sincerely),?[\s\n\r]*(?:Tintin|Michael G\. Nielsen)[\s\n\r]*\.?$/gi
    ];

    let cleaned = md;
    signOffPatterns.forEach(pattern => {
        cleaned = cleaned.replace(pattern, '');
    });
    return cleaned.trim();
};

const mdToHtml = async (md, filePath, outputFileName) => {
    if (!md) return "";
    const cleanedMd = cleanMarkdown(md);

    try {
        const outputPath = path.join(path.dirname(filePath), outputFileName);
        fs.writeFileSync(filePath, cleanedMd);

        // Vi tilføjer '--smart' med minus foran for at DEAKTIVERE det i visse Pandoc versioner,
        // eller vi bruger '-smart' (uden plus) for at sikre at vi får almindelige tegn.
        // I Pandoc 3.x deaktiveres det med --no-highlight eller ved at undlade det.
        const cmd = `pandoc -f gfm-smart -t html --wrap=none -o "${outputPath}" "${filePath}"`;
        await execPromise(cmd);

        return fs.readFileSync(outputPath, 'utf8');
    } catch (e) {
        console.error("Pandoc fejlede!", e.message);
        // Minimal fallback der bare laver linjeskift hvis alt andet fejler
        return `<div class="md-content"><p>${cleanedMd.replace(/\n/g, '<br>')}</p></div>`;
    }
};


const wrap = (t, c, type = 'ansøgning', meta = {}) => {
    const templatePath = path.join(__dirname, '..', 'templates', 'master_layout.html');
    let html = fs.readFileSync(templatePath, 'utf8');

    const company = meta.company || '';
    const position = meta.position || '';
    const docTitle = `${t} - ${process.env.MIT_NAVN} - ${company} - ${position}`.replace(/\s+/g, ' ').trim();

    // Signatur sektion (kun til ansøgning)
    let signatureSection = "";
    if (type === 'ansøgning') {
        signatureSection = `
        <div class="signature">
            <p>Med venlig hilsen,</p>
            <p><strong>${process.env.MIT_NAVN}</strong></p>
        </div>`;
    }

    // Portfolio sektion (kun til CV)
    let portfolioSection = "";
    if (type === 'cv') {
        portfolioSection = `
        <div class="portfolio">
            <div class="portfolio-title">Udvalgte Missioner & Højdepunkter</div>
            <div class="gallery">
                <div class="gallery-item">
                    <img src="../../pictures/tintin_moon_1.jpg" alt="Månen">
                    <p>Første mand på månen</p>
                </div>
                <div class="gallery-item">
                    <img src="../../pictures/tintin_unicorn.jpg" alt="Enhjørningen">
                    <p>Enhjørningens hemmelighed</p>
                </div>
                <div class="gallery-item">
                    <img src="../../pictures/tintin_rackham.jpg" alt="Rackham">
                    <p>Rackham den Rødes skat</p>
                </div>
            </div>
        </div>`;
    }

    // Erstat placeholders
    // Vi fjerner den komplekse split-logik der ødelagde layoutet og lader Pandoc output stå som det er
    html = html
        .replace(/{{DOC_TITLE}}/g, docTitle)
        .replace(/{{NAME}}/g, process.env.MIT_NAVN || "Tintin")
        .replace(/{{ADDRESS}}/g, process.env.MIN_ADRESSE || "")
        .replace(/{{PHONE}}/g, process.env.MIN_TELEFON || "")
        .replace(/{{EMAIL}}/g, process.env.MIN_EMAIL || "")
        .replace(/{{DATE}}/g, new Date().toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' }))
        .replace(/{{CONTENT}}/g, c.replace(/\[SCORE\]\s*(.*?)\s*\[\/SCORE\]/gi, '<div class="match-score">Samlet Match Score: $1</div>'))
        .replace(/{{SIGNATURE_SECTION}}/g, signatureSection)
        .replace(/{{PORTFOLIO_SECTION}}/g, portfolioSection);

    return html;
};

const wrapAll = (docs, meta = {}) => {
    // Vi beholder denne til internt materiale
    const combinedContent = docs.map((doc, idx) => `
        <div class="page-container" style="${idx < docs.length - 1 ? 'page-break-after: always;' : ''}">
            <div class="content">${doc.body}</div>
        </div>
    `).join('');

    return wrap('Internt Materiale', combinedContent, 'internal', meta);
};

module.exports = { mdToHtml, wrap, wrapAll };
