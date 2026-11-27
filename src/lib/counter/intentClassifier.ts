import {
  ActionButtonKind,
  CounterIntent,
  DiagnosisFieldKey,
  IntentClassification,
  IntentEntities,
} from './types';

const ALL_INTENTS: CounterIntent[] = [
  'TECHNICAL_GUIDANCE',
  'PRODUCT_COMPARISON',
  'CUSTOMER_DIAGNOSIS',
  'CROSS_SELLING',
  'SALES_TRAINING',
  'TRAINING_MEDIA',
  'KNOWLEDGE_SEARCH',
];

function extractEntities(query: string): IntentEntities {
  const q = query.trim();
  const products: string[] = [];
  const productPatterns: [RegExp, string][] = [
    [/sikatop(?:\s*seal)?\s*107|סיקה\s*(?:טופ\s*)?107/i, 'SikaTop Seal 107'],
    [/שליכט\s*(?:אקרילי|מינרלי|סיליקוני|צבעוני)?/i, 'שליכט'],
    [/סופרקריל|נירוקריל/i, 'צבע אקרילי'],
    [/בונדרול|פריימר/i, 'פריימר מקשר'],
    [/פוליגג|איטום\s*גג/i, 'איטום גג'],
    [/דבק\s*פורצלן|c2te|s1|תרמוקיר|מיסטר\s*פיקס/i, 'דבק פורצלן C2TE S1'],
    [/לוח(?:ות)?\s*גבס|גבס/i, 'מערכת גבס'],
    [/sp|מולטיגול|פקס/i, 'צנרת ואביזרים'],
  ];
  for (const [re, label] of productPatterns) {
    if (re.test(q) && !products.includes(label)) products.push(label);
  }

  const skus = Array.from(
    new Set((q.match(/\b\d{4,6}\b/g) ?? []).filter((n) => n !== '1045' && n !== '4004')),
  );

  const substrates: string[] = [];
  const substratePatterns: [RegExp, string][] = [
    [/ריצוף\s*קיים|קרמיקה\s*קיימת|אריח\s*קיים/i, 'ריצוף קיים'],
    [/בטון/i, 'בטון'],
    [/טיח/i, 'טיח'],
    [/גבס/i, 'גבס'],
    [/סיד/i, 'סיד ישן'],
    [/גג|מרפסת/i, 'גג / מרפסת'],
  ];
  for (const [re, label] of substratePatterns) {
    if (re.test(q) && !substrates.includes(label)) substrates.push(label);
  }

  const categories: string[] = [];
  const categoryPatterns: [RegExp, string][] = [
    [/איטום/i, 'איטום'],
    [/דבק|ריצוף|פורצלן|קרמיקה/i, 'דבקים וריצוף'],
    [/צבע|שליכט|פריימר/i, 'צבע ושליכט'],
    [/בטון|ברזל\s*זיון|גשר/i, 'שיקום ובידוד בטון'],
    [/גבס|ניצב|מסלול/i, 'גבס וטיח'],
    [/צנרת|אינסטלציה/i, 'צנרת ואביזרים'],
    [/מכיר|spin|לקוח|התנגדות|סימולצ/i, 'הדרכת מכירות'],
  ];
  for (const [re, label] of categoryPatterns) {
    if (re.test(q) && !categories.includes(label)) categories.push(label);
  }

  let objectionType: string | undefined;
  if (/מחיר|יקר|זול|הנחה|מתחרה/i.test(q)) objectionType = 'מחיר';
  else if (/משלים|למה\s*צריך|לא\s*רוצה\s*תוספת/i.test(q)) objectionType = 'מוצר משלים';

  return {products, skus, substrates, categories, objectionType};
}

