import { useState, useEffect, useMemo } from "react";
import { BottomNav } from "@/components/BottomNav";
import { Input } from "@/components/ui/input";
import { Search, SlidersHorizontal, Calendar as CalendarIcon, MapPin, X, Filter, Sparkles, TrendingUp, Clock, Users, DollarSign, Monitor, Building2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Header } from "@/components/Header";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { format, parse, isAfter, isBefore, addDays, differenceInDays } from "date-fns";
import { useNavigate } from "react-router-dom";

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

const Index = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"events" | "venues">("events");
  const [searchQuery, setSearchQuery] = useState("");
  const [retreats, setRetreats] = useState<RetreatData[]>([]);
  const [venues, setVenues] = useState<VenueData[]>([]);
  const [loading, setLoading] = useState(true);
  const { role, user } = useAuth();
  
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
  const [minDays, setMinDays] = useState<string>("all");
  const [maxDays, setMaxDays] = useState<string>("all");
  const [eventType, setEventType] = useState<string>("all"); // all, online, in-person
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("upcoming"); // upcoming, newest, price-low, price-high

  // Fetch published retreats from Supabase
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
              bio,
              facebook_url,
              instagram_url,
              pinterest_url
            )
          `)
          .eq('published', true)
          .order('created_at', { ascending: false });

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

  // Fetch published venues from Supabase
  useEffect(() => {
    const fetchVenues = async () => {
      try {
        const { data, error } = await supabase
          .from('properties')
          .select('*')
          .in('status', ['published', 'verified'])
          .order('created_at', { ascending: false });

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

  // Get unique locations for filter dropdown
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

  // Parse date string with multiple format attempts
  const parseDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    
    // Try common date formats
    const formats = [
      'MMM d, yyyy',
      'MMMM d, yyyy',
      'MM/dd/yyyy',
      'yyyy-MM-dd',
      'MMM dd, yyyy',
    ];
    
    for (const format of formats) {
      try {
        const parsed = parse(dateStr, format, new Date());
        if (!isNaN(parsed.getTime())) {
          return parsed;
        }
      } catch {
        continue;
      }
    }
    
    // Try native Date parsing as fallback
    const nativeDate = new Date(dateStr);
    if (!isNaN(nativeDate.getTime())) {
      return nativeDate;
    }
    
    return null;
  };

  // Check if event is online (location contains "online" or "virtual")
  const isOnline = (location: string): boolean => {
    const lower = location.toLowerCase();
    return lower.includes('online') || lower.includes('virtual') || lower.includes('zoom');
  };

  // Filter and sort events
  const filteredAndSortedEvents = useMemo(() => {
    let filtered = [...retreats];

    // Text search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((retreat) =>
        retreat.title.toLowerCase().includes(query) ||
        retreat.location.toLowerCase().includes(query) ||
        retreat.instructor.name.toLowerCase().includes(query) ||
        retreat.description.toLowerCase().includes(query)
      );
    }

    // Location filter
    if (selectedLocation !== "all") {
      filtered = filtered.filter((retreat) => retreat.location === selectedLocation);
    }

    // Date range filter
    if (dateFrom) {
      filtered = filtered.filter((retreat) => {
        const retreatDate = parseDate(retreat.date);
        if (!retreatDate) return true; // Include if date can't be parsed
        return isAfter(retreatDate, dateFrom) || retreatDate.getTime() === dateFrom.getTime();
      });
    }
    if (dateTo) {
      filtered = filtered.filter((retreat) => {
        const retreatDate = parseDate(retreat.date);
        if (!retreatDate) return true; // Include if date can't be parsed
        return isBefore(retreatDate, dateTo) || retreatDate.getTime() === dateTo.getTime();
      });
    }

    // Duration filter
    if (minDays !== "all") {
      const min = parseInt(minDays);
      filtered = filtered.filter((retreat) => parseDuration(retreat.duration) >= min);
    }
    if (maxDays !== "all") {
      const max = parseInt(maxDays);
      filtered = filtered.filter((retreat) => parseDuration(retreat.duration) <= max);
    }

    // Event type filter (online/in-person)
    if (eventType === "online") {
      filtered = filtered.filter((retreat) => isOnline(retreat.location));
    } else if (eventType === "in-person") {
      filtered = filtered.filter((retreat) => !isOnline(retreat.location));
    }

    // Price filter
    if (minPrice) {
      const min = parseFloat(minPrice);
      filtered = filtered.filter((retreat) => retreat.price >= min);
    }
    if (maxPrice) {
      const max = parseFloat(maxPrice);
      filtered = filtered.filter((retreat) => retreat.price <= max);
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "upcoming":
          const dateA = parseDate(a.date);
          const dateB = parseDate(b.date);
          if (dateA && dateB) {
            return dateA.getTime() - dateB.getTime();
          }
          // Fallback to created_at if dates can't be parsed
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
  }, [retreats, searchQuery, selectedLocation, dateFrom, dateTo, minDays, maxDays, eventType, minPrice, maxPrice, sortBy]);

  // Filter and sort venues
  const filteredAndSortedVenues = useMemo(() => {
    let filtered = [...venues];

    // Text search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((venue) =>
        venue.property_name.toLowerCase().includes(query) ||
        venue.location.toLowerCase().includes(query) ||
        venue.description.toLowerCase().includes(query)
      );
    }

    // Location filter
    if (selectedLocation !== "all") {
      filtered = filtered.filter((venue) => venue.location === selectedLocation);
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return filtered;
  }, [venues, searchQuery, selectedLocation, sortBy]);

  // Fetch venue for selected event
  useEffect(() => {
    const fetchEventVenue = async () => {
      if (!selectedEvent) {
        setEventVenue(null);
        return;
      }

      try {
        // Try to find venue by matching location
        const { data, error } = await supabase
          .from('properties')
          .select('*')
          .eq('location', selectedEvent.location)
          .in('status', ['published', 'verified'])
          .limit(1)
          .maybeSingle();

        if (!error && data) {
          setEventVenue(data);
        } else {
          setEventVenue(null);
        }
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
          .eq('location', selectedVenue.location)
          .order('date', { ascending: true });

        if (!error && data) {
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

  // Check if any filters are active
  const hasActiveFilters = dateFrom || dateTo || selectedLocation !== "all" || minDays !== "all" || maxDays !== "all" || eventType !== "all" || minPrice || maxPrice || sortBy !== "upcoming";

  // Clear all filters
  const clearFilters = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
    setSelectedLocation("all");
    setMinDays("all");
    setMaxDays("all");
    setEventType("all");
    setMinPrice("");
    setMaxPrice("");
    setSortBy("upcoming");
  };

  const handleEventClick = (event: RetreatData) => {
    setSelectedEvent(event);
  };

  const handleVenueClick = (venue: VenueData) => {
    setSelectedVenue(venue);
  };

  const levelColors = {
    Any: "bg-blue-100 text-blue-700",
    Beginner: "bg-emerald-100 text-emerald-700",
    Intermediate: "bg-amber-100 text-amber-700",
    Advanced: "bg-rose-100 text-rose-700",
  };

  return (
    <div className="min-h-screen bg-gradient-hero pb-20">
      {/* Header - only show if not logged in */}
      {!user && <Header />}
      
      {/* Hero Section */}
      <div className="bg-gradient-primary text-white px-4 sm:px-6 py-6 sm:py-8 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full blur-3xl"></div>
        </div>
        <div className="relative z-10">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Browse Events</h1>
          <p className="text-white/90 text-base sm:text-lg">Discover Events & Venues</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 sm:px-6 -mt-4 mb-4 sm:mb-6">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "events" | "venues")} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-card shadow-lg h-10 sm:h-11">
            <TabsTrigger value="events" className="text-sm sm:text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Events
            </TabsTrigger>
            <TabsTrigger value="venues" className="text-sm sm:text-base data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Venues
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Search & Filter Section */}
      <div className="px-4 sm:px-6 mb-4 sm:mb-6 space-y-3 sm:space-y-4">
        {/* Search Bar */}
        <div className="flex gap-2 sm:gap-3">
          <div className="relative flex-1 group">
            <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
            <Input
              placeholder={activeTab === "events" ? "Search events..." : "Search venues..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 sm:pl-12 pr-3 sm:pr-4 bg-card shadow-lg border-2 border-transparent focus:border-primary/20 h-12 sm:h-14 text-sm sm:text-base transition-all duration-200 hover:shadow-xl"
            />
          </div>
          <Button 
            size="icon" 
            className={`h-12 w-12 sm:h-14 sm:w-14 bg-card text-foreground hover:bg-primary hover:text-primary-foreground shadow-lg transition-all duration-300 relative group flex-shrink-0 ${
              hasActiveFilters 
                ? 'ring-2 ring-primary ring-offset-2 bg-primary/10' 
                : 'hover:scale-105'
            }`}
            onClick={() => setFilterSheetOpen(true)}
          >
            <SlidersHorizontal className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200 ${hasActiveFilters ? 'text-primary' : ''} group-hover:rotate-90`} />
            {hasActiveFilters && (
              <>
                <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-primary rounded-full animate-pulse" />
                <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-primary rounded-full animate-ping" />
              </>
            )}
          </Button>
        </div>
        
        {/* Results Count */}
        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
          <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary flex-shrink-0" />
          <span className="font-medium truncate">
            {loading ? (
              "Loading..."
            ) : (
              <>
                <span className="text-foreground font-semibold">
                  {activeTab === "events" ? filteredAndSortedEvents.length : filteredAndSortedVenues.length}
                </span>{" "}
                {activeTab === "events" 
                  ? (filteredAndSortedEvents.length === 1 ? "event" : "events")
                  : (filteredAndSortedVenues.length === 1 ? "venue" : "venues")
                } found
              </>
            )}
          </span>
        </div>
      </div>

      {/* Feed Content */}
      <div className="px-4 sm:px-6 max-w-7xl mx-auto">
        {loading ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Search className="w-8 h-8 text-primary animate-pulse" />
            </div>
            <p className="text-muted-foreground text-lg font-medium">Loading...</p>
          </div>
        ) : (
          <>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "events" | "venues")}>
              <TabsContent value="events" className="mt-0">
                {filteredAndSortedEvents.length > 0 ? (
                  <div className="space-y-4">
                    {filteredAndSortedEvents.map((event) => (
                      <Card 
                        key={event.id}
                        className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => handleEventClick(event)}
                      >
                        <div className="flex flex-col md:flex-row">
                          <div className="relative w-full md:w-64 h-48 md:h-auto flex-shrink-0">
                            <img
                              src={event.image || "/placeholder.svg"}
                              alt={event.title}
                              className="w-full h-full object-cover"
                            />
                            <Badge className={`absolute top-2 right-2 sm:top-3 sm:right-3 text-xs ${levelColors[event.level] || levelColors.Beginner}`}>
                              {event.level}
                            </Badge>
                          </div>
                          <CardContent className="p-4 sm:p-5 flex-1">
                            <h3 className="text-lg sm:text-xl font-semibold text-card-foreground mb-2 line-clamp-2">{event.title}</h3>
                            <div className="flex items-center gap-2 mb-3">
                              <img
                                src={event.instructor.avatar || "/placeholder.svg"}
                                alt={event.instructor.name}
                                className="w-5 h-5 sm:w-6 sm:h-6 rounded-full object-cover flex-shrink-0"
                              />
                              <span className="text-xs sm:text-sm text-muted-foreground truncate">with {event.instructor.name}</span>
                            </div>
                            <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                              <div className="flex items-center gap-2">
                                <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                                <span className="truncate">{event.location}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <CalendarIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                                <span className="truncate">{event.date} • {event.duration}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                                <span>{event.spots_available} of {event.total_spots} spots</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t gap-2">
                              <span className="text-xl sm:text-2xl font-bold text-primary">${event.price}</span>
                              <Button variant="link" className="text-primary text-xs sm:text-sm p-0 h-auto">
                                View Details →
                              </Button>
                            </div>
                          </CardContent>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 px-4">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-6">
                      <Search className="w-10 h-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">No events found</h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                      {searchQuery || hasActiveFilters 
                        ? "Try adjusting your search or filters to find more events." 
                        : "Check back soon for new quilting retreats!"}
                    </p>
                    {(searchQuery || hasActiveFilters) && (
                      <Button variant="outline" onClick={clearFilters} className="gap-2">
                        <X className="w-4 h-4" />
                        Clear Filters
                      </Button>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="venues" className="mt-0">
                {filteredAndSortedVenues.length > 0 ? (
                  <div className="space-y-4">
                    {filteredAndSortedVenues.map((venue) => (
                      <Card 
                        key={venue.id}
                        className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => handleVenueClick(venue)}
                      >
                        <div className="flex flex-col md:flex-row">
                          <div className="relative w-full md:w-64 h-48 md:h-auto flex-shrink-0">
                            <img
                              src={venue.photos?.[0] || "/placeholder.svg"}
                              alt={venue.property_name}
                              className="w-full h-full object-cover"
                            />
                            <Badge className="absolute top-2 right-2 sm:top-3 sm:right-3 text-xs bg-green-100 text-green-700">
                              {venue.status}
                            </Badge>
                          </div>
                          <CardContent className="p-4 sm:p-5 flex-1">
                            <h3 className="text-lg sm:text-xl font-semibold text-card-foreground mb-2 line-clamp-2">{venue.property_name}</h3>
                            <div className="flex items-center gap-2 mb-3">
                              <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
                              <span className="text-xs sm:text-sm text-muted-foreground truncate">{venue.location}</span>
                            </div>
                            <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 line-clamp-2">{venue.description}</p>
                            <div className="flex flex-wrap gap-2 mb-3 sm:mb-4">
                              <Badge variant="outline" className="text-xs">
                                Sleeps {venue.sleeps}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                Max {venue.max_quilters} quilters
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t gap-2">
                              <span className="text-xs sm:text-sm text-muted-foreground">View venue details</span>
                              <Button variant="link" className="text-primary text-xs sm:text-sm p-0 h-auto">
                                View Details →
                              </Button>
                            </div>
                          </CardContent>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 px-4">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-6">
                      <Search className="w-10 h-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">No venues found</h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                      {searchQuery || hasActiveFilters 
                        ? "Try adjusting your search or filters to find more venues." 
                        : "Check back soon for new venues!"}
                    </p>
                    {(searchQuery || hasActiveFilters) && (
                      <Button variant="outline" onClick={clearFilters} className="gap-2">
                        <X className="w-4 h-4" />
                        Clear Filters
                      </Button>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>

      {/* Event Modal */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          {selectedEvent && (
            <>
              <DialogHeader className="px-0">
                <DialogTitle className="text-xl sm:text-2xl pr-8">{selectedEvent.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 sm:space-y-6">
                {/* Event Image */}
                <div className="relative w-full h-48 sm:h-64 rounded-lg overflow-hidden">
                  <img
                    src={selectedEvent.image || "/placeholder.svg"}
                    alt={selectedEvent.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Event Details */}
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center gap-2">
                    <img
                      src={selectedEvent.instructor.avatar || "/placeholder.svg"}
                      alt={selectedEvent.instructor.name}
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-sm sm:text-base truncate">with {selectedEvent.instructor.name}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">Instructor</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">Location</p>
                        <p className="font-medium text-sm sm:text-base break-words">{selectedEvent.location}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">Date</p>
                        <p className="font-medium text-sm sm:text-base">{selectedEvent.date}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">Duration</p>
                        <p className="font-medium text-sm sm:text-base">{selectedEvent.duration}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Users className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">Availability</p>
                        <p className="font-medium text-sm sm:text-base">{selectedEvent.spots_available} of {selectedEvent.total_spots} spots</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-3 sm:pt-4 border-t gap-3">
                    <div>
                      <p className="text-xl sm:text-2xl font-bold text-primary">${selectedEvent.price}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">per person</p>
                    </div>
                    <Button onClick={() => navigate(`/retreat/${selectedEvent.id}`)} className="w-full sm:w-auto text-sm sm:text-base">
                      View Full Details
                    </Button>
                  </div>

                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{selectedEvent.description}</p>
                  </div>
                </div>

                {/* Venue Carousel */}
                {eventVenue && eventVenue.photos && eventVenue.photos.length > 0 && (
                  <div className="space-y-2 sm:space-y-3 pt-4 sm:pt-6 border-t">
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

      {/* Venue Modal */}
      <Dialog open={!!selectedVenue} onOpenChange={() => setSelectedVenue(null)}>
        <DialogContent className="max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          {selectedVenue && (
            <>
              <DialogHeader className="px-0">
                <DialogTitle className="text-xl sm:text-2xl pr-8">{selectedVenue.property_name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 sm:space-y-6">
                {/* Venue Image */}
                {selectedVenue.photos && selectedVenue.photos.length > 0 && (
                  <div className="relative w-full h-48 sm:h-64 rounded-lg overflow-hidden">
                    <img
                      src={selectedVenue.photos[0]}
                      alt={selectedVenue.property_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Venue Details */}
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground flex-shrink-0" />
                    <span className="font-medium text-sm sm:text-base break-words">{selectedVenue.location}</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-xs">Sleeps {selectedVenue.sleeps}</Badge>
                    <Badge variant="outline" className="text-xs">Max {selectedVenue.max_quilters} quilters</Badge>
                    <Badge className="bg-green-100 text-green-700 text-xs">{selectedVenue.status}</Badge>
                  </div>

                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{selectedVenue.description}</p>
                  </div>
                </div>

                {/* Events Carousel */}
                {venueEvents.length > 0 && (
                  <div className="space-y-2 sm:space-y-3 pt-4 sm:pt-6 border-t">
                    <h3 className="font-semibold text-base sm:text-lg">Events at this venue ({venueEvents.length})</h3>
                    <Carousel className="w-full">
                      <CarouselContent className="-ml-2 sm:-ml-4">
                        {venueEvents.map((event) => (
                          <CarouselItem key={event.id} className="pl-2 sm:pl-4 basis-full sm:basis-1/2 lg:basis-1/3">
                            <Card className="overflow-hidden cursor-pointer" onClick={() => {
                              setSelectedVenue(null);
                              handleEventClick(event);
                            }}>
                              <div className="relative h-28 sm:h-32">
                                <img
                                  src={event.image || "/placeholder.svg"}
                                  alt={event.title}
                                  className="w-full h-full object-cover"
                                />
                                <Badge className={`absolute top-1.5 right-1.5 sm:top-2 sm:right-2 text-xs ${levelColors[event.level] || levelColors.Beginner}`}>
                                  {event.level}
                                </Badge>
                              </div>
                              <CardContent className="p-2.5 sm:p-3">
                                <h4 className="font-semibold text-xs sm:text-sm mb-1 line-clamp-1">{event.title}</h4>
                                <p className="text-xs text-muted-foreground mb-1.5 sm:mb-2 truncate">{event.date}</p>
                                <p className="text-base sm:text-lg font-bold text-primary">${event.price}</p>
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

      {/* Filter Sheet */}
      <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
        <SheetContent side="bottom" className="h-[90vh] sm:h-[85vh] max-h-[800px] rounded-t-3xl p-4 sm:p-6">
          <SheetHeader className="text-left pb-3 sm:pb-4 border-b">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 flex-shrink-0">
                <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <SheetTitle className="text-xl sm:text-2xl">Filter & Sort</SheetTitle>
                <SheetDescription className="text-sm sm:text-base mt-1">
                  Refine your search to find the perfect {activeTab === "events" ? "event" : "venue"}
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>
          
          <div className="mt-4 sm:mt-6 space-y-6 sm:space-y-8 overflow-y-auto pb-20 sm:pb-24 max-h-[calc(90vh-180px)] sm:max-h-[calc(90vh-200px)]">
            {/* Date Range Filters - Only for events */}
            {activeTab === "events" && (
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                  <Label className="text-base sm:text-lg font-semibold">Date Range</Label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs sm:text-sm font-medium text-muted-foreground">From Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={`w-full justify-start text-left font-normal h-11 sm:h-12 border-2 transition-all text-sm sm:text-base ${
                            dateFrom ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                          }`}
                        >
                          <CalendarIcon className="mr-2 sm:mr-3 h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                          <span className={`truncate ${dateFrom ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                            {dateFrom ? format(dateFrom, "PPP") : "Select start date"}
                          </span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={dateFrom}
                          onSelect={setDateFrom}
                          initialFocus
                          className="rounded-md border"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs sm:text-sm font-medium text-muted-foreground">To Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={`w-full justify-start text-left font-normal h-11 sm:h-12 border-2 transition-all text-sm sm:text-base ${
                            dateTo ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                          }`}
                        >
                          <CalendarIcon className="mr-2 sm:mr-3 h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                          <span className={`truncate ${dateTo ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                            {dateTo ? format(dateTo, "PPP") : "Select end date"}
                          </span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={dateTo}
                          onSelect={setDateTo}
                          initialFocus
                          disabled={(date) => dateFrom ? date < dateFrom : false}
                          className="rounded-md border"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>
            )}

            {/* Duration Filter - Only for events */}
            {activeTab === "events" && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                  <Label className="text-base sm:text-lg font-semibold">Number of Days</Label>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs sm:text-sm font-medium text-muted-foreground">Min Days</Label>
                    <Select value={minDays} onValueChange={setMinDays}>
                      <SelectTrigger className="h-11 sm:h-12 text-sm sm:text-base">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Any</SelectItem>
                        <SelectItem value="1">1 day</SelectItem>
                        <SelectItem value="2">2 days</SelectItem>
                        <SelectItem value="3">3 days</SelectItem>
                        <SelectItem value="4">4 days</SelectItem>
                        <SelectItem value="5">5+ days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs sm:text-sm font-medium text-muted-foreground">Max Days</Label>
                    <Select value={maxDays} onValueChange={setMaxDays}>
                      <SelectTrigger className="h-11 sm:h-12 text-sm sm:text-base">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Any</SelectItem>
                        <SelectItem value="1">1 day</SelectItem>
                        <SelectItem value="2">2 days</SelectItem>
                        <SelectItem value="3">3 days</SelectItem>
                        <SelectItem value="4">4 days</SelectItem>
                        <SelectItem value="5">5+ days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Event Type Filter - Only for events */}
            {activeTab === "events" && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Monitor className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                  <Label className="text-base sm:text-lg font-semibold">Event Type</Label>
                </div>
                <Select value={eventType} onValueChange={setEventType}>
                  <SelectTrigger className="h-11 sm:h-12 text-sm sm:text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="online">Online / Virtual</SelectItem>
                    <SelectItem value="in-person">In-Person</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Price Filter - Only for events */}
            {activeTab === "events" && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                  <Label className="text-base sm:text-lg font-semibold">Price Range</Label>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs sm:text-sm font-medium text-muted-foreground">Min Price</Label>
                    <Input
                      type="number"
                      placeholder="$0"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      className="h-11 sm:h-12 text-sm sm:text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs sm:text-sm font-medium text-muted-foreground">Max Price</Label>
                    <Input
                      type="number"
                      placeholder="$1000"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      className="h-11 sm:h-12 text-sm sm:text-base"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Location Filter */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-accent flex-shrink-0" />
                <Label className="text-base sm:text-lg font-semibold">Location</Label>
              </div>
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger className="h-11 sm:h-12 border-2 text-sm sm:text-base">
                  <MapPin className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                  <SelectValue placeholder="All locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-sm sm:text-base">All Locations</SelectItem>
                  {uniqueLocations.map((location) => (
                    <SelectItem key={location} value={location} className="text-sm sm:text-base">
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sort Options */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                <Label className="text-base sm:text-lg font-semibold">Sort By</Label>
              </div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-11 sm:h-12 border-2 text-sm sm:text-base">
                  <TrendingUp className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {activeTab === "events" ? (
                    <>
                      <SelectItem value="upcoming" className="text-sm sm:text-base">Soonest Upcoming</SelectItem>
                      <SelectItem value="newest" className="text-sm sm:text-base">Most Recently Added</SelectItem>
                      <SelectItem value="price-low" className="text-sm sm:text-base">Price: Low to High</SelectItem>
                      <SelectItem value="price-high" className="text-sm sm:text-base">Price: High to Low</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="newest" className="text-sm sm:text-base">Most Recently Added</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <SheetFooter className="flex-row gap-2 sm:gap-3 border-t pt-3 sm:pt-4 mt-3 sm:mt-4">
            <Button
              variant="outline"
              onClick={clearFilters}
              className="flex-1 sm:flex-initial h-11 sm:h-12 text-sm sm:text-base font-medium"
            >
              <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
              Clear All
            </Button>
            <Button
              onClick={() => setFilterSheetOpen(false)}
              className="flex-1 sm:flex-initial h-11 sm:h-12 text-sm sm:text-base font-medium bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
              Apply Filters
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Bottom Navigation - only show if logged in */}
      {user && <BottomNav />}
    </div>
  );
};

export default Index;
