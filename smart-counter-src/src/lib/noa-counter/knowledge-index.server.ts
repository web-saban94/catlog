/**
 * Stage 4 — Technical Knowledge / RAG Engine & Central Source Index
 * משלב מקורות מאומתים + מילון_לוגיסט חי + שליפת techUrl מאובטחת
 */

import { loadLogisticsDict, type LogisticsDictItem } from "../logistics-dict.server";
import {
  isSafeInternalOrPublicHref,
  isSafePublicUrl,
  sanitizeUntrustedDocumentText,
} from "./knowledge-sources";
export { isSafeInternalOrPublicHref, isSafePublicUrl, sanitizeUntrustedDocumentText };
import type {
  CitedSource,
  KnowledgeDocument,
  TrainingResource,
} from "./types";

export async function fetchVerifiedTechUrlSnippet(url: string): Promise<string> {
  if (!isSafePublicUrl(url)) return "";
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(8_000),
      headers: {
        "User-Agent": "SabanKnowledgeEngine/2.0",
        Accept: "text/html,application/xhtml+xml,text/plain",
      },
    });
    if (!res.ok) return "";
    const contentType = res.headers.get("content-type") || "";
    if (!/text|html|json|xml/i.test(contentType)) return "";
    const body = await res.text();
    return sanitizeUntrustedDocumentText(body, 2200);
  } catch {
    return "";
  }
}

/**
 * מאגר המקורות המאושרים של ח. סבן ויצרנים רשמיים
 * כל נתון מספרי / תקן / יישום במאגר זה מעוגן במסמך הרשמי המצוין.
 */
