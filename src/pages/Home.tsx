import { useState, useEffect } from "react";
import { BottomNav } from "@/components/BottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Star, Award, GraduationCap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

const Home = () => {
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const { toast } = useToast();
  const [firstName, setFirstName] = useState<string>("");
  const [creatingProfile, setCreatingProfile] = useState(false);

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
              <Calendar className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold text-card-foreground">2</p>
              <p className="text-sm text-muted-foreground">Upcoming</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Award className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold text-card-foreground">5</p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </CardContent>
          </Card>
        </div>

        {/* Featured Retreat */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-5 h-5 text-primary fill-primary" />
              <h3 className="text-xl font-semibold text-card-foreground">Featured Retreat</h3>
            </div>
            
            <img
              src="https://images.unsplash.com/photo-1706614452468-d9d7c5b967b6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080"
              alt="Featured retreat"
              className="w-full h-48 object-cover rounded-lg mb-4"
            />
            
            <h4 className="text-lg font-semibold text-card-foreground mb-2">
              Modern Quilting Techniques
            </h4>
            <p className="text-sm text-muted-foreground mb-4">
              Join Emma Thompson for an immersive 4-day workshop in Burlington, Vermont.
            </p>
            
            <Button className="w-full">View Details</Button>
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
