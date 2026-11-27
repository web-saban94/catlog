import {DiagnosisState, IntentClassification, SalesFrameworkAdvice} from './types';

export function buildSalesFrameworkAdvice(
  query: string,
  intent: IntentClassification,
  diagnosis: DiagnosisState,
): SalesFrameworkAdvice {
  const qLower = query.toLowerCase();

  if (intent.entities.objectionType === 'מחיר' || /יקר|זול|הנחה|מתחרה/i.test(qLower)) {
    return {
      frameworkName: 'Challenger Sale',
      focusLabel: 'Teach · Tailor · Take Control — להמחיש ערך במקום להוריד מחיר אוטומטית',
      questionsToAsk: [
        'מה חשוב לך יותר בפרויקט הזה — עלות רכישה ראשונית או שקט תעשייתי בלי תיקון חוזר בעוד שנה?',
        'האם בהצעה המתחרה כלולים גם המקשר/הפריימר הנדרש וגם הגמישות שמתאימה לתשתית שלך?',
      ],
      teachPoint:
        'למד את הלקוח שעלות החומר היא חלק קטן מעלות העבודה הכוללת — פירוק ותיקון חוזר יקרים פי כמה מההפרש לחומר מתאים.',
      nextStepCue:
        'השווה שני פתרונות מאושרים בקטלוג (בסיסי מול מערכתי) והסבר במה כל אחד מתאים לתשתית.',
    };
  }

  if (intent.primaryIntent === 'CROSS_SELLING' || /משלימ|מערכת/i.test(qLower)) {
    return {
      frameworkName: 'System Selling',
      focusLabel: 'מכירת מערכת שלמה — מבוססת מפרט היצרן ולא תוספת אקראית',
      questionsToAsk: [
        'האם יש לך כבר באתר את שכבת היסוד (הפריימר) או סרט החיזוק לפינות, או שנארוז את זה יחד?',
        'באיזו שיטת יישום תשתמש באתר (מברשת/רולר/מאלג׳) כדי שנבדוק אם חסר כלי?',
      ],
      teachPoint:
        'הצג כל מוצר משלים כחוליה הכרחית לפי הוראות היצרן, בשקיפות ובלי הפחדה — הלקוח בוחר אם כבר יש לו במחסן או לקחת עכשיו.',
      nextStepCue: 'אמת מול הלקוח איזה רכיבי מערכת כבר קיימים אצלו והצע להשלים רק את החסר.',
    };
  }

  if (
    intent.primaryIntent === 'CUSTOMER_DIAGNOSIS' ||
    intent.requiredContext.length > 0 ||
    !diagnosis.substrateType
  ) {
    return {
      frameworkName: 'SPIN Selling',
      focusLabel: 'SPIN — Situation -> Problem -> Implication -> Need-payoff (שאלה אחת בכל פעם)',
      questionsToAsk: [
        'Situation: על איזו תשתית בדיוק מבוצעת העבודה והאם מדובר בפנים או בחוץ?',
        'Problem / Implication: האם יש כרגע קילופים, סדיקה או רטיבות שחוזרים אחרי זמן קצר?',
        'Need-payoff: אם נתאים מערכת שמחזיקה על התשתית הקיימת, מה הכי יקל עליך בביצוע?',
      ],
      teachPoint:
        'נציג שואל שאלת אבחון אחת ממוקדת לפני שליפת שק או דלי מהמדף מונע טעויות יישום ויוצר סמכות מקצועית.',
      nextStepCue: 'השתמש בשאלת האבחון הבודדת המוצגת למטה וקבל תשובה קצרה מהלקוח.',
    };
  }

  return {
    frameworkName: 'Consultative Selling',
    focusLabel: 'מכירה ייעוצית — התאמה מקצועית מדויקת לתנאי השטח של הלקוח',
    questionsToAsk: [
      'מתי מתוכנן היישום והאם השטח נקי ויבש לפי דרישות המפרט?',
      'האם יש צורך בתוספת חומר להכנת תשתית לפני השכבה העיקרית?',
    ],
    teachPoint:
      'חבר בין הנתונים מהמפרט הרשמי לבין תנאי העבודה של הלקוח בפועל כדי שיצא מהדלפק בטוח ביישום.',
    nextStepCue: 'סכם בקצרה את סדר השלבים וצרף את המק״ט המשלים הנדרש לרשימת ההזמנה.',
  };
}
