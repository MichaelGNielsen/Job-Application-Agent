const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { Queue } = require('bullmq');
const IORedis = require('ioredis');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const { exec } = require('child_process');
const { promisify } = require('util');
const { mdToHtml, wrap } = require('./utils');

const execPromise = promisify(exec);

// Konfigurer stier
const rootDir = '/app/shared';
// Indlæs begge .env filer
dotenv.config({ path: path.join(rootDir, '.env_private') });
dotenv.config({ path: path.join(rootDir, '.env_ai') });

// Tving API nøgle til at være tilgængelig for gemini-cli
if (process.env.GEMINI_API_KEY) {
    process.env.GOOGLE_API_KEY = process.env.GEMINI_API_KEY;
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const versionFilePath = path.join(rootDir, 'VERSION');

app.get('/api/version', (req, res) => {
    try {
        const currentVersion = fs.existsSync(versionFilePath) ? fs.readFileSync(versionFilePath, 'utf8').trim() : "2.6.x-dev";
        res.json({ version: currentVersion });
    } catch (e) {
        res.status(500).json({ version: "error" });
    }
});

const redisConnection = new IORedis({
  host: process.env.REDIS_HOST || 'redis',
  port: 6379,
  maxRetriesPerRequest: null
});

const jobQueue = new Queue('job_queue', { connection: redisConnection });

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

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '50mb' }));

app.use('/api/applications', express.static(path.join(rootDir, 'output'), {
    index: false,
    setHeaders: (res, path) => {
        if (path.endsWith('.pdf')) {
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'inline');
        }
    }
}));

async function printToPdf(htmlPath, pdfPath) {
    try {
        const cmd = `chromium-browser --headless --disable-gpu --no-sandbox --no-pdf-header-footer --print-to-pdf="${pdfPath}" "${htmlPath}"`;
        await execPromise(cmd);
        return true;
    } catch (error) {
        console.error(`[Refine PDF] Fejl:`, error.message);
        return false;
    }
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

app.get('/api/brutto', async (req, res) => {
  try {
    const bruttoPath = path.join(rootDir, 'data', 'brutto_cv.md');
    const content = fs.existsSync(bruttoPath) ? fs.readFileSync(bruttoPath, 'utf8') : "";
    res.json({ content });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/brutto', async (req, res) => {
  try {
    const { content } = req.body;
    const bruttoPath = path.join(rootDir, 'data', 'brutto_cv.md');
    fs.writeFileSync(bruttoPath, content);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/brutto/translate', async (req, res) => {
  try {
    const { content } = req.body;
    const prompt = `Oversæt dette CV til professionelt engelsk. Behold Markdown-formateringen:\n\n${content}`;
    const translated = await callLocalGemini(prompt);
    res.json({ translated });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/generate', async (req, res) => {
  try {
    const { jobText, companyUrl, hint } = req.body;
    const jobId = "job_" + Date.now().toString();
    await jobQueue.add('generate_application', { jobId, jobText, companyUrl, hint, type: 'initial' }, { jobId });
    res.status(202).json({ jobId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/refine', async (req, res) => {
  try {
    const { folder, type, markdown, useAi, hint } = req.body; 

    if (useAi) {
        const jobId = "refine_" + Date.now().toString();
        // Saml alle nuværende MD filer i mappen for at give AI'en kontekst
        const folderPath = path.join(rootDir, 'output', folder);
        const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.md') && !f.includes('job.md'));
        let combinedMarkdown = "";
        files.forEach(f => {
            const content = fs.readFileSync(path.join(folderPath, f), 'utf8');
            combinedMarkdown += `\n---${f}---\n${content}\n`;
        });

        await jobQueue.add('generate_application', { 
            jobId, 
            folder, 
            hint, 
            markdown: combinedMarkdown, 
            type: 'refine_with_ai' 
        }, { jobId });
        
        return res.status(202).json({ jobId });
    }

    // Manuel refinement (eksisterende logik)
    const folderPath = path.join(rootDir, 'output', folder);
    const files = fs.readdirSync(folderPath);
    const typeLabel = type === 'ansøgning' ? 'Ansøgning' : type === 'cv' ? 'CV' : type === 'match' ? 'Match_Analyse' : 'ICAN+_Pitch';
    const existingFile = files.find(f => f.startsWith(typeLabel) && f.endsWith('.md'));
    const baseName = existingFile ? existingFile.replace('.md', '') : type;
    const mdPath = path.join(folderPath, `${baseName}.md`);
    const htmlPath = path.join(folderPath, `${baseName}.html`);
    const pdfPath = path.join(folderPath, `${baseName}.pdf`);
    
    fs.writeFileSync(mdPath, markdown);

    const bruttoPath = path.join(rootDir, 'data', 'brutto_cv.md');
    const bruttoCv = fs.existsSync(bruttoPath) ? fs.readFileSync(bruttoPath, 'utf8') : "";
    const candidate = parseCandidateInfo(bruttoCv);

    const htmlBody = await mdToHtml(markdown, mdPath, `${baseName}_body.html`);
    const companyName = folder.split('_')[2] || 'firma';
    const jobTitle = folder.split('_').slice(3).join(' ') || 'stilling';
    const fullHtml = wrap(typeLabel.replace('_', ' '), htmlBody, type, { company: companyName, position: jobTitle }, candidate);
    
    fs.writeFileSync(htmlPath, fullHtml);
    await printToPdf(htmlPath, pdfPath);
    
    res.json({ success: true, html: fullHtml });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

io.on('connection', (socket) => {
  socket.on('join_job', (jobId) => { socket.join(jobId); });
  socket.on('job_status_update', (data) => { io.to(data.jobId).emit('job_status_update', data); });
});

const PORT = 3002;
server.listen(PORT, '0.0.0.0', () => {
  const startVersion = fs.existsSync(versionFilePath) ? fs.readFileSync(versionFilePath, 'utf8').trim() : "2.6.x-dev";
  console.log(`[SERVER v${startVersion}] kører på port ${PORT}`);
});
