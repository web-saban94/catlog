/**
 * diagnosis.ts — מודול אבחון לקוח מדורג ומתמשך בדלפק
 * אוכף שאלה אחת בכל פעם, שומר הקשר בין תורות ומפיק תגיות מצב ברורות.
 */
export {
  detectDiagnosisDomain,
  selectNextDiagnosisQuestion,
  updateDiagnosisContext,
} from "./diagnosis-engine";
import {
  selectNextDiagnosisQuestion,
  updateDiagnosisContext,
} from "./diagnosis-engine";
import type {
  DiagnosisFieldKey,
  DiagnosisQuestionCard,
  DiagnosisState,
  IntentClassification,
} from "./types";

const DIAGNOSIS_FIELD_LABELS_HE: Record<DiagnosisFieldKey, string> = {
  workType: "סוג עבודה",
  exposure: "חשיפה",
  substrateType: "תשתית",
  substrateCondition: "מצב תשתית",
  dimensions: "מידות / שטח",
  requestedProduct: "מוצר מבוקש",
  problemToSolve: "בעיה לפתרון",
  constraints: "אילוצי ביצוע",
};

const CORE_FIELDS_FOR_READY: DiagnosisFieldKey[] = [
  "exposure",
  "substrateType",
  "substrateCondition",
];

export function createInitialDiagnosisState(domain?: string): DiagnosisState {
  return {
    ...(domain ? { domain } : {}),
    updatedAt: new Date().toISOString(),
  };
}

export function applyDiagnosisAnswer(
  prevState: DiagnosisState | undefined,
  answerText: string,
  intent: IntentClassification,
): DiagnosisState {
  return updateDiagnosisContext(prevState, answerText, intent);
}

export function getNextSingleDiagnosisQuestion(
  state: DiagnosisState,
  intent: IntentClassification,
): DiagnosisQuestionCard | undefined {
  return selectNextDiagnosisQuestion(state, intent);
}

export function getPendingDiagnosisFields(state: DiagnosisState): DiagnosisFieldKey[] {
  return CORE_FIELDS_FOR_READY.filter((field) => !state[field]);
}

export function isDiagnosisReadyForRecommendation(state: DiagnosisState): boolean {
  return getPendingDiagnosisFields(state).length <= 1;
}

export function buildDiagnosisSummaryBadges(
  state: DiagnosisState,
): { key: DiagnosisFieldKey; label: string; value: string }[] {
  const badges: { key: DiagnosisFieldKey; label: string; value: string }[] = [];
  const keys: DiagnosisFieldKey[] = [
    "workType",
    "exposure",
    "substrateType",
    "substrateCondition",
    "dimensions",
    "requestedProduct",
    "problemToSolve",
    "constraints",
  ];
  for (const key of keys) {
    const val = state[key];
    if (val) {
      badges.push({
        key,
        label: DIAGNOSIS_FIELD_LABELS_HE[key],
        value: val,
      });
    }
  }
  return badges;
}
