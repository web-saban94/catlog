import {SimulationEvaluation, SimulationScenarioId, SimulationTurn} from './types';

export interface SimulationScenarioDef {
  id: SimulationScenarioId;
  title: string;
  personaName: string;
  openingCustomerLine: string;
  goalForRep: string;
  repHint: string;
}

export const SIMULATION_SCENARIOS: SimulationScenarioDef[] = [
  {
    id: 'competitor_price',
    title: 'לקוח שטוען "במקום אחר זול יותר"',
    personaName: 'קבלן שיפוצים — אבי',
    openingCustomerLine:
      'שמע, הציעו לי ליד הצומת חומר איטום ב-30 שקל פחות לדלי. למה שאקנה אצלכם?',
    goalForRep: 'הדגמת Challenger Sale: שאלת הקשר תשתית והסבר ערך מערכתי בלי לחץ או הורדת מחיר מיד.',
    repHint: 'שאל מה כוללת ההצעה האחרת (פריימר/סרט/עמידות למים עומדים) והסבר את עלות התיקון החוזר.',
  },
  {
    id: 'cheapest_product',
    title: 'לקוח שמבקש "רק את ההכי זול"',
    personaName: 'לקוח פרטי — דני',
    openingCustomerLine:
      'תן לי בבקשה את הדבק הכי זול שיש לך, אני רק מדביק כמה אריחי פורצלן במרפסת שמש.',
    goalForRep: 'עצירת טעות תשתית מנומסת, אבחון חשיפה לשמש וגשם והסבר תקן C2TE S1/S2.',
    repHint: 'הסבר בשקיפות שבמרפסת שמש אריח פורצלן מתנתק עם דבק פנים רגיל.',
  },
  {
    id: 'unsure_contractor',
    title: 'לקוח/קבלן שמתלבט מה לבחור',
    personaName: 'קבלן צבע — יוסי',
    openingCustomerLine:
      'יש לי חזית בניין ליד הים עם כתמים ורוחות. הלקוח ביקש שליכט רגיל ואני מתלבט.',
    goalForRep: 'אבחון צרכים מדורג (שאלה אחת בכל פעם) והשוואה אובייקטיבית בין אקרילי לסיליקוני.',
    repHint: 'בדוק מצב תשתית, הסבר על שליכט סיליקוני בסביבה ימית ונשימת קיר.',
  },
  {
    id: 'wrong_substrate',
    title: 'לקוח שמבקש מוצר לא מתאים לתשתית',
    personaName: 'בעל דירה — רוני',
    openingCustomerLine:
      'אני צריך דלי צבע סופרקריל רגיל לצבוע תקרת מקלחת שכבר מתחילה לקבל נקודות עובש.',
    goalForRep: 'שיקוף סיכון אמיתי ללא הפחדה, שאלת אבחון והצעת חיטוי + צבע נגד עובש.',
    repHint: 'שאל על אוורור המקלחת והסבר למה צבע פנים רגיל יתקלף שוב מעל עובש לא מטופל.',
  },
  {
    id: 'cross_sell_objection',
    title: 'לקוח שמתנגד להצעת מוצר משלים',
    personaName: 'משפץ — משה',
    openingCustomerLine:
      'עזוב אותי מבונדרול ורשת, תביא רק את המוצר העיקרי — סתם דוחפים לי עוד דברים.',
    goalForRep: 'הסבר מבוסס מפרט יצרן והחזרת השליטה ללקוח ("אם כבר יש לך באתר אז מצוין").',
    repHint: 'הסבר במשפט אחד את התנאי מהמפרט ובדוק אם כבר יש לו פריימר באתר.',
  },
];

export function detectSimulationScenario(query: string): SimulationScenarioDef {
  const q = query.toLowerCase();
  if (/זול\s*יותר|מתחרה|הנחה|התנגד.*מחיר|מחיר/i.test(q)) {
    return SIMULATION_SCENARIOS.find((s) => s.id === 'competitor_price')!;
  }
  if (/הכי\s*זול/i.test(q)) {
    return SIMULATION_SCENARIOS.find((s) => s.id === 'cheapest_product')!;
  }
  if (/מתנגד.*משלים|דוחפים|פריימר|בונדרול/i.test(q)) {
    return SIMULATION_SCENARIOS.find((s) => s.id === 'cross_sell_objection')!;
  }
  if (/מתלבט|לא\s*סגור|איזה\s*סוג/i.test(q)) {
    return SIMULATION_SCENARIOS.find((s) => s.id === 'unsure_contractor')!;
  }
  return SIMULATION_SCENARIOS.find((s) => s.id === 'wrong_substrate')!;
}

