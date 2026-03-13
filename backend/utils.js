const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');

const execPromise = promisify(exec);

const mdToHtml = async (md, filePath, outputFileName) => {
    if (!md) return "";
    
    try {
        const outputPath = path.join(path.dirname(filePath), outputFileName);
        // Tving sync skrivning af MD før pandoc læser den
        fs.writeFileSync(filePath, md);
        await execPromise(`pandoc -f markdown -t html --wrap=none -o "${outputPath}" "${filePath}"`);
        return fs.readFileSync(outputPath, 'utf8');
    } catch (e) {
        console.warn("Pandoc fallback aktiv", e.message);
        // Forbedret Regex Fallback der håndterer de mest almindelige MD tags
        let html = md
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^\s*-\s+(.*$)/gim, '<li>$1</li>')
            .replace(/^\s*\*\s+(.*$)/gim, '<li>$1</li>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>');
        
        // Wrap lister
        html = html.replace(/(<li>.*<\/li>)/gms, '<ul>$1</ul>');
        return `<div class="md-content"><p>${html}</p></div>`;
    }
};

const wrap = (t, c, type = 'ansøgning', meta = {}) => {
    const company = meta.company || '';
    const position = meta.position || '';
    const docTitle = `${t} - ${process.env.MIT_NAVN} - ${company} - ${position}`.replace(/\s+/g, ' ').trim();

    return `
<!DOCTYPE html>
<html lang="da">
<head>
    <meta charset="UTF-8">
    <title>${docTitle}</title>
    <style>
        @page { size: A4; margin: 2cm; }
        @media print {
            .print-btn { display: none !important; }
            body { padding: 0 !important; margin: 0 !important; width: 100% !important; max-width: none !important; font-size: 11pt; }
            header { margin-top: 0; }
        }
        body { background-color: white; color: #333; font-family: "Segoe UI", Arial, sans-serif; max-width: 800px; margin: 0 auto; line-height: 1.45; padding: 40px; word-wrap: break-word; }
        header { border-bottom: 2px solid #444; padding-bottom: 10px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
        .contact-info h1 { margin: 0; font-size: 1.6em; color: #000; text-transform: uppercase; letter-spacing: 1px; }
        .contact-info p { margin: 0; font-size: 0.95em; color: #555; text-align: left; }
        .date-location { text-align: right; font-size: 1em; color: #333; }
        .content { margin-top: 20px; min-height: 500px; }
        h1 { font-size: 1.8em; color: #000; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-top: 30px; margin-bottom: 15px; }
        h2 { font-size: 1.3em; margin-top: 25px; color: #111; border-bottom: 1px solid #eee; padding-bottom: 3px; margin-bottom: 12px; }
        h3 { font-size: 1.1em; margin-top: 15px; color: #444; margin-bottom: 10px; }
        strong { font-weight: 600; color: #000; }
        p { margin-bottom: 12px; text-align: justify; }
        ul, ol { margin-bottom: 15px; padding-left: 25px; }
        li { margin-bottom: 6px; }
        .signature { margin-top: 50px; }
        .signature p { margin: 0; line-height: 1.2; }
        .match-score { font-size: 1.2em; font-weight: bold; color: #000; margin: 20px 0; border-bottom: 2px solid #000; padding-bottom: 5px; }
        .md-content { font-size: 1.05em; }
        .cv-header { margin-bottom: 30px; }
    </style>
</head>
<body>
    <header>
        <div class="contact-info">
            <h1>${process.env.MIT_NAVN}</h1>
            <p>${process.env.MIN_ADRESSE}</p>
            <p>${process.env.MIN_TELEFON} | ${process.env.MIN_EMAIL}</p>
        </div>
        <div class="date-location">${new Date().toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
    </header>
    <div class="content ${type === 'cv' ? 'cv-header' : ''}">
        ${c.replace(/\[SCORE\]\s*(.*?)\s*\[\/SCORE\]/gi, '<div class="match-score">Samlet Match Score: $1</div>')}
    </div>
    ${type === 'ansøgning' ? `
    <div class="signature">
        <p>Med venlig hilsen,</p>
        <br>
        <p><strong>${process.env.MIT_NAVN}</strong></p>
    </div>
` : ''}
</body>
</html>`;
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
