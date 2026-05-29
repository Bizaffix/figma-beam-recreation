import { useState, useEffect, useMemo } from "react";
import { BottomNav } from "@/components/BottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, GraduationCap, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  useGetUserProfileQuery,
  useGetFavoritesQuery,
  useLazyGetRetreatByIdQuery,
} from "@/services/server";
import { mapRetreatForCard } from "@/services/mappers";
import { useToast } from "@/hooks/use-toast";
import { RetreatCard } from "@/components/RetreatCard";

interface SavedRetreat {
  id: number;
  title: string;
  description: string;
  location: string;
  date: string;
  duration: string;
  level: "Beginner" | "Intermediate" | "Advanced" | "Any";
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

const Home = () => {
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const { toast } = useToast();
  const [creatingProfile, setCreatingProfile] = useState(false);
  const [savedRetreats, setSavedRetreats] = useState<SavedRetreat[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(true);

  const { data: profile } = useGetUserProfileQuery(undefined, { skip: !user });
  const { data: favorites = [], isLoading: loadingFavorites } = useGetFavoritesQuery(undefined, {
    skip: !user || role !== "student",
  });
  const [triggerGetRetreat] = useLazyGetRetreatByIdQuery();

  const firstName = useMemo(() => {
    const displayName = profile?.fullName ?? profile?.firstName;
    if (!displayName) return "";
    return displayName.trim().split(" ")[0] || "";
  }, [profile]);

  useEffect(() => {
    if (!user || role !== "student") {
      setSavedRetreats([]);
      setLoadingSaved(false);
      return;
    }
    if (loadingFavorites) return;

    let cancelled = false;

    const loadSavedRetreats = async () => {
      if (favorites.length === 0) {
        if (!cancelled) {
          setSavedRetreats([]);
          setLoadingSaved(false);
        }
        return;
      }

      try {
        const retreats = await Promise.all(
          favorites.map(async (favorite) => {
            if (favorite.retreat) {
              return mapRetreatForCard(favorite.retreat as Record<string, unknown>);
            }
            if (!favorite.retreatId) return null;
            try {
              const retreat = await triggerGetRetreat(favorite.retreatId).unwrap();
              if (!retreat || (retreat.status !== "published" && !retreat.published)) {
                return null;
              }
              return mapRetreatForCard(retreat);
            } catch {
              return null;
            }
          }),
        );

        if (!cancelled) {
          setSavedRetreats(
            retreats.filter((retreat) => retreat !== null && retreat.published) as SavedRetreat[],
          );
        }
      } catch (error) {
        console.error("Unexpected error fetching saved retreats:", error);
      } finally {
        if (!cancelled) {
          setLoadingSaved(false);
        }
      }
    };

    setLoadingSaved(true);
    loadSavedRetreats();

    return () => {
      cancelled = true;
    };
  }, [user, role, favorites, loadingFavorites, triggerGetRetreat]);

  const handleCreateInstructorProfile = async () => {
    if (!user) return;

    setCreatingProfile(true);
    try {
      toast({
        title: "Admin approval required",
        description:
          "Instructor profiles require admin approval. We'll notify you once your account is upgraded.",
      });
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setCreatingProfile(false);
    }
  };

  // This page is now student-only, so it will only be accessible to students
  return (
    <div className="min-h-screen bg-gradient-hero pb-20">
      {/* Header */}
      <div className="bg-gradient-primary text-white px-6 py-8">
        <h1 className="text-3xl font-bold mb-2">
          {firstName ? `Welcome ${firstName}!` : "Welcome Back!"}
        </h1>
        <p className="text-white/90 text-lg">Ready to continue your quilting journey?</p>
      </div>

      {/* Content */}
      <div className="px-6 -mt-4 max-w-4xl mx-auto space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Heart className="w-8 h-8 text-primary mx-auto mb-2 fill-primary" />
              <p className="text-2xl font-bold text-card-foreground">{savedRetreats.length}</p>
              <p className="text-sm text-muted-foreground">Saved</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Calendar className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold text-card-foreground">0</p>
              <p className="text-sm text-muted-foreground">Upcoming</p>
            </CardContent>
          </Card>
        </div>

        {/* Saved Retreats */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Heart className="w-5 h-5 text-primary fill-primary" />
              <h3 className="text-xl font-semibold text-card-foreground">Saved Retreats</h3>
            </div>
            
            {loadingSaved ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading saved retreats...</p>
              </div>
            ) : savedRetreats.length > 0 ? (
              <div className="space-y-4">
                {savedRetreats.map((retreat) => (
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
                ))}
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate('/browse')}
                >
                  Browse More Retreats
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground mb-2">No saved retreats yet</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Save retreats you're interested in by clicking the heart icon
                </p>
                <Button onClick={() => navigate('/browse')}>
                  Browse Retreats
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create Instructor Profile - Only show for students, hide when Organizer is active */}
        {role === 'student' && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <GraduationCap className="w-6 h-6 text-primary" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-card-foreground">Want to teach a class?</h3>
                  <p className="text-sm text-muted-foreground">Share your quilting expertise with others</p>
                </div>
              </div>
              <Button 
                className="w-full" 
                onClick={handleCreateInstructorProfile}
                disabled={creatingProfile}
              >
                {creatingProfile ? "Creating Profile..." : "Create Instructor Profile"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default Home;
