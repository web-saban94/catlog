/**
 * Stage 7 — Interactive Response Card Generator & Reliability Enforcement
 * מפריד עובדה מאומתת ממסקנת מודל, מונע המצאת נתונים, ויוצר כפתורי פעולה עם יעד אמיתי בלבד.
 */

import { buildSalesFrameworkAdvice } from "./consultative-sales-engine";
import { getCrossSellingRecommendations } from "./cross-selling-engine";
import {
  applyDiagnosisAnswer,
  buildDiagnosisSummaryBadges,
  getNextSingleDiagnosisQuestion,
} from "./diagnosis";
import { isSafeInternalOrPublicHref } from "./knowledge-sources";
import { classifyIntentHybrid, type ModelIntentClassifierFn } from "./intent-classifier";
import {
  VERIFIED_KNOWLEDGE_DOCUMENTS,
  searchKnowledgeIndex,
  toCitedSources,
  type SearchKnowledgeDeps,
} from "./knowledge-index.server";
import type {
  CitedSource,
  DiagnosisState,
  InteractiveActionButton,
  InteractiveAnswerCard,
  KnowledgeDocument,
  TechnicalFactItem,
} from "./types";

export const MISSING_SOURCE_FALLBACK_MESSAGE =
  "המידע אינו מופיע במקורות המאושרים במאגר. יש לפנות ליועץ הטכני.";

export type GenerateCounterCardInput = {
  query: string;
  diagnosisState?: DiagnosisState;
  previousSources?: CitedSource[];
  modelClassifier?: ModelIntentClassifierFn;
  modelEnhancer?: (contextPrompt: string) => Promise<string | null>;
  knowledgeDeps?: SearchKnowledgeDeps;
};

function docsQueryIsSourceInspection(query: string): boolean {
  return /הצג\s*(?:את\s*)?ה?מקור|על\s*מה\s*מבוססת|מקור\s*(?:שעליו|התשובה)|מקורות\s*המידע/i.test(query);
}

function buildDynamicActions(docs: KnowledgeDocument[], query: string, hasDiagnosis: boolean): InteractiveActionButton[] {
  const actions: InteractiveActionButton[] = [];
  const primarySpec = docs.find((d) => d.url && (d.documentType === "spec" || d.documentType === "application_guide" || d.documentType === "comparison" || d.documentType === "product_page"));
  const videoDoc = docs.find((d) => d.videoUrl);
  const presDoc = docs.find((d) => d.presentationUrl || d.documentType === "presentation");
  const systemDoc = docs.find((d) => d.systemDomain);

  const specHref = primarySpec?.fileUrl || primarySpec?.url;
  if (specHref && isSafeInternalOrPublicHref(specHref)) {
    actions.push({
      id: "act-spec",
      kind: "spec",
      label: "📄 מפרט טכני ומקור",
      href: specHref,
    });
  }
  if (videoDoc?.videoUrl && isSafeInternalOrPublicHref(videoDoc.videoUrl)) {
    actions.push({
      id: "act-video",
      kind: "video",
      label: "🎬 סרטון יישום",
      href: videoDoc.videoUrl,
    });
  }
  const presHref = presDoc?.presentationUrl || presDoc?.url;
  if (presHref && isSafeInternalOrPublicHref(presHref)) {
    actions.push({
      id: "act-pres",
      kind: "presentation",
      label: "📊 מצגת הדרכה",
      href: presHref,
    });
  }
  if (systemDoc?.systemDomain) {
    actions.push({
      id: "act-sys",
      kind: "system",
      label: "🧩 מערכת מוצרים",
      query: `אילו מוצרים משלימים נדרשים במערכת ${systemDoc.systemDomain}?`,
    });
  }
  if (hasDiagnosis) {
    actions.push({
      id: "act-diag",
      kind: "diagnosis",
      label: "🎯 שאלות אבחון ללקוח",
      query: `אילו שאלות אבחון חשוב לשאול את הלקוח בנושא: ${query.slice(0, 60)}`,
    });
  }
  actions.push({
    id: "act-sim",
    kind: "simulation",
    label: "🗣️ סימולציית שיחת מכירה",
    payload: "open_simulation",
  });
  actions.push({
    id: "act-copy",
    kind: "copy",
    label: "📋 העתק תשובה",
    payload: "copy_card",
  });
  if (docs.length > 0) {
    actions.push({
      id: "act-search",
      kind: "search",
      label: "🔎 חיפוש במאגר",
      href: `/logistics-dict?q=${encodeURIComponent(docs[0]?.skus[0] || docs[0]?.product || query.slice(0, 30))}`,
    });
  }

  return actions;
}

