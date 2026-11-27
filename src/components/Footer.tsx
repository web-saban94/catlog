import React from 'react';
import {Phone} from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-200 bg-white mt-12 pb-24 sm:pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <img
              src="/assets/aistudio/1795235883523_56be46d4.jpg"
              alt="לוגו ח. סבן חומרי בניין (1994) בע״מ"
              className="h-14 w-auto rounded-lg border border-slate-200 object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="text-right">
              <p className="text-sm font-bold text-slate-900">
                ח. סבן חומרי בניין (1994) בע״מ
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                אספקה טכנית, חומרי בניין, הובלות מנוף וציוד מקצועי לקבלנים
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-slate-600">
            <a
              href="tel:097402575"
              className="inline-flex items-center gap-1.5 hover:text-slate-900 transition-colors tabular-nums min-h-[40px] px-2"
            >
              <Phone className="w-3.5 h-3.5 text-amber-600" />
              <span>סניף החרש 10: 09-7402575</span>
            </a>
            <span className="text-slate-300 hidden sm:inline" aria-hidden="true">
              •
            </span>
            <a
              href="tel:097602010"
              className="inline-flex items-center gap-1.5 hover:text-slate-900 transition-colors tabular-nums min-h-[40px] px-2"
            >
              <Phone className="w-3.5 h-3.5 text-amber-600" />
              <span>סניף התלמיד 6: 09-7602010</span>
            </a>
          </div>
        </div>

        <div className="mt-6 pt-5 border-t border-slate-100 text-center text-xs text-slate-500">
          ח. סבן (1994) בע״מ • סניף החרש 10: 09-7402575 • סניף התלמיד 6: 09-7602010
        </div>
      </div>
    </footer>
  );
};
