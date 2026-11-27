import {Product} from '../../types/product';
import {
  CrossSellDomain,
  CrossSellRecommendation,
  DiagnosisState,
  IntentClassification,
} from './types';

const VERIFIED_SYSTEM_CROSS_SELLS: Record<
  CrossSellDomain,
  Omit<CrossSellRecommendation, 'sku'>[]
> = {
  'הדבקת אריחים': [
    {
      productName: 'פריימר מקשר לתשתית בלתי סופגת / הדבקה על אריח קיים',
      category: 'הדבקת אריחים',
      relevance: 'מבטיח אחיזה מכנית של הדבק הצמנטי על גבי גלזורה קיימת או בטון חלק.',
      conditions: 'נדרש כאשר מדביקים על ריצוף קיים, בטון מוחלק או תשתית בעלת ספיגות חריגה.',
      priority: 'חובה',
      sourceTitle: 'הנחיות להדבקת פורצלן (80x80) על ריצוף קיים — ת״י 4004',
      sourceUrl: 'https://www.mr-fix.co.il/',
      clientExplanation:
        'כדי שהדבק לא ישתחרר מהאריח החלק הקיים, הפריימר יוצר שכבת חיבור מחוספסת ואמינה.',
    },
    {
      productName: 'רובה אקרילית / אפוקסית ומרווחי פילוס (קליפסים + יתדות)',
      category: 'הדבקת אריחים',
      relevance: 'שומרת על פוגות אחידות, אטימת מרווחים ומניעת מדרגות (Lippage) באריחים גדולים.',
      conditions: 'מומלץ תמיד בריצוף פורצלן 60x60 / 80x80 ומעלה, ובאזורי מים חובה רובה מתאימה.',
      priority: 'מומלץ',
      sourceTitle: 'מדריך מערכת הדבקת גרניט פורצלן (ח. סבן)',
      sourceUrl: 'https://www.mr-fix.co.il/',
      clientExplanation:
        'באריחי 80x80 המרווחים והמפלסים שומרים על מישור ישר ומונעים הפרשי גובה בין אריחים.',
    },
  ],
  'איטום חדרים רטובים': [
    {
      productName: 'סרט איטום אלסטי לפינות וחיבורי קיר-רצפה',
      category: 'איטום חדרים רטובים',
      relevance: 'מטפל בתנועות ובתזוזות שבין הרצפה לקירות בנקודות התורפה של המקלחת.',
      conditions: 'נדרש בחיבורי רצפה-קיר ובמעברי צנרת כחלק ממערכת איטום חדרים רטובים תקנית.',
      priority: 'חובה',
      sourceTitle: 'מפרט מערכות איטום צמנטיות לחדרים רטובים (Sika / ת״י 1752)',
      sourceUrl:
        'https://isr.sika.com/he/construction/waterproofing/cementitious-waterproofing/sikatop-seal-107.html',
      clientExplanation:
        'רוב הרטיבות במקלחת מתחילה בחיבור בין הרצפה לקיר — הסרט הגמיש מגשר על תזוזות עדינות בפינה.',
    },
    {
      productName: 'פריימר / חומר קישור למערכת האיטום (לפי תשתית)',
      category: 'איטום חדרים רטובים',
      relevance: 'מאזן ספיגות וקושר אבק בתשתיות בטון או טיח צמנטי לפני שכבת האיטום.',
      conditions: 'כאשר התשתית מאובקת, סופגת במיוחד או לפי דרישת יצרן האיטום הספציפי.',
      priority: 'מומלץ',
      sourceTitle: 'SikaTop Seal 107 / מערכות איטום חדרים רטובים',
      sourceUrl: 'https://isr.sika.com/',
      clientExplanation: 'מוודא שחומר האיטום נתפס באופן אחיד על כל שטח החדר ולא נספג מהר מדי.',
    },
  ],
  'איטום גגות': [
    {
      productName: 'פריימר מקשר לגג (אקרילי / פוליאוריטני בהתאם לחומר העליון)',
      category: 'איטום גגות',
      relevance: 'מכין את תשתית הבטון או היריעה הישנה ומונע התקלפות של מערכת האיטום.',
      conditions: 'נדרש לפי מפרטי יצרני האיטום לפני יישום שכבת האיטום העליונה על תשתית קיימת.',
      priority: 'חובה',
      sourceTitle: 'הנחיות איטום גגות שטוחים (אקדמיית ח. סבן / יצרני איטום)',
      sourceUrl: '/',
      clientExplanation: 'שכבת היסוד מקבעת את התשתית הקיימת ויוצרת חיבור חזק בין הגג לציפוי האיטום.',
    },
    {
      productName: 'רשת אינטרגלס / בד פוליאסטר לשריון חיבורים ורולקות',
      category: 'איטום גגות',
      relevance: 'מחזקת את שכבת האיטום באזורי סדקים, רולקות ומעברי צנרת בגג.',
      conditions: 'כאשר יש סדקים בתשתית, חיבורי קירות מעקה או צנרת חודרת.',
      priority: 'מומלץ',
      sourceTitle: 'מדריך הכנת גג שטוח ורולקות',
      sourceUrl: '/',
      clientExplanation:
        'הרשת מחזקת את חומר האיטום בדיוק בנקודות שבהן הגג מתרחב ומתכווץ משינויי מזג אוויר.',
    },
  ],
  'צביעה וגמר': [
    {
      productName: 'בונדרול סופר / פריימר מקשר לתשתית',
      category: 'צביעה וגמר',
      relevance: 'מקשר צבע אקרילי חדש לתשתית סיד, שפכטל חדש או קיר מתפורר.',
      conditions: 'נדרש כאשר הקיר צבוע בסיד, לאחר תיקוני שפכטל או בקיר עם אבק/קילוף.',
      priority: 'חובה',
      sourceTitle: 'פרוטוקול ייעוץ צביעה בדלפק (טמבור / נירלט)',
      sourceUrl: '/',
      clientExplanation:
        'בלי מקשר על סיד או שפכטל חדש, הצבע האקרילי עלול להתקלף; שכבת יסוד קושרת הכל לקיר.',
    },
    {
      productName: 'סט רולר איכותי, מברשת חיתוך, מסקינגטייפ וניילון הגנה',
      category: 'צביעה וגמר',
      relevance: 'חוסך זמן עבודה ונותן כיסוי אחיד בלי סימני צביעה ולכלוך.',
      conditions: 'בכל עבודת צביעה פנימית או חיצונית, כאופציה משלימה לנוחות הלקוח.',
      priority: 'אופציונלי',
      sourceTitle: 'מדריך דלפק צבע ח. סבן',
      sourceUrl: '/',
      clientExplanation: 'כדי שתוכל להתחיל לעבוד מיד כשתגיע הביתה בלי נסיעה נוספת על מברשת או דבק נייר.',
    },
  ],
  גבס: [
    {
      productName: 'ברגי פח-גבס, סרט חיזוק פיבר/נייר ושפכטל לחיבורים',
      category: 'גבס',
      relevance: 'משלים את מערכת הקיר מלוח גבס בודד לקיר חלק ומוכן לצבע.',
      conditions: 'נדרש בכל התקנת מחיצת גבס או הנמכת תקרה.',
      priority: 'חובה',
      sourceTitle: 'מפרט מערכות גבס (אורבונד / טמבור גבס)',
      sourceUrl: '/',
      clientExplanation: 'סרט החיזוק והשפכטל סוגרים את התפרים שבין הלוחות ומונעים סדקים אחרי הצביעה.',
    },
    {
      productName: 'סרט איטום אקוסטי להיקף מסלולים וניצבים',
      category: 'גבס',
      relevance: 'מפחית העברת רעשים ורעידות בין פרופיל המתכת לרצפה ולקירות.',
      conditions: 'מומלץ בבניית מחיצות פנים במשרדים וחדרי מגורים.',
      priority: 'מומלץ',
      sourceTitle: 'מדריך בידוד אקוסטי במחיצות גבס',
      sourceUrl: '/',
      clientExplanation: 'סרט הספוג מונע מעבר רעשי הולם דרך פרופיל הפח ומשפר את הבידוד בחדר.',
    },
  ],
  טיח: [
    {
      productName: 'רשת אינטרגלס לממשק בטון-בלוק + פריימר / הרבצה צמנטית',
      category: 'טיח',
      relevance: 'מונע סדיקה בין עמודי בטון לבלוקים ומבטיח הידבקות מלאה לשכבת הטיח.',
      conditions: 'נדרש ביישום טיח על מעטפת בלוקים ובטון או מעל לוחות בידוד בגשרי קור.',
      priority: 'חובה',
      sourceTitle: 'ת״י 1045 ומדריך מערכות טיח ובידוד',
      sourceUrl: 'https://www.sii.org.il/',
      clientExplanation:
        'בטון ובלוק מתרחבים אחרת בשמש — רשת השריון מגשרת על החיבור ומונעת סדק לאורך העמוד.',
    },
  ],
  'שיקום בטון': [
    {
      productName: 'חומר פסיבציה אנטי-קורוזיבי לברזל זיון + מקשר צמנטי',
      category: 'שיקום בטון',
      relevance: 'עוצר את המשך החלודה בברזל החשוף לפני סגירת השיקום.',
      conditions: 'חובה בכל שיקום בטון שבו נחשף ברזל זיון חלוד (לפי EN 1504).',
      priority: 'חובה',
      sourceTitle: 'מפרט שיקום בטון וחשיפת ברזל זיון (EN 1504)',
      sourceUrl: 'https://isr.sika.com/',
      clientExplanation:
        'אם סוגרים מלט על ברזל חלוד בלי חומר הגנה ייעודי, החלודה ממשיכה להתפשט ולדחוף את הבטון.',
    },
  ],
  'צנרת ואביזרים': [
    {
      productName: 'מחברים תואמי יצרן, סרט טפלון / אטמים ומכשיר קליברציה',
      category: 'צנרת ואביזרים',
      relevance: 'מונע נזילות בחיבורים ומבטיח התאמת מידות מדויקת בין הצינור למחבר.',
      conditions: 'כאשר עובדים עם מערכת צנרת רב-שכבתית או הברגות.',
      priority: 'מומלץ',
      sourceTitle: 'מדריך התאמת מערכות צנרת ואביזרים',
      sourceUrl: '/',
      clientExplanation: 'חיתוך נקי והרכבה עם אביזרים תואמים של אותו יצרן שומרים על אטימות החיבור.',
    },
  ],
};