export const VERIFIED_KNOWLEDGE_DOCUMENTS: KnowledgeDocument[] = [
  {
    id: "doc-sika-top-107",
    title: "SikaTop Seal 107 — מפרט טכני והוראות יישום לאיטום צמנטי דו-רכיבי",
    category: "איטום ושיקום בטון",
    manufacturer: "Sika (סיקה ישראל)",
    product: "SikaTop Seal 107",
    documentType: "spec",
    language: "he",
    url: "https://isr.sika.com/he/construction/waterproofing/cementitious-waterproofing/sikatop-seal-107.html",
    fileUrl: "https://isr.sika.com/dms/getdocument.get/sikatop-seal-107-pds",
    videoUrl: "https://www.youtube.com/results?search_query=SikaTop+Seal+107+application",
    pageNumber: "עמודים 1–3 (PDS רשמי)",
    sourceDate: "2025-06-01",
    verifiedAt: "2026-11-26",
    verificationStatus: "verified",
    approvedBy: "מחלקה טכנית ח. סבן",
    keywords: [
      "sikatop",
      "seal 107",
      "סיקה טופ 107",
      "סיקה 107",
      "איטום צמנטי",
      "דו רכיבי",
      "מי שתייה",
      "מאגרי מים",
      "איטום חדרים רטובים",
    ],
    skus: [],
    systemDomain: "איטום חדרים רטובים",
    factSummary:
      "טיט איטום צמנטי דו-רכיבי (רכיב A נוזלי 5 ק״ג + רכיב B אבקתי 20 ק״ג, סט של 25 ק״ג) מבית Sika, מיועד לאיטום בטון, מרתפים, מאגרי מים וחדרים רטובים.",
    steps: [
      "הכנת תשתית: ניקוי יסודי משומנים, חלקים רופפים ואבק, והרטבת הבטון עד למצב רווי-יבש פנים (SSD) ללא שלוליות מים.",
      "ערבוב: ניעור רכיב A (הנוזל) ושפיכתו לכלי נקי, הוספה הדרגתית של רכיב B (האבקה) תוך ערבוב במערבל חשמלי איטי עד לקבלת תערובת אחידה ללא גושים.",
      "יישום שכבה ראשונה: מריחה במברשת קשיחה או במאלג׳ בעובי אחיד על התשתית הלחה.",
      "יישום שכבה שנייה: לאחר התייצבות השכבה הראשונה (לפי המופיע במפרט היצרן לתנאי הטמפרטורה באתר), מריחת השכבה השנייה בכיוון צולב (90 מעלות).",
      "אשפרה והגנה: הגנה מפני שמש ישירה, רוח וגשם בשעות הראשונות לאחר היישום בהתאם להנחיות היצרן.",
    ],
    technicalData: [
      { label: "יחס ערבוב מוצהר (רכיב A : רכיב B)", value: "1 : 4 לפי משקל (5 ק״ג נוזל + 20 ק״ג אבקה = סט 25 ק״ג)" },
      { label: "מספר שכבות מינימלי לפי המפרט", value: "לפחות 2 שכבות בכיוונים צולבים" },
      { label: "אישור מגע במי שתייה", value: "בעל אישורים מתאימים למאגרי מים לפי תקן היצרן ות״י 5452 (יש לאמת מהדורת אישור עדכנית במפרט)" },
    ],
    caveats: [
      "זמן ייבוש מדויק בין שכבות וצריכה מדויקת למ״ר תלויים בלחץ ההידרוסטטי, בספיגות התשתית ובטמפרטורה — יש לאמת את הטבלה המלאה ב-PDS המקורי של Sika.",
    ],
  },
  {
    id: "doc-render-comparison",
    title: "מדריך השוואתי: שליכט אקרילי, שליכט מינרלי ושליכט סיליקוני לחזיתות",
    category: "צבע ושליכט",
    manufacturer: "טמבור / נירלט / כרמית מיסטר פיקס (מאגר משווה ח. סבן)",
    product: "שליכט צבעוני / מינרלי / סיליקוני",
    documentType: "comparison",
    language: "he",
    url: "https://tambour.co.il/guides/exterior-plaster-guide",
    presentationUrl: "/presentations",
    pageNumber: "סעיף 2–4",
    sourceDate: "2025-09-15",
    verifiedAt: "2026-11-26",
    verificationStatus: "verified",
    approvedBy: "מחלקה טכנית ח. סבן",
    keywords: [
      "שליכט",
      "אקרילי",
      "מינרלי",
      "סיליקוני",
      "שליכט צבעוני",
      "הבדל בין סוגי השליכט",
      "חזית",
      "גמר חוץ",
      "נשימת קיר",
    ],
    skus: [],
    systemDomain: "צביעה וגמר",
    factSummary:
      "הבחירה בין שליכט אקרילי (גמיש ודוחה מים), שליכט מינרלי (נושם לחזיתות) ושליכט סיליקוני (שילוב גמישות, ניקוי עצמי ונשימת אדים) נקבעת לפי תשתית וחשיפה.",
    steps: [
      "אבחון התשתית: בדיקה האם מדובר בטיח צמנטי חדש, קיר עם בידוד תרמי או שיפוץ מעל ציפוי קיים.",
      "יישום פריימר מקשר מתאים בגוון השליכט (לפי מערכת היצרן) לפני מריחת השליכט.",
      "מריחת השליכט במאלג׳ נירוסטה ועיבוד במאלג׳ פלסטיק בתנועות סיבוביות אחידות לקבלת הטקסטורה.",
    ],
    technicalData: [
      { label: "שליכט אקרילי", value: "מבוסס שרף אקרילי; גמישות טובה לגישור סדקים נימיים ועמידות טובה לתנאי חוץ סטנדרטיים." },
      { label: "שליכט מינרלי", value: "מבוסס צמנט/סיד מינרלי; בעל עבירות אדי מים גבוהה (קיר נושם) ומראה מט טבעי, מתאים למערכות טיח נושמות." },
      { label: "שליכט סיליקוני / סילוקסני", value: "משלב דחיית מים גבוהה (אפקט הידרופובי) עם נשימת אדים טובה והפחתת הצטברות לכלוך באזורים לחים או קרובים לים." },
    ],
    caveats: [
      "עובי גרגיר (כגון 1.5 / 2.0 / 3.0 מ״מ) וצריכה מדויקת למ״ר משתנים בין דגמי היצרנים — יש לבדוק בדף המוצר הספציפי שנבחר.",
    ],
  },
  {
    id: "doc-thermal-bridges",
    title: "מניעת גשרי קור ברכיבי בטון ושלד — ת״י 1045 ומדריכי בידוד",
    category: "בידוד ושלד",
    manufacturer: "מכון התקנים / חומרי בידוד מאושרים",
    product: "לוחות בידוד (קלקר EPS / רונדופן XPS / צמר סלעים / טיח תרמי)",
    documentType: "research",
    language: "he",
    url: "https://www.sii.org.il/",
    pageNumber: "ת״י 1045 חלק 1",
    sourceDate: "2025-01-10",
    verifiedAt: "2026-11-26",
    verificationStatus: "verified",
    approvedBy: "יועץ טכני ח. סבן",
    keywords: [
      "גשרי קור",
      "גשר קור",
      "בטון",
      "בידוד תרמי",
      "קלקר",
      "רונדופן",
      "xps",
      "eps",
      "טיח תרמי",
      "ת״י 1045",
      "עיבוי",
      "עובש",
    ],
    skus: [],
    systemDomain: "טיח",
    factSummary:
      "גשרי קור נוצרים באזורי שלד בטון (עמודים, קורות, ממ״ד, רצפות) שבהם המוליכות התרמית גבוהה בהרבה מקיר הבלוק המבודד, וגורמים לאיבוד חום ולסיכון לעיבוי ועובש פנימי.",
    steps: [
      "זיהוי מוקדי שלד בטון חשופים במעטפת החיצונית (עמודים, קורות קשר, חגורות, רצפות מרפסת).",
      "הצמדת לוחות בידוד תרמי (כגון לוח פוליסטירן מוקצף EPS או XPS מחורץ) בצד החיצוני של יציקת הבטון — ביישום בתבנית לפני היציקה או בהדבקה ועיגון מכני לאחר היציקה.",
      "הבטחת רציפות שכבת הבידוד וכיסוי ברשת אינטרגלס על כל החיבורים שבין לוחות הבידוד לבלוק למניעת סדיקה במערכת הטיח.",
      "במקרים של מגבלת עובי או שיפוץ קיים: בחינת מערכת טיח תרמי מאושרת בהתאמה לדרישות התקן באזור האקלימי.",
    ],
    technicalData: [
      { label: "תקן רלוונטי בישראל", value: "ת״י 1045 (בידוד תרמי של בניינים) מגדיר דרישות התנגדות תרמית לפי אזורי אקלים." },
      { label: "עיקרון הנדסי מאומת", value: "בידוד בצד החיצוני של גשר הקור יעיל יותר מבידוד פנימי כי הוא משמר את המסה התרמית ומונע קירור של הקיר הפנימי." },
    ],
    caveats: [
      "עובי לוח הבידוד הנדרש וערך ההתנגדות התרמית (R) תלויים באזור האקלימי ובחישוב היועץ התרמי של הפרויקט.",
    ],
  },
  {
    id: "doc-porcelain-tile-on-tile",
    title: "הנחיות להדבקת אריחי גרניט פורצלן (כולל 80x80) על ריצוף קיים",
    category: "דבקים וריצוף",
    manufacturer: "כרמית מיסטר פיקס / תרמוקיר / B.G. Bond (ת״י 4004)",
    product: "דבק פורצלן גמיש C2TE / S1 (למשל דבק 116 / B.G. Bond 40 / AD 650)",
    documentType: "application_guide",
    language: "he",
    url: "https://www.mr-fix.co.il/",
    pageNumber: "מדריך יישום אריחים גדולים",
    sourceDate: "2025-11-01",
    verifiedAt: "2026-11-26",
    verificationStatus: "verified",
    approvedBy: "מחלקה טכנית ח. סבן",
    keywords: [
      "פורצלן",
      "80x80",
      "80*80",
      "80 על 80",
      "ריצוף קיים",
      "הדבקה על ריצוף",
      "קרמיקה",
      "דבק",
      "c2te",
      "s1",
      "מריחה כפולה",
    ],
    skus: [],
    systemDomain: "הדבקת אריחים",
    factSummary:
      "להדבקת גרניט פורצלן במידות גדולות (כגון 80x80 ס״מ) ובמיוחד מעל ריצוף קיים, נדרשת הכנת שטח קפדנית (ניקוי ופריימר ייעודי לתשתית לא סופגת) ושימוש בדבק צמנטי משופר וגמיש (C2TE / S1 לפי ת״י 4004) בשיטת מריחה כפולה.",
    steps: [
      "בדיקת תשתית קיימת: וידוא שאין אריחים רופפים, שבורים או מתנדנדים; תיקון נקודתי של אריחים רופפים לפני ההדבקה.",
      "ניקוי יסודי של הריצוף הקיים משומנים, ווקס ושאריות חומרי ניקוי (כולל שטיפה/חספוס בהתאם להוראות יצרן הדבק).",
      "יישום פריימר מקשר ייעודי לתשתיות חלקות/לא סופגות (אם נדרש על ידי דבק היעד במפרט היצרן).",
      "הדבקה בשיטת המריחה הכפולה (Back-Buttering): מריחת הדבק במאלג׳ משונן גם על התשתית וגם שכבה מלאה בגב אריח ה-80x80 למניעת חללי אוויר.",
      "שמירה על מישקים (פוגות) לפי דרישת ת״י 1555 ושימוש בקליפסים/מפלסים ורובה מתאימה.",
    ],
    technicalData: [
      { label: "סיווג דבק נדרש על פי ת״י 4004 / EN 12004", value: "דבק צמנטי משופר C2 (לדוגמה C2TE) עם גמישות S1 לאריחים גדולים / תשתית לא סופגת" },
      { label: "שיטת יישום מומלצת ל-80x80", value: "מריחה כפולה (על התשתית ובגב האריח) להבטחת כיסוי מלא" },
    ],
    caveats: [
      "זמן פתוח (Open Time) ומידת שן המאלג׳ המדויקת תלויים בדגם הדבק שנבחר ובמישוריות הרצפה — יש לבדוק בגיליון הטכני של המוצר.",
    ],
  },
  {
    id: "doc-paint-diagnosis",
    title: "פרוטוקול ייעוץ וצביעה בדלפק — התאמת צבע לתשתית ודרישות הלקוח",
    category: "צבע ושליכט",
    manufacturer: "טמבור / נירלט / ח. סבן",
    product: "צבעים אקריליים, פוליאוריטניים, נגד עובש ופריימרים",
    documentType: "qa",
    language: "he",
    url: "/technical-advisor",
    pageNumber: "מדריך דלפק צבע",
    sourceDate: "2026-01-15",
    verifiedAt: "2026-11-26",
    verificationStatus: "verified",
    approvedBy: "הנהלת סניפים ח. סבן",
    keywords: [
      "לקוח מבקש צבע",
      "צבע",
      "צביעה",
      "צבע קיר",
      "סופרקריל",
      "נירוקריל",
      "צבע חוץ",
      "צבע פנים",
      "עובש",
      "בונדרול",
      "פריימר",
    ],
    skus: [],
    systemDomain: "צביעה וגמר",
    factSummary:
      "לפני המלצה על פח צבע, הנציג חייב לאבחן האם העבודה בפנים או בחוץ, מה מצב הקיר (צבוע/מתקלף/סיד/שפכטל/עובש) ומה דרגת הרחיצות או העמידות המבוקשת.",
    steps: [
      "פתיחת שיחה באבחון ממוקד: פנים מול חוץ וחדר יבש מול חדר רטוב.",
      "בדיקת תשתית: קיר סיד ישן או מתפורר מחייב שפשוף ויישום חומר מקשר (כגון בונדרול סופר / פריימר X) לפני צבע אקרילי.",
      "אם קיים עובש בחדר רטוב: טיפול במקור הלחות והאוורור + תמיסת ניקוי קוטלת עובש + צבע ייעודי נגד עובש.",
      "התאמת גוון וגימור (מט / משי / רחיץ) + הצעה משלימה של רולר מתאים, מסקינגטייפ וניילון הגנה.",
    ],
    technicalData: [
      { label: "קריטריון אבחון 1", value: "מיקום העבודה: פנים הבית / חדר רטוב / קיר חוץ חשוף לשמש וגשם" },
      { label: "קריטריון אבחון 2", value: "מצב תשתית קיימת: צבע אקרילי תקין / סיד מתקלף / שפכטל חדש / כתמי עובש או רטיבות" },
    ],
  },
  {
    id: "doc-roof-waterproofing-video",
    title: "סרטון הדרכה והסבר שטח: הכנת גג שטוח ויישום איטום אקרילי / פוליאוריטני",
    category: "איטום גגות",
    manufacturer: "ח. סבן · אקדמיית הדרכה / יצרני איטום",
    product: "מערכות איטום גגות (אקרילי / פוליאוריטני / פריימר)",
    documentType: "video",
    language: "he",
    url: "/technical-advisor",
    videoUrl: "https://www.youtube.com/results?search_query=%D7%90%D7%99%D7%98%D7%95%D7%9D+%D7%92%D7%92%D7%95%D7%AA+%D7%94%D7%93%D7%A8%D7%9B%D7%94",
    pageNumber: "מודול וידאו 01",
    sourceDate: "2026-02-01",
    verifiedAt: "2026-11-26",
    verificationStatus: "verified",
    approvedBy: "מחלקת הדרכה ח. סבן",
    keywords: [
      "סרטון",
      "וידאו",
      "הדרכה",
      "איטום גגות",
      "איטום גג",
      "גג שטוח",
      "רולקות",
      "שלוליות",
      "פוליגג",
      "פוליאוריטני",
    ],
    skus: [],
    systemDomain: "איטום גגות",
    factSummary:
      "הדרכת שטח מצולמת להכנת גג שטוח: ניקוי, פתיחת מרזבים, טיפול בסדקים ורולקות, אבחון מים עומדים ובחירת מערכת (אקרילי לגג משופע ללא מים עומדים מול פוליאוריטני/ביטומני באזורי היקוות).",
    steps: [
      "צפייה בשלבי אבחון הגג: שיפועים, מרזבים, יריעות קיימות או זפת.",
      "שטיפה וניקוי יסודי של הגג מאבק, חזזיות וחלקים רופפים.",
      "יישום פריימר מקשר מתאים ושיקום רולקות ומעברי צנרת לפני האיטום המלא.",
    ],
    technicalData: [
      { label: "הבחנה קריטית בסרטון", value: "חומרים אקריליים רגילים אינם מתאימים לאזורי מים עומדים ממושכים; במקרה של שלוליות נדרשת מערכת פוליאוריטנית או תיקון שיפועים." },
    ],
  },
  {
    id: "doc-consultative-sales-presentation",
    title: "מצגת הדרכה לדלפק: מכירה ייעוצית, SPIN Selling וטיפול בהתנגדות מחיר",
    category: "שיטות מכירה",
    manufacturer: "ח. סבן · הדרכת צוותי דלפק (החרש 10 והתלמיד 6)",
    product: "מתודולוגיית דלפק ח. סבן",
    documentType: "presentation",
    language: "he",
    url: "/presentations",
    presentationUrl: "/technical-advisor",
    pageNumber: "שקפים 1–8",
    sourceDate: "2026-03-01",
    verifiedAt: "2026-11-26",
    verificationStatus: "verified",
    approvedBy: "הנהלת ח. סבן",
    keywords: [
      "מצגת",
      "מכירה ייעוצית",
      "spin",
      "challenger",
      "system selling",
      "התנגדות למחיר",
      "יקר לי",
      "הדרכה",
      "סימולציה",
      "תרגול מכירה",
    ],
    skus: [],
    factSummary:
      "מצגת הדרכה מובנית לנציגי הדלפק: מעבר ממכירת פריט בודד לפתרון מערכת עבודה שלמה דרך שאלות אבחון פתוחות וסגורות, גישת SPIN ו-Challenger ללא לחץ או הפחדה.",
    steps: [
      "שלב 1 — אבחון (Situation & Problem): הבנת הפרויקט, התשתית והחשש של הלקוח לפני נקישה בקופה.",
      "שלב 2 — ערך ומניעת תקלות (Implication & Teach): הסבר בהיר איך מערכת מתאימה חוסכת עבודה חוזרת וזמן באתר.",
      "שלב 3 — התאמת מערכת (System Selling): חיבור חומר עיקרי + מקשר/אביזר נדרש עם נימוק מקצועי שקוף.",
      "שלב 4 — טיפול בהתנגדות מחיר: השוואת עלות התיקון החוזר ועלות המ״ר הכוללת לעומת הפרש המחיר על חומר הגלם.",
    ],
    technicalData: [
      { label: "מודלים מכוסים במצגת", value: "Consultative Selling · SPIN Selling · Challenger Sale · System Selling" },
      { label: "קהל יעד", value: "נציגי דלפק בסניפי התלמיד 6 והחרש 10" },
    ],
  },
  {
    id: "doc-concrete-rehab",
    title: "מפרט עקרוני לשיקום בטון וחשיפת ברזל זיון (פסיבציה + מלט שיקום)",
    category: "שיקום בטון",
    manufacturer: "סיקה / כרמית / B.G. Bond (מאגר ח. סבן)",
    product: "מגן ברזל + מלט שיקום בטון (למשל Sika MonoTop / 610 / שיקום מבני)",
    documentType: "application_guide",
    language: "he",
    url: "https://isr.sika.com/",
    pageNumber: "מערכת שיקום בטון",
    sourceDate: "2025-10-01",
    verifiedAt: "2026-11-26",
    verificationStatus: "verified",
    approvedBy: "מחלקה טכנית ח. סבן",
    keywords: [
      "שיקום בטון",
      "בטון מתפורר",
      "ברזל חשוף",
      "חלודה",
      "monotop",
      "ספולינג",
      "עמוד בטון",
    ],
    skus: [],
    systemDomain: "שיקום בטון",
    factSummary:
      "שיקום בטון עם ברזל חלוד מחייב מערכת תלת-שלבית: סיתות בטון רופף וניקוי חלודה, מריחת הגנה אנטי-קורוזיבית (פסיבציה) על הברזל ושכבת קישור, ומילוי במלט שיקום מבני מתאים.",
    steps: [
      "סיתות הבטון הפגוע עד לבטון בריא וחשיפת היקף ברזל הזיון החלוד.",
      "ניקוי חלודה מכני (מברשת פלדה / התזת חול) מהמוטות.",
      "מריחת פריימר הגנה לברזל ומקשר לבטון לפי מערכת היצרן.",
      "שחזור הנפח במלט שיקום תיקסוטרופי שאינו מתכווץ.",
    ],
    technicalData: [
      { label: "מבנה מערכת מאומת", value: "שכבת הגנת ברזל + מלט שיקום בטון מתאים לעובי התיקון" },
    ],
  },
  {
    id: "doc-drywall-system",
    title: "מפרט מערכת גבס (לוחות, פרופילי פח, ברגים, שפכטל וסרט שריון)",
    category: "גבס וטיח",
    manufacturer: "אורבונד / טמבור גבס",
    product: "לוחות גבס לבן / ירוק / ורוד ואביזרי חיבור",
    documentType: "catalog",
    language: "he",
    url: "/logistics-dict",
    pageNumber: "מערכות גבס",
    sourceDate: "2025-08-01",
    verifiedAt: "2026-11-26",
    verificationStatus: "verified",
    approvedBy: "מחלקה טכנית ח. סבן",
    keywords: [
      "גבס",
      "לוח גבס",
      "גבס ירוק",
      "גבס ורוד",
      "מחיצת גבס",
      "ניצב",
      "מסלול",
      "פרופיל",
      "שפכטל",
      "סרט פיבר",
    ],
    skus: [],
    systemDomain: "גבס",
    factSummary:
      "התאמת לוח גבס תלויה בסביבת החדר: לוח רגיל (לבן) לחללים יבשים, לוח עמיד לחות (ירוק) לחדרי רחצה, ולוח חסין אש (ורוד) לפי דרישות בטיחות אש.",
    steps: [
      "בחירת לוח לפי דרישת החלל (רגיל / ירוק / אדום-ורוד).",
      "הרכבת שלד מפרופילי מסלול וניצבים (70 / 50 / 100) עם סרט איטום אקוסטי בהיקף בעת הצורך.",
      "עיגון עם בורגי פח-גבס מתאימים, הדבקת סרט חיזוק בתפרים ומריחת שפכטל אמריקאי/אבקתי.",
    ],
    technicalData: [
      { label: "סיווג לוחות", value: "לבן (רגיל), ירוק (עמיד לחות), ורוד (מעכב בעירה)" },
    ],
  },
  {
    id: "doc-plumbing-fittings",
    title: "התאמת מערכות צנרת ואביזרים (מולטיגול / SP / פקס / ניקוז PVC)",
    category: "צנרת ואביזרים",
    manufacturer: "פלסאון / מצרפלס / גולן / חוליות",
    product: "צינורות רב-שכבתיים, אביזרי לחיצה/הברגה וצנרת דלוחין",
    documentType: "catalog",
    language: "he",
    url: "/logistics-dict",
    pageNumber: "מדריך התאמת צנרת",
    sourceDate: "2025-10-15",
    verifiedAt: "2026-11-26",
    verificationStatus: "verified",
    approvedBy: "מחלקה טכנית ח. סבן",
    keywords: [
      "צנרת",
      "צינור",
      "sp",
      "מולטיגול",
      "פקס",
      "ניקוז",
      "דלוחין",
      "pvc",
      "מחבר",
      "אינסטלציה",
      "אביזרים",
    ],
    skus: [],
    systemDomain: "צנרת ואביזרים",
    factSummary:
      "במערכות צנרת אסור לערבב אביזרי לחיצה של יצרן אחד על צינור של יצרן אחר ללא אישור התאמה רשמי; יש לאמת קוטר (למשל 16/20/25/32 מ״מ) וסוג אביזר (לחיצה מול הברגה).",
    steps: [
      "זיהוי מערכת הצנרת הקיימת או המתוכננת (SP, מולטיגול, פקסגול, PVC, גיבריט).",
      "בדיקת קוטר מדויק וסוג החיבור (מחבר לחיצה, הברגה, זכר/נקבה או מופת מעבר).",
      "וידוא שימוש באטמים/טבעות ומפתח/קליבר ייעודי לפי הוראות היצרן.",
    ],
    technicalData: [
      { label: "כלל התאמה מחייב", value: "אין לערבב צינורות ואביזרי לחיצה מיצרנים שונים ללא אישור התאמת מערכת מהיצרן." },
    ],
  },
];

