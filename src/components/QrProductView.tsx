import React, {useEffect, useState} from 'react';
import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Info,
  Minus,
  Package,
  Plus,
  QrCode,
  Scale,
  Search,
  ShieldCheck,
} from 'lucide-react';
import {Product} from '../types/product';
import {ProductImage} from './ProductImage';

interface QrProductViewProps {
  sku: string | null;
  product: Product | null;
  isLoading: boolean;
  error: string | null;
  sampleProducts: Product[];
  onLookupSku: (sku: string) => void;
  onAddToCart: (product: Product, qty: number) => void;
  onBackToCatalog: () => void;
  cartQtyForProduct: number;
  onOpenDrawer: () => void;
}

export const QrProductView: React.FC<QrProductViewProps> = ({
  sku,
  product,
  isLoading,
  error,
  sampleProducts,
  onLookupSku,
  onAddToCart,
  onBackToCatalog,
  cartQtyForProduct,
  onOpenDrawer,
}) => {
  const [lookupInput, setLookupInput] = useState(sku ?? '');
  const [qty, setQty] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const [specExpanded, setSpecExpanded] = useState(true);

  useEffect(() => {
    setLookupInput(sku ?? '');
    setQty(1);
    setJustAdded(false);
  }, [sku, product?.sku]);

  const handleLookupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = lookupInput.trim();
    if (trimmed) {
      onLookupSku(trimmed);
    }
  };

  const handleAdd = () => {
    if (!product) return;
    onAddToCart(product, qty);
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 2400);
  };

  const showDepositCallout =
    product &&
    (product.depositType === 'pallet' ||
      product.depositType === 'bigbag' ||
      (product.deposit &&
        (product.deposit.includes('60060') ||
          product.deposit.includes('60002') ||
          product.deposit.includes('משטח') ||
          product.deposit.includes('בלה'))));

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
      {/* Top Action & Quick SKU Lookup Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <button
          type="button"
          onClick={onBackToCatalog}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 min-h-[44px] self-start cursor-pointer"
        >
          <ArrowRight className="w-4 h-4" />
          <span>חזרה לקטלוג המלא</span>
        </button>

        <form
          onSubmit={handleLookupSubmit}
          className="flex items-center gap-2 w-full sm:w-auto"
        >
          <div className="relative flex-1 sm:w-60">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              inputMode="search"
              value={lookupInput}
              onChange={(e) => setLookupInput(e.target.value)}
              placeholder="הזן מק״ט לסריקה מהירה..."
              aria-label="חיפוש לפי מק״ט"
              className="w-full min-h-[44px] pr-9 pl-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
            />
          </div>
          <button
            type="submit"
            className="min-h-[44px] px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            הצג מק״ט
          </button>
        </form>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-pulse">
            <div className="aspect-[4/3] rounded-xl bg-slate-100" />
            <div className="space-y-4">
              <div className="h-8 w-3/4 bg-slate-100 rounded-lg" />
              <div className="h-4 w-1/2 bg-slate-100 rounded-lg" />
              <div className="h-24 w-full bg-slate-100 rounded-xl mt-4" />
              <div className="grid grid-cols-2 gap-3">
                <div className="h-20 bg-slate-100 rounded-xl" />
                <div className="h-20 bg-slate-100 rounded-xl" />
              </div>
              <div className="h-12 w-full bg-slate-100 rounded-xl mt-4" />
            </div>
          </div>
        </div>
      )}

      {/* Unknown SKU / Empty Prompt State */}
      {!isLoading && (!sku || !product) && (
        <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-10 text-center max-w-2xl mx-auto shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto mb-4">
            <QrCode className="w-7 h-7" />
          </div>

          {sku ? (
            <>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                מק״ט <span className="font-mono-tabular">{sku}</span> לא נמצא במערכת
              </h1>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                {error
                  ? 'אירעה שגיאה בטעינת הנתונים. ניתן לנסות שוב או לחפש בקטלוג המלא.'
                  : 'ייתכן שהמק״ט עודכן או אינו משויך לשילוט המדף הפעיל. בדקו את המספר או חפשו לפי כינוי בשטח בקטלוג המלא.'}
              </p>
            </>
          ) : (
            <>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                מצב שילוט מדף חכם (QR)
              </h1>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                הזינו מק״ט מוצר בשדה החיפוש למעלה או בחרו אחד ממוצרי המדף הפופולריים לצפייה במפרט הטכני, המיקום במחסן ואפשרויות ההזמנה.
              </p>
            </>
          )}

          {sampleProducts.length > 0 && (
            <div className="mt-6 pt-6 border-t border-slate-100">
              <p className="text-xs font-medium text-slate-500 mb-3">
                מק״טים לדוגמה מהמדף בסניפים:
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {sampleProducts.slice(0, 6).map((item) => (
                  <button
                    key={item.sku}
                    type="button"
                    onClick={() => onLookupSku(item.sku)}
                    className="min-h-[40px] px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 transition-colors cursor-pointer"
                  >
                    <span className="font-mono-tabular text-slate-900 font-semibold">
                      {item.sku}
                    </span>{' '}
                    · {item.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6">
            <button
              type="button"
              onClick={onBackToCatalog}
              className="inline-flex items-center justify-center min-h-[44px] px-6 rounded-xl bg-[#059669] hover:bg-emerald-700 text-white text-sm font-semibold transition-colors cursor-pointer"
            >
              מעבר לחיפוש בקטלוג המלא
            </button>
          </div>
        </section>
      )}

      {/* Active QR Signage Product View (Zero Prices!) */}
      {!isLoading && product && (
        <article className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
            {/* Hero Product Image Container */}
            <div className="lg:col-span-6 bg-slate-50/70 border-b lg:border-b-0 lg:border-l border-slate-200 p-4 sm:p-6 flex items-center justify-center">
              <div className="relative w-full aspect-[4/3] rounded-xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center p-4">
                {/* Top-right SKU pill */}
                <div className="absolute top-3 right-3 z-10 inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-900/90 text-white text-xs font-mono-tabular font-semibold shadow-sm">
                  מק״ט {product.sku}
                </div>

                {/* Bottom-right Branch availability badge */}
                <div className="absolute bottom-3 right-3 z-10 inline-flex items-center px-3 py-1.5 rounded-lg bg-white/95 backdrop-blur-sm border border-slate-200 text-slate-800 text-xs font-semibold shadow-sm max-w-[90%] truncate">
                  {product.warehouse}
                </div>

                <ProductImage
                  src={product.imageUrl}
                  alt={product.name}
                  sku={product.sku}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            {/* Contiguous Product Specification & Order Module */}
            <div className="lg:col-span-6 p-5 sm:p-8 flex flex-col justify-between gap-6">
              <div className="space-y-5">
                {/* Category line + Official Title + Field Slang */}
                <div>
                  <div className="text-xs font-medium text-slate-500 flex items-center gap-2">
                    <span>{product.category}</span>
                    {product.driver && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>קו חלוקה: {product.driver}</span>
                      </>
                    )}
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1.5 leading-tight text-balance">
                    {product.name}
                  </h1>

                  {product.keywords && (
                    <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                      <span className="font-semibold text-slate-700">כינויים בשטח:</span>{' '}
                      {product.keywords}
                    </p>
                  )}
                </div>

                {/* Expandable Technical Spec & Israeli Standard Card */}
                {(product.techSpec || product.manufacturerUrl) && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50/70 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setSpecExpanded((prev) => !prev)}
                      className="w-full flex items-center justify-between gap-3 px-4 py-3 text-right min-h-[44px] cursor-pointer hover:bg-slate-100/70 transition-colors"
                      aria-expanded={specExpanded}
                    >
                      <span className="inline-flex items-center gap-2 text-sm font-bold text-slate-900">
                        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                        מפרט טכני ותקן ישראלי
                      </span>
                      {specExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                      )}
                    </button>

                    {specExpanded && (
                      <div className="px-4 pb-4 pt-1 border-t border-slate-200/70 space-y-3">
                        {product.techSpec && (
                          <p className="text-sm text-slate-700 leading-relaxed">
                            {product.techSpec}
                          </p>
                        )}
                        {product.manufacturerUrl && (
                          <a
                            href={product.manufacturerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline min-h-[36px]"
                          >
                            <span>לדף המוצר באתר היצרן</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* 2-Column Logistics Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-xl border border-slate-200 bg-white p-3.5">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                      <Scale className="w-3.5 h-3.5 text-slate-400" />
                      <span>יחידת מידה ומשקל</span>
                    </div>
                    <p className="text-sm font-bold text-slate-900 mt-1.5 tabular-nums">
                      {product.unit}
                      {product.weightKg ? ` • ${product.weightKg} ק״ג` : ''}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-3.5">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                      <Package className="w-3.5 h-3.5 text-slate-400" />
                      <span>אריזה ופיקדון</span>
                    </div>
                    <p className="text-sm font-bold text-slate-900 mt-1.5">
                      {product.deposit || 'אריזה סטנדרטית ללא פיקדון'}
                    </p>
                  </div>
                </div>

                {/* Refundable Deposit Amber Callout Banner */}
                {showDepositCallout && (
                  <div className="rounded-xl border border-amber-300 bg-amber-50 p-3.5 flex items-start gap-2.5 text-right">
                    <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-950 leading-relaxed">
                      <span className="font-bold">תנאי פיקדון חוזר: </span>
                      {product.depositType === 'bigbag'
                        ? 'שק בלה (מק״ט 60002) מחויב בפיקדון חוזר ומזוכה במלואו בעת החזרת האריזה התקינה לסניפי ח. סבן.'
                        : 'משטח עץ סבן (מק״ט 60060) מחויב בפיקדון חוזר ומזוכה במלואו בעת החזרת המשטח התקין לסניפי ח. סבן.'}
                    </div>
                  </div>
                )}
              </div>

              {/* Touch-Friendly Stepper + Add to Order CTA */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-semibold text-slate-700">
                    כמות להזמנה ({product.unit}):
                  </span>

                  <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1">
                    <button
                      type="button"
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-slate-700 hover:bg-white transition-colors cursor-pointer"
                      aria-label="הפחת כמות"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={9999}
                      value={qty}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        setQty(Number.isFinite(val) && val > 0 ? val : 1);
                      }}
                      aria-label="כמות"
                      className="w-14 text-center bg-transparent text-base font-bold text-slate-900 font-mono-tabular focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setQty((q) => q + 1)}
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-slate-700 hover:bg-white transition-colors cursor-pointer"
                      aria-label="הגדל כמות"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAdd}
                  className={`w-full min-h-[48px] rounded-xl font-bold text-base text-white flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer ${
                    justAdded
                      ? 'bg-slate-900 hover:bg-slate-800'
                      : 'bg-[#059669] hover:bg-emerald-700'
                  }`}
                >
                  {justAdded ? (
                    <>
                      <Check className="w-5 h-5 text-emerald-400" />
                      <span>נוסף לרשימת ההזמנה</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      <span>הוסף להזמנה</span>
                    </>
                  )}
                </button>

                {cartQtyForProduct > 0 && (
                  <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                    <span>
                      כבר ברשימה שלך:{' '}
                      <strong className="text-slate-900 tabular-nums">
                        {cartQtyForProduct} {product.unit}
                      </strong>
                    </span>
                    <button
                      type="button"
                      onClick={onOpenDrawer}
                      className="font-semibold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer py-1"
                    >
                      לרשימת ההזמנה ושליחה בוואטסאפ
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </article>
      )}
    </main>
  );
};
