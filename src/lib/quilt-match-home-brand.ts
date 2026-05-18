export const QM_TEAL = "#3A6B6E";
export const QM_RUST = "#B85C38";
export const QM_RUST_LIGHT = "#F2E4DC";
export const QM_TEAL_LIGHT = "#DCF0EF";
export const QM_AMBER = "#D4A017";
export const QM_AMBER_LIGHT = "#FDF6E3";
export const QM_CHARCOAL = "#2C2A27";

export const LEVEL_BADGE: Record<string, { bg: string; text: string }> = {
  Beginner: { bg: QM_TEAL_LIGHT, text: QM_TEAL },
  "All Levels": { bg: "#E8F4F0", text: "#2A6060" },
  Intermediate: { bg: "#FEF3E2", text: "#92610A" },
  Advanced: { bg: QM_RUST_LIGHT, text: QM_RUST },
};

export function skillLevelLabel(skill: string): string {
  const s = skill.toLowerCase();
  if (s.includes("begin")) return "Beginner";
  if (s.includes("adv")) return "Advanced";
  if (s.includes("inter")) return "Intermediate";
  return "All Levels";
}
