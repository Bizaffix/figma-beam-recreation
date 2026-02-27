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
  MapPin,
  Calendar,
  BedDouble,
  GraduationCap,
  Users,
  TreePine,
  Lock,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { searchQuiltMatch, getExampleQueries } from "@/services/quiltmatch";
import { discoverRetreats } from "@/services/discover";
import { MatchCard } from "@/components/quiltmatch/MatchCard";
import { DemoListingCard } from "@/components/quiltmatch/DemoListingCard";
import { DraftListingCard, getDismissedIds } from "@/components/quiltmatch/DraftListingCard";
import { QualityScoreBar } from "@/components/quiltmatch/QualityScoreBar";
import { ParsedFiltersDisplay } from "@/components/quiltmatch/ParsedFiltersDisplay";
import { VibeQuiz } from "@/components/quiltmatch/VibeQuiz";
import { PersonalityReveal } from "@/components/quiltmatch/PersonalityReveal";
import { WelcomeBackModal } from "@/components/quiltmatch/WelcomeBackModal";
import { ExitIntentModal } from "@/components/quiltmatch/ExitIntentModal";
import {
  DREAM_PLACEHOLDERS,
  computePersonality,
  quizAnswersToSearchContext,
  PERSONALITY_TYPES,
} from "@/data/retreater-personality";
import type { PersonalityType, QuizAnswers } from "@/data/retreater-personality";
import type { QuiltMatchResponse, StudentContext } from "@/types/quiltmatch";
import type { DraftListing } from "@/types/draft-listing";
import {
  initSession,
  hasExistingProgress,
  getFullState,
  saveDreamSentence,
  saveQuizAnswers,
  savePersonality,
  saveMatches,
  saveStudentContext,
  clearQuiltMatchData,
  getProgress,
} from "@/lib/quiltmatch-tracking";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { usePlatformSettings } from "@/contexts/PlatformSettingsContext";

const FREE_AI_SEARCH_KEY = "bmqr_ai_free_search_used";

// Quick-add chips for dream input
const QUICK_CHIPS = [
  { emoji: "\u{1F4CD}", label: "Near...", field: "location" as const, placeholder: "City or region" },
  { emoji: "\u{1F5D3}\uFE0F", label: "Spring 2026", field: "dates" as const, value: "Spring 2026" },
  { emoji: "\u{1F5D3}\uFE0F", label: "Summer 2026", field: "dates" as const, value: "Summer 2026" },
  { emoji: "\u{1F5D3}\uFE0F", label: "Fall 2026", field: "dates" as const, value: "Fall 2026" },
  { emoji: "\u{1F6CF}\uFE0F", label: "Private room", field: "append" as const, value: "private room" },
  { emoji: "\u{1F4A1}", label: "Free motion", field: "append" as const, value: "learn free motion quilting" },
  { emoji: "\u{1F4A1}", label: "Modern quilting", field: "append" as const, value: "modern quilting" },
  { emoji: "\u{1F4A1}", label: "Hand quilting", field: "append" as const, value: "hand quilting" },
  { emoji: "\u{1F91D}", label: "Meet quilters", field: "append" as const, value: "meet new quilters" },
  { emoji: "\u{1F9D8}", label: "Quiet & restful", field: "append" as const, value: "quiet and restful" },
];

type FlowStage = "dream" | "quiz" | "personality" | "results";

