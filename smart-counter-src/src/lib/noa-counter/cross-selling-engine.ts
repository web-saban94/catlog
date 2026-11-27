/**
 * Stage 6 — Source-Grounded Cross-Selling Engine
 * פועל רק כשיש הצדקה מקצועית או תפעולית מבוססת.
 * ללא הפחדה הנדסית, ללא סיפורי כשל מומצאים, וללא סימון "חובה" ללא ביסוס במפרט.
 */

import type { LogisticsDictItem } from "../logistics-dict.server";
import type {
  CrossSellDomain,
  CrossSellRecommendation,
  DiagnosisState,
  IntentClassification,
} from "./types";

const VERIFIED_SYSTEM_CROSS_SELLS: Record<CrossSellDomain, Omit<CrossSellRecommendation, "sku">[]> = {
  "הדבקת אריחים": [
    {
      productName: "פריימר מקשר לתשתיות לא סופגות (כגון פריימר לקרמיקה קיימת)",
      category: "הדבקת אריחים",
      relevance: "משפר את ההידבקות המכנית/כימית כאשר מדביקים פורצלן מעל ריצוף קיים או תשתית חלקה.",
      conditions: "נדרש כאשר ההדבקה מבוצעת על אריחי קרמיקה/טרצו קיימים לפי הוראות יצרן הדבק.",
      priority: "חובה",
      sourceTitle: "מדריך יישום הדבקת פורצלן על ריצוף קיים (ת״י 4004 / כרמית)",
      sourceUrl: "https://www.mr-fix.co.il/",
      clientExplanation: "האריח הקיים חלק ולא סופג, ולכן הפריימר יוצר שכבת אחיזה שמונעת החלקה של הדבק החדש.",
    },
    {
      productName: "רובה אקרילית / צמנטית CG2 ומפלסים (קליפסים)",
      category: "הדבקת אריחים",
      relevance: "שומרת על פוגות אחידות, איטום בין האריחים ומישוריות באריחי 80x80.",
      conditions: "רלוונטי לכל עבודת ריצוף ובעיקר באריחים בפורמט גדול.",
      priority: "מומלץ",
      sourceTitle: "הנחיות ת״י 1555 לריצוף וחיפוי",
      sourceUrl: "https://www.mr-fix.co.il/",
      clientExplanation: "באריחי 80x80 המרווחים והמפלסים שומרים על מישור ישר ומונעים הפרשי גובה בין אריחים.",
    },
  ],
  "איטום חדרים רטובים": [
    {
      productName: "סרט איטום אלסטי לפינות וחיבורי קיר-רצפה",
      category: "איטום חדרים רטובים",
      relevance: "מטפל בתנועות ובתזוזות שבין הרצפה לקירות בנקודות התורפה של המקלחת.",
      conditions: "נדרש בחיבורי רצפה-קיר ובמעברי צנרת כחלק ממערכת איטום חדרים רטובים תקנית.",
      priority: "חובה",
      sourceTitle: "מפרט מערכות איטום צמנטיות לחדרים רטובים (Sika / ת״י 1752)",
      sourceUrl: "https://isr.sika.com/he/construction/waterproofing/cementitious-waterproofing/sikatop-seal-107.html",
      clientExplanation: "רוב הרטיבות במקלחת מתחילה בחיבור בין הרצפה לקיר — הסרט הגמיש מגשר על תזוזות עדינות בפינה.",
    },
    {
      productName: "פריימר / חומר קישור למערכת האיטום (לפי תשתית)",
      category: "איטום חדרים רטובים",
      relevance: "מאזן ספיגות וקושר אבק בתשתיות בטון או טיח צמנטי לפני שכבת האיטום.",
      conditions: "כאשר התשתית מאובקת, סופגת במיוחד או לפי דרישת יצרן האיטום הספציפי.",
      priority: "מומלץ",
      sourceTitle: "SikaTop Seal 107 / מערכות איטום חדרים רטובים",
      sourceUrl: "https://isr.sika.com/",
      clientExplanation: "מוודא שחומר האיטום נתפס באופן אחיד על כל שטח החדר ולא נספג מהר מדי.",
    },
  ],
  "איטום גגות": [
    {
      productName: "פריימר מקשר לגג (אקרילי / פוליאוריטני בהתאם לחומר העליון)",
      category: "איטום גגות",
      relevance: "מכין את תשתית הבטון או היריעה הישנה ומונע התקלפות של מערכת האיטום.",
      conditions: "נדרש לפי מפרטי יצרני האיטום לפני יישום שכבת האיטום העליונה על תשתית קיימת.",
      priority: "חובה",
      sourceTitle: "הנחיות איטום גגות שטוחים (אקדמיית ח. סבן / יצרני איטום)",
      sourceUrl: "/technical-advisor",
      clientExplanation: "שכבת היסוד מקבעת את התשתית הקיימת ויוצרת חיבור חזק בין הגג לציפוי האיטום.",
    },
    {
      productName: "רשת אינטרגלס / בד פוליאסטר לשריון חיבורים ורולקות",
      category: "איטום גגות",
      relevance: "מחזקת את שכבת האיטום באזורי סדקים, רולקות ומעברי צנרת בגג.",
      conditions: "כאשר יש סדקים בתשתית, חיבורי קירות מעקה או צנרת חודרת.",
      priority: "מומלץ",
      sourceTitle: "מדריך הכנת גג שטוח ורולקות",
      sourceUrl: "/technical-advisor",
      clientExplanation: "הרשת מחזקת את חומר האיטום בדיוק בנקודות שבהן הגג מתרחב ומתכווץ משינויי מזג אוויר.",
    },
  ],
  "צביעה וגמר": [
    {
      productName: "בונדרול סופר / פריימר מקשר לתשתית",
      category: "צביעה וגמר",
      relevance: "מקשר צבע אקרילי חדש לתשתית סיד, שפכטל חדש או קיר מתפורר.",
      conditions: "נדרש כאשר הקיר צבוע בסיד, לאחר תיקוני שפכטל או בקיר עם אבק/קילוף.",
      priority: "חובה",
      sourceTitle: "פרוטוקול ייעוץ צביעה בדלפק (טמבור / נירלט)",
      sourceUrl: "/technical-advisor",
      clientExplanation: "בלי מקשר על סיד או שפכטל חדש, הצבע האקרילי עלול להתקלף; שכבת יסוד קושרת הכל לקיר.",
    },
    {
      productName: "סט רולר איכותי, מברשת חיתוך, מסקינגטייפ וניילון הגנה",
      category: "צביעה וגמר",
      relevance: "חוסך זמן עבודה ונותן כיסוי אחיד בלי סימני צביעה ולכלוך.",
      conditions: "בכל עבודת צביעה פנימית או חיצונית, כאופציה משלימה לנוחות הלקוח.",
      priority: "אופציונלי",
      sourceTitle: "מדריך דלפק צבע ח. סבן",
      sourceUrl: "/technical-advisor",
      clientExplanation: "כדי שתוכל להתחיל לעבוד מיד כשתגיע הביתה בלי נסיעה נוספת על מברשת או דבק נייר.",
    },
  ],
  "גבס": [
    {
      productName: "ברגי פח-גבס, סרט חיזוק פיבר/נייר ושפכטל לחיבורים",
      category: "גבס",
      relevance: "משלים את מערכת הקיר מלוח גבס בודד לקיר חלק ומוכן לצבע.",
      conditions: "נדרש בכל התקנת מחיצת גבס או הנמכת תקרה.",
      priority: "חובה",
      sourceTitle: "מפרט מערכות גבס (אורבונד / טמבור גבס)",
      sourceUrl: "/logistics-dict",
      clientExplanation: "סרט החיזוק והשפכטל סוגרים את התפרים שבין הלוחות ומונעים סדקים אחרי הצביעה.",
    },
    {
      productName: "סרט איטום אקוסטי להיקף מסלולים וניצבים",
      category: "גבס",
      relevance: "מפחית העברת רעשים ורעידות בין פרופיל המתכת לרצפה ולקירות.",
      conditions: "מומלץ בבניית מחיצות פנים במשרדים וחדרי מגורים.",
      priority: "מומלץ",
      sourceTitle: "מפרט מערכות גבס",
      sourceUrl: "/logistics-dict",
      clientExplanation: "פס הספוג שמתחת למסלול משפר את הבידוד האקוסטי של הקיר בצורה מורגשת.",
    },
  ],
  "טיח": [
    {
      productName: "רשת אינטרגלס לטיח ופינות טיח מגולוונות/PVC",
      category: "טיח",
      relevance: "מונעת סדיקה בחיבורי בטון-בלוק ושומרת על פינות ישרות ועמידות במכות.",
      conditions: "נדרשת בחיבורי חומרים שונים (בטון/בלוק או לוחות בידוד).",
      priority: "חובה",
      sourceTitle: "מפרט מניעת גשרי קור ומערכות טיח (ת״י 1045 / ת״י 1920)",
      sourceUrl: "https://www.sii.org.il/",
      clientExplanation: "בחלקי שלד שבהם בטון פוגש בלוק, הרשת מונעת הופעת סדקי תפר לאורך הקיר.",
    },
  ],
  "שיקום בטון": [
    {
      productName: "פריימר הגנה אנטי-קורוזיבי לברזל זיון",
      category: "שיקום בטון",
      relevance: "מגן על ברזל הזיון שנחשף ונוקה מחלודה ומקשר את מלט השיקום.",
      conditions: "נדרש בכל שיקום בטון שבו נחשף ברזל זיון חלוד.",
      priority: "חובה",
      sourceTitle: "מפרט מערכת שיקום בטון תלת-שלבית",
      sourceUrl: "https://isr.sika.com/",
      clientExplanation: "סגירה במלט בלבד בלי להגן על הברזל החלוד עלולה לאפשר לחלודה להמשיך ולהתפתח מתחת לתיקון.",
    },
  ],
  "צנרת ואביזרים": [
    {
      productName: "אטמים / טבעות הידוק / סרט טפלון וחותך צנרת תואם מערכת",
      category: "צנרת ואביזרים",
      relevance: "מבטיח חיתוך ישר בזווית 90 מעלות ואטימה תקינה של המחברים מאותו יצרן.",
      conditions: "כאשר עובדים עם מערכת צנרת רב-שכבתית או הברגות.",
      priority: "מומלץ",
      sourceTitle: "מדריך התאמת מערכות צנרת ואביזרים",
      sourceUrl: "/logistics-dict",
      clientExplanation: "חיתוך נקי והרכבה עם אביזרים תואמים של אותו יצרן שומרים על אטימות החיבור.",
    },
  ],
};

