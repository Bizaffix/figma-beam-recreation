import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  Palette,
  Sparkles,
  Target,
} from "lucide-react";
import type { ParsedFilters } from "@/types/quiltmatch";

interface ParsedFiltersDisplayProps {
  filters: ParsedFilters;
}

export function ParsedFiltersDisplay({ filters }: ParsedFiltersDisplayProps) {
  const chips: { icon: React.ElementType; label: string; color: string }[] = [];

  if (filters.skill_level) {
    chips.push({
      icon: Target,
      label: filters.skill_level.charAt(0).toUpperCase() + filters.skill_level.slice(1),
      color: "bg-teal-50 text-teal-700 border-teal-200",
    });
  }

  if (filters.location?.city || filters.location?.state) {
    const loc = [filters.location.city, filters.location.state].filter(Boolean).join(", ");
    chips.push({
      icon: MapPin,
      label: loc,
      color: "bg-blue-50 text-blue-700 border-blue-200",
    });
  }

  if (filters.duration_days) {
    const dur =
      filters.duration_days.min === filters.duration_days.max
        ? `${filters.duration_days.min} days`
        : `${filters.duration_days.min}–${filters.duration_days.max} days`;
    chips.push({
      icon: Clock,
      label: dur,
      color: "bg-violet-50 text-violet-700 border-violet-200",
    });
  }

  if (filters.budget_max) {
    chips.push({
      icon: DollarSign,
      label: `Under $${filters.budget_max}`,
      color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    });
  }

  if (filters.dates?.preferred_start) {
    const dateStr = new Date(filters.dates.preferred_start + "T00:00:00").toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
    chips.push({
      icon: Calendar,
      label: dateStr,
      color: "bg-amber-50 text-amber-700 border-amber-200",
    });
  }

  if (filters.themes && filters.themes.length > 0) {
    for (const theme of filters.themes.slice(0, 3)) {
      chips.push({
        icon: Palette,
        label: theme.replace(/_/g, " "),
        color: "bg-pink-50 text-pink-700 border-pink-200",
      });
    }
  }

  if (filters.vibe) {
    chips.push({
      icon: Sparkles,
      label: filters.vibe.replace(/_/g, " "),
      color: "bg-purple-50 text-purple-700 border-purple-200",
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-muted-foreground">
        We understood your search as:
      </p>
      <div className="flex flex-wrap gap-2">
        {chips.map((chip, i) => {
          const Icon = chip.icon;
          return (
            <Badge
              key={i}
              variant="outline"
              className={`${chip.color} border text-xs font-medium py-1 px-2.5`}
            >
              <Icon className="w-3 h-3 mr-1" />
              {chip.label}
            </Badge>
          );
        })}
      </div>
    </div>
  );
}
