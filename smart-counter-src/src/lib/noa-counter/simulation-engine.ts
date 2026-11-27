/**
 * Stage 9 — Counter Roleplay Simulation Engine
 * מצב תרגול נציג שבו נועה משחקת את תפקיד הלקוח ובסיום נותנת משוב הדרכתי ב-6 קריטריונים.
 * הציון הוא כלי הדרכתי בלבד ולא מדד להערכת עובד.
 */

import type {
  SimulationEvaluation,
  SimulationScenarioId,
  SimulationTurn,
} from "./types";

export type SimulationScenarioDef = {
  id: SimulationScenarioId;
  title: string;
  description: string;
  openingCustomerLine: string;
  repHint: string;
};

export const SIMULATION_SCENARIOS: SimulationScenarioDef[] = [
  {
    id: "cheapest_product",
    title: "לקוח שמבקש רק את המוצר הזול ביותר",
    description: "לקוח מבקש צבע או דבק 'הכי זול שיש' בלי להבין את התשתית והתנאים.",
    openingCustomerLine:
      "שלום, תן לי בבקשה את הדלי הכי זול של צבע לבן שיש לך. זה סתם לקיר, לא צריך משהו יקר.",
    repHint: "אל תתחיל במחיר — שאל שאלת אבחון אחת (פנים/חוץ או מצב התשתית) והסבר השלכות (SPIN).",
  },
  {
    id: "unsure_contractor",
    title: "קבלן שלא בטוח איזה חומר מתאים",
    description: "קבלן עומד להדביק פורצלן 80x80 על ריצוף קיים במרפסת ומתלבט.",
    openingCustomerLine:
      "אחי אני צריך דבק לריצוף 80 על 80, יש לי שם ריצוף ישן מתחת. איזה שק רגיל מספיק לזה?",
    repHint: "הסבר את הסיכון בדבק רגיל על תשתית לא סופגת + הצע C2TE/S1 + פריימר מקשר ומריחה כפולה.",
  },
  {
    id: "wrong_substrate",
    title: "לקוח שמבקש מוצר לא מתאים לתשתית",
    description: "לקוח מבקש איטום אקרילי רגיל לגג שטוח עם שלוליות מים עומדים.",
    openingCustomerLine:
      "תביא לי בבקשה חומר איטום אקרילי פשוט לגג, יש לי שם כמה שלוליות שלא יורדות אבל זה רק לחורף.",
    repHint: "תקן בעדינות (Challenger Teach): הסבר שחומר אקרילי אינו מתאים למים עומדים ממושכים והצע חלופה מתאימה.",
  },
  {
    id: "cross_sell_objection",
    title: "לקוח שמתנגד להצעת מוצר משלים",
    description: "לקוח לוקח חומר איטום לחדר רטוב ולא רוצה סרט פינות או פריימר.",
    openingCustomerLine:
      "למה אתה מוסיף לי עכשיו סרט איטום ופריימר? אני צריך רק את הדלי איטום, כל השאר סתם תוספת מיותרת.",
    repHint: "נמק מקצועית בשפה פשוטה (System Selling) בלי הפחדה, והבחן בין רכיב חובה להמלצה.",
  },
  {
    id: "competitor_price",
    title: "לקוח שמשווה מחירים למתחרה",
    description: "לקוח טוען שאצל המתחרה מעבר לכביש אותו מוצר זול יותר ב-15%.",
    openingCustomerLine:
      "שמע, בחנות ליד הציעו לי את השק הזה בפחות כסף. למה שאני אקנה אצלכם בח. סבן?",
    repHint: "שמור על קור רוח (Challenger): בדוק אם המתחרה הציע אותו תקן/משקל/מערכת שלמה והדגש זמינות, ייעוץ והובלה.",
  },
];

