import { cn } from "@/lib/utils";
import { Sparkles, AlertCircle, CheckCircle2, TrendingUp } from "lucide-react";

interface QualityScoreBarProps {
  score: number;
  notes: string[];
}

function getScoreConfig(score: number) {
  if (score >= 90) {
    return {
      label: "Excellent Match",
      color: "bg-emerald-500",
      bgColor: "bg-emerald-50",
      textColor: "text-emerald-700",
      icon: CheckCircle2,
    };
  }
  if (score >= 70) {
    return {
      label: "Strong Matches",
      color: "bg-teal-500",
      bgColor: "bg-teal-50",
      textColor: "text-teal-700",
      icon: TrendingUp,
    };
  }
  if (score >= 40) {
    return {
      label: "Partial Matches",
      color: "bg-amber-500",
      bgColor: "bg-amber-50",
      textColor: "text-amber-700",
      icon: Sparkles,
    };
  }
  return {
    label: "Limited Results",
    color: "bg-red-400",
    bgColor: "bg-red-50",
    textColor: "text-red-700",
    icon: AlertCircle,
  };
}

export function QualityScoreBar({ score, notes }: QualityScoreBarProps) {
  const config = getScoreConfig(score);
  const Icon = config.icon;

  return (
    <div className={cn("rounded-xl p-4", config.bgColor)}>
      <div className="flex items-center gap-3 mb-3">
        <Icon className={cn("w-5 h-5", config.textColor)} />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className={cn("text-sm font-semibold", config.textColor)}>
              {config.label}
            </span>
            <span className={cn("text-sm font-mono", config.textColor)}>
              {score}/100
            </span>
          </div>
          <div className="w-full bg-white/60 rounded-full h-2">
            <div
              className={cn("h-2 rounded-full transition-all duration-700", config.color)}
              style={{ width: `${Math.min(score, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {notes.length > 0 && (
        <div className="space-y-1">
          {notes.map((note, i) => (
            <p key={i} className="text-xs text-muted-foreground pl-8">
              {note}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
