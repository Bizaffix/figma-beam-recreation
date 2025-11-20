import { useState, useEffect, useRef } from "react";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Plus, Edit, Trash2, Eye, EyeOff, Save, X, Upload, MapPin, ExternalLink, Calendar as CalendarIcon, Copy, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { DateRange } from "react-day-picker";

interface Retreat {
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
}

interface FormData {
  title: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  location: string;
  date: string;
  duration: string;
  totalSpots: number;
  price: number;
  description: string;
  image: string;
  includes: string[];
  schedule: { day: string; activities: string }[];
  published: boolean;
}

const parseDateString = (dateStr: string): DateRange | undefined => {
  if (!dateStr) return undefined;
  try {
    const parts = dateStr.split(",");
    const year = parts[1]?.trim();
    const monthAndDays = parts[0].trim();
    const [monthStr, days] = monthAndDays.split(" ");
    if (!monthStr || !days || !year) return undefined;

    const dayParts = days.split("-");
    const startDay = parseInt(dayParts[0]);
    const endDay = dayParts[1] ? parseInt(dayParts[1]) : startDay;

    const monthMap: { [key: string]: number } = {
      Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
      Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
    };

    const month = monthMap[monthStr];
    if (month === undefined) return undefined;

    const from = new Date(parseInt(year), month, startDay);
    const to = new Date(parseInt(year), month, endDay);
    return { from, to };
  } catch (e) {
    return undefined;
  }
};

const formatDateRange = (range: DateRange | undefined): string => {
  if (!range?.from) return "";
  if (!range.to) {
    return format(range.from, "MMM d, yyyy");
  }
  const fromMonth = format(range.from, "MMM");
  const fromDay = format(range.from, "d");
  const toDay = format(range.to, "d");
  const year = format(range.from, "yyyy");
  
  if (format(range.from, "MMM yyyy") === format(range.to, "MMM yyyy")) {
    return `${fromMonth} ${fromDay}-${toDay}, ${year}`;
  }
  const toMonth = format(range.to, "MMM");
  return `${fromMonth} ${fromDay} - ${toMonth} ${toDay}, ${year}`;
};

// Helper function to check if a retreat date has passed
const isRetreatCompleted = (dateStr: string): boolean => {
  if (!dateStr) return false;
  try {
    const dateRange = parseDateString(dateStr);
    if (!dateRange?.to) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(dateRange.to);
    endDate.setHours(0, 0, 0, 0);
    return endDate < today;
  } catch (e) {
    return false;
  }
};

