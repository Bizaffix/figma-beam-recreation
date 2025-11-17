import { useState, useEffect } from "react";
import { RetreatCard } from "@/components/RetreatCard";
import { BottomNav } from "@/components/BottomNav";
import { Input } from "@/components/ui/input";
import { Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

interface RetreatData {
  id: number;
  title: string;
  description: string;
  location: string;
  date: string;
  duration: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  price: number;
  total_spots: number;
  spots_available: number;
  image: string;
  includes: string[];
  schedule: { day: string; activities: string }[];
  published: boolean;
  instructor_id: string;
  instructor: {
    name: string;
    avatar: string;
    bio: string;
  };
}

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [retreats, setRetreats] = useState<RetreatData[]>([]);
  const [loading, setLoading] = useState(true);
  const { role } = useAuth();
  
  // Fetch published retreats from Supabase
  useEffect(() => {
    const fetchRetreats = async () => {
      try {
        // Fetch published retreats with instructor info
        const { data, error } = await supabase
          .from('retreats')
          .select(`
            *,
            instructor:profiles!instructor_id(
              full_name,
              avatar_url,
              bio,
              facebook_url,
              instagram_url,
              pinterest_url
            )
          `)
          .eq('published', true)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching retreats:', error);
        } else if (data) {
          // Transform data to match component expectations
          const transformedRetreats = data.map((retreat: any) => ({
            id: retreat.id,
            title: retreat.title,
            description: retreat.description,
            location: retreat.location,
            date: retreat.date,
            duration: retreat.duration,
            level: retreat.level,
            price: retreat.price,
            total_spots: retreat.total_spots,
            spots_available: retreat.spots_available,
            image: retreat.image,
            includes: retreat.includes || [],
            schedule: retreat.schedule || [],
            published: retreat.published,
            instructor_id: retreat.instructor_id,
            instructor: {
              name: retreat.instructor?.full_name || 'Instructor',
              avatar: retreat.instructor?.avatar_url || '',
              bio: retreat.instructor?.bio || '',
              facebook: retreat.instructor?.facebook_url || '',
              instagram: retreat.instructor?.instagram_url || '',
              pinterest: retreat.instructor?.pinterest_url || '',
            },
          }));
          setRetreats(transformedRetreats);
        }
      } catch (error) {
        console.error('Unexpected error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRetreats();
  }, []);

  // Filter retreats by search query
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
        {loading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground text-lg">Loading retreats...</p>
          </div>
        ) : filteredRetreats.length > 0 ? (
          filteredRetreats.map((retreat) => (
            <RetreatCard
              key={retreat.id}
              id={retreat.id}
              image={retreat.image || "/placeholder.svg"}
              level={retreat.level}
              title={retreat.title}
              instructor={{
                name: retreat.instructor.name,
                avatar: retreat.instructor.avatar,
              }}
              location={retreat.location}
              date={retreat.date}
              duration={retreat.duration}
              spotsAvailable={retreat.spots_available}
              totalSpots={retreat.total_spots}
              price={retreat.price}
            />
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground text-lg">
              {searchQuery ? `No retreats found matching "${searchQuery}"` : "No published retreats available"}
            </p>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default Index;