export function detectSimulationScenario(query: string): SimulationScenarioDef {
  const q = query.toLowerCase();
  if (/מתחרה|זול\s*יותר|פחות\s*כסף|מחיר/.test(q)) {
    return SIMULATION_SCENARIOS.find((s) => s.id === "competitor_price")!;
  }
  if (/משלים|תוספת/.test(q)) {
    return SIMULATION_SCENARIOS.find((s) => s.id === "cross_sell_objection")!;
  }
  if (/תשתית|לא\s*מתאים|שלולית|גג/.test(q)) {
    return SIMULATION_SCENARIOS.find((s) => s.id === "wrong_substrate")!;
  }
  if (/קבלן|מתלבט|לא\s*בטוח/.test(q)) {
    return SIMULATION_SCENARIOS.find((s) => s.id === "unsure_contractor")!;
  }
  return SIMULATION_SCENARIOS[0]!;
}

export function generateCustomerSimulationTurn(params: {
  scenarioId: SimulationScenarioId;
  repMessage: string;
  turnNumber: number;
}): { customerMessage: string; hintForRep: string } {
  const { scenarioId, repMessage, turnNumber } = params;
  const msg = repMessage.toLowerCase();
  const hasQuestion = repMessage.includes("?") || /איזה|מה|האם|איפה|כמה|ספר/.test(msg);
  const explainsWhy = /כי|מכיוון|בגלל|כדי|למנוע|תשתית|מפרט|גמיש|פריימר|עובי|שכבה|מים/.test(msg);
  const pushesPriceOnly = /הנחה|אוכל לעשות לך מחיר|בוא נסגור/.test(msg) && !explainsWhy;

  if (turnNumber <= 1) {
    if (hasQuestion) {
      return {
        customerMessage:
          scenarioId === "competitor_price"
            ? "הם לא שאלו אותי בכלל על התשתית — רק נתנו לי מחיר על דלי אחד. אצלי מדובר בקיר חוץ ליד הים."
            : scenarioId === "wrong_substrate"
              ? "זה גג שטוח של כ-45 מ״ר וכל חורף נשארת שם שלולית ליד המרזב במשך שבועיים."
              : "האמת שזה חדר אמבטיה בקומה שנייה, הקירות עם טיח ישן וקצת קילופים ליד המקלחון.",
        hintForRep: "מצוין ששאלת! עכשיו הסבר בשפה פשוטה את המשמעות הטכנית והצע פתרון מערכתי מבוסס מקור.",
      };
    }
    return {
      customerMessage: pushesPriceOnly
        ? "אוקיי, אז תן לי את הכי זול וזהו, רק תגיד לי שזה יחזיק לי."
        : "רגע, לא שאלת אותי על הקיר עצמו — איך אתה יודע שזה מתאים לעבודה שלי?",
      hintForRep: "הלקוח מרגיש שעדיין לא אובחן. שאל שאלת אבחון ממוקדת על התשתית או החשיפה.",
    };
  }

  if (explainsWhy) {
    return {
      customerMessage:
        "הבנתי, ההסבר שלך הגיוני מאוד. אם כך, איזה חומר מדויק ומה עוד כדאי לי לקחת כדי שהעבודה תחזיק כמו שצריך?",
      hintForRep: "סגור בצורה טבעית עם שם מוצר מדויק, שלב משלים מוצדק ובדיקת כמות/מלאי — או לחץ 'סיים סימולציה וקבל משוב'.",
    };
  }

  return {
    customerMessage:
      "עדיין מרגיש לי שזה יקר מדי. מה ההבדל בפועל בין המוצר הזול למערכת שאתה מציע?",
    hintForRep: "השתמש ב-Challenger Teach: תרגם את ההפרש למניעת תיקון חוזר ושמור על שקיפות מקצועית.",
  };
}

