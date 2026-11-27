/**
 * Stage 5 — Consultative Sales Engine
 * מיישם את Consultative Selling, SPIN Selling, Challenger Sale ו-System Selling
 * המטרה: ללמד את הנציג להבין את הלקוח ולא לשנן תסריט מכירה
 */

import type {
  DiagnosisState,
  IntentClassification,
  SalesFrameworkAdvice,
} from "./types";

export function buildSalesFrameworkAdvice(
  query: string,
  intent: IntentClassification,
  diagnosis: DiagnosisState,
): SalesFrameworkAdvice {
  const qLower = query.toLowerCase();

  // 1. התנגדות למחיר / מתחרה -> Challenger Sale (Teach, Tailor, Take Control)
  if (
    intent.entities.objectionType === "מחיר" ||
    /יקר|זול|הנחה|מתחרה/i.test(qLower)
  ) {
    return {
      frameworkName: "Challenger Sale",
      focusLabel: "Teach · Tailor · Take Control — להמחיש ערך במקום להוריד מחיר אוטומטית",
      questionsToAsk: [
        "מה חשוב לך יותר בפרויקט הזה — עלות רכישה ראשונית או שקט תעשייתי בלי תיקון חוזר בעוד שנה?",
        "האם בהצעה המתחרה כלולים גם המקשר/הפריימר הנדרש וגם הגמישות שמתאימה לתשתית שלך?",
      ],
      teachPoint:
        "למד את הלקוח שעלות החומר היא חלק קטן מעלות העבודה הכוללת — פירוק ותיקון חוזר יקרים פי כמה מההפרש לחומר מתאים.",
      nextStepCue:
        "השווה שני פתרונות מאושרים במילון (בסיסי מול מערכתי) והסבר במה כל אחד מתאים לתשתית.",
    };
  }

  // 2. מכירה משלימה / מערכת -> System Selling
  if (
    intent.primaryIntent === "CROSS_SELLING" ||
    intent.secondaryIntents.includes("CROSS_SELLING") ||
    /מערכת/i.test(qLower)
  ) {
    return {
      frameworkName: "System Selling",
      focusLabel: "התאמת רכיבים למערכת עבודה שלמה (לפי מפרט יצרן מאושר)",
      questionsToAsk: [
        "כדי שלא תיתקע באמצע העבודה באתר — איזה שלב אתה מבצע קודם: הכנת תשתית או כבר יישום סופי?",
        "יש לך כבר מקשר/פריימר או רשת שריון מתאימים למערכת, או שתרצה שאצמיד לך את המערכת המלאה?",
      ],
      teachPoint:
        "הלקוח קונה תוצאה (רצפה שלא מתנתקת / גג אטום), לא רק שק בודד. חבר רק רכיבים שמוצדקים במפרט.",
      nextStepCue:
        "הפרד בבירור בין רכיב חובה במפרט לבין אביזר משלים לנוחות הביצוע.",
    };
  }

  // 3. אבחון לקוח / הדרכת צביעה / חוסר בהירות -> Consultative Selling + SPIN
  if (
    intent.primaryIntent === "CUSTOMER_DIAGNOSIS" ||
    intent.secondaryIntents.includes("CUSTOMER_DIAGNOSIS") ||
    /שואל|שילוב|מתלבט|מבקש\s*צבע/i.test(qLower)
  ) {
    return {
      frameworkName: "SPIN Selling",
      focusLabel: "Situation → Problem → Implication → Need-Payoff (לגלות צורך לפני שממליצים)",
      questionsToAsk: [
        "Situation: איפה העבודה מתבצעת (פנים/חוץ/חדר רטוב) ומה מצב התשתית כרגע?",
        "Problem: האם הייתה בעיית קילוף, עובש או ספיגה בעבר?",
        "Implication + Need-Payoff: אם נדלג על מקשר או נתאים צבע לא מתאים — תוך כמה זמן תצטרך לצבוע שוב? לכן כדאי להתאים פתרון מדויק מהפעם הראשונה.",
      ],
      teachPoint:
        "נציג מקצועי לא קופץ למדף לפני שהבין את הקיר/הרצפה. שאלה אחת טובה חוסכת החזרות ותקלות.",
      nextStepCue:
        diagnosis.substrateType
          ? `כבר ידוע שהתשתית היא ${diagnosis.substrateType} — המשך לשאלת האבחון הבאה.`
          : "שאל את שאלת האבחון האחת המוצגת בכרטיס לפני בחירת המק״ט.",
    };
  }

  // 4. ייעוץ כללי / השוואת מוצרים -> Consultative Selling
  return {
    frameworkName: "Consultative Selling",
    focusLabel: "הקשבה → שאלות גילוי → זיהוי צורך אמיתי → התאמת פתרון",
    questionsToAsk: [
      "איזו תוצאה הלקוח מצפה לראות בסיום העבודה (גמישות, עמידות מים, נשימת קיר)?",
      "האם המבצע הוא קבלן מנוסה שמכיר את שיטת היישום או לקוח פרטי שצריך הנחיה מסודרת?",
    ],
    teachPoint:
      "הסבר ללקוח בקצרה *למה* הפתרון שנבחר מתאים לתנאים שלו, וצייד אותו בהוראות יישום מאומתות מהמקור.",
    nextStepCue:
      "וודא התאמה מלאה בין התשתית, שיטת היישום והמלאי הזמין בסניפי החרש 10 / התלמיד 6.",
  };
}
