import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Sparkles, SlidersHorizontal } from "lucide-react";
import { QM_TEAL, QM_RUST } from "@/lib/quilt-match-home-brand";

export function AiSearchSection() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const handleSearch = () => {
    navigate("/retreats", { state: query.trim() ? { aiQuery: query.trim() } : undefined });
  };

  return (
    <section className="py-20 px-5 bg-card border-b border-border">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="font-display text-4xl md:text-[2.6rem] font-bold text-foreground mb-3">Search with AI</h2>
        <p className="text-muted-foreground text-base mb-10">
          Find your perfect quilting retreat using intelligent search
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex-1 w-full flex items-center gap-2.5 bg-background border border-border px-5 py-3.5 rounded-[6px] focus-within:border-[#3A6B6E] transition-colors shadow-sm">
            <Search size={16} className="text-muted-foreground shrink-0" aria-hidden />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search retreats by location, skill level, or style…"
              className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
              aria-label="Search retreats"
            />
          </div>

          <button
            type="button"
            onClick={handleSearch}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-[6px] text-sm font-semibold text-white whitespace-nowrap shadow-sm transition-opacity hover:opacity-90"
            style={{ background: QM_RUST }}
          >
            <Sparkles size={16} aria-hidden /> Search with AI
          </button>

          <button
            type="button"
            onClick={() => navigate("/retreats")}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3.5 rounded-[6px] border-2 border-border bg-background hover:bg-secondary transition-colors font-medium text-sm shrink-0"
            style={{ color: QM_TEAL }}
          >
            <SlidersHorizontal size={16} aria-hidden /> Filters
          </button>
        </div>
      </div>
    </section>
  );
}
