import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Search,
  Sparkles,
  Loader2,
  ArrowLeft,
  Scissors,
  Heart,
  Lightbulb,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Mail,
  Info,
  Globe,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { searchQuiltMatch, getExampleQueries } from "@/services/quiltmatch";
import { discoverRetreats } from "@/services/discover";
import { MatchCard } from "@/components/quiltmatch/MatchCard";
import { DemoListingCard } from "@/components/quiltmatch/DemoListingCard";
import { DraftListingCard } from "@/components/quiltmatch/DraftListingCard";
import { QualityScoreBar } from "@/components/quiltmatch/QualityScoreBar";
import { ParsedFiltersDisplay } from "@/components/quiltmatch/ParsedFiltersDisplay";
import type { QuiltMatchResponse, StudentContext } from "@/types/quiltmatch";
import type { DraftListing } from "@/types/draft-listing";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export default function QuiltMatch() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Search state
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<QuiltMatchResponse | null>(null);

  // Web discovery state
  const [discoverLoading, setDiscoverLoading] = useState(false);
  const [discoveredListings, setDiscoveredListings] = useState<DraftListing[]>([]);
  const [discoverNote, setDiscoverNote] = useState<string>("");

  // Student context (optional)
  const [showContext, setShowContext] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [homeLocation, setHomeLocation] = useState("");
  const [flexibleDates, setFlexibleDates] = useState(true);
  const [flexibleBudget, setFlexibleBudget] = useState(true);

  // Outreach preview
  const [showOutreach, setShowOutreach] = useState(false);

  // Example queries
  const examples = getExampleQueries();
  const [currentExampleIdx, setCurrentExampleIdx] = useState(0);

  // Rotate placeholder example
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentExampleIdx((i) => (i + 1) % examples.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [examples.length]);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setDiscoveredListings([]);
    setDiscoverNote("");

    const context: Partial<StudentContext> = {
      name: studentName || undefined,
      email: studentEmail || undefined,
      home_location: homeLocation || undefined,
      flexible_dates: flexibleDates,
      flexible_budget: flexibleBudget,
    };

    // Run database matching and web discovery in parallel
    const dbMatchPromise = searchQuiltMatch(query, context).catch((err) => {
      console.error("QuiltMatch search error:", err);
      return null;
    });

    const webDiscoverPromise = (async () => {
      setDiscoverLoading(true);
      try {
        const discoverRes = await discoverRetreats({
          query,
          location: homeLocation || undefined,
        });
        setDiscoveredListings(discoverRes.draft_listings || []);
        setDiscoverNote(discoverRes.note || "");
      } catch (err) {
        console.warn("Web discovery unavailable:", err);
      } finally {
        setDiscoverLoading(false);
      }
    })();

    try {
      const [dbResult] = await Promise.all([dbMatchPromise, webDiscoverPromise]);
      if (dbResult) {
        setResult(dbResult);
      } else {
        setError("Something went wrong with the search. Please try again.");
      }
    } catch (err) {
      console.error("Search error:", err);
      setError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleExampleClick = (example: string) => {
    setQuery(example);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  };

  const handleNewSearch = () => {
    setResult(null);
    setError(null);
    setQuery("");
    setDiscoveredListings([]);
    setDiscoverNote("");
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="text-muted-foreground"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Scissors className="w-5 h-5 text-primary" />
              <span className="font-semibold text-foreground">
                QuiltMatch AI
              </span>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/browse")}
            className="text-sm"
          >
            Browse All Retreats
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Hero Section */}
        {!result && (
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-4">
              <Sparkles className="w-4 h-4" />
              AI-Powered Retreat Matching
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              Find Your Perfect Quilt Retreat
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Tell us what you're dreaming of in plain language. Our AI will match
              you with the best retreats — or create your ideal listing if nothing
              exists yet.
            </p>
          </div>
        )}

        {/* Search Section */}
        <div className={`max-w-3xl mx-auto ${result ? "mb-8" : "mb-12"}`}>
          <Card className="shadow-craft-lg border-border/50 overflow-hidden">
            <CardContent className="p-0">
              {/* Main input area */}
              <div className="relative">
                <Textarea
                  ref={textareaRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={examples[currentExampleIdx]}
                  className="border-0 resize-none text-base p-5 pr-14 min-h-[100px] focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/50"
                  disabled={loading}
                />
                <Button
                  onClick={handleSearch}
                  disabled={loading || !query.trim()}
                  size="icon"
                  className="absolute bottom-4 right-4 rounded-full w-10 h-10 bg-primary hover:bg-primary/90 shadow-md"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Search className="w-5 h-5" />
                  )}
                </Button>
              </div>

              {/* Context section (collapsible) */}
              <div className="border-t border-border/30">
                <Collapsible open={showContext} onOpenChange={setShowContext}>
                  <CollapsibleTrigger asChild>
                    <button className="w-full px-5 py-3 flex items-center justify-between text-sm text-muted-foreground hover:bg-muted/30 transition-colors">
                      <span className="flex items-center gap-2">
                        <Info className="w-4 h-4" />
                        Add personal details for better matches
                      </span>
                      {showContext ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-5 pb-4 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <Label className="text-xs text-muted-foreground mb-1 block">
                            Your Name
                          </Label>
                          <Input
                            value={studentName}
                            onChange={(e) => setStudentName(e.target.value)}
                            placeholder="Sarah"
                            className="h-9"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground mb-1 block">
                            Email
                          </Label>
                          <Input
                            value={studentEmail}
                            onChange={(e) => setStudentEmail(e.target.value)}
                            placeholder="sarah@example.com"
                            type="email"
                            className="h-9"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground mb-1 block">
                            Home Location
                          </Label>
                          <Input
                            value={homeLocation}
                            onChange={(e) => setHomeLocation(e.target.value)}
                            placeholder="Charlotte, NC"
                            className="h-9"
                          />
                        </div>
                      </div>
                      <div className="flex gap-6">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={flexibleDates}
                            onCheckedChange={setFlexibleDates}
                            id="flex-dates"
                          />
                          <Label
                            htmlFor="flex-dates"
                            className="text-sm text-muted-foreground cursor-pointer"
                          >
                            Flexible dates
                          </Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={flexibleBudget}
                            onCheckedChange={setFlexibleBudget}
                            id="flex-budget"
                          />
                          <Label
                            htmlFor="flex-budget"
                            className="text-sm text-muted-foreground cursor-pointer"
                          >
                            Flexible budget
                          </Label>
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </CardContent>
          </Card>

          {/* Example queries */}
          {!result && !loading && (
            <div className="mt-5">
              <p className="text-sm text-muted-foreground mb-3 flex items-center gap-2">
                <Lightbulb className="w-4 h-4" />
                Try one of these:
              </p>
              <div className="flex flex-wrap gap-2">
                {examples.slice(0, 4).map((example) => (
                  <button
                    key={example}
                    onClick={() => handleExampleClick(example)}
                    className="text-sm px-3 py-1.5 rounded-full border border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-primary/5 transition-all"
                  >
                    {example.length > 50 ? example.substring(0, 50) + "..." : example}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="max-w-3xl mx-auto text-center py-16">
            <div className="inline-flex items-center gap-3 bg-primary/10 rounded-2xl px-6 py-4">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
              <div className="text-left">
                <p className="text-sm font-medium text-foreground">
                  Searching for your perfect retreat...
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Parsing your preferences and matching against our database
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="max-w-3xl mx-auto">
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-5">
                <p className="text-sm text-red-700 mb-3">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSearch}
                  className="text-red-700 border-red-300 hover:bg-red-100"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Results */}
        {result && !loading && (
          <div className="space-y-8">
            {/* Parsed Filters */}
            <div className="max-w-3xl mx-auto">
              <ParsedFiltersDisplay filters={result.parsed_filters} />
            </div>

            {/* Quality Score */}
            <div className="max-w-3xl mx-auto">
              <QualityScoreBar
                score={result.meta.quality_score}
                notes={result.meta.notes_for_frontend}
              />
            </div>

            {/* Real Matches */}
            {result.matches.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-accent" />
                  Your Matches
                  <span className="text-sm font-normal text-muted-foreground">
                    ({result.matches.length} found)
                  </span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {result.matches.map((match) => (
                    <MatchCard key={match.id} match={match} />
                  ))}
                </div>
              </div>
            )}

            {/* Demo Listing */}
            {result.demo_listing && (
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  {result.matches.length > 0
                    ? "Want Something Even Better?"
                    : "We're Creating This For You"}
                </h2>
                <div className="max-w-md">
                  <DemoListingCard demo={result.demo_listing as any} />
                </div>
              </div>
            )}

            {/* Web Discovery Results */}
            {(discoveredListings.length > 0 || discoverLoading) && (
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-2 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary" />
                  Discovered from the Web
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                  {discoverNote || "Found retreats across the web that match your search. Express interest and we'll connect you with the organizer."}
                </p>

                {discoverLoading ? (
                  <div className="flex items-center gap-3 bg-muted/30 rounded-xl px-5 py-4">
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Searching the web...</p>
                      <p className="text-xs text-muted-foreground">Finding quilt retreats beyond our directory</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {discoveredListings.map((listing) => (
                      <DraftListingCard key={listing.id} listing={listing} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Empty State */}
            {result.matches.length === 0 && !result.demo_listing && discoveredListings.length === 0 && !discoverLoading && (
              <div className="text-center py-12">
                <Scissors className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No matches yet
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto mb-6">
                  We couldn't find retreats matching your search right now. Try
                  adjusting your dates, budget, or location — we're growing our
                  retreat map every day.
                </p>
                <Button onClick={handleNewSearch} variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Search Again
                </Button>
              </div>
            )}

            {/* Outreach Preview (Admin/Debug) */}
            {result.outreach_payload.should_outreach && (
              <Collapsible open={showOutreach} onOpenChange={setShowOutreach}>
                <CollapsibleTrigger asChild>
                  <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <Mail className="w-4 h-4" />
                    <span>
                      {showOutreach
                        ? "Hide outreach preview"
                        : "View organizer outreach preview"}
                    </span>
                    {showOutreach ? (
                      <ChevronUp className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    )}
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <Card className="mt-3 border-border/40 bg-muted/20">
                    <CardContent className="p-5 space-y-4">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                          Demand Summary
                        </p>
                        <p className="text-sm text-foreground">
                          {result.outreach_payload.human_friendly_query_summary}
                        </p>
                      </div>
                      {result.outreach_payload.email_template && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                            Email Subject
                          </p>
                          <p className="text-sm text-foreground">
                            {result.outreach_payload.email_template.subject}
                          </p>
                        </div>
                      )}
                      {result.outreach_payload.organizer_emails &&
                        result.outreach_payload.organizer_emails.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                              Target Organizers (
                              {result.outreach_payload.organizer_emails.length})
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {result.outreach_payload.organizer_emails.map(
                                (email) => (
                                  <span
                                    key={email}
                                    className="text-xs bg-muted px-2 py-0.5 rounded"
                                  >
                                    {email}
                                  </span>
                                )
                              )}
                            </div>
                          </div>
                        )}
                      <p className="text-xs text-muted-foreground italic">
                        Reason: {result.outreach_payload.reason}
                      </p>
                    </CardContent>
                  </Card>
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* New Search Button */}
            <div className="text-center pt-4">
              <Button
                onClick={handleNewSearch}
                variant="outline"
                className="border-primary/30 text-primary hover:bg-primary/5"
              >
                <Search className="w-4 h-4 mr-2" />
                New Search
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/30 mt-16 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            Powered by{" "}
            <span className="font-medium text-primary">QuiltMatch AI</span> on{" "}
            <span className="font-medium">BookMyQuiltRetreat.com</span>
          </p>
          <p className="mt-1">
            Every search helps us match more quilters with their dream retreats.
          </p>
        </div>
      </footer>
    </div>
  );
}
