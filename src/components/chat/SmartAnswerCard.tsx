import React, {useState} from 'react';
import {
  BookOpen,
  Check,
  ChevronDown,
  ChevronUp,
  Compass,
  ExternalLink,
  Layers,
  ListChecks,
  Plus,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import {buildDiagnosisSummaryBadges} from '../../lib/counter/diagnosis';
import {isSafeInternalOrPublicHref} from '../../lib/counter/knowledgeSources';
import {
  CounterIntent,
  InteractiveActionButton,
  InteractiveAnswerCard,
} from '../../lib/counter/types';
import {Product} from '../../types/product';

const INTENT_LABELS_HE: Record<CounterIntent, string> = {
  TECHNICAL_GUIDANCE: 'ייעוץ ויישום טכני',
  PRODUCT_COMPARISON: 'השוואת מוצרים',
  CUSTOMER_DIAGNOSIS: 'אבחון צורכי לקוח',
  CROSS_SELLING: 'מכירה משלימה ומערכת',
  SALES_TRAINING: 'אימון מכירות',
  TRAINING_MEDIA: 'מדיה והדרכה',
  KNOWLEDGE_SEARCH: 'איתור מקורות מידע',
};

interface SmartAnswerCardProps {
  card: InteractiveAnswerCard;
  plainText: string;
  catalog: Product[];
  onSelectDiagnosisAnswer: (questionLabel: string, value: string) => void;
  onRunQuery: (query: string) => void;
  onOpenSimulation: (hint?: string) => void;
  onNavigateProduct: (sku: string) => void;
  onAddToCart: (product: Product) => void;
}

export const SmartAnswerCard: React.FC<SmartAnswerCardProps> = ({
  card,
  plainText,
  catalog,
  onSelectDiagnosisAnswer,
  onRunQuery,
  onOpenSimulation,
  onNavigateProduct,
  onAddToCart,
}) => {
  const [freeDiagText, setFreeDiagText] = useState('');
  const [showSalesCoaching, setShowSalesCoaching] = useState(true);
  const [copied, setCopied] = useState(false);

  const handleAction = (act: InteractiveActionButton) => {
    if (act.kind === 'copy') {
      void navigator.clipboard?.writeText(plainText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
      return;
    }
    if (act.kind === 'simulation') {
      onOpenSimulation(card.questionTitle);
      return;
    }
    if (act.href && act.href.startsWith('/product/')) {
      const sku = decodeURIComponent(act.href.replace(/^\/product\//, '').split('?')[0]);
      if (sku) onNavigateProduct(sku);
      return;
    }
    if (act.query) {
      onRunQuery(act.query);
    }
  };

  const contextBadges =
    card.customerFit.fitNotes.length > 0
      ? card.customerFit.fitNotes
      : buildDiagnosisSummaryBadges(card.customerFit.collectedContext).map(
          (b) => `${b.label}: ${b.value}`,
        );

  const visibleActions = card.actions.filter((act) =>
    act.href
      ? isSafeInternalOrPublicHref(act.href)
      : Boolean(act.query || act.kind === 'copy' || act.kind === 'simulation'),
  );

  return (
    <div
      dir="rtl"
      className="w-full space-y-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 text-slate-900 shadow-sm"
    >
      {/* כותרת השאלה + סיווג כוונה + תגית אמינות */}
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold text-[#1769AA]">
            <span>{INTENT_LABELS_HE[card.intent.primaryIntent]}</span>
            <span className="text-slate-300">·</span>
            <span className="text-slate-500">
              {card.intent.classificationMethod === 'model+rules'
                ? 'סיווג AI + כללים'
                : 'סיווג כללים מאומת'}
            </span>
          </div>
          <h3 className="mt-1 text-base font-extrabold leading-snug text-[#0f172a] sm:text-lg">
            {card.questionTitle}
          </h3>
        </div>
        <span
          className={`shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-extrabold ${
            card.missingSourceNotice || card.sources.length === 0
              ? 'bg-orange-100 text-[#EA580C]'
              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          }`}
        >
          {card.missingSourceNotice || card.sources.length === 0
            ? 'דורש יועץ טכני'
            : `מעוגן ב-${card.sources.length} מקורות`}
        </span>
      </div>

      {/* אזהרת היעדר מקור מאומת */}
      {card.missingSourceNotice && (
        <div className="rounded-xl border border-orange-300 bg-orange-50 p-3.5 text-sm font-semibold text-orange-950 flex items-start gap-2.5">
          <ShieldAlert className="h-5 w-5 shrink-0 text-[#EA580C] mt-0.5" />
          <div>{card.missingSourceNotice}</div>
        </div>
      )}

      {/* תשובה קצרה */}
      <section className="space-y-2">
        <div className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
          {card.sources.length > 0 ? 'תשובה קצרה (מעוגנת במקור)' : 'מדיניות אמינות'}
        </div>
        <p className="text-sm leading-7 text-slate-800">{card.shortAnswer}</p>
        {card.modelRecommendation && (
          <div className="rounded-xl border border-[#1769AA]/20 bg-[#F3F7FB] p-3 text-xs leading-relaxed text-[#0f172a]">
            <div className="mb-1 flex items-center gap-1.5 font-bold text-[#1769AA]">
              <Sparkles className="h-3.5 w-3.5" />
              <span>סינתזה מעשית לדלפק (מבוססת על המקורות המאושרים):</span>
            </div>
            <p>{card.modelRecommendation}</p>
          </div>
        )}
      </section>

      {/* שלבי ביצוע */}
      {card.executionSteps.length > 0 && (
        <section className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
          <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#0f172a]">
            <ListChecks className="h-4 w-4 text-[#1769AA]" />
            <span>שלבי ביצוע לפי המקור</span>
          </div>
          <ol className="space-y-1.5 pr-4 text-xs sm:text-sm leading-relaxed text-slate-800 list-decimal">
            {card.executionSteps.map((step, idx) => (
              <li key={idx}>{step}</li>
            ))}
          </ol>
        </section>
      )}

      {/* נתונים טכניים מאומתים */}
      {card.technicalFacts.length > 0 && (
        <section className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#0f172a]">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>נתונים טכניים מאומתים</span>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {card.technicalFacts.map((fact, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-slate-200 bg-white p-2.5 text-xs"
              >
                <div className="font-semibold text-slate-500">{fact.label}</div>
                <div className="mt-0.5 font-bold text-[#0f172a]">{fact.value}</div>
                <div className="mt-1 text-[10px] text-slate-400 truncate">
                  מקור: {fact.sourceTitle}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* אבחון לקוח (שאלה אחת בכל פעם) + הדרכת שיחה */}
      <section className="space-y-3 rounded-xl border border-amber-200 bg-amber-50/50 p-3.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#0f172a]">
            <Compass className="h-4 w-4 text-amber-600" />
            <span>התאמה ללקוח והדרכת שיחה</span>
          </div>
          {card.customerFit.salesAdvice && (
            <button
              type="button"
              onClick={() => setShowSalesCoaching((v) => !v)}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1769AA] hover:underline cursor-pointer"
            >
              <span>{card.customerFit.salesAdvice.frameworkName}</span>
              {showSalesCoaching ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </button>
          )}
        </div>

        {contextBadges.length > 0 && (
          <div className="flex flex-wrap gap-2 text-[11px] font-semibold text-slate-600">
            {contextBadges.map((note, idx) => (
              <span key={idx} className="rounded-md bg-white px-2 py-0.5 border border-slate-200">
                {note}
              </span>
            ))}
          </div>
        )}

        {card.customerFit.nextQuestion && (
          <div className="space-y-2 rounded-xl border border-amber-200 bg-white p-3">
            <div className="text-xs font-extrabold text-[#0f172a]">
              שאלת האבחון הבאה (שאלה אחת בכל פעם):
            </div>
            <p className="text-sm font-bold text-[#1769AA]">
              {card.customerFit.nextQuestion.question}
            </p>
            <p className="text-[11px] text-slate-500">
              למה לשאול: {card.customerFit.nextQuestion.whyAsk}
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {card.customerFit.nextQuestion.options.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() =>
                    onSelectDiagnosisAnswer(card.customerFit.nextQuestion!.question, opt)
                  }
                  className="min-h-[36px] rounded-lg border border-[#1769AA]/25 bg-[#F3F7FB] px-3 py-1.5 text-xs font-bold text-[#0f172a] hover:bg-[#1769AA] hover:text-white transition-colors cursor-pointer"
                >
                  {opt}
                </button>
              ))}
            </div>
            {card.customerFit.nextQuestion.allowFreeText && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const val = freeDiagText.trim();
                  if (!val) return;
                  onSelectDiagnosisAnswer(card.customerFit.nextQuestion!.question, val);
                  setFreeDiagText('');
                }}
                className="flex items-center gap-2 pt-1"
              >
                <input
                  type="text"
                  value={freeDiagText}
                  onChange={(e) => setFreeDiagText(e.target.value)}
                  placeholder="או הקלד תשובת לקוח חופשית..."
                  className="min-h-[36px] flex-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1769AA]/30"
                />
                <button
                  type="submit"
                  className="min-h-[36px] rounded-lg bg-[#0f172a] px-3 text-xs font-bold text-white hover:bg-[#1769AA] cursor-pointer"
                >
                  עדכן
                </button>
              </form>
            )}
          </div>
        )}

        {showSalesCoaching && card.customerFit.salesAdvice && (
          <div className="space-y-1.5 text-xs text-slate-800">
            <div className="font-bold text-[#0f172a]">
              {card.customerFit.salesAdvice.focusLabel}
            </div>
            <p className="text-slate-600">{card.customerFit.salesAdvice.teachPoint}</p>
            <ul className="space-y-1 pr-4 list-disc text-[#0f172a]">
              {card.customerFit.salesAdvice.questionsToAsk.map((q, idx) => (
                <li key={idx}>{q}</li>
              ))}
            </ul>
            <div className="text-[11px] font-semibold text-amber-700">
              הצעד הבא בדלפק: {card.customerFit.salesAdvice.nextStepCue}
            </div>
          </div>
        )}
      </section>

      {/* מוצרים משלימים מבוססי מפרט + חיבור ישיר להזמנה */}
      {card.crossSelling.length > 0 && (
        <section className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#0f172a]">
            <Layers className="h-4 w-4 text-[#1769AA]" />
            <span>מוצרים משלימים מוצדקים ({card.crossSelling[0]?.category})</span>
          </div>
          <div className="space-y-2">
            {card.crossSelling.map((cs, idx) => {
              const matchedCatalogItem = cs.sku
                ? catalog.find((p) => p.sku === cs.sku)
                : undefined;
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs space-y-1.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-extrabold text-[#0f172a]">
                      {cs.productName}
                      {cs.sku ? ` · מק״ט ${cs.sku}` : ''}
                    </span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-extrabold ${
                          cs.priority === 'חובה'
                            ? 'bg-orange-100 text-[#EA580C]'
                            : cs.priority === 'מומלץ'
                              ? 'bg-blue-100 text-[#1769AA]'
                              : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {cs.priority}
                      </span>
                      {matchedCatalogItem && (
                        <button
                          type="button"
                          onClick={() => onAddToCart(matchedCatalogItem)}
                          className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-1 text-[11px] font-bold text-white hover:bg-emerald-700 cursor-pointer"
                        >
                          <Plus className="h-3 w-3" />
                          <span>הוסף לרשימה</span>
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-slate-800">
                    <strong className="text-[#0f172a]">מדוע רלוונטי:</strong> {cs.relevance}
                  </p>
                  <p className="text-slate-600">
                    <strong className="text-[#0f172a]">תנאי דרישה:</strong> {cs.conditions}
                  </p>
                  <p className="rounded-lg bg-white border border-slate-200 p-2 text-[#0f172a]">
                    <strong>איך להסביר ללקוח:</strong> {cs.clientExplanation}
                  </p>
                  <div className="text-[11px] text-slate-500">מקור: {cs.sourceTitle}</div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* מקורות מידע מאומתים */}
      {card.sources.length > 0 && (
        <section className="space-y-2 border-t border-slate-100 pt-3">
          <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#0f172a]">
            <BookOpen className="h-4 w-4 text-[#1769AA]" />
            <span>מקורות מידע מאומתים</span>
          </div>
          <div className="space-y-1.5">
            {card.sources.map((src) => {
              const isProductLink = src.url.startsWith('/product/');
              return (
                <div
                  key={src.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[#F3F7FB] px-3 py-2 text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-[#0f172a] truncate">{src.title}</div>
                    <div className="text-[11px] text-slate-500">
                      {src.manufacturer} · {src.pageOrSection}
                    </div>
                  </div>
                  {isProductLink ? (
                    <button
                      type="button"
                      onClick={() =>
                        onNavigateProduct(decodeURIComponent(src.url.replace(/^\/product\//, '')))
                      }
                      className="inline-flex items-center gap-1 font-bold text-[#1769AA] hover:underline shrink-0 cursor-pointer"
                    >
                      <span>לכרטיס מוצר</span>
                    </button>
                  ) : isSafeInternalOrPublicHref(src.url) ? (
                    <a
                      href={src.url}
                      target={src.url.startsWith('/') ? undefined : '_blank'}
                      rel={src.url.startsWith('/') ? undefined : 'noopener noreferrer'}
                      className="inline-flex items-center gap-1 font-bold text-[#1769AA] hover:underline shrink-0"
                    >
                      <span>למקור</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* כפתורי פעולה דינמיים */}
      {visibleActions.length > 0 && (
        <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3">
          {visibleActions.map((act) => {
            if (act.href && !act.href.startsWith('/product/') && isSafeInternalOrPublicHref(act.href)) {
              const isExternal = !act.href.startsWith('/');
              return (
                <a
                  key={act.id}
                  href={act.href}
                  target={isExternal ? '_blank' : undefined}
                  rel={isExternal ? 'noopener noreferrer' : undefined}
                  className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border border-slate-200 bg-[#F3F7FB] px-3 py-1.5 text-xs font-bold text-[#0f172a] hover:bg-[#1769AA] hover:text-white transition-colors"
                >
                  <span>{act.label}</span>
                  {isExternal && <ExternalLink className="h-3 w-3" />}
                </a>
              );
            }
            return (
              <button
                key={act.id}
                type="button"
                onClick={() => handleAction(act)}
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border border-slate-200 bg-[#F3F7FB] px-3 py-1.5 text-xs font-bold text-[#0f172a] hover:bg-[#0f172a] hover:text-white transition-colors cursor-pointer"
              >
                {act.kind === 'copy' && copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span>הועתק</span>
                  </>
                ) : (
                  <span>{act.label}</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