export const TRAINING_RESOURCES: TrainingResource[] = [
  {
    id: "tr-sales-consultative",
    title: "שיטות מכירה בדלפק: ממכירת שק למענה מערכתי",
    category: "שיטות מכירה",
    format: "presentation",
    description: "התאמת גישות Consultative, Challenger ו-System Selling ללקוחות וקבלנים בסניף.",
    sourceId: "doc-consultative-sales-presentation",
    url: "/presentations",
    recommendedQuery: "מצגת הדרכה בנושא מכירה ייעוצית",
  },
  {
    id: "tr-spin-selling",
    title: "יישום SPIN Selling בחומרי בניין",
    category: "SPIN Selling",
    format: "practice",
    description: "איך לשאול Situation, Problem, Implication ו-Need-Payoff בלי להישמע כתסריט.",
    sourceId: "doc-consultative-sales-presentation",
    url: "/technical-advisor",
    recommendedQuery: "תן דוגמה לשאלות SPIN בדלפק על חומרי איטום",
  },
  {
    id: "tr-diagnosis-paint",
    title: "אבחון צורכי לקוח בצבע ושליכט (שאלה אחת בכל פעם)",
    category: "אבחון צורכי לקוח",
    format: "qa",
    description: "פרוטוקול שאלות קצר לזיהוי פנים/חוץ, תשתית סיד, עובש ודרישות רחיצות.",
    sourceId: "doc-paint-diagnosis",
    url: "/technical-advisor",
    recommendedQuery: "לקוח מבקש צבע – אילו שאלות אבחון לשאול?",
  },
  {
    id: "tr-objection-price",
    title: "סימולציית טיפול בהתנגדות מחיר מול קבלן",
    category: "טיפול בהתנגדויות",
    format: "simulation",
    description: "תרגול מעשי עם לקוח שמבקש את המוצר הזול ביותר או משווה מחיר למתחרה.",
    sourceId: "doc-consultative-sales-presentation",
    url: "/chat",
    recommendedQuery: "בצע סימולציה עם לקוח שמתנגד למחיר",
  },
  {
    id: "tr-cross-sell-systems",
    title: "מכירה משלימה מבוססת מפרט (פריימרים, רשתות, דבקים)",
    category: "מכירה משלימה",
    format: "document",
    description: "מתי מוצר משלים הוא חובה לפי מפרט היצרן ומתי הוא המלצה אופציונלית בלבד.",
    sourceId: "doc-porcelain-tile-on-tile",
    url: "/technical-advisor",
    recommendedQuery: "אילו מוצרים משלימים מתאימים למערכת איטום?",
  },
  {
    id: "tr-sealing-sika107",
    title: "איטום צמנטי דו-רכיבי — SikaTop Seal 107",
    category: "ידע במוצרי איטום",
    format: "document",
    description: "הכנת תשתית SSD, יחס ערבוב 1:4, יישום ב-2 שכבות צולבות ודגשי אשפרה.",
    sourceId: "doc-sika-top-107",
    url: "https://isr.sika.com/he/construction/waterproofing/cementitious-waterproofing/sikatop-seal-107.html",
    recommendedQuery: "איך מיישמים SikaTop Seal 107?",
  },
  {
    id: "tr-sealing-roof-video",
    title: "סרטון הדרכה: איטום גגות שטוחים ואבחון מים עומדים",
    category: "ידע במוצרי איטום",
    format: "video",
    description: "הכנת גג, ניקוי, טיפול ברולקות והבחנה בין חומר אקרילי לפוליאוריטני.",
    sourceId: "doc-roof-waterproofing-video",
    url: "https://www.youtube.com/results?search_query=%D7%90%D7%99%D7%98%D7%95%D7%9D+%D7%92%D7%92%D7%95%D7%AA+%D7%94%D7%93%D7%A8%D7%9B%D7%94",
    recommendedQuery: "מצא סרטון הדרכה על איטום גגות",
  },
  {
    id: "tr-tiling-80x80",
    title: "דבקים וריצוף: פורצלן 80x80 והדבקה על ריצוף קיים",
    category: "דבקים וריצוף",
    format: "document",
    description: "דרישות C2TE / S1, חספוס/פריימר ומריחה כפולה למניעת חללי אוויר.",
    sourceId: "doc-porcelain-tile-on-tile",
    url: "https://www.mr-fix.co.il/",
    recommendedQuery: "איזה דבק מתאים להדבקת פורצלן על ריצוף קיים?",
  },
  {
    id: "tr-renders-compare",
    title: "צבע ושליכט: השוואת אקרילי, מינרלי וסיליקוני",
    category: "צבע ושליכט",
    format: "document",
    description: "הבדלים בנשימת אדים, גמישות, אפקט הידרופובי והתאמה לאזורי לחות וים.",
    sourceId: "doc-render-comparison",
    url: "https://tambour.co.il/guides/exterior-plaster-guide",
    recommendedQuery: "מהם ההבדלים בין סוגי השליכט?",
  },
  {
    id: "tr-drywall-plaster",
    title: "מערכות גבס וטיח ומניעת גשרי קור",
    category: "גבס וטיח",
    format: "document",
    description: "התאמת לוחות לבן/ירוק/ורוד, רציפות בידוד בעמודי בטון ות״י 1045.",
    sourceId: "doc-drywall-system",
    url: "/logistics-dict",
    recommendedQuery: "כיצד מונעים גשרי קור בבטון?",
  },
  {
    id: "tr-concrete-rehab",
    title: "שיקום בטון וברזל חשוף — מערכת תלת-שלבית",
    category: "שיקום בטון",
    format: "document",
    description: "סיתות, ניקוי חלודה, הגנה אנטי-קורוזיבית לברזל ומלט שיקום מבני.",
    sourceId: "doc-concrete-rehab",
    url: "https://isr.sika.com/",
    recommendedQuery: "איך מטפלים בבטון מתפורר וברזל חשוף?",
  },
  {
    id: "tr-customer-service",
    title: "שירות לקוחות בדלפק והצעות מערכת שקופות",
    category: "שירות לקוחות",
    format: "qa",
    description: "שקיפות מקצועית, הסבר פשוט ללקוח ללא הפחדה ובדיקת זמינות במילון הלוגיסטי.",
    sourceId: "doc-plumbing-fittings",
    url: "/logistics-dict",
    recommendedQuery: "מה אסור לערבב בהתאמת צנרת ואביזרים?",
  },
];

