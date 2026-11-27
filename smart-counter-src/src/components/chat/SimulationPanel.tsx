/**
 * Stage 9 — מצב תרגול נציג (Roleplay Simulation Mode)
 * נועה משחקת את הלקוח ובסיום נותנת משוב הדרכתי ב-6 קריטריונים.
 */

import { useEffect, useState } from "react";
import { Award, CheckCircle2, Play, RotateCcw, Send, UserCheck, X } from "lucide-react";
import {
  SIMULATION_SCENARIOS,
  detectSimulationScenario,
  type SimulationScenarioDef,
} from "@/lib/noa-counter/simulation-engine";
import type {
  SimulationEvaluation,
  SimulationScenarioId,
  SimulationTurn,
} from "@/lib/noa-counter/types";
import { runNoaSimulationFn } from "@/lib/ai.functions";

export function SimulationPanel({
  open,
  onClose,
  initialHint,
}: {
  open: boolean;
  onClose: () => void;
  initialHint?: string;
}) {
  useEffect(() => {
    if (open && initialHint) {
      setSelectedScenario(detectSimulationScenario(initialHint));
    }
  }, [open, initialHint]);

  const [selectedScenario, setSelectedScenario] = useState<SimulationScenarioDef>(() => {
    if (initialHint) {
      const hit = SIMULATION_SCENARIOS.find((s) =>
        initialHint.includes("מחיר") ? s.id === "competitor_price" : false,
      );
      if (hit) return hit;
    }
    return SIMULATION_SCENARIOS[0]!;
  });
  const [turns, setTurns] = useState<SimulationTurn[]>([]);
  const [repInput, setRepInput] = useState("");
  const [hint, setHint] = useState("");
  const [evaluation, setEvaluation] = useState<SimulationEvaluation | null>(null);
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const nowStr = () =>
    new Date().toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });

  const startScenario = async (scenario: SimulationScenarioDef) => {
    setSelectedScenario(scenario);
    setEvaluation(null);
    setBusy(true);
    try {
      const res = await runNoaSimulationFn({
        data: { action: "start", scenarioId: scenario.id },
      });
      setTurns([{ role: "customer", text: res.customerMessage, time: nowStr() }]);
      setHint(res.hintForRep);
    } finally {
      setBusy(false);
    }
  };

  const sendRepReply = async () => {
    const text = repInput.trim();
    if (!text || busy) return;
    const nextTurns: SimulationTurn[] = [
      ...turns,
      { role: "rep", text, time: nowStr() },
    ];
    setTurns(nextTurns);
    setRepInput("");
    setBusy(true);
    try {
      const res = await runNoaSimulationFn({
        data: {
          action: "turn",
          scenarioId: selectedScenario.id as SimulationScenarioId,
          repMessage: text,
          turns: nextTurns,
        },
      });
      setTurns((prev) => [
        ...prev,
        { role: "customer", text: res.customerMessage, time: nowStr() },
      ]);
      setHint(res.hintForRep);
    } finally {
      setBusy(false);
    }
  };

  const finishAndEvaluate = async () => {
    if (busy || turns.filter((t) => t.role === "rep").length === 0) return;
    setBusy(true);
    try {
      const res = await runNoaSimulationFn({
        data: {
          action: "evaluate",
          scenarioId: selectedScenario.id,
          turns,
        },
      });
      if (res.evaluation) setEvaluation(res.evaluation);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#102A43]/60 backdrop-blur-sm p-3 sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="מצב תרגול נציג — סימולציית שיחת מכירה"
    >
      <div
        className="w-full max-w-3xl max-h-[90vh] rounded-3xl border border-[#102A43]/15 bg-[#F3F7FB] shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-[#102A43]/10 bg-white px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EA580C] text-white">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-[#102A43]">
                סימולציית שיחת דלפק — נועה בתפקיד הלקוח
              </h2>
              <p className="text-xs text-[#5A6A7A]">
                תרגול אבחון, התנגדויות ומכירה ייעוצית · כלי הדרכתי בלבד
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] min-w-[40px] rounded-xl flex items-center justify-center text-[#5A6A7A] hover:bg-[#F3F7FB] cursor-pointer"
            aria-label="סגור סימולציה"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* בחירת תרחיש */}
        <div className="border-b border-[#102A43]/10 bg-white px-5 py-3 flex items-center gap-2 overflow-x-auto">
          {SIMULATION_SCENARIOS.map((sc) => (
            <button
              key={sc.id}
              type="button"
              onClick={() => void startScenario(sc)}
              className={`min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                selectedScenario.id === sc.id && turns.length > 0
                  ? "bg-[#102A43] text-white"
                  : "bg-[#F3F7FB] text-[#102A43] hover:bg-[#1769AA]/15"
              }`}
            >
              {sc.title}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {turns.length === 0 ? (
            <div className="rounded-2xl border border-[#102A43]/10 bg-white p-6 text-center space-y-3">
              <h3 className="text-base font-extrabold text-[#102A43]">
                {selectedScenario.title}
              </h3>
              <p className="text-sm text-[#5A6A7A]">{selectedScenario.description}</p>
              <button
                type="button"
                onClick={() => void startScenario(selectedScenario)}
                disabled={busy}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#EA580C] hover:bg-orange-700 px-5 py-2.5 text-sm font-bold text-white cursor-pointer"
              >
                <Play className="h-4 w-4" />
                <span>התחל תרגול שיחה</span>
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {turns.map((t, i) => (
                  <div
                    key={i}
                    className={`flex ${t.role === "rep" ? "justify-start" : "justify-end"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        t.role === "rep"
                          ? "bg-[#1769AA] text-white"
                          : "border border-[#102A43]/15 bg-white text-[#102A43]"
                      }`}
                    >
                      <div className="mb-1 text-[10px] font-bold opacity-80">
                        {t.role === "rep" ? "אתה (נציג הדלפק)" : "נועה (בתפקיד הלקוח)"} · {t.time}
                      </div>
                      <div>{t.text}</div>
                    </div>
                  </div>
                ))}
              </div>

              {hint && !evaluation ? (
                <div className="rounded-xl border border-orange-200 bg-orange-50 px-3.5 py-2.5 text-xs text-orange-950">
                  <strong>טיפ מאמן לדלפק:</strong> {hint}
                </div>
              ) : null}

              {evaluation ? (
                <div className="rounded-2xl border border-emerald-200 bg-white p-4 space-y-4">
                  <div className="flex items-center justify-between gap-3 border-b border-[#102A43]/10 pb-3">
                    <div className="flex items-center gap-2">
                      <Award className="h-6 w-6 text-[#EA580C]" />
                      <div>
                        <h3 className="text-base font-extrabold text-[#102A43]">
                          משוב אימון מסכם
                        </h3>
                        <p className="text-[11px] text-[#5A6A7A]">
                          {evaluation.coachingDisclaimer}
                        </p>
                      </div>
                    </div>
                    <div className="rounded-xl bg-[#102A43] px-3 py-1.5 text-sm font-extrabold text-white">
                      {evaluation.overallScore} / 100
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {evaluation.criteria.map((c) => (
                      <div
                        key={c.key}
                        className="rounded-xl border border-[#102A43]/10 bg-[#F8FAFC] p-3 text-xs"
                      >
                        <div className="flex items-center justify-between font-extrabold text-[#102A43]">
                          <span>{c.label}</span>
                          <span className="text-[#1769AA]">{c.score}/10</span>
                        </div>
                        <p className="mt-1 text-[#5A6A7A]">{c.feedback}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => void startScenario(selectedScenario)}
                      className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-[#102A43] px-4 py-2 text-xs font-bold text-white cursor-pointer"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>תרגל תרחיש מחדש</span>
                    </button>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>

        {/* שורת הקלדה בסימולציה */}
        {turns.length > 0 && !evaluation ? (
          <div className="border-t border-[#102A43]/10 bg-white p-4 space-y-2">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void sendRepReply();
              }}
              className="flex items-end gap-2"
            >
              <textarea
                value={repInput}
                onChange={(e) => setRepInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void sendRepReply();
                  }
                }}
                rows={2}
                placeholder="השב ללקוח כנציג דלפק (Enter לשליחה)..."
                className="min-h-[44px] flex-1 resize-none rounded-xl border border-[#102A43]/15 bg-[#F8FAFC] px-3 py-2 text-sm text-[#102A43] focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30"
              />
              <button
                type="submit"
                disabled={busy || !repInput.trim()}
                className="min-h-[44px] min-w-[44px] rounded-xl bg-[#1769AA] hover:bg-[#102A43] text-white flex items-center justify-center disabled:opacity-40 cursor-pointer"
                aria-label="שלח תגובה"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#5A6A7A]">מומלץ להשלים 2–3 חילופי דברים ואז לקבל משוב.</span>
              <button
                type="button"
                onClick={() => void finishAndEvaluate()}
                disabled={busy || turns.filter((t) => t.role === "rep").length === 0}
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border border-emerald-600/30 bg-emerald-50 px-3 py-1.5 font-bold text-emerald-800 hover:bg-emerald-100 disabled:opacity-40 cursor-pointer"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>סיים סימולציה וקבל משוב</span>
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
