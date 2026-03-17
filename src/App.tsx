import React, { useState, useRef } from 'react';
import { 
  Shield, 
  Activity, 
  Lock, 
  ChevronRight, 
  Loader2, 
  Copy, 
  Check, 
  Download,
  AlertCircle,
  History,
  Plus,
  FileCheck,
  Terminal
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import { generateAuditAssessment, ConsoleMode } from './services/gemini';
import { cn } from './utils';

interface PlanHistory {
  id: string;
  timestamp: number;
  input: string;
  output: string;
  mode: ConsoleMode;
}

export default function App() {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<ConsoleMode>('audit');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [history, setHistory] = useState<PlanHistory[]>([]);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const handleGenerate = async () => {
    if (!input.trim() || isGenerating) return;

    setIsGenerating(true);
    setError(null);
    try {
      const plan = await generateAuditAssessment(input, mode);
      if (plan) {
        setCurrentPlan(plan);
        const newEntry: PlanHistory = {
          id: Date.now().toString(),
          timestamp: Date.now(),
          input: input,
          output: plan,
          mode: mode
        };
        setHistory(prev => [newEntry, ...prev]);
        
        // Scroll to result
        setTimeout(() => {
          resultRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to generate assessment. Please check your connection and try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadReport = () => {
    if (!currentPlan) return;
    
    const timestamp = new Date().toISOString().split('T')[0];
    const prefix = mode === 'audit' ? 'ISAAC_Audit_Report' : 'ISAAC_Scenario_Design';
    const filename = `${prefix}_${timestamp}.md`;
    
    const blob = new Blob([currentPlan], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = () => {
    if (!currentPlan) return;
    navigator.clipboard.writeText(currentPlan);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const startNew = () => {
    setInput('');
    setCurrentPlan(null);
    setError(null);
  };

  const loadFromHistory = (entry: PlanHistory) => {
    setInput(entry.input);
    setCurrentPlan(entry.output);
    setMode(entry.mode || 'audit');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-[#E4E3E0] font-sans selection:bg-[#F27D26] selection:text-[#0A0A0B]">
      {/* Header / Navigation */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between sticky top-0 bg-[#0A0A0B]/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#F27D26] flex items-center justify-center rounded-sm">
            <Shield className="text-[#0A0A0B] w-5 h-5" />
          </div>
          <h1 className="font-serif italic text-xl tracking-tight text-[#F27D26]">Project I.S.A.A.C.</h1>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => {
              const link = document.createElement('a');
              link.href = '/ISAAC_Master_Prompt.md';
              link.download = 'ISAAC_Master_Prompt.md';
              link.click();
            }}
            className="flex items-center gap-2 text-sm font-mono uppercase tracking-widest hover:text-[#F27D26] transition-colors border border-white/10 px-3 py-1"
          >
            <Download className="w-4 h-4" />
            Audit Protocol
          </button>
          <button 
            onClick={startNew}
            className="flex items-center gap-2 text-sm font-mono uppercase tracking-widest hover:text-[#F27D26] transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Assessment
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 min-h-[calc(100vh-65px)]">
        {/* Sidebar - History */}
        <aside className="lg:col-span-3 border-r border-white/10 p-6 hidden lg:block overflow-y-auto max-h-[calc(100vh-65px)]">
          <div className="flex items-center gap-2 mb-6 opacity-50">
            <Activity className="w-4 h-4" />
            <span className="font-mono text-xs uppercase tracking-widest">Audit History</span>
          </div>
          <div className="space-y-4">
            {history.length === 0 && (
              <p className="text-sm opacity-40 italic">No history yet.</p>
            )}
            {history.map((entry) => (
              <button
                key={entry.id}
                onClick={() => loadFromHistory(entry)}
                className="w-full text-left group border-b border-white/5 pb-3 hover:border-[#F27D26]/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[10px] font-mono opacity-40">
                    {new Date(entry.timestamp).toLocaleDateString()}
                  </p>
                  <span className={cn(
                    "text-[8px] font-mono uppercase px-1 border",
                    entry.mode === 'audit' ? "border-blue-500/30 text-blue-400" : "border-amber-500/30 text-amber-400"
                  )}>
                    {entry.mode}
                  </span>
                </div>
                <p className="text-sm line-clamp-2 font-medium group-hover:text-[#F27D26] transition-colors">
                  {entry.input}
                </p>
              </button>
            ))}
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="lg:col-span-9 p-6 lg:p-12 overflow-y-auto">
          <div className="max-w-3xl mx-auto space-y-12">
            {/* Input Section */}
            <section className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#F27D26] block">
                    01 / Select Console Mode
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setMode('audit')}
                      className={cn(
                        "flex flex-col items-start p-4 border transition-all text-left group",
                        mode === 'audit' ? "border-[#F27D26] bg-[#F27D26]/10" : "border-white/10 hover:border-white/30"
                      )}
                    >
                      <FileCheck className={cn("w-5 h-5 mb-2", mode === 'audit' ? "text-[#F27D26]" : "opacity-40")} />
                      <span className="font-mono text-xs uppercase tracking-widest mb-1">Audit Mode</span>
                      <span className="text-[10px] opacity-60">Review BCP test results or incident data for compliance.</span>
                    </button>
                    <button
                      onClick={() => setMode('develop')}
                      className={cn(
                        "flex flex-col items-start p-4 border transition-all text-left group",
                        mode === 'develop' ? "border-[#F27D26] bg-[#F27D26]/10" : "border-white/10 hover:border-white/30"
                      )}
                    >
                      <Terminal className={cn("w-5 h-5 mb-2", mode === 'develop' ? "text-[#F27D26]" : "opacity-40")} />
                      <span className="font-mono text-xs uppercase tracking-widest mb-1">Design Mode</span>
                      <span className="text-[10px] opacity-60">Develop new BCP test scenarios and tabletop exercises.</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#F27D26] block">
                    02 / {mode === 'audit' ? 'Audit Parameters & Incident Data' : 'Scenario Parameters & Objectives'}
                  </label>
                  <p className="text-lg font-serif leading-relaxed opacity-80">
                    {mode === 'audit' 
                      ? 'Input BCP phase data, incident severity, or technical logs to generate a dual-certified ISO assessment.'
                      : 'Provide key objectives, site locations, or threat vectors to design a realistic BCP tabletop scenario.'}
                  </p>
                </div>
              </div>

              <div className="relative group">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={mode === 'audit' 
                    ? "e.g., Phase 2 Activation at 6788 Ayala. Power outage detected. RVT mobilizing to Okada Manila..."
                    : "e.g., Concept: Earthquake Intensity 7. Goal: Validate Rockwell failover. Budget: 500k PHP. Participants: ERT, RVT, CMT. Technical: Test 3CX failover."}
                  className="w-full h-48 bg-white/5 border border-white/10 p-6 focus:outline-none focus:border-[#F27D26]/50 focus:ring-0 resize-none font-sans text-lg leading-relaxed placeholder:opacity-20 transition-all rounded-sm"
                />
                <div className="absolute bottom-4 right-4 flex items-center gap-3">
                  <button
                    onClick={handleGenerate}
                    disabled={!input.trim() || isGenerating}
                    className={cn(
                      "flex items-center gap-2 px-6 py-3 bg-[#F27D26] text-[#0A0A0B] font-mono text-xs uppercase tracking-widest transition-all rounded-sm",
                      (!input.trim() || isGenerating) ? "opacity-20 cursor-not-allowed" : "hover:bg-[#F27D26]/90 active:scale-95"
                    )}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {mode === 'audit' ? 'Auditing...' : 'Designing...'}
                      </>
                    ) : (
                      <>
                        {mode === 'audit' ? (
                          <>
                            <Lock className="w-4 h-4" />
                            Run Assessment
                          </>
                        ) : (
                          <>
                            <Terminal className="w-4 h-4" />
                            Generate Scenario
                          </>
                        )}
                      </>
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-400 font-mono text-xs uppercase tracking-wider bg-red-950/30 p-3 border border-red-900/50">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}
            </section>

            {/* Results Section */}
            <AnimatePresence mode="wait">
              {currentPlan && (
                <motion.section
                  key="result"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  ref={resultRef}
                  className="space-y-8 pt-12 border-t border-white/10"
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <label className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#F27D26] block">
                        02 / ISO Security & Audit Assessment
                      </label>
                      <h2 className="text-3xl font-serif italic">Audit Findings</h2>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={downloadReport}
                        className="flex items-center gap-2 px-3 py-2 border border-white/10 hover:bg-white/10 transition-all rounded-sm font-mono text-[10px] uppercase tracking-widest"
                        title="Download Report (.md)"
                      >
                        <Download className="w-4 h-4" />
                        Save Report
                      </button>
                      <button
                        onClick={copyToClipboard}
                        className="p-2 border border-white/10 hover:bg-white/10 transition-all rounded-sm"
                        title="Copy to Clipboard"
                      >
                        {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="prose prose-invert max-w-none 
                    prose-headings:font-serif prose-headings:italic prose-headings:font-normal prose-headings:border-b prose-headings:border-white/10 prose-headings:pb-2 prose-headings:mt-12 prose-headings:text-[#F27D26]
                    prose-p:text-lg prose-p:leading-relaxed prose-p:text-white/80
                    prose-li:text-white/80 prose-li:text-lg
                    prose-strong:text-white prose-strong:font-semibold
                    prose-hr:border-white/10
                    prose-table:border prose-table:border-white/10
                    prose-th:border prose-th:border-white/10 prose-th:p-2 prose-th:bg-white/5
                    prose-td:border prose-td:border-white/10 prose-td:p-2
                  ">
                    <ReactMarkdown>{currentPlan}</ReactMarkdown>
                  </div>

                  <div className="pt-12 flex justify-center">
                    <button
                      onClick={startNew}
                      className="group flex flex-col items-center gap-2 opacity-40 hover:opacity-100 transition-opacity"
                    >
                      <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-[#F27D26] group-hover:text-[#0A0A0B] transition-all">
                        <Plus className="w-6 h-6" />
                      </div>
                      <span className="font-mono text-[10px] uppercase tracking-widest">New Assessment</span>
                    </button>
                  </div>
                </motion.section>
              )}
            </AnimatePresence>

            {!currentPlan && !isGenerating && (
              <div className="py-24 flex flex-col items-center justify-center text-center space-y-6 opacity-20">
                <Terminal className="w-16 h-16 stroke-[1px]" />
                <div className="space-y-2">
                  <p className="font-serif italic text-2xl">Console Standby</p>
                  <p className="font-mono text-[10px] uppercase tracking-[0.3em]">Awaiting security parameters for assessment</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 px-6 py-4 flex items-center justify-between text-[10px] font-mono uppercase tracking-widest opacity-40">
        <div>© 2026 Project I.S.A.A.C. Console</div>
        <div className="flex gap-6">
          <span>ISO 27001:2022</span>
          <span>ISO 22301:2019</span>
          <span>Confidential</span>
        </div>
      </footer>
    </div>
  );
}
