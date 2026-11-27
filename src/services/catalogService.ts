import {DepositType, DataSourceKind, Product, WarehouseCode} from '../types/product';

const APPS_SCRIPT_BASE_URL =
  'https://script.google.com/macros/s/AKfycbxanu62n0on5fxgh2pkFNY-E4x4NwOm9dW6THfvOz11DIIi0kJq2YgvLgg0OAkJJneJ/exec';

const GVIZ_FALLBACK_URL =
  'https://docs.google.com/spreadsheets/d/1FsLseQrKbIj_AvlE6-dW4J12Gr88P3uaoFVBjEcUjsw/gviz/tq?tqx=out:json&sheet=%D7%9E%D7%99%D7%9C%D7%95%D7%9F_%D7%9C%D7%95%D7%92%D7%99%D7%A1%D7%98';

const CACHE_KEY = 'saban_catalog_cache_v1';
const CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes fresh window, always usable offline

let memoryCatalog: Product[] | null = null;
let memorySource: DataSourceKind = 'apps-script';
let inFlightCatalogPromise: Promise<{products: Product[]; source: DataSourceKind}> | null = null;

function cleanString(val: unknown): string {
  if (val === null || val === undefined) return '';
  return String(val).trim();
}

export function normalizeWarehouse(raw: string): {label: string; code: WarehouseCode} {
  const s = cleanString(raw);
  const has4 = s.includes('4') || s.includes('החרש');
  const has1 = s.includes('1') || s.includes('התלמיד');

  if (has4 && has1) {
    return {
      label: '🏭 סניף החרש 10 (מחסן 4) • 🏟️ סניף התלמיד 6 (מחסן 1)',
      code: 'both',
    };
  }
  if (has4) {
    return {
      label: '🏭 סניף החרש 10 (מחסן 4)',
      code: '4',
    };
  }
  if (has1) {
    return {
      label: '🏟️ סניף התלמיד 6 (מחסן 1)',
      code: '1',
    };
  }
  if (s) {
    return {label: s, code: 'other'};
  }
  return {
    label: '🏭 סניף החרש 10 (מחסן 4)',
    code: '4',
  };
}

function classifyDeposit(raw: string): DepositType {
  const s = cleanString(raw);
  if (!s || s === 'ללא' || s === '-' || s === 'אין') return null;
  if (s.includes('60060') || s.includes('משטח')) return 'pallet';
  if (s.includes('60002') || s.includes('בלה')) return 'bigbag';
  return 'other';
}

