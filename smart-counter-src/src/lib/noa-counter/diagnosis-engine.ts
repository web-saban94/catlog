/**
 * Stage 3 — Customer Diagnosis Engine
 * תהליך אבחון מדורג: שאלה אחת בכל פעם, ללא שאלון ארוך, עם שמירת הקשר השיחה
 */

import type {
  DiagnosisFieldKey,
  DiagnosisQuestionCard,
  DiagnosisState,
  IntentClassification,
} from "./types";

const DOMAIN_QUESTION_ORDER: Record<string, DiagnosisFieldKey[]> = {
  "צבע ושליכט": ["exposure", "substrateCondition", "substrateType", "dimensions"],
  "דבקים וריצוף": ["substrateType", "dimensions", "exposure", "substrateCondition"],
  "איטום גגות": ["substrateType", "substrateCondition", "exposure", "dimensions"],
  "איטום חדרים רטובים": ["substrateType", "substrateCondition", "dimensions"],
  "שיקום בטון": ["substrateCondition", "problemToSolve", "exposure"],
  "גבס וטיח": ["workType", "exposure", "dimensions"],
  "צנרת ואביזרים": ["requestedProduct", "dimensions", "workType"],
  default: ["workType", "substrateType", "exposure", "substrateCondition"],
};

const QUESTION_TEMPLATES: Record<DiagnosisFieldKey, DiagnosisQuestionCard> = {
  workType: {
    field: "workType",
    question: "איזו עבודה הלקוח מבצע כרגע?",
    whyAsk: "הגדרת אופי העבודה ממקדת אותנו ישירות במערכת החומרים המתאימה.",
    options: ["שיפוץ פנים", "איטום גג / מרפסת", "ריצוף וחיפוי", "צביעה / שליכט", "תיקון ושיקום בטון"],
    allowFreeText: true,
  },
  exposure: {
    field: "exposure",
    question: "העבודה היא בפנים המבנה או בחוץ (חשיפה לשמש וגשם)?",
    whyAsk: "חשיפה לקרינת UV, גשם או לחות מתמדת משנה לחלוטין את סוג החומר הנדרש.",
    options: ["פנים — חדר יבש", "פנים — חדר רטוב / מקלחת", "חוץ — חשוף לשמש וגשם", "מרפסת / גג פתוח"],
    allowFreeText: true,
  },
  substrateType: {
    field: "substrateType",
    question: "על איזו תשתית מיישמים את החומר?",
    whyAsk: "התאמת החומר לתשתית קובעת אם נדרש פריימר מקשר או דבק גמיש.",
    options: ["בטון חשוף", "ריצוף קרמיקה/פורצלן קיים", "קיר טיח צמנטי", "קיר סיד ישן", "גג יריעות / זפת קיים", "לוח גבס"],
    allowFreeText: true,
  },
  substrateCondition: {
    field: "substrateCondition",
    question: "מה מצב התשתית הקיימת כרגע?",
    whyAsk: "קילופים, עובש, רטיבות או אריחים רופפים מחייבים הכנת שטח לפני היישום.",
    options: ["תשתית חדשה ותקינה", "מתקלף / מתפורר", "כתמי עובש או רטיבות", "מים עומדים / שלוליות", "אריחים רופפים / חלקים"],
    allowFreeText: true,
  },
  dimensions: {
    field: "dimensions",
    question: "מה סדר הגודל של השטח או מידות החומר (למשל גודל אריח / מ״ר)?",
    whyAsk: "מידות גדולות (כמו פורצלן 80x80) ושטח העבודה קובעים את דרגת הדבק והכמות.",
    options: ["עד 20 מ״ר", "20–60 מ״ר", "מעל 60 מ״ר", "אריח פורצלן גדול (80x80 ומעלה)"],
    allowFreeText: true,
  },
  requestedProduct: {
    field: "requestedProduct",
    question: "האם הלקוח ציין שם מוצר או תקן מסוים שהוא רגיל לעבוד איתו?",
    whyAsk: "חיבור למה שהקבלן מכיר מאפשר התאמת מק״ט מדויק במילון הלוגיסטי.",
    options: ["לא ציין — צריך המלצה", "יש לי שם מוצר / מק״ט להקליד"],
    allowFreeText: true,
  },
  problemToSolve: {
    field: "problemToSolve",
    question: "איזו בעיה עיקרית הלקוח מנסה לפתור (נזילה, סדיקה, בידוד, התנתקות)?",
    whyAsk: "אבחון שורש הבעיה מונע מכירה של פתרון קוסמטי בלבד.",
    options: ["חדירת מים / נזילה", "עובש / עיבוי בחורף", "בטון סדוק / ברזל חשוף", "התנתקות ציפוי קודם"],
    allowFreeText: true,
  },
  constraints: {
    field: "constraints",
    question: "האם יש אילוצי ביצוע מיוחדים (זמן ייבוש קצר, עבודה בחורף, מגבלת תקציב)?",
    whyAsk: "זיהוי אילוצים מאפשר לבחור חלופה מעשית בלי להפתיע את הלקוח באתר.",
    options: ["דחיפות מהירה לפני גשם", "תקציב מוגבל — מחפש תמורה טובה", "דרישה לעמידות מקסימלית לאורך שנים", "אין מגבלה מיוחדת"],
    allowFreeText: true,
  },
};