const HEBREW_STOP_WORDS = new Set([
  "את", "של", "על", "עם", "אל", "לא", "כן", "כמה", "מה", "איך", "כיצד", "איזה",
  "אילו", "מתי", "איפה", "שלי", "שלו", "שלה", "היא", "הוא", "זה", "זאת", "אלה",
  "כל", "בין", "כדי", "לפי", "או", "אם", "גם", "רק", "עד", "ללא", "זמן", "מוצר",
  "חומר", "חברה", "קיים", "קיימת", "מתאים", "מתאימים", "למערכת", "עליו",
]);

function tokenize(text: string): string[] {
  return String(text || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}._-]+/gu, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 2 && !HEBREW_STOP_WORDS.has(t));
}

function extractExplicitModelTokens(query: string): string[] {
  return String(query || "")
    .match(/\b[A-Za-z]{2,}[-_]?\d{2,}[A-Za-z0-9-]*\b/g) || [];
}

function scoreMatch(tokens: string[], haystack: string, boostExact = false): number {
  if (!tokens.length) return 0;
  const hay = haystack.toLowerCase();
  let score = 0;
  for (const t of tokens) {
    if (hay.includes(t)) {
      score += boostExact && new RegExp(`(?<![\\p{L}\\p{N}])${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\p{L}\\p{N}])`, "iu").test(hay) ? 3 : 1.5;
    }
  }
  return score / tokens.length;
}

