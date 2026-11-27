/**
 * Noa AI Smart Counter & Knowledge Engine — Core Contracts
 * ח. סבן חומרי בניין (1994) בע"מ
 */

export type CounterIntent =
  | 'TECHNICAL_GUIDANCE'
  | 'PRODUCT_COMPARISON'
  | 'CUSTOMER_DIAGNOSIS'
  | 'CROSS_SELLING'
  | 'SALES_TRAINING'
  | 'TRAINING_MEDIA'
  | 'KNOWLEDGE_SEARCH';

export interface IntentEntities {
  products: string[];
  skus: string[];
  substrates: string[];
  categories: string[];
  objectionType?: string;
}

export type DiagnosisFieldKey =
  | 'workType'
  | 'exposure'
  | 'substrateType'
  | 'substrateCondition'
  | 'dimensions'
  | 'requestedProduct'
  | 'problemToSolve'
  | 'constraints';

export type ActionButtonKind =
  | 'spec'
  | 'video'
  | 'presentation'
  | 'system'
  | 'diagnosis'
  | 'simulation'
  | 'copy'
  | 'search';

export interface IntentClassification {
  primaryIntent: CounterIntent;
  secondaryIntents: CounterIntent[];
  confidence: number;
  entities: IntentEntities;
  requiredContext: DiagnosisFieldKey[];
  suggestedActions: ActionButtonKind[];
  classificationMethod: 'deterministic_rules' | 'model+rules';
  rationale: string;
}

export type KnowledgeDocumentType =
  | 'spec'
  | 'application_guide'
  | 'comparison'
  | 'qa'
  | 'research'
  | 'video'
  | 'presentation'
  | 'catalog'
  | 'product_page';

export type VerificationStatus = 'verified' | 'sheet_live' | 'pending';

export interface KnowledgeDocument {
  id: string;
  title: string;
  category: string;
  manufacturer: string;
  product: string;
  documentType: KnowledgeDocumentType;
  language: 'he' | 'en';
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
  systemDomain?: CrossSellDomain;
  factSummary: string;
  steps: string[];
  technicalData: {label: string; value: string}[];
}

export interface CitedSource {
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
}

export type DiagnosisState = Partial<Record<DiagnosisFieldKey, string>> & {
  domain?: string;
  updatedAt?: string;
};

export interface DiagnosisQuestionCard {
  field: DiagnosisFieldKey;
  question: string;
  whyAsk: string;
  options: string[];
  allowFreeText: boolean;
}

export interface SalesFrameworkAdvice {
  frameworkName: 'Consultative Selling' | 'SPIN Selling' | 'Challenger Sale' | 'System Selling';
  focusLabel: string;
  questionsToAsk: string[];
  teachPoint: string;
  nextStepCue: string;
}

export type CrossSellDomain =
  | 'הדבקת אריחים'
  | 'איטום חדרים רטובים'
  | 'איטום גגות'
  | 'צביעה וגמר'
  | 'גבס'
  | 'טיח'
  | 'שיקום בטון'
  | 'צנרת ואביזרים';

export type CrossSellPriority = 'חובה' | 'מומלץ' | 'אופציונלי';

export interface CrossSellRecommendation {
  productName: string;
  sku?: string;
  category: CrossSellDomain;
  relevance: string;
  conditions: string;
  priority: CrossSellPriority;
  sourceTitle: string;
  sourceUrl: string;
  clientExplanation: string;
}

export interface InteractiveActionButton {
  id: string;
  kind: ActionButtonKind;
  label: string;
  href?: string;
  query?: string;
  payload?: string;
}

export interface TechnicalFactItem {
  label: string;
  value: string;
  sourceTitle: string;
  isVerifiedFact: true;
}

export interface InteractiveAnswerCard {
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
}

export type TrainingCategory =
  | 'שיטות מכירה'
  | 'SPIN Selling'
  | 'אבחון צורכי לקוח'
  | 'טיפול בהתנגדויות'
  | 'מכירה משלימה'
  | 'ידע במוצרי איטום'
  | 'דבקים וריצוף'
  | 'צבע ושליכט'
  | 'גבס וטיח'
  | 'שיקום בטון'
  | 'שירות לקוחות';

export interface TrainingResource {
  id: string;
  title: string;
  category: TrainingCategory;
  format: 'video' | 'presentation' | 'document' | 'practice' | 'qa' | 'simulation';
  description: string;
  sourceId: string;
  url: string;
  recommendedQuery: string;
}

export type SimulationScenarioId =
  | 'cheapest_product'
  | 'unsure_contractor'
  | 'wrong_substrate'
  | 'cross_sell_objection'
  | 'competitor_price';

export interface SimulationTurn {
  role: 'customer' | 'rep';
  text: string;
  time: string;
}

export interface SimulationEvaluation {
  overallScore: number;
  coachingDisclaimer: string;
  criteria: {
    key:
      | 'diagnosticQuestions'
      | 'needsUnderstanding'
      | 'informationAccuracy'
      | 'solutionFit'
      | 'crossSellJustification'
      | 'communicationQuality';
    label: string;
    score: number;
    feedback: string;
  }[];
  strengths: string[];
  improvements: string[];
}
