import { useState, useEffect } from "react";
import { BottomNav } from "@/components/BottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Star, Award } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [firstName, setFirstName] = useState<string>("");

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
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default Home;
