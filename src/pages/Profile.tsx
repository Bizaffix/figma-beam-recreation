import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/components/BottomNav";
import { Calendar, MapPin, Mail, Phone, Edit } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-hero pb-20">
      {/* Header */}
      <div className="bg-gradient-primary text-white px-6 py-8">
        <h1 className="text-3xl font-bold mb-2">Profile</h1>
        <p className="text-white/90 text-lg">Manage your account</p>
      </div>

      {/* Profile Content */}
      <div className="px-6 -mt-8 max-w-4xl mx-auto space-y-6">
        {/* Profile Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <Avatar className="w-24 h-24">
                <AvatarImage src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200&h=200" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
              
              <div>
                <h2 className="text-2xl font-bold text-card-foreground">
                  {user?.email?.split('@')[0] || 'User'}
                </h2>
                <p className="text-muted-foreground">
                  {role === 'instructor' ? 'Instructor' : 'Quilting Enthusiast'}
                </p>
              </div>

              <Button variant="outline" className="mt-2">
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h3 className="text-xl font-semibold text-card-foreground mb-4">Contact Information</h3>
            
            <div className="flex items-center gap-3 text-muted-foreground">
              <Mail className="w-5 h-5" />
              <span>{user?.email || 'No email'}</span>
            </div>
            
            {role === 'student' && (
              <>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Phone className="w-5 h-5" />
                  <span>+1 (555) 123-4567</span>
                </div>
                
                <div className="flex items-center gap-3 text-muted-foreground">
                  <MapPin className="w-5 h-5" />
                  <span>San Francisco, CA</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* My Bookings - Only for students */}
        {role === 'student' && (
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold text-card-foreground mb-4">My Bookings</h3>
              
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                  <Calendar className="w-5 h-5 text-primary mt-1" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-card-foreground">Modern Quilting Techniques</h4>
                    <p className="text-sm text-muted-foreground">Nov 5-8, 2025 • Burlington, Vermont</p>
                    <p className="text-sm text-primary font-medium mt-1">Confirmed</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                  <Calendar className="w-5 h-5 text-primary mt-1" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-card-foreground">Coastal Quilting Escape</h4>
                    <p className="text-sm text-muted-foreground">Feb 14-17, 2026 • Mendocino, California</p>
                    <p className="text-sm text-primary font-medium mt-1">Confirmed</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Settings */}
        <Card>
          <CardContent className="p-6 space-y-3">
            <h3 className="text-xl font-semibold text-card-foreground mb-4">Settings</h3>
            <Button variant="ghost" className="w-full justify-start">
              Notifications
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              Payment Methods
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              Privacy & Security
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start text-destructive"
              onClick={handleLogout}
            >
              Log Out
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default Profile;
