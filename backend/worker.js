const { Worker } = require('bullmq');
const IORedis = require('ioredis');
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { io } = require('socket.io-client');
const { mdToHtml, wrap, wrapAll } = require('./utils');

const execPromise = promisify(exec);
const rootDir = '/app/shared';
dotenv.config({ path: path.join(rootDir, '.env') });

const redisConnection = new IORedis({
  host: process.env.REDIS_HOST || 'redis',
  port: 6379,
  maxRetriesPerRequest: null
});

const socket = io('http://localhost:3002');

async function callLocalGemini(prompt) {
    try {
        const tempFile = path.join('/tmp', `prompt_${Date.now()}.txt`);
        fs.writeFileSync(tempFile, prompt);
        const { stdout } = await execPromise(`gemini < "${tempFile}"`);
        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
        return stdout;
    } catch (error) {
        console.error("Fejl ved kald til Gemini CLI:", error);
        throw error;
    }
}

async function printToPdf(htmlPath, pdfPath) {
    try {
        const cmd = `chromium-browser --headless --disable-gpu --no-sandbox --no-pdf-header-footer --print-to-pdf="${pdfPath}" "${htmlPath}"`;
        await execPromise(cmd);
        return true;
    } catch (error) {
        return false;
    }
}

const worker = new Worker('job_queue', async (job) => {
  const { jobId, jobText, companyUrl, hint } = job.data;
  
  const updateStatus = (status, data = {}) => {
    socket.emit('job_status_update', { jobId, status, ...data });
    console.log(`[Worker] Job ${jobId}: ${status}`);
  };

  try {
    updateStatus('Analyserer jobopslag...');
    const langPrompt = `Besvar KUN med 'dk' eller 'en': """${jobText.substring(0, 500)}"""`;
    const lang = (await callLocalGemini(langPrompt)).trim().toLowerCase().includes('dk') ? 'dk' : 'en';

    // Indlæs Brutto-CV (AI kilden) og ICAN+ definition
    let bruttoCv = "";
    const bruttoPath = path.join(rootDir, 'tintin_brutto_cv.md');
    if (fs.existsSync(bruttoPath)) bruttoCv = fs.readFileSync(bruttoPath, 'utf8');

    let icanDef = "";
    const icanDefPath = path.join(rootDir, 'ICAN+_DEF.md');
    if (fs.existsSync(icanDefPath)) icanDef = fs.readFileSync(icanDefPath, 'utf8');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '').slice(0, 13).replace('T', '_');
    let companyName = "firma";
    if (companyUrl) { try { companyName = new URL(companyUrl).hostname.split('.')[0]; } catch (e) {} }

    // Find stillingsbetegnelse fra jobText (f.eks. efter "Senior Efterforsker")
    const jobTitleMatch = jobText.match(/^#+\s*(.*)/) || jobText.match(/(?:Stilling:|Job:|Som)\s*([A-Zæøåa-z0-9 ]+)/i);
    const jobTitleRaw = jobTitleMatch ? jobTitleMatch[1].trim() : "stilling";
    const jobTitleSafe = jobTitleRaw.substring(0, 30).replace(/[^a-zæøå0-9]/gi, '_');

    const folderName = `${timestamp}_demo_${companyName}_${jobTitleSafe}`;
    const folderPath = path.join(rootDir, folderName);
    if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });

    fs.writeFileSync(path.join(folderPath, 'job.md'), jobText);

    updateStatus('Genererer udkast...');
    const generatePrompt = `Du er en ekspert karriererådgiver for TINTIN. 
    BRUG DISSE DATA OM TINTIN: """${bruttoCv}"""
    JOB: """${jobText}"""
    ${hint ? `HINT: "${hint}"` : ''}
    SPROG-REGLER:
    - Ansøgning og CV skal skrives på ${lang === 'dk' ? 'DANSK' : 'ENGELSK'}.
    - Match Analyse og ICAN+ Pitch skal skrives på DANSK (uanset jobbet).

    ICAN+ GUIDELINE: """${icanDef}"""

    Generer 4 sektioner i Markdown:
    ---ANSØGNING---
    (Skriv målrettet ansøgning her. START DIREKTE med modtagers navn og derefter selve ansøgningen. Skriv IKKE Tintins kontaktinfo eller dato, og slut IKKE med underskrift/navn, da det automatisk bliver påført af systemet.)
    ---CV---
    (Skriv skræddersyet CV her. Start med en stærk profiltekst. Inkluder IKKE personlig kontaktinfo i toppen, da den allerede findes i dokumentets header.)
    ---ICAN---
    (Skriv interview pitch på dansk her. Følg ICAN+ guiden punkt for punkt: Interesse, Kvalifikationer, Konkrete resultater, Næste skridt, +. Gør det letlæseligt med overskrifter.)
    ---MATCH---
    (Skriv match analyse på dansk her. Inkluder altid linjen: [SCORE] XX% [/SCORE] øverst. Lav derefter en overskuelig analyse af match mellem job og profil.)`;


    let contentRaw = await callLocalGemini(generatePrompt);
    
    updateStatus('Kvalitetssikrer indhold...');
    const selfCorrectionPrompt = `Du er en kritisk redaktør. Optimer disse 4 dokumenter for Tintin.
    1. Forklar hvad du har forbedret (max 3 linjer).
    2. Derefter skriv "---START_DOCS---"
    3. Returner dokumenterne med mærkater: ---ANSØGNING---, ---CV---, ---ICAN--- og ---MATCH---.
    4. Sørg for at MATCH altid har linjen: [SCORE] XX% [/SCORE].
    DOKUMENTER: ${contentRaw}`;

    const optimizedRaw = await callLocalGemini(selfCorrectionPrompt);
    const [aiNotes, docsPart] = optimizedRaw.split('---START_DOCS---').map(s => s.trim());
    
    const extractSection = (text, tag, nextTags = []) => {
        const escapedTag = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const nextTagsPattern = nextTags.length > 0 ? `(?=${nextTags.join('|')}|$)` : '$';
        const regex = new RegExp(`${escapedTag}[\\s\\S]*?([\\s\\S]*?)${nextTagsPattern}`, 'i');
        const match = text.match(regex);
        return match ? match[1].trim() : "";
    };

    const ansMd = extractSection(docsPart || optimizedRaw, '---ANSØGNING---', ['---CV---', '---ICAN---', '---MATCH---']);
    const cvMd = extractSection(docsPart || optimizedRaw, '---CV---', ['---ANSØGNING---', '---ICAN---', '---MATCH---']);
    const icanMd = extractSection(docsPart || optimizedRaw, '---ICAN---', ['---ANSØGNING---', '---CV---', '---MATCH---']);
    const matchMd = extractSection(docsPart || optimizedRaw, '---MATCH---', ['---ANSØGNING---', '---CV---', '---ICAN---']);

    const results = { markdown: {}, html: {}, links: {} };
    const sections = [
        { id: 'ansøgning', md: ansMd, title: 'Ansøgning' },
        { id: 'cv', md: cvMd, title: 'CV' },
        { id: 'match', md: matchMd, title: 'Match Analyse' },
        { id: 'ican', md: icanMd, title: 'ICAN+ Pitch' }
    ];

    for (const s of sections) {
        const safeTitle = s.title.replace(/\s+/g, '_');
        const fileName = `${safeTitle}_Tintin_${companyName}_${jobTitleSafe}`;
        const mdPath = path.join(folderPath, `${fileName}.md`);
        const htmlPath = path.join(folderPath, `${fileName}.html`);
        fs.writeFileSync(mdPath, s.md);
        
        const htmlBody = await mdToHtml(s.md, mdPath, `${fileName}_body.html`);
        // Wrap den fulde HTML med header/footer
        const fullHtml = wrap(s.title, htmlBody, s.id, { company: companyName, position: jobTitleRaw });
        fs.writeFileSync(htmlPath, fullHtml);
        
        results.markdown[s.id] = s.md;
        results.html[s.id] = fullHtml;
        results.links[s.id] = {
            md: `/api/applications/${folderName}/${fileName}.md`,
            html: `/api/applications/${folderName}/${fileName}.html`
        };
    }

    updateStatus('Færdig!', { folder: folderName, lang, aiNotes, ...results });

  } catch (error) {
    updateStatus('Fejl', { error: error.message });
  }
}, { connection: redisConnection });