export function generateCustomerSimulationTurn(params: {
  scenarioId: SimulationScenarioId;
  repMessage: string;
  turnNumber: number;
}): {customerMessage: string; hintForRep: string} {
  const msg = params.repMessage.trim();
  const hasQuestion = msg.includes('?') || /איזה|האם|מה|על\s*איזו|פנים|חוץ/.test(msg);
  const explainsReason = /בגלל|כדי|לפי|תקן|מפרט|פריימר|עמידות|תיקון|תשתית|עובש|שמש/.test(msg);
  const pushesPriceOnly = /הנחה|אוריד\s*לך|קח\s*וזול/i.test(msg);

  if (params.scenarioId === 'competitor_price') {
    if (pushesPriceOnly) {
      return {
        customerMessage:
          'סבבה, אז אם אתה רק מוריד לי מחיר אני יכול לקפוץ גם לשני. מה תכלס ההבדל בחומר אצלך?',
        hintForRep: 'הדגש תאימות למערכת מלאה, תקן היצרן ומניעת תקלות חוזרות.',
      };
    }
    if (hasQuestion || explainsReason) {
      return {
        customerMessage:
          'אוקיי, נקודה טובה — שם באמת הציעו רק את הדלי בלי שכבת יסוד. זה בטוח מחזיק יותר זמן אם משלבים פריימר?',
        hintForRep: 'אשר לפי המפרט והצע את החבילה המדויקת בלי להגזים.',
      };
    }
    return {
      customerMessage: 'לא ענית לי על הפער במחיר — חבר שלי קנה משהו פשוט ובאמת נראה לי חבל לשלם כפול.',
      hintForRep: 'עבור לגישת Challenger: למד על עלות העבודה החוזרת מול ההפרש הקטן בחומר.',
    };
  }

  if (params.scenarioId === 'cheapest_product') {
    if (hasQuestion || /c2te|s1|חוץ|מרפסת|שמש/.test(msg.toLowerCase())) {
      return {
        customerMessage:
          'אה, הבנתי — המרפסת פתוחה לשמש כל היום וזה פורצלן 80x80. איזה דבק בדיוק צריך שם שלא יתפרק?',
        hintForRep: 'ציין דבק C2TE S1 ומריחה כפולה (Double Buttering) עם הסבר קצר.',
      };
    }
    return {
      customerMessage: 'אל תסבך אותי, דבק אפור רגיל של פנים לא יתפוס גם במרפסת?',
      hintForRep: 'הסבר בבהירות את השפעת הפרשי הטמפרטורה בחוץ והיעדר גמישות בדבק רגיל.',
    };
  }

  if (params.scenarioId === 'cross_sell_objection') {
    if (/אם\s*יש\s*לך|לפי\s*היצרן|תשתית|לא\s*חובה/.test(msg)) {
      return {
        customerMessage:
          'וואלה, אהבתי שאתה לא סתם דוחף. את הבונדרול צריך רק אם הקיר הוא סיד ישן או בכל צביעה?',
        hintForRep: 'דייק את תנאי הדרישה מהמפרט (סיד / שפכטל חדש / קיר מתפורר).',
      };
    }
    return {
      customerMessage: 'תמיד בחנויות אומרים שצריך עוד דלי ועוד סרט. מאיפה לי שזה באמת חובה?',
      hintForRep: 'צטט את התנאי המדויק מהמפרט והחזר ללקוח את הבחירה.',
    };
  }

  if (hasQuestion || explainsReason) {
    return {
      customerMessage:
        'נשמע הגיוני מאוד. אז מה הסדר הנכון שאני צריך לעשות באתר, ומה בדיוק לקחת מהמדף?',
      hintForRep: 'תן שלבי יישום ברורים מתוך המפרט ובדוק אם יש שאלת סגירה.',
    };
  }

  return {
    customerMessage: 'אני עדיין לא לגמרי סגור — אפשר להסביר לי בשתי מילים מה מתאים לתנאים שאמרתי?',
    hintForRep: 'התחל בשאלת אבחון אחת קצרה ואז תן תשובה מדויקת מהמקור.',
  };
}

