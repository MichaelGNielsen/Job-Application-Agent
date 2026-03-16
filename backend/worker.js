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

function parseCandidateInfo(bruttoCv) {
    const info = {
        name: "",
        address: "",
        email: "",
        phone: ""
    };

    const lines = bruttoCv.split('\n');
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.includes('**Navn:**')) info.name = line.split('**Navn:**')[1].trim();
        if (line.includes('**Adresse:**')) info.address = line.split('**Adresse:**')[1].trim();
        if (line.includes('**Email:**')) info.email = line.split('**Email:**')[1].trim();
        if (line.includes('**Telefon:**')) info.phone = line.split('**Telefon:**')[1].trim();
    }
    return info;
}

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
  const { jobId, jobText, companyUrl, hint, type: jobType, folder: existingFolder, markdown: existingMarkdown } = job.data;
  
  const updateStatus = (status, data = {}) => {
    socket.emit('job_status_update', { jobId, status, ...data });
    console.log(`[Worker] Job ${jobId}: ${status}`);
  };

  try {
    // Indlæs Brutto-CV og ICAN+ definition
    let bruttoCv = "";
    const bruttoPath = path.join(rootDir, 'data', 'brutto_cv.md');
    if (fs.existsSync(bruttoPath)) bruttoCv = fs.readFileSync(bruttoPath, 'utf8');

    const candidate = parseCandidateInfo(bruttoCv);

    let icanDef = "";
    const icanDefPath = path.join(rootDir, 'resources', 'ICAN+_DEF.md');
    if (fs.existsSync(icanDefPath)) icanDef = fs.readFileSync(icanDefPath, 'utf8');

    let folderName, folderPath, companyName, jobTitleRaw, jobTitleSafe;

    if (jobType === 'refine_with_ai') {
        updateStatus('Forfiner dokumenter med AI...');
        folderName = existingFolder;
        folderPath = path.join(rootDir, 'output', folderName);
        companyName = folderName.split('_')[2] || 'firma';
        jobTitleSafe = folderName.split('_').slice(3).join('_') || 'stilling';
        jobTitleRaw = jobTitleSafe.replace(/_/g, ' ');
    } else {
        updateStatus('Analyserer jobopslag...');
        const langPrompt = `Besvar KUN med 'dk' eller 'en': """${jobText.substring(0, 500)}"""`;
        const lang = (await callLocalGemini(langPrompt)).trim().toLowerCase().includes('dk') ? 'dk' : 'en';

        const timestamp = new Date().toISOString().replace(/[:.]/g, '').slice(0, 13).replace('T', '_');
        companyName = "firma";
        if (companyUrl) { try { companyName = new URL(companyUrl).hostname.split('.')[0]; } catch (e) {} }

        const jobTitleMatch = jobText.match(/^#+\s*(.*)/) || jobText.match(/(?:Stilling:|Job:|Som)\s*([A-Zæøåa-z0-9 ]+)/i);
        jobTitleRaw = jobTitleMatch ? jobTitleMatch[1].trim() : "stilling";
        jobTitleSafe = jobTitleRaw.substring(0, 30).replace(/[^a-zæøå0-9]/gi, '_');

        folderName = `${timestamp}_${companyName}_${jobTitleSafe}`;
        const outputDir = path.join(rootDir, 'output');
        if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

        folderPath = path.join(outputDir, folderName);
        if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });

        fs.writeFileSync(path.join(folderPath, 'job.md'), jobText);
    }

    let docsPart;
    if (jobType === 'refine_with_ai') {
        const refinePrompt = `Du er en præcis redaktør. Her er de nuværende dokumenter for Tintin og en ny instruks fra brugeren.
        
        REGLER FOR OPDATERING:
        1. Lav KUN ændringer der er direkte forespurgt i instruksen.
        2. Bevar ordlyd, struktur og indhold i alle andre sektioner 100% uændret.
        3. Hvis instruksen kun nævner "ansøgningen", må du IKKE røre CV, Match eller ICAN.
        4. Returner ALLE 4 dokumenter (også de uændrede) med de korrekte mærkater.
        
        INSTRUKS: "${hint}"
        
        NUVÆRENDE DOKUMENTER:
        ${existingMarkdown}
        
        Returner dokumenterne med mærkater: ---ANSØGNING---, ---CV---, ---ICAN--- og ---MATCH---. Sørg for at MATCH altid har linjen: [SCORE] XX% [/SCORE].`;
        
        docsPart = await callLocalGemini(refinePrompt);
    } else {
        updateStatus('Genererer udkast...');
        const aiInstructionsPath = path.join(rootDir, 'templates', 'ai_instructions.md');
        let generatePromptTemplate = fs.readFileSync(aiInstructionsPath, 'utf8');
        
        const lang = (await callLocalGemini(`Besvar KUN med 'dk' eller 'en': """${jobText.substring(0, 500)}"""`)).trim().toLowerCase().includes('dk') ? 'dk' : 'en';

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
        
        // Robust ekstraktion af noter og dokumenter
        if (optimizedRaw.includes('---START_DOCS---')) {
            const parts = optimizedRaw.split('---START_DOCS---');
            aiNotes = parts[0].trim();
            docsPart = parts[1].trim();
        } else {
            // Fallback hvis AI'en glemmer tagget
            aiNotes = "Dokumenterne er blevet optimeret.";
            docsPart = optimizedRaw;
        }
    }
    
    const extractSection = (text, tag) => {
        const escapedTag = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // Regex der fanger alt indtil næste tag eller slutning af fil
        const regex = new RegExp(`${escapedTag}[\\s\\S]*?\\n([\\s\\S]*?)(?=\\n---[A-ZÆØÅ]+---|$)`, 'i');
        const match = text.match(regex);
        return match ? match[1].trim() : "";
    };

    const ansMd = extractSection(docsPart, '---ANSØGNING---');
    const cvMd = extractSection(docsPart, '---CV---');
    const icanMd = extractSection(docsPart, '---ICAN---');
    const matchMd = extractSection(docsPart, '---MATCH---');

    const results = { markdown: {}, html: {}, links: {} };
    const sections = [
        { id: 'ansøgning', md: ansMd, title: 'Ansøgning' },
        { id: 'cv', md: cvMd, title: 'CV' },
        { id: 'match', md: matchMd, title: 'Match Analyse' },
        { id: 'ican', md: icanMd, title: 'ICAN+ Pitch' }
    ];

    for (const s of sections) {
        if (!s.md) continue;

        const safeTitle = s.title.replace(/\s+/g, '_');
        const fileName = `${safeTitle}_Tintin_${companyName}_${jobTitleSafe}`;
        const mdPath = path.join(folderPath, `${fileName}.md`);
        const htmlPath = path.join(folderPath, `${fileName}.html`);
        const pdfPath = path.join(folderPath, `${fileName}.pdf`);
        
        fs.writeFileSync(mdPath, s.md);
        
        const htmlBody = await mdToHtml(s.md, mdPath, `${fileName}_body.html`);
        const fullHtml = wrap(s.title, htmlBody, s.id, { company: companyName, position: jobTitleRaw }, candidate);
        fs.writeFileSync(htmlPath, fullHtml);
        
        updateStatus(`Genererer PDF for ${s.title}...`);
        const absoluteHtmlPath = `file://${path.resolve(htmlPath)}`;
        await printToPdf(absoluteHtmlPath, pdfPath);
        
        results.markdown[s.id] = s.md;
        results.html[s.id] = fullHtml;
        results.links[s.id] = {
            md: `/api/applications/${folderName}/${fileName}.md`,
            html: `/api/applications/${folderName}/${fileName}.html`,
            pdf: `/api/applications/${folderName}/${fileName}.pdf`
        };
    }

    updateStatus('Færdig!', { folder: folderName, lang: jobType === 'refine_with_ai' ? 'refine' : 'initial', ...results });

  } catch (error) {
    console.error(`[Worker] KRITISK FEJL på job ${jobId}:`, error);
    updateStatus('Fejl', { error: error.message });
  }
}, { connection: redisConnection });
