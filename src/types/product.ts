export type WarehouseCode = '4' | '1' | 'both' | 'other';

export type DepositType = 'pallet' | 'bigbag' | 'other' | null;

export interface Product {
  sku: string;
  name: string;
  category: string;
  unit: string;
  keywords: string;
  techSpec: string;
  manufacturerUrl: string | null;
  deposit: string;
  depositType: DepositType;
  weightKg: number | null;
  warehouse: string;
  warehouseCode: WarehouseCode;
  driver: string;
  imageUrl: string | null;
  feedEligible: boolean;
}

export interface CartItem {
  sku: string;
  name: string;
  unit: string;
  weightKg: number | null;
  deposit: string;
  warehouse: string;
  imageUrl: string | null;
  qty: number;
}

export type SupplyMode =
  | 'איסוף עצמי מהסניף'
  | 'הובלת מנוף לאתר'
  | 'משלוח משאית חלוקה';

export interface OrderDraft {
  customerName: string;
  supplyMode: SupplyMode;
  city: string;
}

export type DataSourceKind = 'apps-script' | 'gviz-fallback' | 'offline-cache';
