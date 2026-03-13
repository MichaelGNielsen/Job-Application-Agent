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

// Konfigurer stier - Vi tvinger den til /app/shared
const rootDir = '/app/shared';
dotenv.config({ path: path.join(rootDir, '.env') });

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const redisConnection = new IORedis({
  host: process.env.REDIS_HOST || 'redis',
  port: 6379,
  maxRetriesPerRequest: null
});

const jobQueue = new Queue('job_queue', { connection: redisConnection });

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '50mb' }));

// SERVER STATISKE FILER - Med rettet routing
// express.static(rootDir) betyder at /api/applications/foo.pdf leder efter rootDir/foo.pdf
app.use('/api/applications', express.static(rootDir, {
    index: false, // Deaktiver directory listing
    setHeaders: (res, path) => {
        if (path.endsWith('.pdf')) {
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'inline'); // Vis i browser
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

app.post('/api/generate', async (req, res) => {
  try {
    const { jobText, companyUrl, hint } = req.body;
    const jobId = "job_" + Date.now().toString();
    await jobQueue.add('generate_application', { jobId, jobText, companyUrl, hint }, { jobId });
    res.status(202).json({ jobId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/refine', async (req, res) => {
  try {
    const { folder, type, markdown } = req.body; 
    const folderPath = path.join(rootDir, folder);
    const mdPath = path.join(folderPath, `${type}.md`);
    fs.writeFileSync(mdPath, markdown);

    const htmlBody = await mdToHtml(markdown, mdPath, `${type}_body.html`);
    const companyName = folder.split('_')[3] || 'firma';
    const htmlPath = path.join(folderPath, `${type}.html`);
    const pdfName = `${process.env.MIT_NAVN.replace(/\s+/g, '_')}_${type}_${companyName}.pdf`;
    const pdfPath = path.join(folderPath, pdfName);

    fs.writeFileSync(htmlPath, wrap(type.toUpperCase(), htmlBody, type, { company: companyName }));
    await printToPdf(htmlPath, pdfPath);

    res.json({ success: true, html: htmlBody });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

io.on('connection', (socket) => {
  socket.on('join_job', (jobId) => { socket.join(jobId); });
  socket.on('job_status_update', (data) => { io.to(data.jobId).emit('job_status_update', data); });
});

const PORT = 3002;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`[SERVER v2.1] kører på port ${PORT}`);
});
