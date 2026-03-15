
import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const socket = io();

const THEME_COLOR = "cyan";

const App: React.FC = () => {
  const [version, setVersion] = useState('v2.6.x-dev');
  const [jobText, setJobText] = useState('');
  const [companyUrl, setCompanyUrl] = useState('');
  const [hint, setHint] = useState('');
  const [bruttoCv, setBruttoCv] = useState('');
  const [showBrutto, setShowBrutto] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [viewModes, setViewModes] = useState<{ [key: string]: 'markdown' | 'html' }>({
    ansøgning: 'html', cv: 'html', match: 'html', ican: 'html'
  });
  const [results, setResults] = useState<{ 
    folder: string, 
    lang?: string,
    aiNotes?: string,
    markdown: { [key: string]: string },
    html: { [key: string]: string },
    links: { [key: string]: { md: string, html: string } }
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toggleViewMode = (id: string) => {
    setViewModes(prev => ({ ...prev, [id]: prev[id] === 'html' ? 'markdown' : 'html' }));
  };

  const handleSaveBrutto = async () => {
    setIsLoading(true); setStatusMessage('Gemmer Master CV...');
    try {
      await fetch('/api/brutto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: bruttoCv }),
      });
      setIsLoading(false); setStatusMessage('Gemt!');
      setTimeout(() => setStatusMessage(''), 2000);
    } catch (err: any) { setError(err.message); setIsLoading(false); }
  };

  const handleTranslateBrutto = async () => {
    setIsLoading(true); setStatusMessage('Oversætter til Engelsk...');
    try {
      const res = await fetch('/api/brutto/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: bruttoCv }),
      });
      const data = await res.json();
      setBruttoCv(data.translated);
      setIsLoading(false); setStatusMessage('Oversat!');
    } catch (err: any) { setError(err.message); setIsLoading(false); }
  };

  const handleRefine = async (type: string) => {
    if (!results) return;
    setIsLoading(true); setStatusMessage(`Opdaterer ${type}...`);
    try {
      const response = await fetch('/api/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder: results.folder, type, markdown: results.markdown[type] }),
      });
      const data = await response.json();
      setResults({ ...results, html: { ...results.html, [type]: data.html } });
      setIsLoading(false); setStatusMessage('Opdateret!');
      setTimeout(() => setStatusMessage(''), 2000);
    } catch (err: any) { setError(err.message); setIsLoading(false); }
  };

  useEffect(() => {
    fetch('/api/version')
      .then(res => res.json())
      .then(data => setVersion(`v${data.version}`))
      .catch(e => console.error("Kunne ikke hente version"));

    fetch('/api/brutto').then(res => res.json()).then(data => setBruttoCv(data.content));

    socket.on('job_status_update', (data) => {
      setStatusMessage(data.status);
      if (data.status === 'Færdig!') { setResults(data); setIsLoading(false); }
      else if (data.status.includes('Fejl')) { setError(data.error || data.status); setIsLoading(false); }
    });
    return () => { socket.off('job_status_update'); };
  }, []);

  const handleGenerate = async () => {
    if (!jobText.trim()) return;
    setIsLoading(true); setError(null); setResults(null); setStatusMessage('Starter...');
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobText, companyUrl, hint }),
      });
      const { jobId } = await response.json();
      socket.emit('join_job', jobId);
    } catch (err: any) { setError(err.message); setIsLoading(false); }
  };

  const getDocUrl = (path: string) => {
    if (!path) return '#';
    return `http://${window.location.hostname}:9001${path}`;
  };

  const themeClasses = {
    text: THEME_COLOR === 'cyan' ? 'text-cyan-400' : 'text-rose-500',
    button: THEME_COLOR === 'cyan' ? 'bg-cyan-500 hover:bg-cyan-400' : 'bg-rose-600 hover:bg-rose-500',
    buttonActive: THEME_COLOR === 'cyan' ? 'bg-cyan-500' : 'bg-rose-600'
  };

  return (
    <div className="min-h-screen bg-[#0a192f] text-gray-100 p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12 text-center">
          <h1 className="text-3xl font-light tracking-widest uppercase text-cyan-400 border-b border-cyan-500/30 pb-4 inline-block">Job Application Agent | {version}</h1>
        </header>

        <main className="space-y-8">
          {/* Master CV Sektion */}
          <section className="bg-[#112240] p-6 rounded-xl border border-white/5 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-300 uppercase tracking-wider">Master CV (Kilde)</h2>
              <button onClick={() => setShowBrutto(!showBrutto)} className="text-cyan-400 text-xs font-bold hover:underline">
                {showBrutto ? 'SKJUL REDIGERING' : 'REDIGER MASTER CV'}
              </button>
            </div>
            
            {showBrutto && (
              <div className="space-y-4">
                <textarea 
                  className="w-full h-64 bg-[#0a192f] border border-white/10 rounded p-4 font-mono text-sm text-gray-300"
                  value={bruttoCv}
                  onChange={(e) => setBruttoCv(e.target.value)}
                />
                <div className="flex gap-4">
                  <button onClick={handleSaveBrutto} className="flex-1 bg-green-600 hover:bg-green-500 text-white py-2 rounded text-xs font-bold uppercase tracking-widest">💾 Gem Ændringer</button>
                  <button onClick={handleTranslateBrutto} className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white py-2 rounded text-xs font-bold uppercase tracking-widest">🌐 Oversæt til Engelsk</button>
                </div>
              </div>
            )}
            {!showBrutto && <p className="text-gray-500 text-sm italic">Dette er fundamentet AI'en bruger til at skræddersy dine ansøgninger.</p>}
          </section>

          <section className="bg-[#112240] p-6 rounded-xl shadow-xl border border-white/5">
            <div className="mb-4">
              <label className="block text-sm font-bold text-gray-400 mb-2">Firma URL</label>
              <input type="text" placeholder="https://firma.dk/job" className="w-full bg-[#0a192f] border border-white/10 rounded p-3 text-gray-300" value={companyUrl} onChange={(e) => setCompanyUrl(e.target.value)} />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-bold text-gray-400 mb-2">Jobopslag</label>
              <textarea placeholder="Indsæt selve teksten fra jobopslaget her..." className="w-full h-48 bg-[#0a192f] border border-white/10 rounded p-4 text-gray-300" value={jobText} onChange={(e) => setJobText(e.target.value)} />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-400 mb-2">Personligt Hint (Valgfrit)</label>
              <textarea placeholder="F.eks. 'Husk at nævne min erfaring med Python' eller 'Skriv den i en uformel tone'" className="w-full h-20 bg-[#0a192f] border border-white/10 rounded p-4 text-gray-300 text-sm" value={hint} onChange={(e) => setHint(e.target.value)} />
            </div>
            <button onClick={handleGenerate} disabled={isLoading} className={`w-full py-4 rounded font-bold uppercase tracking-widest transition-all ${isLoading ? 'bg-gray-700' : `${themeClasses.button} text-[#0a192f]`}`}>
              {isLoading ? (statusMessage || 'Arbejder...') : 'Start Automatisering'}
            </button>
          </section>

          {results && (
            <div className="space-y-8">
              {results.aiNotes && (
                <section className="bg-cyan-900/20 border border-cyan-500/30 p-4 rounded text-sm italic text-cyan-100">
                  <span className="font-bold text-cyan-400 block mb-1">AI Ræsonnement:</span> "{results.aiNotes}"
                </section>
              )}

              <div className="flex justify-between items-center bg-[#112240] p-4 rounded border border-white/5">
                <span className="text-green-400 font-medium">✓ Dokumenter klar i mappen: {results.folder}</span>
              </div>

              <div className="grid grid-cols-1 gap-12">
                {[
                  { id: 'ansøgning', title: 'Ansøgning' },
                  { id: 'cv', title: 'CV' },
                  { id: 'match', title: 'Match Analyse' },
                  { id: 'ican', title: 'ICAN+ Pitch' }
                ].map((doc) => (
                  <div key={doc.id} className="bg-[#112240] rounded-xl overflow-hidden border border-white/5 shadow-2xl">
                    <div className="bg-black/20 p-4 border-b border-white/5 flex justify-between items-center">
                      <h3 className="font-bold uppercase tracking-widest text-gray-300">{doc.title}</h3>
                      <div className="flex gap-3">
                        <button onClick={() => toggleViewMode(doc.id)} className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-4 py-1 rounded text-[10px] font-bold uppercase tracking-tighter">
                          {viewModes[doc.id] === 'html' ? 'Rediger Markdown' : 'Vis Preview'}
                        </button>
                        <a href={getDocUrl(results.links[doc.id]?.html)} target="_blank" rel="noopener noreferrer" className="bg-green-600 hover:bg-green-500 text-white px-4 py-1 rounded text-[10px] font-bold uppercase tracking-tighter">Åben i ny tab (Print)</a>
                      </div>
                    </div>
                    <div className="p-6">
                      {viewModes[doc.id] === 'markdown' ? (
                        <div className="space-y-4">
                          <textarea className="w-full h-[600px] bg-black/30 border border-white/10 rounded p-6 font-mono text-sm text-gray-300" value={results.markdown[doc.id]} onChange={(e) => setResults({...results, markdown: {...results.markdown, [doc.id]: e.target.value}})} />
                          <button onClick={() => handleRefine(doc.id)} className={`w-full py-3 rounded text-xs font-bold uppercase tracking-widest ${themeClasses.buttonActive} text-[#0a192f]`}>💾 Gem og opdater preview</button>
                        </div>
                      ) : (
                        <div className="bg-white rounded overflow-hidden shadow-inner h-[800px]">
                           <iframe 
                             title={doc.title}
                             srcDoc={results.html[doc.id]} 
                             className="w-full h-full border-none"
                           />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
        <footer className="mt-20 text-center text-gray-600 text-xs tracking-widest uppercase pb-10">Job-Application-Agent | {VERSION}</footer>
      </div>
    </div>
  );
};

export default App;
