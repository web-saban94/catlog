import React, {useMemo, useState} from 'react';
import {
  Check,
  Package,
  Plus,
  QrCode,
  RefreshCw,
  Search,
  Warehouse,
  X,
} from 'lucide-react';
import {CartItem, Product} from '../types/product';
import {ProductImage} from './ProductImage';

interface CatalogViewProps {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  onSelectProduct: (sku: string) => void;
  onAddToCart: (product: Product, qty: number) => void;
  cartItems: CartItem[];
}

const PAGE_SIZE = 36;

export const CatalogView: React.FC<CatalogViewProps> = ({
  products,
  isLoading,
  error,
  onRetry,
  onSelectProduct,
  onAddToCart,
  cartItems,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('הכל');
  const [selectedBranch, setSelectedBranch] = useState<'all' | '4' | '1'>('all');
  const [visibleLimit, setVisibleLimit] = useState(PAGE_SIZE);
  const [justAddedSku, setJustAddedSku] = useState<string | null>(null);

  const cartQtyMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of cartItems) {
      map.set(item.sku, item.qty);
    }
    return map;
  }, [cartItems]);

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of products) {
      const cat = p.category || 'חומרי בניין כללי';
      counts.set(cat, (counts.get(cat) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({name, count}));
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const tokens = q ? q.split(/\s+/).filter(Boolean) : [];

    return products.filter((p) => {
      if (selectedCategory !== 'הכל' && p.category !== selectedCategory) {
        return false;
      }
      if (selectedBranch === '4' && p.warehouseCode !== '4' && p.warehouseCode !== 'both') {
        return false;
      }
      if (selectedBranch === '1' && p.warehouseCode !== '1' && p.warehouseCode !== 'both') {
        return false;
      }
      if (tokens.length === 0) return true;

      const haystack = `${p.sku} ${p.name} ${p.keywords} ${p.category} ${p.techSpec}`.toLowerCase();
      return tokens.every((token) => haystack.includes(token));
    });
  }, [products, searchQuery, selectedCategory, selectedBranch]);

  const visibleProducts = useMemo(
    () => filteredProducts.slice(0, visibleLimit),
    [filteredProducts, visibleLimit],
  );

  const handleQuickAdd = (product: Product) => {
    onAddToCart(product, 1);
    setJustAddedSku(product.sku);
    window.setTimeout(() => {
      setJustAddedSku((curr) => (curr === product.sku ? null : curr));
    }, 1200);
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Compact Contractor Catalog Header & Smart Slang Search */}
      <section className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              קטלוג מוצרים לקבלנים ולקוחות
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              חפשו לפי שם מוצר, מק״ט או כינוי בשטח (למשל: מלט שחור, בלה חול, טמבורפלקס)
            </p>
          </div>

          {/* Branch Segmented Filter */}
          <div
            className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-xl self-start lg:self-auto"
            role="group"
            aria-label="סינון לפי סניף"
          >
            <button
              type="button"
              onClick={() => {
                setSelectedBranch('all');
                setVisibleLimit(PAGE_SIZE);
              }}
              className={`px-3 py-2 min-h-[40px] text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                selectedBranch === 'all'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              כל הסניפים
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedBranch('4');
                setVisibleLimit(PAGE_SIZE);
              }}
              className={`px-3 py-2 min-h-[40px] text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                selectedBranch === '4'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              החרש 10 (מחסן 4)
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedBranch('1');
                setVisibleLimit(PAGE_SIZE);
              }}
              className={`px-3 py-2 min-h-[40px] text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                selectedBranch === '1'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              התלמיד 6 (מחסן 1)
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-4 relative">
          <Search className="w-5 h-5 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setVisibleLimit(PAGE_SIZE);
            }}
            placeholder="חיפוש חכם: מלט לבן, בלוק איטונג, דבק קרמיקה, מק״ט 10002..."
            aria-label="חיפוש מוצרים בקטלוג"
            className="w-full min-h-[48px] pr-11 pl-11 rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="נקה חיפוש"
              className="absolute left-2 top-1/2 -translate-y-1/2 min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Filter Tabs */}
        {categories.length > 0 && (
          <div className="mt-4 flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('הכל');
                setVisibleLimit(PAGE_SIZE);
              }}
              className={`px-3.5 py-2 min-h-[40px] rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                selectedCategory === 'הכל'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              הכל ({products.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat.name}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat.name);
                  setVisibleLimit(PAGE_SIZE);
                }}
                className={`px-3.5 py-2 min-h-[40px] rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  selectedCategory === cat.name
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {cat.name} ({cat.count})
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Result Count Bar */}
      {!isLoading && !error && (
        <div className="flex items-center justify-between text-xs text-slate-500 mb-4 px-1">
          <span className="tabular-nums">
            מציג <strong className="text-slate-800">{visibleProducts.length}</strong> מתוך{' '}
            <strong className="text-slate-800">{filteredProducts.length}</strong> מוצרים
          </span>
          {(searchQuery || selectedCategory !== 'הכל' || selectedBranch !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('הכל');
                setSelectedBranch('all');
                setVisibleLimit(PAGE_SIZE);
              }}
              className="text-emerald-700 font-semibold hover:underline cursor-pointer"
            >
              איפוס סינון
            </button>
          )}
        </div>
      )}

      {/* Loading Skeleton Grid */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({length: 6}).map((_, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-slate-200 p-4 animate-pulse space-y-3"
            >
              <div className="aspect-[4/3] rounded-xl bg-slate-100" />
              <div className="h-3 w-1/3 bg-slate-100 rounded" />
              <div className="h-5 w-4/5 bg-slate-100 rounded" />
              <div className="h-4 w-2/3 bg-slate-100 rounded" />
              <div className="h-10 w-full bg-slate-100 rounded-xl mt-2" />
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <div className="bg-white rounded-2xl border border-red-200 p-8 text-center max-w-lg mx-auto">
          <p className="text-base font-bold text-slate-900">
            לא ניתן היה לטעון את רשימת המוצרים
          </p>
          <p className="text-sm text-slate-600 mt-1">{error}</p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 inline-flex items-center gap-2 min-h-[44px] px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>נסה לטעון שוב</span>
          </button>
        </div>
      )}

      {/* Empty Filter Results */}
      {!isLoading && !error && filteredProducts.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center max-w-lg mx-auto">
          <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-base font-bold text-slate-900">לא נמצאו מוצרים תואמים</p>
          <p className="text-sm text-slate-500 mt-1">
            נסו לחפש מילת מפתח כללית יותר, מק״ט אחר או לאפס את הסינון.
          </p>
        </div>
      )}

      {/* Product Grid */}
      {!isLoading && !error && visibleProducts.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {visibleProducts.map((product) => {
              const qtyInCart = cartQtyMap.get(product.sku) ?? 0;
              const isJustAdded = justAddedSku === product.sku;

              return (
                <article
                  key={product.sku}
                  className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 transition-all hover:shadow-sm flex flex-col overflow-hidden"
                >
                  {/* Clickable Product Image */}
                  <button
                    type="button"
                    onClick={() => onSelectProduct(product.sku)}
                    className="relative aspect-[4/3] w-full bg-slate-50/80 border-b border-slate-100 p-4 flex items-center justify-center overflow-hidden cursor-pointer group text-right"
                  >
                    <ProductImage
                      src={product.imageUrl}
                      alt={product.name}
                      sku={product.sku}
                      className="w-full h-full object-contain group-hover:scale-[1.02] transition-transform duration-200"
                    />
                  </button>

                  {/* Card Body */}
                  <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                    <div>
                      {/* Clean Unboxed Metadata */}
                      <div className="flex items-center flex-wrap gap-1.5 text-xs text-slate-500">
                        <span className="font-mono-tabular font-semibold text-slate-700">
                          מק״ט {product.sku}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{product.category}</span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">
                          {product.unit}
                          {product.weightKg ? ` (${product.weightKg} ק״ג)` : ''}
                        </span>
                      </div>

                      <h2 className="text-base font-bold text-slate-900 mt-1.5 leading-snug">
                        <button
                          type="button"
                          onClick={() => onSelectProduct(product.sku)}
                          className="text-right hover:text-emerald-700 transition-colors cursor-pointer"
                        >
                          {product.name}
                        </button>
                      </h2>

                      {product.keywords && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                          {product.keywords}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2.5 pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 truncate">
                        <Warehouse className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{product.warehouse}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleQuickAdd(product)}
                          className={`flex-1 min-h-[44px] px-3 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                            isJustAdded
                              ? 'bg-slate-900'
                              : 'bg-[#059669] hover:bg-emerald-700'
                          }`}
                        >
                          {isJustAdded ? (
                            <>
                              <Check className="w-4 h-4 text-emerald-400" />
                              <span>נוסף ({qtyInCart})</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-4 h-4" />
                              <span>
                                הוסף להזמנה{qtyInCart > 0 ? ` (${qtyInCart})` : ''}
                              </span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => onSelectProduct(product.sku)}
                          className="min-h-[44px] px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                          title="צפה בדף שילוט מוצר ומפרט טכני"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>מפרט</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {visibleLimit < filteredProducts.length && (
            <div className="mt-8 text-center">
              <button
                type="button"
                onClick={() => setVisibleLimit((prev) => prev + PAGE_SIZE)}
                className="min-h-[44px] px-6 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-sm font-semibold transition-colors cursor-pointer"
              >
                הצג עוד מוצרים ({filteredProducts.length - visibleLimit} נוספים)
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
};
