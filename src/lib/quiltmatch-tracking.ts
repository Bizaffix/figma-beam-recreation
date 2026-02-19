/**
 * QuiltMatch Session Tracking & Persistence
 * Handles cookies, localStorage, anonymous session IDs,
 * UTM capture, progress auto-save/restore, and return visitor detection.
 */

// ---- Cookie Helpers ----

function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

// ---- UUID Generator ----

function generateUUID(): string {
  if (crypto?.randomUUID) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

// ---- Keys ----

const KEYS = {
  SESSION: "bmqr_session",
  FIRST_VISIT: "bmqr_first_visit",
  JOURNEY_START: "bmqr_journey_start",
  SOURCE: "bmqr_source",
  PROGRESS: "bmqr_progress",
  DREAM: "bmqr_dream_sentence",
  ENERGY: "bmqr_energy",
  ROOMING: "bmqr_rooming",
  PRIORITIES: "bmqr_priorities",
  BUDGET: "bmqr_budget",
  PERSONALITY: "bmqr_personality",
  MATCHES: "bmqr_matches",
  SAVED_RETREATS: "bmqr_saved_retreats",
  COOKIE_CONSENT: "bmqr_cookie_consent",
  LOCATION: "bmqr_location",
  STUDENT_NAME: "bmqr_student_name",
  STUDENT_EMAIL: "bmqr_student_email",
} as const;

export type ProgressStage =
  | "not_started"
  | "screen_1_complete"
  | "screen_2_complete"
  | "screen_3_complete"
  | "screen_4_complete";

// ---- Session Initialization ----

export function initSession() {
  // Session ID
  if (!getCookie(KEYS.SESSION)) {
    setCookie(KEYS.SESSION, generateUUID(), 30);
  }

  // First visit timestamp
  if (!getCookie(KEYS.FIRST_VISIT)) {
    const now = new Date().toISOString();
    setCookie(KEYS.FIRST_VISIT, now, 365);
    localStorage.setItem(KEYS.JOURNEY_START, now);
  }

  // Capture referral source (UTM params)
  captureReferralSource();
}

export function getSessionId(): string {
  return getCookie(KEYS.SESSION) || "";
}

// ---- Referral / UTM Capture ----

function captureReferralSource() {
  if (localStorage.getItem(KEYS.SOURCE)) return;

  const params = new URLSearchParams(window.location.search);
  const source = {
    utm_source: params.get("utm_source") || "",
    utm_medium: params.get("utm_medium") || "",
    utm_campaign: params.get("utm_campaign") || "",
    referrer: document.referrer || "",
    landing_page: window.location.pathname,
    timestamp: new Date().toISOString(),
  };

  if (source.utm_source || source.referrer) {
    localStorage.setItem(KEYS.SOURCE, JSON.stringify(source));
  }
}

export function getReferralSource(): Record<string, string> | null {
  try {
    const raw = localStorage.getItem(KEYS.SOURCE);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// ---- Progress Tracking ----

export function getProgress(): ProgressStage {
  return (localStorage.getItem(KEYS.PROGRESS) as ProgressStage) || "not_started";
}

export function setProgress(stage: ProgressStage) {
  localStorage.setItem(KEYS.PROGRESS, stage);
}

export function hasExistingProgress(): boolean {
  const progress = getProgress();
  return progress !== "not_started";
}

// ---- Dream Sentence ----

export function saveDreamSentence(sentence: string) {
  localStorage.setItem(KEYS.DREAM, sentence);
  setProgress("screen_1_complete");
}

export function getDreamSentence(): string {
  return localStorage.getItem(KEYS.DREAM) || "";
}

// ---- Quiz Answers ----

export function saveQuizAnswers(answers: {
  energy?: string;
  rooming?: string;
  priorities?: string[];
  budget?: string;
}) {
  if (answers.energy) localStorage.setItem(KEYS.ENERGY, answers.energy);
  if (answers.rooming) localStorage.setItem(KEYS.ROOMING, answers.rooming);
  if (answers.priorities) localStorage.setItem(KEYS.PRIORITIES, JSON.stringify(answers.priorities));
  if (answers.budget) localStorage.setItem(KEYS.BUDGET, answers.budget);
  setProgress("screen_2_complete");
}

export function getQuizAnswers(): {
  energy: string;
  rooming: string;
  priorities: string[];
  budget: string;
} {
  let priorities: string[] = [];
  try {
    priorities = JSON.parse(localStorage.getItem(KEYS.PRIORITIES) || "[]");
  } catch { /* empty */ }

  return {
    energy: localStorage.getItem(KEYS.ENERGY) || "",
    rooming: localStorage.getItem(KEYS.ROOMING) || "",
    priorities,
    budget: localStorage.getItem(KEYS.BUDGET) || "",
  };
}

// ---- Personality ----

export function savePersonality(personalityId: string) {
  localStorage.setItem(KEYS.PERSONALITY, personalityId);
  setCookie(KEYS.PERSONALITY, personalityId, 90);
  setProgress("screen_3_complete");
}

export function getPersonalityId(): string {
  return localStorage.getItem(KEYS.PERSONALITY) || getCookie(KEYS.PERSONALITY) || "";
}

// ---- Matches & Saved ----

export function saveMatches(matchIds: string[]) {
  localStorage.setItem(KEYS.MATCHES, JSON.stringify(matchIds));
  setProgress("screen_4_complete");
}

export function getMatches(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEYS.MATCHES) || "[]");
  } catch {
    return [];
  }
}

