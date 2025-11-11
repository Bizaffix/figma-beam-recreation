import { useState } from "react";
import { RetreatCard } from "@/components/RetreatCard";
import { BottomNav } from "@/components/BottomNav";
import { Input } from "@/components/ui/input";
import { Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { retreats } from "@/data/retreats";

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter retreats based on search query
  const filteredRetreats = retreats.filter((retreat) => {
    const query = searchQuery.toLowerCase();
    return (
      retreat.title.toLowerCase().includes(query) ||
      retreat.location.toLowerCase().includes(query) ||
      retreat.instructor.name.toLowerCase().includes(query)
    );
  });

  return (
    <div className="min-h-screen bg-gradient-hero pb-20">
      {/* Hero Section */}
      <div className="bg-gradient-primary text-white px-6 py-8">
        <h1 className="text-3xl font-bold mb-2">Quilting Retreats</h1>
        <p className="text-white/90 text-lg">Discover, Learn, and Connect</p>
      </div>

      {/* Search Bar */}
      <div className="px-6 -mt-4 mb-6">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search retreats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card shadow-md h-12"
            />
          </div>
          <Button size="icon" className="h-12 w-12 bg-card text-foreground hover:bg-card/90 shadow-md">
            <SlidersHorizontal className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Retreat Cards */}
      <div className="px-6 space-y-6 max-w-4xl mx-auto">
        {filteredRetreats.length > 0 ? (
          filteredRetreats.map((retreat, index) => (
            <RetreatCard key={index} {...retreat} />
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground text-lg">No retreats found matching "{searchQuery}"</p>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default Index;
