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
    links: { [key: string]: { md: string, html: string, pdf: string } }
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
      .catch(e => console.error("Kunne ikke hente version fra API"));

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
    return path;
  };

  return (
    <div className="min-h-screen w-full bg-[#0a192f] text-gray-100 p-8 font-sans scroll-smooth">
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
              <label className="block text-sm font-bold text-gray-400 mb-2">Personligt Hint (Valgfrit)</label>
              <input type="text" placeholder="F.eks. Husk at nævne min erfaring med Tibet..." className="w-full bg-[#0a192f] border border-white/10 rounded p-3 text-gray-300" value={hint} onChange={(e) => setHint(e.target.value)} />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-400 mb-2">Jobopslag (Indsæt tekst her)</label>
              <textarea 
                className="w-full h-48 bg-[#0a192f] border border-white/10 rounded p-3 text-gray-300"
                value={jobText}
                onChange={(e) => setJobText(e.target.value)}
              />
            </div>
            <button 
              onClick={handleGenerate}
              disabled={isLoading}
              className={`w-full py-4 rounded-lg font-bold uppercase tracking-widest transition-all ${isLoading ? 'bg-gray-700 cursor-not-allowed' : 'bg-cyan-600 hover:bg-cyan-500 shadow-lg shadow-cyan-500/20'}`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">🌀</span> {statusMessage}
                </span>
              ) : '🚀 Start Automatisering'}
            </button>
          </section>

          {error && (
            <div className="bg-red-900/30 border border-red-500/50 p-4 rounded text-red-400 text-sm">
              ⚠️ {error}
            </div>
          )}

          {results && (
            <div className="space-y-8 animate-in fade-in duration-700">
              <div className="bg-cyan-900/20 border border-cyan-500/30 p-6 rounded-xl">
                <h3 className="text-cyan-400 font-bold mb-2 flex items-center gap-2">🧠 AI Ræsonnement (Redaktørens noter)</h3>
                <p className="text-sm text-gray-300 leading-relaxed italic">"{results.aiNotes}"</p>
              </div>

              <div className="flex flex-col gap-8">
                {['ansøgning', 'cv', 'match', 'ican'].map((id) => {
                  const title = id === 'ansøgning' ? 'Ansøgning' : id === 'cv' ? 'CV' : id === 'match' ? 'Match Analyse' : 'ICAN+ Pitch';
                  return (
                    <div key={id} className="bg-[#112240] rounded-xl border border-white/5 overflow-hidden flex flex-col">
                      <div className="bg-white/5 px-4 py-3 flex justify-between items-center border-b border-white/5">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-tighter">{title}</span>
                        <div className="flex gap-2">
                          <button onClick={() => toggleViewMode(id)} className="text-[10px] text-cyan-400 hover:underline">
                            {viewModes[id] === 'html' ? 'VIS MARKDOWN' : 'VIS PREVIEW'}
                          </button>
                          <a href={getDocUrl(results.links[id]?.pdf)} target="_blank" rel="noreferrer" className="text-[10px] text-green-400 hover:underline">ÅBEN HTML</a>
                        </div>
                      </div>
                      <div className="p-4 flex-1">
                        {viewModes[id] === 'html' ? (
                          <div className="prose prose-invert prose-sm max-w-none bg-white p-6 rounded shadow-inner text-gray-900 overflow-auto max-h-[400px]" dangerouslySetInnerHTML={{ __html: results.html[id] }} />
                        ) : (
                          <textarea 
                            className="w-full h-[400px] bg-[#0a192f] text-cyan-50 font-mono text-xs p-4 rounded"
                            value={results.markdown[id]}
                            onChange={(e) => setResults({...results, markdown: {...results.markdown, [id]: e.target.value}})}
                          />
                        )}
                      </div>
                      <div className="p-4 pt-0">
                        <button onClick={() => handleRefine(id)} className="w-full py-2 bg-white/5 hover:bg-white/10 text-[10px] font-bold uppercase tracking-widest rounded transition-colors">Opdater {title}</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