export function detectDiagnosisDomain(query: string, intent: IntentClassification): string {
  const q = query.toLowerCase();
  if (/צבע|שליכט|סופרקריל|נירוקריל|סיד/i.test(q)) return "צבע ושליכט";
  if (/פורצלן|ריצוף|קרמיקה|אריח|דבק/i.test(q)) return "דבקים וריצוף";
  if (/גג|שלולית|יריעות|זפת/i.test(q)) return "איטום גגות";
  if (/חדר\s*רטוב|מקלחת|אמבטיה|מאגר|sikatop|107/i.test(q)) return "איטום חדרים רטובים";
  if (/שיקום\s*בטון|ברזל\s*חשוף|חלודה|גשרי\s*קור/i.test(q)) return "שיקום בטון";
  if (/גבס|טיח/i.test(q)) return "גבס וטיח";
  if (/צנרת|צינור|sp|מולטיגול/i.test(q)) return "צנרת ואביזרים";
  return intent.entities.categories[0] || "default";
}

/** מעדכן את הקשר האבחון מהטקסט הנוכחי בלי לאבד פרטים קודמים */
export function updateDiagnosisContext(
  prevState: DiagnosisState | undefined,
  query: string,
  intent: IntentClassification,
): DiagnosisState {
  const next: DiagnosisState = { ...(prevState || {}) };
  const q = query.trim();
  const domain = detectDiagnosisDomain(q, intent);
  if (domain !== "default") next.domain = domain;

  if (/פנים|חדר\s*יבש/i.test(q) && !/חוץ/.test(q)) next.exposure = "פנים";
  else if (/חדר\s*רטוב|מקלחת|אמבטיה/i.test(q)) next.exposure = "חדר רטוב";
  else if (/חוץ|גג|מרפסת|שמש|גשם/i.test(q)) next.exposure = "חוץ / חשוף לשמש וגשם";

  if (/ריצוף\s*קיים|אריח\s*קיים/i.test(q)) next.substrateType = "ריצוף קיים";
  else if (/סיד/i.test(q)) next.substrateType = "סיד ישן";
  else if (/בטון/i.test(q)) next.substrateType = "בטון";
  else if (/גבס/i.test(q)) next.substrateType = "גבס";
  else if (/טיח/i.test(q)) next.substrateType = "טיח";

  if (/80\s*[xX*×]\s*80|80\s*על\s*80/i.test(q)) next.dimensions = "אריח פורצלן 80x80";
  else if (/\b\d+\s*מ["״]?ר/i.test(q)) {
    const m = q.match(/\b\d+\s*מ["״]?ר/i);
    if (m) next.dimensions = m[0];
  }

  if (/מתקלף|מתפורר|עובש|רטיבות|מים\s*עומדים|רופפים/i.test(q)) {
    const condMatch = q.match(/מתקלף|מתפורר|עובש|רטיבות|מים\s*עומדים|רופפים/i);
    if (condMatch) next.substrateCondition = condMatch[0];
  }

  if (intent.entities.products.length > 0) {
    next.requestedProduct = intent.entities.products.join(", ");
  }

  next.updatedAt = new Date().toISOString();
  return next;
}

/** מחזיר שאלה אחת בלבד — רק אם באמת נחוץ למקרה וטרם התקבלה תשובה */
export function selectNextDiagnosisQuestion(
  state: DiagnosisState,
  intent: IntentClassification,
): DiagnosisQuestionCard | undefined {
  if (
    intent.primaryIntent === "OPERATIONS_LOGISTICS" ||
    intent.primaryIntent === "TRAINING_MEDIA" ||
    intent.primaryIntent === "SALES_TRAINING"
  ) {
    return undefined;
  }

  const domain = state.domain || "default";
  const order = DOMAIN_QUESTION_ORDER[domain] ?? DOMAIN_QUESTION_ORDER.default;

  for (const field of order) {
    if (!state[field]) {
      return QUESTION_TEMPLATES[field];
    }
  }
  return undefined;
}