function detectDomain(
  query: string,
  intent: IntentClassification,
  diagnosis?: DiagnosisState,
): CrossSellDomain | null {
  const combined = `${query} ${diagnosis?.domain || ''} ${intent.entities.categories.join(' ')}`.toLowerCase();
  if (/פורצלן|אריח|ריצוף|קרמיקה|דבק/i.test(combined)) return 'הדבקת אריחים';
  if (/חדר\s*רטוב|מקלחת|אמבטיה|sikatop|107|מאגר/i.test(combined)) return 'איטום חדרים רטובים';
  if (/גג|פוליגג|זפת|שלולית|איטום/i.test(combined)) return 'איטום גגות';
  if (/צבע|שליכט|בונדרול|סופרקריל|נירוקריל/i.test(combined)) return 'צביעה וגמר';
  if (/גבס/i.test(combined)) return 'גבס';
  if (/טיח|גשר(?:י)?\s*קור|בידוד/i.test(combined)) return 'טיח';
  if (/שיקום\s*בטון|ברזל\s*חשוף|חלודה|monotop/i.test(combined)) return 'שיקום בטון';
  if (/צנרת|צינור|sp|מולטיגול|פקס|אינסטלציה/i.test(combined)) return 'צנרת ואביזרים';
  return null;
}

export function getCrossSellingRecommendations(params: {
  query: string;
  intent: IntentClassification;
  diagnosis?: DiagnosisState;
  catalogProducts?: Product[];
}): CrossSellRecommendation[] {
  const {query, intent, diagnosis, catalogProducts = []} = params;
  const domain = detectDomain(query, intent, diagnosis);
  if (!domain) return [];

  const list = VERIFIED_SYSTEM_CROSS_SELLS[domain] ?? [];
  return list.map((rec) => {
    const match = catalogProducts.find((p) => {
      const hay = `${p.name} ${p.keywords} ${p.category}`.toLowerCase();
      const firstWord = rec.productName.split(/[\s(/]+/).find((w) => w.length >= 4);
      return firstWord ? hay.includes(firstWord.toLowerCase()) : false;
    });
    return {
      ...rec,
      sku: match?.sku,
    };
  });
}
