import {Product} from '../../types/product';
import {
  CitedSource,
  InteractiveActionButton,
  InteractiveAnswerCard,
  KnowledgeDocument,
  TrainingResource,
} from './types';

const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions/gi,
  /system\s*prompt/gi,
  /you\s+are\s+now/gi,
  /התעלם\s+מהוראות/gi,
  /הנחיות\s+מערכת/gi,
  /jailbreak/gi,
];

const APPROVED_INTERNAL_PATHS = ['/', '/product', '/chat'];

export function sanitizeUntrustedDocumentText(raw: string, maxLen = 2400): string {
  let clean = String(raw || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  for (const re of PROMPT_INJECTION_PATTERNS) {
    clean = clean.replace(re, '[תוכן חיצוני מסונן]');
  }
  return clean.slice(0, maxLen);
}

export function isSafePublicUrl(rawUrl: string): boolean {
  try {
    const trimmed = String(rawUrl || '').trim();
    if (!trimmed) return false;
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false;
    if (parsed.username || parsed.password) return false;
    const host = parsed.hostname.toLowerCase();
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '0.0.0.0' ||
      host === '::1' ||
      host === '[::1]' ||
      host.startsWith('169.254.') ||
      host.startsWith('10.') ||
      host.startsWith('192.168.') ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(host) ||
      host.startsWith('fc') ||
      host.startsWith('fd') ||
      host.startsWith('fe80:') ||
      host.endsWith('.local') ||
      host.endsWith('.internal')
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function isSafeInternalOrPublicHref(rawUrl?: string): boolean {
  if (!rawUrl) return false;
  const trimmed = rawUrl.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('/')) {
    const basePath = trimmed.split('?')[0].split('#')[0];
    return APPROVED_INTERNAL_PATHS.some(
      (allowed) => basePath === allowed || basePath.startsWith('/product/'),
    );
  }
  return isSafePublicUrl(trimmed);
}

export function validateSourcesHaveNoInventedLinks(
  sources: CitedSource[],
  actions: InteractiveActionButton[],
): {valid: boolean; invalidLinks: string[]} {
  const invalidLinks: string[] = [];
  const sourceUrls = new Set<string>();

  for (const s of sources) {
    for (const candidate of [s.url, s.fileUrl, s.videoUrl, s.presentationUrl]) {
      if (candidate) {
        if (!isSafeInternalOrPublicHref(candidate)) {
          invalidLinks.push(candidate);
        } else {
          sourceUrls.add(candidate);
        }
      }
    }
  }

  for (const act of actions) {
    if (!act.href) continue;
    if (!isSafeInternalOrPublicHref(act.href)) {
      invalidLinks.push(act.href);
      continue;
    }
    if (!act.href.startsWith('/') && !sourceUrls.has(act.href)) {
      invalidLinks.push(act.href);
    }
  }

  return {valid: invalidLinks.length === 0, invalidLinks};
}

export function isReliableTechnicalCard(card: InteractiveAnswerCard): boolean {
  if (card.sources.length === 0) {
    return (
      Boolean(card.missingSourceNotice) &&
      card.technicalFacts.length === 0 &&
      card.executionSteps.length === 0 &&
      !card.modelRecommendation
    );
  }
  return validateSourcesHaveNoInventedLinks(card.sources, card.actions).valid;
}

export const VERIFIED_KNOWLEDGE_DOCUMENTS: KnowledgeDocument[] = [
  {
    id: 'doc-sika-top-107',
    title: 'SikaTop Seal 107 — מפרט טכני והוראות יישום לאיטום צמנטי דו-רכיבי',
    category: 'איטום',
    manufacturer: 'Sika (סיקה ישראל)',
    product: 'SikaTop Seal 107',
    documentType: 'spec',
    language: 'he',
    url: 'https://isr.sika.com/he/construction/waterproofing/cementitious-waterproofing/sikatop-seal-107.html',
    fileUrl: 'https://isr.sika.com/he/construction/waterproofing/cementitious-waterproofing/sikatop-seal-107.html',
    videoUrl: 'https://www.youtube.com/results?search_query=SikaTop+Seal+107+application',
    pageNumber: 'גיליון מוצר רשמי (PDS)',
    sourceDate: '2025-11-01',
    verifiedAt: '2026-11-26',
    verificationStatus: 'verified',
    approvedBy: 'מחלקה טכנית ח. סבן',
    keywords: [
      'sikatop',
      'seal 107',
      'סיקה 107',
      'סיקה טופ 107',
      'איטום צמנטי',
      'איטום שלילי',
      'מאגר מים',
      'חדר רטוב',
      'מרתף',
    ],
    skus: ['107', 'SIKA107'],
    systemDomain: 'איטום חדרים רטובים',
    factSummary:
      'SikaTop Seal 107 הוא ציפוי איטום צמנטי דו-רכיבי (רכיב A נוזלי פולימרי + רכיב B אבקתי צמנטי) לאיטום חיובי ושלילי של בטון, מאגרי מים, מרתפים וחדרים רטובים.',
    steps: [
      'הכנת תשתית: ניקוי מלא מאבק, שמן, חלקים רופפים וצבע ישן; הרטבת בטון לרוויה ללא שלוליות מים עומדים (מצב SSD).',
      'ערבוב: שפיכת רכיב A (הנוזל) לכלי נקי, הוספת רכיב B (האבקה) תוך ערבול איטי עם מערבל מכני כ-3 דקות עד מרקם אחיד ללא גושים.',
      'יישום שכבה ראשונה במברשת קשיחה או מאלג׳, והמתנה להתייצבות לפני השכבה השנייה.',
      'יישום שכבה שנייה (ולעומס מים גבוה גם שכבה שלישית) בכיוון ניצב לשכבה הראשונה; בפינות חדר רטוב לשלב סרט איטום אלסטי ייעודי.',
    ],
    technicalData: [
      {label: 'יחס ערבוב (A:B)', value: 'לפי אריזת הסט התקנית (1:4 במשקל במערכת 25 ק״ג)'},
      {label: 'מספר שכבות נדרש', value: '2 שכבות לפחות (בשתי וערב)'},
      {label: 'צריכה מוערכת (למפרט רגיל)', value: 'כ-2.0 ק״ג/מ״ר לשכבה (כ-4 ק״ג/מ״ר לשתי שכבות)'},
      {label: 'מצב תשתית נדרש', value: 'בטון נקי, יציב ולח ברוויה ללא מים עומדים (SSD)'},
    ],
  },
  {
    id: 'doc-render-comparison',
    title: 'מדריך השוואתי: שליכט אקרילי, שליכט מינרלי ושליכט סיליקוני לחזיתות',
    category: 'צבע ושליכט',
    manufacturer: 'טמבור / נירלט / כרמית מיסטר פיקס (מאגר משווה ח. סבן)',
    product: 'שליכט צבעוני / מינרלי / סיליקוני',
    documentType: 'comparison',
    language: 'he',
    url: 'https://tambour.co.il/guides/exterior-plaster-guide',
    presentationUrl: '/chat?topic=render-comparison',
    pageNumber: 'סעיף 2–4',
    sourceDate: '2025-09-15',
    verifiedAt: '2026-11-26',
    verificationStatus: 'verified',
    approvedBy: 'מחלקה טכנית ח. סבן',
    keywords: [
      'שליכט',
      'אקרילי',
      'מינרלי',
      'סיליקוני',
      'שליכט צבעוני',
      'הבדל בין סוגי השליכט',
      'חזית',
      'גמר חוץ',
      'נשימת קיר',
    ],
    skus: [],
    systemDomain: 'צביעה וגמר',
    factSummary:
      'הבחירה בין שליכט אקרילי (גמיש ודוחה מים), שליכט מינרלי (נושם לחזיתות) ושליכט סיליקוני (שילוב גמישות, ניקוי עצמי ונשימת אדים) נקבעת לפי תשתית וחשיפה.',
    steps: [
      'בדיקת תשתית החזית: טיח צמנטי יבש ומאוורר, בדיקת לחות כלואה ומצב קיר קיים.',
      'יישום יסוד/פריימר מקשר מגוון התואם לסוג השליכט הנבחר.',
      'מריחה במאלג׳ נירוסטה ועיבוד במאלג׳ פלסטיק בתנועות אחידות באותו כיוון.',
    ],
    technicalData: [
      {label: 'שליכט אקרילי', value: 'גמישות טובה, דוחה מים, קל ליישום ותיקוני גוון; חדירות אדים בינונית'},
      {label: 'שליכט מינרלי', value: 'מבוסס צמנט/סיד, נשימת קיר מקסימלית וגוון טבעי; ספיגות גבוהה יותר ללא סילר'},
      {label: 'שליכט סיליקוני', value: 'דחיית מים ולכלוך (Self-cleaning) לצד נשימת אדים גבוהה — מומלץ לאזורי חוף וזיהום אוויר'},
      {label: 'גודל גרגר נפוץ', value: 'M100 / M150 / M200 בהתאם לעובי המרקם הנדרש במפרט'},
    ],
  },
  {
    id: 'doc-thermal-bridges',
    title: 'מניעת גשרי קור ברכיבי בטון ושלד — ת״י 1045 ומדריכי בידוד',
    category: 'שיקום ובידוד בטון',
    manufacturer: 'מכון התקנים הישראלי / מערכות בידוד תרמי (ת״י 1045)',
    product: 'לוחות קל-קר / פוליסטירן מוקצף EPS-XPS וטיח תרמי',
    documentType: 'research',
    language: 'he',
    url: 'https://www.sii.org.il/',
    pageNumber: 'ת״י 1045 עקרונות גשרי קור',
    sourceDate: '2024-08-01',
    verifiedAt: '2026-11-26',
    verificationStatus: 'verified',
    approvedBy: 'מחלקה טכנית ח. סבן',
    keywords: [
      'גשרי קור',
      'גשר קור',
      'בטון',
      'בידוד תרמי',
      'עיבוי',
      'עובש',
      'טיח תרמי',
      'רנדופן',
      'פוליסטירן',
      '1045',
    ],
    skus: [],
    systemDomain: 'טיח',
    factSummary:
      'גשר קור נוצר בעמודי בטון, קורות וחגורות שבהם ההולכה התרמית גבוהה מיתר הקיר; מניעתו מבוססת על רציפות בידוד חיצוני (EPS/XPS או טיח תרמי לפי ת״י 1045).',
    steps: [
      'זיהוי רכיבי השלד החשופים (עמודים, קורות, קצות תקרה וחגורות בטון).',
      'עיגון מכני והדבקה של לוחות בידוד (EPS / XPS / רונדופן) על גבי רכיב הבטון לפני שלב הטיח, או יישום מערכת טיח תרמי מלאה.',
      'פריסת רשת אינטרגלס בשכבת היסוד במעבר בין הבטון לבלוק כדי למנוע סדיקה תרמית בין חומרים שונים.',
    ],
    technicalData: [
      {label: 'תקן מחייב בישראל', value: 'ת״י 1045 — בידוד תרמי של בניינים'},
      {label: 'תוצאת גשר קור לא מטופל', value: 'קיר פנים קר בחורף, עיבוי לחות והתפתחות עובש'},
      {label: 'חומרי בידוד מקובלים', value: 'פוליסטירן מוקצף/משוחל (EPS/XPS), צמר סלעים או טיח תרמי מוסמך'},
      {label: 'אביזר מערכת חיוני', value: 'דיבלים לבידוד + רשת פיברגלס בממשק בטון-בלוק'},
    ],
  },
  {
    id: 'doc-porcelain-tile-on-tile',
    title: 'הנחיות להדבקת אריחי גרניט פורצלן (כולל 80x80) על ריצוף קיים',
    category: 'דבקים וריצוף',
    manufacturer: 'כרמית מיסטר פיקס / סיקה / תרמוקיר (ת״י 4004)',
    product: 'דבק צמנטי גמיש C2TE S1',
    documentType: 'application_guide',
    language: 'he',
    url: 'https://www.mr-fix.co.il/',
    pageNumber: 'הנחיית הדבקה על אריח קיים',
    sourceDate: '2025-07-01',
    verifiedAt: '2026-11-26',
    verificationStatus: 'verified',
    approvedBy: 'מחלקה טכנית ח. סבן',
    keywords: [
      'פורצלן',
      '80x80',
      '80 על 80',
      'ריצוף קיים',
      'הדבקה על ריצוף',
      'אריחים',
      'דבק פורצלן',
      'c2te',
      's1',
      'קרמיקה',
    ],
    skus: [],
    systemDomain: 'הדבקת אריחים',
    factSummary:
      'להדבקת אריחי גרניט פורצלן 80x80 על ריצוף קיים נדרש דבק צמנטי משופר וגמיש בתקן C2TE S1 (או S2 בחוץ), לאחר ניקוי ויישום מקשר תשתית ייעודי והדבקה דו-צדדית.',
    steps: [
      'בדיקת יציבות האריחים הקיימים: הקשה וזיהוי אריחים חלולים/רופפים ותיקונם מראש.',
      'ניקוי יסודי משומנים ושאריות פוליש/וקס (שטיפה והסרת ברק לפי הנחיית היצרן).',
      'יישום חומר מקשר (פריימר עם אגרגט / מקשר לתשתית בלתי סופגת) בהתאם להנחיית יצרן הדבק.',
      'הדבקה בשיטת מריחה כפולה (Double Buttering): מריחה במאלג׳ משונן על התשתית ובשכבה דקה בגב האריח, בתוספת מרווחים וקליפסים לפילוס.',
    ],
    technicalData: [
      {label: 'תקן דבק נדרש (פנים)', value: 'C2TE S1 לפחות (ת״י 4004 / EN 12004)'},
      {label: 'חוץ / חזית / מרפסת שמש', value: 'נדרש דרגת גמישות מוגברת (C2TE S1 / S2 לפי שטח וגובה)'},
      {label: 'טכניקת מריחה מומלצת ב-80x80', value: 'מריחה כפולה לכיסוי מלא (מעל 90%-95%) ללא כיסי אוויר'},
      {label: 'ציוד נדרש במערכת', value: 'פריימר מקשר לתשתית חלקה, קליפסים/יתדות פילוס ומאלג׳ משונן מתאים'},
    ],
  },
  {
    id: 'doc-paint-diagnosis',
    title: 'פרוטוקול ייעוץ וצביעה בדלפק — התאמת צבע לתשתית ודרישות הלקוח',
    category: 'צבע ושליכט',
    manufacturer: 'אקדמיית המכירות והידע ח. סבן',
    product: 'סופרקריל / נירוקריל / בונדרול סופר / צבע נגד עובש',
    documentType: 'qa',
    language: 'he',
    url: '/',
    pageNumber: 'מדריך דלפק צבע',
    sourceDate: '2026-01-10',
    verifiedAt: '2026-11-26',
    verificationStatus: 'verified',
    approvedBy: 'מחלקה טכנית ח. סבן',
    keywords: [
      'לקוח מבקש צבע',
      'צבע',
      'אבחון צבע',
      'סופרקריל',
      'בונדרול',
      'קיר פנים',
      'קיר חוץ',
      'עובש',
      'מתקלף',
      'סיד',
    ],
    skus: [],
    systemDomain: 'צביעה וגמר',
    factSummary:
      'התאמת הצבע נקבעת לפי 4 משתני שטח: מיקום (פנים יבש / חדר רטוב / חוץ), סוג התשתית (סיד, אקרילי, שפכטל חדש או בטון), מצב התשתית (קילוף או עובש), ודרישת הרחיצות.',
    steps: [
      'אם הקיר צבוע בסיד ישן, שפכטל חדש או מתפורר — חובה ליישם מקשר (בונדרול) לפני צבע אקרילי.',
      'אם יש כתמי עובש באמבטיה — יש לחטא, להמתין לייבוש מלא וליישם צבע ייעודי נושם ומונע עובש.',
      'בקיר חוץ — נדרש צבע חוץ גמיש/עמיד UV ולא צבע פנים רגיל.',
    ],
    technicalData: [
      {label: 'חדר יבש (פנים)', value: 'צבע אקרילי איכותי (מט/משי לפי דרישת ניקוי)'},
      {label: 'תשתית סיד / תיקוני שפכטל', value: 'חובת יסוד מקשר (בונדרול סופר) למניעת התקלפות'},
      {label: 'חדר רטוב / אמבטיה', value: 'צבע אקרילי נושם עם תוסף נגד עובש'},
    ],
  },
  {
    id: 'doc-roof-waterproofing-video',
    title: 'סרטון הדרכה והסבר שטח: הכנת גג שטוח ויישום איטום אקרילי / פוליאוריטני',
    category: 'איטום',
    manufacturer: 'מערך הדרכה ח. סבן / יצרני האיטום',
    product: 'פוליגג / מערכת איטום פוליאוריטנית',
    documentType: 'video',
    language: 'he',
    url: 'https://www.youtube.com/results?search_query=%D7%90%D7%99%D7%98%D7%95%D7%9D+%D7%92%D7%92%D7%95%D7%AA+%D7%94%D7%93%D7%A8%D7%9B%D7%94',
    videoUrl: 'https://www.youtube.com/results?search_query=%D7%90%D7%99%D7%98%D7%95%D7%9D+%D7%92%D7%92%D7%95%D7%AA+%D7%94%D7%93%D7%A8%D7%9B%D7%94',
    pageNumber: 'וידאו הדרכה — פרק איטום גגות',
    sourceDate: '2025-10-20',
    verifiedAt: '2026-11-26',
    verificationStatus: 'verified',
    approvedBy: 'מחלקת הדרכה ח. סבן',
    keywords: [
      'סרטון',
      'סרטון הדרכה',
      'וידאו',
      'איטום גגות',
      'גג שטוח',
      'פוליגג',
      'פוליאוריטני',
      'מים עומדים',
    ],
    skus: [],
    systemDomain: 'איטום גגות',
    factSummary:
      'מדריך וידאו לשטיפה, אבחון מים עומדים, שיקום רולקות בפריפריה ובחירת איטום אקרילי מול פוליאוריטני עמיד במים עומדים.',
    steps: [
      'בדיקת שיפועים וניקוזים בגג ואבחון האם קיימים אזורים עם מים עומדים.',
      'ניקוי בלחץ מים, טיפול ברולקות ובחיבורי קולטנים עם רשת אינטרגלס.',
      'התאמת שכבת היסוד (פריימר) לתשתית הקיימת (בטון, זפת ישנה או יריעות).',
    ],
    technicalData: [
      {label: 'ציפוי אקרילי אלסטומרי', value: 'מתאים לגגות משופעים ללא מים עומדים ממושכים'},
      {label: 'ציפוי פוליאוריטני / היברידי', value: 'נדרש כאשר יש סיכון למים עומדים או שלוליות בגג'},
    ],
  },
  {
    id: 'doc-consultative-sales-presentation',
    title: 'מצגת הדרכה לדלפק: מכירה ייעוצית, SPIN Selling וטיפול בהתנגדות מחיר',
    category: 'הדרכת מכירות',
    manufacturer: 'אקדמיית ח. סבן חומרי בניין',
    product: 'תכנית הכשרת נציגי דלפק',
    documentType: 'presentation',
    language: 'he',
    url: '/chat?topic=sales-presentation',
    presentationUrl: '/chat?topic=sales-presentation',
    pageNumber: 'שקופיות 1–18',
    sourceDate: '2026-02-01',
    verifiedAt: '2026-11-26',
    verificationStatus: 'verified',
    approvedBy: 'הנהלה והדרכה ח. סבן',
    keywords: [
      'מצגת',
      'מצגת הדרכה',
      'מכירה ייעוצית',
      'spin',
      'challenger',
      'התנגדות מחיר',
      'הכשרת נציגים',
      'שקפים',
    ],
    skus: [],
    factSummary:
      'מצגת הדרכה המלמדת נציגי דלפק לעבור ממתן מחיר מהיר על שק/דלי לאבחון צרכים (SPIN), הצגת תובנת מערכת (Challenger) והצעת מוצרים משלימים בצורה שקופה.',
    steps: [
      'שלב 1 — פתיחה ואבחון: שאלת המצב והשימוש (Situation) לפני שליפת מוצר מהמדף.',
      'שלב 2 — חשיפת סיכון או צורך (Problem / Implication) בשפה מקצועית ולא מפחידה.',
      'שלב 3 — התאמת מערכת שלמה (System Selling): הסבר מבוסס מפרט מדוע פריימר/סרט/כלי יישום נדרשים לתוצאה.',
      'שלב 4 — טיפול בהתנגדות מחיר: השוואת עלות תיקון חוזר מול השקעה נכונה בפעם הראשונה.',
    ],
    technicalData: [
      {label: 'מודל SPIN', value: 'Situation -> Problem -> Implication -> Need-payoff'},
      {label: 'מודל Challenger', value: 'Teach (ללמד תובנה) · Tailor (להתאים לסוג קבלן/פרטי) · Take Control'},
    ],
  },
  {
    id: 'doc-concrete-rehab',
    title: 'מפרט עקרוני לשיקום בטון וחשיפת ברזל זיון (פסיבציה + מלט שיקום)',
    category: 'שיקום ובידוד בטון',
    manufacturer: 'Sika / כרמית / אקדמיית ח. סבן (EN 1504)',
    product: 'מוצר פסיבציה לברזל + מלט שיקום קונסטרוקטיבי',
    documentType: 'application_guide',
    language: 'he',
    url: 'https://isr.sika.com/',
    pageNumber: 'תהליך שיקום תלת-שלבי',
    sourceDate: '2025-05-01',
    verifiedAt: '2026-11-26',
    verificationStatus: 'verified',
    approvedBy: 'מחלקה טכנית ח. סבן',
    keywords: ['שיקום בטון', 'ברזל חשוף', 'ברזל זיון', 'חלודה', 'פסיבציה', 'monotop', 'עמוד בטון'],
    skus: [],
    systemDomain: 'שיקום בטון',
    factSummary:
      'שיקום בטון עם ברזל חשוף מחייב חשיפה והסרת חלודה מהברזל, צביעה בחומר פסיבציה אנטי-קורוזיבי ושיקום במלט שיקום תקני (EN 1504) ולא במלט רגיל.',
    steps: [
      'חציבה והסרת כל הבטון הרופף והחלודה מסביב למוט הברזל.',
      'מריחת שתי שכבות חומר פסיבציה והגנה מקורוזיה על הברזל החשוף.',
      'הרטבת הבטון ויישום שכבת קישור/מלט שיקום ייעודי לעובי הנדרש.',
    ],
    technicalData: [
      {label: 'תקן בינלאומי למערכת', value: 'EN 1504 — שיקום והגנת מבני בטון'},
      {label: 'שלב חובה ראשון על הברזל', value: 'ניקוי מכני מלא + שכבת פסיבציה למניעת התחדשות חלודה'},
    ],
  },
  {
    id: 'doc-drywall-system',
    title: 'מפרט מערכת גבס (לוחות, פרופילי פח, ברגים, שפכטל וסרט שריון)',
    category: 'גבס וטיח',
    manufacturer: 'אורבונד / טמבור גבס / מאגר ח. סבן',
    product: 'לוחות גבס לבן / ירוק (נגד לחות) / ורוד (עמיד אש)',
    documentType: 'catalog',
    language: 'he',
    url: '/',
    pageNumber: 'מפרט מערכות גבס',
    sourceDate: '2025-12-01',
    verifiedAt: '2026-11-26',
    verificationStatus: 'verified',
    approvedBy: 'מחלקה טכנית ח. סבן',
    keywords: ['גבס', 'לוח גבס', 'ירוק', 'ורוד', 'מסלול', 'ניצב', 'שפכטל', 'סרט שריון', 'בורג גבס'],
    skus: [],
    systemDomain: 'גבס',
    factSummary:
      'בחירת לוח גבס תלויה בסוג החלל: לבן לחללים יבשים, ירוק לחדרים לחים ורוד לדרישות אש; שלמות הקיר מחייבת פרופילי פח, ברגי גבס, סרט חיזוק ושפכטל לחיבורים.',
    steps: [
      'קיבוע מסלולים לרצפה ולתקרה והצבת ניצבים במרווחים תקניים.',
      'חיבור הלוחות בברגי פח-גבס מתאימים (פח דק מול פח עבה).',
      'טיפול בתפרים עם סרט שריון (נייר/רשת פיבר) ומילוי בשפכטל במספר ידיים עד החלקה.',
    ],
    technicalData: [
      {label: 'לוח ירוק (עמיד לחות)', value: 'חובה בחדרי רחצה, שירותים וקירות סמוכים למקור מים'},
      {label: 'מניעת סדיקה בתפרים', value: 'חובה לשלב סרט חיזוק יחד עם מרק/שפכטל גבס'},
    ],
  },
  {
    id: 'doc-plumbing-fittings',
    title: 'התאמת מערכות צנרת ואביזרים (מולטיגול / SP / פקס / ניקוז PVC)',
    category: 'צנרת ואביזרים',
    manufacturer: 'מצרפלס / גולן פלסטיק / מדריך ח. סבן',
    product: 'צנרת רב-שכבתית ומחברים תואמים',
    documentType: 'catalog',
    language: 'he',
    url: '/',
    pageNumber: 'מדריך תאימות אביזרים',
    sourceDate: '2025-10-01',
    verifiedAt: '2026-11-26',
    verificationStatus: 'verified',
    approvedBy: 'מחלקה טכנית ח. סבן',
    keywords: ['צנרת', 'אינסטלציה', 'sp', 'מולטיגול', 'פקס', 'ניקוז', 'טפלון', 'אביזרים', 'צינור'],
    skus: [],
    systemDomain: 'צנרת ואביזרים',
    factSummary:
      'במערכות צנרת לחץ חובה לשמור על תאימות יצרן מלאה בין קוטר הצינור, עובי הדופן וסוג המחבר (SP / מולטיגול / פקסגול) ולהשתמש באטמים וטפלון תקניים בהברגות.',
    steps: [
      'זיהוי סוג הצנרת הקיים באתר וקוטר מדויק (מ״מ / צול) לפני בחירת מחברים.',
      'חיתוך ישר וניקוי גרדים (קליברציה) לפני הכנסת המחבר.',
      'בדיקת אטימות בלחץ עבודה לפני סגירת קיר או ריצוף.',
    ],
    technicalData: [
      {label: 'כלל בטיחות מערכת', value: 'אסור לערבב מחברי לחיצה של מותג אחד עם צינור במפרט עובי דופן שונה'},
      {label: 'איטום הברגות מתכת', value: 'סרט טפלון צפוף או חוט אטימה ייעודי לפי קוטר ולחץ'},
    ],
  },
];

export const TRAINING_RESOURCES: TrainingResource[] = [
  {
    id: 'tr-sales-consultative',
    title: 'שיטות מכירה בדלפק: ממכירת שק למענה מערכתי',
    category: 'שיטות מכירה',
    format: 'presentation',
    description: 'איך להקשיב לצורך הלקוח, לשאול לפני ששולפים מחיר, ולהגדיל אמון ומכירה מערכתית.',
    sourceId: 'doc-consultative-sales-presentation',
    url: '/chat?topic=sales-presentation',
    recommendedQuery: 'מצא מצגת הדרכה בנושא מכירה ייעוצית.',
  },
  {
    id: 'tr-spin-selling',
    title: 'יישום SPIN Selling בחומרי בניין',
    category: 'SPIN Selling',
    format: 'document',
    description: '4 שלבי השאלות (Situation, Problem, Implication, Need-payoff) בדוגמאות של איטום, ריצוף וצבע.',
    sourceId: 'doc-consultative-sales-presentation',
    url: '/chat?topic=spin-selling',
    recommendedQuery: 'תן דוגמאות לשאלות SPIN בדלפק חומרי בניין',
  },
  {
    id: 'tr-diagnosis-paint',
    title: 'אבחון צורכי לקוח בצבע ושליכט (שאלה אחת בכל פעם)',
    category: 'אבחון צורכי לקוח',
    format: 'qa',
    description: 'פרוטוקול אבחון מדויק: פנים/חוץ, תשתית סיד/טיח, מצב קילוף או עובש.',
    sourceId: 'doc-paint-diagnosis',
    url: '/',
    recommendedQuery: 'לקוח מבקש צבע – אילו שאלות אבחון לשאול?',
  },
  {
    id: 'tr-objection-price',
    title: 'סימולציית טיפול בהתנגדות מחיר מול קבלן',
    category: 'טיפול בהתנגדויות',
    format: 'simulation',
    description: 'תרגול Challenger Sale מול לקוח שאומר "במקום אחר זול יותר" בלי להוריד מחיר אוטומטית.',
    sourceId: 'doc-consultative-sales-presentation',
    url: '/chat',
    recommendedQuery: 'בצע סימולציה עם לקוח שמתנגד למחיר.',
  },
  {
    id: 'tr-cross-sell-systems',
    title: 'מכירה משלימה מבוססת מפרט (פריימרים, רשתות, דבקים)',
    category: 'מכירה משלימה',
    format: 'practice',
    description: 'רשימת התאמות מערכת ב-8 תחומים בלי הפחדה ובשקיפות מלאה מול הלקוח.',
    sourceId: 'doc-sika-top-107',
    url: '/',
    recommendedQuery: 'אילו מוצרים משלימים מתאימים למערכת איטום?',
  },
  {
    id: 'tr-sealing-sika107',
    title: 'איטום צמנטי דו-רכיבי — SikaTop Seal 107',
    category: 'ידע במוצרי איטום',
    format: 'document',
    description: 'הכנת שטח SSD, ערבוב A+B, יישום שתי שכבות בשתי וערב ופינות חדרים רטובים.',
    sourceId: 'doc-sika-top-107',
    url: 'https://isr.sika.com/he/construction/waterproofing/cementitious-waterproofing/sikatop-seal-107.html',
    recommendedQuery: 'איך מיישמים SikaTop Seal 107?',
  },
  {
    id: 'tr-sealing-roof-video',
    title: 'סרטון הדרכה: איטום גגות שטוחים ואבחון מים עומדים',
    category: 'ידע במוצרי איטום',
    format: 'video',
    description: 'מתי אקרילי ומתי פוליאוריטני, הכנת רולקות וחיזוק ברשת אינטרגלס.',
    sourceId: 'doc-roof-waterproofing-video',
    url: 'https://www.youtube.com/results?search_query=%D7%90%D7%99%D7%98%D7%95%D7%9D+%D7%92%D7%92%D7%95%D7%AA+%D7%94%D7%93%D7%A8%D7%9B%D7%94',
    recommendedQuery: 'מצא סרטון הדרכה על איטום גגות.',
  },
  {
    id: 'tr-tiling-80x80',
    title: 'דבקים וריצוף: פורצלן 80x80 והדבקה על ריצוף קיים',
    category: 'דבקים וריצוף',
    format: 'document',
    description: 'בחירת דבק C2TE S1/S2, מקשר לתשתית חלקה ומריחה כפולה.',
    sourceId: 'doc-porcelain-tile-on-tile',
    url: 'https://www.mr-fix.co.il/',
    recommendedQuery: 'איזה דבק מתאים להדבקת פורצלן על ריצוף קיים?',
  },
  {
    id: 'tr-renders-compare',
    title: 'צבע ושליכט: השוואת אקרילי, מינרלי וסיליקוני',
    category: 'צבע ושליכט',
    format: 'document',
    description: 'הבדלים בנשימת קיר, גמישות, סביבת ים ואופן הכנת החזית.',
    sourceId: 'doc-render-comparison',
    url: 'https://tambour.co.il/guides/exterior-plaster-guide',
    recommendedQuery: 'מהם ההבדלים בין סוגי השליכט?',
  },
  {
    id: 'tr-drywall-plaster',
    title: 'מערכות גבס וטיח ומניעת גשרי קור',
    category: 'גבס וטיח',
    format: 'document',
    description: 'הבדלי לוחות גבס (לבן/ירוק/ורוד), רכיבי קיר ות״י 1045 בגשרי קור.',
    sourceId: 'doc-thermal-bridges',
    url: 'https://www.sii.org.il/',
    recommendedQuery: 'כיצד מונעים גשרי קור בבטון?',
  },
  {
    id: 'tr-concrete-rehab',
    title: 'שיקום בטון וברזל חשוף — מערכת תלת-שלבית',
    category: 'שיקום בטון',
    format: 'document',
    description: 'חציבה, פסיבציה לברזל ומלט שיקום לפי EN 1504.',
    sourceId: 'doc-concrete-rehab',
    url: 'https://isr.sika.com/',
    recommendedQuery: 'איך משקמים בטון עם ברזל חשוף?',
  },
  {
    id: 'tr-customer-service',
    title: 'שירות לקוחות בדלפק והצעות מערכת שקופות',
    category: 'שירות לקוחות',
    format: 'qa',
    description: 'שקיפות מלאה ללקוח, טיפול בתקלות יישום בלי האשמה והפנייה ליועץ טכני במקרי קצה.',
    sourceId: 'doc-consultative-sales-presentation',
    url: '/',
    recommendedQuery: 'איך מציגים ללקוח מוצר משלים בצורה שירותית ושקופה?',
  },
];

const HEBREW_STOP_WORDS = new Set([
  'את', 'של', 'על', 'עם', 'אל', 'לא', 'כן', 'כמה', 'מה', 'איך', 'כיצד', 'איזה',
  'אילו', 'מתי', 'איפה', 'שלי', 'שלו', 'שלה', 'היא', 'הוא', 'זה', 'זאת', 'אלה',
  'כל', 'בין', 'כדי', 'לפי', 'או', 'אם', 'גם', 'רק', 'עד', 'ללא', 'זמן', 'מוצר',
  'חומר', 'חברה', 'קיים', 'קיימת', 'מתאים', 'מתאימים', 'למערכת', 'עליו',
]);

function tokenize(text: string): string[] {
  return String(text || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}._-]+/gu, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 2 && !HEBREW_STOP_WORDS.has(t));
}

