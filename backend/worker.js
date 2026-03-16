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
// Indlæs .env_ai filen
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

    let lang = 'dk'; // Standard

    if (jobType === 'refine_with_ai') {
        updateStatus('Forfiner dokumenter med AI...');
        folderName = existingFolder;
        folderPath = path.join(rootDir, 'output', folderName);
        companyName = folderName.split('_')[2] || 'firma';
        jobTitleSafe = folderName.split('_').slice(3).join('_') || 'stilling';
        jobTitleRaw = jobTitleSafe.replace(/_/g, ' ');
        
        // Detekter sprog fra eksisterende markdown hvis muligt
        lang = existingMarkdown.toLowerCase().includes('dear') || existingMarkdown.toLowerCase().includes('sincerely') ? 'en' : 'dk';
    } else {
        updateStatus('Analyserer jobopslag...');
        const langPrompt = `Hvilket sprog er dette jobopslag skrevet på? Svar KUN med ISO-kode på to bogstaver (f.eks. 'da', 'en', 'de', 'fr', 'es'): """${jobText.substring(0, 500)}"""`;
        lang = (await callLocalGemini(langPrompt)).trim().toLowerCase().substring(0, 2);
        
        // Sikre at vi har en gyldig 2-bogstavs kode, ellers fallback til da
        if (!/^[a-z]{2}$/.test(lang)) lang = 'da';

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
        1. Opdater din logbog i ---REDAKTØRENS_LOGBOG---. Vær detaljeret omkring hvad du har ændret.
        2. Bevar ---LAYOUT_METADATA--- og opdater dem hvis instruksen kræver det (f.eks. nyt sprog).
        3. Lav KUN ændringer der er direkte forespurgt i instruksen.
        4. Bevar ordlyd, struktur og indhold i alle andre sektioner 100% uændret.
        5. Returner ALLE sektioner med de korrekte mærkater.
        
        INSTRUKS: "${hint}"
        
        NUVÆRENDE DOKUMENTER:
        ${existingMarkdown}
        
        Returner dokumenterne med mærkater: ---REDAKTØRENS_LOGBOG---, ---LAYOUT_METADATA---, ---ANSØGNING---, ---CV---, ---ICAN--- og ---MATCH---. Sørg for at MATCH altid har linjen: [SCORE] XX% [/SCORE].`;
        
        docsPart = await callLocalGemini(refinePrompt);
    } else {
        updateStatus('Genererer udkast...');
        const aiInstructionsPath = path.join(rootDir, 'templates', 'ai_instructions.md');
        let generatePromptTemplate = fs.readFileSync(aiInstructionsPath, 'utf8');
        
        const generatePrompt = generatePromptTemplate
            .replace(/{{BRUTTO_CV}}/g, bruttoCv)
            .replace(/{{JOB_TEXT}}/g, jobText)
            .replace(/{{HINT}}/g, hint || "Ingen specielle hints.")
            .replace(/{{ICAN_DEF}}/g, icanDef);

        docsPart = await callLocalGemini(generatePrompt);
    }
    
    const extractSection = (text, tag) => {
        const escapedTag = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`${escapedTag}[\\s\\S]*?\\n([\\s\\S]*?)(?=\\n---[A-ZÆØÅ_]+---|$)`, 'i');
        const match = text.match(regex);
        return match ? match[1].trim() : "";
    };

    aiNotes = extractSection(docsPart, '---REDAKTØRENS_LOGBOG---') || "AI'en har optimeret dokumenterne.";
    const metadataRaw = extractSection(docsPart, '---LAYOUT_METADATA---');
    
    const layoutMeta = {
        signOff: metadataRaw.match(/Sign-off:\s*(.*)/i)?.[1]?.trim() || (lang === 'en' ? "Sincerely," : "Med venlig hilsen,"),
        location: metadataRaw.match(/Location:\s*(.*)/i)?.[1]?.trim() || "",
        datePrefix: metadataRaw.match(/Date-Prefix:\s*(.*)/i)?.[1]?.trim() || (lang === 'en' ? "" : "den")
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
        // Brug layoutMeta i stedet for hårdkodede regler
        const fullHtml = wrap(s.title, htmlBody, s.id, { company: companyName, position: jobTitleRaw }, candidate, lang, layoutMeta);
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