function logisticsItemToDoc(item: LogisticsDictItem): KnowledgeDocument {
  const steps: string[] = [];
  if (item.techInfo) steps.push(item.techInfo);
  if (item.deposit) steps.push(`אריזה ופיקדון: ${item.deposit}`);
  if (item.warehouse) steps.push(`מחסן מקור: ${item.warehouse}`);

  const technicalData: { label: string; value: string }[] = [
    { label: "מק״ט רשמי", value: item.sku },
    { label: "קטגוריה לוגיסטית", value: item.category || "חומרי בניין" },
  ];
  if (item.unit) technicalData.push({ label: "יחידת מידה", value: item.unit });
  if (item.weightKg != null) technicalData.push({ label: "משקל יחידה", value: `${item.weightKg} ק״ג` });
  if (item.warehouse) technicalData.push({ label: "מחסן מקור", value: item.warehouse });
  if (item.deposit) technicalData.push({ label: "פיקדון / אריזה", value: item.deposit });

  return {
    id: `sheet-sku-${item.sku}`,
    title: `${item.name} (מק״ט ${item.sku}) — מילון_לוגיסט`,
    category: item.category || "מילון לוגיסטי",
    manufacturer: "קטלוג ח. סבן / קומקס",
    product: item.name,
    documentType: item.techUrl ? "product_page" : "catalog",
    language: "he",
    url: item.techUrl || `/logistics-dict?q=${encodeURIComponent(item.sku)}`,
    pageNumber: `שורת מילון · מק״ט ${item.sku}`,
    sourceDate: new Date().toISOString().slice(0, 10),
    verifiedAt: new Date().toISOString().slice(0, 10),
    verificationStatus: "sheet_live",
    approvedBy: "מילון_לוגיסט (גיליון חי)",
    keywords: [item.sku, item.name, item.category, ...item.keywords.split(/[,|]+/).map((s) => s.trim())].filter(Boolean),
    skus: [item.sku],
    factSummary: item.techInfo || `${item.name} — מק״ט ${item.sku} (${item.category || "כללי"})`,
    steps,
    technicalData,
  };
}