function extractExplicitModelTokens(query: string): string[] {
  return String(query || '').match(/\b[A-Za-z]{2,}[-_]?\d{2,}[A-Za-z0-9-]*\b/g) || [];
}

function scoreMatch(tokens: string[], haystack: string, boostExact = false): number {
  if (!tokens.length) return 0;
  const hay = haystack.toLowerCase();
  let score = 0;
  for (const t of tokens) {
    if (hay.includes(t)) {
      const escaped = t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const isExact =
        boostExact &&
        new RegExp(`(?<![\\p{L}\\p{N}])${escaped}(?![\\p{L}\\p{N}])`, 'iu').test(hay);
      score += isExact ? 3 : 1.5;
    }
  }
  return score / tokens.length;
}

// Note: Never expose prices, discounts, or currency values on counter/shelf items.
function catalogProductToDoc(item: Product): KnowledgeDocument {
  const steps: string[] = [];
  if (item.techSpec) steps.push(item.techSpec);
  if (item.deposit) steps.push(`אריזה ופיקדון: ${item.deposit}`);
  if (item.warehouse) steps.push(`זמינות סניף: ${item.warehouse}`);

  const technicalData: {label: string; value: string}[] = [
    {label: 'מק״ט רשמי', value: item.sku},
    {label: 'קטגוריה לוגיסטית', value: item.category || 'חומרי בניין'},
  ];
  if (item.unit) technicalData.push({label: 'יחידת מידה', value: item.unit});
  if (item.weightKg != null) technicalData.push({label: 'משקל יחידה', value: `${item.weightKg} ק״ג`});
  if (item.warehouse) technicalData.push({label: 'מחסן מקור', value: item.warehouse});
  if (item.deposit) technicalData.push({label: 'פיקדון / אריזה', value: item.deposit});

  const safeManufacturerUrl =
    item.manufacturerUrl && isSafePublicUrl(item.manufacturerUrl) ? item.manufacturerUrl : null;

  return {
    id: `sheet-sku-${item.sku}`,
    title: `${item.name} (מק״ט ${item.sku}) — מילון_לוגיסט`,
    category: item.category || 'מילון לוגיסטי',
    manufacturer: 'קטלוג ח. סבן / מילון_לוגיסט',
    product: item.name,
    documentType: safeManufacturerUrl ? 'product_page' : 'catalog',
    language: 'he',
    url: safeManufacturerUrl || `/product/${encodeURIComponent(item.sku)}`,
    pageNumber: `מק״ט ${item.sku} · ${item.warehouse}`,
    sourceDate: new Date().toISOString().slice(0, 10),
    verifiedAt: new Date().toISOString().slice(0, 10),
    verificationStatus: 'sheet_live',
    approvedBy: 'מילון_לוגיסט (גיליון חי)',
    keywords: [
      item.sku,
      item.name,
      item.category,
      ...item.keywords.split(/[,|]+/).map((s) => s.trim()),
    ].filter(Boolean),
    skus: [item.sku],
    factSummary:
      item.techSpec || `${item.name} — מק״ט ${item.sku} (${item.category || 'כללי'})`,
    steps,
    technicalData,
  };
}