export function evaluateSimulationSession(
  turns: SimulationTurn[],
  scenarioId: SimulationScenarioId,
): SimulationEvaluation {
  const repText = turns
    .filter((t) => t.role === 'rep')
    .map((t) => t.text)
    .join(' ');
  const repCount = turns.filter((t) => t.role === 'rep').length || 1;

  const diagnosticScore = /\?|מה|איזו|האם|תשתית|פנים|חוץ/.test(repText) ? 8 : 4;
  const needsScore = /לקוח|צרכי|תנאי|חשיפה|רטיבות|קילוף|שטח|גודל/.test(repText) ? 8 : 5;
  const accuracyScore =
    /תקן|מפרט|יצרן|c2te|s1|sika|1045|בונדרול|שכבות|פסיבציה|סיליקוני/.test(repText.toLowerCase())
      ? 9
      : 6;
  const fitScore = repCount >= 2 && accuracyScore >= 8 ? 8 : 6;
  const crossSellScore = /פריימר|בונדרול|סרט|רשת|משלים|אם\s*יש/.test(repText) ? 8 : 5;
  const commScore = !/דפוק|לא\s*מבין|חייב\s*ממני/.test(repText) && repText.length > 35 ? 9 : 6;

  const criteria: SimulationEvaluation['criteria'] = [
    {
      key: 'diagnosticQuestions',
      label: 'שאלות אבחון מדורגות',
      score: diagnosticScore,
      feedback:
        diagnosticScore >= 8
          ? 'שאלת שאלות ממוקדות לפני המלצה על מוצר.'
          : 'מומלץ לשאול שאלת אבחון קצרה על התשתית והחשיפה לפני ההצעה.',
    },
    {
      key: 'needsUnderstanding',
      label: 'הבנת צורכי הלקוח',
      score: needsScore,
      feedback:
        needsScore >= 8
          ? 'שיקפת הבנה ברורה של תנאי העבודה של הלקוח.'
          : 'כדאי לברר לעומק את סביבת העבודה והמצב הקיים באתר.',
    },
    {
      key: 'informationAccuracy',
      label: 'דיוק מקצועי ואמינות מפרט',
      score: accuracyScore,
      feedback:
        accuracyScore >= 8
          ? 'הפנית לנתונים ולמושגי מפרט נכונים ומאומתים.'
          : 'חזק את ההסבר באמצעות תקן או הנחיית יצרן מדויקת.',
    },
    {
      key: 'solutionFit',
      label: 'התאמת הפתרון לתשתית',
      score: fitScore,
      feedback:
        fitScore >= 8
          ? 'הפתרון מותאם לבעיית הלקוח בתרחיש.'
          : 'חבר את הפתרון המוצע ישירות לסוג התשתית שהלקוח תיאר.',
    },
    {
      key: 'crossSellJustification',
      label: 'הצדקת מוצרים משלימים בשקיפות',
      score: crossSellScore,
      feedback:
        crossSellScore >= 8
          ? 'הסברת את הצורך במוצר המשלים בצורה מקצועית ושקופה.'
          : 'כדאי להזכיר תנאי מפרט ברור עבור פריימר/סרט/כלי עבודה משלים.',
    },
    {
      key: 'communicationQuality',
      label: 'איכות תקשורת ושירותיות',
      score: commScore,
      feedback:
        commScore >= 8
          ? `שפה מכבדת, ברורה ובונה אמון בתרחיש (${scenarioId}).`
          : 'שמור על ניסוח קצר, ברור ושקוף שנותן ללקוח ביטחון.',
    },
  ];

  const avg = criteria.reduce((sum, c) => sum + c.score, 0) / criteria.length;
  const overallScore = Math.round(avg * 10);

  return {
    overallScore,
    coachingDisclaimer:
      'הציון והמשוב הם כלי אימון והדרכה פנימי לנציג בלבד, ואינם משמשים מדד להערכת עובד.',
    criteria,
    strengths: criteria.filter((c) => c.score >= 8).map((c) => `${c.label}: ${c.feedback}`),
    improvements: criteria.filter((c) => c.score < 8).map((c) => `${c.label}: ${c.feedback}`),
  };
}
