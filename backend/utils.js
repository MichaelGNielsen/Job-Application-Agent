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


const wrap = (t, c, type = 'ansøgning', meta = {}, candidate = {}) => {
    // Brug /app/shared/templates hvis vi er i Docker, ellers brug relativ sti
    const rootDir = process.env.NODE_ENV === 'production' ? '/app' : path.join(__dirname, '..');
    const templatePath = fs.existsSync('/app/shared/templates') 
        ? '/app/shared/templates/master_layout.html' 
        : path.join(__dirname, '..', 'templates', 'master_layout.html');
    
    let html = fs.readFileSync(templatePath, 'utf8');

    const company = meta.company || '';
    const position = meta.position || '';
    const name = candidate.name || process.env.MIT_NAVN || "Tintin";
    const docTitle = `${t} - ${name} - ${company} - ${position}`.replace(/\s+/g, ' ').trim();

    // Signatur sektion (kun til ansøgning)
    let signatureSection = "";
    if (type === 'ansøgning') {
        signatureSection = `
        <div class="signature">
            <p>Med venlig hilsen,</p>
            <p><strong>${name}</strong></p>
        </div>`;
    }

    // Erstat placeholders
    html = html
        .replace(/{{DOC_TITLE}}/g, docTitle)
        .replace(/{{NAME}}/g, name)
        .replace(/{{ADDRESS}}/g, candidate.address || process.env.MIN_ADRESSE || "")
        .replace(/{{PHONE}}/g, candidate.phone || process.env.MIN_TELEFON || "")
        .replace(/{{EMAIL}}/g, candidate.email || process.env.MIN_EMAIL || "")
        .replace(/{{DATE}}/g, new Date().toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' }))
        .replace(/{{CONTENT}}/g, c.replace(/\[SCORE\]\s*(.*?)\s*\[\/SCORE\]/gi, '<div class="match-score">Samlet Match Score: $1</div>'))
        .replace(/{{SIGNATURE_SECTION}}/g, signatureSection);

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
