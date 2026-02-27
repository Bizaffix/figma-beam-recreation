import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  MapPin, 
  Calendar as CalendarIcon, 
  Users, 
  Clock,
  Heart,
  Sparkles,
  Scissors,
  Home,
  SlidersHorizontal,
  X,
  Filter
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePlatformSettings } from "@/contexts/PlatformSettingsContext";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, parse, isAfter, isBefore } from "date-fns";

interface RetreatData {
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
  created_at: string;
  location_images?: string[] | null;
  instructor: {
    name: string;
    avatar: string;
    bio: string;
  };
}

interface VenueData {
  id: string;
  property_name: string;
  location: string;
  description: string;
  photos: string[];
  sleeps: number;
  max_quilters: number;
  status: 'draft' | 'published' | 'verified';
  created_at: string;
}

export const BrowseSection = () => {
  const navigate = useNavigate();
  const { user, hasAiAccess } = useAuth();
  const { settings: platformSettings } = usePlatformSettings();
  const aiMonthlyPrice = platformSettings?.ai_subscription_monthly_price ?? 3.99;
  const FREE_AI_SEARCH_KEY = "bmqr_ai_free_search_used";
  const [activeTab, setActiveTab] = useState<"events" | "venues">("events");
  const [searchQuery, setSearchQuery] = useState("");
  const [retreats, setRetreats] = useState<RetreatData[]>([]);
  const [venues, setVenues] = useState<VenueData[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [selectedEvent, setSelectedEvent] = useState<RetreatData | null>(null);
  const [selectedVenue, setSelectedVenue] = useState<VenueData | null>(null);
  const [venueEvents, setVenueEvents] = useState<RetreatData[]>([]);
  const [eventVenue, setEventVenue] = useState<VenueData | null>(null);
  
  // Filter states
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [zipCode, setZipCode] = useState<string>("");
  const [radius, setRadius] = useState<string>("all");
  const [minDays, setMinDays] = useState<string>("all");
  const [maxDays, setMaxDays] = useState<string>("all");
  const [eventType, setEventType] = useState<string>("all");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("newest");

  // Fetch published retreats
  useEffect(() => {
    const fetchRetreats = async () => {
      try {
        const { data, error } = await supabase
          .from('retreats')
          .select(`
            *,
            instructor:profiles!instructor_id(
              full_name,
              avatar_url,
              bio
            )
          `)
          .eq('published', true)
          .gt('spots_available', 0)
          .order('created_at', { ascending: false })
          .limit(12);

        if (error) {
          console.error('Error fetching retreats:', error);
        } else if (data) {
          const transformedRetreats = data.map((retreat: any) => ({
            id: retreat.id,
            title: retreat.title,
            description: retreat.description,
            location: retreat.location,
            date: retreat.date,
            duration: retreat.duration,
            level: retreat.level,
            price: retreat.price,
            total_spots: retreat.total_spots,
            spots_available: retreat.spots_available,
            image: retreat.image,
            includes: retreat.includes || [],
            schedule: retreat.schedule || [],
            published: retreat.published,
            instructor_id: retreat.instructor_id,
            created_at: retreat.created_at,
            location_images: retreat.location_images || null,
            instructor: {
              name: retreat.instructor?.full_name || 'Organizer',
              avatar: retreat.instructor?.avatar_url || '',
              bio: retreat.instructor?.bio || '',
            },
          }));
          setRetreats(transformedRetreats);
        }
      } catch (error) {
        console.error('Unexpected error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRetreats();
  }, []);

  // Fetch published venues
  useEffect(() => {
    const fetchVenues = async () => {
      try {
        const { data, error } = await supabase
          .from('properties')
          .select('*')
          .in('status', ['published', 'verified'])
          .order('created_at', { ascending: false })
          .limit(12);

        if (error) {
          console.error('Error fetching venues:', error);
        } else if (data) {
          setVenues(data || []);
        }
      } catch (error) {
        console.error('Unexpected error fetching venues:', error);
      }
    };

    fetchVenues();
  }, []);

  // Get unique locations
  const uniqueLocations = useMemo(() => {
    const locations = new Set<string>();
    retreats.forEach(r => {
      if (r.location) locations.add(r.location);
    });
    venues.forEach(v => {
      if (v.location) locations.add(v.location);
    });
    return Array.from(locations).sort();
  }, [retreats, venues]);

  // Parse duration to get number of days
  const parseDuration = (duration: string): number => {
    const match = duration.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  };

  // Check if event is online
  const isOnline = (location: string): boolean => {
    const lower = location.toLowerCase();
    return lower.includes('online') || lower.includes('virtual') || lower.includes('zoom');
  };

  // Extract zip code from location string
  const extractZipCode = (location: string): string | null => {
    const zipMatch = location.match(/\b\d{5}(-\d{4})?\b/);
    return zipMatch ? zipMatch[0] : null;
  };

  // Check if location matches zip code filter (basic implementation)
  const matchesZipCodeFilter = (location: string, searchZip: string, radiusMiles: string): boolean => {
    if (!searchZip) return true;
    
    const locationZip = extractZipCode(location);
    if (!locationZip) {
      // If location doesn't have a zip code, check if location string contains the zip code
      return location.includes(searchZip);
    }
    
    // For now, exact match. Proper radius calculation would require geocoding API
    // This is a placeholder - in production, you'd use coordinates and calculate distance
    if (radiusMiles === "all") {
      return locationZip.startsWith(searchZip.substring(0, 3)) || locationZip === searchZip;
    }
    
    // Basic implementation: if radius is specified, we'd need coordinates
    // For now, we'll do a prefix match for same area code
    return locationZip.startsWith(searchZip.substring(0, 3));
  };

  // Parse date string
  const parseDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    const formats = ['MMM d, yyyy', 'MMMM d, yyyy', 'MM/dd/yyyy', 'yyyy-MM-dd'];
    for (const formatStr of formats) {
      try {
        const parsed = parse(dateStr, formatStr, new Date());
        if (!isNaN(parsed.getTime())) return parsed;
      } catch {
        continue;
      }
    }
    const nativeDate = new Date(dateStr);
    return !isNaN(nativeDate.getTime()) ? nativeDate : null;
  };

  // Filter and sort events
  const filteredAndSortedEvents = useMemo(() => {
    let filtered = [...retreats];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((retreat) =>
        retreat.title.toLowerCase().includes(query) ||
        retreat.location.toLowerCase().includes(query) ||
        retreat.instructor.name.toLowerCase().includes(query)
      );
    }

    if (selectedLocation !== "all") {
      filtered = filtered.filter((retreat) => retreat.location === selectedLocation);
    }

    // Filter by zip code and radius
    if (zipCode) {
      filtered = filtered.filter((retreat) => matchesZipCodeFilter(retreat.location, zipCode, radius));
    }

    if (dateFrom) {
      filtered = filtered.filter((retreat) => {
        const retreatDate = parseDate(retreat.date);
        if (!retreatDate) return true;
        return isAfter(retreatDate, dateFrom) || retreatDate.getTime() === dateFrom.getTime();
      });
    }
    if (dateTo) {
      filtered = filtered.filter((retreat) => {
        const retreatDate = parseDate(retreat.date);
        if (!retreatDate) return true;
        return isBefore(retreatDate, dateTo) || retreatDate.getTime() === dateTo.getTime();
      });
    }

    if (minDays !== "all") {
      const min = parseInt(minDays);
      filtered = filtered.filter((retreat) => parseDuration(retreat.duration) >= min);
    }
    if (maxDays !== "all") {
      const max = parseInt(maxDays);
      filtered = filtered.filter((retreat) => parseDuration(retreat.duration) <= max);
    }

    if (eventType === "online") {
      filtered = filtered.filter((retreat) => isOnline(retreat.location));
    } else if (eventType === "in-person") {
      filtered = filtered.filter((retreat) => !isOnline(retreat.location));
    }

    if (minPrice) {
      const min = parseFloat(minPrice);
      filtered = filtered.filter((retreat) => retreat.price >= min);
    }
    if (maxPrice) {
      const max = parseFloat(maxPrice);
      filtered = filtered.filter((retreat) => retreat.price <= max);
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "upcoming":
          const dateA = parseDate(a.date);
          const dateB = parseDate(b.date);
          if (dateA && dateB) {
            return dateA.getTime() - dateB.getTime();
          }
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "price-low":
          return a.price - b.price;
        case "price-high":
          return b.price - a.price;
        default:
          return 0;
      }
    });

    return filtered;
  }, [retreats, searchQuery, selectedLocation, zipCode, radius, dateFrom, dateTo, minDays, maxDays, eventType, minPrice, maxPrice, sortBy]);

  // Filter and sort venues
  const filteredAndSortedVenues = useMemo(() => {
    let filtered = [...venues];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((venue) =>
        venue.property_name.toLowerCase().includes(query) ||
        venue.location.toLowerCase().includes(query) ||
        venue.description.toLowerCase().includes(query)
      );
    }

    if (selectedLocation !== "all") {
      filtered = filtered.filter((venue) => venue.location === selectedLocation);
    }

    // Filter by zip code and radius
    if (zipCode) {
      filtered = filtered.filter((venue) => matchesZipCodeFilter(venue.location, zipCode, radius));
    }

    filtered.sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return filtered;
  }, [venues, searchQuery, selectedLocation, zipCode, radius]);

  // Fetch venue for selected event
  useEffect(() => {
    const fetchEventVenue = async () => {
      if (!selectedEvent) {
        setEventVenue(null);
        return;
      }

      try {
        const { data } = await supabase
          .from('properties')
          .select('*')
          .eq('location', selectedEvent.location)
          .in('status', ['published', 'verified'])
          .limit(1)
          .maybeSingle();

        setEventVenue(data || null);
      } catch (error) {
        console.error('Error fetching venue for event:', error);
        setEventVenue(null);
      }
    };

    fetchEventVenue();
  }, [selectedEvent]);

  // Fetch events for selected venue
  useEffect(() => {
    const fetchVenueEvents = async () => {
      if (!selectedVenue) {
        setVenueEvents([]);
        return;
      }

      try {
        const { data } = await supabase
          .from('retreats')
          .select(`
            *,
            instructor:profiles!instructor_id(
              full_name,
              avatar_url,
              bio
            )
          `)
          .eq('published', true)
          .eq('location', selectedVenue.location)
          .order('date', { ascending: true });

        if (data) {
          const transformedEvents = data.map((retreat: any) => ({
            id: retreat.id,
            title: retreat.title,
            description: retreat.description,
            location: retreat.location,
            date: retreat.date,
            duration: retreat.duration,
            level: retreat.level,
            price: retreat.price,
            total_spots: retreat.total_spots,
            spots_available: retreat.spots_available,
            image: retreat.image,
            includes: retreat.includes || [],
            schedule: retreat.schedule || [],
            published: retreat.published,
            instructor_id: retreat.instructor_id,
            created_at: retreat.created_at,
            location_images: retreat.location_images || null,
            instructor: {
              name: retreat.instructor?.full_name || 'Organizer',
              avatar: retreat.instructor?.avatar_url || '',
              bio: retreat.instructor?.bio || '',
            },
          }));
          setVenueEvents(transformedEvents);
        } else {
          setVenueEvents([]);
        }
      } catch (error) {
        console.error('Error fetching events for venue:', error);
        setVenueEvents([]);
      }
    };

    fetchVenueEvents();
  }, [selectedVenue]);

  const hasActiveFilters = dateFrom || dateTo || selectedLocation !== "all" || zipCode || radius !== "all" || minDays !== "all" || maxDays !== "all" || eventType !== "all" || minPrice || maxPrice || sortBy !== "newest";

  const clearFilters = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
    setSelectedLocation("all");
    setZipCode("");
    setRadius("all");
    setMinDays("all");
    setMaxDays("all");
    setEventType("all");
    setMinPrice("");
    setMaxPrice("");
    setSortBy("newest");
  };

  // Logo colors: Exact hex values converted to Tailwind
  // #387C7F (dark teal), #459394 (light teal), #FAB130 (golden), #FD8865 (light coral), #EF684B (dark coral)
  const levelColors = {
    Any: "bg-[#459394] text-white",
    Beginner: "bg-[#459394] text-white",
    Intermediate: "bg-[#FAB130] text-white",
    Advanced: "bg-[#EF684B] text-white",
  };

  return (
    <section id="browse-section" className="py-12 sm:py-16 bg-white w-full overflow-x-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 w-full max-w-full">
        {/* Section Header - Craft-inspired */}
        <div className="mb-8 sm:mb-10 text-center">
          <h2 className="text-3xl sm:text-4xl font-semibold text-foreground mb-3 text-craft-heading">
            Discover Your Next Quilting Adventure
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto text-craft-body">
            Browse active and most recently published live listings
          </p>
        </div>

        {/* Tabs with Cute Icons - Soft, craft-inspired */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "events" | "venues")} className="w-full mb-8">
          <TabsList className="grid w-full grid-cols-2 bg-[#FAFAFA] border border-gray-200/60 rounded-2xl p-1.5 h-auto shadow-craft max-w-md mx-auto">
            <TabsTrigger 
              value="events" 
              className="group data-[state=active]:bg-[#459394] data-[state=active]:text-white data-[state=active]:shadow-craft rounded-xl py-3 px-5 transition-craft"
            >
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="p-1.5 sm:p-2 rounded-lg bg-[#459394]/10 group-data-[state=active]:bg-white/20 transition-craft">
                  <Scissors className={`w-4 h-4 sm:w-5 sm:h-5 transition-craft ${activeTab === "events" ? "text-white" : "text-[#387C7F]"}`} />
                </div>
                <span className="font-medium text-sm sm:text-base">Events</span>
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="venues" 
              className="data-[state=active]:bg-[#FD8865] data-[state=active]:text-white data-[state=active]:shadow-craft rounded-xl py-3 px-5 transition-craft"
            >
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="p-1.5 sm:p-2 rounded-lg bg-[#FD8865]/10 data-[state=active]:bg-white/20 transition-craft">
                  <Home className="w-4 h-4 sm:w-5 sm:h-5 text-[#EF684B] data-[state=active]:text-white transition-craft" />
                </div>
                <span className="font-medium text-sm sm:text-base">Venues</span>
              </div>
            </TabsTrigger>
          </TabsList>

          <div className="flex gap-3 sm:gap-4 mb-8 max-w-2xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder={activeTab === "events" ? "Search events..." : "Search venues..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 bg-white border border-gray-200/60 focus:border-[#459394] focus:ring-2 focus:ring-[#459394]/20 h-14 text-base rounded-2xl shadow-craft transition-craft"
              />
            </div>
            <div className="flex flex-col items-center gap-1">
              <Button
                className="h-14 px-4 sm:px-5 rounded-2xl bg-[#459394] hover:bg-[#387C7F] text-white shadow-craft hover:shadow-craft-hover transition-craft whitespace-nowrap"
                onClick={() => {
                  const freeSearchUsed = localStorage.getItem(FREE_AI_SEARCH_KEY) === "true";

                  // First AI search is free for everyone
                  if (!freeSearchUsed) {
                    navigate("/find");
                    return;
                  }

                  // After free search, require account + subscription
                  if (!user) {
                    navigate(`/signup?role=student&intent=quiltmatch_ai&plan=${encodeURIComponent(String(aiMonthlyPrice))}&next=/find`);
                    return;
                  }
                  if (!hasAiAccess) {
                    navigate("/quiltmatch/upgrade");
                    return;
                  }
                  navigate("/find");
                }}
              >
                <Sparkles className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Search with AI</span>
              </Button>
              <p className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">
                First AI search free • then ${aiMonthlyPrice.toFixed(2)}/mo
              </p>
            </div>
            <Button 
              size="icon" 
              className={`h-14 w-14 border transition-craft rounded-2xl shadow-craft hover:shadow-craft-hover relative ${
                hasActiveFilters 
                  ? 'bg-[#FAB130] text-white border-[#FAB130]' 
                  : 'bg-[#FAB130]/10 border-[#FAB130]/30 text-[#FAB130] hover:bg-[#FAB130] hover:text-white hover:border-[#FAB130]'
              }`}
              onClick={() => setFilterSheetOpen(true)}
            >
              <SlidersHorizontal className="w-5 h-5" />
              {hasActiveFilters && (
                <span className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-[#EF684B] rounded-full border-2 border-white shadow-craft"></span>
              )}
            </Button>
          </div>

          {/* Feed Content - Horizontal Scroll */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#459394]/10 mb-4">
                <Sparkles className="w-6 h-6 text-[#459394] animate-pulse" />
              </div>
              <p className="text-muted-foreground">Loading...</p>
            </div>
          ) : (
            <>
              <TabsContent value="events" className="mt-0">
              {filteredAndSortedEvents.length > 0 ? (
                <div className="relative">
                  <Carousel className="w-full">
                    <CarouselContent className="-ml-2 sm:-ml-4">
                      {filteredAndSortedEvents.map((event) => (
                        <CarouselItem key={event.id} className="pl-2 sm:pl-4 basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                          <Card 
                            className="overflow-hidden hover:shadow-craft-hover hover:scale-[1.02] transition-craft cursor-pointer border border-gray-200/60 hover:border-[#459394]/40 rounded-2xl bg-white group shadow-craft"
                            onClick={() => setSelectedEvent(event)}
                          >
                            {/* Image Section */}
                            <div className="relative aspect-[4/3] overflow-hidden rounded-t-2xl">
                              <img
                                src={event.image || "/placeholder.svg"}
                                alt={event.title}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                              />
                              {/* Heart Icon - Top Right */}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-3 right-3 h-10 w-10 bg-white/95 hover:bg-white rounded-full shadow-craft hover:shadow-craft-hover z-10 transition-craft"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Handle save functionality
                                }}
                              >
                                <Heart className="w-5 h-5 text-gray-600 hover:text-[#EF684B] hover:fill-[#EF684B] transition-craft" />
                              </Button>
                              {/* Level Badge - Top Left - Pill-shaped, larger */}
                              <Badge className={`absolute top-3 left-3 badge-pill font-semibold shadow-craft text-xs px-4 py-1.5 ${levelColors[event.level] || levelColors.Beginner}`}>
                                {event.level}
                              </Badge>
                              {/* Guest Favorite Badge - Optional, can add logic later */}
                              {event.spots_available < event.total_spots * 0.3 && (
                                <Badge className="absolute bottom-3 left-3 badge-pill font-medium bg-white/95 text-gray-700 shadow-craft border border-gray-200/60">
                                  Popular
                                </Badge>
                              )}
                            </div>
                            
                            {/* Content Section - More breathing room */}
                            <CardContent className="p-6 sm:p-7 space-y-4">
                              {/* Location */}
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <MapPin className="w-4 h-4 flex-shrink-0 text-[#387C7F]" />
                                <span className="line-clamp-1 font-medium">{event.location || "Location TBD"}</span>
                              </div>
                              
                              {/* Title */}
                              <h3 className="font-semibold text-lg leading-snug line-clamp-2 text-foreground group-hover:text-[#387C7F] transition-craft min-h-[3rem] text-craft-heading">
                                {event.title || "Untitled Event"}
                              </h3>
                              
                              {/* Instructor */}
                              <p className="text-sm text-muted-foreground line-clamp-1 text-craft-body">
                                with {event.instructor?.name || "Organizer"}
                              </p>
                              
                              {/* Date & Duration */}
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <CalendarIcon className="w-4 h-4 flex-shrink-0 text-[#387C7F]" />
                                <span className="line-clamp-1">{event.date || "Date TBD"}</span>
                                {event.duration && (
                                  <>
                                    <span className="text-gray-300">•</span>
                                    <span>{event.duration}</span>
                                  </>
                                )}
                              </div>
                              
                              {/* Price & Availability - Soft divider with more spacing */}
                              <div className="flex items-center justify-between pt-4 border-t border-gray-200/60 mt-1">
                                <div className="flex flex-col gap-0.5">
                                  <div className="flex items-baseline gap-1.5">
                                    <span className="text-xl font-bold" style={{ color: '#FD8865' }}>
                                      ${event.price ? event.price.toLocaleString() : "0"}
                                    </span>
                                    <span className="text-xs text-muted-foreground">per person</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                  <Users className="w-4 h-4 flex-shrink-0 text-[#387C7F]" />
                                  <span>
                                    {event.spots_available !== undefined && event.total_spots !== undefined
                                      ? `${event.spots_available} of ${event.total_spots} spots`
                                      : event.spots_available !== undefined
                                      ? `${event.spots_available} spots`
                                      : "Spots available"}
                                  </span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <CarouselPrevious className="left-0 sm:-left-12 bg-white border border-gray-200/60 hover:bg-[#459394] hover:text-white hover:border-[#459394] shadow-craft hover:shadow-craft-hover transition-craft rounded-2xl" />
                    <CarouselNext className="right-0 sm:-right-12 bg-white border border-gray-200/60 hover:bg-[#459394] hover:text-white hover:border-[#459394] shadow-craft hover:shadow-craft-hover transition-craft rounded-2xl" />
                  </Carousel>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No events found. Try adjusting your search.</p>
                </div>
              )}
              </TabsContent>

            <TabsContent value="venues" className="mt-0">
              {filteredAndSortedVenues.length > 0 ? (
                <div className="relative">
                  <Carousel className="w-full">
                    <CarouselContent className="-ml-2 sm:-ml-4">
                      {filteredAndSortedVenues.map((venue) => (
                        <CarouselItem key={venue.id} className="pl-2 sm:pl-4 basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                          <Card 
                            className="overflow-hidden hover:shadow-craft-hover transition-craft cursor-pointer border border-gray-200/60 hover:border-[#FD8865]/40 rounded-2xl bg-white shadow-craft"
                            onClick={() => setSelectedVenue(venue)}
                          >
                            <div className="relative">
                              <img
                                src={venue.photos?.[0] || "/placeholder.svg"}
                                alt={venue.property_name}
                                className="w-full h-48 sm:h-56 object-cover rounded-t-2xl"
                              />
                              <Badge className="absolute top-3 right-3 badge-pill font-medium bg-white/95 text-gray-700 shadow-craft border border-gray-200/60">
                                {venue.status}
                              </Badge>
                            </div>
                            <CardContent className="p-5 sm:p-6 space-y-2">
                              <h3 className="font-semibold text-base sm:text-lg mb-1 line-clamp-1 text-craft-heading">{venue.property_name}</h3>
                              <p className="text-sm text-muted-foreground mb-2 line-clamp-1 text-craft-body">{venue.location}</p>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Users className="w-4 h-4 text-[#FD8865]" />
                                <span>Sleeps {venue.sleeps} • Max {venue.max_quilters} quilters</span>
                              </div>
                            </CardContent>
                          </Card>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <CarouselPrevious className="left-0 sm:-left-12 bg-white border border-gray-200/60 hover:bg-[#FD8865] hover:text-white hover:border-[#FD8865] shadow-craft hover:shadow-craft-hover transition-craft rounded-2xl" />
                    <CarouselNext className="right-0 sm:-right-12 bg-white border border-gray-200/60 hover:bg-[#FD8865] hover:text-white hover:border-[#FD8865] shadow-craft hover:shadow-craft-hover transition-craft rounded-2xl" />
                  </Carousel>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No venues found. Try adjusting your search.</p>
                </div>
              )}
              </TabsContent>
            </>
          )}
        </Tabs>

        {/* View All Button - Pill-shaped */}
        <div className="mt-10 text-center">
          <Button 
            variant="outline" 
            className="btn-pill border-2 border-[#459394] text-[#387C7F] hover:bg-[#459394] hover:text-white shadow-craft hover:shadow-craft-hover transition-craft px-8 py-6 text-base font-medium"
            onClick={() => navigate('/browse')}
          >
            View All {activeTab === "events" ? "Events" : "Venues"}
          </Button>
        </div>
      </div>

      {/* Event Modal - Simplified */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          {selectedEvent && (
            <>
              <DialogHeader className="px-0">
                <DialogTitle className="text-xl sm:text-2xl pr-8">{selectedEvent.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 sm:space-y-6">
                <div className="relative w-full h-48 sm:h-64 rounded-lg overflow-hidden">
                  <img
                    src={selectedEvent.image || "/placeholder.svg"}
                    alt={selectedEvent.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Location</p>
                      <p className="font-medium text-sm sm:text-base">{selectedEvent.location}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Date</p>
                      <p className="font-medium text-sm sm:text-base">{selectedEvent.date}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t">
                  <div>
                    <p className="text-xl sm:text-2xl font-bold text-[#EF684B]">${selectedEvent.price}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">per person</p>
                  </div>
                  <Button onClick={() => navigate(`/retreat/${selectedEvent.id}`)} className="btn-pill bg-[#459394] hover:bg-[#387C7F] text-white shadow-craft hover:shadow-craft-hover transition-craft px-6 py-6 text-base font-medium">
                    View Full Details
                  </Button>
                </div>
                {eventVenue && eventVenue.photos && eventVenue.photos.length > 0 && (
                  <div className="space-y-3 pt-4 border-t">
                    <h3 className="font-semibold text-base sm:text-lg">Venue: {eventVenue.property_name}</h3>
                    <Carousel className="w-full">
                      <CarouselContent className="-ml-2 sm:-ml-4">
                        {eventVenue.photos.map((photo, index) => (
                          <CarouselItem key={index} className="pl-2 sm:pl-4 basis-1/2 sm:basis-1/3">
                            <div className="relative h-24 sm:h-32 rounded-lg overflow-hidden">
                              <img
                                src={photo}
                                alt={`${eventVenue.property_name} ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      <CarouselPrevious className="left-0 sm:-left-12" />
                      <CarouselNext className="right-0 sm:-right-12" />
                    </Carousel>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Venue Modal - Simplified */}
      <Dialog open={!!selectedVenue} onOpenChange={() => setSelectedVenue(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          {selectedVenue && (
            <>
              <DialogHeader className="px-0">
                <DialogTitle className="text-xl sm:text-2xl pr-8">{selectedVenue.property_name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 sm:space-y-6">
                {selectedVenue.photos && selectedVenue.photos.length > 0 && (
                  <div className="relative w-full h-48 sm:h-64 rounded-lg overflow-hidden">
                    <img
                      src={selectedVenue.photos[0]}
                      alt={selectedVenue.property_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                  <span className="font-medium text-sm sm:text-base">{selectedVenue.location}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-xs">Sleeps {selectedVenue.sleeps}</Badge>
                  <Badge variant="outline" className="text-xs">Max {selectedVenue.max_quilters} quilters</Badge>
                  <Badge className="bg-green-100 text-green-700 text-xs">{selectedVenue.status}</Badge>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">{selectedVenue.description}</p>
                {venueEvents.length > 0 && (
                  <div className="space-y-3 pt-4 border-t">
                    <h3 className="font-semibold text-base sm:text-lg">Events at this venue ({venueEvents.length})</h3>
                    <Carousel className="w-full">
                      <CarouselContent className="-ml-2 sm:-ml-4">
                        {venueEvents.map((event) => (
                          <CarouselItem key={event.id} className="pl-2 sm:pl-4 basis-full sm:basis-1/2 lg:basis-1/3">
                            <Card className="overflow-hidden cursor-pointer" onClick={() => {
                              setSelectedVenue(null);
                              setSelectedEvent(event);
                            }}>
                              <div className="relative h-28 sm:h-32">
                                <img
                                  src={event.image || "/placeholder.svg"}
                                  alt={event.title}
                                  className="w-full h-full object-cover"
                                />
                                <Badge className={`absolute top-2 right-2 text-xs ${levelColors[event.level] || levelColors.Beginner}`}>
                                  {event.level}
                                </Badge>
                              </div>
                              <CardContent className="p-3">
                                <h4 className="font-semibold text-xs sm:text-sm mb-1 line-clamp-1">{event.title}</h4>
                                <p className="text-xs text-muted-foreground mb-2">{event.date}</p>
                                <p className="text-base sm:text-lg font-bold text-[#EF684B]">${event.price}</p>
                              </CardContent>
                            </Card>
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      <CarouselPrevious className="left-0 sm:-left-12" />
                      <CarouselNext className="right-0 sm:-right-12" />
                    </Carousel>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Filter Sheet - Simplified for Home Page */}
      <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
        <SheetContent side="bottom" className="h-[85vh] max-h-[700px] rounded-t-3xl p-0 flex flex-col">
          <div className="p-4 sm:p-6 pb-3 sm:pb-4 border-b">
            <SheetHeader className="text-left">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 rounded-lg bg-[#FAB130]/10">
                  <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-[#FAB130]" />
                </div>
                <div>
                  <SheetTitle className="text-xl sm:text-2xl">Filter & Sort</SheetTitle>
                  <SheetDescription className="text-sm sm:text-base mt-1">
                    Refine your search
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>
          </div>
          
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 space-y-6 sm:space-y-8">
            {activeTab === "events" && (
              <>
                <div className="space-y-3 sm:space-y-4">
                  <Label className="text-base sm:text-lg font-semibold">Date Range</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="h-11 sm:h-12 justify-start text-left text-sm sm:text-base">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateFrom ? format(dateFrom, "PPP") : "From date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} />
                      </PopoverContent>
                    </Popover>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="h-11 sm:h-12 justify-start text-left text-sm sm:text-base">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateTo ? format(dateTo, "PPP") : "To date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={dateTo} onSelect={setDateTo} />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-base sm:text-lg font-semibold">Search by Zip Code</Label>
                  <div className="space-y-3">
                    <Input
                      type="text"
                      placeholder="Enter zip code"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      className="h-11 sm:h-12 text-sm sm:text-base"
                    />
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Radius Within:</Label>
                      <Select value={radius} onValueChange={setRadius}>
                        <SelectTrigger className="h-11 sm:h-12 text-sm sm:text-base">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="10">10 Miles</SelectItem>
                          <SelectItem value="50">50 Miles</SelectItem>
                          <SelectItem value="200">200 Miles</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-base sm:text-lg font-semibold">Price Range</Label>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <Input
                      type="number"
                      placeholder="Min $"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      className="h-11 sm:h-12 text-sm sm:text-base"
                    />
                    <Input
                      type="number"
                      placeholder="Max $"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      className="h-11 sm:h-12 text-sm sm:text-base"
                    />
                  </div>
                </div>
              </>
            )}

            {activeTab === "venues" && (
              <div className="space-y-3">
                <Label className="text-base sm:text-lg font-semibold">Search by Zip Code</Label>
                <div className="space-y-3">
                  <Input
                    type="text"
                    placeholder="Enter zip code"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    className="h-11 sm:h-12 text-sm sm:text-base"
                  />
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Radius Within:</Label>
                    <Select value={radius} onValueChange={setRadius}>
                      <SelectTrigger className="h-11 sm:h-12 text-sm sm:text-base">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="10">10 Miles</SelectItem>
                        <SelectItem value="50">50 Miles</SelectItem>
                        <SelectItem value="200">200 Miles</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
          </div>

          <SheetFooter className="flex-row gap-3 border-t border-gray-200/60 pt-4 pb-4 px-4 sm:px-6 bg-background sticky bottom-0 z-10">
            <Button
              variant="outline"
              onClick={clearFilters}
              className="flex-1 sm:flex-initial h-12 text-base btn-pill border-gray-200/60 hover:bg-gray-50 transition-craft"
            >
              <X className="w-4 h-4 mr-2" />
              Clear All
            </Button>
            <Button
              onClick={() => setFilterSheetOpen(false)}
              className="flex-1 sm:flex-initial h-12 text-base btn-pill bg-[#459394] hover:bg-[#387C7F] text-white shadow-craft hover:shadow-craft-hover transition-craft font-medium"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Apply Filters
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </section>
  );
};
