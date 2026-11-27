import {Product} from '../../types/product';
import {buildSalesFrameworkAdvice} from './consultativeSales';
import {getCrossSellingRecommendations} from './crossSelling';
import {
  applyDiagnosisAnswer,
  buildDiagnosisSummaryBadges,
  getNextSingleDiagnosisQuestion,
} from './diagnosis';
import {classifyIntentDeterministic} from './intentClassifier';
import {
  VERIFIED_KNOWLEDGE_DOCUMENTS,
  isSafeInternalOrPublicHref,
  searchKnowledgeWithCatalog,
  toCitedSources,
} from './knowledgeSources';
import {
  CitedSource,
  DiagnosisState,
  InteractiveActionButton,
  InteractiveAnswerCard,
  KnowledgeDocument,
  TechnicalFactItem,
} from './types';

export const MISSING_SOURCE_FALLBACK_MESSAGE =
  'המידע אינו מופיע במקורות המאושרים במאגר. יש לפנות ליועץ הטכני.';

export interface GenerateCounterCardInput {
  query: string;
  diagnosisState?: DiagnosisState;
  previousSources?: CitedSource[];
  catalogProducts?: Product[];
  modelRecommendation?: string | null;
}

function docsQueryIsSourceInspection(query: string): boolean {
  return /הצג\s*(?:את\s*)?ה?מקור|על\s*מה\s*מבוססת|מקור\s*(?:שעליו|התשובה)|מקורות\s*המידע/i.test(
    query,
  );
}

function buildDynamicActions(
  docs: KnowledgeDocument[],
  query: string,
  hasDiagnosis: boolean,
): InteractiveActionButton[] {
  const actions: InteractiveActionButton[] = [];
  const primarySpec = docs.find(
    (d) =>
      d.url &&
      (d.documentType === 'spec' ||
        d.documentType === 'application_guide' ||
        d.documentType === 'comparison' ||
        d.documentType === 'product_page'),
  );
  const videoDoc = docs.find((d) => d.videoUrl);
  const presDoc = docs.find((d) => d.presentationUrl || d.documentType === 'presentation');
  const systemDoc = docs.find((d) => d.systemDomain);

  const specHref = primarySpec?.fileUrl || primarySpec?.url;
  if (specHref && isSafeInternalOrPublicHref(specHref)) {
    actions.push({
      id: 'act-spec',
      kind: 'spec',
      label: '📄 מפרט טכני ומקור',
      href: specHref,
    });
  }
  if (videoDoc?.videoUrl && isSafeInternalOrPublicHref(videoDoc.videoUrl)) {
    actions.push({
      id: 'act-video',
      kind: 'video',
      label: '🎬 סרטון יישום',
      href: videoDoc.videoUrl,
    });
  }
  const presHref = presDoc?.presentationUrl || presDoc?.url;
  if (presHref && isSafeInternalOrPublicHref(presHref)) {
    actions.push({
      id: 'act-pres',
      kind: 'presentation',
      label: '📊 מצגת הדרכה',
      href: presHref,
    });
  }
  if (systemDoc?.systemDomain) {
    actions.push({
      id: 'act-sys',
      kind: 'system',
      label: '🧩 מערכת מוצרים',
      query: `אילו מוצרים משלימים נדרשים במערכת ${systemDoc.systemDomain}?`,
    });
  }
  if (hasDiagnosis) {
    actions.push({
      id: 'act-diag',
      kind: 'diagnosis',
      label: '🎯 שאלות אבחון ללקוח',
      query: `אילו שאלות אבחון חשוב לשאול את הלקוח בנושא: ${query.slice(0, 60)}`,
    });
  }

  actions.push({
    id: 'act-sim',
    kind: 'simulation',
    label: '🗣️ סימולציית שיחת מכירה',
    payload: 'open_simulation',
  });
  actions.push({
    id: 'act-copy',
    kind: 'copy',
    label: '📋 העתק תשובה',
    payload: 'copy_card',
  });

  if (docs.length > 0 && docs[0]?.skus[0]) {
    actions.push({
      id: 'act-search',
      kind: 'search',
      label: '🏷️ כרטיס מוצר במחסן',
      href: `/product/${encodeURIComponent(docs[0].skus[0])}`,
    });
  }

  return actions;
}

export function generateCounterAnswerCard(input: GenerateCounterCardInput): {
  card: InteractiveAnswerCard;
  nextDiagnosisState: DiagnosisState;
  plainSummaryText: string;
} {
  const query = input.query.trim();
  const intent = classifyIntentDeterministic(query);
  const nextDiagnosisState = applyDiagnosisAnswer(input.diagnosisState, query, intent);

  const searchRes = searchKnowledgeWithCatalog(query, input.catalogProducts ?? [], {
    limit: 4,
  });

  const isSourceAuditQuery =
    docsQueryIsSourceInspection(query) && searchRes.documents.length === 0;

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

  const hasVerifiedSource = docs.length > 0 || citedSources.length > 0;
  const missingSourceNotice = !hasVerifiedSource ? MISSING_SOURCE_FALLBACK_MESSAGE : undefined;

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

  const executionSteps = hasVerifiedSource ? docs.flatMap((d) => d.steps).slice(0, 6) : [];

  let shortAnswer = '';
  if (hasVerifiedSource) {
    if (isSourceAuditQuery && input.previousSources && input.previousSources.length > 0) {
      shortAnswer = `התשובה הטכנית הקודמת מבוססת על ${citedSources.length} מקורות מאומתים: ${citedSources
        .map((s) => `${s.title} (${s.manufacturer}, ${s.pageOrSection})`)
        .join(' | ')}.`;
    } else if (isSourceAuditQuery) {
      shortAnswer =
        'להלן המקורות המאומתים באינדקס הידע הטכני שעליהם מבוססות תשובות הדלפק (יצרן, כותרת מסמך, עמוד/סעיף ותאריך אימות).';
    } else {
      shortAnswer = docs[0]!.factSummary;
    }
  } else {
    shortAnswer = MISSING_SOURCE_FALLBACK_MESSAGE;
  }

  const nextQuestion = getNextSingleDiagnosisQuestion(nextDiagnosisState, intent);
  const salesAdvice = buildSalesFrameworkAdvice(query, intent, nextDiagnosisState);
  const crossSelling = getCrossSellingRecommendations({
    query,
    intent,
    diagnosis: nextDiagnosisState,
    catalogProducts: searchRes.matchedProducts.length
      ? searchRes.matchedProducts
      : (input.catalogProducts ?? []),
  });

  const fitNotes = buildDiagnosisSummaryBadges(nextDiagnosisState).map(
    (b) => `${b.label}: ${b.value}`,
  );
  const actions = buildDynamicActions(docs, query, Boolean(nextQuestion));

  const modelRecommendation =
    hasVerifiedSource && input.modelRecommendation?.trim()
      ? input.modelRecommendation.trim()
      : undefined;

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

  const lines: string[] = [query, '', `תשובה קצרה: ${shortAnswer}`];
  if (executionSteps.length) {
    lines.push('', 'שלבי ביצוע:', ...executionSteps.map((s, i) => `${i + 1}. ${s}`));
  }
  if (technicalFacts.length) {
    lines.push('', 'נתונים טכניים מאומתים:', ...technicalFacts.map((f) => `• ${f.label}: ${f.value}`));
  }
  if (citedSources.length) {
    lines.push('', 'מקורות מידע:', ...citedSources.map((s) => `• ${s.title} (${s.manufacturer}) — ${s.url}`));
  }

  return {
    card,
    nextDiagnosisState,
    plainSummaryText: lines.join('\n'),
  };
}
