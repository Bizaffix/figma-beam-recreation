import { useState } from "react";
import { searchRetreatsWithAIClient } from "@/lib/retreat-ai-search-client";
import type { RetreatFilters } from "@/lib/quilt-match-retreat-filters";

type Props = {
  onApplyFilters: (filters: RetreatFilters, summary: string) => void;
};

const EXAMPLES = [
  "Beginner-friendly open sew weekend in Texas under $700, no shared rooms, near hiking",
  "ADA accessible retreat with a long-arm and catered meals in the fall",
  "5-day skill class in the Mountain region with vegetarian food and my own room",
];

export function RetreatAiSearch({ onApplyFilters }: Props) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [followUp, setFollowUp] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(text: string) {
    if (!text.trim() || loading) return;
    setLoading(true);
    setError(null);
    setFollowUp(null);
    try {
      const res = await searchRetreatsWithAIClient(text.trim());
      if (res.filters) {
        onApplyFilters(res.filters, res.summary);
        setSummary(res.summary);
        setFollowUp(res.followUp);
      } else {
        setError(res.summary);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border border-border bg-card/40 p-6 md:p-8">
      <span className="font-mono text-[10px] uppercase tracking-widest text-rust mb-3 block">
        Concierge search
      </span>
      <h2 className="font-display text-2xl md:text-3xl mb-2">Tell us what you're looking for.</h2>
      <p className="text-sm text-muted-foreground mb-5 max-w-2xl">
        Describe your ideal retreat in plain English — state, budget, length, food, room preferences,
        accessibility — and we'll set the filters for you.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit(query);
        }}
        className="flex flex-col gap-3"
      >
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. A 4-night beginner open sew in the Carolinas under $900 with a private room and gluten-free meals."
          className="w-full min-h-[88px] resize-y border border-border bg-background p-3 text-sm focus:outline-none focus:border-foreground/40"
          disabled={loading}
        />
        <div className="flex flex-wrap items-center gap-2 justify-between">
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => {
                  setQuery(ex);
                  void submit(ex);
                }}
                disabled={loading}
                className="text-[11px] border border-border px-2 py-1 hover:border-foreground/40 text-muted-foreground"
              >
                Try: {ex.slice(0, 42)}…
              </button>
            ))}
          </div>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="btn-primary px-5 py-2 text-sm disabled:opacity-50"
          >
            {loading ? "Thinking…" : "Find my retreat"}
          </button>
        </div>
      </form>

      {summary && !error && (
        <div className="mt-5 border-t border-border pt-4 text-sm">
          <p className="text-foreground">
            <span className="font-mono text-[10px] uppercase tracking-widest text-sage mr-2">
              Concierge
            </span>
            {summary}
          </p>
          {followUp && <p className="text-muted-foreground mt-2 italic">{followUp}</p>}
        </div>
      )}
      {error && <p className="mt-5 text-sm text-rust border-t border-border pt-4">{error}</p>}
    </div>
  );
}
