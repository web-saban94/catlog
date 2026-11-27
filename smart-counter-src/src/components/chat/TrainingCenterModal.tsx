/**
 * Stage 8 — מרכז הדרכה לנציגים מתוך הצ'אט
 * כל פריט מחובר למקור אמיתי באינדקס הידע של ח. סבן
 */

import { useState } from "react";
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
} from "lucide-react";
import type { TrainingCategory, TrainingResource } from "@/lib/noa-counter/types";

const TRAINING_CATEGORIES: ("הכל" | TrainingCategory)[] = [
  "הכל",
  "שיטות מכירה",
  "SPIN Selling",
  "אבחון צורכי לקוח",
  "טיפול בהתנגדויות",
  "מכירה משלימה",
  "ידע במוצרי איטום",
  "דבקים וריצוף",
  "צבע ושליכט",
  "גבס וטיח",
  "שיקום בטון",
  "שירות לקוחות",
];

const FORMAT_LABELS: Record<TrainingResource["format"], string> = {
  video: "סרטון",
  presentation: "מצגת",
  document: "מסמך טכני",
  practice: "תרגול",
  qa: "שאלות ידע",
  simulation: "סימולציה",
};

function FormatIcon({ format }: { format: TrainingResource["format"] }) {
  switch (format) {
    case "video":
      return <Film className="h-4 w-4 text-[#EA580C]" />;
    case "presentation":
      return <Presentation className="h-4 w-4 text-[#1769AA]" />;
    case "simulation":
      return <MessageSquare className="h-4 w-4 text-emerald-600" />;
    case "qa":
      return <HelpCircle className="h-4 w-4 text-[#1769AA]" />;
    case "practice":
      return <GraduationCap className="h-4 w-4 text-[#EA580C]" />;
    default:
      return <FileText className="h-4 w-4 text-[#102A43]" />;
  }
}

function isSafeHref(url?: string): boolean {
  if (!url) return false;
  if (url.startsWith("/")) return true;
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

export function TrainingCenterModal({
  open,
  onClose,
  resources,
  onAskTrainingQuery,
  onStartSimulation,
}: {
  open: boolean;
  onClose: () => void;
  resources: TrainingResource[];
  onAskTrainingQuery: (query: string) => void;
  onStartSimulation: (hint?: string) => void;
}) {
  const [selectedCategory, setSelectedCategory] = useState<"הכל" | TrainingCategory>("הכל");

  if (!open) return null;

  const filtered =
    selectedCategory === "הכל"
      ? resources
      : resources.filter((r) => r.category === selectedCategory);

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#102A43]/60 backdrop-blur-sm p-3 sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="מרכז הדרכה לנציגי דלפק"
    >
      <div
        className="w-full max-w-4xl max-h-[88vh] rounded-3xl border border-[#102A43]/15 bg-[#F3F7FB] shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-[#102A43]/10 bg-white px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#102A43] text-white">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-[#102A43]">
                מרכז הדרכה לנציגי דלפק — ח. סבן
              </h2>
              <p className="text-xs text-[#5A6A7A]">
                כל פריט נפתח מתוך מקור מאומת באינדקס הידע או מוביל לתרגול מעשי בצ׳אט
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] min-w-[40px] rounded-xl flex items-center justify-center text-[#5A6A7A] hover:bg-[#F3F7FB] cursor-pointer"
            aria-label="סגור מרכז הדרכה"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* סינון קטגוריות */}
        <div className="border-b border-[#102A43]/10 bg-white px-5 py-3 flex items-center gap-2 overflow-x-auto">
          {TRAINING_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? "bg-[#102A43] text-white"
                  : "bg-[#F3F7FB] text-[#102A43] hover:bg-[#1769AA]/10"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* רשימת מקורות ותרגולים */}
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((item) => {
            const isExternal = item.url.startsWith("http");
            return (
              <article
                key={item.id}
                className="rounded-2xl border border-[#102A43]/10 bg-white p-4 shadow-sm flex flex-col justify-between gap-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2 text-[11px] font-bold">
                    <span className="inline-flex items-center gap-1.5 text-[#1769AA]">
                      <FormatIcon format={item.format} />
                      <span>{FORMAT_LABELS[item.format]}</span>
                    </span>
                    <span className="text-[#5A6A7A]">{item.category}</span>
                  </div>
                  <h3 className="text-sm font-extrabold text-[#102A43] leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[#5A6A7A] leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#102A43]/10">
                  {item.format === "simulation" ? (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onStartSimulation(item.recommendedQuery);
                      }}
                      className="min-h-[36px] flex-1 rounded-xl bg-[#EA580C] hover:bg-orange-700 px-3 py-1.5 text-xs font-bold text-white cursor-pointer"
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
                      className="min-h-[36px] flex-1 rounded-xl bg-[#1769AA] hover:bg-[#102A43] px-3 py-1.5 text-xs font-bold text-white cursor-pointer"
                    >
                      שאל והדגם בצ׳אט
                    </button>
                  )}

                  {isSafeHref(item.url) ? (
                    <a
                      href={item.url}
                      target={isExternal ? "_blank" : undefined}
                      rel={isExternal ? "noopener noreferrer" : undefined}
                      className="min-h-[36px] inline-flex items-center gap-1 rounded-xl border border-[#102A43]/15 bg-[#F3F7FB] px-3 py-1.5 text-xs font-bold text-[#102A43] hover:bg-slate-200"
                    >
                      <span>מקור</span>
                      {isExternal ? <ExternalLink className="h-3 w-3" /> : null}
                    </a>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
