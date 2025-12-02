import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
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
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1">
      {/* Hero Section */}
      <section id="hero" className="relative bg-gradient-primary text-white overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-12 lg:py-16">
          <div className="grid md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 items-center">
            <div className="space-y-3 sm:space-y-4 lg:space-y-5 order-2 md:order-1">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight tracking-tight">
                Book Your Next Quilt Retreat, Anywhere Inspiration Strikes
              </h1>
              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white/90 leading-relaxed max-w-2xl">
                Cozy cabins, bustling studios, seaside inns, and hometown guild halls—BookMyQuiltRetreat.com connects passionate instructors with eager quilters for unforgettable, fully coordinated retreats and classes.
              </p>
              
              {/* Key Bullets */}
              <ul className="space-y-2 sm:space-y-2.5 text-white/90">
                <li className="flex items-start gap-2 sm:gap-2.5">
                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 mt-0.5 flex-shrink-0 text-white" />
                  <span className="text-xs sm:text-sm md:text-base leading-relaxed">Discover quilt retreats and classes across the country by date, location, theme, or skill level.</span>
                </li>
                <li className="flex items-start gap-2 sm:gap-2.5">
                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 mt-0.5 flex-shrink-0 text-white" />
                  <span className="text-xs sm:text-sm md:text-base leading-relaxed">Host your own retreat or workshop and let students handle their own bookings and payments.</span>
                </li>
                <li className="flex items-start gap-2 sm:gap-2.5">
                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 mt-0.5 flex-shrink-0 text-white" />
                  <span className="text-xs sm:text-sm md:text-base leading-relaxed">Offer or enjoy optional local food catering so no one has to worry about meals.</span>
                </li>
              </ul>

              {/* Primary CTA Buttons */}
              <div className="flex flex-col gap-2.5 sm:gap-3 pt-2 sm:pt-3">
                <Button 
                  asChild 
                  size="default" 
                  className="bg-white text-primary hover:bg-white/90 hover:text-primary transition-all text-xs sm:text-sm md:text-base h-10 sm:h-11 w-full sm:w-auto"
                >
                  <Link to="/signup?role=student">
                    I'm a Quilter – Find a Retreat
                    <ArrowRight className="ml-2 w-3 h-3 sm:w-4 sm:h-4" />
                  </Link>
                </Button>
                <Button 
                  asChild 
                  size="default" 
                  className="border-2 border-white bg-transparent text-white hover:bg-white hover:text-primary transition-all text-xs sm:text-sm md:text-base h-10 sm:h-11 w-full sm:w-auto"
                >
                  <Link to="/signup?role=instructor">
                    I'm an Instructor/Host – List My Retreat
                    <ArrowRight className="ml-2 w-3 h-3 sm:w-4 sm:h-4" />
                  </Link>
                </Button>
              </div>
            </div>
            
            {/* Hero Image */}
            <div className="relative order-1 md:order-2">
              <div className="relative rounded-lg sm:rounded-xl shadow-2xl overflow-hidden">
                <img 
                  src="/Image1.jpg" 
                  alt="Quilt retreat" 
                  className="w-full h-auto object-cover max-h-[250px] sm:max-h-[350px] md:max-h-[400px] lg:max-h-[500px]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Role Selection Section */}
      <section className="py-10 sm:py-12 md:py-16 lg:py-20 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-10 md:mb-12 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">Choose Your Path</h2>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
              Select the option that best describes you and start your quilting journey today
            </p>
          </div>
          
          {/* Image at top of section */}
          <div className="mb-8 sm:mb-10 md:mb-12 lg:mb-16 max-w-4xl mx-auto">
            <div className="relative group overflow-hidden rounded-xl md:rounded-2xl shadow-xl md:shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent z-10"></div>
              <img 
                src="/Image2.jpg" 
                alt="Quilt retreat experience" 
                className="w-full h-48 sm:h-64 md:h-80 lg:h-96 object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 max-w-5xl mx-auto">
            {/* Quilter Card */}
            <Card className="border-2 hover:border-primary transition-all duration-300 hover:shadow-lg">
              <CardContent className="p-6 sm:p-8 lg:p-10 text-center space-y-3 sm:space-y-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <Heart className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold">For Quilters & Students</h3>
                <p className="text-lg text-muted-foreground italic">
                  "I want to attend retreats and classes"
                </p>
                <p className="text-muted-foreground">
                  I'm looking for inspiration, community, and uninterrupted sewing time
                </p>
                <Button asChild size="lg" className="w-full mt-6">
                  <Link to="/signup?role=student">
                    Create Quilter Account
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Instructor Card */}
            <Card className="border-2 hover:border-primary transition-all duration-300 hover:shadow-lg">
              <CardContent className="p-6 sm:p-8 lg:p-10 text-center space-y-3 sm:space-y-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <GraduationCap className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold">For Instructors & Hosts</h3>
                <p className="text-lg text-muted-foreground italic">
                  "I teach, organize, or host quilting retreats and workshops"
                </p>
                <p className="text-muted-foreground">
                  I need an easier way to fill seats and manage registrations
                </p>
                <Button asChild size="lg" className="w-full mt-6">
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
      <section id="how-it-works" className="py-10 sm:py-12 md:py-16 lg:py-20 scroll-mt-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-10 md:mb-12 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">How BookMyQuiltRetreat Works</h2>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
              Simple steps to connect quilters with amazing retreat experiences
            </p>
          </div>
          
          {/* Image at top of section */}
          <div className="mb-8 sm:mb-10 md:mb-12 lg:mb-16 max-w-4xl mx-auto">
            <div className="relative group overflow-hidden rounded-xl md:rounded-2xl shadow-xl md:shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent z-10"></div>
              <img 
                src="/Image3.jpg" 
                alt="Quilting workshop" 
                className="w-full h-48 sm:h-64 md:h-80 lg:h-96 object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 sm:gap-10 md:gap-12 max-w-6xl mx-auto">
            {/* For Quilters */}
            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold">For Quilters (Students)</h3>
              </div>
              
              <div className="space-y-3 sm:space-y-4">
                <div className="flex gap-3 sm:gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm sm:text-base font-bold">1</div>
                  </div>
                  <div>
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                      Browse retreats and classes by date, location, instructor, or technique—think applique, improv, modern, longarm, and more.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3 sm:gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm sm:text-base font-bold">2</div>
                  </div>
                  <div>
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                      View full details: schedule, supply list, lodging notes, pricing, and available catering options.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3 sm:gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm sm:text-base font-bold">3</div>
                  </div>
                  <div>
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                      Secure your spot and pay online; receive instant confirmation and retreat updates in your inbox.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* For Instructors */}
            <div className="space-y-4 sm:space-y-6">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold">For Instructors/Hosts</h3>
              </div>
              
              <div className="space-y-3 sm:space-y-4">
                <div className="flex gap-3 sm:gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm sm:text-base font-bold">1</div>
                  </div>
                  <div>
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                      Create your retreat or class: set dates, location (any venue you've coordinated), theme, skill level, and capacity.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3 sm:gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm sm:text-base font-bold">2</div>
                  </div>
                  <div>
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                      Add pricing, policies, and optional catering details so guests know exactly what to expect.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3 sm:gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm sm:text-base font-bold">3</div>
                  </div>
                  <div>
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                      Publish your listing, share your link, and let quilters register and pay directly through the platform.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust and Features Section */}
      <section className="py-10 sm:py-12 md:py-16 lg:py-20 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Image at top of section */}
          <div className="mb-8 sm:mb-10 md:mb-12 lg:mb-16 max-w-4xl mx-auto">
            <div className="relative group overflow-hidden rounded-xl md:rounded-2xl shadow-xl md:shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent z-10"></div>
              <img 
                src="/Image4.jpg" 
                alt="Quilt community" 
                className="w-full h-48 sm:h-64 md:h-80 lg:h-96 object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 sm:gap-10 md:gap-12 lg:gap-16 max-w-6xl mx-auto">
            {/* Why Quilters Love It */}
            <div className="space-y-4 sm:space-y-6">
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold">Why Quilters Love It</h3>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex gap-3 sm:gap-4">
                  <Search className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0 mt-0.5 sm:mt-1" />
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    Central place to discover retreats instead of piecing together posts from social media and guild boards.
                  </p>
                </div>
                <div className="flex gap-4">
                  <CreditCard className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <p className="text-muted-foreground">
                    Secure payments, clear cancellation policies, and transparent pricing for every event.
                  </p>
                </div>
                <div className="flex gap-4">
                  <UtensilsCrossed className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <p className="text-muted-foreground">
                    Options for local food catering so you can focus on stitching, not logistics.
                  </p>
                </div>
              </div>
            </div>

            {/* Why Instructors Host Here */}
            <div className="space-y-4 sm:space-y-6">
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold">Why Instructors Host Here</h3>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex gap-3 sm:gap-4">
                  <Users className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0 mt-0.5 sm:mt-1" />
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    A dedicated audience of quilters actively looking for classes and retreats.
                  </p>
                </div>
                <div className="flex gap-4">
                  <FileText className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <p className="text-muted-foreground">
                    Built-in registration and payment tools so you can retire your paper forms and spreadsheets.
                  </p>
                </div>
                <div className="flex gap-4">
                  <MapPin className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <p className="text-muted-foreground">
                    Flexible locations: use guild spaces, shops, lodges, churches, or destination venues—wherever your vision lives.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Table Section */}
      <section className="py-10 sm:py-12 md:py-16 lg:py-20 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-10 md:mb-12 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">Who This Platform Is For</h2>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
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
            <div className="hidden md:block overflow-x-auto">
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
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
      <section className="py-10 sm:py-12 md:py-16 lg:py-24 bg-gradient-primary text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 max-w-3xl mx-auto px-2">
            Ready to stitch your next story into fabric?
          </h2>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white/90 mb-6 sm:mb-8 max-w-2xl mx-auto px-2">
            Join thousands of quilters discovering amazing retreats and workshops
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mt-6 sm:mt-8">
            <Button 
              asChild 
              size="lg" 
              className="bg-white text-primary hover:bg-white/90 hover:text-primary transition-all"
            >
              <Link to="/signup?role=student">
                Get Started as a Quilter
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
            <Button 
              asChild 
              size="lg" 
              className="border-2 border-white bg-transparent text-white hover:bg-white hover:text-primary transition-all"
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