function extractUrlAndCleanTech(rawTech: string): {
  techSpec: string;
  manufacturerUrl: string | null;
} {
  const text = cleanString(rawTech);
  if (!text) return {techSpec: '', manufacturerUrl: null};

  const urlMatch = text.match(/https?:\/\/[^\s)]+/i);
  const manufacturerUrl = urlMatch ? urlMatch[0].replace(/[),.;]+$/, '') : null;

  let cleaned = text;
  if (manufacturerUrl) {
    cleaned = cleaned
      .replace(new RegExp(`\\(\\s*${escapeRegExp(manufacturerUrl)}\\s*\\)`, 'g'), '')
      .replace(manufacturerUrl, '')
      .replace(/\(\s*\)/g, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  return {techSpec: cleaned, manufacturerUrl};
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseSlangAndTech(rawCombined: string, explicitTechSpec?: string): {
  keywords: string;
  techSpec: string;
  manufacturerUrl: string | null;
} {
  const combined = cleanString(rawCombined);
  const explicitTech = cleanString(explicitTechSpec);

  if (explicitTech) {
    const parsedTech = extractUrlAndCleanTech(explicitTech);
    const cleanedKeywords = combined.split('| מידע טכני:')[0].trim();
    return {
      keywords: cleanedKeywords,
      techSpec: parsedTech.techSpec,
      manufacturerUrl: parsedTech.manufacturerUrl,
    };
  }

  if (combined.includes('| מידע טכני:')) {
    const [kwPart, ...techParts] = combined.split('| מידע טכני:');
    const parsedTech = extractUrlAndCleanTech(techParts.join('| מידע טכני:'));
    return {
      keywords: kwPart.trim(),
      techSpec: parsedTech.techSpec,
      manufacturerUrl: parsedTech.manufacturerUrl,
    };
  }

  // Also check if URL exists directly in combined text
  const urlMatch = combined.match(/https?:\/\/[^\s)]+/i);
  if (urlMatch) {
    const {techSpec, manufacturerUrl} = extractUrlAndCleanTech(combined);
    return {
      keywords: techSpec,
      techSpec: '',
      manufacturerUrl,
    };
  }

  return {
    keywords: combined,
    techSpec: '',
    manufacturerUrl: null,
  };
}

function validateImageUrl(raw: unknown): string | null {
  const s = cleanString(raw);
  if (s.startsWith('http://') || s.startsWith('https://')) {
    return s;
  }
  return null;
}

function parseWeightKg(raw: unknown): number | null {
  if (typeof raw === 'number' && Number.isFinite(raw) && raw > 0) {
    return Math.round(raw * 100) / 100;
  }
  const s = cleanString(raw).replace(/[^\d.]/g, '');
  if (!s) return null;
  const num = Number(s);
  return Number.isFinite(num) && num > 0 ? Math.round(num * 100) / 100 : null;
}

// Note: Intentionally excludes any price, discount, or currency fields.
function normalizeAppsScriptItem(raw: Record<string, unknown>): Product | null {
  const sku = cleanString(raw.sku);
  const name = cleanString(raw.name);
  if (!sku || !name) return null;

  const {keywords, techSpec, manufacturerUrl} = parseSlangAndTech(
    cleanString(raw.keywords),
    cleanString(raw.techSpec),
  );

  const deposit = cleanString(raw.deposit);
  const warehouseNorm = normalizeWarehouse(cleanString(raw.warehouse));

  return {
    sku,
    name,
    category: cleanString(raw.category) || 'חומרי בניין כללי',
    unit: cleanString(raw.unit) || 'יח׳',
    keywords,
    techSpec,
    manufacturerUrl,
    deposit,
    depositType: classifyDeposit(deposit),
    weightKg: parseWeightKg(raw.weightKg),
    warehouse: warehouseNorm.label,
    warehouseCode: warehouseNorm.code,
    driver: cleanString(raw.driver),
    imageUrl: validateImageUrl(raw.imageUrl),
    feedEligible: Boolean(raw.feedEligible),
  };
}

interface GvizCell {
  v?: unknown;
  f?: string;
}

interface GvizRow {
  c?: (GvizCell | null)[];
}

function getCellString(row: GvizRow, idx: number): string {
  const cell = row.c?.[idx];
  if (!cell) return '';
  if (cell.f !== undefined && cell.f !== null && String(cell.f).trim() !== '') {
    return String(cell.f).trim();
  }
  if (cell.v !== undefined && cell.v !== null) {
    return String(cell.v).trim();
  }
  return '';
}

function getCellValue(row: GvizRow, idx: number): unknown {
  const cell = row.c?.[idx];
  return cell?.v ?? cell?.f ?? null;
}

function parseGvizResponse(rawText: string): Product[] {
  const startIdx = rawText.indexOf('{');
  const endIdx = rawText.lastIndexOf('}');
  if (startIdx === -1 || endIdx === -1) {
    throw new Error('Invalid GViz response payload');
  }
  const jsonStr = rawText.slice(startIdx, endIdx + 1);
  const parsed = JSON.parse(jsonStr) as {
    table?: {rows?: GvizRow[]};
  };

  const rows = parsed.table?.rows ?? [];
  const products: Product[] = [];

  for (const row of rows) {
    const sku = getCellString(row, 0);
    const name = getCellString(row, 1);
    if (!sku || !name || sku === 'מק״ט ראשי (SKU)' || name === 'שם מוצר רשמי (קומקס)') {
      continue;
    }

    const category = getCellString(row, 2) || 'חומרי בניין כללי';
    const unit = getCellString(row, 3) || 'יח׳';
    const slangAndTechRaw = getCellString(row, 4);
    const {keywords, techSpec, manufacturerUrl} = parseSlangAndTech(slangAndTechRaw);

    const deposit = getCellString(row, 5) || getCellString(row, 13);
    const weightKg = parseWeightKg(getCellValue(row, 6));
    const warehouseRaw = getCellString(row, 7) || getCellString(row, 12);
    const warehouseNorm = normalizeWarehouse(warehouseRaw);
    const driver = getCellString(row, 8);
    const imageUrl = validateImageUrl(getCellString(row, 15));

    products.push({
      sku,
      name,
      category,
      unit,
      keywords,
      techSpec,
      manufacturerUrl,
      deposit,
      depositType: classifyDeposit(deposit),
      weightKg,
      warehouse: warehouseNorm.label,
      warehouseCode: warehouseNorm.code,
      driver,
      imageUrl,
      feedEligible: true,
    });
  }

  return products;
}

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      cache: 'no-store',
    });
  } finally {
    window.clearTimeout(timer);
  }
}