function detectDomain(
  query: string,
  intent: IntentClassification,
  diagnosis?: DiagnosisState,
): CrossSellDomain | null {
  const combined = `${query} ${diagnosis?.domain || ""} ${intent.entities.categories.join(" ")}`.toLowerCase();
  if (/פורצלן|אריח|ריצוף|קרמיקה|דבק/i.test(combined)) return "הדבקת אריחים";
  if (/חדר\s*רטוב|מקלחת|אמבטיה|sikatop|107|מאגר/i.test(combined)) return "איטום חדרים רטובים";
  if (/גג|פוליגג|זפת|שלולית|איטום/i.test(combined)) return "איטום גגות";
  if (/צבע|שליכט|בונדרול|סופרקריל|נירוקריל/i.test(combined)) return "צביעה וגמר";
  if (/גבס/i.test(combined)) return "גבס";
  if (/טיח|גשר(?:י)?\s*קור|בידוד/i.test(combined)) return "טיח";
  if (/שיקום\s*בטון|ברזל\s*חשוף|חלודה|monotop/i.test(combined)) return "שיקום בטון";
  if (/צנרת|צינור|sp|מולטיגול|פקס|אינסטלציה/i.test(combined)) return "צנרת ואביזרים";
  return null;
}

export function getCrossSellingRecommendations(params: {
  query: string;
  intent: IntentClassification;
  diagnosis?: DiagnosisState;
  dictItems?: LogisticsDictItem[];
}): CrossSellRecommendation[] {
  const { query, intent, diagnosis, dictItems = [] } = params;
  const domain = detectDomain(query, intent, diagnosis);
  if (!domain) return [];

  const list = VERIFIED_SYSTEM_CROSS_SELLS[domain] ?? [];
  return list.map((rec) => {
    // ניסיון להתאים מק״ט חי מתוך מילון_לוגיסט אם קיים
    const match = dictItems.find((d) => {
      const hay = `${d.name} ${d.keywords} ${d.category}`.toLowerCase();
      const firstWord = rec.productName.split(/[\s(/]+/).find((w) => w.length >= 4);
      return firstWord ? hay.includes(firstWord.toLowerCase()) : false;
    });
    return {
      ...rec,
      sku: match?.sku,
    };
  });
}
