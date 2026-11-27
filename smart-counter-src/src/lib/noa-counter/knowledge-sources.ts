/**
 * knowledge-sources.ts — שכבת ולידציה ואימות מקורות מידע
 * מבטיחה שאין קישורים מומצאים, חוסמת SSRF/סכמות מסוכנות ואוכפת אמינות מקורות.
 */
import type {
  CitedSource,
  InteractiveActionButton,
  InteractiveAnswerCard,
} from "./types";

const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions/gi,
  /system\s*prompt/gi,
  /you\s+are\s+now/gi,
  /התעלם\s+מהוראות/gi,
  /הנחיות\s+מערכת/gi,
  /jailbreak/gi,
];

const APPROVED_INTERNAL_PATHS = [
  "/technical-advisor",
  "/presentations",
  "/logistics-dict",
  "/chat",
  "/train",
];

/** מנטרל תגיות HTML וניסיונות prompt injection ממסמכים חיצוניים */
export function sanitizeUntrustedDocumentText(raw: string, maxLen = 2400): string {
  let clean = String(raw || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  for (const re of PROMPT_INJECTION_PATTERNS) {
    clean = clean.replace(re, "[תוכן חיצוני מסונן]");
  }
  return clean.slice(0, maxLen);
}

/** מניעת SSRF בעת שליפת כתובות חיצוניות או רינדור קישור חיצוני */
export function isSafePublicUrl(rawUrl: string): boolean {
  try {
    const trimmed = String(rawUrl || "").trim();
    if (!trimmed) return false;
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;
    if (parsed.username || parsed.password) return false;
    const host = parsed.hostname.toLowerCase();
    if (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "0.0.0.0" ||
      host === "::1" ||
      host === "[::1]" ||
      host.startsWith("169.254.") ||
      host.startsWith("10.") ||
      host.startsWith("192.168.") ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(host) ||
      host.startsWith("fc") ||
      host.startsWith("fd") ||
      host.startsWith("fe80:") ||
      host.endsWith(".local") ||
      host.endsWith(".internal")
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/** אימות כתובת פנימית מאושרת באפליקציה או כתובת חיצונית תקינה */
export function isSafeInternalOrPublicHref(rawUrl?: string): boolean {
  if (!rawUrl) return false;
  const trimmed = rawUrl.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("/")) {
    const basePath = trimmed.split("?")[0]!.split("#")[0]!;
    return APPROVED_INTERNAL_PATHS.includes(basePath);
  }
  return isSafePublicUrl(trimmed);
}

/** עיצוב תווית מקור קריאה לנציג הדלפק */
export function formatSourceCitation(src: CitedSource): string {
  const parts = [src.title, src.manufacturer, src.pageOrSection].filter(Boolean);
  return parts.join(" · ");
}

/** בדיקה שכל הקישורים בכרטיס אמיתיים ומאומתים מול המקורות או הנתיבים הפנימיים */
export function validateSourcesHaveNoInventedLinks(
  sources: CitedSource[],
  actions: InteractiveActionButton[],
): { valid: boolean; invalidLinks: string[] } {
  const invalidLinks: string[] = [];
  const sourceUrls = new Set<string>();

  for (const s of sources) {
    for (const candidate of [s.url, s.fileUrl, s.videoUrl, s.presentationUrl]) {
      if (candidate) {
        if (!isSafeInternalOrPublicHref(candidate)) {
          invalidLinks.push(candidate);
        } else {
          sourceUrls.add(candidate);
        }
      }
    }
  }

  for (const act of actions) {
    if (!act.href) continue;
    if (!isSafeInternalOrPublicHref(act.href)) {
      invalidLinks.push(act.href);
      continue;
    }
    if (!act.href.startsWith("/") && !sourceUrls.has(act.href)) {
      invalidLinks.push(act.href);
    }
  }

  return { valid: invalidLinks.length === 0, invalidLinks };
}

/** אכיפת כלל האמינות: ללא מקורות מאומתים אין עובדות או שלבי יישום טכניים */
export function isReliableTechnicalCard(card: InteractiveAnswerCard): boolean {
  if (card.sources.length === 0) {
    return (
      Boolean(card.missingSourceNotice) &&
      card.technicalFacts.length === 0 &&
      card.executionSteps.length === 0 &&
      !card.modelRecommendation
    );
  }
  return validateSourcesHaveNoInventedLinks(card.sources, card.actions).valid;
}
