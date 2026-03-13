
import { exec } from 'child_process';
import { promisify } from 'util';
import dotenv from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const execPromise = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Manuel indlæsning af .env fra rod
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const apiKeyMatch = envContent.match(/GEMINI_API_KEY=(.*)/);
const apiKey = apiKeyMatch ? apiKeyMatch[1].trim() : null;

if (!apiKey) {
    console.error("❌ Ingen API nøgle fundet i .env");
    process.exit(1);
}

async function testModel(version, model) {
    const url = `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${apiKey}`;
    console.log(`\n🔍 Tester: ${version} med ${model}...`);
    
    const data = JSON.stringify({ contents: [{ parts: [{ text: "Svar med ordet 'OK' hvis du virker." }] }] });
    const tmpFile = path.join(__dirname, 'test_payload.json');
    fs.writeFileSync(tmpFile, data);

    try {
        const { stdout } = await execPromise(`curl -s -H "Content-Type: application/json" -d @${tmpFile} -X POST "${url}"`);
        const res = JSON.parse(stdout);
        if (res.candidates) {
            console.log(`✅ SUCCESS! Svar: ${res.candidates[0].content.parts[0].text.trim()}`);
            return true;
        } else {
            console.log(`❌ FEJL: ${res.error?.message || 'Ukendt fejl'}`);
            return false;
        }
    } catch (e) {
        console.log(`❌ CRASH: ${e.message}`);
        return false;
    } finally {
        if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
    }
}

async function runTests() {
    console.log("=== GEMINI API TESTER ===");
    // Vi tester de 3 mest sandsynlige kombinationer
    await testModel('v1', 'gemini-1.5-flash');
    await testModel('v1beta', 'gemini-1.5-flash');
    await testModel('v1', 'gemini-pro');
}

runTests();