export default function QuiltMatch() {
  const navigate = useNavigate();
  const { user, hasAiAccess } = useAuth();
  const { settings: platformSettings } = usePlatformSettings();
  const aiMonthlyPrice = platformSettings?.ai_subscription_monthly_price ?? 3.99;
  const [freeSearchUsed, setFreeSearchUsed] = useState(false);
  const [freeSessionUnlocked, setFreeSessionUnlocked] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Flow stage
  const [stage, setStage] = useState<FlowStage>("dream");

  // Screen 1: Dream input
  const [query, setQuery] = useState("");
  const [locationChip, setLocationChip] = useState("");
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);

  // Screen 2: Quiz
  const [quizAnswers, setQuizAnswers] = useState<QuizAnswers | null>(null);

  // Screen 3: Personality
  const [personality, setPersonality] = useState<PersonalityType | null>(null);

  // Search state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<QuiltMatchResponse | null>(null);

  // Web discovery state
  const [discoverLoading, setDiscoverLoading] = useState(false);
  const [discoveredListings, setDiscoveredListings] = useState<DraftListing[]>([]);
  const [discoverNote, setDiscoverNote] = useState<string>("");

  // Student context
  const [showContext, setShowContext] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [homeLocation, setHomeLocation] = useState("");
  const [personalPreferences, setPersonalPreferences] = useState("");
  const [flexibleDates, setFlexibleDates] = useState(true);
  const [flexibleBudget, setFlexibleBudget] = useState(true);

  // Outreach preview
  const [showOutreach, setShowOutreach] = useState(false);

  // Tracking modals
  const [showWelcomeBack, setShowWelcomeBack] = useState(false);
  const [showExitIntent, setShowExitIntent] = useState(false);
  const exitIntentFiredRef = useRef(false);

  // ---- Session init + return visitor detection ----
  useEffect(() => {
    initSession();

    const used = localStorage.getItem(FREE_AI_SEARCH_KEY) === "true";
    setFreeSearchUsed(used);
    if (!hasAiAccess && !used) {
      setFreeSessionUnlocked(true);
    }

    if (hasExistingProgress()) {
      setShowWelcomeBack(true);
    }
  }, [hasAiAccess]);

  // ---- Exit intent detection (mouse leaves viewport) ----
  useEffect(() => {
    const handleMouseLeave = (e: MouseEvent) => {
      if (
        e.clientY < 10 &&
        !exitIntentFiredRef.current &&
        !user &&
        !studentEmail &&
        getProgress() !== "not_started"
      ) {
        exitIntentFiredRef.current = true;
        setShowExitIntent(true);
      }
    };
    document.addEventListener("mouseleave", handleMouseLeave);
    return () => document.removeEventListener("mouseleave", handleMouseLeave);
  }, [user, studentEmail]);

  // ---- Auto-save progress at each stage transition ----
  useEffect(() => {
    if (stage === "quiz" && query.trim()) {
      saveDreamSentence(query);
    }
  }, [stage, query]);

  // Rotate placeholder every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIdx((i) => (i + 1) % DREAM_PLACEHOLDERS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Character count encouragement
  const charCount = query.length;
  const charMessage =
    charCount === 0 ? "" :
    charCount < 20 ? "Keep going... the more you share, the better we match" :
    charCount < 60 ? "Great start! Add more detail for even better matches" :
    "Perfect! We have plenty to work with";

  const handleChipClick = (chip: typeof QUICK_CHIPS[0]) => {
    if (chip.field === "location") {
      setShowLocationInput(true);
      return;
    }
    if (chip.field === "dates") {
      const addition = chip.value || "";
      if (!query.includes(addition)) {
        setQuery((prev) => (prev ? `${prev.trimEnd()}, ${addition}` : addition));
      }
      return;
    }
    if (chip.field === "append" && chip.value) {
      if (!query.toLowerCase().includes(chip.value.toLowerCase())) {
        setQuery((prev) => (prev ? `${prev.trimEnd()}, ${chip.value}` : chip.value!));
      }
    }
  };

  const handleLocationSubmit = () => {
    if (locationChip.trim()) {
      const loc = `near ${locationChip.trim()}`;
      if (!query.toLowerCase().includes(loc.toLowerCase())) {
        setQuery((prev) => (prev ? `${prev.trimEnd()}, ${loc}` : loc));
      }
      setHomeLocation(locationChip.trim());
    }
    setShowLocationInput(false);
  };

  const handleDreamSubmit = () => {
    if (!query.trim()) return;
    setStage("quiz");
  };

  const handleQuizComplete = (answers: QuizAnswers) => {
    setQuizAnswers(answers);
    const p = computePersonality(answers);
    setPersonality(p);
    setStage("personality");

    // Persist quiz answers + personality
    saveQuizAnswers({
      energy: String(answers.creative_energy || ""),
      rooming: String(answers.sleeping || ""),
      priorities: Array.isArray(answers.retreat_focus) ? answers.retreat_focus : [answers.retreat_focus].filter(Boolean) as string[],
      budget: String(answers.budget_comfort || ""),
    });
    savePersonality(p.id);
  };

  const handleContinueToResults = () => {
    setStage("results");
    runSearch();
  };

  const handleSkipQuiz = () => {
    if (!query.trim()) return;
    setStage("results");
    runSearch();
  };

  const runSearch = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setDiscoveredListings([]);
    setDiscoverNote("");

    // Build enriched query from dream + quiz + personality
    let enrichedQuery = query;
    if (quizAnswers && personality) {
      const { searchAdditions, budgetRange } = quizAnswersToSearchContext(quizAnswers, personality);
      if (searchAdditions) enrichedQuery += `. Preferences: ${searchAdditions}`;
      if (budgetRange) enrichedQuery += `. Budget: ${budgetRange}`;
    }
    if (personalPreferences.trim()) {
      enrichedQuery += `. Personal preferences: ${personalPreferences.trim()}`;
    }

    const context: Partial<StudentContext> = {
      name: studentName || undefined,
      email: studentEmail || undefined,
      home_location: homeLocation || undefined,
      preferences: personalPreferences || undefined,
      flexible_dates: flexibleDates,
      flexible_budget: flexibleBudget,
    };

    const dbMatchPromise = searchQuiltMatch(enrichedQuery, context).catch((err) => {
      console.error("QuiltMatch search error:", err);
      return null;
    });

    const webDiscoverPromise = (async () => {
      setDiscoverLoading(true);
      try {
        const discoverRes = await discoverRetreats({
          query: enrichedQuery,
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
        // Persist match IDs for return-visit restore
        const matchIds = [
          ...(dbResult.matches?.map((m: { id: string }) => m.id) || []),
          ...(dbResult.demo_listings?.map((_: unknown, i: number) => `demo_${i}`) || []),
        ];
        saveMatches(matchIds);

        // Mark free trial as consumed for non-subscribed users
        if (!hasAiAccess) {
          localStorage.setItem(FREE_AI_SEARCH_KEY, "true");
          setFreeSearchUsed(true);
        }
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

    // Persist student context if provided
    if (studentName || studentEmail || homeLocation) {
      saveStudentContext({ name: studentName, email: studentEmail, location: homeLocation });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleDreamSubmit();
    }
  };

  const handleNewSearch = () => {
    setStage("dream");
    setResult(null);
    setError(null);
    setQuery("");
    setQuizAnswers(null);
    setPersonality(null);
    setDiscoveredListings([]);
    setDiscoverNote("");
    clearQuiltMatchData();
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  // ---- Return visitor handlers ----
  const handleResumeSession = () => {
    const saved = getFullState();

    // Restore dream sentence
    if (saved.dreamSentence) setQuery(saved.dreamSentence);

    // Restore student context
    if (saved.studentContext.name) setStudentName(saved.studentContext.name);
    if (saved.studentContext.email) setStudentEmail(saved.studentContext.email);
    if (saved.studentContext.location) setHomeLocation(saved.studentContext.location);

    // Restore quiz answers & personality
    if (saved.quizAnswers.energy) {
      const answers: QuizAnswers = {
        energy: saved.quizAnswers.energy,
        rooming: saved.quizAnswers.rooming,
        priorities: saved.quizAnswers.priorities,
        budget: saved.quizAnswers.budget,
      };
      setQuizAnswers(answers);
      if (saved.personalityId) {
        const p = PERSONALITY_TYPES.find((t) => t.id === saved.personalityId) || null;
        setPersonality(p);
      }
    }

    // Navigate to the appropriate stage
    switch (saved.progress) {
      case "screen_4_complete":
        setStage("results");
        // Re-run search with restored data
        setTimeout(() => runSearch(), 100);
        break;
      case "screen_3_complete":
        setStage("personality");
        break;
      case "screen_2_complete":
        setStage("quiz");
        break;
      case "screen_1_complete":
        setStage("quiz");
        break;
      default:
        setStage("dream");
    }
  };

  const handleStartFresh = () => {
    clearQuiltMatchData();
    setStage("dream");
  };

  const canAccessQuiltMatch = hasAiAccess || freeSessionUnlocked;

  if (!canAccessQuiltMatch) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-lg border border-[#459394]/30">
          <CardContent className="p-8 text-center space-y-4">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#459394]/10">
              <Sparkles className="w-6 h-6 text-[#387C7F]" />
            </div>
            <h1 className="text-2xl font-bold">Your free AI search is used</h1>
            <p className="text-muted-foreground">
              Unlock unlimited QuiltMatch AI with a plan at {"$"}
              {aiMonthlyPrice.toFixed(2)}/month.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={() => {
                  if (!user) {
                    navigate(`/signup?role=student&intent=quiltmatch_ai&plan=${encodeURIComponent(String(aiMonthlyPrice))}&next=/find`);
                    return;
                  }
                  navigate("/quiltmatch/upgrade");
                }}
                className="bg-[#459394] hover:bg-[#387C7F] text-white"
              >
                {user ? "Upgrade now" : "Sign up and continue"}
              </Button>
              <Button variant="outline" onClick={() => navigate("/browse")}>
                Browse free listings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Tracking modals */}
      <WelcomeBackModal
        open={showWelcomeBack}
        onOpenChange={setShowWelcomeBack}
        onResume={handleResumeSession}
        onStartFresh={handleStartFresh}
      />
      <ExitIntentModal
        open={showExitIntent}
        onOpenChange={setShowExitIntent}
        onSaved={() => {}}
      />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (stage === "quiz") setStage("dream");
                else if (stage === "personality") setStage("quiz");
                else if (stage === "results" && personality) setStage("personality");
                else navigate(-1);
              }}
              className="text-muted-foreground"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Scissors className="w-5 h-5 text-primary" />
              <span className="font-semibold text-foreground">QuiltMatch AI</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {personality && stage === "results" && (
              <span className="hidden sm:flex items-center gap-1 text-sm text-muted-foreground bg-muted/50 rounded-full px-3 py-1">
                <span>{personality.emoji}</span>
                <span className="font-medium">{personality.name}</span>
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/browse")}
              className="text-sm"
            >
              Browse All
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* ==================== SCREEN 1: THE DREAM ==================== */}
        {stage === "dream" && (
          <div className="max-w-3xl mx-auto">
            {/* Hero */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-4">
                <Sparkles className="w-4 h-4" />
                AI-Powered Retreat Matching
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
                Describe your dream quilt retreat in one sentence.
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Write it like you're texting a friend. Our AI will find retreats that match your vibe.
              </p>
            </div>

            {/* Dream input */}
            <Card className="shadow-craft-lg border-border/50 overflow-hidden mb-4">
              <CardContent className="p-0">
                <div className="relative">
                  <Textarea
                    ref={textareaRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={DREAM_PLACEHOLDERS[placeholderIdx]}
                    className="border-0 resize-none text-base p-5 pr-14 min-h-[120px] focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/40 placeholder:italic"
                  />
                  <Button
                    onClick={handleDreamSubmit}
                    disabled={!query.trim()}
                    size="icon"
                    className="absolute bottom-4 right-4 rounded-full w-10 h-10 bg-primary hover:bg-primary/90 shadow-md"
                  >
                    <Search className="w-5 h-5" />
                  </Button>
                </div>

                {/* Character encouragement */}
                {charMessage && (
                  <div className="px-5 pb-2">
                    <p className="text-xs text-muted-foreground italic">{charMessage}</p>
                  </div>
                )}

                {/* Context section (collapsible) */}
                <div className="border-t border-border/30">
                  <Collapsible open={showContext} onOpenChange={setShowContext}>
                    <CollapsibleTrigger asChild>
                      <button className="w-full px-5 py-3 flex items-center justify-between text-sm text-muted-foreground hover:bg-muted/30 transition-colors">
                        <span className="flex items-center gap-2">
                          <Info className="w-4 h-4" />
                          Add personal preferences (room sharing, diet, accessibility) for better matches
                        </span>
                        {showContext ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="px-5 pb-4 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <Label className="text-xs text-muted-foreground mb-1 block">Your Name</Label>
                            <Input value={studentName} onChange={(e) => setStudentName(e.target.value)} placeholder="Sarah" className="h-9" />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground mb-1 block">Email</Label>
                            <Input value={studentEmail} onChange={(e) => setStudentEmail(e.target.value)} placeholder="sarah@example.com" type="email" className="h-9" />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground mb-1 block">Home Location</Label>
                            <Input value={homeLocation} onChange={(e) => setHomeLocation(e.target.value)} placeholder="Charlotte, NC" className="h-9" />
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground mb-1 block">
                            Preferences (optional)
                          </Label>
                          <Textarea
                            value={personalPreferences}
                            onChange={(e) => setPersonalPreferences(e.target.value)}
                            placeholder="Example: private room only, vegetarian meals, gluten-free options, quiet evenings, wheelchair accessible spaces."
                            className="min-h-[72px] text-sm"
                          />
                        </div>
                        <div className="flex gap-6">
                          <div className="flex items-center gap-2">
                            <Switch checked={flexibleDates} onCheckedChange={setFlexibleDates} id="flex-dates" />
                            <Label htmlFor="flex-dates" className="text-sm text-muted-foreground cursor-pointer">Flexible dates</Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch checked={flexibleBudget} onCheckedChange={setFlexibleBudget} id="flex-budget" />
                            <Label htmlFor="flex-budget" className="text-sm text-muted-foreground cursor-pointer">Flexible budget</Label>
                          </div>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              </CardContent>
            </Card>

            {/* Quick-add chips */}
            <div className="mb-6">
              {!hasAiAccess && !freeSearchUsed && (
                <div className="mb-4 text-center">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-[#459394]/10 text-[#387C7F] border border-[#459394]/20">
                    First AI search is free
                  </span>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {QUICK_CHIPS.map((chip) => (
                  <button
                    key={chip.label}
                    onClick={() => handleChipClick(chip)}
                    className="text-sm px-3 py-1.5 rounded-full border border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-primary/5 transition-all flex items-center gap-1.5"
                  >
                    <span>{chip.emoji}</span>
                    {chip.label}
                  </button>
                ))}
              </div>

              {/* Location chip inline input */}
              {showLocationInput && (
                <div className="mt-3 flex items-center gap-2 max-w-xs">
                  <Input
                    value={locationChip}
                    onChange={(e) => setLocationChip(e.target.value)}
                    placeholder="City or region"
                    className="h-8 text-sm"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleLocationSubmit();
                      if (e.key === "Escape") setShowLocationInput(false);
                    }}
                  />
                  <Button size="sm" onClick={handleLocationSubmit} className="h-8 px-3 text-xs">
                    Add
                  </Button>
                </div>
              )}
            </div>

            {/* Privacy note */}
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Lock className="w-3 h-3" />
              No signup needed yet — we'll show you matches first.
            </div>

            {/* CTA button */}
            <div className="text-center mt-8">
              <Button
                onClick={handleDreamSubmit}
                disabled={!query.trim()}
                size="lg"
                className="bg-primary hover:bg-primary/90 text-lg px-8"
              >
                Find my retreats
                <Sparkles className="w-5 h-5 ml-2" />
              </Button>

              {query.trim() && (
                <p className="mt-3">
                  <button
                    onClick={handleSkipQuiz}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors underline underline-offset-2"
                  >
                    Skip quiz, search now
                  </button>
                </p>
              )}
            </div>
          </div>
        )}

        {/* ==================== SCREEN 2: VIBE QUIZ ==================== */}
        {stage === "quiz" && (
          <VibeQuiz
            onComplete={handleQuizComplete}
            onBack={() => setStage("dream")}
          />
        )}

        {/* ==================== SCREEN 3: PERSONALITY REVEAL ==================== */}
        {stage === "personality" && personality && (
          <PersonalityReveal
            personality={personality}
            onContinueToResults={handleContinueToResults}
          />
        )}

        {/* ==================== SCREEN 4: RESULTS ==================== */}
        {stage === "results" && (
          <div>
            {/* Personality mini-badge (if they took the quiz) */}
            {personality && !loading && (
              <div className="max-w-3xl mx-auto mb-6 flex items-center gap-3 bg-muted/30 rounded-xl px-4 py-3">
                <span className="text-2xl">{personality.emoji}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{personality.name}</p>
                  <p className="text-xs text-muted-foreground">Matched retreats tuned to your personality</p>
                </div>
                <button
                  onClick={() => setStage("personality")}
                  className="text-xs text-primary hover:underline"
                >
                  View profile
                </button>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="max-w-3xl mx-auto text-center py-16">
                <div className="inline-flex items-center gap-3 bg-primary/10 rounded-2xl px-6 py-4">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-foreground">
                      {personality
                        ? `Finding retreats for ${personality.name}...`
                        : "Searching for your perfect retreat..."}
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
                      onClick={runSearch}
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
                <div className="max-w-3xl mx-auto">
                  <ParsedFiltersDisplay filters={result.parsed_filters} />
                </div>

                <div className="max-w-3xl mx-auto">
                  <QualityScoreBar
                    score={result.meta.quality_score}
                    notes={result.meta.notes_for_frontend}
                  />
                </div>

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

                {(discoveredListings.length > 0 || discoverLoading) && (
                  <div>
                    <h2 className="text-xl font-semibold text-foreground mb-2 flex items-center gap-2">
                      <Globe className="w-5 h-5 text-primary" />
                      Discovered from the Web
                    </h2>
                    <p className="text-sm text-muted-foreground mb-4">
                      {discoverNote || "Found retreats across the web that match your search."}
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
                        {discoveredListings
                          .filter((l) => !getDismissedIds().includes(l.id))
                          .map((listing) => (
                            <DraftListingCard
                              key={listing.id}
                              listing={listing}
                              onDismiss={(id) => {
                                setDiscoveredListings((prev) => prev.filter((l) => l.id !== id));
                              }}
                            />
                          ))}
                      </div>
                    )}
                  </div>
                )}

                {result.matches.length === 0 && !result.demo_listing && discoveredListings.length === 0 && !discoverLoading && (
                  <div className="text-center py-12">
                    <Scissors className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No matches yet</h3>
                    <p className="text-muted-foreground max-w-md mx-auto mb-6">
                      We couldn't find retreats matching your search right now. Try
                      adjusting your dates, budget, or location.
                    </p>
                    <Button onClick={handleNewSearch} variant="outline">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Start Over
                    </Button>
                  </div>
                )}

                {result.outreach_payload.should_outreach && (
                  <Collapsible open={showOutreach} onOpenChange={setShowOutreach}>
                    <CollapsibleTrigger asChild>
                      <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                        <Mail className="w-4 h-4" />
                        <span>{showOutreach ? "Hide outreach preview" : "View organizer outreach preview"}</span>
                        {showOutreach ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <Card className="mt-3 border-border/40 bg-muted/20">
                        <CardContent className="p-5 space-y-4">
                          <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Demand Summary</p>
                            <p className="text-sm text-foreground">{result.outreach_payload.human_friendly_query_summary}</p>
                          </div>
                          {result.outreach_payload.email_template && (
                            <div>
                              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Email Subject</p>
                              <p className="text-sm text-foreground">{result.outreach_payload.email_template.subject}</p>
                            </div>
                          )}
                          {result.outreach_payload.organizer_emails && result.outreach_payload.organizer_emails.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                                Target Organizers ({result.outreach_payload.organizer_emails.length})
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {result.outreach_payload.organizer_emails.map((email) => (
                                  <span key={email} className="text-xs bg-muted px-2 py-0.5 rounded">{email}</span>
                                ))}
                              </div>
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground italic">Reason: {result.outreach_payload.reason}</p>
                        </CardContent>
                      </Card>
                    </CollapsibleContent>
                  </Collapsible>
                )}

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
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/30 mt-16 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            Powered by <span className="font-medium text-primary">QuiltMatch AI</span> on{" "}
            <span className="font-medium">BookMyQuiltRetreat.com</span>
          </p>
          <p className="mt-1">Every search helps us match more quilters with their dream retreats.</p>
        </div>
      </footer>
    </div>
  );
}
