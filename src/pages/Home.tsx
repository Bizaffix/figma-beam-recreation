import { useState, useEffect } from "react";
import { BottomNav } from "@/components/BottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Star, Award, GraduationCap, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { RetreatCard } from "@/components/RetreatCard";

interface SavedRetreat {
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

const Home = () => {
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const { toast } = useToast();
  const [firstName, setFirstName] = useState<string>("");
  const [creatingProfile, setCreatingProfile] = useState(false);
  const [savedRetreats, setSavedRetreats] = useState<SavedRetreat[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(true);

  // Fetch user's first name from profile
  useEffect(() => {
    const fetchFirstName = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching user profile:', error);
        } else if (data?.full_name) {
          // Extract first name from full_name
          const nameParts = data.full_name.trim().split(' ');
          const first = nameParts[0] || "";
          setFirstName(first);
        }
      } catch (error) {
        console.error('Unexpected error fetching profile:', error);
      }
    };

    fetchFirstName();
  }, [user]);

  // Fetch saved retreats
  useEffect(() => {
    const fetchSavedRetreats = async () => {
      if (!user || role !== 'student') {
        setLoadingSaved(false);
        return;
      }

      try {
        // First, get all saved retreat IDs for this user
        const { data: savedData, error: savedError } = await supabase
          .from('saved_retreats')
          .select('retreat_id')
          .eq('user_id', user.id);

        if (savedError) {
          console.error('Error fetching saved retreats:', savedError);
          setLoadingSaved(false);
          return;
        }

        if (!savedData || savedData.length === 0) {
          setSavedRetreats([]);
          setLoadingSaved(false);
          return;
        }

        // Then fetch the actual retreat data
        const retreatIds = savedData.map(item => item.retreat_id);
        const { data: retreatsData, error: retreatsError } = await supabase
          .from('retreats')
          .select(`
            *,
            instructor:profiles!instructor_id(
              full_name,
              avatar_url,
              bio
            )
          `)
          .in('id', retreatIds)
          .eq('published', true)
          .order('created_at', { ascending: false });

        if (retreatsError) {
          console.error('Error fetching retreat details:', retreatsError);
        } else if (retreatsData) {
          const transformedRetreats = retreatsData.map((retreat: any) => ({
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
            },
          }));
          setSavedRetreats(transformedRetreats);
        }
      } catch (error) {
        console.error('Unexpected error fetching saved retreats:', error);
      } finally {
        setLoadingSaved(false);
      }
    };

    fetchSavedRetreats();
  }, [user, role]);

  const handleCreateInstructorProfile = async () => {
    if (!user) return;

    setCreatingProfile(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: 'instructor' })
        .eq('id', user.id);

      if (error) {
        console.error('Error creating instructor profile:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to create instructor profile",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Instructor profile created! Redirecting to instructor dashboard...",
        });
        // Reload the page to update the role in AuthContext
        setTimeout(() => {
          window.location.href = '/instructor/dashboard';
        }, 1500);
      }
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

        {/* Create Instructor Profile - Only show for students */}
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
