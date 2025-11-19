import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, MapPin, Calendar, Users, Clock, Heart } from "lucide-react";
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

const RetreatDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role, user } = useAuth();
  const [retreat, setRetreat] = useState<RetreatData | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch retreat from Supabase
  useEffect(() => {
    const fetchRetreat = async () => {
      if (!id) return;

      try {
        let query = supabase
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
          .eq('id', Number(id));

        // Students can only see published retreats
        if (role === 'student') {
          query = query.eq('published', true);
        } else if (role === 'instructor' && user) {
          // Instructors can see their own retreats (published or not)
          query = query.eq('instructor_id', user.id);
        }

        const { data, error } = await query.single();

        if (error) {
          console.error('Error fetching retreat:', error);
        } else if (data) {
          // Transform data to match component expectations
          const transformedRetreat = {
            id: data.id,
            title: data.title,
            description: data.description,
            location: data.location,
            date: data.date,
            duration: data.duration,
            level: data.level,
            price: data.price,
            total_spots: data.total_spots,
            spots_available: data.spots_available,
            image: data.image,
            includes: data.includes || [],
            schedule: data.schedule || [],
            published: data.published,
            instructor_id: data.instructor_id,
            instructor: {
              name: data.instructor?.full_name || 'Instructor',
              avatar: data.instructor?.avatar_url || '',
              bio: data.instructor?.bio || '',
              facebook: data.instructor?.facebook_url || '',
              instagram: data.instructor?.instagram_url || '',
              pinterest: data.instructor?.pinterest_url || '',
            },
          };
          setRetreat(transformedRetreat);
        }
      } catch (error) {
        console.error('Unexpected error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRetreat();
  }, [id, role, user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">Loading retreat details...</p>
        </div>
      </div>
    );
  }

  if (!retreat) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Retreat Not Found</h1>
          <Button onClick={() => navigate("/")}>Back to Retreats</Button>
        </div>
      </div>
    );
  }

  // Students can only view published retreats
  if (role === 'student' && !retreat.published) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Retreat Not Available</h1>
          <p className="text-muted-foreground mb-4">This retreat is not published yet.</p>
          <Button onClick={() => navigate("/")}>Back to Retreats</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero pb-20">
      {/* Header Image */}
      <div className="relative">
        <img
          src={retreat.image || "/placeholder.svg"}
          alt={retreat.title}
          className="w-full h-80 object-cover"
        />
        <Button
          variant="secondary"
          size="icon"
          className="absolute top-4 left-4 rounded-full"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          className="absolute top-4 right-4 rounded-full"
        >
          <Heart className="w-5 h-5" />
        </Button>
      </div>

      {/* Content */}
      <div className="px-4 sm:px-6 -mt-4 max-w-4xl mx-auto space-y-4 sm:space-y-6 pt-4 pb-24 sm:pb-20">
        {/* Main Info Card */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
              <div className="flex-1">
                <Badge className="mb-3 bg-amber-100 text-amber-700 hover:bg-amber-100">
                  {retreat.level}
                </Badge>
                <h1 className="text-2xl sm:text-3xl font-bold text-card-foreground mb-2">
                  {retreat.title}
                </h1>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-2xl sm:text-3xl font-bold text-primary">${retreat.price}</p>
              </div>
            </div>

            {/* Instructor */}
            <div className="flex items-center gap-3 py-4 sm:py-6 border-y border-border">
              <img
                src={retreat.instructor.avatar || "/placeholder.svg"}
                alt={retreat.instructor.name}
                className="w-12 h-12 rounded-full object-cover flex-shrink-0"
              />
              <div className="min-w-0">
                <p className="font-semibold text-card-foreground truncate">{retreat.instructor.name}</p>
                <p className="text-sm text-muted-foreground">Instructor</p>
              </div>
            </div>

            {/* Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div className="flex items-start gap-2 text-muted-foreground">
                <MapPin className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground mb-1">Location</p>
                  <p className="text-sm font-medium text-card-foreground break-words break-all">{retreat.location}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-2 text-muted-foreground">
                <Calendar className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground mb-1">Dates</p>
                  <p className="text-sm font-medium text-card-foreground break-words">{retreat.date}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-2 text-muted-foreground">
                <Clock className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground mb-1">Duration</p>
                  <p className="text-sm font-medium text-card-foreground">{retreat.duration}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-2 text-muted-foreground">
                <Users className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground mb-1">Availability</p>
                  <p className="text-sm font-medium text-card-foreground">
                    {retreat.spots_available} of {retreat.total_spots} spots
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* About */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-card-foreground mb-3">About This Retreat</h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{retreat.description}</p>
          </CardContent>
        </Card>

        {/* What's Included */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-card-foreground mb-3">What's Included</h2>
            <ul className="space-y-2">
              {retreat.includes.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm sm:text-base text-muted-foreground">
                  <span className="text-primary mt-1">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Schedule */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-card-foreground mb-3">Schedule</h2>
            <div className="space-y-3">
              {retreat.schedule.map((item, idx) => (
                <div key={idx} className="pb-3 border-b border-border last:border-0 last:pb-0">
                  <p className="font-semibold text-sm sm:text-base text-card-foreground mb-1">{item.day}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">{item.activities}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* About Instructor */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-card-foreground mb-3">About the Instructor</h2>
            <div className="flex items-start gap-3 sm:gap-4">
              <img
                src={retreat.instructor.avatar || "/placeholder.svg"}
                alt={retreat.instructor.name}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover flex-shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm sm:text-base text-card-foreground mb-1">{retreat.instructor.name}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">{retreat.instructor.bio || "Experienced quilting instructor"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Book Button - Only show to students */}
        {role === 'student' && (
          <div className="fixed bottom-0 left-0 right-0 p-3 sm:p-4 bg-card border-t border-border pb-safe">
            <div className="max-w-4xl mx-auto">
              <Button
                className="w-full h-12 text-base sm:text-lg"
                onClick={() => navigate(`/retreat/${id}/book`, { 
                  state: { 
                    retreat: {
                      ...retreat,
                      spotsAvailable: retreat.spots_available,
                      totalSpots: retreat.total_spots,
                    }
                  } 
                })}
              >
                Book This Retreat - ${retreat.price}
              </Button>
            </div>
          </div>
        )}
        
        {/* Edit Button for Instructors */}
        {role === 'instructor' && (
          <div className="fixed bottom-0 left-0 right-0 p-3 sm:p-4 bg-card border-t border-border pb-safe">
            <div className="max-w-4xl mx-auto">
              <Button
                className="w-full h-12 text-base sm:text-lg"
                onClick={() => navigate(`/instructor/retreats/${id}/edit`)}
              >
                Edit This Retreat
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RetreatDetail;
