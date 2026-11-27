/**
 * Stage 2 — Hybrid Intent Classifier (Deterministic Rules + Gemini Structured Classifier)
 * מזהה כוונה ראשית + כוונות משניות, ישויות, הקשר חסר ופעולות מוצעות
 */

import type {
  ActionButtonKind,
  CounterIntent,
  DiagnosisFieldKey,
  IntentClassification,
  IntentEntities,
} from "./types";

const ALL_INTENTS: CounterIntent[] = [
  "TECHNICAL_GUIDANCE",
  "PRODUCT_COMPARISON",
  "CUSTOMER_DIAGNOSIS",
  "CROSS_SELLING",
  "SALES_TRAINING",
  "TRAINING_MEDIA",
  "KNOWLEDGE_SEARCH",
  "OPERATIONS_LOGISTICS",
];

function extractEntities(query: string): IntentEntities {
  const q = String(query || "");
  const skus = [...new Set(q.match(/\b\d{4,7}\b/g) || [])];
  const products: string[] = [];
  const substrates: string[] = [];
  const categories: string[] = [];

  const productPatterns: [RegExp, string][] = [
    [/sikatop\s*seal\s*107|סיקה\s*טופ\s*107|סיקה\s*107/i, "SikaTop Seal 107"],
    [/monotop|מונוטופ/i, "Sika MonoTop"],
    [/שליכט/i, "שליכט"],
    [/פורצלן/i, "פורצלן"],
    [/80\s*[xX*×]\s*80|80\s*על\s*80/i, "פורצלן 80x80"],
    [/דבק\s*קרמיקה|דבק\s*פורצלן|דבק/i, "דבק אריחים"],
    [/סופרקריל|נירוקריל|בונדרול|צבע/i, "צבע"],
    [/איטום\s*גג|פוליגג|פוליאוריטני|ביטומנ/i, "איטום גגות"],
    [/גבס/i, "גבס"],
    [/גשר(?:י)?\s*קור|קלקר|רונדופן|xps|eps/i, "בידוד תרמי / גשרי קור"],
    [/sp|מולטיגול|פקס|צנרת|pvc/i, "צנרת ואביזרים"],
  ];

  for (const [re, label] of productPatterns) {
    if (re.test(q) && !products.includes(label)) products.push(label);
  }

  const substratePatterns: [RegExp, string][] = [
    [/ריצוף\s*קיים|קרמיקה\s*קיימת|אריח\s*קיים/i, "ריצוף קיים"],
    [/בטון/i, "בטון"],
    [/טיח/i, "טיח"],
    [/סיד/i, "סיד"],
    [/גג\s*שטוח|גג/i, "גג"],
    [/חדר\s*רטוב|מקלחת|אמבטיה/i, "חדר רטוב"],
    [/מרפסת/i, "מרפסת"],
    [/גבס/i, "קיר גבס"],
  ];

  for (const [re, label] of substratePatterns) {
    if (re.test(q) && !substrates.includes(label)) substrates.push(label);
  }

  const categoryPatterns: [RegExp, string][] = [
    [/איטום/i, "איטום"],
    [/דבק|ריצוף|פורצלן|קרמיקה/i, "דבקים וריצוף"],
    [/צבע|שליכט|פריימר/i, "צבע ושליכט"],
    [/בטון|ברזל\s*זיון|גשר/i, "שיקום ובידוד בטון"],
    [/גבס|ניצב|מסלול/i, "גבס וטיח"],
    [/צנרת|אינסטלציה/i, "צנרת ואביזרים"],
    [/מכיר|spin|לקוח|התנגדות|סימולצ/i, "הדרכת מכירות"],
  ];

  for (const [re, label] of categoryPatterns) {
    if (re.test(q) && !categories.includes(label)) categories.push(label);
  }

  let objectionType: string | undefined;
  if (/מחיר|יקר|זול|הנחה|מתחרה/i.test(q)) objectionType = "מחיר";
  else if (/משלים|למה\s*צריך|לא\s*רוצה\s*תוספת/i.test(q)) objectionType = "מוצר משלים";

  return { products, skus, substrates, categories, objectionType };
}

