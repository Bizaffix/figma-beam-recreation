import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ArrowRight, Heart, GraduationCap, Search, CreditCard, Users, FileText } from "lucide-react";

/** Legacy BookMyQuiltRetreat-style how-it-works (backup). Active route uses QuiltMatchHowItWorksPage. */
const HowItWorksLegacy = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col overflow-x-hidden">
      <Header />

      <main className="flex-1 w-full overflow-x-hidden">
        <section id="how-it-works" className="py-16 sm:py-20 bg-background">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h1 className="text-3xl sm:text-4xl font-bold mb-3">How BookMyQuiltRetreat Works</h1>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                A simple way for quilters to find retreats and for instructors to fill seats.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-6xl mx-auto">
              <Card className="border-2">
                <CardContent className="p-6 sm:p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <Heart className="w-6 h-6 text-primary" />
                    <h2 className="text-xl font-semibold">For Quilters</h2>
                  </div>
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    <li>Browse retreats by date, location, and quilting style.</li>
                    <li>Use QuiltMatch AI to get personalized recommendations.</li>
                    <li>Book and pay with clear pricing and policies.</li>
                  </ul>
                  <Button asChild className="mt-6 w-full sm:w-auto bg-[#459394] hover:bg-[#387C7F] text-white">
                    <Link to="/find">
                      Start QuiltMatch AI
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardContent className="p-6 sm:p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <GraduationCap className="w-6 h-6 text-primary" />
                    <h2 className="text-xl font-semibold">For Instructors & Hosts</h2>
                  </div>
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    <li>Create retreat listings with dates, pricing, and capacity.</li>
                    <li>Manage registrations in one place.</li>
                    <li>Reach quilters actively searching for retreats.</li>
                  </ul>
                  <Button asChild variant="outline" className="mt-6 w-full sm:w-auto">
                    <Link to="/signup?role=instructor">
                      Create Instructor Account
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-20 bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold">Why People Use It</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6 max-w-6xl mx-auto">
              <Card>
                <CardContent className="p-6 space-y-4">
                  <h3 className="text-lg font-semibold">Quilters</h3>
                  <div className="flex items-start gap-3">
                    <Search className="w-5 h-5 text-primary mt-0.5" />
                    <p className="text-sm text-muted-foreground">Discover relevant retreats quickly.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CreditCard className="w-5 h-5 text-primary mt-0.5" />
                    <p className="text-sm text-muted-foreground">Book confidently with transparent pricing.</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 space-y-4">
                  <h3 className="text-lg font-semibold">Instructors</h3>
                  <div className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-primary mt-0.5" />
                    <p className="text-sm text-muted-foreground">Reach an audience already looking to book.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-primary mt-0.5" />
                    <p className="text-sm text-muted-foreground">Manage listings and registrations in one workflow.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default HowItWorksLegacy;