export interface KnowledgeSearchResult {
  documents: KnowledgeDocument[];
  matchedProducts: Product[];
}

export function searchKnowledgeWithCatalog(
  query: string,
  catalogProducts: Product[] = [],
  options?: {limit?: number},
): KnowledgeSearchResult {
  const limit = Math.min(Math.max(options?.limit ?? 4, 1), 8);
  const tokens = tokenize(query);
  const qLower = query.toLowerCase();
  const explicitModels = extractExplicitModelTokens(query);

  const scoredStatic = VERIFIED_KNOWLEDGE_DOCUMENTS.map((doc) => {
    const coreHay = [
      doc.title,
      doc.product,
      doc.category,
      doc.manufacturer,
      ...doc.keywords,
      ...doc.skus,
    ].join(' ');
    const hay = [coreHay, doc.factSummary, ...doc.steps].join(' ');
    const hasCoreKeywordHit =
      tokens.some((t) => coreHay.toLowerCase().includes(t)) ||
      doc.keywords.some((kw) => qLower.includes(kw.toLowerCase()));
    const matchesExplicitModel =
      explicitModels.length === 0 ||
      explicitModels.some((m) => hay.toLowerCase().includes(m.toLowerCase()));

    let score = scoreMatch(tokens, hay, true);
    if (doc.keywords.some((kw) => qLower.includes(kw.toLowerCase()))) score += 1.4;
    if (doc.product && qLower.includes(doc.product.toLowerCase())) score += 2.0;
    if (!hasCoreKeywordHit || !matchesExplicitModel) score = 0;
    return {doc, score};
  })
    .filter((x) => x.score >= 0.65)
    .sort((a, b) => b.score - a.score);

  const matchedProducts = catalogProducts
    .map((p) => {
      const hay = `${p.sku} ${p.name} ${p.category} ${p.keywords} ${p.techSpec}`;
      const matchesExplicitModel =
        explicitModels.length === 0 ||
        explicitModels.some((m) => hay.toLowerCase().includes(m.toLowerCase()));
      let score = scoreMatch(tokens, hay, true);
      if (p.sku && qLower.includes(p.sku.toLowerCase())) score += 3;
      if (!matchesExplicitModel) score = 0;
      return {p, score};
    })
    .filter((x) => x.score >= 0.55)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((x) => x.p);

  const sheetDocs = matchedProducts.map(catalogProductToDoc);
  const documents = [...scoredStatic.map((s) => s.doc), ...sheetDocs].slice(0, limit);
  return {documents, matchedProducts};
}

export function toCitedSources(docs: KnowledgeDocument[]): CitedSource[] {
  return docs.map((d) => ({
    id: d.id,
    title: d.title,
    manufacturer: d.manufacturer,
    documentType: d.documentType,
    pageOrSection: d.pageNumber || d.sourceDate,
    url: isSafeInternalOrPublicHref(d.url) ? d.url : '/',
    fileUrl: d.fileUrl && isSafeInternalOrPublicHref(d.fileUrl) ? d.fileUrl : undefined,
    videoUrl: d.videoUrl && isSafeInternalOrPublicHref(d.videoUrl) ? d.videoUrl : undefined,
    presentationUrl:
      d.presentationUrl && isSafeInternalOrPublicHref(d.presentationUrl)
        ? d.presentationUrl
        : undefined,
    verificationStatus: d.verificationStatus,
  }));
}

export function getTrainingResourcesByCategory(category?: string): TrainingResource[] {
  if (!category || category === 'הכל') return TRAINING_RESOURCES;
  return TRAINING_RESOURCES.filter((r) => r.category === category);
}
