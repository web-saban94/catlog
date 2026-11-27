import React from 'react';
import {ChevronUp, ClipboardList} from 'lucide-react';

interface FloatingOrderBarProps {
  itemCount: number;
  unitCount: number;
  onOpen: () => void;
}

export const FloatingOrderBar: React.FC<FloatingOrderBarProps> = ({
  itemCount,
  unitCount,
  onOpen,
}) => {
  if (itemCount === 0) return null;

  return (
    <div className="fixed bottom-3 inset-x-3 sm:inset-x-auto sm:left-6 sm:w-[360px] z-40">
      <button
        type="button"
        onClick={onOpen}
        className="w-full h-14 px-4 rounded-2xl bg-[#0f172a] hover:bg-slate-800 text-white shadow-xl border border-slate-700 flex items-center justify-between gap-3 transition-transform active:scale-[0.99] cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-[#059669] text-white shrink-0">
            <ClipboardList className="w-5 h-5" />
          </span>
          <div className="text-right">
            <div className="text-sm font-bold leading-tight">
              רשימת הזמנה ({itemCount} פריטים)
            </div>
            <div className="text-[11px] text-slate-300 tabular-nums">
              סה״כ {unitCount} יחידות לשליחה בוואטסאפ
            </div>
          </div>
        </div>

        <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-400 whitespace-nowrap shrink-0">
          <span>פתח</span>
          <ChevronUp className="w-4 h-4" />
        </span>
      </button>
    </div>
  );
};
