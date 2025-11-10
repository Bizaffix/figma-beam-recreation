import { RetreatCard } from "@/components/RetreatCard";
import { BottomNav } from "@/components/BottomNav";
import { Input } from "@/components/ui/input";
import { Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  const retreats = [
    {
      id: 1,
      image: "https://images.unsplash.com/photo-1706614452468-d9d7c5b967b6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxxdWlsdGluZyUyMGZhYnJpYyUyMGNvbG9yZnVsfGVufDF8fHx8MTc2MDM4NTc4NXww&ixlib=rb-4.1.0&q=80&w=1080",
      level: "Intermediate" as const,
      title: "Modern Quilting Techniques",
      instructor: {
        name: "Emma Thompson",
        avatar: "https://images.unsplash.com/photo-1543430720-fa600c67e423?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=100&h=100",
      },
      location: "Burlington, Vermont",
      date: "Nov 5-8, 2025",
      duration: "4 days",
      spotsAvailable: 3,
      totalSpots: 12,
      price: 850,
    },
    {
      id: 2,
      image: "https://images.unsplash.com/photo-1723074832961-397744da2380?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
      level: "Advanced" as const,
      title: "Art Quilt Masterclass",
      instructor: {
        name: "Maria Santos",
        avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=100&h=100",
      },
      location: "Portland, Oregon",
      date: "Dec 12-15, 2025",
      duration: "4 days",
      spotsAvailable: 5,
      totalSpots: 10,
      price: 950,
    },
    {
      id: 3,
      image: "https://images.unsplash.com/photo-1452860606245-08befc0ff44b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
      level: "Beginner" as const,
      title: "Beginner's Quilting Journey",
      instructor: {
        name: "Sarah Johnson",
        avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=100&h=100",
      },
      location: "Austin, Texas",
      date: "Jan 15-18, 2026",
      duration: "4 days",
      spotsAvailable: 8,
      totalSpots: 15,
      price: 750,
    },
  ];

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
        {retreats.map((retreat, index) => (
          <RetreatCard key={index} {...retreat} />
        ))}
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default Index;
