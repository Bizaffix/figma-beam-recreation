import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BrowseSection } from "@/components/BrowseSection";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col overflow-x-hidden">
      <Header />
      
      <main className="flex-1 w-full overflow-x-hidden">
        {/* Browse Section - Airbnb Style */}
        <BrowseSection />

      </main>
      
      <Footer />
    </div>
  );
};

export default Landing;
