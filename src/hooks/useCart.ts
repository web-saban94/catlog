import {useCallback, useEffect, useMemo, useState} from 'react';
import {CartItem, OrderDraft, Product, SupplyMode} from '../types/product';

const CART_STORAGE_KEY = 'saban_qr_cart';
const DRAFT_STORAGE_KEY = 'saban_qr_order_draft';

const DEFAULT_DRAFT: OrderDraft = {
  customerName: '',
  supplyMode: 'איסוף עצמי מהסניף',
  city: '',
};

function loadInitialCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is CartItem =>
        item &&
        typeof item.sku === 'string' &&
        typeof item.name === 'string' &&
        typeof item.qty === 'number' &&
        item.qty > 0,
    );
  } catch {
    return [];
  }
}

function loadInitialDraft(): OrderDraft {
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return DEFAULT_DRAFT;
    const parsed = JSON.parse(raw) as Partial<OrderDraft>;
    const validModes: SupplyMode[] = [
      'איסוף עצמי מהסניף',
      'הובלת מנוף לאתר',
      'משלוח משאית חלוקה',
    ];
    return {
      customerName: typeof parsed.customerName === 'string' ? parsed.customerName : '',
      supplyMode:
        parsed.supplyMode && validModes.includes(parsed.supplyMode)
          ? parsed.supplyMode
          : 'איסוף עצמי מהסניף',
      city: typeof parsed.city === 'string' ? parsed.city : '',
    };
  } catch {
    return DEFAULT_DRAFT;
  }
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>(loadInitialCart);
  const [draft, setDraft] = useState<OrderDraft>(loadInitialDraft);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Ignore storage errors
    }
  }, [items]);

  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    } catch {
      // Ignore storage errors
    }
  }, [draft]);

  const addItem = useCallback((product: Product, qtyToAdd = 1) => {
    const safeQty = Math.max(1, Math.floor(qtyToAdd));
    setItems((prev) => {
      const existingIdx = prev.findIndex((i) => i.sku === product.sku);
      if (existingIdx !== -1) {
        const next = [...prev];
        next[existingIdx] = {
          ...next[existingIdx],
          qty: next[existingIdx].qty + safeQty,
        };
        return next;
      }
      return [
        ...prev,
        {
          sku: product.sku,
          name: product.name,
          unit: product.unit,
          weightKg: product.weightKg,
          deposit: product.deposit,
          warehouse: product.warehouse,
          imageUrl: product.imageUrl,
          qty: safeQty,
        },
      ];
    });
  }, []);

  const updateQty = useCallback((sku: string, nextQty: number) => {
    setItems((prev) => {
      if (nextQty <= 0) {
        return prev.filter((item) => item.sku !== sku);
      }
      return prev.map((item) =>
        item.sku === sku ? {...item, qty: Math.floor(nextQty)} : item,
      );
    });
  }, []);

  const removeItem = useCallback((sku: string) => {
    setItems((prev) => prev.filter((item) => item.sku !== sku));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const updateDraft = useCallback((patch: Partial<OrderDraft>) => {
    setDraft((prev) => ({...prev, ...patch}));
  }, []);

  const totalItemsCount = items.length;
  const totalUnitsCount = useMemo(
    () => items.reduce((sum, item) => sum + item.qty, 0),
    [items],
  );

  const buildWhatsAppUrl = useCallback(() => {
    const lines = items.map(
      (item, idx) =>
        `${idx + 1}. ${item.name} (מק״ט ${item.sku}) — כמות: ${item.qty} ${item.unit}`,
    );

    const cityPart = draft.city.trim()
      ? `📍 לאתר ב${draft.city.trim()}`
      : '📍 לאתר: טרם צוין יישוב';
    const namePart = draft.customerName.trim()
      ? `👤 שם: ${draft.customerName.trim()}`
      : '👤 שם: לקוח / קבלן מהשטח';

    const message = [
      'שלום ח. סבן,',
      'סרקתי מוצרים מהשילוט בסניף ואשמח להזמין / לקבל הצעה:',
      '',
      ...lines,
      '',
      `🚚 אופן אספקה: ${draft.supplyMode}`,
      cityPart,
      namePart,
    ].join('\n');

    return `https://api.whatsapp.com/send?phone=972508861080&text=${encodeURIComponent(message)}`;
  }, [items, draft]);

  return {
    items,
    totalItemsCount,
    totalUnitsCount,
    draft,
    addItem,
    updateQty,
    removeItem,
    clearCart,
    updateDraft,
    buildWhatsAppUrl,
  };
}
