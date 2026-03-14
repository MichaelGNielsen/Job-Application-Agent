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
// Indlæs begge .env filer
dotenv.config({ path: path.join(rootDir, '.env_private') });
dotenv.config({ path: path.join(rootDir, '.env_ai') });

// Tving API nøgle til at være tilgængelig for gemini-cli
if (process.env.GEMINI_API_KEY) {
    process.env.GOOGLE_API_KEY = process.env.GEMINI_API_KEY;
}

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
        console.error("Fejl ved kald til Gemini CLI:", error.message);
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
    const bruttoPath = path.join(rootDir, 'data', 'brutto_cv.md');
    if (fs.existsSync(bruttoPath)) bruttoCv = fs.readFileSync(bruttoPath, 'utf8');

    let icanDef = "";
    const icanDefPath = path.join(rootDir, 'resources', 'ICAN+_DEF.md');
    if (fs.existsSync(icanDefPath)) icanDef = fs.readFileSync(icanDefPath, 'utf8');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '').slice(0, 13).replace('T', '_');
    let companyName = "firma";
    if (companyUrl) { try { companyName = new URL(companyUrl).hostname.split('.')[0]; } catch (e) {} }

    // Find stillingsbetegnelse fra jobText (f.eks. efter "Senior Efterforsker")
    const jobTitleMatch = jobText.match(/^#+\s*(.*)/) || jobText.match(/(?:Stilling:|Job:|Som)\s*([A-Zæøåa-z0-9 ]+)/i);
    const jobTitleRaw = jobTitleMatch ? jobTitleMatch[1].trim() : "stilling";
    const jobTitleSafe = jobTitleRaw.substring(0, 30).replace(/[^a-zæøå0-9]/gi, '_');

    const folderName = `${timestamp}_${companyName}_${jobTitleSafe}`;
    const outputDir = path.join(rootDir, 'output');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const folderPath = path.join(outputDir, folderName);
    if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });

    fs.writeFileSync(path.join(folderPath, 'job.md'), jobText);

    updateStatus('Genererer udkast...');
    const aiInstructionsPath = path.join(rootDir, 'templates', 'ai_instructions.md');
    let generatePromptTemplate = fs.readFileSync(aiInstructionsPath, 'utf8');

    const generatePrompt = generatePromptTemplate
        .replace(/{{BRUTTO_CV}}/g, bruttoCv)
        .replace(/{{JOB_TEXT}}/g, jobText)
        .replace(/{{HINT}}/g, hint || "Ingen specielle hints.")
        .replace(/{{LANG_NAME}}/g, lang === 'dk' ? 'DANSK' : 'ENGELSK')
        .replace(/{{ICAN_DEF}}/g, icanDef);


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
        // Mere robust regex der fanger indhold mellem tags uanset linjeskift
        const regex = new RegExp(`${escapedTag}\\s*([\\s\\S]*?)(?:\\n---[A-ZÆØÅ]+---|$)`, 'i');
        const match = text.match(regex);
        return match ? match[1].trim() : "";
    };

    const ansMd = extractSection(docsPart || optimizedRaw, '---ANSØGNING---');
    const cvMd = extractSection(docsPart || optimizedRaw, '---CV---');
    const icanMd = extractSection(docsPart || optimizedRaw, '---ICAN---');
    const matchMd = extractSection(docsPart || optimizedRaw, '---MATCH---');

    const results = { markdown: {}, html: {}, links: {} };
    const sections = [
        { id: 'ansøgning', md: ansMd, title: 'Ansøgning' },
        { id: 'cv', md: cvMd, title: 'CV' },
        { id: 'match', md: matchMd, title: 'Match Analyse' },
        { id: 'ican', md: icanMd, title: 'ICAN+ Pitch' }
    ];

    for (const s of sections) {
        if (!s.md) continue; // Spring over hvis sektionen er tom

        const safeTitle = s.title.replace(/\s+/g, '_');
        const fileName = `${safeTitle}_Tintin_${companyName}_${jobTitleSafe}`;
        const mdPath = path.join(folderPath, `${fileName}.md`);
        const htmlPath = path.join(folderPath, `${fileName}.html`);
        const pdfPath = path.join(folderPath, `${fileName}.pdf`);
        
        fs.writeFileSync(mdPath, s.md);
        
        const htmlBody = await mdToHtml(s.md, mdPath, `${fileName}_body.html`);
        const fullHtml = wrap(s.title, htmlBody, s.id, { company: companyName, position: jobTitleRaw });
        fs.writeFileSync(htmlPath, fullHtml);
        
        // Generer PDF automatisk for hvert dokument
        updateStatus(`Genererer PDF for ${s.title}...`);
        await printToPdf(htmlPath, pdfPath);
        
        results.markdown[s.id] = s.md;
        results.html[s.id] = fullHtml;
        results.links[s.id] = {
            md: `/api/applications/${folderName}/${fileName}.md`,
            html: `/api/applications/${folderName}/${fileName}.html`,
            pdf: `/api/applications/${folderName}/${fileName}.pdf`
        };
    }

    updateStatus('Færdig!', { folder: folderName, lang, aiNotes, ...results });

  } catch (error) {
    updateStatus('Fejl', { error: error.message });
  }
}, { connection: redisConnection });