function readLocalCache(): {products: Product[]; timestamp: number} | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {products?: Product[]; timestamp?: number};
    if (!Array.isArray(parsed.products) || parsed.products.length === 0) return null;
    return {
      products: parsed.products,
      timestamp: parsed.timestamp ?? 0,
    };
  } catch {
    return null;
  }
}

function writeLocalCache(products: Product[]): void {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        timestamp: Date.now(),
        products,
      }),
    );
  } catch {
    // Ignore quota exceeded
  }
}

export async function fetchCatalog(options?: {
  forceRefresh?: boolean;
}): Promise<{products: Product[]; source: DataSourceKind}> {
  if (!options?.forceRefresh && memoryCatalog && memoryCatalog.length > 0) {
    return {products: memoryCatalog, source: memorySource};
  }

  if (!options?.forceRefresh) {
    const cached = readLocalCache();
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      memoryCatalog = cached.products;
      memorySource = 'apps-script';
      return {products: cached.products, source: 'apps-script'};
    }
  }

  if (inFlightCatalogPromise) {
    return inFlightCatalogPromise;
  }

  inFlightCatalogPromise = (async () => {
    // 1. Primary Live Apps Script Endpoint
    try {
      const res = await fetchWithTimeout(`${APPS_SCRIPT_BASE_URL}?action=catalog_json`, 8500);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as {
        status?: string;
        products?: Record<string, unknown>[];
      };
      if (Array.isArray(json.products) && json.products.length > 0) {
        const normalized = json.products
          .map(normalizeAppsScriptItem)
          .filter((p): p is Product => p !== null);

        if (normalized.length > 0) {
          memoryCatalog = normalized;
          memorySource = 'apps-script';
          writeLocalCache(normalized);
          return {products: normalized, source: 'apps-script'};
        }
      }
      throw new Error('Empty Apps Script catalog');
    } catch {
      // 2. Automatic Fallback: Google Sheets GViz JSON
      try {
        const gvizRes = await fetchWithTimeout(GVIZ_FALLBACK_URL, 9500);
        if (!gvizRes.ok) throw new Error(`GViz HTTP ${gvizRes.status}`);
        const text = await gvizRes.text();
        const products = parseGvizResponse(text);
        if (products.length > 0) {
          memoryCatalog = products;
          memorySource = 'gviz-fallback';
          writeLocalCache(products);
          return {products, source: 'gviz-fallback'};
        }
        throw new Error('Empty GViz sheet');
      } catch (err) {
        // 3. Offline PWA Cache Fallback
        const cached = readLocalCache();
        if (cached) {
          memoryCatalog = cached.products;
          memorySource = 'offline-cache';
          return {products: cached.products, source: 'offline-cache'};
        }
        throw err instanceof Error ? err : new Error('Failed to load catalog data');
      }
    } finally {
      inFlightCatalogPromise = null;
    }
  })();

  return inFlightCatalogPromise;
}

export async function fetchProductBySku(
  skuQuery: string,
): Promise<{product: Product | null; source: DataSourceKind}> {
  const normalizedSku = cleanString(skuQuery).toLowerCase();
  if (!normalizedSku) {
    return {product: null, source: memorySource};
  }

  // Check memory catalog first for instant 0ms navigation
  if (memoryCatalog) {
    const match = memoryCatalog.find((p) => p.sku.toLowerCase() === normalizedSku);
    if (match) return {product: match, source: memorySource};
  }

  // Try direct single-product Apps Script endpoint (no prices)
  try {
    const res = await fetchWithTimeout(
      `${APPS_SCRIPT_BASE_URL}?action=product_by_sku&sku=${encodeURIComponent(skuQuery.trim())}`,
      4000,
    );
    if (res.ok) {
      const text = await res.text();
      if (text && text.trim().startsWith('{')) {
        const data = JSON.parse(text) as {
          product?: Record<string, unknown>;
          data?: Record<string, unknown>;
        } & Record<string, unknown>;

        const rawProduct = data.product ?? data.data ?? (data.sku ? data : null);
        if (rawProduct) {
          const normalized = normalizeAppsScriptItem(rawProduct);
          if (normalized) {
            return {product: normalized, source: 'apps-script'};
          }
        }
      }
    }
  } catch {
    // Fall through cleanly to full catalog / GViz fallback
  }

  // Fallback to full catalog (Apps Script catalog_json -> GViz -> localStorage cache)
  const {products, source} = await fetchCatalog();
  const found =
    products.find((p) => p.sku.toLowerCase() === normalizedSku) ??
    products.find((p) => p.sku.replace(/^0+/, '') === normalizedSku.replace(/^0+/, '')) ??
    null;

  return {product: found, source};
}
