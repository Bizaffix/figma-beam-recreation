import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BrowseSection } from "@/components/BrowseSection";
import { 
  Search, 
  Calendar, 
  CreditCard, 
  UtensilsCrossed,
  Users, 
  FileText, 
  MapPin,
  CheckCircle2,
  ArrowRight,
  Heart,
  GraduationCap,
  Building2
} from "lucide-react";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col overflow-x-hidden">
      <Header />
      
      <main className="flex-1 w-full overflow-x-hidden">
      {/* Browse Section - Airbnb Style */}
      <BrowseSection />

      {/* Role Selection Section */}
      <section className="py-20 sm:py-24 md:py-28 lg:py-32 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-10 md:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-3">Choose Your Path</h2>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              Select the option that best describes you and start your crafting journey today
            </p>
          </div>
          
          {/* Image at top of section */}
          <div className="mb-8 sm:mb-10 md:mb-12 max-w-4xl mx-auto">
            <div className="relative group overflow-hidden rounded-xl shadow-xl hover:shadow-2xl transition-shadow duration-300">
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent z-10"></div>
              <img 
                src="/Image2.jpg" 
                alt="Quilt retreat experience" 
                className="w-full h-40 sm:h-56 md:h-72 lg:h-80 object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 sm:gap-8 max-w-6xl mx-auto">
            {/* Quilter Card */}
            <Card className="border-2 hover:border-[#459394] transition-craft hover:shadow-craft-hover hover:scale-[1.02] bg-card">
              <CardContent className="p-8 sm:p-10 text-center space-y-5">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto shadow-craft-lg border-2 border-[#FAB130]/30">
                  <Heart className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold">For Quilters & Students</h3>
                <p className="text-base sm:text-lg text-muted-foreground italic">
                  "I want to attend retreats and classes"
                </p>
                <p className="text-sm sm:text-base text-muted-foreground">
                  I'm looking for inspiration, community, and uninterrupted sewing time
                </p>
                <Button asChild size="lg" className="w-full mt-6 btn-pill bg-[#459394] hover:bg-[#387C7F] text-white shadow-craft hover:shadow-craft-hover transition-craft">
                  <Link to="/signup?role=student">
                    Create Quilter Account
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Instructor Card */}
            <Card className="border-2 hover:border-[#459394] transition-craft hover:shadow-craft-hover hover:scale-[1.02] bg-card">
              <CardContent className="p-8 sm:p-10 text-center space-y-5">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto shadow-craft-lg border-2 border-[#FAB130]/30">
                  <GraduationCap className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold">For Instructors & Hosts</h3>
                <p className="text-base sm:text-lg text-muted-foreground italic">
                  "I teach, organize, or host crafting retreats and workshops"
                </p>
                <p className="text-sm sm:text-base text-muted-foreground">
                  I need an easier way to fill seats and manage registrations
                </p>
                <Button asChild size="lg" className="w-full mt-6 btn-pill bg-[#459394] hover:bg-[#387C7F] text-white shadow-craft hover:shadow-craft-hover transition-craft">
                  <Link to="/signup?role=instructor">
                    Create Instructor/Host Account
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 sm:py-24 md:py-28 lg:py-32 scroll-mt-16 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6 sm:mb-8 md:mb-10">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-3">How BookMyQuiltRetreat Works</h2>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              Simple steps to connect quilters with amazing retreat experiences
            </p>
          </div>
          
          {/* Image at top of section */}
          <div className="mb-6 sm:mb-8 md:mb-10 max-w-4xl mx-auto">
            <div className="relative group overflow-hidden rounded-xl shadow-xl hover:shadow-2xl transition-shadow duration-300">
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent z-10"></div>
              <img 
                src="/Image3.jpg" 
                alt="Crafting workshop" 
                className="w-full h-40 sm:h-56 md:h-72 lg:h-80 object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 sm:gap-8 max-w-6xl mx-auto">
            {/* For Quilters */}
            <Card className="border-2 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center shadow-md">
                    <Heart className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold">For Quilters (Students)</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="flex gap-4 p-4 rounded-lg bg-muted/30 border-l-4 border-[#459394]">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-[#459394] rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md">1</div>
                    </div>
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                      Browse retreats and classes by date, location, instructor, or technique—think applique, improv, modern, longarm, and more.
                    </p>
                  </div>
                  
                  <div className="flex gap-4 p-4 rounded-lg bg-muted/30 border-l-4 border-[#459394]">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-[#459394] rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md">2</div>
                    </div>
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                      View full details: schedule, supply list, lodging notes, pricing, and available catering options.
                    </p>
                  </div>
                  
                  <div className="flex gap-4 p-4 rounded-lg bg-muted/30 border-l-4 border-[#459394]">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-[#459394] rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md">3</div>
                    </div>
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                      Secure your spot and pay online; receive instant confirmation and retreat updates in your inbox.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* For Instructors */}
            <Card className="border-2 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center shadow-md">
                    <GraduationCap className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold">For Instructors/Hosts</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="flex gap-4 p-4 rounded-lg bg-muted/30 border-l-4 border-[#459394]">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-[#459394] rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md">1</div>
                    </div>
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                      Create your retreat or class: set dates, location (any venue you've coordinated), theme, skill level, and capacity.
                    </p>
                  </div>
                  
                  <div className="flex gap-4 p-4 rounded-lg bg-muted/30 border-l-4 border-[#459394]">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-[#459394] rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md">2</div>
                    </div>
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                      Add pricing, policies, and optional catering details so guests know exactly what to expect.
                    </p>
                  </div>
                  
                  <div className="flex gap-4 p-4 rounded-lg bg-muted/30 border-l-4 border-[#459394]">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-[#459394] rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md">3</div>
                    </div>
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                      Publish your listing, share your link, and let quilters register and pay directly through the platform.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Trust and Features Section */}
      <section className="py-20 sm:py-24 md:py-28 lg:py-32 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Image at top of section */}
          <div className="mb-6 sm:mb-8 md:mb-10 max-w-4xl mx-auto">
            <div className="relative group overflow-hidden rounded-xl shadow-xl hover:shadow-2xl transition-shadow duration-300">
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent z-10"></div>
              <img 
                src="/Image4.jpg" 
                alt="Quilt community" 
                className="w-full h-40 sm:h-56 md:h-72 lg:h-80 object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 sm:gap-8 max-w-6xl mx-auto">
            {/* Why Quilters Love It */}
            <Card className="border-2 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6 sm:p-8">
                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-6">Why Quilters Love It</h3>
                <div className="space-y-4">
                  <div className="flex gap-4 p-4 rounded-lg bg-muted/30 border-l-4 border-[#459394]">
                    <Search className="w-6 h-6 text-[#459394] flex-shrink-0 mt-0.5" />
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                      Central place to discover retreats instead of piecing together posts from social media and guild boards.
                    </p>
                  </div>
                  <div className="flex gap-4 p-4 rounded-lg bg-muted/30 border-l-4 border-[#459394]">
                    <CreditCard className="w-6 h-6 text-[#459394] flex-shrink-0 mt-0.5" />
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                      Secure payments, clear cancellation policies, and transparent pricing for every event.
                    </p>
                  </div>
                  <div className="flex gap-4 p-4 rounded-lg bg-muted/30 border-l-4 border-[#459394]">
                    <UtensilsCrossed className="w-6 h-6 text-[#459394] flex-shrink-0 mt-0.5" />
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                      Options for local food catering so you can focus on stitching, not logistics.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Why Instructors Host Here */}
            <Card className="border-2 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6 sm:p-8">
                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-6">Why Instructors Host Here</h3>
                <div className="space-y-4">
                  <div className="flex gap-4 p-4 rounded-lg bg-muted/30 border-l-4 border-[#459394]">
                    <Users className="w-6 h-6 text-[#459394] flex-shrink-0 mt-0.5" />
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                      A dedicated audience of quilters actively looking for classes and retreats.
                    </p>
                  </div>
                  <div className="flex gap-4 p-4 rounded-lg bg-muted/30 border-l-4 border-[#459394]">
                    <FileText className="w-6 h-6 text-[#459394] flex-shrink-0 mt-0.5" />
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                      Built-in registration and payment tools so you can retire your paper forms and spreadsheets.
                    </p>
                  </div>
                  <div className="flex gap-4 p-4 rounded-lg bg-muted/30 border-l-4 border-[#459394]">
                    <MapPin className="w-6 h-6 text-[#459394] flex-shrink-0 mt-0.5" />
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                      Flexible locations: use guild spaces, shops, lodges, churches, or destination venues—wherever your vision lives.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Comparison Table Section */}
      <section className="py-20 sm:py-24 md:py-28 lg:py-32 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6 sm:mb-8 md:mb-10">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-3">Who This Platform Is For</h2>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              Find out which role fits you best
            </p>
          </div>
          <div className="max-w-4xl mx-auto">
            {/* Mobile: Card Layout */}
            <div className="md:hidden space-y-4">
              <Card>
                <CardContent className="p-4 sm:p-6 space-y-3">
                  <h3 className="font-semibold text-lg">Quilter / Student</h3>
                  <p className="text-sm text-muted-foreground">
                    Discover retreats, view details, register, and pay online.
                  </p>
                  <Button asChild variant="outline" className="w-full">
                    <Link to="/signup?role=student">
                      Create Quilter Account
                    </Link>
                  </Button>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 sm:p-6 space-y-3">
                  <h3 className="font-semibold text-lg">Instructor / Host</h3>
                  <p className="text-sm text-muted-foreground">
                    Create retreat and class listings, manage registrations, and get paid for your events.
                  </p>
                  <Button asChild variant="outline" className="w-full">
                    <Link to="/signup?role=instructor">
                      Create Instructor/Host Account
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
            
            {/* Desktop: Table Layout */}
            <div className="hidden md:block">
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto max-w-full">
                    <table className="w-full min-w-0">
                      <thead>
                        <tr className="border-b bg-muted">
                          <th className="text-left p-4 font-semibold">Role</th>
                          <th className="text-left p-4 font-semibold">What you can do on BookMyQuiltRetreat.com</th>
                          <th className="text-left p-4 font-semibold">Primary action on this page</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="p-4 font-medium">Quilter / Student</td>
                          <td className="p-4 text-muted-foreground">
                            Discover retreats, view details, register, and pay online.
                          </td>
                          <td className="p-4">
                            <Button asChild variant="outline" size="sm">
                              <Link to="/signup?role=student">
                                Create Quilter Account
                              </Link>
                            </Button>
                          </td>
                        </tr>
                        <tr>
                          <td className="p-4 font-medium">Instructor / Host</td>
                          <td className="p-4 text-muted-foreground">
                            Create retreat and class listings, manage registrations, and get paid for your events.
                          </td>
                          <td className="p-4">
                            <Button asChild variant="outline" size="sm">
                              <Link to="/signup?role=instructor">
                                Create Instructor/Host Account
                              </Link>
                            </Button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative text-white overflow-hidden min-h-[60vh] sm:min-h-[70vh] flex items-center">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0">
          <img
            src="/woman-s-hand-stitching-fabric-house-with-needle-workplace.jpg"
            alt="Woman stitching fabric"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#459394]/90 via-[#387C7F]/85 to-[#FD8865]/90"></div>
          <div className="absolute inset-0 bg-black/30"></div>
        </div>
        
        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 max-w-3xl mx-auto drop-shadow-lg">
            Ready to stitch your next story into fabric?
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-white/95 mb-8 sm:mb-10 max-w-2xl mx-auto drop-shadow-md">
            Join thousands of quilters discovering amazing retreats and workshops
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
            <Button 
              asChild 
              size="lg" 
              className="bg-white text-primary hover:bg-white/90 hover:text-primary transition-all shadow-xl hover:shadow-2xl min-w-[200px]"
            >
              <Link to="/signup?role=student">
                Get Started as a Quilter
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
            <Button 
              asChild 
              size="lg" 
              className="border-2 border-white bg-white/10 backdrop-blur-sm text-white hover:bg-white hover:text-primary transition-all shadow-xl hover:shadow-2xl min-w-[200px]"
            >
              <Link to="/signup?role=instructor">
                Get Started as an Instructor/Host
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      </main>
      
      <Footer />
    </div>
  );
};

export default Landing;

