import React, {useState} from 'react';
import {Download, Share, X} from 'lucide-react';
import {usePWAInstall} from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const {isInstallable, isInstalled, isIOS, install} = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-2 min-h-[40px] text-xs font-medium text-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        title="התקן כאפליקציה במכשיר"
      >
        <Download className="w-3.5 h-3.5 text-amber-400" />
        <span className="hidden sm:inline">התקן אפליקציה</span>
        <span className="sm:hidden">התקנה</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-2 min-h-[40px] text-xs font-medium text-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">התקן באייפון</span>
          <span className="sm:hidden">התקנה</span>
        </button>

        {showIOSGuide && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4"
            onClick={() => setShowIOSGuide(false)}
          >
            <div
              className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl border border-slate-200 text-right"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-lg font-bold text-slate-900">
                  התקנת אפליקציית ח. סבן
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
                  aria-label="סגור"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <ol className="mt-4 space-y-3 text-sm text-slate-600 leading-relaxed">
                <li className="flex items-start gap-2.5">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-800 font-bold text-xs shrink-0 mt-0.5">
                    1
                  </span>
                  <span>
                    לחץ על כפתור <strong>השיתוף</strong>{' '}
                    <Share className="inline w-4 h-4 text-slate-700 mx-0.5" /> בסרגל התחתון של Safari.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-800 font-bold text-xs shrink-0 mt-0.5">
                    2
                  </span>
                  <span>
                    גלול מטה ובחר באפשרות <strong>״הוסף למסך הבית״ (Add to Home Screen)</strong>.
                  </span>
                </li>
              </ol>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full min-h-[44px] rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                הבנתי, סגור
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