export function saveSavedRetreats(ids: string[]) {
  localStorage.setItem(KEYS.SAVED_RETREATS, JSON.stringify(ids));
}

export function getSavedRetreats(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEYS.SAVED_RETREATS) || "[]");
  } catch {
    return [];
  }
}

// ---- Student Context ----

export function saveStudentContext(ctx: { name?: string; email?: string; location?: string }) {
  if (ctx.name) localStorage.setItem(KEYS.STUDENT_NAME, ctx.name);
  if (ctx.email) localStorage.setItem(KEYS.STUDENT_EMAIL, ctx.email);
  if (ctx.location) localStorage.setItem(KEYS.LOCATION, ctx.location);
}

export function getStudentContext(): { name: string; email: string; location: string } {
  return {
    name: localStorage.getItem(KEYS.STUDENT_NAME) || "",
    email: localStorage.getItem(KEYS.STUDENT_EMAIL) || "",
    location: localStorage.getItem(KEYS.LOCATION) || "",
  };
}

// ---- Cookie Consent ----

export function hasCookieConsent(): boolean {
  return getCookie(KEYS.COOKIE_CONSENT) === "accepted";
}

export function acceptCookies() {
  setCookie(KEYS.COOKIE_CONSENT, "accepted", 365);
}

export function declineCookies() {
  setCookie(KEYS.COOKIE_CONSENT, "declined", 365);
}

// ---- Clear / Reset ----

export function clearQuiltMatchData() {
  const keysToPreserve = [KEYS.FIRST_VISIT, KEYS.SOURCE, KEYS.COOKIE_CONSENT];
  const preservedValues: Record<string, string> = {};

  for (const key of keysToPreserve) {
    const val = localStorage.getItem(key);
    if (val) preservedValues[key] = val;
  }

  // Clear all bmqr_ keys from localStorage
  const allKeys = Object.values(KEYS);
  for (const key of allKeys) {
    localStorage.removeItem(key);
  }

  // Restore preserved analytics keys
  for (const [key, val] of Object.entries(preservedValues)) {
    localStorage.setItem(key, val);
  }
}

// ---- Full State Snapshot (for restore) ----

export interface QuiltMatchState {
  progress: ProgressStage;
  dreamSentence: string;
  quizAnswers: ReturnType<typeof getQuizAnswers>;
  personalityId: string;
  studentContext: ReturnType<typeof getStudentContext>;
}

export function getFullState(): QuiltMatchState {
  return {
    progress: getProgress(),
    dreamSentence: getDreamSentence(),
    quizAnswers: getQuizAnswers(),
    personalityId: getPersonalityId(),
    studentContext: getStudentContext(),
  };
}
