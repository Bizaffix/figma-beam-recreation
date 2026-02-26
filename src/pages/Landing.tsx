import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BrowseSection } from "@/components/BrowseSection";
import { ArrowRight, Sparkles, Search, WandSparkles } from "lucide-react";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col overflow-x-hidden">
      <Header />
      
      <main className="flex-1 w-full overflow-x-hidden">
        {/* Search mode selector */}
        <section className="border-b bg-gradient-to-r from-[#459394]/10 via-background to-[#FD8865]/10">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
            <div className="text-center mb-6 sm:mb-8">
              <p className="inline-flex items-center text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full mb-3">
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                Smart discovery
              </p>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
                Find your next quilt retreat your way
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-2 max-w-2xl mx-auto">
                Use AI for personalized matching, or browse all retreats and venues manually.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4 sm:gap-6 max-w-5xl mx-auto">
              <Card className="border-2 border-[#459394]/30 bg-white shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-5 sm:p-6">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-[#459394]/10">
                      <WandSparkles className="w-5 h-5 text-[#387C7F]" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-lg sm:text-xl font-semibold">QuiltMatch AI</h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        Share your dream retreat, take a 60-second vibe quiz, and get tailored recommendations.
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span className="px-2 py-1 rounded-full bg-muted">Personalized</span>
                        <span className="px-2 py-1 rounded-full bg-muted">Fast start</span>
                        <span className="px-2 py-1 rounded-full bg-muted">Best for first-time users</span>
                      </div>
                      <Button asChild className="mt-4 bg-[#459394] hover:bg-[#387C7F] text-white w-full sm:w-auto">
                        <Link to="/find">
                          Start QuiltMatch AI
                          <ArrowRight className="ml-2 w-4 h-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 bg-white shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-5 sm:p-6">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      <Search className="w-5 h-5 text-foreground" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-lg sm:text-xl font-semibold">Browse manually</h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        Search events and venues by location, dates, and filters if you already know what you want.
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span className="px-2 py-1 rounded-full bg-muted">Advanced filters</span>
                        <span className="px-2 py-1 rounded-full bg-muted">Events + venues</span>
                      </div>
                      <Button asChild variant="outline" className="mt-4 w-full sm:w-auto">
                        <a href="#browse-section">Browse retreats</a>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="text-center mt-4">
              <Button asChild variant="link" className="text-muted-foreground">
                <Link to="/how-it-works">Learn how the platform works</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Browse Section - Airbnb Style */}
        <BrowseSection />

      </main>
      
      <Footer />
    </div>
  );
};

export default Landing;

