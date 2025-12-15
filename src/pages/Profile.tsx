import { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BottomNav } from "@/components/BottomNav";
import { Calendar, MapPin, Mail, Phone, Edit, Upload, X, Facebook, Instagram, Save, GraduationCap, Users, Loader2, Building2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

const Profile = () => {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [switchingRole, setSwitchingRole] = useState(false);
  const profileImageInputRef = useRef<HTMLInputElement>(null);
  
  const [profileData, setProfileData] = useState({
    full_name: "",
    avatar_url: "",
    bio: "",
    facebook_url: "",
    instagram_url: "",
    pinterest_url: "",
  });

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, avatar_url, bio, facebook_url, instagram_url, pinterest_url')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
        } else if (data) {
          setProfileData({
            full_name: data.full_name || "",
            avatar_url: data.avatar_url || "",
            bio: data.bio || "",
            facebook_url: data.facebook_url || "",
            instagram_url: data.instagram_url || "",
            pinterest_url: data.pinterest_url || "",
          });
        }
      } catch (error) {
        console.error('Unexpected error:', error);
      }
    };

    fetchProfile();
  }, [user]);

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const handleSwitchRole = async (newRole: 'student' | 'instructor' | 'location_owner') => {
    if (!user || role === newRole || switchingRole) return;

    setSwitchingRole(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', user.id);

      if (error) {
        console.error('Error switching role:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to switch profile",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: `Switched to ${newRole === 'student' ? 'Attendee' : newRole === 'instructor' ? 'Organizer' : 'Venue Owner'} profile`,
        });
        // Reload the page to update the role in AuthContext
        setTimeout(() => {
          if (newRole === 'instructor') {
            window.location.href = '/instructor/dashboard';
          } else if (newRole === 'location_owner') {
            window.location.href = '/location-owner/dashboard';
          } else {
            window.location.href = '/home';
          }
        }, 1000);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setSwitchingRole(false);
    }
  };

  const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Image size must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    setUploadingImage(true);

    try {
      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const filePath = `profiles/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('retreat-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Error uploading image:', uploadError);
        toast({
          title: "Error",
          description: uploadError.message || "Failed to upload image",
          variant: "destructive",
        });
        return;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('retreat-images')
        .getPublicUrl(filePath);

      // Update profile data with the image URL
      setProfileData(prev => ({ ...prev, avatar_url: publicUrl }));

      toast({
        title: "Success",
        description: "Profile image uploaded successfully",
      });
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while uploading image",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
      // Reset file input
      e.target.value = '';
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setLoading(true);

    try {
      // For students, don't update bio (keep existing or null)
      const updateData: {
        full_name: string;
        avatar_url: string;
        facebook_url: string | null;
        instagram_url: string | null;
        pinterest_url: string | null;
        bio?: string;
      } = {
        full_name: profileData.full_name,
        avatar_url: profileData.avatar_url,
        facebook_url: profileData.facebook_url || null,
        instagram_url: profileData.instagram_url || null,
        pinterest_url: profileData.pinterest_url || null,
      };

      // Only include bio for instructors
      if (role === 'instructor') {
        updateData.bio = profileData.bio;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) {
        console.error('Error updating profile:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to save profile",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Profile updated successfully",
        });
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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
        {/* Profile Switcher - Three Buttons */}
        <div className="bg-card rounded-lg border border-border p-1 shadow-sm">
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant={role === 'student' ? 'default' : 'ghost'}
              className={`relative flex flex-col items-center justify-center gap-2 h-auto py-5 px-4 transition-all ${
                role === 'student' 
                  ? 'bg-primary text-primary-foreground shadow-sm' 
                  : 'hover:bg-muted/50 text-muted-foreground'
              }`}
              onClick={() => handleSwitchRole('student')}
              disabled={switchingRole || role === 'student'}
            >
              {switchingRole && role !== 'student' ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Users className={`w-5 h-5 ${role === 'student' ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
              )}
              <div className="text-center">
                <div className={`font-semibold text-sm ${role === 'student' ? 'text-primary-foreground' : 'text-foreground'}`}>
                  Attendee
                </div>
                <div className={`text-xs mt-0.5 ${role === 'student' ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                  Browse & Book
                </div>
              </div>
              {role === 'student' && (
                <div className="absolute top-1 right-1 w-2 h-2 bg-primary-foreground rounded-full" />
              )}
            </Button>
            <Button
              variant={role === 'instructor' ? 'default' : 'ghost'}
              className={`relative flex flex-col items-center justify-center gap-2 h-auto py-5 px-4 transition-all ${
                role === 'instructor' 
                  ? 'bg-primary text-primary-foreground shadow-sm' 
                  : 'hover:bg-muted/50 text-muted-foreground'
              }`}
              onClick={() => handleSwitchRole('instructor')}
              disabled={switchingRole || role === 'instructor'}
            >
              {switchingRole && role !== 'instructor' ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <GraduationCap className={`w-5 h-5 ${role === 'instructor' ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
              )}
              <div className="text-center">
                <div className={`font-semibold text-sm ${role === 'instructor' ? 'text-primary-foreground' : 'text-foreground'}`}>
                  Organizer
                </div>
                <div className={`text-xs mt-0.5 ${role === 'instructor' ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                  Teach & Manage
                </div>
              </div>
              {role === 'instructor' && (
                <div className="absolute top-1 right-1 w-2 h-2 bg-primary-foreground rounded-full" />
              )}
            </Button>
            <Button
              variant={role === 'location_owner' ? 'default' : 'ghost'}
              className={`relative flex flex-col items-center justify-center gap-2 h-auto py-5 px-4 transition-all ${
                role === 'location_owner' 
                  ? 'bg-primary text-primary-foreground shadow-sm' 
                  : 'hover:bg-muted/50 text-muted-foreground'
              }`}
              onClick={() => handleSwitchRole('location_owner')}
              disabled={switchingRole || role === 'location_owner'}
            >
              {switchingRole && role !== 'location_owner' ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Building2 className={`w-5 h-5 ${role === 'location_owner' ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
              )}
              <div className="text-center">
                <div className={`font-semibold text-sm ${role === 'location_owner' ? 'text-primary-foreground' : 'text-foreground'}`}>
                  Venue Owner
                </div>
                <div className={`text-xs mt-0.5 ${role === 'location_owner' ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                  Manage Venues
                </div>
              </div>
              {role === 'location_owner' && (
                <div className="absolute top-1 right-1 w-2 h-2 bg-primary-foreground rounded-full" />
              )}
            </Button>
          </div>
        </div>

        {/* Profile Card */}
        <Card>
          <CardContent className="p-6">
            {!isEditing ? (
              <div className="flex flex-col items-center text-center space-y-4">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={profileData.avatar_url || "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200&h=200"} />
                  <AvatarFallback>
                    {profileData.full_name ? profileData.full_name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                
                <div>
                  <h2 className="text-2xl font-bold text-card-foreground">
                    {profileData.full_name || user?.email?.split('@')[0] || 'User'}
                  </h2>
                  <p className="text-muted-foreground">
                    {role === 'instructor' ? 'Instructor' : 'Quilting Enthusiast'}
                  </p>
                  {profileData.bio && (
                    <p className="text-sm text-muted-foreground mt-2 max-w-md">
                      {profileData.bio}
                    </p>
                  )}
                </div>

                {/* Social Media Links */}
                {(profileData.facebook_url || profileData.instagram_url || profileData.pinterest_url) && (
                  <div className="flex gap-4 justify-center mt-4">
                    {profileData.facebook_url && (
                      <a
                        href={profileData.facebook_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Facebook className="w-5 h-5" />
                      </a>
                    )}
                    {profileData.instagram_url && (
                      <a
                        href={profileData.instagram_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Instagram className="w-5 h-5" />
                      </a>
                    )}
                    {profileData.pinterest_url && (
                      <a
                        href={profileData.pinterest_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-red-600 transition-colors"
                      >
                        <span className="text-lg font-bold">P</span>
                      </a>
                    )}
                  </div>
                )}

                <Button variant="outline" className="mt-2" onClick={() => setIsEditing(true)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-card-foreground mb-4">
                  {role === 'instructor' ? 'Instructor Information' : 'Profile Information'}
                </h2>
                
                <div>
                  <Label>{role === 'instructor' ? 'Instructor Name' : 'Name'}</Label>
                  <Input
                    value={profileData.full_name}
                    onChange={(e) => setProfileData(prev => ({ ...prev, full_name: e.target.value }))}
                    placeholder="Enter your name"
                  />
                </div>

                <div>
                  <Label>Profile Image</Label>
                  <div className="space-y-2">
                    <input
                      ref={profileImageInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleProfileImageUpload}
                      disabled={uploadingImage}
                      className="hidden"
                    />
                    {!profileData.avatar_url && (
                      <div
                        onClick={() => profileImageInputRef.current?.click()}
                        className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 cursor-pointer hover:border-primary/50 transition-colors flex flex-col items-center justify-center gap-3"
                      >
                        <Upload className="w-8 h-8 text-muted-foreground" />
                        <div className="text-center">
                          <p className="text-sm font-medium text-card-foreground">Upload File</p>
                          <p className="text-xs text-muted-foreground mt-1">Click to select an image</p>
                        </div>
                      </div>
                    )}
                    {uploadingImage && (
                      <p className="text-sm text-muted-foreground">Uploading image...</p>
                    )}
                    {profileData.avatar_url && (
                      <div className="mt-2 relative">
                        <img
                          src={profileData.avatar_url}
                          alt="Profile"
                          className="w-full h-48 object-cover rounded-lg border"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => setProfileData(prev => ({ ...prev, avatar_url: "" }))}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Remove Image
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {role === 'instructor' && (
                  <div>
                    <Label>Instructor Bio</Label>
                    <Textarea
                      value={profileData.bio}
                      onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                      rows={3}
                      placeholder="Tell us about yourself..."
                    />
                  </div>
                )}

                <div className="space-y-4">
                  <Label className="text-sm font-semibold text-foreground">Social Media</Label>
                  <div className="space-y-3">
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        <Facebook className="w-5 h-5" />
                      </div>
                      <Input
                        value={profileData.facebook_url}
                        onChange={(e) => setProfileData(prev => ({ ...prev, facebook_url: e.target.value }))}
                        className="pl-10"
                        placeholder="Facebook URL"
                      />
                    </div>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        <Instagram className="w-5 h-5" />
                      </div>
                      <Input
                        value={profileData.instagram_url}
                        onChange={(e) => setProfileData(prev => ({ ...prev, instagram_url: e.target.value }))}
                        className="pl-10"
                        placeholder="Instagram URL"
                      />
                    </div>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        <span className="text-lg font-bold text-red-600">P</span>
                      </div>
                      <Input
                        value={profileData.pinterest_url}
                        onChange={(e) => setProfileData(prev => ({ ...prev, pinterest_url: e.target.value }))}
                        className="pl-10"
                        placeholder="Pinterest URL"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleSaveProfile}
                    disabled={loading}
                    className="flex-1"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {loading ? "Saving..." : "Save Profile"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
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
