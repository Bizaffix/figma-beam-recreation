import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Upload } from "lucide-react";
import { Retreat } from "@/data/retreats";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

const InstructorRetreatForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { role, user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const isEdit = !!id;

  // Only show this page to instructors
  if (role !== 'instructor') {
    return null;
  }

  const [formData, setFormData] = useState<Partial<Retreat>>({
    title: "",
    level: "Beginner",
    location: "",
    date: "",
    duration: "",
    spotsAvailable: 0,
    totalSpots: 0,
    price: 0,
    description: "",
    image: "",
    instructor: {
      name: "",
      avatar: "",
      bio: "",
    },
    includes: [],
    schedule: [],
    published: false,
  });

  const [includeItem, setIncludeItem] = useState("");
  const [scheduleDay, setScheduleDay] = useState("");
  const [scheduleActivities, setScheduleActivities] = useState("");
  const [fetching, setFetching] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch retreat data from Supabase when editing
  useEffect(() => {
    const fetchRetreat = async () => {
      if (!isEdit || !id || !user) return;

      setFetching(true);
      try {
        const { data, error } = await supabase
          .from('retreats')
          .select('*')
          .eq('id', Number(id))
          .eq('instructor_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching retreat:', error);
          toast({
            title: "Error",
            description: "Failed to load retreat data",
            variant: "destructive",
          });
          navigate("/instructor/dashboard");
        } else if (data) {
          // Transform database format to form format
          setFormData({
            title: data.title,
            level: data.level,
            location: data.location,
            date: data.date,
            duration: data.duration,
            spotsAvailable: data.spots_available,
            totalSpots: data.total_spots,
            price: data.price,
            description: data.description,
            image: data.image,
            instructor: {
              name: "", // Will be fetched from profiles if needed
              avatar: "",
              bio: "",
            },
            includes: data.includes || [],
            schedule: data.schedule || [],
            published: data.published || false,
          });
          // Set image preview if image exists
          if (data.image) {
            setImagePreview(data.image);
          }
        }
      } catch (error) {
        console.error('Unexpected error:', error);
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
      } finally {
        setFetching(false);
      }
    };

    fetchRetreat();
  }, [isEdit, id, user, navigate, toast]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      const filePath = `retreats/${fileName}`;

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

      // Update form data with the image URL
      setFormData(prev => ({ ...prev, image: publicUrl }));
      setImagePreview(publicUrl);

      toast({
        title: "Success",
        description: "Image uploaded successfully",
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create a retreat",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Transform form data to match database schema
      const retreatData = {
        title: formData.title,
        description: formData.description || "",
        location: formData.location,
        date: formData.date,
        duration: formData.duration,
        level: formData.level,
        price: formData.price || 0,
        total_spots: formData.totalSpots || 0,
        spots_available: formData.spotsAvailable || 0,
        image: formData.image || "",
        includes: formData.includes || [],
        schedule: formData.schedule || [],
        published: formData.published || false,
        instructor_id: user.id,
      };

      if (isEdit && id) {
        // Update existing retreat
        const { error } = await supabase
          .from('retreats')
          .update({
            ...retreatData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', Number(id))
          .eq('instructor_id', user.id); // Ensure user owns this retreat

        if (error) {
          console.error('Error updating retreat:', error);
          toast({
            title: "Error",
            description: error.message || "Failed to update retreat",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Success",
            description: "Retreat updated successfully!",
          });
          navigate("/instructor/dashboard");
        }
      } else {
        // Create new retreat
        const { data, error } = await supabase
          .from('retreats')
          .insert([retreatData])
          .select()
          .single();

        if (error) {
          console.error('Error creating retreat:', error);
          toast({
            title: "Error",
            description: error.message || "Failed to create retreat",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Success",
            description: "Retreat created successfully!",
          });
          navigate("/instructor/dashboard");
        }
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

  const addIncludeItem = () => {
    if (includeItem.trim()) {
      setFormData(prev => ({
        ...prev,
        includes: [...(prev.includes || []), includeItem.trim()]
      }));
      setIncludeItem("");
    }
  };

  const removeIncludeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      includes: prev.includes?.filter((_, i) => i !== index) || []
    }));
  };

  const addScheduleItem = () => {
    if (scheduleDay.trim() && scheduleActivities.trim()) {
      setFormData(prev => ({
        ...prev,
        schedule: [...(prev.schedule || []), { day: scheduleDay.trim(), activities: scheduleActivities.trim() }]
      }));
      setScheduleDay("");
      setScheduleActivities("");
    }
  };

  const removeScheduleItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      schedule: prev.schedule?.filter((_, i) => i !== index) || []
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-hero pb-20">
      <div className="bg-gradient-primary text-white px-6 py-8">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/instructor/dashboard")}
            className="text-white hover:bg-white/20"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold mb-2">
              {isEdit ? "Edit Retreat" : "Create New Retreat"}
            </h1>
            <p className="text-white/90 text-lg">Fill in the details below</p>
          </div>
        </div>
      </div>

      {fetching ? (
        <div className="px-6 -mt-4 max-w-4xl mx-auto pt-6">
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">Loading retreat data...</p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="px-6 -mt-4 max-w-4xl mx-auto space-y-6 pt-6">
          {/* Basic Information */}
          <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-xl font-semibold text-card-foreground mb-4">Basic Information</h2>
            
            <div>
              <Label>Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label>Retreat Image</Label>
              <div className="space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                  className="hidden"
                />
                {!imagePreview && !formData.image && (
                  <div
                    onClick={() => fileInputRef.current?.click()}
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
                {imagePreview && (
                  <div className="mt-2">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg border"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => {
                        setImagePreview("");
                        setFormData(prev => ({ ...prev, image: "" }));
                      }}
                    >
                      Remove Image
                    </Button>
                  </div>
                )}
                {formData.image && !imagePreview && (
                  <div className="mt-2">
                    <img
                      src={formData.image}
                      alt="Current"
                      className="w-full h-48 object-cover rounded-lg border"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, image: "" }));
                      }}
                    >
                      Remove Image
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Level</Label>
                <Select
                  value={formData.level}
                  onValueChange={(value: "Beginner" | "Intermediate" | "Advanced") =>
                    setFormData(prev => ({ ...prev, level: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Price ($)</Label>
                <Input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
                  required
                />
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Location & Dates */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-xl font-semibold text-card-foreground mb-4">Location & Dates</h2>
            
            <div>
              <Label>Location</Label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date</Label>
                <Input
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  placeholder="Nov 5-8, 2025"
                  required
                />
              </div>
              <div>
                <Label>Duration</Label>
                <Input
                  value={formData.duration}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                  placeholder="4 days"
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Spots */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-xl font-semibold text-card-foreground mb-4">Availability</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Total Spots</Label>
                <Input
                  type="number"
                  value={formData.totalSpots}
                  onChange={(e) => setFormData(prev => ({ ...prev, totalSpots: Number(e.target.value) }))}
                  required
                />
              </div>
              <div>
                <Label>Spots Available</Label>
                <Input
                  type="number"
                  value={formData.spotsAvailable}
                  onChange={(e) => setFormData(prev => ({ ...prev, spotsAvailable: Number(e.target.value) }))}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instructor Info */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-xl font-semibold text-card-foreground mb-4">Instructor Information</h2>
            
            <div>
              <Label>Instructor Name</Label>
              <Input
                value={formData.instructor?.name}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  instructor: { ...prev.instructor!, name: e.target.value }
                }))}
                required
              />
            </div>

            <div>
              <Label>Instructor Avatar URL</Label>
              <Input
                value={formData.instructor?.avatar}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  instructor: { ...prev.instructor!, avatar: e.target.value }
                }))}
              />
            </div>

            <div>
              <Label>Instructor Bio</Label>
              <Textarea
                value={formData.instructor?.bio}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  instructor: { ...prev.instructor!, bio: e.target.value }
                }))}
                rows={3}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* What's Included */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-xl font-semibold text-card-foreground mb-4">What's Included</h2>
            
            <div className="flex gap-2">
              <Input
                value={includeItem}
                onChange={(e) => setIncludeItem(e.target.value)}
                placeholder="Add an item..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addIncludeItem())}
              />
              <Button type="button" onClick={addIncludeItem}>Add</Button>
            </div>

            <div className="space-y-2">
              {formData.includes?.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="text-sm">{item}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeIncludeItem(index)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Schedule */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-xl font-semibold text-card-foreground mb-4">Schedule</h2>
            
            <div className="space-y-2">
              <Input
                value={scheduleDay}
                onChange={(e) => setScheduleDay(e.target.value)}
                placeholder="Day (e.g., Day 1)"
              />
              <Textarea
                value={scheduleActivities}
                onChange={(e) => setScheduleActivities(e.target.value)}
                placeholder="Activities for this day..."
                rows={2}
              />
              <Button type="button" onClick={addScheduleItem}>Add Schedule Item</Button>
            </div>

            <div className="space-y-2">
              {formData.schedule?.map((item, index) => (
                <div key={index} className="p-3 bg-muted rounded">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-sm">{item.day}</p>
                      <p className="text-sm text-muted-foreground">{item.activities}</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeScheduleItem(index)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Publish Status */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-card-foreground">Publish Status</h3>
                <p className="text-sm text-muted-foreground">
                  {formData.published ? "This retreat is visible to students" : "This retreat is a draft"}
                </p>
              </div>
              <Button
                type="button"
                variant={formData.published ? "default" : "outline"}
                onClick={() => setFormData(prev => ({ ...prev, published: !prev.published }))}
              >
                {formData.published ? "Published" : "Draft"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Submit Buttons */}
        <div className="flex gap-4 pb-8">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => navigate("/instructor/dashboard")}
          >
            Cancel
          </Button>
          <Button type="submit" className="flex-1" disabled={loading}>
            {loading ? (isEdit ? "Updating..." : "Creating...") : (isEdit ? "Update Retreat" : "Create Retreat")}
          </Button>
        </div>
      </form>
      )}
    </div>
  );
};

export default InstructorRetreatForm;

