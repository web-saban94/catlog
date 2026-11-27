import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  Bot,
  GraduationCap,
  Loader2,
  RotateCcw,
  Send,
  Sparkles,
  Trash2,
  UserCheck,
} from 'lucide-react';
import {buildDiagnosisSummaryBadges} from '../../lib/counter/diagnosis';
import {searchKnowledgeWithCatalog} from '../../lib/counter/knowledgeSources';
import {generateCounterAnswerCard} from '../../lib/counter/responseGenerator';
import {DiagnosisState, InteractiveAnswerCard} from '../../lib/counter/types';
import {Product} from '../../types/product';
import {SimulationPanel} from './SimulationPanel';
import {SmartAnswerCard} from './SmartAnswerCard';
import {TrainingCenterModal} from './TrainingCenterModal';

interface ChatMessageItem {
  id: string;
  sender: 'user' | 'noa';
  text: string;
  time: string;
  card?: InteractiveAnswerCard;
}

const HISTORY_STORAGE_KEY = 'saban_noa_counter_chat_v1';

const STARTER_QUERIES = [
  'איך מיישמים SikaTop Seal 107?',
  'מהם ההבדלים בין סוגי השליכט?',
  'איזה דבק מתאים להדבקת פורצלן על ריצוף קיים?',
  'לקוח מבקש צבע – אילו שאלות אבחון לשאול?',
  'אילו מוצרים משלימים מתאימים למערכת איטום?',
  'מצא סרטון הדרכה על איטום גגות.',
  'בצע סימולציה עם לקוח שמתנגד למחיר.',
];

interface CounterChatViewProps {
  catalog: Product[];
  onNavigateProduct: (sku: string) => void;
  onAddToCart: (product: Product) => void;
}

function createInitialMessages(): ChatMessageItem[] {
  return [
    {
      id: 'm0',
      sender: 'noa',
      time: new Date().toLocaleTimeString('he-IL', {hour: '2-digit', minute: '2-digit'}),
      text:
        'שלום! אני נועה — יועצת הדלפק והידע הטכני של ח. סבן חומרי בניין.\n' +
        'אפשר לשאול על הוראות יישום, השוואות מוצרים, שאלות אבחון ללקוח (שאלה אחת בכל פעם), מוצרים משלימים, או לפתוח הדרכה וסימולציית מכירה. כל תשובה מעוגנת במאגר המאושר ובמילון הלוגיסטי החי.',
    },
  ];
}

