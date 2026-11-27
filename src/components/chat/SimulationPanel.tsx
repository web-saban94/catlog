import React, {useEffect, useState} from 'react';
import {Award, CheckCircle2, Play, RotateCcw, Send, UserCheck, X} from 'lucide-react';
import {
  SIMULATION_SCENARIOS,
  SimulationScenarioDef,
  detectSimulationScenario,
  evaluateSimulationSession,
  generateCustomerSimulationTurn,
} from '../../lib/counter/simulation';
import {SimulationEvaluation, SimulationTurn} from '../../lib/counter/types';

interface SimulationPanelProps {
  open: boolean;
  onClose: () => void;
  initialHint?: string;
}

export const SimulationPanel: React.FC<SimulationPanelProps> = ({
  open,
  onClose,
  initialHint,
}) => {
  const [selectedScenario, setSelectedScenario] = useState<SimulationScenarioDef>(() =>
    initialHint ? detectSimulationScenario(initialHint) : SIMULATION_SCENARIOS[0]!,
  );
  const [turns, setTurns] = useState<SimulationTurn[]>([]);
  const [hintForRep, setHintForRep] = useState<string>('');
  const [repInput, setRepInput] = useState('');
  const [evaluation, setEvaluation] = useState<SimulationEvaluation | null>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (open && initialHint) {
      setSelectedScenario(detectSimulationScenario(initialHint));
    }
  }, [open, initialHint]);

  if (!open) return null;

  const nowStr = () => new Date().toLocaleTimeString('he-IL', {hour: '2-digit', minute: '2-digit'});

  const startScenario = (sc: SimulationScenarioDef) => {
    setSelectedScenario(sc);
    setEvaluation(null);
    setTurns([{role: 'customer', text: sc.openingCustomerLine, time: nowStr()}]);
    setHintForRep(sc.repHint);
    setStarted(true);
  };

  const handleSendTurn = (e: React.FormEvent) => {
    e.preventDefault();
    const msg = repInput.trim();
    if (!msg) return;

    const nextTurns: SimulationTurn[] = [...turns, {role: 'rep', text: msg, time: nowStr()}];
    const reply = generateCustomerSimulationTurn({
      scenarioId: selectedScenario.id,
      repMessage: msg,
      turnNumber: nextTurns.filter((t) => t.role === 'rep').length,
    });
    setTurns([...nextTurns, {role: 'customer', text: reply.customerMessage, time: nowStr()}]);
    setHintForRep(reply.hintForRep);
    setRepInput('');
  };

  const handleEvaluate = () => {
    const result = evaluateSimulationSession(turns, selectedScenario.id);
    setEvaluation(result);
  };

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-3 sm:p-5 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="סימולציית שיחת מכירה בדלפק"
    >
      <div className="flex max-h-[90dvh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-[#f8fafc] shadow-2xl">
        <header className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-600 text-white">
              <UserCheck className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base font-extrabold text-[#0f172a]">
                מצב תרגול נציג — סימולציית לקוח בדלפק
              </h2>
              <p className="text-xs text-slate-500">
                נועה מדמה את הלקוח ובסיום מפיקה משוב אימון ב-6 קריטריונים
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="סגור"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {!started ? (
            <div className="space-y-3">
              <div className="text-sm font-extrabold text-[#0f172a]">בחר תרחיש לקוח לתרגול:</div>
              <div className="grid grid-cols-1 gap-2.5">
                {SIMULATION_SCENARIOS.map((sc) => (
                  <button
                    key={sc.id}
                    type="button"
                    onClick={() => startScenario(sc)}
                    className={`flex items-start justify-between gap-3 rounded-2xl border p-4 text-right transition-colors cursor-pointer ${
                      selectedScenario.id === sc.id
                        ? 'border-[#1769AA] bg-white shadow-xs'
                        : 'border-slate-200 bg-white hover:border-[#1769AA]/40'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-amber-600">{sc.personaName}</div>
                      <div className="text-sm font-extrabold text-[#0f172a]">{sc.title}</div>
                      <div className="text-xs text-slate-500">יעד תרגול: {sc.goalForRep}</div>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-[#0f172a] px-3 py-2 text-xs font-bold text-white">
                      <Play className="h-3.5 w-3.5" />
                      <span>התחל</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs">
                <div>
                  <span className="font-extrabold text-[#0f172a]">{selectedScenario.personaName}</span>
                  <span className="mx-2 text-slate-300">|</span>
                  <span className="text-slate-500">{selectedScenario.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setStarted(false);
                      setEvaluation(null);
                      setTurns([]);
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>החלף תרחיש</span>
                  </button>
                  {!evaluation && turns.some((t) => t.role === 'rep') && (
                    <button
                      type="button"
                      onClick={handleEvaluate}
                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1 font-bold text-white hover:bg-emerald-700 cursor-pointer"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>סיים וקבל משוב</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-2.5 rounded-2xl border border-slate-200 bg-white p-4">
                {turns.map((t, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col ${t.role === 'rep' ? 'items-start' : 'items-end'}`}
                  >
                    <span className="mb-1 text-[10px] font-bold text-slate-500">
                      {t.role === 'rep' ? 'נציג (אתה)' : selectedScenario.personaName} · {t.time}
                    </span>
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                        t.role === 'rep'
                          ? 'bg-[#0f172a] text-white'
                          : 'border border-amber-200 bg-amber-50 text-[#0f172a]'
                      }`}
                    >
                      {t.text}
                    </div>
                  </div>
                ))}
              </div>

              {hintForRep && !evaluation && (
                <div className="rounded-xl border border-[#1769AA]/20 bg-white px-4 py-2.5 text-xs text-[#1769AA]">
                  <strong>רמז אימון לנציג:</strong> {hintForRep}
                </div>
              )}

              {!evaluation ? (
                <form onSubmit={handleSendTurn} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={repInput}
                    onChange={(e) => setRepInput(e.target.value)}
                    placeholder="נסח את תגובת הנציג ללקוח (מומלץ לכלול שאלת אבחון או הסבר מפרט)..."
                    className="min-h-[44px] flex-1 rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30"
                  />
                  <button
                    type="submit"
                    disabled={!repInput.trim()}
                    className="min-h-[44px] inline-flex items-center gap-1.5 rounded-xl bg-[#0f172a] px-4 text-sm font-bold text-white hover:bg-[#1769AA] disabled:opacity-40 cursor-pointer"
                  >
                    <Send className="h-4 w-4" />
                    <span>שלח</span>
                  </button>
                </form>
              ) : (
                <div className="space-y-3 rounded-2xl border border-emerald-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-emerald-600" />
                      <h3 className="text-base font-extrabold text-[#0f172a]">
                        סיכום אימון — 6 קריטריונים
                      </h3>
                    </div>
                    <span className="rounded-xl bg-emerald-50 px-3 py-1 text-sm font-extrabold text-emerald-700">
                      ציון אימון: {evaluation.overallScore}/100
                    </span>
                  </div>

                  <p className="rounded-lg bg-slate-100 px-3 py-2 text-[11px] font-semibold text-slate-600">
                    {evaluation.coachingDisclaimer}
                  </p>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {evaluation.criteria.map((c) => (
                      <div
                        key={c.key}
                        className="rounded-xl border border-slate-200 bg-[#f8fafc] p-3 text-xs"
                      >
                        <div className="flex items-center justify-between font-extrabold text-[#0f172a]">
                          <span>{c.label}</span>
                          <span className="text-[#1769AA]">{c.score}/10</span>
                        </div>
                        <p className="mt-1 text-slate-500">{c.feedback}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
