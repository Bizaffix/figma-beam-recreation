import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Upload, Image as ImageIcon, MapPin, Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useDropzone } from "react-dropzone";

interface VenueData {
  title: string;
  description: string;
  address: string;
  photos: string[];
}

const VenueRegistration = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(!!id);

  const [venueData, setVenueData] = useState<VenueData>({
    title: "",
    description: "",
    address: "",
    photos: []
  });

  // Load existing venue data if editing
  useEffect(() => {
    if (id && isEditing) {
      const fetchVenue = async () => {
        try {
          const { data, error } = await supabase
            .from('properties')
            .select('*')
            .eq('id', id)
            .eq('owner_id', user?.id)
            .single();

          if (error) throw error;

          if (data) {
            setVenueData({
              title: data.property_name || "",
              description: data.description || "",
              address: data.location || "",
              photos: data.photos || []
            });
          }
        } catch (error) {
          console.error('Error fetching venue:', error);
          toast({
            title: "Error",
            description: "Failed to load venue data",
            variant: "destructive",
          });
        }
      };

      fetchVenue();
    }
  }, [id, isEditing, user]);

  const updateVenueData = (field: keyof VenueData, value: any) => {
    setVenueData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    onDrop: async (acceptedFiles) => {
      const uploadPromises = acceptedFiles.map(async (file) => {
        try {
          // Generate unique file name
          const fileName = `${user?.id}/${Date.now()}-${file.name}`;
          
          // Upload to Supabase storage
          const { data, error } = await supabase.storage
            .from('venue-images')
            .upload(fileName, file, {
              cacheControl: '3600',
              upsert: false
            });

          if (error) throw error;

          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('venue-images')
            .getPublicUrl(fileName);

          return publicUrl;
        } catch (error) {
          console.error('Error uploading file:', error);
          toast({
            title: "Upload Error",
            description: `Failed to upload ${file.name}`,
            variant: "destructive",
          });
          return null;
        }
      });

      // Wait for all uploads to complete
      const uploadedUrls = await Promise.all(uploadPromises);
      const validUrls = uploadedUrls.filter(url => url !== null);

      if (validUrls.length > 0) {
        setVenueData(prev => ({
          ...prev,
          photos: [...prev.photos, ...validUrls]
        }));
      }
    }
  });

  const removePhoto = async (index: number) => {
    const photoUrl = venueData.photos[index];
    
    try {
      // Extract file path from the public URL
      const urlParts = photoUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `${user?.id}/${fileName}`;
      
      // Delete from Supabase storage
      const { error } = await supabase.storage
        .from('venue-images')
        .remove([filePath]);

      if (error) {
        console.error('Error deleting file from storage:', error);
        toast({
          title: "Delete Error",
          description: "Failed to delete image from storage",
          variant: "destructive",
        });
        return;
      }

      // Remove from state
      setVenueData(prev => ({
        ...prev,
        photos: prev.photos.filter((_, i) => i !== index)
      }));
    } catch (error) {
      console.error('Error removing photo:', error);
      toast({
        title: "Delete Error",
        description: "Failed to delete image",
        variant: "destructive",
      });
    }
  };

  const handleSave = async (publish: boolean = false) => {
    if (!user) return;

    // Validation
    if (!venueData.title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a venue title",
        variant: "destructive",
      });
      return;
    }

    if (!venueData.description.trim()) {
      toast({
        title: "Error", 
        description: "Please enter a venue description",
        variant: "destructive",
      });
      return;
    }

    if (!venueData.address.trim()) {
      toast({
        title: "Error",
        description: "Please enter a venue address",
        variant: "destructive",
      });
      return;
    }

    if (venueData.photos.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one photo",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      const propertyData = {
        owner_id: user.id,
        property_name: venueData.title,
        description: venueData.description,
        location: venueData.address,
        photos: venueData.photos,
        status: publish ? 'published' : 'draft',
        // Set default values for other required fields
        sleeps: 10,
        max_quilters: 8,
        property_type: 'retreat_center',
        plan: 'free',
        views: 0,
        saves: 0,
        inquiries: 0,
        base_pricing: {},
        stay_types: [],
        dedicated_sewing_room: false,
        max_sewing_stations: 8,
        outlets_near_stations: false,
        iron_support: false,
        cutting_stations: 2,
        pressing_stations: 2,
        irons_provided: false,
        design_walls: '',
        quiet_hours: '',
        natural_light: '',
        accessibility: false,
        supported_formats: [],
        pricing: {},
        min_notice: 7,
        min_group_size: 4,
        max_group_size: 12,
        house_rules: [],
        blocked_dates: [],
        availability_calendar: [],
        headline: venueData.title,
        verified: false,
        primary_goal: '',
        risk_preference: 50,
        booking_control: ''
      };

      let result;
      if (isEditing && id) {
        // Update existing venue
        result = await supabase
          .from('properties')
          .update(propertyData)
          .eq('id', id)
          .eq('owner_id', user.id)
          .select();
      } else {
        // Create new venue
        result = await supabase
          .from('properties')
          .insert([propertyData])
          .select();
      }

      if (result.error) throw result.error;

      toast({
        title: publish ? "Venue Published!" : "Venue Saved!",
        description: publish 
          ? "Your venue is now live and visible to organizers"
          : "Your venue has been saved as a draft",
      });

      navigate('/location-owner/dashboard');
    } catch (error) {
      console.error('Error saving venue:', error);
      toast({
        title: "Error",
        description: "Failed to save venue",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading venue data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="sm" onClick={() => navigate('/location-owner/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {isEditing ? 'Edit Venue' : 'Add a Venue'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isEditing 
                ? 'Update your venue details and photos'
                : 'Create a new venue listing for quilting retreats'
              }
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-8">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Venue Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Venue Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Mountain View Quilting Retreat"
                  value={venueData.title}
                  onChange={(e) => updateVenueData('title', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your venue, its unique features, and why it's perfect for quilting retreats..."
                  className="min-h-[120px]"
                  value={venueData.description}
                  onChange={(e) => updateVenueData('description', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  placeholder="Full venue address"
                  value={venueData.address}
                  onChange={(e) => updateVenueData('address', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Photos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                Venue Photos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Photo Upload */}
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium text-foreground mb-2">
                  {isDragActive ? 'Drop photos here' : 'Upload Venue Photos'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Drag and drop photos here, or click to select files
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Supported formats: JPEG, PNG, GIF, WebP
                </p>
              </div>

              {/* Photo Gallery */}
              {venueData.photos.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Uploaded Photos ({venueData.photos.length})</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {venueData.photos.map((photo, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={photo}
                          alt={`Venue photo ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removePhoto(index)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={() => navigate('/location-owner/dashboard')}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={() => handleSave(false)}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save as Draft'}
            </Button>
            <Button
              onClick={() => handleSave(true)}
              disabled={saving}
              className="bg-primary hover:bg-primary/90"
            >
              {saving ? 'Publishing...' : 'Publish Venue'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VenueRegistration;
