import React, {useEffect} from 'react';
import {
  MapPin,
  MessageCircle,
  Minus,
  Plus,
  Trash2,
  Truck,
  User,
  X,
} from 'lucide-react';
import {CartItem, OrderDraft, SupplyMode} from '../types/product';

interface OrderDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  draft: OrderDraft;
  onUpdateQty: (sku: string, nextQty: number) => void;
  onRemoveItem: (sku: string) => void;
  onClearCart: () => void;
  onUpdateDraft: (patch: Partial<OrderDraft>) => void;
  whatsAppUrl: string;
}

const SUPPLY_MODES: SupplyMode[] = [
  'איסוף עצמי מהסניף',
  'הובלת מנוף לאתר',
  'משלוח משאית חלוקה',
];

export const OrderDrawer: React.FC<OrderDrawerProps> = ({
  isOpen,
  onClose,
  items,
  draft,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
  onUpdateDraft,
  whatsAppUrl,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/60 backdrop-blur-sm sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="רשימת הזמנה ושליחה בוואטסאפ"
    >
      <div
        className="w-full sm:max-w-lg max-h-[90vh] bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Handle */}
        <div className="sm:hidden pt-3 pb-1 flex justify-center">
          <div className="w-10 h-1.5 rounded-full bg-slate-300" />
        </div>

        {/* Drawer Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">
              רשימת הזמנה והצעת מחיר
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              המוצרים נשמרים אוטומטית בין סריקות במחסן
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 cursor-pointer"
            aria-label="סגור חלון"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {items.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm font-semibold text-slate-700">
                רשימת ההזמנה ריקה כרגע
              </p>
              <p className="text-xs text-slate-500 mt-1">
                הוסיפו מוצרים משילוט המדף או מהקטלוג המלא כדי לשלוח הזמנה בוואטסאפ.
              </p>
            </div>
          ) : (
            <>
              {/* Item List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">
                    פריטים ברשימה ({items.length})
                  </span>
                  <button
                    type="button"
                    onClick={onClearCart}
                    className="text-xs text-red-600 hover:text-red-700 font-medium cursor-pointer py-1"
                  >
                    נקה הכל
                  </button>
                </div>

                {items.map((item) => (
                  <div
                    key={item.sku}
                    className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-900 truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
                        מק״ט {item.sku} · {item.unit}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white">
                        <button
                          type="button"
                          onClick={() => onUpdateQty(item.sku, item.qty - 1)}
                          className="min-h-[40px] min-w-[36px] flex items-center justify-center text-slate-600 hover:text-slate-900 cursor-pointer"
                          aria-label={`הפחת כמות של ${item.name}`}
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-9 text-center text-sm font-bold text-slate-900 font-mono-tabular">
                          {item.qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateQty(item.sku, item.qty + 1)}
                          className="min-h-[40px] min-w-[36px] flex items-center justify-center text-slate-600 hover:text-slate-900 cursor-pointer"
                          aria-label={`הגדל כמות של ${item.name}`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => onRemoveItem(item.sku)}
                        className="min-h-[40px] min-w-[36px] flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        aria-label={`הסר ${item.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Logistics Form */}
              <div className="space-y-4 pt-3 border-t border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    <Truck className="inline w-3.5 h-3.5 ml-1 text-slate-500" />
                    אופן אספקה מבוקש
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {SUPPLY_MODES.map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => onUpdateDraft({supplyMode: mode})}
                        className={`min-h-[44px] px-3 py-2 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                          draft.supplyMode === mode
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="saban-customer-name"
                      className="block text-xs font-bold text-slate-700 mb-1"
                    >
                      <User className="inline w-3.5 h-3.5 ml-1 text-slate-500" />
                      שם קבלן / לקוח (אופציונלי)
                    </label>
                    <input
                      id="saban-customer-name"
                      type="text"
                      value={draft.customerName}
                      onChange={(e) => onUpdateDraft({customerName: e.target.value})}
                      placeholder="לדוגמה: ישראל ישראלי"
                      className="w-full min-h-[44px] px-3 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="saban-city"
                      className="block text-xs font-bold text-slate-700 mb-1"
                    >
                      <MapPin className="inline w-3.5 h-3.5 ml-1 text-slate-500" />
                      יישוב / אתר יעד
                    </label>
                    <input
                      id="saban-city"
                      type="text"
                      value={draft.city}
                      onChange={(e) => onUpdateDraft({city: e.target.value})}
                      placeholder="לדוגמה: כפר סבא / רעננה"
                      className="w-full min-h-[44px] px-3 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600"
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Sticky Drawer Footer CTA */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50">
          {items.length > 0 ? (
            <a
              href={whatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full min-h-[48px] rounded-xl bg-[#059669] hover:bg-emerald-700 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-sm transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              <span>שלח רשימה בוואטסאפ להזמנות</span>
            </a>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="w-full min-h-[48px] rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm cursor-pointer"
            >
              חזרה למוצרים
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