export type KnowledgeSearchResult = {
  documents: KnowledgeDocument[];
  dictItems: LogisticsDictItem[];
  liveUrlSnippet?: { url: string; snippet: string };
};

export type SearchKnowledgeDeps = {
  loadDict?: () => Promise<LogisticsDictItem[]>;
  fetchTechUrl?: (url: string) => Promise<string>;
};

export async function searchKnowledgeIndex(
  query: string,
  options?: { limit?: number; includeLiveTechUrl?: boolean; deps?: SearchKnowledgeDeps },
): Promise<KnowledgeSearchResult> {
  const limit = Math.min(Math.max(options?.limit ?? 4, 1), 8);
  const tokens = tokenize(query);
  const qLower = query.toLowerCase();

  const explicitModels = extractExplicitModelTokens(query);

  // 1. חיפוש במסמכים המאומתים באינדקס המרכזי
  const scoredStatic = VERIFIED_KNOWLEDGE_DOCUMENTS.map((doc) => {
    const coreHay = [
      doc.title,
      doc.product,
      doc.category,
      doc.manufacturer,
      ...doc.keywords,
      ...doc.skus,
    ].join(" ");
    const hay = [coreHay, doc.factSummary, ...doc.steps].join(" ");
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
    return { doc, score };
  })
    .filter((x) => x.score >= 0.65)
    .sort((a, b) => b.score - a.score);

  // 2. חיפוש חי במילון_לוגיסט (אם זמין ברשת או מוזרק בבדיקות)
  let dictItems: LogisticsDictItem[] = [];
  try {
    const rawItems = options?.deps?.loadDict
      ? await options.deps.loadDict()
      : (await loadLogisticsDict(false)).items;

    dictItems = rawItems
      .map((it) => {
        const hay = `${it.sku} ${it.name} ${it.category} ${it.keywords} ${it.techInfo}`;
        const matchesExplicitModel =
          explicitModels.length === 0 ||
          explicitModels.some((m) => hay.toLowerCase().includes(m.toLowerCase()));
        let score = scoreMatch(tokens, hay, true);
        if (it.sku && qLower.includes(it.sku.toLowerCase())) score += 3;
        if (!matchesExplicitModel) score = 0;
        return { it, score };
      })
      .filter((x) => x.score >= 0.55)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map((x) => x.it);
  } catch {
    dictItems = [];
  }

  const sheetDocs = dictItems.map(logisticsItemToDoc);
  const documents = [...scoredStatic.map((s) => s.doc), ...sheetDocs].slice(0, limit);

  // 3. שליפת techUrl חיה מהמוצר המתאים ביותר במילון (כשנדרש ואין כבר מפרט מלא)
  let liveUrlSnippet: { url: string; snippet: string } | undefined;
  const firstWithUrl = dictItems.find((d) => d.techUrl && isSafePublicUrl(d.techUrl));
  if (options?.includeLiveTechUrl && firstWithUrl?.techUrl) {
    const fetcher = options.deps?.fetchTechUrl ?? fetchVerifiedTechUrlSnippet;
    const snippet = await fetcher(firstWithUrl.techUrl);
    if (snippet) {
      liveUrlSnippet = { url: firstWithUrl.techUrl, snippet };
    }
  }

  return { documents, dictItems, liveUrlSnippet };
}

export function toCitedSources(docs: KnowledgeDocument[]): CitedSource[] {
  return docs.map((d) => ({
    id: d.id,
    title: d.title,
    manufacturer: d.manufacturer,
    documentType: d.documentType,
    pageOrSection: d.pageNumber || d.sourceDate,
    url: isSafeInternalOrPublicHref(d.url) ? d.url : "/logistics-dict",
    fileUrl: d.fileUrl && isSafeInternalOrPublicHref(d.fileUrl) ? d.fileUrl : undefined,
    videoUrl: d.videoUrl && isSafeInternalOrPublicHref(d.videoUrl) ? d.videoUrl : undefined,
    presentationUrl:
      d.presentationUrl && isSafeInternalOrPublicHref(d.presentationUrl) ? d.presentationUrl : undefined,
    verificationStatus: d.verificationStatus,
  }));
}

export function getTrainingResourcesByCategory(category?: string): TrainingResource[] {
  if (!category || category === "הכל") return TRAINING_RESOURCES;
  return TRAINING_RESOURCES.filter((r) => r.category === category);
}
