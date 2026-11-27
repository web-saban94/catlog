import React from 'react';
import {Bot, ClipboardList, LayoutGrid, QrCode} from 'lucide-react';
import {PWAInstallButton} from './PWAInstallButton';

export type AppMode = 'catalog' | 'qr' | 'chat';

interface HeaderProps {
  mode: AppMode;
  onNavigateMode: (mode: AppMode) => void;
  cartCount: number;
  onOpenDrawer: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  mode,
  onNavigateMode,
  cartCount,
  onOpenDrawer,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#0f172a] text-white border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 h-14 flex items-center justify-between gap-2 sm:gap-6">
        {/* Zone 1: Brand Title */}
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            onNavigateMode('catalog');
          }}
          className="flex items-center gap-2 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-md"
        >
          <span className="inline-flex items-center justify-center bg-[#f59e0b] text-slate-950 font-extrabold text-sm px-2 py-0.5 rounded-md tracking-tight">
            סבן
          </span>
          <span className="hidden sm:inline text-sm md:text-base font-bold tracking-tight text-white">
            ח. סבן חומרי בניין
          </span>
        </a>

        {/* Zone 2: Mode Navigation Toggle */}
        <nav
          aria-label="ניווט מצבי תצוגה"
          className="flex items-center gap-1 sm:gap-1.5 bg-slate-800/80 p-1 rounded-lg border border-slate-700/80 shrink-0"
        >
          <button
            type="button"
            onClick={() => onNavigateMode('qr')}
            className={`inline-flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              mode === 'qr'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <QrCode className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden md:inline">תצוגת שילוט מוצר (QR)</span>
            <span className="md:hidden">שילוט QR</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateMode('catalog')}
            className={`inline-flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              mode === 'catalog'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden md:inline">קטלוג מלא לחיפוש</span>
            <span className="md:hidden">קטלוג</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateMode('chat')}
            className={`inline-flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              mode === 'chat'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Bot className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden md:inline">יועצת דלפק (AI)</span>
            <span className="md:hidden">נועה AI</span>
          </button>
        </nav>

        {/* Zone 3: Primary Action + PWA Install */}
        <div className="flex items-center gap-2 shrink-0">
          <PWAInstallButton />
          <button
            type="button"
            onClick={onOpenDrawer}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#059669] hover:bg-emerald-700 px-3 py-2 min-h-[40px] text-xs font-semibold text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            aria-label="פתח רשימת הזמנה"
          >
            <ClipboardList className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">רשימת הזמנה</span>
            {cartCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-md bg-slate-950/30 text-white text-[11px] font-mono-tabular">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
