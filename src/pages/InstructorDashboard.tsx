import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Trash2, Eye, EyeOff, Save, X, Upload, MapPin, ExternalLink, Calendar as CalendarIcon, Copy, ArrowRight, Share2, CheckCircle2, MessageSquare, Users, DollarSign, BookOpen, TrendingUp, FileText } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { PayoutCard } from "@/components/PayoutCard";
import { useAuth } from "@/contexts/AuthContext";
import { usePlatformSettings } from "@/contexts/PlatformSettingsContext";
import {
  useLazyGetMyRetreatsQuery,
  useCreateRetreatMutation,
  useUpdateRetreatMutation,
  usePublishRetreatMutation,
  useDeleteRetreatMutation,
  useLazyGetRetreatByIdQuery,
  useLazyGetInstructorBookingsQuery,
  useLazyGetUserProfileQuery,
  useMarkFirstEventFreeUsedMutation,
  useLazyGetCampaignsQuery,
  useLazyGetMyAffiliateQuery,
  useLazyGetConversationsQuery,
  useUploadFileMutation,
} from "@/services/server";
import {
  fromLegacyRetreatPayload,
  mapLegacyProfile,
  sumUnreadCount,
  toLegacyRetreat,
  toLegacyBooking,
} from "@/services/mappers";
import { useToast } from "@/hooks/use-toast";
import { notifyStudentsAboutNewRetreat } from "@/lib/email-notifications";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { DateRange } from "react-day-picker";
import { ItineraryBuilder, ItineraryBlock } from "@/components/ItineraryBuilder";
import UserManagement from "@/components/UserManagement";
import { ShareDialog } from "@/components/ShareDialog";

interface ContentCard {
  id: string;
  title: string;
  description: string;
  images: string[];
  videos: string[];
  order: number;
}

interface Retreat {
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
  venue_fees?: number | null;
  food_budget?: number | null;
  itinerary_blocks?: ItineraryBlock[] | null;
  location_images?: string[] | null;
  discount_coupon?: {
    code: string;
    type: 'percentage' | 'fixed';
    value: number;
    max_uses?: number;
    expires_at?: string;
  } | null;
  price_variants?: { id: string; name: string; price: number; description?: string }[] | null;
  add_ons?: { id: string; name: string; price: number; description?: string; required?: boolean }[] | null;
  content_cards?: ContentCard[] | null;
}

interface FormData {
  title: string;
  level: "Beginner" | "Intermediate" | "Advanced" | "Any";
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

// Helper functions to convert between old schedule format and new itinerary format
const convertScheduleToItinerary = (schedule: { day: string; activities: string }[]): ItineraryBlock[] => {
  if (!schedule || schedule.length === 0) return [];
  return schedule.map((item, index) => ({
    id: `block-${Date.now()}-${index}`,
    type: "class" as const,
    title: item.day || `Day ${index + 1}`,
    description: item.activities || "",
    day: item.day,
  }));
};

const convertItineraryToSchedule = (blocks: ItineraryBlock[]): { day: string; activities: string }[] => {
  return blocks.map((block) => ({
    day: block.day || block.title || "",
    activities: block.description || "",
  }));
};

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
  const navigate = useNavigate();
  const { role, user } = useAuth();
  const { toast } = useToast();
  const { instructorFeeRate, settings: platformSettings } = usePlatformSettings();
  const [fetchMyRetreats] = useLazyGetMyRetreatsQuery();
  const [createRetreat] = useCreateRetreatMutation();
  const [updateRetreat] = useUpdateRetreatMutation();
  const [publishRetreat] = usePublishRetreatMutation();
  const [deleteRetreat] = useDeleteRetreatMutation();
  const [fetchRetreatById] = useLazyGetRetreatByIdQuery();
  const [fetchInstructorBookings] = useLazyGetInstructorBookingsQuery();
  const [fetchUserProfile] = useLazyGetUserProfileQuery();
  const [markFirstEventFreeUsed] = useMarkFirstEventFreeUsedMutation();
  const [fetchCampaigns] = useLazyGetCampaignsQuery();
  const [fetchMyAffiliate] = useLazyGetMyAffiliateQuery();
  const [fetchConversations] = useLazyGetConversationsQuery();
  const [uploadFile] = useUploadFileMutation();
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
  const [unreadMessages, setUnreadMessages] = useState<number>(0);
  const [sharingRetreat, setSharingRetreat] = useState<Retreat | null>(null);
  
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
  const [venueFees, setVenueFees] = useState<number>(0);
  const [foodBudget, setFoodBudget] = useState<number>(0);
  const [itineraryBlocks, setItineraryBlocks] = useState<ItineraryBlock[]>([]);
  const [locationImages, setLocationImages] = useState<string[]>([]);
  const [uploadingLocationImage, setUploadingLocationImage] = useState(false);
  const [instructorDiscount, setInstructorDiscount] = useState<{
    type: 'percentage' | 'fixed';
    value: number;
  } | null>(null);
  const [isFirstEvent, setIsFirstEvent] = useState(false);
  const [firstEventFreeEligible, setFirstEventFreeEligible] = useState(false);
  const [firstEventFreeUsed, setFirstEventFreeUsed] = useState(false);
  const [firstEventFreeCampaignActive, setFirstEventFreeCampaignActive] = useState(false);
  
