type AvatarTone = "rust" | "match-indigo" | "sage" | "gold";

const toneClasses: Record<AvatarTone, string> = {
  rust: "bg-rust/15 text-rust",
  "match-indigo": "bg-match-indigo/15 text-match-indigo",
  sage: "bg-sage/15 text-sage",
  gold: "bg-gold/20 text-gold",
};

export function Avatar({
  initials,
  tone = "rust",
  size = "md",
  onClick,
  ariaLabel,
}: {
  initials: string;
  tone?: AvatarTone;
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  ariaLabel?: string;
}) {
  const sizeClass =
    size === "lg" ? "h-16 w-16 text-base" : size === "sm" ? "h-7 w-7 text-[10px]" : "h-9 w-9 text-xs";
  const base = `rounded-full flex items-center justify-center font-mono font-semibold ring-2 ring-background ${toneClasses[tone]} ${sizeClass}`;
  if (onClick) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onClick();
        }}
        aria-label={ariaLabel}
        className={`${base} hover:ring-rust/30 transition-all cursor-pointer`}
      >
        {initials}
      </button>
    );
  }
  return <div className={base} aria-hidden>{initials}</div>;
}
