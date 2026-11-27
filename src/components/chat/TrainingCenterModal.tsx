import React, {useState} from 'react';
import {
  BookOpen,
  ExternalLink,
  FileText,
  Film,
  GraduationCap,
  HelpCircle,
  MessageSquare,
  Presentation,
  X,
} from 'lucide-react';
import {
  TRAINING_RESOURCES,
  isSafeInternalOrPublicHref,
} from '../../lib/counter/knowledgeSources';
import {TrainingCategory, TrainingResource} from '../../lib/counter/types';

const TRAINING_CATEGORIES: ('הכל' | TrainingCategory)[] = [
  'הכל',
  'שיטות מכירה',
  'SPIN Selling',
  'אבחון צורכי לקוח',
  'טיפול בהתנגדויות',
  'מכירה משלימה',
  'ידע במוצרי איטום',
  'דבקים וריצוף',
  'צבע ושליכט',
  'גבס וטיח',
  'שיקום בטון',
  'שירות לקוחות',
];

const FORMAT_LABELS: Record<TrainingResource['format'], string> = {
  video: 'וידאו',
  presentation: 'מצגת',
  document: 'מדריך / מפרט',
  practice: 'תרגול',
  qa: 'שאלות ותשובות',
  simulation: 'סימולציה',
};

function FormatIcon({format}: {format: TrainingResource['format']}) {
  if (format === 'video') return <Film className="h-4 w-4 text-[#EA580C]" />;
  if (format === 'presentation') return <Presentation className="h-4 w-4 text-[#1769AA]" />;
  if (format === 'qa') return <HelpCircle className="h-4 w-4 text-emerald-600" />;
  if (format === 'simulation') return <MessageSquare className="h-4 w-4 text-amber-600" />;
  return <FileText className="h-4 w-4 text-[#0f172a]" />;
}

interface TrainingCenterModalProps {
  open: boolean;
  onClose: () => void;
  onAskTrainingQuery: (query: string) => void;
  onStartSimulation: (hint?: string) => void;
}

export const TrainingCenterModal: React.FC<TrainingCenterModalProps> = ({
  open,
  onClose,
  onAskTrainingQuery,
  onStartSimulation,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'הכל' | TrainingCategory>('הכל');

  if (!open) return null;

  const filtered =
    selectedCategory === 'הכל'
      ? TRAINING_RESOURCES
      : TRAINING_RESOURCES.filter((r) => r.category === selectedCategory);

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-3 sm:p-5 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="מרכז הדרכה לנציגי דלפק"
    >
      <div className="flex max-h-[88dvh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-[#f8fafc] shadow-2xl">
        <header className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0f172a] text-white">
              <GraduationCap className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-[#0f172a]">
                מרכז הדרכה לנציגים — ח. סבן
              </h2>
              <p className="text-xs text-slate-500">
                מכירה ייעוצית, אבחון לקוח, מערכות מוצרים וטיפול בהתנגדויות ממקורות מאומתים
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

        <div className="flex flex-wrap gap-1.5 border-b border-slate-200 bg-white px-5 py-3 overflow-x-auto">
          {TRAINING_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`min-h-[34px] rounded-xl px-3 py-1 text-xs font-bold transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#0f172a] text-white'
                  : 'border border-slate-200 bg-[#f8fafc] text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {filtered.map((item) => {
              const isExternal = item.url.startsWith('http');
              return (
                <div
                  key={item.id}
                  className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2 text-[11px] font-bold">
                      <span className="inline-flex items-center gap-1.5 text-[#1769AA]">
                        <FormatIcon format={item.format} />
                        <span>{FORMAT_LABELS[item.format]}</span>
                      </span>
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-slate-600">
                        {item.category}
                      </span>
                    </div>
                    <h3 className="text-sm font-extrabold text-[#0f172a]">{item.title}</h3>
                    <p className="text-xs leading-relaxed text-slate-600">{item.description}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                    {item.format === 'simulation' ? (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onStartSimulation(item.recommendedQuery);
                        }}
                        className="min-h-[36px] flex-1 rounded-xl bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-700 cursor-pointer"
                      >
                        התחל סימולציה בדלפק
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onAskTrainingQuery(item.recommendedQuery);
                        }}
                        className="min-h-[36px] flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#0f172a] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#1769AA] cursor-pointer"
                      >
                        <BookOpen className="h-3.5 w-3.5" />
                        <span>הפעל תדריך בצ׳אט</span>
                      </button>
                    )}

                    {isSafeInternalOrPublicHref(item.url) && isExternal && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="min-h-[36px] inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-[#f8fafc] px-3 py-1.5 text-xs font-bold text-[#0f172a] hover:bg-slate-200"
                      >
                        <span>מקור</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