export function classifyIntentDeterministic(query: string): IntentClassification {
  const q = String(query || "").trim();
  const qLower = q.toLowerCase();
  const entities = extractEntities(q);

  const scores = new Map<CounterIntent, number>();
  for (const intent of ALL_INTENTS) scores.set(intent, 0);

  const bump = (intent: CounterIntent, val: number) => {
    scores.set(intent, (scores.get(intent) ?? 0) + val);
  };

  // 1. OPERATIONS_LOGISTICS (תעודות משלוח, פקדונות 60060/60002, איתוראן PTO, מנוף, חריגות)
  if (
    /תעודת?\s*משלוח|סטורנו|איתוראן|pto|מנוף|טכוגרף|רנטגן|notebooklm|נהג|פקדונות?|60060|60002|סיכום\s*יומי|חריגי\s*מנוף|משאית|gps|נתונים\s*זמינים/i.test(
      qLower,
    )
  ) {
    bump("OPERATIONS_LOGISTICS", 5);
  }

  // 2. TRAINING_MEDIA (סרטון הדרכה, מצגת הדרכה, וידאו)
  if (/סרטון|וידאו|מצגת|שקפים|וובינר/i.test(qLower) && !/notebooklm/i.test(qLower)) {
    bump("TRAINING_MEDIA", 4.5);
  }

  // 3. SALES_TRAINING (תרגול מכירה, סימולציה, מתנגד למחיר, SPIN, Challenger)
  if (
    /תרגול|סימולצי|אימון\s*מכיר|מתנגד\s*למחיר|התנגדות|spin|challenger|מכירה\s*ייעוצית|שחקי\s*את\s*הלקוח/i.test(
      qLower,
    )
  ) {
    bump("SALES_TRAINING", 4.4);
  }

  // 4. PRODUCT_COMPARISON (מה ההבדל בין, השוואה, מול)
  if (/מה\s*(?:הם\s*)?ה?הבדל|הבדלים|השוואה|לעומת|עדיף\s*בין|מול\s/i.test(qLower)) {
    bump("PRODUCT_COMPARISON", 4.2);
  }

  // 5. CROSS_SELLING (מוצרים משלימים, בנוסף, מה כדאי להציע עוד, מערכת שלמה)
  if (/בנוסף|משלימ|עוד\s*להציע|מה\s*צריך\s*ליד|אביזרים\s*נלווים|מערכת\s*שלמה|מתאימים\s*למערכת/i.test(qLower)) {
    bump("CROSS_SELLING", 4.2);
  }

  // 6. CUSTOMER_DIAGNOSIS (לקוח מבקש..., מה כדאי לשאול, אבחון, איזה מוצר מתאים)
  if (
    /לקוח\s*מבקש|מה\s*(?:כדאי|צריך)\s*לשאול|שאלות\s*אבחון|איך\s*לאבחן|מתלבט\s*איזה/i.test(
      qLower,
    )
  ) {
    bump("CUSTOMER_DIAGNOSIS", 4.1);
  } else if (/איזה\s*(?:דבק|צבע|חומר|איטום|לוח)\s*מתאים/i.test(qLower)) {
    bump("TECHNICAL_GUIDANCE", 3.2);
    bump("CUSTOMER_DIAGNOSIS", 2.8);
  }

  // 7. TECHNICAL_GUIDANCE (איך מיישמים, כיצד מונעים, תקן, מפרט, יישום, שכבות)
  if (
    /איך\s*מיישמים|אופן\s*יישום|כיצד\s*מונעים|מפרט\s*טכני|תקן|יחס\s*ערבוב|שכבות|תשתית|ייבוש|פורצלן|שיקום\s*בטון|גשרי\s*קור|sikatop/i.test(
      qLower,
    ) ||
    entities.products.length > 0
  ) {
    bump("TECHNICAL_GUIDANCE", 3.5);
  }

  // 8. KNOWLEDGE_SEARCH (חיפוש מקור, הצג מקור, איפה כתוב, מפרטים)
  if (/הצג\s*(?:את\s*)?ה?מקור|חפש|מצא\s*(?:לי)?\s*(?:מידע|מסמך|מקור)|מאגר\s*ידע|מפרט/i.test(qLower)) {
    bump("KNOWLEDGE_SEARCH", 3.0);
  }

  const ranked = [...scores.entries()]
    .filter(([, s]) => s > 0)
    .sort((a, b) => b[1] - a[1]);

  const primaryIntent: CounterIntent = ranked[0]?.[0] ?? "TECHNICAL_GUIDANCE";
  const topScore = ranked[0]?.[1] ?? 1;
  const secondaryIntents = ranked
    .slice(1)
    .filter(([, s]) => s >= 2.5)
    .map(([intent]) => intent)
    .slice(0, 3);

  const requiredContext: DiagnosisFieldKey[] = [];
  if (
    primaryIntent === "CUSTOMER_DIAGNOSIS" ||
    secondaryIntents.includes("CUSTOMER_DIAGNOSIS") ||
    primaryIntent === "TECHNICAL_GUIDANCE"
  ) {
    if (!entities.substrates.length) requiredContext.push("substrateType");
    if (!/פנים|חוץ|מרפסת|גג/i.test(qLower)) requiredContext.push("exposure");
    if (!/סדק|מתקלף|עובש|חדש|קיים/i.test(qLower)) requiredContext.push("substrateCondition");
  }

  const suggestedActions: ActionButtonKind[] = ["copy"];
  if (primaryIntent === "TECHNICAL_GUIDANCE" || primaryIntent === "PRODUCT_COMPARISON" || primaryIntent === "KNOWLEDGE_SEARCH") {
    suggestedActions.push("spec", "search");
  }
  if (primaryIntent === "TRAINING_MEDIA" || /סרטון|וידאו/i.test(qLower)) {
    suggestedActions.push("video");
  }
  if (/מצגת/i.test(qLower) || primaryIntent === "SALES_TRAINING") {
    suggestedActions.push("presentation");
  }
  if (primaryIntent === "CROSS_SELLING" || entities.categories.length > 0) {
    suggestedActions.push("system");
  }
  if (primaryIntent === "CUSTOMER_DIAGNOSIS" || requiredContext.length > 0) {
    suggestedActions.push("diagnosis");
  }
  if (primaryIntent === "SALES_TRAINING") {
    suggestedActions.push("simulation");
  }

  return {
    primaryIntent,
    secondaryIntents,
    confidence: Math.min(0.97, Math.max(0.55, topScore / 5)),
    entities,
    requiredContext: [...new Set(requiredContext)],
    suggestedActions: [...new Set(suggestedActions)],
    classificationMethod: "deterministic_rules",
    rationale: `סיווג ראשי: ${primaryIntent}${secondaryIntents.length ? ` · משני: ${secondaryIntents.join(", ")}` : ""}`,
  };
}

