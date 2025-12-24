import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Upload, MapPin, ExternalLink, Calendar as CalendarIcon, X, Save, Edit, Trash2, Eye, EyeOff, CheckCircle2, Share2, Plus, DollarSign, CreditCard, Users, Copy } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { DateRange } from "react-day-picker";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { notifyStudentsAboutNewRetreat } from "@/lib/email-notifications";
import { ItineraryBuilder, ItineraryBlock } from "@/components/ItineraryBuilder";
import { VenueSelector } from "@/components/VenueSelector";
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
  deposit_amount?: number | null;
  deposit_refundable?: boolean | null;
  deposit_refund_days_before?: number | null;
  payment_days_before_event?: number | null;
  full_payment_non_refundable?: boolean | null;
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
  deposit_amount?: number | null;
  deposit_refundable?: boolean | null;
  deposit_refund_days_before?: number | null;
  payment_days_before_event?: number | null;
  full_payment_non_refundable?: boolean | null;
  description: string;
  image: string;
  includes: string[];
  schedule: { day: string; activities: string }[];
  published: boolean;
  discount_coupon?: {
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  max_uses?: number;
  expires_at?: string;
} | null;
  price_variants?: { id: string; name: string; price: number; description?: string }[];
  add_ons?: { id: string; name: string; price: number; description?: string; required?: boolean }[];
  content_cards?: ContentCard[];
}

// Helper function to parse date string like "Nov 5-8, 2025" to date range
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

// Helper function to format date range to "Nov 5-8, 2025" format
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

const InstructorRetreatForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const { role, user } = useAuth();
  const { toast } = useToast();
  
  const [draftRetreats, setDraftRetreats] = useState<Retreat[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | 'new' | null>(id ? Number(id) : 'new');
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Auto-save state
  const [autoSaving, setAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [autoSaveDraftId, setAutoSaveDraftId] = useState<number | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasUnsavedChangesRef = useRef(false);

  const [formData, setFormData] = useState<FormData>({
    title: "",
    level: "Beginner",
    location: "https://maps.app.goo.gl/GNhCfeCM7CHMpHW5A",
    date: "",
    duration: "",
    totalSpots: 0,
    price: 0,
    deposit_amount: null,
    deposit_refundable: false,
    deposit_refund_days_before: 7,
    payment_days_before_event: 7,
    full_payment_non_refundable: false,
    description: "",
    image: "",
    includes: [],
    schedule: [],
    published: false,
    discount_coupon: null,
    price_variants: [],
    add_ons: [],
    content_cards: [],
  });

  const [includeItem, setIncludeItem] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [venueFees, setVenueFees] = useState<number>(0);
  const [foodBudget, setFoodBudget] = useState<number>(0);
  const [itineraryBlocks, setItineraryBlocks] = useState<ItineraryBlock[]>([]);
  const [locationImages, setLocationImages] = useState<string[]>([]);
  const [uploadingLocationImage, setUploadingLocationImage] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState<any>(null);
  const [newPriceVariant, setNewPriceVariant] = useState({ name: "", price: "", description: "" });
  const [newAddOn, setNewAddOn] = useState({ name: "", price: "", description: "", required: false });
  const [discountCoupon, setDiscountCoupon] = useState({
    code: "",
    type: 'percentage' as 'percentage' | 'fixed',
    value: "",
    max_uses: "",
    expires_at: ""
  });
  const [contentCards, setContentCards] = useState<ContentCard[]>([]);
  const [newContentCard, setNewContentCard] = useState({ 
    title: "", 
    description: "",
    images: [] as string[],
    videos: [] as string[]
  });
  const [uploadingContentCardImage, setUploadingContentCardImage] = useState(false);
  const [sharingRetreat, setSharingRetreat] = useState<Retreat | null>(null);
  const [uploadingContentCardVideo, setUploadingContentCardVideo] = useState(false);
  const [newContentCardImages, setNewContentCardImages] = useState<string[]>([]);
  const [newContentCardVideos, setNewContentCardVideos] = useState<string[]>([]);

  // Only show this page to instructors
  if (role !== 'instructor') {
    return null;
  }

  // Fetch draft retreats
  useEffect(() => {
    const fetchDrafts = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('retreats')
          .select('*')
          .eq('instructor_id', user.id)
          .eq('published', false)
          .order('updated_at', { ascending: false });

        if (error) {
          console.error('Error fetching drafts:', error);
        } else {
          setDraftRetreats(data || []);
        }
      } catch (error) {
        console.error('Unexpected error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDrafts();
  }, [user]);

  // Handle duplicate data from navigation state
  useEffect(() => {
    if (editingId === 'new' && location.state?.duplicateFrom && user) {
      const duplicateData = location.state.duplicateFrom;
      
      setFormData({
        title: duplicateData.title || "Copy of Retreat",
        level: duplicateData.level || "Beginner",
        location: duplicateData.location || "",
        date: duplicateData.date || "",
        duration: duplicateData.duration || "",
        totalSpots: duplicateData.totalSpots || 0,
        price: duplicateData.price || 0,
        deposit_amount: duplicateData.deposit_amount || null,
        deposit_refundable: duplicateData.deposit_refundable || false,
        deposit_refund_days_before: duplicateData.deposit_refund_days_before || 7,
        payment_days_before_event: duplicateData.payment_days_before_event || null,
        full_payment_non_refundable: duplicateData.full_payment_non_refundable || false,
        description: duplicateData.description || "",
        image: duplicateData.image || "",
        includes: duplicateData.includes || [],
        schedule: duplicateData.schedule || [],
        published: false, // Always create duplicates as draft
        discount_coupon: duplicateData.discount_coupon || null,
        price_variants: duplicateData.price_variants || [],
        add_ons: duplicateData.add_ons || [],
        content_cards: duplicateData.content_cards || [],
      });

      if (duplicateData.date) {
        setDateRange(parseDateString(duplicateData.date));
      }
      if (duplicateData.image) {
        setImagePreview(duplicateData.image);
      }
      if (duplicateData.venue_fees !== null && duplicateData.venue_fees !== undefined) {
        setVenueFees(Number(duplicateData.venue_fees));
      } else {
        setVenueFees(0);
      }
      if (duplicateData.food_budget !== null && duplicateData.food_budget !== undefined) {
        setFoodBudget(Number(duplicateData.food_budget));
      } else {
        setFoodBudget(0);
      }
      if (duplicateData.location_images && Array.isArray(duplicateData.location_images)) {
        setLocationImages(duplicateData.location_images);
      } else {
        setLocationImages([]);
      }
      if (duplicateData.content_cards && Array.isArray(duplicateData.content_cards)) {
        setContentCards(duplicateData.content_cards);
      } else {
        setContentCards([]);
      }
      if (duplicateData.itinerary_blocks && Array.isArray(duplicateData.itinerary_blocks)) {
        setItineraryBlocks(duplicateData.itinerary_blocks);
      } else if (duplicateData.schedule && Array.isArray(duplicateData.schedule) && duplicateData.schedule.length > 0) {
        const converted = convertScheduleToItinerary(duplicateData.schedule);
        if (converted.length > 0) {
          setItineraryBlocks(converted);
        }
      } else {
        setItineraryBlocks([]);
      }

      // Clear the state to prevent re-applying on re-renders
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [editingId, location.state, user, navigate, location.pathname]);

  // Fetch retreat data when editing
  useEffect(() => {
    const fetchRetreat = async () => {
      if (!editingId || editingId === 'new' || !user) return;

      try {
        const { data, error } = await supabase
          .from('retreats')
          .select('*')
          .eq('id', Number(editingId))
          .eq('instructor_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching retreat:', error);
          toast({
            title: "Error",
            description: "Failed to load retreat data",
            variant: "destructive",
          });
          setEditingId(null);
        } else if (data) {
          setFormData({
            title: data.title,
            level: data.level,
            location: data.location,
            date: data.date,
            duration: data.duration,
            totalSpots: data.total_spots,
            price: data.price,
            deposit_amount: data.deposit_amount,
            deposit_refundable: data.deposit_refundable || false,
            deposit_refund_days_before: data.deposit_refund_days_before || 7,
            payment_days_before_event: data.payment_days_before_event,
            full_payment_non_refundable: data.full_payment_non_refundable || false,
            description: data.description,
            image: data.image,
            includes: data.includes || [],
            schedule: data.schedule || [],
            published: data.published || false,
            discount_coupon: data.discount_coupon,
            price_variants: data.price_variants || [],
            add_ons: data.add_ons || [],
            content_cards: data.content_cards || [],
          });
          if (data.image) setImagePreview(data.image);
          if (data.date) setDateRange(parseDateString(data.date));
          if (data.venue_fees !== null && data.venue_fees !== undefined) {
            setVenueFees(Number(data.venue_fees));
          }
          if (data.food_budget !== null && data.food_budget !== undefined) {
            setFoodBudget(Number(data.food_budget));
          }
          if (data.location_images && Array.isArray(data.location_images)) {
            setLocationImages(data.location_images);
          }
          if (data.content_cards && Array.isArray(data.content_cards)) {
            setContentCards(data.content_cards);
          }
          if (data.schedule && Array.isArray(data.schedule) && data.schedule.length > 0) {
            if (data.itinerary_blocks && Array.isArray(data.itinerary_blocks)) {
              setItineraryBlocks(data.itinerary_blocks);
            } else {
              const converted = convertScheduleToItinerary(data.schedule);
              if (converted.length > 0) {
                setItineraryBlocks(converted);
              }
            }
          }
        }
      } catch (error) {
        console.error('Unexpected error:', error);
      }
    };

    fetchRetreat();
  }, [editingId, user, toast]);

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
    
    if (!formData.title.trim()) return;

    setAutoSaving(true);
    hasUnsavedChangesRef.current = false;

    try {
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
        deposit_amount: formData.deposit_amount,
        deposit_refundable: formData.deposit_refundable || false,
        deposit_refund_days_before: formData.deposit_refund_days_before || 7,
        payment_days_before_event: formData.payment_days_before_event,
        full_payment_non_refundable: formData.full_payment_non_refundable || false,
        total_spots: formData.totalSpots || 0,
        spots_available: formData.totalSpots || 0,
        image: formData.image || "",
        includes: formData.includes || [],
        schedule: scheduleData,
        itinerary_blocks: itineraryBlocks.length > 0 ? itineraryBlocks : null,
        venue_fees: venueFees || 0,
        food_budget: foodBudget || 0,
        location_images: locationImages.length > 0 ? locationImages : null,
        published: false,
        instructor_id: user.id,
        discount_coupon: formData.discount_coupon,
        price_variants: formData.price_variants && formData.price_variants.length > 0 ? formData.price_variants : null,
        add_ons: formData.add_ons && formData.add_ons.length > 0 ? formData.add_ons : null,
        content_cards: contentCards.length > 0 ? contentCards : null,
      };

      if (editingId === 'new') {
        if (autoSaveDraftId === null) {
          const { data, error } = await supabase
            .from('retreats')
            .insert([retreatData])
            .select()
            .single();

          if (error) {
            console.error('Error auto-saving draft:', error);
            return;
          }
          
          setAutoSaveDraftId(data.id);
          setEditingId(data.id);
          setDraftRetreats(prev => [data, ...prev]);
        } else {
          const { error } = await supabase
            .from('retreats')
            .update({
              ...retreatData,
              updated_at: new Date().toISOString(),
            })
            .eq('id', autoSaveDraftId)
            .eq('instructor_id', user.id);

          if (error) {
            console.error('Error auto-saving draft:', error);
            return;
          }

          setDraftRetreats(prev => prev.map(r => 
            r.id === autoSaveDraftId ? { ...r, ...retreatData } : r
          ));
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
          console.error('Error auto-saving draft:', error);
          return;
        }

        setDraftRetreats(prev => prev.map(r => 
          r.id === editingId ? { ...r, ...updateData, spots_available: r.spots_available } : r
        ));
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
    formData.deposit_amount,
    formData.deposit_refundable,
    formData.deposit_refund_days_before,
    formData.payment_days_before_event,
    formData.full_payment_non_refundable,
    formData.discount_coupon,
    formData.price_variants,
    formData.add_ons,
    contentCards,
    itineraryBlocks,
    venueFees,
    foodBudget,
    locationImages,
    autoSaveDraftId
  ]);

  // Auto-save effect - debounced save when form data changes
  useEffect(() => {
    if (editingId === null) return;
    
    hasUnsavedChangesRef.current = true;

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      if (hasUnsavedChangesRef.current) {
        autoSaveDraft();
      }
    }, 2000);

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
    formData.deposit_amount,
    formData.deposit_refundable,
    formData.deposit_refund_days_before,
    formData.payment_days_before_event,
    formData.full_payment_non_refundable,
    formData.discount_coupon,
    formData.price_variants,
    formData.add_ons,
    contentCards,
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
        deposit_amount: retreat.deposit_amount,
        deposit_refundable: retreat.deposit_refundable || false,
        deposit_refund_days_before: retreat.deposit_refund_days_before || 7,
        payment_days_before_event: retreat.payment_days_before_event,
        full_payment_non_refundable: retreat.full_payment_non_refundable || false,
        description: retreat.description,
        image: retreat.image,
        includes: retreat.includes || [],
        schedule: retreat.schedule || [],
        published: retreat.published || false,
        discount_coupon: retreat.discount_coupon,
        price_variants: retreat.price_variants || [],
        add_ons: retreat.add_ons || [],
        content_cards: retreat.content_cards || [],
      });
      setDateRange(parseDateString(retreat.date));
      setImagePreview("");
      setEditingId(retreat.id);
      setAutoSaveDraftId(null);
      setLastSaved(null);
      if (retreat.venue_fees !== null && retreat.venue_fees !== undefined) {
        setVenueFees(Number(retreat.venue_fees));
      } else {
        setVenueFees(0);
      }
      if (retreat.food_budget !== null && retreat.food_budget !== undefined) {
        setFoodBudget(Number(retreat.food_budget));
      } else {
        setFoodBudget(0);
      }
      if (retreat.location_images && Array.isArray(retreat.location_images)) {
        setLocationImages(retreat.location_images);
      } else {
        setLocationImages([]);
      }
      if (retreat.content_cards && Array.isArray(retreat.content_cards)) {
        setContentCards(retreat.content_cards);
      } else {
        setContentCards([]);
      }
      if (retreat.schedule && Array.isArray(retreat.schedule) && retreat.schedule.length > 0) {
        if (retreat.itinerary_blocks && Array.isArray(retreat.itinerary_blocks)) {
          setItineraryBlocks(retreat.itinerary_blocks);
        } else {
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
        discount_coupon: null,
        price_variants: [],
        add_ons: [],
        content_cards: [],
      });
      setDateRange(undefined);
      setImagePreview("");
      setIncludeItem("");
      setEditingId('new');
      setAutoSaveDraftId(null);
      setLastSaved(null);
      setVenueFees(0);
      setFoodBudget(0);
      setItineraryBlocks([]);
      setLocationImages([]);
      setSelectedVenue(null);
      setNewPriceVariant({ name: "", price: "", description: "" });
      setNewAddOn({ name: "", price: "", description: "", required: false });
      setContentCards([]);
      setNewContentCard({ title: "", description: "", images: [], videos: [] });
      setNewContentCardImages([]);
      setNewContentCardVideos([]);
    }
  };

  const cancelEditing = () => {
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
      deposit_amount: null,
      deposit_refundable: false,
      deposit_refund_days_before: 7,
      payment_days_before_event: 7,
      full_payment_non_refundable: false,
      description: "",
      image: "",
      includes: [],
      schedule: [],
      published: false,
      discount_coupon: null,
      price_variants: [],
      add_ons: [],
      content_cards: [],
    });
    setDateRange(undefined);
    setImagePreview("");
    setIncludeItem("");
    setItineraryBlocks([]);
    setVenueFees(0);
    setFoodBudget(0);
    setLocationImages([]);
    setSelectedVenue(null);
    setAutoSaveDraftId(null);
    setLastSaved(null);
    setNewPriceVariant({ name: "", price: "", description: "" });
    setNewAddOn({ name: "", price: "", description: "", required: false });
    setContentCards([]);
    setNewContentCard({ title: "", description: "", images: [], videos: [] });
    setNewContentCardImages([]);
    setNewContentCardVideos([]);
    hasUnsavedChangesRef.current = false;
    
    // Refresh drafts list
    if (user) {
      supabase
        .from('retreats')
        .select('*')
        .eq('instructor_id', user.id)
        .eq('published', false)
        .order('updated_at', { ascending: false })
        .then(({ data }) => {
          if (data) setDraftRetreats(data);
        });
    }
  };

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

  const handleLocationImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setUploadingLocationImage(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/locations/${Date.now()}.${fileExt}`;
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage
        .from('retreat-location-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Error uploading location image:', uploadError);
        toast({
          title: "Error",
          description: uploadError.message || "Failed to upload image",
          variant: "destructive",
        });
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('retreat-location-images')
        .getPublicUrl(filePath);

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
      e.target.value = '';
    }
  };

  const removeLocationImage = (index: number) => {
    setLocationImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleLocationChange = (location: string, venueData?: any) => {
    setFormData(prev => ({ ...prev, location }));
    setSelectedVenue(venueData || null);
  };

  const handleSave = async (published?: boolean) => {
    if (!user) return;

    setSaving(true);

    try {
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
        deposit_amount: formData.deposit_amount,
        deposit_refundable: formData.deposit_refundable || false,
        deposit_refund_days_before: formData.deposit_refund_days_before || 7,
        payment_days_before_event: formData.payment_days_before_event,
        full_payment_non_refundable: formData.full_payment_non_refundable || false,
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
        discount_coupon: formData.discount_coupon,
        price_variants: formData.price_variants && formData.price_variants.length > 0 ? formData.price_variants : null,
        add_ons: formData.add_ons && formData.add_ons.length > 0 ? formData.add_ons : null,
        content_cards: contentCards.length > 0 ? contentCards : null,
      };

      if (editingId === 'new') {
        if (autoSaveDraftId) {
          const { spots_available, ...updateData } = retreatData;
          const { error } = await supabase
            .from('retreats')
            .update({
              ...updateData,
              updated_at: new Date().toISOString(),
            })
            .eq('id', autoSaveDraftId)
            .eq('instructor_id', user.id);

          if (error) {
            console.error('Error updating retreat:', error);
            toast({
              title: "Error",
              description: error.message || "Failed to update retreat",
              variant: "destructive",
            });
          } else {
            if (retreatData.published) {
              const updatedRetreat = draftRetreats.find(r => r.id === autoSaveDraftId);
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
            setDraftRetreats(prev => prev.map(r => 
              r.id === autoSaveDraftId ? { ...r, ...updateData, spots_available: r.spots_available } : r
            ));
            cancelEditing();
          }
        } else {
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
            if (data.published) {
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
              });
            }
            
            toast({
              title: "Success",
              description: retreatData.published ? "Retreat published successfully!" : "Retreat saved as draft!",
            });
            if (!retreatData.published) {
              setDraftRetreats(prev => [data, ...prev]);
            }
            cancelEditing();
          }
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
          const wasDraft = draftRetreats.find(r => r.id === editingId)?.published === false;
          const isNowPublished = retreatData.published;
          
          if (wasDraft && isNowPublished) {
            const { data: updatedRetreat } = await supabase
              .from('retreats')
              .select('*')
              .eq('id', editingId)
              .single();
            
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
          if (!retreatData.published) {
            setDraftRetreats(prev => prev.map(r => 
              r.id === editingId ? { ...r, ...updateData, spots_available: r.spots_available } : r
            ));
          } else {
            setDraftRetreats(prev => prev.filter(r => r.id !== editingId));
          }
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
    const retreat = draftRetreats.find(r => r.id === id);
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
        const newPublishedStatus = !retreat.published;
        setDraftRetreats(prev => prev.map(r => 
          r.id === id ? { ...r, published: newPublishedStatus } : r
        ));
        
        // Send email notifications if retreat was just published
        if (newPublishedStatus) {
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
          });
        }
        
        toast({
          title: "Success",
          description: newPublishedStatus ? "Retreat published successfully!" : "Retreat unpublished",
        });
        
        // If published, remove from drafts list
        if (newPublishedStatus) {
          setDraftRetreats(prev => prev.filter(r => r.id !== id));
        }
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

  const handleDuplicate = async (retreat: Retreat) => {
    if (!user) return;

    try {
      // Copy all retreat data and modify title
      const duplicatedData = {
        title: `Copy of ${retreat.title}`,
        level: retreat.level,
        location: retreat.location,
        date: retreat.date, // User can change this
        duration: retreat.duration,
        totalSpots: retreat.total_spots,
        price: retreat.price,
        deposit_amount: retreat.deposit_amount,
        deposit_refundable: retreat.deposit_refundable || false,
        deposit_refund_days_before: retreat.deposit_refund_days_before || 7,
        payment_days_before_event: retreat.payment_days_before_event,
        full_payment_non_refundable: retreat.full_payment_non_refundable || false,
        description: retreat.description,
        image: retreat.image,
        includes: retreat.includes || [],
        schedule: retreat.schedule || [],
        published: false, // Always create as draft
        discount_coupon: retreat.discount_coupon,
        price_variants: retreat.price_variants || [],
        add_ons: retreat.add_ons || [],
        content_cards: retreat.content_cards || [],
      };

      // Set form data to the duplicated data
      setFormData(duplicatedData);
      setDateRange(parseDateString(retreat.date));
      setImagePreview("");
      
      // Set additional fields
      if (retreat.venue_fees !== null && retreat.venue_fees !== undefined) {
        setVenueFees(Number(retreat.venue_fees));
      } else {
        setVenueFees(0);
      }
      if (retreat.food_budget !== null && retreat.food_budget !== undefined) {
        setFoodBudget(Number(retreat.food_budget));
      } else {
        setFoodBudget(0);
      }
      if (retreat.location_images && Array.isArray(retreat.location_images)) {
        setLocationImages(retreat.location_images);
      } else {
        setLocationImages([]);
      }
      if (retreat.content_cards && Array.isArray(retreat.content_cards)) {
        setContentCards(retreat.content_cards);
      } else {
        setContentCards([]);
      }
      if (retreat.schedule && Array.isArray(retreat.schedule) && retreat.schedule.length > 0) {
        if (retreat.itinerary_blocks && Array.isArray(retreat.itinerary_blocks)) {
          setItineraryBlocks(retreat.itinerary_blocks);
        } else {
          const converted = convertScheduleToItinerary(retreat.schedule);
          if (converted.length > 0) {
            setItineraryBlocks(converted);
          }
        }
      } else {
        setItineraryBlocks([]);
      }

      // Open in edit mode as new retreat
      setEditingId('new');
      setAutoSaveDraftId(null);
      setLastSaved(null);
      setSelectedVenue(null);

      toast({
        title: "Retreat Duplicated",
        description: "All fields have been copied. You can now modify the title, dates, and other details.",
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

  const handleDelete = async (retreatId: number) => {
    if (!window.confirm('Are you sure you want to delete this retreat?')) {
      return;
    }

    if (!user) return;

    try {
      const { error } = await supabase
        .from('retreats')
        .delete()
        .eq('id', retreatId)
        .eq('instructor_id', user.id);

      if (error) {
        console.error('Error deleting retreat:', error);
        toast({
          title: "Error",
          description: "Failed to delete retreat",
          variant: "destructive",
        });
      } else {
        setDraftRetreats(prev => prev.filter(r => r.id !== retreatId));
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

  const addPriceVariant = () => {
    if (newPriceVariant.name.trim() && newPriceVariant.price.trim()) {
      const variant = {
        id: `variant-${Date.now()}`,
        name: newPriceVariant.name.trim(),
        price: Number(newPriceVariant.price),
        description: newPriceVariant.description.trim()
      };
      setFormData(prev => ({
        ...prev,
        price_variants: [...(prev.price_variants || []), variant]
      }));
      setNewPriceVariant({ name: "", price: "", description: "" });
    }
  };

  const removePriceVariant = (id: string) => {
    setFormData(prev => ({
      ...prev,
      price_variants: prev.price_variants?.filter(variant => variant.id !== id) || []
    }));
  };

  const addAddOn = () => {
    if (newAddOn.name.trim() && newAddOn.price.trim()) {
      const addOn = {
        id: `addon-${Date.now()}`,
        name: newAddOn.name.trim(),
        price: Number(newAddOn.price),
        description: newAddOn.description.trim(),
        required: newAddOn.required
      };
      setFormData(prev => ({
        ...prev,
        add_ons: [...(prev.add_ons || []), addOn]
      }));
      setNewAddOn({ name: "", price: "", description: "", required: false });
    }
  };

  const removeAddOn = (id: string) => {
    setFormData(prev => ({
      ...prev,
      add_ons: prev.add_ons?.filter(addOn => addOn.id !== id) || []
    }));
  };

  const addContentCard = () => {
    if (!newContentCard.title.trim()) return;
    
    const card: ContentCard = {
      id: `card-${Date.now()}`,
      title: newContentCard.title,
      description: newContentCard.description,
      images: newContentCardImages,
      videos: newContentCardVideos,
      order: contentCards.length
    };
    
    setContentCards(prev => [...prev, card]);
    setNewContentCard({ title: "", description: "", images: [], videos: [] });
    setNewContentCardImages([]);
    setNewContentCardVideos([]);
  };

  const handleNewContentCardImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setUploadingContentCardImage(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/content-cards/${Date.now()}.${fileExt}`;
      const filePath = `retreats/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('retreat-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Error uploading content card image:', uploadError);
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

      setNewContentCardImages(prev => [...prev, publicUrl]);

      toast({
        title: "Success",
        description: "Content card image uploaded successfully",
      });
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while uploading image",
        variant: "destructive",
      });
    } finally {
      setUploadingContentCardImage(false);
      e.target.value = '';
    }
  };

  const handleNewContentCardVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Check if video already exists
    if (newContentCardVideos.length >= 1) {
      toast({
        title: "Error",
        description: "Only one video can be uploaded per content section",
        variant: "destructive",
      });
      return;
    }

    if (!file.type.startsWith('video/')) {
      toast({
        title: "Error",
        description: "Please select a video file",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Video size must be less than 50MB",
        variant: "destructive",
      });
      return;
    }

    setUploadingContentCardVideo(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/content-cards/videos/${Date.now()}.${fileExt}`;
      const filePath = `retreats/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('retreat-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Error uploading content card video:', uploadError);
        toast({
          title: "Error",
          description: uploadError.message || "Failed to upload video",
          variant: "destructive",
        });
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('retreat-images')
        .getPublicUrl(filePath);

      // Replace existing video (only one allowed)
      setNewContentCardVideos([publicUrl]);

      toast({
        title: "Success",
        description: "Content card video uploaded successfully",
      });
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while uploading video",
        variant: "destructive",
      });
    } finally {
      setUploadingContentCardVideo(false);
      e.target.value = '';
    }
  };

  const removeNewContentCardImage = (imageUrl: string) => {
    setNewContentCardImages(prev => prev.filter(img => img !== imageUrl));
  };

  const removeNewContentCardVideo = (videoUrl: string) => {
    setNewContentCardVideos(prev => prev.filter(vid => vid !== videoUrl));
  };

  const removeContentCard = (id: string) => {
    setContentCards(prev => prev.filter(card => card.id !== id));
  };

  const updateContentCard = (id: string, updates: Partial<ContentCard>) => {
    setContentCards(prev => prev.map(card => 
      card.id === id ? { ...card, ...updates } : card
    ));
  };

  const handleContentCardImageUpload = async (cardId: string, e: React.ChangeEvent<HTMLInputElement>) => {
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

    setUploadingContentCardImage(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/content-cards/${Date.now()}.${fileExt}`;
      const filePath = `retreats/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('retreat-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Error uploading content card image:', uploadError);
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

      updateContentCard(cardId, {
        images: [...(contentCards.find(c => c.id === cardId)?.images || []), publicUrl]
      });

      toast({
        title: "Success",
        description: "Content card image uploaded successfully",
      });
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while uploading image",
        variant: "destructive",
      });
    } finally {
      setUploadingContentCardImage(false);
      e.target.value = '';
    }
  };

  const removeContentCardImage = (cardId: string, imageUrl: string) => {
    const card = contentCards.find(c => c.id === cardId);
    if (card) {
      updateContentCard(cardId, {
        images: card.images.filter(img => img !== imageUrl)
      });
    }
  };

  const renderForm = () => {
    const isNew = editingId === 'new';
    
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-card-foreground">
                {isNew ? "Create New Retreat" : "Edit Retreat"}
              </h2>
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
              <Label>Event Details Content Cards</Label>
              <div className="text-xs text-muted-foreground mb-2">
                Create organized content sections with titles, descriptions, and photos
              </div>
              
              {/* Add New Content Card */}
              <div className="border rounded-lg p-4 space-y-3 mb-4 bg-gradient-to-r from-purple-50 to-blue-50">
                <h4 className="font-medium text-card-foreground">Create New Content Section</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm">Section Title</Label>
                    <Input
                      value={newContentCard.title}
                      onChange={(e) => setNewContentCard(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g., Core Event Description"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Template</Label>
                    <Select onValueChange={(value) => {
                      const templates = {
                        "core": { title: "Core Event Description", description: "Describe the main event, what participants will experience, and what makes this retreat special.", images: [], videos: [] },
                        "lodging": { title: "Lodging, Rooms, Amenities", description: "Details about accommodation options, room types, and available amenities.", images: [], videos: [] },
                        "volunteer": { title: "Volunteer Opportunities", description: "Information about ways participants can contribute and get involved.", images: [], videos: [] },
                        "food": { title: "Food, Dietary Needs", description: "Meal plans, dietary accommodations, and food-related information.", images: [], videos: [] },
                        "medical": { title: "Medical", description: "Medical information, health requirements, emergency contacts, and any medical considerations for participants.", images: [], videos: [] },
                        "accessibility": { title: "Accessibility", description: "Information about accessibility features, accommodations for disabilities, and how to request additional support.", images: [], videos: [] }
                      };
                      if (templates[value as keyof typeof templates]) {
                        setNewContentCard(templates[value as keyof typeof templates]);
                      }
                    }}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Choose template" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="core">Core Event Description</SelectItem>
                        <SelectItem value="lodging">Lodging, Rooms, Amenities</SelectItem>
                        <SelectItem value="volunteer">Volunteer Opportunities</SelectItem>
                        <SelectItem value="food">Food, Dietary Needs</SelectItem>
                        <SelectItem value="medical">Medical</SelectItem>
                        <SelectItem value="accessibility">Accessibility</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label className="text-sm">Section Description</Label>
                  <Textarea
                    value={newContentCard.description}
                    onChange={(e) => setNewContentCard(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter the content for this section..."
                    rows={3}
                    className="mt-1"
                  />
                </div>
                
                {/* Media Upload for New Content Card */}
                <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-xl p-6 border border-slate-200/60 shadow-sm">
                  <div className="flex items-center justify-between mb-6 flex-col sm:flex-row gap-4 sm:gap-0">
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <Label className="text-sm font-semibold text-slate-700">Section Media</Label>
                        <p className="text-xs text-slate-500">Add photos and videos to bring your content to life</p>
                      </div>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto justify-center sm:justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('new-content-image')?.click()}
                        className="text-xs bg-white hover:bg-blue-50 border-blue-200 text-blue-700 hover:text-blue-800 transition-all duration-200 shadow-sm flex-1 sm:flex-none min-w-[100px]"
                      >
                        <Upload className="w-3 h-3 mr-1" />
                        <span className="hidden sm:inline">Add Images</span>
                        <span className="sm:hidden">Images</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('new-content-video')?.click()}
                        className="text-xs bg-white hover:bg-purple-50 border-purple-200 text-purple-700 hover:text-purple-800 transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex-1 sm:flex-none min-w-[100px]"
                        disabled={newContentCardVideos.length >= 1}
                      >
                        <Upload className="w-3 h-3 mr-1" />
                        <span className="hidden sm:inline">Add Video</span>
                        <span className="sm:hidden">Video</span>
                      </Button>
                    </div>
                  </div>
                  
                  {/* Images Section */}
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 bg-gradient-to-br from-green-400 to-blue-500 rounded-md flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-slate-600">Images</Label>
                        <p className="text-xs text-slate-400">Multiple photos allowed • Max 5MB each</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3 p-4 bg-white/60 rounded-lg border border-slate-200/50 min-h-[100px]">
                      {newContentCardImages.map((imageUrl, imgIndex) => (
                        <div key={imgIndex} className="relative group">
                          <div className="relative overflow-hidden rounded-lg border-2 border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
                            <img
                              src={imageUrl}
                              alt={`New content card ${imgIndex + 1}`}
                              className="w-24 h-24 object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
                            onClick={() => removeNewContentCardImage(imageUrl)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                      <div className="relative group">
                        <div className="w-24 h-24 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center hover:border-blue-400 hover:bg-blue-50/30 transition-all duration-200 cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleNewContentCardImageUpload}
                            className="hidden"
                            id="new-content-image"
                          />
                          <label
                            htmlFor="new-content-image"
                            className="cursor-pointer p-4"
                          >
                            <Plus className="w-6 h-6 text-slate-400 group-hover:text-blue-500 transition-colors duration-200" />
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Video Section */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 bg-gradient-to-br from-red-400 to-pink-500 rounded-md flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                        </svg>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-slate-600">Video</Label>
                        <p className="text-xs text-slate-400">Only one video allowed • Max 50MB</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3 p-4 bg-white/60 rounded-lg border border-slate-200/50 min-h-[100px]">
                      {newContentCardVideos.map((videoUrl, vidIndex) => (
                        <div key={vidIndex} className="relative group">
                          <div className="w-40 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg border-2 border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center overflow-hidden">
                            <div className="text-center">
                              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center mb-2 mx-auto group-hover:scale-110 transition-transform duration-200">
                                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                                </svg>
                              </div>
                              <p className="text-xs text-slate-600 font-medium">Video uploaded</p>
                              <p className="text-xs text-slate-400">Click to replace</p>
                            </div>
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
                            onClick={() => removeNewContentCardVideo(videoUrl)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                      {newContentCardVideos.length === 0 && (
                        <div className="relative group">
                          <div className="w-40 h-24 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center hover:border-purple-400 hover:bg-purple-50/30 transition-all duration-200 cursor-pointer">
                            <input
                              type="file"
                              accept="video/*"
                              onChange={handleNewContentCardVideoUpload}
                              className="hidden"
                              id="new-content-video"
                            />
                            <label
                              htmlFor="new-content-video"
                              className="cursor-pointer p-4"
                            >
                              <div className="text-center">
                                <Plus className="w-6 h-6 text-slate-400 group-hover:text-purple-500 transition-colors duration-200 mx-auto mb-1" />
                                <p className="text-xs text-slate-400 group-hover:text-purple-600 transition-colors duration-200">Add video</p>
                              </div>
                            </label>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {newContentCardImages.length === 0 && newContentCardVideos.length === 0 && (
                    <div className="text-center py-8 px-4 bg-gradient-to-br from-blue-50/50 to-purple-50/50 rounded-lg border border-blue-200/30">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <p className="text-sm font-medium text-slate-700 mb-1">No media added yet</p>
                      <p className="text-xs text-slate-500">Add photos and/or a video to make your content more engaging</p>
                    </div>
                  )}
                </div>
                <Button
                  onClick={addContentCard}
                  disabled={!newContentCard.title.trim()}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Content Section
                </Button>
              </div>

              {/* Display Existing Content Cards */}
              {contentCards.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-card-foreground">Content Sections ({contentCards.length})</h4>
                    <Badge variant="outline" className="text-xs">
                      {contentCards.length} section{contentCards.length !== 1 ? 's' : ''} created
                    </Badge>
                  </div>
                  {contentCards.map((card, index) => (
                    <div key={card.id} className="border rounded-lg p-4 bg-gradient-to-r from-green-50 to-blue-50">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <Input
                            value={card.title}
                            onChange={(e) => updateContentCard(card.id, { title: e.target.value })}
                            className="font-medium mb-2"
                            placeholder="Section title"
                          />
                          <Textarea
                            value={card.description}
                            onChange={(e) => updateContentCard(card.id, { description: e.target.value })}
                            rows={3}
                            placeholder="Section content..."
                            className="mb-3"
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeContentCard(card.id)}
                          className="ml-2 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      {/* Media Upload for Content Card */}
                      <div className="bg-gradient-to-br from-slate-50/50 to-blue-50/20 rounded-lg p-4 border border-slate-200/40">
                        <div className="flex items-center justify-between mb-4 flex-col sm:flex-row gap-3 sm:gap-0">
                          <div className="flex items-center gap-2 w-full sm:w-auto">
                            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-md flex items-center justify-center flex-shrink-0">
                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <Label className="text-sm font-medium text-slate-700">Section Media</Label>
                          </div>
                          <div className="flex gap-2 w-full sm:w-auto justify-center sm:justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => document.getElementById(`content-image-${card.id}`)?.click()}
                              className="text-xs bg-white hover:bg-blue-50 border-blue-200 text-blue-700 hover:text-blue-800 transition-all duration-200 shadow-sm flex-1 sm:flex-none min-w-[80px]"
                            >
                              <Upload className="w-3 h-3 mr-1" />
                              <span className="hidden sm:inline">Add Images</span>
                              <span className="sm:hidden">Images</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => document.getElementById(`content-video-${card.id}`)?.click()}
                              className="text-xs bg-white hover:bg-purple-50 border-purple-200 text-purple-700 hover:text-purple-800 transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex-1 sm:flex-none min-w-[80px]"
                              disabled={card.videos && card.videos.length >= 1}
                            >
                              <Upload className="w-3 h-3 mr-1" />
                              <span className="hidden sm:inline">Add Video</span>
                              <span className="sm:hidden">Video</span>
                            </Button>
                          </div>
                        </div>
                        
                        {/* Images Display */}
                        <div className="mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-5 h-5 bg-gradient-to-br from-green-400 to-blue-500 rounded-sm flex items-center justify-center">
                              <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <Label className="text-xs text-slate-600">Images ({card.images?.length || 0})</Label>
                          </div>
                          <div className="flex flex-wrap gap-2 p-3 bg-white/40 rounded-lg border border-slate-200/30 min-h-[80px]">
                            {card.images?.map((imageUrl, imgIndex) => (
                              <div key={imgIndex} className="relative group">
                                <div className="relative overflow-hidden rounded-md border-2 border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
                                  <img
                                    src={imageUrl}
                                    alt={`${card.title} ${imgIndex + 1}`}
                                    className="w-20 h-20 object-cover group-hover:scale-105 transition-transform duration-200"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                                </div>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  className="absolute -top-1 -right-1 w-5 h-5 p-0 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
                                  onClick={() => removeContentCardImage(card.id, imageUrl)}
                                >
                                  <X className="w-2 h-2" />
                                </Button>
                              </div>
                            ))}
                            <div className="relative group">
                              <div className="w-20 h-20 border-2 border-dashed border-slate-300 rounded-md flex items-center justify-center hover:border-blue-400 hover:bg-blue-50/30 transition-all duration-200 cursor-pointer">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleContentCardImageUpload(card.id, e)}
                                  className="hidden"
                                  id={`content-image-${card.id}`}
                                />
                                <label
                                  htmlFor={`content-image-${card.id}`}
                                  className="cursor-pointer p-3"
                                >
                                  <Plus className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors duration-200" />
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Videos Display */}
                        <div className="mb-2">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-5 h-5 bg-gradient-to-br from-red-400 to-pink-500 rounded-sm flex items-center justify-center">
                              <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                              </svg>
                            </div>
                            <Label className="text-xs text-slate-600">Video ({card.videos?.length || 0}/1)</Label>
                          </div>
                          <div className="flex flex-wrap gap-2 p-3 bg-white/40 rounded-lg border border-slate-200/30 min-h-[80px]">
                            {card.videos?.map((videoUrl, vidIndex) => (
                              <div key={vidIndex} className="relative group">
                                <div className="w-32 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-md border-2 border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center overflow-hidden">
                                  <div className="text-center">
                                    <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center mb-1 mx-auto group-hover:scale-110 transition-transform duration-200">
                                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                                      </svg>
                                    </div>
                                    <p className="text-xs text-slate-600">Video</p>
                                  </div>
                                </div>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  className="absolute -top-1 -right-1 w-5 h-5 p-0 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
                                  onClick={() => removeContentCardImage(card.id, videoUrl)}
                                >
                                  <X className="w-2 h-2" />
                                </Button>
                              </div>
                            ))}
                            {(!card.videos || card.videos.length === 0) && (
                              <div className="relative group">
                                <div className="w-32 h-20 border-2 border-dashed border-slate-300 rounded-md flex items-center justify-center hover:border-purple-400 hover:bg-purple-50/30 transition-all duration-200 cursor-pointer">
                                  <input
                                    type="file"
                                    accept="video/*"
                                    onChange={(e) => handleContentCardImageUpload(card.id, e)}
                                    className="hidden"
                                    id={`content-video-${card.id}`}
                                  />
                                  <label
                                    htmlFor={`content-video-${card.id}`}
                                    className="cursor-pointer p-3"
                                  >
                                    <div className="text-center">
                                      <Plus className="w-5 h-5 text-slate-400 group-hover:text-purple-500 transition-colors duration-200 mx-auto mb-1" />
                                      <p className="text-xs text-slate-400 group-hover:text-purple-600 transition-colors duration-200">Add video</p>
                                    </div>
                                  </label>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {(!card.images || card.images.length === 0) && (!card.videos || card.videos.length === 0) && (
                          <div className="text-center py-4 px-3 bg-gradient-to-br from-blue-50/30 to-purple-50/30 rounded-lg border border-blue-200/20">
                            <p className="text-xs text-slate-600">No media added yet</p>
                            <p className="text-xs text-slate-400">Add photos and/or a video to enhance this section</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {contentCards.length === 0 && (
                <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                  <p className="text-muted-foreground mb-2">No content sections created yet</p>
                  <p className="text-sm text-muted-foreground">
                    Create your first content section above to organize your retreat details
                  </p>
                </div>
              )}
            </div>

            <div>
              <Label>Retreat Image</Label>
              <div className="text-xs text-muted-foreground mb-2">
                Recommended: 1200x400px (3:1 ratio) for best display • Max size: 5MB
              </div>
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
                      <p className="text-sm font-medium text-card-foreground">Upload Image</p>
                      <p className="text-xs text-muted-foreground mt-1">Click to select an image file</p>
                    </div>
                  </div>
                )}
                {uploadingImage && (
                  <p className="text-sm text-muted-foreground">Uploading image...</p>
                )}
                {(imagePreview || formData.image) && (
                  <div className="mt-2">
                    <div className="relative w-full h-48 bg-muted/20 rounded-lg overflow-hidden">
                      <img
                        src={imagePreview || formData.image}
                        alt="Retreat preview"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">
                        Image displayed at full size with proper aspect ratio
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setImagePreview("");
                          setFormData(prev => ({ ...prev, image: "" }));
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Location & Dates */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-card-foreground">Location & Dates</h3>
            
            {/* Venue Selector */}
            <VenueSelector 
              selectedLocation={formData.location}
              onLocationChange={handleLocationChange}
            />
              
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
                  id="location-image-upload"
                />
                <label htmlFor="location-image-upload">
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
              
              {locationImages.length > 0 && (
                <ScrollArea className="w-full whitespace-nowrap rounded-md border">
                  <div className="flex w-max space-x-2 p-2">
                    {locationImages.map((imgUrl, index) => (
                      <div key={index} className="relative h-20 w-20 sm:h-24 sm:w-24 flex-shrink-0 rounded-md overflow-hidden group">
                        <img
                          src={imgUrl}
                          alt={`Location ${index + 1}`}
                          className="h-full w-full object-cover"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-0 right-0 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeLocationImage(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              )}
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

          {/* Dedicated Pricing Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-card-foreground">Pricing & Payment</h2>
              <Badge variant="outline" className="text-xs">Configure all pricing options</Badge>
            </div>

            {/* Basic Pricing */}
            <div className="space-y-4 p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-purple-50">
              <h3 className="text-lg font-semibold text-card-foreground flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Basic Pricing
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Base Price ($)</Label>
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
                    onValueChange={(value: "Beginner" | "Intermediate" | "Advanced" | "Any") =>
                      setFormData(prev => ({ ...prev, level: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Any">Any Skill Level</SelectItem>
                      <SelectItem value="Beginner">Beginner</SelectItem>
                      <SelectItem value="Intermediate">Intermediate</SelectItem>
                      <SelectItem value="Advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Deposit Settings */}
            <div className="space-y-4 p-4 border rounded-lg bg-gradient-to-r from-orange-50 to-yellow-50">
              <h3 className="text-lg font-semibold text-card-foreground flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                Deposit Settings
              </h3>
              
              <div>
                <Label>Deposit Amount ($)</Label>
                <p className="text-xs text-muted-foreground mb-2">Optional - Leave empty if no deposit required</p>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.deposit_amount || ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData(prev => ({ 
                      ...prev, 
                      deposit_amount: value === "" ? null : Number(value) 
                    }));
                  }}
                  placeholder="Enter deposit amount (optional)"
                />
                
                {formData.deposit_amount && formData.deposit_amount > 0 && (
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <Label className="text-sm font-medium">Refundable Deposit</Label>
                        <p className="text-xs text-muted-foreground">Allow students to get refund on deposit</p>
                      </div>
                      <Switch
                        checked={formData.deposit_refundable || false}
                        onCheckedChange={(checked) =>
                          setFormData(prev => ({ ...prev, deposit_refundable: checked }))
                        }
                      />
                    </div>
                    
                    {formData.deposit_refundable && (
                      <div>
                        <Label className="text-sm">Refund Cutoff (days before event)</Label>
                        <p className="text-xs text-muted-foreground mb-2">Last day students can request deposit refund</p>
                        <Input
                          type="number"
                          min="1"
                          value={formData.deposit_refund_days_before || 7}
                          onChange={(e) => {
                            const value = e.target.value;
                            setFormData(prev => ({ 
                              ...prev, 
                              deposit_refund_days_before: value === "" ? 7 : Number(value) 
                            }));
                          }}
                          placeholder="7"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Payment Timing */}
            <div className="space-y-4 p-4 border rounded-lg bg-gradient-to-r from-purple-50 to-pink-50">
              <h3 className="text-lg font-semibold text-card-foreground flex items-center gap-2">
                <CalendarIcon className="w-5 h-5" />
                Payment Timing
              </h3>
              
              <div>
                <Label>Full Payment Timing</Label>
                <p className="text-xs text-muted-foreground mb-2">When is the remaining balance charged?</p>
                <Input
                  type="number"
                  min="1"
                  value={formData.payment_days_before_event || 7}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData(prev => ({ 
                      ...prev, 
                      payment_days_before_event: value === "" ? 7 : Number(value) 
                    }));
                  }}
                  placeholder="7"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Days before the retreat starts
                </p>
                
                <div className="mt-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <Label className="text-sm font-medium">Non-Refundable Full Payment</Label>
                      <p className="text-xs text-muted-foreground">Full payment cannot be refunded once charged</p>
                    </div>
                    <Switch
                      checked={formData.full_payment_non_refundable || false}
                      onCheckedChange={(checked) =>
                        setFormData(prev => ({ ...prev, full_payment_non_refundable: checked }))
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Discount Coupon */}
            <div className="space-y-4 p-4 border rounded-lg bg-gradient-to-r from-green-50 to-emerald-50">
              <h3 className="text-lg font-semibold text-card-foreground flex items-center gap-2">
                <Share2 className="w-5 h-5" />
                Discount Coupon
              </h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Coupon Code</Label>
                    <p className="text-xs text-muted-foreground mb-2">Unique code students will enter</p>
                    <Input
                      value={discountCoupon.code}
                      onChange={(e) => {
                        const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
                        setDiscountCoupon(prev => ({ ...prev, code: value }));
                      }}
                      placeholder="SAVE20"
                      maxLength={20}
                    />
                  </div>
                  
                  <div>
                    <Label>Discount Type</Label>
                    <p className="text-xs text-muted-foreground mb-2">How the discount is calculated</p>
                    <Select
                      value={discountCoupon.type}
                      onValueChange={(value: 'percentage' | 'fixed') => 
                        setDiscountCoupon(prev => ({ ...prev, type: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                        <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Discount Value</Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      {discountCoupon.type === 'percentage' ? 'Percentage discount (0-100)' : 'Fixed amount in dollars'}
                    </p>
                    <Input
                      type="number"
                      step={discountCoupon.type === 'percentage' ? '1' : '0.01'}
                      min={discountCoupon.type === 'percentage' ? '1' : '0.01'}
                      max={discountCoupon.type === 'percentage' ? '100' : '10000'}
                      value={discountCoupon.value}
                      onChange={(e) => {
                        const value = e.target.value;
                        setDiscountCoupon(prev => ({ 
                          ...prev, 
                          value: value
                        }));
                      }}
                      placeholder={discountCoupon.type === 'percentage' ? '20' : '50.00'}
                    />
                  </div>
                  
                  <div>
                    <Label>Maximum Uses (Optional)</Label>
                    <p className="text-xs text-muted-foreground mb-2">Leave empty for unlimited uses</p>
                    <Input
                      type="number"
                      min="1"
                      value={discountCoupon.max_uses}
                      onChange={(e) => {
                        const value = e.target.value;
                        setDiscountCoupon(prev => ({ 
                          ...prev, 
                          max_uses: value
                        }));
                      }}
                      placeholder="Unlimited"
                    />
                  </div>
                </div>
                
                <div>
                  <Label>Expiration Date (Optional)</Label>
                  <p className="text-xs text-muted-foreground mb-2">Leave empty for no expiration</p>
                  <Input
                    type="date"
                    value={discountCoupon.expires_at}
                    onChange={(e) => {
                      setDiscountCoupon(prev => ({ 
                        ...prev, 
                        expires_at: e.target.value 
                      }));
                    }}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (discountCoupon.code && discountCoupon.value) {
                        setFormData(prev => ({
                          ...prev,
                          discount_coupon: {
                            code: discountCoupon.code,
                            type: discountCoupon.type,
                            value: Number(discountCoupon.value),
                            max_uses: discountCoupon.max_uses ? Number(discountCoupon.max_uses) : undefined,
                            expires_at: discountCoupon.expires_at || undefined
                          }
                        }));
                        toast({
                          title: "Discount Coupon Created",
                          description: `Coupon ${discountCoupon.code} has been added to this retreat.`,
                        });
                      } else {
                        toast({
                          title: "Missing Information",
                          description: "Please enter coupon code and discount value.",
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    Create Discount
                  </Button>
                  
                  {formData.discount_coupon && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, discount_coupon: null }));
                        setDiscountCoupon({
                          code: "",
                          type: 'percentage',
                          value: "",
                          max_uses: "",
                          expires_at: ""
                        });
                      }}
                      className="text-red-600 hover:text-red-700"
                    >
                      Remove Discount
                    </Button>
                  )}
                </div>
                
                {formData.discount_coupon && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-green-800">{formData.discount_coupon.code}</div>
                        <div className="text-sm text-green-600">
                          {formData.discount_coupon.type === 'percentage' 
                            ? `${formData.discount_coupon.value}% off`
                            : `$${formData.discount_coupon.value.toFixed(2)} off`
                          }
                          {formData.discount_coupon.max_uses && ` • Max ${formData.discount_coupon.max_uses} uses`}
                          {formData.discount_coupon.expires_at && ` • Expires ${new Date(formData.discount_coupon.expires_at).toLocaleDateString()}`}
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Active
                      </Badge>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Price Options */}
            <div className="space-y-4 p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-card-foreground flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Price Options
                </h3>
                {(!formData.price_variants || formData.price_variants.length === 0) && (
                  <Badge variant="destructive" className="text-xs">
                    At least one price option required
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Offer different pricing tiers for students to choose from (at least one required)
              </p>
              
              {/* Add new price variant */}
              <div className="space-y-3 p-4 border-2 border-dashed rounded-lg bg-muted/30">
                <h4 className="font-medium text-card-foreground">Add New Price Option</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <Label className="text-sm font-medium">Option Name *</Label>
                    <Input
                      value={newPriceVariant.name}
                      onChange={(e) => setNewPriceVariant(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., VIP Pass, Early Bird, Standard"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Price ($) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={newPriceVariant.price}
                      onChange={(e) => setNewPriceVariant(prev => ({ ...prev, price: e.target.value }))}
                      placeholder="299.00"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Description</Label>
                    <Input
                      value={newPriceVariant.description}
                      onChange={(e) => setNewPriceVariant(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="What's included in this option?"
                      className="mt-1"
                    />
                  </div>
                </div>
                <Button 
                  type="button" 
                  onClick={addPriceVariant}
                  disabled={!newPriceVariant.name.trim() || !newPriceVariant.price.trim()}
                  size="sm"
                  className="mt-2"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Price Option
                </Button>
              </div>

              {/* Display existing price variants */}
              {formData.price_variants && formData.price_variants.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-card-foreground">Current Price Options ({formData.price_variants.length})</h4>
                    <Badge variant="outline" className="text-xs">
                      {formData.price_variants.length} option{formData.price_variants.length !== 1 ? 's' : ''} configured
                    </Badge>
                  </div>
                  {formData.price_variants.map((variant, index) => (
                    <div key={variant.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-semibold text-blue-600">{index + 1}</span>
                          </div>
                          <div>
                            <div className="font-semibold text-card-foreground">{variant.name}</div>
                            <div className="text-sm text-muted-foreground">
                              ${variant.price.toFixed(2)}
                              {variant.description && ` • ${variant.description}`}
                            </div>
                          </div>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removePriceVariant(variant.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add-ons */}
            <div className="space-y-4 p-4 border rounded-lg bg-gradient-to-r from-green-50 to-teal-50">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-card-foreground flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Add-ons & Extras
                </h3>
                {formData.add_ons && formData.add_ons.length > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {formData.add_ons.length} add-on{formData.add_ons.length !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Offer additional items or services that students can purchase with their booking
              </p>
              
              {/* Add new add-on */}
              <div className="space-y-4 p-4 border-2 border-dashed rounded-lg bg-muted/30">
                <h4 className="font-medium text-card-foreground">Add New Add-on</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Add-on Name *</Label>
                    <Input
                      value={newAddOn.name}
                      onChange={(e) => setNewAddOn(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Airport Transfer, Lunch Package, Materials Kit"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Price ($) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={newAddOn.price}
                      onChange={(e) => setNewAddOn(prev => ({ ...prev, price: e.target.value }))}
                      placeholder="50.00"
                      className="mt-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Description</Label>
                  <Textarea
                    value={newAddOn.description}
                    onChange={(e) => setNewAddOn(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe what this add-on includes and any important details students should know..."
                    rows={3}
                    className="resize-none"
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex-1">
                    <Label className="text-sm font-medium text-blue-800">Required Add-on</Label>
                    <p className="text-xs text-blue-600">Students must purchase this add-on automatically</p>
                  </div>
                  <Switch
                    checked={newAddOn.required}
                    onCheckedChange={(checked) =>
                      setNewAddOn(prev => ({ ...prev, required: checked }))
                    }
                  />
                </div>
                <Button 
                  type="button" 
                  onClick={addAddOn}
                  disabled={!newAddOn.name.trim() || !newAddOn.price.trim()}
                  size="sm"
                  className="mt-2"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Add-on
                </Button>
              </div>

              {/* Display existing add-ons */}
              {formData.add_ons && formData.add_ons.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-card-foreground">Current Add-ons ({formData.add_ons.length})</h4>
                    <div className="flex items-center gap-2">
                      {formData.add_ons.filter(a => a.required).length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {formData.add_ons.filter(a => a.required).length} required
                        </Badge>
                      )}
                      {formData.add_ons.filter(a => !a.required).length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {formData.add_ons.filter(a => !a.required).length} optional
                        </Badge>
                      )}
                    </div>
                  </div>
                  {formData.add_ons.map((addOn, index) => (
                    <div key={addOn.id} className="flex items-start justify-between p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-semibold text-green-600">{index + 1}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-card-foreground">{addOn.name}</span>
                            {addOn.required && (
                              <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800 border-orange-200">
                                Required
                              </Badge>
                            )}
                            {!addOn.required && (
                              <Badge variant="outline" className="text-xs">
                                Optional
                              </Badge>
                            )}
                          </div>
                        </div>
                        {addOn.description && (
                          <div className="text-sm text-muted-foreground mb-2 bg-white/50 p-2 rounded border">
                            {addOn.description}
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-green-600">${addOn.price.toFixed(2)}</span>
                          <span className="text-xs text-muted-foreground">per student</span>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAddOn(addOn.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Financial Breakdown */}
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
                
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm font-medium">-12.4% Platform Fee</span>
                  <span className="text-sm font-semibold text-destructive">
                    -${(((formData.price || 0) * (formData.totalSpots || 0)) * 0.124).toFixed(2)}
                  </span>
                </div>
                
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
                
                <div className="flex items-center justify-between py-3 pt-4 border-t-2 border-primary">
                  <span className="text-base font-bold">Total Revenue Payout</span>
                  <span className="text-lg font-bold text-primary">
                    ${(
                      ((formData.price || 0) * (formData.totalSpots || 0)) -
                      (((formData.price || 0) * (formData.totalSpots || 0)) * 0.124) -
                      venueFees -
                      foodBudget
                    ).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* What's Included */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-card-foreground">What's Included</h2>
            
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
          </div>

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
    <div className="min-h-screen bg-gradient-hero pb-20">
      {/* Header */}
      <div className="bg-gradient-primary text-white px-6 py-8">
        <div className="flex items-center gap-4">
          {editingId !== null && (
            <Button
              variant="ghost"
              size="icon"
              onClick={cancelEditing}
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          <div>
            <h1 className="text-3xl font-bold mb-2">
              {editingId !== null ? (editingId === 'new' ? "Create New Retreat" : "Edit Retreat") : "My Drafts"}
            </h1>
            <p className="text-white/90 text-lg">
              {editingId !== null ? "Fill in the details below" : "Manage your draft retreats"}
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 -mt-4 max-w-4xl mx-auto space-y-6 pt-6">
        {editingId !== null ? (
          renderForm()
        ) : (
          <>
            {loading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground text-lg">Loading drafts...</p>
              </div>
            ) : (
              <>
                {draftRetreats.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <p className="text-muted-foreground text-lg mb-4">No drafts yet</p>
                      <Button onClick={() => startEditing()}>
                        Create Your First Retreat
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {draftRetreats.map((retreat) => (
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
                    ))}
                  </div>
                )}
              </>
            )}
          </>
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

      <BottomNav />
    </div>
  );
};

export default InstructorRetreatForm;