  // Auto-save state
  const [autoSaving, setAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [autoSaveDraftId, setAutoSaveDraftId] = useState<number | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasUnsavedChangesRef = useRef(false);

  // Only show this page to instructors
  if (role !== 'instructor') {
    return null;
  }

  // Fetch retreats and stats from API
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        const retreatsRaw = await fetchMyRetreats({ limit: 200 }).unwrap();
        const retreatsData = retreatsRaw.map((r) => toLegacyRetreat(r) as Retreat);

        setAllRetreats(retreatsData);

        const published = retreatsData.filter((r) => r.published);
        const drafts = retreatsData.filter((r) => !r.published);
        setPublishedCount(published.length);
        setDraftCount(drafts.length);

        const completed = retreatsData.filter((r) => isRetreatCompleted(r.date));
        setCompletedRetreats(completed.length);

        const retreatIds = retreatsData.map((r) => String(r.id));
        let totalBookedSeats = 0;

        if (retreatIds.length > 0) {
          try {
            const bookingsRaw = await fetchInstructorBookings({ limit: 500, status: "confirmed" }).unwrap();
            const bookingsData = bookingsRaw
              .map((b) => toLegacyBooking(b))
              .filter((b) => retreatIds.includes(String(b.retreat_id)));

            const revenue = bookingsData.reduce((sum, booking) => sum + Number(booking.amount || 0), 0);
            const students = bookingsData.length;
            totalBookedSeats = students;
            setTotalRevenue(revenue);
            setStudentsServed(students);
            setBookedSeats(totalBookedSeats);
          } catch (bookingsError) {
            console.error("Error fetching bookings for instructor:", bookingsError);
          }
        }

        const totalSpotsForPublished = published.reduce((sum, retreat) => sum + Number(retreat.total_spots || 0), 0);
        const totalRevenuePotential = published.reduce(
          (sum, retreat) => sum + Number(retreat.price || 0) * Number(retreat.total_spots || 0),
          0,
        );
        const expected =
          totalSpotsForPublished > 0
            ? Math.round(totalRevenuePotential * (totalBookedSeats / totalSpotsForPublished))
            : 0;
        setExpectedRevenue(expected);

        try {
          const affiliateData = await fetchMyAffiliate().unwrap();
          const referrals = (affiliateData.referrals as unknown[]) ?? [];
          setInvitesCount(referrals.length);
        } catch {
          setInvitesCount(0);
        }
      } catch (error) {
        console.error("Unexpected error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, toast]);

  // Check if organizer is eligible for first event free and if this is their first event
  useEffect(() => {
    const checkFirstEventFree = async () => {
      if (!user) {
        setIsFirstEvent(false);
        setFirstEventFreeEligible(false);
        setFirstEventFreeUsed(false);
        return;
      }

      try {
        const campaigns = await fetchCampaigns().unwrap();
        const campaign = campaigns.find((c) => c.name === "First Event Free Program");
        setFirstEventFreeCampaignActive(Boolean(campaign?.isActive ?? campaign?.is_active));

        const profile = await fetchUserProfile().unwrap();
        if (profile) {
          const legacy = mapLegacyProfile(profile as unknown as Record<string, unknown>);
          setFirstEventFreeEligible(Boolean(legacy.first_event_free_eligible));
          setFirstEventFreeUsed(Boolean(legacy.first_event_free_used));
        } else {
          setFirstEventFreeEligible(false);
          setFirstEventFreeUsed(false);
        }

        const publishedRetreats = await fetchMyRetreats({ limit: 200, status: "published" }).unwrap();
        const existingEvents = publishedRetreats.filter((r) => {
          if (typeof editingId === "number" && String(r.id) === String(editingId)) return false;
          return true;
        });
        setIsFirstEvent(existingEvents.length === 0);
      } catch (error) {
        console.error('Error checking first event free:', error);
        setIsFirstEvent(false);
        setFirstEventFreeEligible(false);
        setFirstEventFreeUsed(false);
      }
    };

    checkFirstEventFree();
  }, [user, editingId]);

  // Fetch unread messages count
  useEffect(() => {
    const fetchUnreadMessages = async () => {
      if (!user || role !== 'instructor') return;

      try {
        const conversations = await fetchConversations({ limit: 200 }).unwrap();
        setUnreadMessages(sumUnreadCount(conversations, user.id));
      } catch (error) {
        console.error('Error fetching unread messages:', error);
      }
    };

    fetchUnreadMessages();
  }, [user, role]);

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

  // Auto-save function - saves as draft
  const autoSaveDraft = useCallback(async () => {
    if (!user || editingId === null) return;
    
    // Don't auto-save if form is empty (no title)
    if (!formData.title.trim()) return;

    setAutoSaving(true);
    hasUnsavedChangesRef.current = false;

    try {
      // Convert itinerary blocks to schedule format for backward compatibility
      const scheduleData = itineraryBlocks.length > 0
        ? convertItineraryToSchedule(itineraryBlocks)
        : [];

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
        schedule: scheduleData,
        itinerary_blocks: itineraryBlocks.length > 0 ? itineraryBlocks : null,
        venue_fees: venueFees || 0,
        food_budget: foodBudget || 0,
        location_images: locationImages.length > 0 ? locationImages : null,
        published: false, // Always save as draft in auto-save
        instructor_id: user.id,
      };

      if (editingId === 'new') {
        if (autoSaveDraftId === null) {
          try {
            const created = await createRetreat(fromLegacyRetreatPayload(retreatData)).unwrap();
            const data = toLegacyRetreat(created) as Retreat;
            setAutoSaveDraftId(data.id);
            setEditingId(data.id);
            setAllRetreats(prev => [data, ...prev]);
          } catch (error) {
            console.error('Error auto-saving draft:', error);
            return;
          }
        } else {
          try {
            await updateRetreat({ id: String(autoSaveDraftId), body: fromLegacyRetreatPayload(retreatData) }).unwrap();
            setAllRetreats(prev => prev.map(r => 
              r.id === autoSaveDraftId ? { ...r, ...retreatData } : r
            ));
          } catch (error) {
            console.error('Error auto-saving draft:', error);
            return;
          }
        }
      } else if (typeof editingId === 'number') {
        const { spots_available, ...updateData } = retreatData;
        try {
          await updateRetreat({ id: String(editingId), body: fromLegacyRetreatPayload(updateData) }).unwrap();
          setAllRetreats(prev => prev.map(r => 
            r.id === editingId ? { ...r, ...updateData, spots_available: r.spots_available } : r
          ));
        } catch (error) {
          console.error('Error auto-saving draft:', error);
          return;
        }
      }

      setLastSaved(new Date());
    } catch (error) {
      console.error('Unexpected error in auto-save:', error);
    } finally {
      setAutoSaving(false);
    }
  }, [
    user,
    editingId,
    formData.title,
    formData.description,
    formData.location,
    formData.date,
    formData.duration,
    formData.level,
    formData.price,
    formData.totalSpots,
    formData.image,
    formData.includes,
    itineraryBlocks,
    venueFees,
    foodBudget,
    locationImages,
    autoSaveDraftId
  ]);

  // Auto-save effect - debounced save when form data changes
  useEffect(() => {
    // Only auto-save when editing
    if (editingId === null) return;
    
    // Mark that there are unsaved changes
    hasUnsavedChangesRef.current = true;

    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // Set new timer - auto-save after 2 seconds of inactivity
    autoSaveTimerRef.current = setTimeout(() => {
      if (hasUnsavedChangesRef.current) {
        autoSaveDraft();
      }
    }, 2000);

    // Cleanup timer on unmount or when editingId changes
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [
    formData.title,
    formData.description,
    formData.location,
    formData.date,
    formData.duration,
    formData.level,
    formData.price,
    formData.totalSpots,
    formData.image,
    formData.includes,
    venueFees,
    foodBudget,
    itineraryBlocks,
    locationImages,
    editingId,
    autoSaveDraft
  ]);

  // Cleanup auto-save timer when canceling or closing edit
  useEffect(() => {
    if (editingId === null) {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      setAutoSaveDraftId(null);
      hasUnsavedChangesRef.current = false;
    }
  }, [editingId]);

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
      const publicUrl = await uploadFile({ bucket: "retreat-images", file }).unwrap();

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
      setAutoSaveDraftId(null); // Reset auto-save draft ID when editing existing
      setLastSaved(null);
      // Load venue fees and food budget
      if ((retreat as any).venue_fees !== null && (retreat as any).venue_fees !== undefined) {
        setVenueFees(Number((retreat as any).venue_fees));
      } else {
        setVenueFees(0);
      }
      if ((retreat as any).food_budget !== null && (retreat as any).food_budget !== undefined) {
        setFoodBudget(Number((retreat as any).food_budget));
      } else {
        setFoodBudget(0);
      }
      // Load location images
      if ((retreat as any).location_images && Array.isArray((retreat as any).location_images)) {
        setLocationImages((retreat as any).location_images);
      } else {
        setLocationImages([]);
      }
      // Convert schedule to itinerary blocks if schedule exists
      if (retreat.schedule && Array.isArray(retreat.schedule) && retreat.schedule.length > 0) {
        // Check if schedule is in new format (has itinerary_blocks) or old format
        if ((retreat as any).itinerary_blocks && Array.isArray((retreat as any).itinerary_blocks)) {
          setItineraryBlocks((retreat as any).itinerary_blocks);
        } else {
          // Convert old format to new format
          const converted = convertScheduleToItinerary(retreat.schedule);
          if (converted.length > 0) {
            setItineraryBlocks(converted);
          }
        }
      } else {
        setItineraryBlocks([]);
      }
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
      setAutoSaveDraftId(null);
      setLastSaved(null);
      setVenueFees(0);
      setFoodBudget(0);
      setItineraryBlocks([]);
      setLocationImages([]);
    }
  };

