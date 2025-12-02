import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Shield, FileText, Calendar, Mail, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const PrivacyPolicy = () => {
  const currentDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const sections = [
    { id: 1, title: "Introduction" },
    { id: 2, title: "Information We Collect" },
    { id: 3, title: "How We Use Your Information" },
    { id: 4, title: "Cookies and Similar Technologies" },
    { id: 5, title: "How We Share Information" },
    { id: 6, title: "Data Security" },
    { id: 7, title: "Data Retention" },
    { id: 8, title: "Your Rights and Choices" },
    { id: 9, title: "Children's Privacy" },
    { id: 10, title: "Links to Other Websites" },
    { id: 11, title: "Utah Law and Other Jurisdictions" },
    { id: 12, title: "Changes to This Privacy Policy" },
    { id: 13, title: "Contact Us" },
  ];

  const scrollToSection = (id: number) => {
    const element = document.getElementById(`section-${id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted/20">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <div className="relative bg-gradient-primary text-white overflow-hidden">
          {/* Background Image with Overlay */}
          <div className="absolute inset-0">
            <img
              src="/young-seamstress-with-dark-curly-hair-colorful-shirt-thoughtfully-using-sewing-machine-modern-sewing-workshop.jpg"
              alt="Sewing workshop"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary/80 to-accent/90"></div>
            <div className="absolute inset-0 bg-black/20"></div>
          </div>
          
          {/* Content */}
          <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-white/20 backdrop-blur-sm rounded-2xl mb-6 sm:mb-8 shadow-lg">
                <Shield className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 sm:mb-6 drop-shadow-lg">
                Privacy Policy
              </h1>
              <p className="text-lg sm:text-xl md:text-2xl text-white/95 mb-6 sm:mb-8 font-medium drop-shadow-md">
                BookMyQuiltRetreat – Nakama Properties, LLC
              </p>
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 sm:px-6 py-2 sm:py-3 rounded-full shadow-lg border border-white/20">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-sm sm:text-base font-medium">
                  Last Updated: {currentDate}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16">
          <div className="max-w-5xl mx-auto">
            {/* Table of Contents */}
            <Card className="mb-8 sm:mb-12 border-2 shadow-lg">
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground">Table of Contents</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  {sections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => scrollToSection(section.id)}
                      className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg hover:bg-muted/50 transition-all duration-200 text-left group"
                    >
                      <span className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-primary/10 text-primary font-semibold text-xs sm:text-sm flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                        {section.id}
                      </span>
                      <span className="text-sm sm:text-base text-muted-foreground group-hover:text-foreground transition-colors flex-1">
                        {section.title}
                      </span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors opacity-0 group-hover:opacity-100" />
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Section 1 */}
            <section id="section-1" className="mb-10 sm:mb-12 md:mb-16 scroll-mt-20">
              <Card className="border-2 shadow-md hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6 sm:p-8 md:p-10">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-primary text-white font-bold text-lg sm:text-xl flex items-center justify-center shadow-lg">
                      1
                    </div>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground pt-1 sm:pt-2">
                      Introduction
                    </h2>
                  </div>
                  <div className="space-y-4 sm:space-y-5">
                    <p className="text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed">
                      This Privacy Policy explains how Nakama Properties, LLC ("Nakama Properties," "we," "us," or "our"), a Utah limited liability company and owner/operator of the BookMyQuiltRetreat website and platform (the "Platform"), collects, uses, shares, and protects information when you visit our website, browse pages, or use our services.
                    </p>
                    <p className="text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed">
                      By accessing or using our website or Platform, you acknowledge that you have read this Privacy Policy and agree to its terms.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Section 2 */}
            <section id="section-2" className="mb-10 sm:mb-12 md:mb-16 scroll-mt-20">
              <Card className="border-2 shadow-md hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6 sm:p-8 md:p-10">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-primary text-white font-bold text-lg sm:text-xl flex items-center justify-center shadow-lg">
                      2
                    </div>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground pt-1 sm:pt-2">
                      Information We Collect
                    </h2>
                  </div>
                  <p className="text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed mb-6">
                    We may collect the following types of information from visitors and users of our website and Platform:
                  </p>
                  <div className="space-y-4">
                    <div className="flex gap-4 p-4 sm:p-5 rounded-lg bg-muted/30 border-l-4 border-primary">
                      <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-2"></div>
                      <div>
                        <strong className="text-foreground text-base sm:text-lg">Contact information:</strong>
                        <span className="text-muted-foreground text-base sm:text-lg"> such as your name, email address, phone number, and mailing address when you sign up for an account, newsletter, or contact us.</span>
                      </div>
                    </div>
                    <div className="flex gap-4 p-4 sm:p-5 rounded-lg bg-muted/30 border-l-4 border-primary">
                      <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-2"></div>
                      <div>
                        <strong className="text-foreground text-base sm:text-lg">Account and profile information:</strong>
                        <span className="text-muted-foreground text-base sm:text-lg"> such as your login credentials, profile photo, biography, and business details if you create an instructor or participant account.</span>
                      </div>
                    </div>
                    <div className="flex gap-4 p-4 sm:p-5 rounded-lg bg-muted/30 border-l-4 border-primary">
                      <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-2"></div>
                      <div>
                        <strong className="text-foreground text-base sm:text-lg">Booking and transaction information:</strong>
                        <span className="text-muted-foreground text-base sm:text-lg"> such as events you view or book, dates, prices, and limited payment-related details processed via our payment partners (for example, tokens or partial card information, not full card numbers).</span>
                      </div>
                    </div>
                    <div className="flex gap-4 p-4 sm:p-5 rounded-lg bg-muted/30 border-l-4 border-primary">
                      <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-2"></div>
                      <div>
                        <strong className="text-foreground text-base sm:text-lg">Usage and technical data:</strong>
                        <span className="text-muted-foreground text-base sm:text-lg"> such as IP address, browser type, device type, operating system, pages you visit, time and date of visits, and referring URLs.</span>
                      </div>
                    </div>
                    <div className="flex gap-4 p-4 sm:p-5 rounded-lg bg-muted/30 border-l-4 border-primary">
                      <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-2"></div>
                      <div>
                        <strong className="text-foreground text-base sm:text-lg">Cookies and tracking technologies:</strong>
                        <span className="text-muted-foreground text-base sm:text-lg"> data collected through cookies, pixels, and similar tools to support core site functions, analytics, and, where enabled, marketing.</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Section 3 */}
            <section id="section-3" className="mb-10 sm:mb-12 md:mb-16 scroll-mt-20">
              <Card className="border-2 shadow-md hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6 sm:p-8 md:p-10">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-primary text-white font-bold text-lg sm:text-xl flex items-center justify-center shadow-lg">
                      3
                    </div>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground pt-1 sm:pt-2">
                      How We Use Your Information
                    </h2>
                  </div>
                  <p className="text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed mb-6">
                    We use the information we collect for purposes including:
                  </p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {[
                      "Providing and operating the website and Platform, including account management, event listings, bookings, payments, and payouts.",
                      "Communicating with you about your account, bookings, support requests, updates, and important notices about our services or policies.",
                      "Personalizing and improving the website and Platform, such as understanding how visitors use our site, testing features, and enhancing user experience.",
                      "Maintaining the security of the website and Platform, preventing fraud or abuse, and enforcing our Terms of Service and other policies.",
                      "Complying with applicable laws, regulations, and legal processes.",
                      "Sending you marketing or promotional communications about events or features, if permitted by law and subject to your communication preferences and opt-out choices."
                    ].map((item, index) => (
                      <div key={index} className="flex gap-3 p-4 rounded-lg bg-muted/30 border border-border/50">
                        <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-primary mt-2"></div>
                        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{item}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Section 4 */}
            <section id="section-4" className="mb-10 sm:mb-12 md:mb-16 scroll-mt-20">
              <Card className="border-2 shadow-md hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6 sm:p-8 md:p-10">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-primary text-white font-bold text-lg sm:text-xl flex items-center justify-center shadow-lg">
                      4
                    </div>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground pt-1 sm:pt-2">
                      Cookies and Similar Technologies
                    </h2>
                  </div>
                  <p className="text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed mb-6">
                    We use cookies and similar technologies to help our website function properly and to understand how it is used.
                  </p>
                  <div className="space-y-4 mb-6">
                    <div className="p-4 sm:p-5 rounded-lg bg-primary/5 border-l-4 border-primary">
                      <strong className="text-foreground text-base sm:text-lg block mb-2">Essential cookies:</strong>
                      <p className="text-muted-foreground text-sm sm:text-base">needed for basic site features such as secure login and page navigation.</p>
                    </div>
                    <div className="p-4 sm:p-5 rounded-lg bg-primary/5 border-l-4 border-primary">
                      <strong className="text-foreground text-base sm:text-lg block mb-2">Analytics cookies:</strong>
                      <p className="text-muted-foreground text-sm sm:text-base">help us understand how visitors use our website so we can improve content and performance.</p>
                    </div>
                    <div className="p-4 sm:p-5 rounded-lg bg-primary/5 border-l-4 border-primary">
                      <strong className="text-foreground text-base sm:text-lg block mb-2">Preference cookies:</strong>
                      <p className="text-muted-foreground text-sm sm:text-base">remember your choices (such as language or region).</p>
                    </div>
                  </div>
                  <div className="p-4 sm:p-5 rounded-lg bg-muted/30 border border-border/50">
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                      Most web browsers allow you to control cookies through their settings. If you disable cookies, some features of our website or Platform may not function as intended.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Section 5 */}
            <section id="section-5" className="mb-10 sm:mb-12 md:mb-16 scroll-mt-20">
              <Card className="border-2 shadow-md hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6 sm:p-8 md:p-10">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-primary text-white font-bold text-lg sm:text-xl flex items-center justify-center shadow-lg">
                      5
                    </div>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground pt-1 sm:pt-2">
                      How We Share Information
                    </h2>
                  </div>
                  <div className="p-4 sm:p-5 rounded-lg bg-green-500/10 border-l-4 border-green-500 mb-6">
                    <p className="text-base sm:text-lg font-semibold text-foreground">
                      We do not sell your personal information in exchange for money.
                    </p>
                  </div>
                  <p className="text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed mb-6">
                    We may share information in the following limited ways:
                  </p>
                  <div className="space-y-4 mb-6">
                    {[
                      { title: "Service providers:", desc: "with trusted third-party vendors who perform services on our behalf, such as website hosting, payment processing, analytics, email delivery, and customer support." },
                      { title: "Other users:", desc: "where necessary to facilitate bookings (for example, sharing relevant contact and event information between instructors and participants)." },
                      { title: "Business and legal purposes:", desc: "with professional advisors (such as lawyers and accountants) and with authorities where required by law, regulation, court order, or to protect our rights, users, or the Platform." },
                      { title: "Business transfers:", desc: "in connection with a merger, acquisition, financing, or sale of all or part of our business, in which case your information may be transferred as part of that transaction." }
                    ].map((item, index) => (
                      <div key={index} className="flex gap-4 p-4 sm:p-5 rounded-lg bg-muted/30 border-l-4 border-primary">
                        <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-2"></div>
                        <div>
                          <strong className="text-foreground text-base sm:text-lg">{item.title}</strong>
                          <span className="text-muted-foreground text-sm sm:text-base"> {item.desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 sm:p-5 rounded-lg bg-muted/30 border border-border/50">
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                      Any third parties that receive personal information are expected to use it only for the services they provide to us and to protect it consistent with applicable law and this Policy.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Section 6 */}
            <section id="section-6" className="mb-10 sm:mb-12 md:mb-16 scroll-mt-20">
              <Card className="border-2 shadow-md hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6 sm:p-8 md:p-10">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-primary text-white font-bold text-lg sm:text-xl flex items-center justify-center shadow-lg">
                      6
                    </div>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground pt-1 sm:pt-2">
                      Data Security
                    </h2>
                  </div>
                  <div className="space-y-4">
                    <p className="text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed">
                      We use reasonable physical, technical, and organizational safeguards designed to protect personal information from unauthorized access, disclosure, alteration, or destruction.
                    </p>
                    <div className="p-4 sm:p-5 rounded-lg bg-amber-500/10 border-l-4 border-amber-500">
                      <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                        No method of transmission or storage is completely secure, so while we work to protect your information, we cannot guarantee absolute security.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Section 7 */}
            <section id="section-7" className="mb-10 sm:mb-12 md:mb-16 scroll-mt-20">
              <Card className="border-2 shadow-md hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6 sm:p-8 md:p-10">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-primary text-white font-bold text-lg sm:text-xl flex items-center justify-center shadow-lg">
                      7
                    </div>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground pt-1 sm:pt-2">
                      Data Retention
                    </h2>
                  </div>
                  <p className="text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed mb-6">
                    We retain personal information only for as long as reasonably necessary to fulfill the purposes described in this Privacy Policy, including:
                  </p>
                  <div className="space-y-3 mb-6">
                    {[
                      "While your account is active.",
                      "As needed to provide our services, manage bookings, handle disputes, and enforce our agreements.",
                      "As required by applicable laws and regulations, including Utah and U.S. record-keeping requirements."
                    ].map((item, index) => (
                      <div key={index} className="flex gap-3 p-3 sm:p-4 rounded-lg bg-muted/30">
                        <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-primary mt-2"></div>
                        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{item}</p>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 sm:p-5 rounded-lg bg-muted/30 border border-border/50">
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                      When information is no longer needed, we may delete it or de-identify it in accordance with our data retention practices.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Section 8 */}
            <section id="section-8" className="mb-10 sm:mb-12 md:mb-16 scroll-mt-20">
              <Card className="border-2 shadow-md hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6 sm:p-8 md:p-10">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-primary text-white font-bold text-lg sm:text-xl flex items-center justify-center shadow-lg">
                      8
                    </div>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground pt-1 sm:pt-2">
                      Your Rights and Choices
                    </h2>
                  </div>
                  <p className="text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed mb-6">
                    Depending on your location and applicable law, you may have certain rights regarding your personal information, such as:
                  </p>
                  <div className="grid sm:grid-cols-2 gap-4 mb-6">
                    {[
                      { title: "Access", desc: "request information about the personal data we hold about you." },
                      { title: "Correction", desc: "request that we correct or update inaccurate or incomplete information." },
                      { title: "Deletion", desc: "request that we delete certain personal information, subject to legal or legitimate business needs." },
                      { title: "Objection or restriction", desc: "ask us to limit or stop certain uses of your information." }
                    ].map((item, index) => (
                      <div key={index} className="p-4 sm:p-5 rounded-lg bg-primary/5 border border-primary/20">
                        <strong className="text-foreground text-base sm:text-lg block mb-2">{item.title}:</strong>
                        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 sm:p-5 rounded-lg bg-muted/30 border border-border/50 mb-6">
                    <p className="text-base sm:text-lg font-semibold text-foreground mb-3">You can also:</p>
                    <div className="space-y-2">
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-primary mt-2"></div>
                        <p className="text-sm sm:text-base text-muted-foreground">Manage email preferences by using the "unsubscribe" link in marketing emails or contacting us.</p>
                      </div>
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-primary mt-2"></div>
                        <p className="text-sm sm:text-base text-muted-foreground">Adjust cookie settings through your browser or device and, where available, our cookie notice.</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 sm:p-5 rounded-lg bg-primary/5 border-l-4 border-primary">
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                      To exercise your rights or ask questions, please contact us using the details in the "Contact Us" section below. We may need to verify your identity before responding.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Section 9 */}
            <section id="section-9" className="mb-10 sm:mb-12 md:mb-16 scroll-mt-20">
              <Card className="border-2 shadow-md hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6 sm:p-8 md:p-10">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-primary text-white font-bold text-lg sm:text-xl flex items-center justify-center shadow-lg">
                      9
                    </div>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground pt-1 sm:pt-2">
                      Children's Privacy
                    </h2>
                  </div>
                  <div className="space-y-4">
                    <p className="text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed">
                      Our website and Platform are not directed to children under 16 years of age, and we do not knowingly collect personal information from children under 16.
                    </p>
                    <div className="p-4 sm:p-5 rounded-lg bg-muted/30 border border-border/50">
                      <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                        If you believe a child has provided us with personal information in violation of this Policy, please contact us so we can take appropriate steps to remove that information where required.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Section 10 */}
            <section id="section-10" className="mb-10 sm:mb-12 md:mb-16 scroll-mt-20">
              <Card className="border-2 shadow-md hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6 sm:p-8 md:p-10">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-primary text-white font-bold text-lg sm:text-xl flex items-center justify-center shadow-lg">
                      10
                    </div>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground pt-1 sm:pt-2">
                      Links to Other Websites
                    </h2>
                  </div>
                  <div className="space-y-4">
                    <p className="text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed">
                      Our website may contain links to third-party websites or services that we do not own or control.
                    </p>
                    <div className="p-4 sm:p-5 rounded-lg bg-amber-500/10 border-l-4 border-amber-500">
                      <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                        We are not responsible for the privacy practices of third-party sites. We encourage you to review their privacy policies before providing any information.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Section 11 */}
            <section id="section-11" className="mb-10 sm:mb-12 md:mb-16 scroll-mt-20">
              <Card className="border-2 shadow-md hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6 sm:p-8 md:p-10">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-primary text-white font-bold text-lg sm:text-xl flex items-center justify-center shadow-lg">
                      11
                    </div>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground pt-1 sm:pt-2">
                      Utah Law and Other Jurisdictions
                    </h2>
                  </div>
                  <div className="space-y-4">
                    <p className="text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed">
                      Nakama Properties, LLC is based in Utah, and this Privacy Policy is governed by the laws of the State of Utah and applicable federal law.
                    </p>
                    <div className="p-4 sm:p-5 rounded-lg bg-muted/30 border border-border/50">
                      <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                        If you access our website from outside the United States, you understand that your information may be transferred to and processed in the United States, which may have different data protection rules than your country. Where applicable law requires, we will use appropriate safeguards for such transfers.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Section 12 */}
            <section id="section-12" className="mb-10 sm:mb-12 md:mb-16 scroll-mt-20">
              <Card className="border-2 shadow-md hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6 sm:p-8 md:p-10">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-primary text-white font-bold text-lg sm:text-xl flex items-center justify-center shadow-lg">
                      12
                    </div>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground pt-1 sm:pt-2">
                      Changes to This Privacy Policy
                    </h2>
                  </div>
                  <div className="space-y-4">
                    <p className="text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed">
                      We may update this Privacy Policy from time to time to reflect changes in our practices, technology, or legal requirements.
                    </p>
                    <div className="p-4 sm:p-5 rounded-lg bg-primary/5 border-l-4 border-primary">
                      <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                        When we make significant changes, we will update the "Last Updated" date at the top of this page and may provide additional notice (for example, on our home page or via email). Your continued use of the website or Platform after the updated Policy becomes effective means you accept the changes.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Section 13 */}
            <section id="section-13" className="mb-10 sm:mb-12 md:mb-16 scroll-mt-20">
              <Card className="border-2 shadow-md hover:shadow-lg transition-shadow duration-300 bg-gradient-to-br from-primary/5 to-accent/5">
                <CardContent className="p-6 sm:p-8 md:p-10">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-primary text-white font-bold text-lg sm:text-xl flex items-center justify-center shadow-lg">
                      13
                    </div>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground pt-1 sm:pt-2">
                      Contact Us
                    </h2>
                  </div>
                  <p className="text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed mb-6">
                    If you have questions, concerns, or requests related to this Privacy Policy or our data practices, you can contact us at:
                  </p>
                  <div className="bg-card border-2 border-primary/20 p-6 sm:p-8 rounded-xl shadow-lg space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-primary flex items-center justify-center">
                        <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">Nakama Properties, LLC</p>
                        <p className="text-sm sm:text-base text-muted-foreground">Attn: Privacy</p>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-border">
                      <a 
                        href="mailto:notifications@bookmyquiltretreat.com" 
                        className="inline-flex items-center gap-2 text-base sm:text-lg font-semibold text-primary hover:text-primary/80 transition-colors"
                      >
                        <Mail className="w-5 h-5" />
                        notifications@bookmyquiltretreat.com
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;

