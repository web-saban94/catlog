/**
 * Noa AI Smart Counter & Knowledge Engine — טיפוסים מרכזיים
 * ח. סבן חומרי בניין (1994) בע"מ
 */

export type CounterIntent =
  | "TECHNICAL_GUIDANCE"
  | "PRODUCT_COMPARISON"
  | "CUSTOMER_DIAGNOSIS"
  | "CROSS_SELLING"
  | "SALES_TRAINING"
  | "TRAINING_MEDIA"
  | "KNOWLEDGE_SEARCH"
  | "OPERATIONS_LOGISTICS";

export type IntentEntities = {
  products: string[];
  skus: string[];
  substrates: string[];
  categories: string[];
  objectionType?: string;
};

export type IntentClassification = {
  primaryIntent: CounterIntent;
  secondaryIntents: CounterIntent[];
  confidence: number; // 0..1
  entities: IntentEntities;
  requiredContext: DiagnosisFieldKey[];
  suggestedActions: ActionButtonKind[];
  classificationMethod: "model+rules" | "deterministic_rules";
  rationale: string;
};

export type KnowledgeDocumentType =
  | "spec"
  | "product_page"
  | "catalog"
  | "application_guide"
  | "presentation"
  | "video"
  | "research"
  | "qa"
  | "comparison";

export type VerificationStatus = "verified" | "sheet_live" | "pending";

export type KnowledgeDocument = {
  id: string;
  title: string;
  category: string;
  manufacturer: string;
  product: string;
  documentType: KnowledgeDocumentType;
  language: "he" | "en" | "he/en";
  url: string;
  fileUrl?: string;
  videoUrl?: string;
  presentationUrl?: string;
  pageNumber?: string;
  sourceDate: string;
  verifiedAt: string;
  verificationStatus: VerificationStatus;
  approvedBy: string;
  keywords: string[];
  skus: string[];
  factSummary: string;
  steps: string[];
  technicalData: { label: string; value: string }[];
  caveats?: string[];
  systemDomain?: CrossSellDomain;
};

export type CitedSource = {
  id: string;
  title: string;
  manufacturer: string;
  documentType: KnowledgeDocumentType;
  pageOrSection: string;
  url: string;
  fileUrl?: string;
  videoUrl?: string;
  presentationUrl?: string;
  verificationStatus: VerificationStatus;
};

export type DiagnosisFieldKey =
  | "workType"
  | "substrateType"
  | "substrateCondition"
  | "exposure"
  | "dimensions"
  | "requestedProduct"
  | "problemToSolve"
  | "constraints";

export type DiagnosisState = Partial<Record<DiagnosisFieldKey, string>> & {
  domain?: string;
  updatedAt?: string;
};

export type DiagnosisQuestionCard = {
  field: DiagnosisFieldKey;
  question: string;
  whyAsk: string;
  options: string[];
  allowFreeText: boolean;
};

export type SalesFrameworkAdvice = {
  frameworkName: "Consultative Selling" | "SPIN Selling" | "Challenger Sale" | "System Selling";
  focusLabel: string;
  questionsToAsk: string[];
  teachPoint: string;
  nextStepCue: string;
};

export type CrossSellDomain =
  | "הדבקת אריחים"
  | "איטום חדרים רטובים"
  | "איטום גגות"
  | "צביעה וגמר"
  | "גבס"
  | "טיח"
  | "שיקום בטון"
  | "צנרת ואביזרים";

export type CrossSellPriority = "חובה" | "מומלץ" | "אופציונלי";

export type CrossSellRecommendation = {
  productName: string;
  sku?: string;
  category: CrossSellDomain;
  relevance: string;
  conditions: string;
  priority: CrossSellPriority;
  sourceTitle: string;
  sourceUrl: string;
  clientExplanation: string;
};

export type ActionButtonKind =
  | "spec"
  | "video"
  | "presentation"
  | "system"
  | "diagnosis"
  | "simulation"
  | "copy"
  | "search";

export type InteractiveActionButton = {
  id: string;
  kind: ActionButtonKind;
  label: string;
  href?: string;
  query?: string;
  payload?: string;
};

export type TechnicalFactItem = {
  label: string;
  value: string;
  sourceTitle: string;
  isVerifiedFact: true;
};

export type InteractiveAnswerCard = {
  questionTitle: string;
  intent: IntentClassification;
  shortAnswer: string;
  executionSteps: string[];
  technicalFacts: TechnicalFactItem[];
  modelRecommendation?: string;
  missingSourceNotice?: string;
  customerFit: {
    nextQuestion?: DiagnosisQuestionCard;
    collectedContext: DiagnosisState;
    fitNotes: string[];
    salesAdvice?: SalesFrameworkAdvice;
  };
  crossSelling: CrossSellRecommendation[];
  sources: CitedSource[];
  actions: InteractiveActionButton[];
};

export type TrainingCategory =
  | "שיטות מכירה"
  | "SPIN Selling"
  | "אבחון צורכי לקוח"
  | "טיפול בהתנגדויות"
  | "מכירה משלימה"
  | "ידע במוצרי איטום"
  | "דבקים וריצוף"
  | "צבע ושליכט"
  | "גבס וטיח"
  | "שיקום בטון"
  | "שירות לקוחות";

export type TrainingResource = {
  id: string;
  title: string;
  category: TrainingCategory;
  format: "video" | "presentation" | "document" | "practice" | "qa" | "simulation";
  description: string;
  sourceId: string;
  url: string;
  recommendedQuery: string;
};

export type SimulationScenarioId =
  | "cheapest_product"
  | "unsure_contractor"
  | "wrong_substrate"
  | "cross_sell_objection"
  | "competitor_price";

export type SimulationTurn = {
  role: "customer" | "rep";
  text: string;
  time: string;
};

export type SimulationEvaluation = {
  overallScore: number; // coaching metric 0..100
  coachingDisclaimer: string;
  criteria: {
    key:
      | "diagnosticQuestions"
      | "needsUnderstanding"
      | "informationAccuracy"
      | "solutionFit"
      | "crossSellJustification"
      | "communicationQuality";
    label: string;
    score: number; // 1..10
    feedback: string;
  }[];
  strengths: string[];
  improvements: string[];
};

export type CounterAssistantResponse = {
  mode: "counter_knowledge" | "operations_logistics" | "simulation";
  text: string;
  card?: InteractiveAnswerCard;
  diagnosisState?: DiagnosisState;
  simulationReply?: {
    scenarioId: SimulationScenarioId;
    customerMessage: string;
    hintForRep: string;
    turnCount: number;
    evaluation?: SimulationEvaluation;
  };
  sources: string[];
  suggestedQuestions: { id: string; label: string; query: string; icon?: string }[];
  trace: Array<{ tool: string; args: Record<string, unknown>; ms: number }>;
  ungrounded: string[];
};