export const CounterChatView: React.FC<CounterChatViewProps> = ({
  catalog,
  onNavigateProduct,
  onAddToCart,
}) => {
  const [messages, setMessages] = useState<ChatMessageItem[]>(() => {
    try {
      const saved = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as ChatMessageItem[];
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Ignore corrupted localStorage
    }
    return createInitialMessages();
  });

  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [diagnosisState, setDiagnosisState] = useState<DiagnosisState | undefined>(undefined);
  const [trainingOpen, setTrainingOpen] = useState(false);
  const [simulationOpen, setSimulationOpen] = useState(false);
  const [simulationHint, setSimulationHint] = useState<string | undefined>(undefined);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({behavior: 'smooth', block: 'end'});
  }, [messages.length, isThinking]);

  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(messages.slice(-24)));
    } catch {
      // Ignore quota exceeded
    }
  }, [messages]);

  const nowTime = () =>
    new Date().toLocaleTimeString('he-IL', {hour: '2-digit', minute: '2-digit'});

  const handleSend = useCallback(
    async (textOverride?: string) => {
      const query = (textOverride ?? input).trim();
      if (!query || isThinking) return;

      if (/^(?:בצע|התחל|פתח)\s+סימולצי/i.test(query)) {
        setMessages((prev) => [
          ...prev,
          {id: `u-${Date.now()}`, sender: 'user', text: query, time: nowTime()},
          {
            id: `n-${Date.now() + 1}`,
            sender: 'noa',
            text: 'פתחתי עבורך את סימולציית השיחה בדלפק. בסיום תקבל ניקוד ומשוב הדרכתי ב-6 קריטריונים.',
            time: nowTime(),
          },
        ]);
        if (!textOverride) setInput('');
        setSimulationHint(query);
        setSimulationOpen(true);
        return;
      }

      setMessages((prev) => [
        ...prev,
        {id: `u-${Date.now()}`, sender: 'user', text: query, time: nowTime()},
      ]);
      if (!textOverride) setInput('');
      setIsThinking(true);

      try {
        const lastCounterSources = [...messages]
          .reverse()
          .find((m) => m.card && m.card.sources.length > 0)?.card?.sources;

        const searchPreview = searchKnowledgeWithCatalog(query, catalog, {limit: 4});
        let modelSynthesis: string | null = null;

        if (searchPreview.documents.length > 0) {
          const groundingText = searchPreview.documents
            .map(
              (d) =>
                `[מקור: ${d.title} | יצרן: ${d.manufacturer}]\nתקציר: ${d.factSummary}\nנתונים: ${d.technicalData
                  .map((x) => `${x.label}: ${x.value}`)
                  .join('; ')}`,
            )
            .join('\n\n');

          const diagSummary = diagnosisState
            ? buildDiagnosisSummaryBadges(diagnosisState)
                .map((b) => `${b.label}: ${b.value}`)
                .join(' | ')
            : '';

          try {
            const resp = await fetch('/api/noa-counter', {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({
                query,
                diagnosisSummary: diagSummary,
                groundingText,
              }),
            });
            if (resp.ok) {
              const json = (await resp.json()) as {recommendation?: string | null};
              if (json.recommendation) {
                modelSynthesis = json.recommendation;
              }
            }
          } catch {
            // Keep deterministic verified-source card if optional /api synthesis is offline
          }
        }

        const {card, nextDiagnosisState, plainSummaryText} = generateCounterAnswerCard({
          query,
          diagnosisState,
          previousSources: lastCounterSources,
          catalogProducts: catalog,
          modelRecommendation: modelSynthesis,
        });

        setDiagnosisState(nextDiagnosisState);
        setMessages((prev) => [
          ...prev,
          {
            id: `n-${Date.now() + 1}`,
            sender: 'noa',
            text: plainSummaryText,
            time: nowTime(),
            card,
          },
        ]);
      } finally {
        setIsThinking(false);
      }
    },
    [input, isThinking, messages, catalog, diagnosisState],
  );

  const handleResetChat = () => {
    setMessages(createInitialMessages());
    setDiagnosisState(undefined);
    try {
      localStorage.removeItem(HISTORY_STORAGE_KEY);
    } catch {
      // Ignore
    }
  };

  return (
    <div dir="rtl" className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4">
      {/* כותרת ופעולות דלפק עליונות */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0f172a] text-[#f59e0b]">
            <Bot className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-base sm:text-lg font-extrabold text-[#0f172a]">
              יועצת הדלפק Noa AI · ידע טכני ואבחון לקוח
            </h1>
            <p className="text-xs text-slate-500">
              מחובר בזמן אמת לקטלוג מילון_לוגיסט ({catalog.length} פריטים) ולמאגר המפרטים המאושר
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setTrainingOpen(true)}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-slate-200 bg-[#F3F7FB] px-3 py-1.5 text-xs font-bold text-[#0f172a] hover:bg-[#1769AA] hover:text-white transition-colors cursor-pointer"
          >
            <GraduationCap className="h-4 w-4" />
            <span>מרכז הדרכה</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSimulationHint(undefined);
              setSimulationOpen(true);
            }}
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-extrabold text-amber-800 hover:bg-amber-600 hover:text-white transition-colors cursor-pointer"
          >
            <UserCheck className="h-4 w-4" />
            <span>סימולציית דלפק</span>
          </button>

          {diagnosisState && Object.keys(diagnosisState).length > 1 && (
            <button
              type="button"
              onClick={() => setDiagnosisState(undefined)}
              className="inline-flex min-h-[38px] items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:text-[#0f172a] cursor-pointer"
              title="אפס הקשר אבחון לקוח"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>אפס אבחון</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleResetChat}
            className="inline-flex min-h-[38px] items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:text-red-600 cursor-pointer"
            title="נקה שיחה"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">שיחה חדשה</span>
          </button>
        </div>
      </section>

      {/* פס שאלות מהירות לדלפק */}
      <section className="flex flex-wrap gap-1.5">
        {STARTER_QUERIES.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => void handleSend(q)}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-[#0f172a] hover:border-[#1769AA] hover:text-[#1769AA] transition-colors cursor-pointer"
          >
            <Sparkles className="h-3 w-3 text-amber-500" />
            <span>{q}</span>
          </button>
        ))}
      </section>

      {/* אזור השיחה */}
      <section className="space-y-4 min-h-[360px] pb-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.sender === 'user' ? 'items-start' : 'items-stretch'}`}
          >
            <span className="mb-1 text-[11px] font-bold text-slate-500 px-1">
              {m.sender === 'user' ? 'נציג דלפק' : 'נועה AI · ייעוץ ומפרטים'} · {m.time}
            </span>
            {m.card ? (
              <SmartAnswerCard
                card={m.card}
                plainText={m.text}
                catalog={catalog}
                onSelectDiagnosisAnswer={(qLabel, val) =>
                  void handleSend(`${val} (תשובה לשאלה: ${qLabel})`)
                }
                onRunQuery={(q) => void handleSend(q)}
                onOpenSimulation={(hint) => {
                  setSimulationHint(hint);
                  setSimulationOpen(true);
                }}
                onNavigateProduct={onNavigateProduct}
                onAddToCart={onAddToCart}
              />
            ) : (
              <div
                className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line ${
                  m.sender === 'user'
                    ? 'max-w-[85%] bg-[#0f172a] text-white font-medium'
                    : 'border border-slate-200 bg-white text-slate-800 shadow-xs'
                }`}
              >
                {m.text}
              </div>
            )}
          </div>
        ))}

        {isThinking && (
          <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-[#1769AA] shadow-xs">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>מאמת מקורות ובונה תשובת דלפק...</span>
          </div>
        )}
        <div ref={endRef} />
      </section>

      {/* תיבת שליחה תחתונה דביקה */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void handleSend();
        }}
        className="sticky bottom-3 z-20 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="שאל את נועה על מוצר, הוראות יישום, אבחון לקוח או מוצרים משלימים..."
          className="min-h-[44px] flex-1 rounded-xl bg-slate-50 px-3.5 text-sm text-[#0f172a] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30"
        />
        <button
          type="submit"
          disabled={!input.trim() || isThinking}
          className="min-h-[44px] inline-flex items-center gap-1.5 rounded-xl bg-[#059669] px-4 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-45 cursor-pointer"
        >
          <Send className="h-4 w-4" />
          <span className="hidden sm:inline">שלח</span>
        </button>
      </form>

      <TrainingCenterModal
        open={trainingOpen}
        onClose={() => setTrainingOpen(false)}
        onAskTrainingQuery={(q) => void handleSend(q)}
        onStartSimulation={(hint) => {
          setSimulationHint(hint);
          setSimulationOpen(true);
        }}
      />

      <SimulationPanel
        open={simulationOpen}
        onClose={() => setSimulationOpen(false)}
        initialHint={simulationHint}
      />
    </div>
  );
};
