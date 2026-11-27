import {useCallback, useEffect, useState} from 'react';
import {CatalogView} from './components/CatalogView';
import {CounterChatView} from './components/chat/CounterChatView';
import {FloatingOrderBar} from './components/FloatingOrderBar';
import {Footer} from './components/Footer';
import {AppMode, Header} from './components/Header';
import {OfflineIndicator} from './components/OfflineIndicator';
import {OrderDrawer} from './components/OrderDrawer';
import {QrProductView} from './components/QrProductView';
import {useCart} from './hooks/useCart';
import {fetchCatalog, fetchProductBySku} from './services/catalogService';
import {Product} from './types/product';

interface RouteState {
  mode: AppMode;
  sku: string | null;
}

function parseCurrentRoute(): RouteState {
  const pathname = window.location.pathname;
  const params = new URLSearchParams(window.location.search);
  const querySku = params.get('sku')?.trim();

  if (querySku) {
    return {mode: 'qr', sku: querySku};
  }

  const productMatch = pathname.match(/^\/product\/([^/]+)\/?$/i);
  if (productMatch) {
    return {
      mode: 'qr',
      sku: decodeURIComponent(productMatch[1]).trim(),
    };
  }

  if (pathname === '/product' || pathname === '/product/') {
    return {mode: 'qr', sku: null};
  }

  if (pathname === '/chat' || pathname.startsWith('/chat/')) {
    return {mode: 'chat', sku: null};
  }

  return {mode: 'catalog', sku: null};
}

export default function App() {
  const [route, setRoute] = useState<RouteState>(parseCurrentRoute);
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  const [qrProduct, setQrProduct] = useState<Product | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const {
    items: cartItems,
    totalItemsCount,
    totalUnitsCount,
    draft,
    addItem,
    updateQty,
    removeItem,
    clearCart,
    updateDraft,
    buildWhatsAppUrl,
  } = useCart();

  const loadCatalog = useCallback(async (forceRefresh = false) => {
    setCatalogLoading(true);
    setCatalogError(null);
    try {
      const {products} = await fetchCatalog({forceRefresh});
      setCatalog(products);
    } catch (err) {
      setCatalogError(
        err instanceof Error ? err.message : 'שגיאה בחיבור למסד הנתונים',
      );
    } finally {
      setCatalogLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  // Listen to browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      setRoute(parseCurrentRoute());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Load QR product whenever route switches to QR with a SKU
  useEffect(() => {
    if (route.mode !== 'qr' || !route.sku) {
      setQrProduct(null);
      setQrError(null);
      setQrLoading(false);
      return;
    }

    let cancelled = false;
    setQrLoading(true);
    setQrError(null);

    fetchProductBySku(route.sku)
      .then(({product}) => {
        if (cancelled) return;
        setQrProduct(product);
      })
      .catch((err) => {
        if (cancelled) return;
        setQrProduct(null);
        setQrError(err instanceof Error ? err.message : 'שגיאה בטעינת המוצר');
      })
      .finally(() => {
        if (!cancelled) setQrLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [route.mode, route.sku]);

  // Keep page title synced with active view
  useEffect(() => {
    if (route.mode === 'chat') {
      document.title = 'נועה AI — יועצת דלפק וידע טכני | ח. סבן';
    } else if (route.mode === 'qr' && qrProduct) {
      document.title = `${qrProduct.name} | מק״ט ${qrProduct.sku} — ח. סבן`;
    } else if (route.mode === 'qr' && route.sku) {
      document.title = `מק״ט ${route.sku} | שילוט מדף — ח. סבן`;
    } else {
      document.title = 'ח. סבן חומרי בניין (1994) בע"מ | קטלוג ושילוט מדף';
    }
  }, [route.mode, route.sku, qrProduct]);

  const navigateToCatalog = useCallback(() => {
    if (window.location.pathname !== '/' || window.location.search !== '') {
      window.history.pushState({}, '', '/');
    }
    setRoute({mode: 'catalog', sku: null});
    window.scrollTo({top: 0, behavior: 'smooth'});
  }, []);

  const navigateToChat = useCallback(() => {
    if (window.location.pathname !== '/chat' || window.location.search !== '') {
      window.history.pushState({}, '', '/chat');
    }
    setRoute({mode: 'chat', sku: null});
    window.scrollTo({top: 0, behavior: 'smooth'});
  }, []);

  const navigateToProduct = useCallback((sku: string) => {
    const cleanSku = sku.trim();
    const targetUrl = cleanSku
      ? `/product/${encodeURIComponent(cleanSku)}`
      : '/product';
    if (window.location.pathname + window.location.search !== targetUrl) {
      window.history.pushState({}, '', targetUrl);
    }
    setRoute({mode: 'qr', sku: cleanSku || null});
    window.scrollTo({top: 0, behavior: 'smooth'});
  }, []);

  const handleNavigateMode = useCallback(
    (nextMode: AppMode) => {
      if (nextMode === 'catalog') {
        navigateToCatalog();
      } else if (nextMode === 'chat') {
        navigateToChat();
      } else {
        const fallbackSku = route.sku || catalog[0]?.sku || '10002';
        navigateToProduct(fallbackSku);
      }
    },
    [catalog, route.sku, navigateToCatalog, navigateToChat, navigateToProduct],
  );

  const cartQtyForQrProduct = qrProduct
    ? cartItems.find((i) => i.sku === qrProduct.sku)?.qty ?? 0
    : 0;

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-slate-900">
      <OfflineIndicator />

      <Header
        mode={route.mode}
        onNavigateMode={handleNavigateMode}
        cartCount={totalItemsCount}
        onOpenDrawer={() => setIsDrawerOpen(true)}
      />

      <div className="flex-1">
        {route.mode === 'chat' ? (
          <CounterChatView
            catalog={catalog}
            onNavigateProduct={navigateToProduct}
            onAddToCart={addItem}
          />
        ) : route.mode === 'qr' ? (
          <QrProductView
            sku={route.sku}
            product={qrProduct}
            isLoading={qrLoading}
            error={qrError}
            sampleProducts={catalog}
            onLookupSku={navigateToProduct}
            onAddToCart={addItem}
            onBackToCatalog={navigateToCatalog}
            cartQtyForProduct={cartQtyForQrProduct}
            onOpenDrawer={() => setIsDrawerOpen(true)}
          />
        ) : (
          <CatalogView
            products={catalog}
            isLoading={catalogLoading}
            error={catalogError}
            onRetry={() => loadCatalog(true)}
            onSelectProduct={navigateToProduct}
            onAddToCart={addItem}
            cartItems={cartItems}
          />
        )}
      </div>

      <Footer />

      {route.mode !== 'chat' && (
        <FloatingOrderBar
          itemCount={totalItemsCount}
          unitCount={totalUnitsCount}
          onOpen={() => setIsDrawerOpen(true)}
        />
      )}

      <OrderDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        items={cartItems}
        draft={draft}
        onUpdateQty={updateQty}
        onRemoveItem={removeItem}
        onClearCart={clearCart}
        onUpdateDraft={updateDraft}
        whatsAppUrl={buildWhatsAppUrl()}
      />
    </div>
  );
}