export function classifyIntentDeterministic(query: string): IntentClassification {
  const q = String(query || '').trim();
  const qLower = q.toLowerCase();
  const entities = extractEntities(q);

  const scores = new Map<CounterIntent, number>();
  for (const intent of ALL_INTENTS) scores.set(intent, 0);

  const bump = (intent: CounterIntent, val: number) => {
    scores.set(intent, (scores.get(intent) ?? 0) + val);
  };

  if (/סרטון|וידאו|מצגת|שקפים|וובינר/i.test(qLower)) {
    bump('TRAINING_MEDIA', 4.5);
  }

  if (
    /תרגול|סימולצי|אימון\s*מכיר|מתנגד\s*למחיר|התנגדות|spin|challenger|מכירה\s*ייעוצית|שחקי\s*את\s*הלקוח/i.test(
      qLower,
    )
  ) {
    bump('SALES_TRAINING', 4.4);
  }

  if (/מה\s*(?:הם\s*)?ה?הבדל|הבדלים|השוואה|לעומת|עדיף\s*בין|מול\s/i.test(qLower)) {
    bump('PRODUCT_COMPARISON', 4.2);
  }

  if (
    /בנוסף|משלימ|עוד\s*להציע|מה\s*צריך\s*ליד|אביזרים\s*נלווים|מערכת\s*שלמה|מתאימים\s*למערכת/i.test(
      qLower,
    )
  ) {
    bump('CROSS_SELLING', 4.2);
  }

  if (/לקוח\s*מבקש|מה\s*(?:כדאי|צריך)\s*לשאול|שאלות\s*אבחון|איך\s*לאבחן|מתלבט\s*איזה/i.test(qLower)) {
    bump('CUSTOMER_DIAGNOSIS', 4.1);
  } else if (/איזה\s*(?:דבק|צבע|חומר|איטום|לוח)\s*מתאים/i.test(qLower)) {
    bump('TECHNICAL_GUIDANCE', 3.2);
    bump('CUSTOMER_DIAGNOSIS', 2.8);
  }

  if (
    /איך\s*מיישמים|אופן\s*יישום|כיצד\s*מונעים|מפרט\s*טכני|תקן|יחס\s*ערבוב|שכבות|תשתית|ייבוש|פורצלן|שיקום\s*בטון|גשרי\s*קור|sikatop/i.test(
      qLower,
    ) ||
    entities.products.length > 0
  ) {
    bump('TECHNICAL_GUIDANCE', 3.5);
  }

  if (/הצג\s*(?:את\s*)?ה?מקור|חפש|מצא\s*(?:לי)?\s*(?:מידע|מסמך|מקור)|מאגר\s*ידע|מפרט/i.test(qLower)) {
    bump('KNOWLEDGE_SEARCH', 3.0);
  }

  const ranked = [...scores.entries()]
    .filter(([, s]) => s > 0)
    .sort((a, b) => b[1] - a[1]);

  const primaryIntent: CounterIntent = ranked[0]?.[0] ?? 'TECHNICAL_GUIDANCE';
  const topScore = ranked[0]?.[1] ?? 1;
  const secondaryIntents = ranked
    .slice(1)
    .filter(([, s]) => s >= 2.5)
    .map(([intent]) => intent)
    .slice(0, 3);

  const requiredContext: DiagnosisFieldKey[] = [];
  if (
    primaryIntent === 'CUSTOMER_DIAGNOSIS' ||
    secondaryIntents.includes('CUSTOMER_DIAGNOSIS') ||
    primaryIntent === 'TECHNICAL_GUIDANCE'
  ) {
    if (!entities.substrates.length) requiredContext.push('substrateType');
    if (!/פנים|חוץ|מרפסת|גג/i.test(qLower)) requiredContext.push('exposure');
    if (!/סדק|מתקלף|עובש|חדש|קיים/i.test(qLower)) requiredContext.push('substrateCondition');
  }

  const suggestedActions: ActionButtonKind[] = ['copy'];
  if (
    primaryIntent === 'TECHNICAL_GUIDANCE' ||
    primaryIntent === 'PRODUCT_COMPARISON' ||
    primaryIntent === 'KNOWLEDGE_SEARCH'
  ) {
    suggestedActions.push('spec', 'search');
  }
  if (primaryIntent === 'TRAINING_MEDIA' || /סרטון|וידאו/i.test(qLower)) {
    suggestedActions.push('video');
  }
  if (/מצגת/i.test(qLower) || primaryIntent === 'SALES_TRAINING') {
    suggestedActions.push('presentation');
  }
  if (primaryIntent === 'CROSS_SELLING' || entities.categories.length > 0) {
    suggestedActions.push('system');
  }
  if (primaryIntent === 'CUSTOMER_DIAGNOSIS' || requiredContext.length > 0) {
    suggestedActions.push('diagnosis');
  }
  if (primaryIntent === 'SALES_TRAINING') {
    suggestedActions.push('simulation');
  }

  return {
    primaryIntent,
    secondaryIntents,
    confidence: Math.min(0.97, Math.max(0.55, topScore / 5)),
    entities,
    requiredContext: [...new Set(requiredContext)],
    suggestedActions: [...new Set(suggestedActions)],
    classificationMethod: 'deterministic_rules',
    rationale: `סיווג ראשי: ${primaryIntent}${secondaryIntents.length ? ` · משני: ${secondaryIntents.join(', ')}` : ''}`,
  };
}