export async function generateCounterAnswerCard(
  input: GenerateCounterCardInput,
): Promise<{
  card: InteractiveAnswerCard;
  nextDiagnosisState: DiagnosisState;
  plainSummaryText: string;
}> {
  const query = input.query.trim();
  const intent = await classifyIntentHybrid(query, input.modelClassifier);
  const nextDiagnosisState = applyDiagnosisAnswer(input.diagnosisState, query, intent);

  const searchRes = await searchKnowledgeIndex(query, {
    limit: 4,
    includeLiveTechUrl: true,
    deps: input.knowledgeDeps,
  });

  const isSourceAuditQuery =
    docsQueryIsSourceInspection(query) &&
    searchRes.documents.length === 0;

  let docs = searchRes.documents;
  let citedSources: CitedSource[];

  if (isSourceAuditQuery && input.previousSources && input.previousSources.length > 0) {
    citedSources = input.previousSources;
  } else if (isSourceAuditQuery) {
    docs = VERIFIED_KNOWLEDGE_DOCUMENTS.slice(0, 4);
    citedSources = toCitedSources(docs);
  } else {
    citedSources = toCitedSources(docs);
  }

  // מדיניות אמינות מחמירה: אם לא נמצא אף מקור במאגר -> הודעת Fallback מפורשת וללא עובדות מומצאות
  const hasVerifiedSource = docs.length > 0 || citedSources.length > 0;

  // איסוף עובדות טכניות מאומתות בלבד מתוך המסמכים שאוחזרו
  const technicalFacts: TechnicalFactItem[] = [];
  if (hasVerifiedSource) {
    for (const doc of docs) {
      for (const td of doc.technicalData) {
        if (technicalFacts.length >= 6) break;
        technicalFacts.push({
          label: td.label,
          value: td.value,
          sourceTitle: doc.title,
          isVerifiedFact: true,
        });
      }
    }
  }

  // איסוף שלבי ביצוע מהמקור המרכזי
  const executionSteps = hasVerifiedSource ? docs.flatMap((d) => d.steps).slice(0, 6) : [];
  const missingSourceNotice = !hasVerifiedSource ? MISSING_SOURCE_FALLBACK_MESSAGE : undefined;

  let shortAnswer = "";
  if (hasVerifiedSource) {
    if (isSourceAuditQuery && input.previousSources && input.previousSources.length > 0) {
      shortAnswer = `התשובה הטכנית הקודמת מבוססת על ${citedSources.length} מקורות מאומתים: ${citedSources.map((s) => `${s.title} (${s.manufacturer}, ${s.pageOrSection})`).join(" | ")}.`;
    } else if (isSourceAuditQuery) {
      shortAnswer = `להלן המקורות המאומתים באינדקס הידע הטכני שעליהם מבוססות תשובות הדלפק (יצרן, כותרת מסמך, עמוד/סעיף ותאריך אימות).`;
    } else {
      const leadDoc = docs[0]!;
      shortAnswer = leadDoc.factSummary;
      if (searchRes.liveUrlSnippet) {
        shortAnswer += ` (אומת גם מול דף המקור החי).`;
      }
    }
  } else {
    shortAnswer = MISSING_SOURCE_FALLBACK_MESSAGE;
  }

  // המלצת מודל מופרדת בבירור מעובדות המפרט (רק כשיש מקור מאומת)
  let modelRecommendation: string | undefined;
  if (hasVerifiedSource && input.modelEnhancer) {
    try {
      const groundingText = docs
        .map(
          (d) =>
            `[מקור: ${d.title} | יצרן: ${d.manufacturer} | קטע: ${d.pageNumber || d.sourceDate}]\nתקציר: ${d.factSummary}\nנתונים: ${d.technicalData.map((x) => `${x.label}: ${x.value}`).join("; ")}`,
        )
        .join("\n\n");
      const enhanced = await input.modelEnhancer(
        `שאלת הנציג: ${query}\nהקשר מאובחן: ${JSON.stringify(nextDiagnosisState)}\n\nמקורות מאומתים:\n${groundingText}`,
      );
      if (enhanced && enhanced.trim()) {
        modelRecommendation = enhanced.trim();
      }
    } catch {
      modelRecommendation = undefined;
    }
  }

  const nextQuestion = getNextSingleDiagnosisQuestion(nextDiagnosisState, intent);
  const salesAdvice = buildSalesFrameworkAdvice(query, intent, nextDiagnosisState);
  const crossSelling = getCrossSellingRecommendations({
    query,
    intent,
    diagnosis: nextDiagnosisState,
    dictItems: searchRes.dictItems,
  });

  const fitNotes = buildDiagnosisSummaryBadges(nextDiagnosisState).map(
    (b) => `${b.label}: ${b.value}`,
  );

  const actions = buildDynamicActions(docs, query, Boolean(nextQuestion));

  const card: InteractiveAnswerCard = {
    questionTitle: query,
    intent,
    shortAnswer,
    executionSteps,
    technicalFacts,
    modelRecommendation,
    missingSourceNotice,
    customerFit: {
      nextQuestion,
      collectedContext: nextDiagnosisState,
      fitNotes,
      salesAdvice,
    },
    crossSelling,
    sources: citedSources,
    actions,
  };

  const lines: string[] = [
    query,
    "",
    `תשובה קצרה: ${shortAnswer}`,
  ];
  if (executionSteps.length) {
    lines.push("", "שלבי ביצוע:", ...executionSteps.map((s, i) => `${i + 1}. ${s}`));
  }
  if (technicalFacts.length) {
    lines.push("", "נתונים טכניים מאומתים:", ...technicalFacts.map((f) => `• ${f.label}: ${f.value}`));
  }
  if (citedSources.length) {
    lines.push("", "מקורות מידע:", ...citedSources.map((s) => `• ${s.title} (${s.manufacturer}) — ${s.url}`));
  }

  return {
    card,
    nextDiagnosisState,
    plainSummaryText: lines.join("\n"),
  };
}