export function evaluateSimulationSession(
  turns: SimulationTurn[],
  scenarioId: SimulationScenarioId,
): SimulationEvaluation {
  const repTurns = turns.filter((t) => t.role === "rep").map((t) => t.text);
  const combined = repTurns.join(" ");
  const lower = combined.toLowerCase();

  const askedQuestions = repTurns.filter((t) => t.includes("?") || /איזה|מה|האם|איפה|כמה/.test(t)).length;
  const diagnosticScore = Math.min(10, Math.max(4, 4 + askedQuestions * 2));

  const addressedNeeds = /תשתית|פנים|חוץ|רטוב|שמש|גג|אריח|קילוף|לחות|תקציב/.test(lower) ? 8 : 5;
  const infoAccuracy =
    /c2te|s1|מריחה כפולה|פריימר|בונדרול|פוליאוריטני|סרט איטום|מפרט|יצרן|107|צולב/.test(lower)
      ? 9
      : /איכות|עמיד|מתאים/.test(lower)
        ? 7
        : 5;
  const solutionFit =
    scenarioId === "wrong_substrate" && /אקרילי.*לא.*מים עומדים|פוליאוריטני/.test(lower)
      ? 9
      : addressedNeeds >= 8 && infoAccuracy >= 7
        ? 8
        : 6;
  const crossSellJustification =
    /פריימר|בונדרול|סרט|רשת|רובה|משלים/.test(lower) && /כי|כדי|מונע|מחזק|תופס|אחיזה/.test(lower)
      ? 9
      : /פריימר|בונדרול|סרט|רשת/.test(lower)
        ? 6
        : 5;
  const communicationQuality =
    repTurns.length >= 2 && !/חייב לקנות|תקנה יקר/.test(lower) ? 9 : 7;

  const criteria: SimulationEvaluation["criteria"] = [
    {
      key: "diagnosticQuestions",
      label: "איכות שאלות האבחון",
      score: diagnosticScore,
      feedback:
        diagnosticScore >= 8
          ? "שאלת שאלות ממוקדות להבנת התשתית לפני הצעת מוצר."
          : "כדאי לשאול לפחות שאלת אבחון אחת (תשתית/חשיפה/מצב קיים) לפני הצעת פתרון.",
    },
    {
      key: "needsUnderstanding",
      label: "הבנת צורכי הלקוח",
      score: addressedNeeds,
      feedback:
        addressedNeeds >= 8
          ? "זיהית את תנאי האתר והחשש המרכזי של הלקוח."
          : "העמק בזיהוי התנאים בשטח כדי שהלקוח ירגיש הקשבה אמיתית.",
    },
    {
      key: "informationAccuracy",
      label: "דיוק המידע הטכני",
      score: infoAccuracy,
      feedback:
        infoAccuracy >= 8
          ? "שילבת עקרונות טכניים מאומתים בלי להמציא נתונים."
          : "ניתן לחזק את ההסבר בנתון מדויק מתוך המפרט או המילון הלוגיסטי.",
    },
    {
      key: "solutionFit",
      label: "התאמת הפתרון",
      score: solutionFit,
      feedback:
        solutionFit >= 8
          ? "הפתרון שהצעת תואם לתנאי התשתית והשימוש."
          : "וודא התאמה מלאה בין סוג התשתית לבין דרגת החומר המוצע.",
    },
    {
      key: "crossSellJustification",
      label: "הצדקת המוצרים המשלימים",
      score: crossSellJustification,
      feedback:
        crossSellJustification >= 8
          ? "נימקת מדוע הרכיב המשלים נדרש בשפה פשוטה וללא לחץ."
          : "כשמציעים פריימר או אביזר משלים, הסבר במשפט אחד איזו תקלה הוא מונע.",
    },
    {
      key: "communicationQuality",
      label: "איכות התקשורת בדלפק",
      score: communicationQuality,
      feedback: "טון ענייני, מכבד ובגובה העיניים.",
    },
  ];

  const avg10 = criteria.reduce((s, c) => s + c.score, 0) / criteria.length;
  const overallScore = Math.round(avg10 * 10);

  const strengths = criteria.filter((c) => c.score >= 8).map((c) => `${c.label}: ${c.feedback}`);
  const improvements = criteria.filter((c) => c.score < 8).map((c) => `${c.label}: ${c.feedback}`);

  return {
    overallScore,
    coachingDisclaimer:
      "הציון והמשוב הם כלי אימון והדרכה פנימי לנציג בלבד, ואינם משמשים מדד להערכת עובד.",
    criteria,
    strengths: strengths.length ? strengths : ["השתתפות פעילה בתרגול שיחת הדלפק."],
    improvements: improvements.length ? improvements : ["שמור על מבנה השיחה העקבי גם במעמד העומס בדלפק."],
  };
}