  const cancelEditing = () => {
    // Clear auto-save timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    
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
    setItineraryBlocks([]);
    setVenueFees(0);
    setFoodBudget(0);
    setLocationImages([]);
    setAutoSaveDraftId(null);
    setLastSaved(null);
    hasUnsavedChangesRef.current = false;
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

  const handleLocationImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setUploadingLocationImage(true);

    try {
      const publicUrl = await uploadFile({ bucket: "retreat-location-images", file }).unwrap();
      setLocationImages(prev => [...prev, publicUrl]);

      toast({
        title: "Success",
        description: "Location image uploaded successfully",
      });
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while uploading image",
        variant: "destructive",
      });
    } finally {
      setUploadingLocationImage(false);
      // Reset file input
      e.target.value = '';
    }
  };

  const removeLocationImage = (index: number) => {
    setLocationImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async (published?: boolean) => {
    if (!user) return;

    setSaving(true);

    try {
      // Convert itinerary blocks to schedule format for backward compatibility
      const scheduleData = itineraryBlocks.length > 0
        ? convertItineraryToSchedule(itineraryBlocks)
        : [];

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
        schedule: scheduleData,
        itinerary_blocks: itineraryBlocks.length > 0 ? itineraryBlocks : null,
        venue_fees: venueFees || 0,
        food_budget: foodBudget || 0,
        location_images: locationImages.length > 0 ? locationImages : null,
        published: published !== undefined ? published : (formData.published || false),
        instructor_id: user.id,
      };

      if (editingId === 'new') {
        // If auto-save created a draft, update it instead of creating new
        const draftIdToUse = autoSaveDraftId || editingId;
        
        if (autoSaveDraftId) {
          // Update existing auto-saved draft
          const { spots_available, ...updateData } = retreatData;
          try {
            await updateRetreat({ id: String(autoSaveDraftId), body: fromLegacyRetreatPayload(updateData) }).unwrap();
          } catch (error) {
            console.error('Error updating retreat:', error);
            toast({
              title: "Error",
              description: error instanceof Error ? error.message : "Failed to update retreat",
              variant: "destructive",
            });
            return;
          }

          {
            // Mark first_event_free_used if this was their first event and they were eligible
            if (retreatData.published && firstEventFreeEligible && !firstEventFreeUsed && isFirstEvent) {
              await markFirstEventFreeUsed().unwrap();
              setFirstEventFreeUsed(true);
            }

            // Create passive commission when event is published (for organizer referrals)
            if (retreatData.published && user.id) {
              const revenue = (retreatData.price || 0) * (retreatData.total_spots || 0);
              const basePlatformFee = revenue * instructorFeeRate;
              let platformFee = basePlatformFee;
              if (firstEventFreeCampaignActive && firstEventFreeEligible && !firstEventFreeUsed && isFirstEvent) {
                platformFee = 0;
              } else if (instructorDiscount?.type === 'percentage' && instructorDiscount.value >= 100) {
                platformFee = 0;
              }
              
              const { createPassiveCommission } = await import('@/lib/affiliate-tracking');
              createPassiveCommission(
                user.id,
                'event_published',
                revenue,
                platformFee,
                autoSaveDraftId?.toString() || ''
              ).catch(err => console.error('Error creating passive commission:', err));
            }

            // Send email notifications if retreat is published
            if (retreatData.published) {
              const updatedRetreat = allRetreats.find(r => r.id === autoSaveDraftId);
              if (updatedRetreat) {
                notifyStudentsAboutNewRetreat({
                  id: updatedRetreat.id,
                  title: updatedRetreat.title,
                  description: updatedRetreat.description || "",
                  image: updatedRetreat.image || "",
                  date: updatedRetreat.date,
                  location: updatedRetreat.location,
                  price: Number(updatedRetreat.price) || 0,
                  instructor_id: updatedRetreat.instructor_id,
                }).catch((err) => {
                  console.error('Failed to send email notifications:', err);
                });
              }
            }
            
            toast({
              title: "Success",
              description: retreatData.published ? "Retreat published successfully!" : "Retreat saved as draft!",
            });
            setAllRetreats(prev => prev.map(r => 
              r.id === autoSaveDraftId ? { ...r, ...updateData, spots_available: r.spots_available } : r
            ));
            cancelEditing();
          }
        } else {
          try {
            const created = await createRetreat(fromLegacyRetreatPayload(retreatData)).unwrap();
            const data = toLegacyRetreat(created) as Retreat;
            // Mark first_event_free_used if this was their first event and they were eligible
            if (data.published && firstEventFreeEligible && !firstEventFreeUsed && isFirstEvent) {
              await markFirstEventFreeUsed().unwrap();
              setFirstEventFreeUsed(true);
            }

            // Create passive commission when event is published (for organizer referrals)
            if (data.published && user.id) {
              const revenue = (retreatData.price || 0) * (retreatData.total_spots || 0);
              const basePlatformFee = revenue * instructorFeeRate;
              let platformFee = basePlatformFee;
              if (firstEventFreeCampaignActive && firstEventFreeEligible && !firstEventFreeUsed && isFirstEvent) {
                platformFee = 0;
              } else if (instructorDiscount?.type === 'percentage' && instructorDiscount.value >= 100) {
                platformFee = 0;
              }
              
              const { createPassiveCommission } = await import('@/lib/affiliate-tracking');
              createPassiveCommission(
                user.id,
                'event_published',
                revenue,
                platformFee,
                data.id.toString()
              ).catch(err => console.error('Error creating passive commission:', err));
            }

            // Send email notifications if retreat is published
            if (data.published) {
              // Call email notification in background (don't wait for it)
              notifyStudentsAboutNewRetreat({
                id: data.id,
                title: data.title,
                description: data.description || "",
                image: data.image || "",
                date: data.date,
                location: data.location,
                price: Number(data.price) || 0,
                instructor_id: data.instructor_id,
              }).catch((err) => {
                console.error('Failed to send email notifications:', err);
                // Don't show error to user - email sending is non-critical
              });
            }
            
            toast({
              title: "Success",
              description: retreatData.published ? "Retreat published successfully!" : "Retreat saved as draft!",
            });
            setAllRetreats(prev => [data, ...prev]);
            cancelEditing();
          } catch (error) {
            console.error('Error creating retreat:', error);
            toast({
              title: "Error",
              description: error instanceof Error ? error.message : "Failed to create retreat",
              variant: "destructive",
            });
          }
        }
      } else if (typeof editingId === 'number') {
        const { spots_available, ...updateData } = retreatData;
        try {
          await updateRetreat({ id: String(editingId), body: fromLegacyRetreatPayload(updateData) }).unwrap();
        } catch (error) {
          console.error('Error updating retreat:', error);
          toast({
            title: "Error",
            description: error instanceof Error ? error.message : "Failed to update retreat",
            variant: "destructive",
          });
          return;
        }

        {
          // Check if retreat was just published (update from draft to published)
          const wasDraft = allRetreats.find(r => r.id === editingId)?.published === false;
          const isNowPublished = retreatData.published;
          
          // Mark first_event_free_used if this was their first event and they were eligible
          if (isNowPublished && firstEventFreeEligible && !firstEventFreeUsed && isFirstEvent) {
            await markFirstEventFreeUsed().unwrap();
            setFirstEventFreeUsed(true);
          }

          // Create passive commission when event is published (for organizer referrals)
          if (isNowPublished && user.id) {
            const revenue = (retreatData.price || 0) * (retreatData.total_spots || 0);
            const basePlatformFee = revenue * instructorFeeRate;
            let platformFee = basePlatformFee;
            if (firstEventFreeCampaignActive && firstEventFreeEligible && !firstEventFreeUsed && isFirstEvent) {
              platformFee = 0;
            } else if (instructorDiscount?.type === 'percentage' && instructorDiscount.value >= 100) {
              platformFee = 0;
            }
            
            const { createPassiveCommission } = await import('@/lib/affiliate-tracking');
            createPassiveCommission(
              user.id,
              'event_published',
              revenue,
              platformFee,
              editingId.toString()
            ).catch(err => console.error('Error creating passive commission:', err));
          }
          
          // Send email notifications if retreat was just published
          if (wasDraft && isNowPublished) {
            const updatedRetreatRaw = await fetchRetreatById(String(editingId)).unwrap();
            const updatedRetreat = toLegacyRetreat(updatedRetreatRaw) as Retreat;
            
            if (updatedRetreat) {
              // Call email notification in background (don't wait for it)
              notifyStudentsAboutNewRetreat({
                id: updatedRetreat.id,
                title: updatedRetreat.title,
                description: updatedRetreat.description || "",
                image: updatedRetreat.image || "",
                date: updatedRetreat.date,
                location: updatedRetreat.location,
                price: Number(updatedRetreat.price) || 0,
                instructor_id: updatedRetreat.instructor_id,
              }).catch((err) => {
                console.error('Failed to send email notifications:', err);
                // Don't show error to user - email sending is non-critical
              });
            }
          }
          
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
      if (!retreat.published) {
        await publishRetreat(String(id)).unwrap();
      } else {
        await updateRetreat({ id: String(id), body: { status: "draft", published: false } }).unwrap();
      }

      const newPublishedStatus = !retreat.published;
        setAllRetreats(prev => prev.map(r => 
          r.id === id ? { ...r, published: newPublishedStatus } : r
        ));
        
        // Send email notifications if retreat was just published
        if (newPublishedStatus) {
          // Call email notification in background (don't wait for it)
          notifyStudentsAboutNewRetreat({
            id: retreat.id,
            title: retreat.title,
            description: retreat.description || "",
            image: retreat.image || "",
            date: retreat.date,
            location: retreat.location,
            price: Number(retreat.price) || 0,
            instructor_id: retreat.instructor_id,
          }).catch((err) => {
            console.error('Failed to send email notifications:', err);
            // Don't show error to user - email sending is non-critical
          });
        }
        
        toast({
          title: "Success",
          description: newPublishedStatus ? "Retreat published successfully!" : "Retreat unpublished",
        });
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const handleDuplicate = async (retreat: Retreat) => {
    if (!user) return;

    try {
      // Navigate to the new retreat form with duplicated data in state
      navigate('/instructor/retreats/new', {
        state: {
          duplicateFrom: {
            title: `Copy of ${retreat.title}`,
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
            venue_fees: retreat.venue_fees,
            food_budget: retreat.food_budget,
            itinerary_blocks: retreat.itinerary_blocks,
            location_images: retreat.location_images,
            discount_coupon: retreat.discount_coupon,
            price_variants: retreat.price_variants,
            add_ons: retreat.add_ons,
            content_cards: retreat.content_cards,
          }
        }
      });

      toast({
        title: "Duplicating Retreat",
        description: "Opening retreat form with all fields copied. You can now modify the details.",
      });
    } catch (error: any) {
      console.error('Error duplicating retreat:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to duplicate retreat. Please try again.",
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
      await deleteRetreat(String(id)).unwrap();

      setAllRetreats(prev => prev.filter(r => r.id !== id));
      toast({
        title: "Success",
        description: "Retreat deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting retreat:', error);
      toast({
        title: "Error",
        description: "Failed to delete retreat",
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
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-card-foreground">
                {isNew ? "Create New Retreat" : "Edit Retreat"}
              </h2>
              {/* Auto-save indicator */}
              {editingId !== null && (
                <div className="flex items-center gap-2 mt-1">
                  {autoSaving ? (
                    <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                      Saving draft...
                    </span>
                  ) : lastSaved ? (
                    <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3" />
                      Draft saved {format(lastSaved, "h:mm a")}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      Changes will be saved automatically
                    </span>
                  )}
                </div>
              )}
            </div>
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
              
              {/* Location Images Upload */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-foreground">Location Photos</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLocationImageUpload}
                    disabled={uploadingLocationImage}
                    className="hidden"
                    id="location-image-upload-dashboard"
                  />
                  <label htmlFor="location-image-upload-dashboard">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={uploadingLocationImage}
                      className="w-full sm:w-auto"
                      asChild
                    >
                      <span>
                        <Upload className="w-4 h-4 mr-2" />
                        {uploadingLocationImage ? "Uploading..." : "Upload Photo"}
                      </span>
                    </Button>
                  </label>
                </div>
                
                {/* Horizontal Scrolling Image Gallery */}
                {locationImages.length > 0 && (
                  <div className="overflow-x-auto pb-2 -mx-2 px-2">
                    <div className="flex gap-3 min-w-max">
                      {locationImages.map((imageUrl, index) => (
                        <div key={index} className="relative flex-shrink-0 group">
                          <img
                            src={imageUrl}
                            alt={`Location ${index + 1}`}
                            className="w-32 h-32 sm:w-40 sm:h-40 object-cover rounded-lg border"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => removeLocationImage(index)}
                            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
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
                <Label>Capacity</Label>
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

          {/* Pricing Breakdown */}
          {(formData.price && formData.price > 0 && formData.totalSpots > 0) && (
            <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
              <h3 className="text-lg font-semibold text-card-foreground">Financial Breakdown</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm font-medium">Revenue</span>
                  <span className="text-sm font-semibold">
                    ${((formData.price || 0) * (formData.totalSpots || 0)).toFixed(2)}
                  </span>
                </div>
                
                <div className="pt-2">
                  <h3 className="text-sm font-semibold text-card-foreground mb-3">Costs</h3>
                </div>
                
                {(() => {
                  const revenue = (formData.price || 0) * (formData.totalSpots || 0);
                  const basePlatformFee = revenue * instructorFeeRate;
                  const feePercent = platformSettings?.platform_fee_rate_instructor ?? 12.4;
                  
                  // FIRST EVENT FREE: If organizer is eligible, campaign is active, and this is their first event
                  let platformFee = basePlatformFee;
                  if (firstEventFreeCampaignActive && firstEventFreeEligible && !firstEventFreeUsed && isFirstEvent && editingId === null) {
                    platformFee = 0; // 100% platform fee waiver for first event
                  } else if (instructorDiscount?.type === 'percentage') {
                    const discountValue = instructorDiscount.value;
                    if (discountValue >= 100) {
                      platformFee = 0; // 100% discount = no platform fee
                    } else if (discountValue > 0) {
                      // Apply discount: reduce platform fee by discount percentage
                      platformFee = basePlatformFee * (1 - (discountValue / 100));
                    }
                  }
                  
                  const hasDiscount = platformFee < basePlatformFee;
                  const discountPercent = hasDiscount ? ((1 - (platformFee / basePlatformFee)) * 100).toFixed(1) : '0';
                  
                  return (
                    <div className="flex items-center justify-between py-2 border-b">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {hasDiscount ? `Platform Fee (${discountPercent}% Discount Applied)` : `-${feePercent}% Platform Fee`}
                        </span>
                        {hasDiscount && (
                          <span className="text-xs text-muted-foreground mt-0.5">
                            {firstEventFreeCampaignActive && firstEventFreeEligible && !firstEventFreeUsed && isFirstEvent && editingId === null
                              ? 'First Event Free (Admin Granted)'
                              : instructorDiscount
                              ? `Organizer: ${instructorDiscount.value}% discount`
                              : ''}
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-semibold text-destructive">
                        -${platformFee.toFixed(2)}
                      </span>
                    </div>
                  );
                })()}
                
                <div className="space-y-2">
                  <Label>Location/Venue Fees ($)</Label>
                  <p className="text-xs text-muted-foreground">
                    Enter the venue cost you found (e.g., from Airbnb or venue booking)
                  </p>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={venueFees || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      setVenueFees(value === "" ? 0 : Number(value));
                    }}
                    placeholder="0.00"
                  />
                </div>
                
                {venueFees > 0 && (
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-sm font-medium">Location/Venue Fees</span>
                    <span className="text-sm font-semibold text-destructive">
                      -${venueFees.toFixed(2)}
                    </span>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label>Food Budget ($)</Label>
                  <p className="text-xs text-muted-foreground">
                    If coordinating food for guests, enter budget amount (enter $0 if not applicable)
                  </p>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={foodBudget || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFoodBudget(value === "" ? 0 : Number(value));
                    }}
                    placeholder="0.00"
                  />
                </div>
                
                {foodBudget > 0 && (
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-sm font-medium">Food Budget</span>
                    <span className="text-sm font-semibold text-destructive">
                      -${foodBudget.toFixed(2)}
                    </span>
                  </div>
                )}
                
                {(() => {
                  const revenue = (formData.price || 0) * (formData.totalSpots || 0);
                  const basePlatformFee = revenue * instructorFeeRate;
                  // FIRST EVENT FREE: If organizer is eligible, campaign is active, and this is their first event
                  let platformFee = basePlatformFee;
                  if (firstEventFreeCampaignActive && firstEventFreeEligible && !firstEventFreeUsed && isFirstEvent && editingId === null) {
                    platformFee = 0; // 100% platform fee waiver for first event
                  } else if (instructorDiscount?.type === 'percentage' && instructorDiscount.value >= 100) {
                    platformFee = 0;
                  }
                  const totalPayout = revenue - platformFee - venueFees - foodBudget;
                  
                  return (
                    <div className="flex items-center justify-between py-3 pt-4 border-t-2 border-primary">
                      <span className="text-base font-bold">Total Revenue Payout</span>
                      <span className="text-lg font-bold text-primary">
                        ${totalPayout.toFixed(2)}
                      </span>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Itinerary Builder */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <ItineraryBuilder
                blocks={itineraryBlocks}
                onChange={setItineraryBlocks}
                user={user}
              />
            </CardContent>
          </Card>

          {/* Publish Status */}
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-card-foreground">Status</h3>
              <Badge variant={formData.published ? "default" : "secondary"}>
                {formData.published ? "Published" : "Draft"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {formData.published 
                ? "This retreat is LIVE and visible to students" 
                : "Not ready to publish? Save your draft"}
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
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-background px-6 py-8 border-b border-[#459394]/20">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-[#387C7F]">Organizer Dashboard</h1>
            <p className="text-muted-foreground text-lg">Manage your events</p>
          </div>
        </div>
      </div>

      {/* Stats - Only show when not editing */}
      {editingId === null && (
        <div className="px-6 mt-6 mb-6">
          {/* Stats Grid - Responsive: 1 col mobile, 2 col tablet, 3 col desktop */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            <StatCard
              icon={DollarSign}
              value={`$${totalRevenue.toLocaleString()}`}
              label="Total Revenue"
              variant="revenue"
            />
            <StatCard
              icon={CheckCircle2}
              value={completedRetreats}
              label="Completed Retreats"
              variant="default"
            />
            <StatCard
              icon={Users}
              value={studentsServed}
              label="Students Taught"
              variant="students"
            />
            <StatCard
              icon={TrendingUp}
              value={`$${expectedRevenue.toLocaleString()}`}
              label="Expected Revenue"
              variant="revenue"
            />
            <StatCard
              icon={BookOpen}
              value={publishedCount}
              label="Published Retreats"
              variant="default"
            />
            <StatCard
              icon={CalendarIcon}
              value={bookedSeats}
              label="Booked Seats"
              variant="bookings"
            />
          </div>

          {/* Payout Statement */}
          {totalRevenue > 0 && (
            <PayoutCard
              totalRevenue={totalRevenue}
              serviceFee={totalRevenue * 0.1229}
              payout={totalRevenue * (1 - 0.1229)}
              className="mb-6"
            />
          )}

          {/* Retreat Draft (Left) and Instructor Link (Right) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Retreat Draft - Left Side */}
            <StatCard
              icon={FileText}
              value={draftCount}
              label="Retreat Drafts"
              variant="default"
            />

            {/* Share Instructor Link - Right Side */}
            <div className="bg-white rounded-[18px] p-6 border-2 border-[#459394]/25 shadow-[0_1px_3px_0_rgb(0_0_0_/_0.05),0_1px_2px_-1px_rgb(0_0_0_/_0.05)] transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:border-[#459394]/45 hover:shadow-[0_4px_6px_-1px_rgb(0_0_0_/_0.1),0_2px_4px_-2px_rgb(0_0_0_/_0.1)]">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg border border-[#459394]/20" style={{ color: "#459394" }}>
                    <Share2 className="w-4 h-4" strokeWidth={2} />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm tracking-wide" style={{ color: "#459394", letterSpacing: "0.025em" }}>
                  Share the Link
                </p>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[36px] font-bold leading-none" style={{ color: "#0F172A" }}>
                    {invitesCount}
                  </span>
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
            </div>
          </div>
        </div>
      )}

      {/* Main Content with Tabs */}
      <div className="px-6 max-w-6xl mx-auto">
        {editingId === null && (
          <Tabs defaultValue="retreats" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="retreats" className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" />
                Retreats
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                User Management
              </TabsTrigger>
            </TabsList>

            <TabsContent value="retreats" className="space-y-6">
              {loading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground text-lg">Loading retreats...</p>
                </div>
              ) : (
                <>
                  {/* Note: Form creation moved to /instructor/retreats/new - use the + button in bottom nav */}

                  {/* All Retreats (Published and Drafts) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {allRetreats.map((retreat) => {

              return (
                <Card key={retreat.id} className="overflow-hidden">
                  <div className="relative">
                    <img
                      src={retreat.image || "/placeholder.svg"}
                      alt={retreat.title}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute top-3 right-3 flex gap-2 items-center">
                      {retreat.published && (
                        <Button
                          variant="secondary"
                          size="sm"
                          className="bg-white/90 hover:bg-white text-foreground shadow-md backdrop-blur-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSharingRetreat(retreat);
                          }}
                          title="Share this retreat"
                        >
                          <Share2 className="w-4 h-4 mr-1.5" />
                          Share
                        </Button>
                      )}
                      <Badge className={retreat.published ? "bg-green-500 text-white font-semibold" : "bg-gray-400 text-white font-semibold"}>
                        {retreat.published ? "LIVE" : "DRAFT"}
                      </Badge>
                    </div>
                  </div>
                  
                  <CardContent className="p-5 relative">
                    <h3 className="text-xl font-semibold text-card-foreground mb-4">{retreat.title}</h3>
                    
                    <div className="flex flex-col gap-2 mb-4">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/instructor/retreats/${retreat.id}/edit`)}
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDuplicate(retreat)}
                        className="w-full"
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Duplicate
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
                  </div>

            {allRetreats.length === 0 && editingId === null && (
              <div className="text-center py-8">
                <p className="text-muted-foreground text-lg">No retreats yet. Create your first one!</p>
              </div>
            )}
          </>
        )}
        </TabsContent>

        <TabsContent value="users">
          <UserManagement />
        </TabsContent>
      </Tabs>
        )}
      </div>

      {/* Share Dialog */}
      {sharingRetreat && (
        <ShareDialog
          open={!!sharingRetreat}
          onOpenChange={(open) => !open && setSharingRetreat(null)}
          retreat={{
            id: sharingRetreat.id,
            title: sharingRetreat.title,
            description: sharingRetreat.description,
            image: sharingRetreat.image,
            price: sharingRetreat.price,
            location: sharingRetreat.location,
            date: sharingRetreat.date,
          }}
          userId={user?.id}
        />
      )}

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default InstructorDashboard;