const InstructorDashboard = () => {
  const { role, user } = useAuth();
  const { toast } = useToast();
  const [allRetreats, setAllRetreats] = useState<Retreat[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | 'new' | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [studentsServed, setStudentsServed] = useState<number>(0);
  const [expectedRevenue, setExpectedRevenue] = useState<number>(0);
  const [publishedCount, setPublishedCount] = useState<number>(0);
  const [draftCount, setDraftCount] = useState<number>(0);
  const [invitesCount, setInvitesCount] = useState<number>(0);
  const [completedRetreats, setCompletedRetreats] = useState<number>(0);
  const [bookedSeats, setBookedSeats] = useState<number>(0);
  
  const [formData, setFormData] = useState<FormData>({
    title: "",
    level: "Beginner",
    location: "https://maps.app.goo.gl/GNhCfeCM7CHMpHW5A",
    date: "",
    duration: "",
    totalSpots: 0,
    price: 0,
    description: "",
    image: "",
    includes: [],
    schedule: [],
    published: false,
  });

  const [includeItem, setIncludeItem] = useState("");
  const [scheduleDay, setScheduleDay] = useState("");
  const [scheduleActivities, setScheduleActivities] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [imagePreview, setImagePreview] = useState<string>("");

  // Only show this page to instructors
  if (role !== 'instructor') {
    return null;
  }

  // Fetch retreats and stats from Supabase
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        // Fetch retreats
        const { data: retreatsData, error: retreatsError } = await supabase
          .from('retreats')
          .select('*')
          .eq('instructor_id', user.id)
          .order('created_at', { ascending: false });

        if (retreatsError) {
          console.error('Error fetching retreats:', retreatsError);
          toast({
            title: "Error",
            description: "Failed to load retreats",
            variant: "destructive",
          });
        } else {
          setAllRetreats(retreatsData || []);
        }

        // Calculate published and draft counts
        const published = retreatsData?.filter(r => r.published) || [];
        const drafts = retreatsData?.filter(r => !r.published) || [];
        setPublishedCount(published.length);
        setDraftCount(drafts.length);

        // Calculate completed retreats (retreats where end date has passed)
        const completed = retreatsData?.filter(r => isRetreatCompleted(r.date)) || [];
        setCompletedRetreats(completed.length);

        // Fetch bookings for stats
        const retreatIds = retreatsData?.map(r => r.id) || [];
        let totalBookedSeats = 0;
        if (retreatIds.length > 0) {
          const { data: bookingsData, error: bookingsError } = await supabase
            .from('bookings')
            .select('amount, status, retreat_id')
            .in('retreat_id', retreatIds)
            .eq('status', 'confirmed');

          if (!bookingsError && bookingsData) {
            const revenue = bookingsData.reduce((sum, booking) => sum + Number(booking.amount || 0), 0);
            const students = bookingsData.length;
            totalBookedSeats = students;
            setTotalRevenue(revenue);
            setStudentsServed(students);
            setBookedSeats(totalBookedSeats);
          }
        }

        // Calculate expected revenue from published retreats and booked seats ratio
        // Expected Revenue = (Total potential revenue from published retreats) * (Booked Seats / Total Seats)
        const publishedRetreats = published || [];
        const totalSpotsForPublished = publishedRetreats.reduce((sum, retreat) => sum + Number(retreat.total_spots || 0), 0);
        const bookedSeatsCount = totalBookedSeats;
        const totalRevenuePotential = publishedRetreats.reduce((sum, retreat) => {
          return sum + (Number(retreat.price || 0) * Number(retreat.total_spots || 0));
        }, 0);
        
        // Expected revenue based on booking rate
        const expected = totalSpotsForPublished > 0 
          ? Math.round(totalRevenuePotential * (bookedSeatsCount / totalSpotsForPublished))
          : 0;
        setExpectedRevenue(expected);

        // Fetch invites count (users referred by this instructor)
        const { data: referredUsers, error: invitesError } = await supabase
          .from('profiles')
          .select('id')
          .eq('referred_by', user.id);

        if (!invitesError && referredUsers) {
          setInvitesCount(referredUsers.length);
        }

      } catch (error) {
        console.error('Unexpected error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, toast]);

  // Update formData.date and calculate duration when dateRange changes
  useEffect(() => {
    const formatted = formatDateRange(dateRange);
    if (formatted || dateRange === undefined) {
      setFormData(prev => ({ ...prev, date: formatted }));
    }
    
    if (dateRange?.from && dateRange?.to) {
      const diffTime = Math.abs(dateRange.to.getTime() - dateRange.from.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      setFormData(prev => ({ ...prev, duration: `${diffDays} days` }));
    }
  }, [dateRange]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

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
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const filePath = `retreats/${fileName}`;

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

      const { data: { publicUrl } } = supabase.storage
        .from('retreat-images')
        .getPublicUrl(filePath);

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
      e.target.value = '';
    }
  };

  const startEditing = (retreat?: Retreat) => {
    if (retreat) {
      setFormData({
        title: retreat.title,
        level: retreat.level,
        location: retreat.location,
        date: retreat.date,
        duration: retreat.duration,
        totalSpots: retreat.total_spots,
        price: retreat.price,
        description: retreat.description,
        image: retreat.image,
        includes: retreat.includes || [],
        schedule: retreat.schedule || [],
        published: retreat.published || false,
      });
      setDateRange(parseDateString(retreat.date));
      setImagePreview("");
      setEditingId(retreat.id);
    } else {
      setFormData({
        title: "",
        level: "Beginner",
        location: "https://maps.app.goo.gl/GNhCfeCM7CHMpHW5A",
        date: "",
        duration: "",
        totalSpots: 0,
        price: 0,
        description: "",
        image: "",
        includes: [],
        schedule: [],
        published: false,
      });
      setDateRange(undefined);
      setImagePreview("");
      setIncludeItem("");
      setScheduleDay("");
      setScheduleActivities("");
      setEditingId('new');
    }
  };

  const cancelEditing = () => {
    setEditingId(null);
    setFormData({
      title: "",
      level: "Beginner",
      location: "https://maps.app.goo.gl/GNhCfeCM7CHMpHW5A",
      date: "",
      duration: "",
      totalSpots: 0,
      price: 0,
      description: "",
      image: "",
      includes: [],
      schedule: [],
      published: false,
    });
    setDateRange(undefined);
    setImagePreview("");
    setIncludeItem("");
    setScheduleDay("");
    setScheduleActivities("");
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

  const handleSave = async (published?: boolean) => {
    if (!user) return;

    setSaving(true);

    try {
      const retreatData = {
        title: formData.title,
        description: formData.description || "",
        location: formData.location,
        date: formData.date,
        duration: formData.duration,
        level: formData.level,
        price: formData.price || 0,
        total_spots: formData.totalSpots || 0,
        spots_available: formData.totalSpots || 0,
        image: formData.image || "",
        includes: formData.includes || [],
        schedule: formData.schedule || [],
        published: published !== undefined ? published : (formData.published || false),
        instructor_id: user.id,
      };

      if (editingId === 'new') {
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
            description: retreatData.published ? "Retreat published successfully!" : "Retreat saved as draft!",
          });
          setAllRetreats(prev => [data, ...prev]);
          cancelEditing();
        }
      } else if (typeof editingId === 'number') {
        const { spots_available, ...updateData } = retreatData;
        const { error } = await supabase
          .from('retreats')
          .update({
            ...updateData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingId)
          .eq('instructor_id', user.id);

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
            description: retreatData.published ? "Retreat published successfully!" : "Retreat saved as draft!",
          });
          setAllRetreats(prev => prev.map(r => 
            r.id === editingId ? { ...r, ...updateData, spots_available: r.spots_available } : r
          ));
          cancelEditing();
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
      setSaving(false);
    }
  };

  const handleTogglePublish = async (id: number) => {
    const retreat = allRetreats.find(r => r.id === id);
    if (!retreat || !user) return;

    try {
      const { error } = await supabase
        .from('retreats')
        .update({ published: !retreat.published })
        .eq('id', id)
        .eq('instructor_id', user.id);

      if (error) {
        console.error('Error updating retreat:', error);
        toast({
          title: "Error",
          description: "Failed to update retreat status",
          variant: "destructive",
        });
      } else {
        setAllRetreats(prev => prev.map(r => 
          r.id === id ? { ...r, published: !r.published } : r
        ));
        toast({
          title: "Success",
          description: retreat.published ? "Retreat unpublished" : "Retreat published!",
        });
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this retreat?')) {
      return;
    }

    if (!user) return;

    try {
      const { error } = await supabase
        .from('retreats')
        .delete()
        .eq('id', id)
        .eq('instructor_id', user.id);

      if (error) {
        console.error('Error deleting retreat:', error);
        toast({
          title: "Error",
          description: "Failed to delete retreat",
          variant: "destructive",
        });
      } else {
        setAllRetreats(prev => prev.filter(r => r.id !== id));
        toast({
          title: "Success",
          description: "Retreat deleted successfully",
        });
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };


  const renderEditableCard = () => {
    const isNew = editingId === 'new';
    
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-card-foreground">
              {isNew ? "Create New Retreat" : "Edit Retreat"}
            </h2>
            <Button variant="ghost" size="sm" onClick={cancelEditing}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                required
              />
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
                {(imagePreview || formData.image) && (
                  <div className="mt-2">
                    <img
                      src={imagePreview || formData.image}
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
              </div>
            </div>
          </div>

          {/* Location & Dates */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-card-foreground">Location & Dates</h3>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                Location
              </Label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <MapPin className="w-5 h-5" />
                </div>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  required
                  className="pl-10 pr-10 h-12 text-base border-2 focus:border-primary transition-colors rounded-lg"
                  placeholder="Enter location or Google Maps link"
                />
                {formData.location && (formData.location.startsWith('http://') || formData.location.startsWith('https://')) && (
                  <a
                    href={formData.location}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-primary hover:text-primary/80 transition-colors"
                    title="Open location in new tab"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </a>
                )}
              </div>
            </div>

            <div>
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal text-xs sm:text-sm",
                      !dateRange && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y")} -{" "}
                          {format(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Duration</Label>
                <Input
                  value={formData.duration}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                  placeholder="4 days"
                  required
                />
              </div>
              <div>
                <Label># of Seats</Label>
                <Input
                  type="number"
                  value={formData.totalSpots}
                  onChange={(e) => setFormData(prev => ({ ...prev, totalSpots: Number(e.target.value) }))}
                  required
                />
              </div>
            </div>
          </div>

          {/* Price and Skill Level */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Price ($)</Label>
                <p className="text-xs text-muted-foreground mb-2">Per Student</p>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price || ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData(prev => ({ 
                      ...prev, 
                      price: value === "" ? undefined : Number(value) 
                    }));
                  }}
                  placeholder="Enter price"
                  required
                />
              </div>

              <div>
                <Label>Skill Level</Label>
                <p className="text-xs text-muted-foreground mb-2">Who is this for?</p>
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
            </div>
          </div>

          {/* Schedule */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-card-foreground">Schedule</h3>
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
          </div>

          {/* Publish Status */}
          <div className="p-4 bg-muted rounded-lg">
            <h3 className="font-semibold text-card-foreground mb-1">Status</h3>
            <p className="text-sm text-muted-foreground">
              {formData.published ? "This retreat will be LIVE and visible to students" : "This retreat will be saved as a DRAFT"}
            </p>
          </div>

          {/* Save/Cancel/Publish Buttons */}
          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={cancelEditing}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => handleSave(false)}
              disabled={saving}
            >
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
            <Button
              type="button"
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
              onClick={() => handleSave(true)}
              disabled={saving}
            >
              {saving ? "Publishing..." : "Publish"}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-hero pb-20">
      {/* Header */}
      <div className="bg-gradient-primary text-white px-6 py-8">
        <h1 className="text-3xl font-bold mb-2">Instructor Dashboard</h1>
        <p className="text-white/90 text-lg">Manage your retreats</p>
      </div>

      {/* Stats - Only show when not editing */}
      {editingId === null && (
        <div className="px-6 -mt-4 mb-6">
          {/* Row 1: Total Revenue, Completed Retreats, Students */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-card-foreground">${totalRevenue.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-card-foreground">{completedRetreats}</p>
                <p className="text-sm text-muted-foreground">Completed Retreats</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-card-foreground">{studentsServed}</p>
                <p className="text-sm text-muted-foreground">Students</p>
              </CardContent>
            </Card>
          </div>

          {/* Row 2: Expected Revenue, Published Retreats, Booked Seats */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-card-foreground">${expectedRevenue.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Expected Revenue</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-card-foreground">{publishedCount}</p>
                <p className="text-sm text-muted-foreground">Published Retreats</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-card-foreground">{bookedSeats}</p>
                <p className="text-sm text-muted-foreground">Booked Seats</p>
              </CardContent>
            </Card>
          </div>

          {/* Retreat Draft (Left) and Instructor Link (Right) */}
          <div className="grid grid-cols-2 gap-4">
            {/* Retreat Draft - Left Side */}
            <Card className="h-full">
              <CardContent className="p-4 text-center h-full flex flex-col justify-center">
                <p className="text-2xl font-bold text-card-foreground">{draftCount}</p>
                <p className="text-sm text-muted-foreground">Retreat Drafts</p>
              </CardContent>
            </Card>

            {/* Share Instructor Link - Right Side */}
            <Card className="h-full">
              <CardContent className="p-4 h-full flex flex-col justify-center">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-card-foreground">Share the Link</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-sm font-semibold text-card-foreground">{invitesCount}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-2 h-auto"
                      onClick={() => {
                        const instructorLink = `${window.location.origin}/login?ref=${user?.id}`;
                        navigator.clipboard.writeText(instructorLink);
                        toast({
                          title: "Link Copied!",
                          description: "Instructor referral link copied to clipboard.",
                        });
                      }}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Retreats List */}
      <div className="px-6 space-y-6 max-w-4xl mx-auto">
        {loading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground text-lg">Loading retreats...</p>
          </div>
        ) : (
          <>
            {/* Create New Button - only show if not editing */}
            {editingId === null && (
              <div className="border-4 border-primary/30 bg-primary/5 rounded-lg p-1 shadow-lg">
                <Button 
                  className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-md"
                  onClick={() => startEditing()}
                >
                  <Plus className="w-6 h-6 mr-2" />
                  Create New Retreat
                </Button>
              </div>
            )}

            {/* Editable Card */}
            {editingId !== null && renderEditableCard()}

            {/* Existing Retreats */}
            {allRetreats.map((retreat) => {
              // Skip if this retreat is being edited
              if (editingId === retreat.id) return null;

              return (
                <Card key={retreat.id} className="overflow-hidden">
                  <div className="relative">
                    <img
                      src={retreat.image || "/placeholder.svg"}
                      alt={retreat.title}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute top-3 right-3 flex gap-2">
                      <Badge className={retreat.published ? "bg-green-500 text-white font-semibold" : "bg-gray-400 text-white font-semibold"}>
                        {retreat.published ? "LIVE" : "DRAFT"}
                      </Badge>
                    </div>
                  </div>
                  
                  <CardContent className="p-5 relative">
                    <h3 className="text-xl font-semibold text-card-foreground mb-4">{retreat.title}</h3>
                    
                    <div className="flex gap-2 mb-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startEditing(retreat)}
                        className="flex-1"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant={retreat.published ? "outline" : "default"}
                        size="sm"
                        onClick={() => handleTogglePublish(retreat.id)}
                        className="flex-1"
                      >
                        {retreat.published ? (
                          <>
                            <EyeOff className="w-4 h-4 mr-2" />
                            Unpublish
                          </>
                        ) : (
                          <>
                            <Eye className="w-4 h-4 mr-2" />
                            Publish
                          </>
                        )}
                      </Button>
                    </div>

                    <div className="text-sm text-muted-foreground">
                      <p>{retreat.location} • {retreat.date}</p>
                      <p className="mt-1">{retreat.spots_available} of {retreat.total_spots} spots available</p>
                    </div>

                    {/* Delete button in bottom right corner */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(retreat.id)}
                      className="absolute bottom-4 right-4 text-destructive hover:text-destructive hover:bg-destructive/10 p-2 h-auto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}

            {allRetreats.length === 0 && editingId === null && (
              <div className="text-center py-8">
                <p className="text-muted-foreground text-lg">No retreats yet. Create your first one!</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default InstructorDashboard;