export type ModelIntentClassifierFn = (prompt: string) => Promise<Partial<IntentClassification> | null>;

/**
 * משלב סיווג דטרמיניסטי עם המודל הקיים (אם זמין בשרת), ללא תלות בלעדית בהתאמת מילים
 */
export async function classifyIntentHybrid(
  query: string,
  modelClassifier?: ModelIntentClassifierFn,
): Promise<IntentClassification> {
  const baseline = classifyIntentDeterministic(query);
  if (baseline.primaryIntent === "OPERATIONS_LOGISTICS" || !modelClassifier) {
    return baseline;
  }

  try {
    const aiResult = await modelClassifier(query);
    if (!aiResult || !aiResult.primaryIntent || !ALL_INTENTS.includes(aiResult.primaryIntent)) {
      return baseline;
    }
    const mergedSecondary = [
      ...new Set([
        ...(aiResult.secondaryIntents ?? []).filter((i) => ALL_INTENTS.includes(i) && i !== aiResult.primaryIntent),
        ...baseline.secondaryIntents.filter((i) => i !== aiResult.primaryIntent),
      ]),
    ].slice(0, 3);

    return {
      ...baseline,
      primaryIntent: aiResult.primaryIntent,
      secondaryIntents: mergedSecondary,
      confidence:
        typeof aiResult.confidence === "number" && aiResult.confidence > 0 && aiResult.confidence <= 1
          ? aiResult.confidence
          : Math.max(baseline.confidence, 0.85),
      entities: {
        products: [...new Set([...(aiResult.entities?.products ?? []), ...baseline.entities.products])],
        skus: [...new Set([...(aiResult.entities?.skus ?? []), ...baseline.entities.skus])],
        substrates: [...new Set([...(aiResult.entities?.substrates ?? []), ...baseline.entities.substrates])],
        categories: [...new Set([...(aiResult.entities?.categories ?? []), ...baseline.entities.categories])],
        objectionType: aiResult.entities?.objectionType || baseline.entities.objectionType,
      },
      classificationMethod: "model+rules",
      rationale: aiResult.rationale || baseline.rationale,
    };
  } catch {
    return baseline;
  }
}
