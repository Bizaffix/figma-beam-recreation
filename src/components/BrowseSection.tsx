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
  const [minDays, setMinDays] = useState<string>("all");
  const [maxDays, setMaxDays] = useState<string>("all");
  const [eventType, setEventType] = useState<string>("all");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("upcoming");

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
  }, [retreats, searchQuery, selectedLocation, dateFrom, dateTo, minDays, maxDays, eventType, minPrice, maxPrice, sortBy]);

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

    filtered.sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return filtered;
  }, [venues, searchQuery, selectedLocation]);

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

  const hasActiveFilters = dateFrom || dateTo || selectedLocation !== "all" || minDays !== "all" || maxDays !== "all" || eventType !== "all" || minPrice || maxPrice || sortBy !== "upcoming";

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

  const levelColors = {
    Any: "bg-blue-100 text-blue-700",
    Beginner: "bg-emerald-100 text-emerald-700",
    Intermediate: "bg-amber-100 text-amber-700",
    Advanced: "bg-rose-100 text-rose-700",
  };

  return (
    <section className="py-8 sm:py-12 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            Discover Your Next Quilting Adventure
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            Explore upcoming retreats and beautiful venues where creativity comes to life
          </p>
        </div>

        {/* Tabs with Cute Icons */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "events" | "venues")} className="w-full mb-6">
          <TabsList className="grid w-full grid-cols-2 bg-white border-2 border-primary/20 rounded-xl p-1 h-auto">
            <TabsTrigger 
              value="events" 
              className="data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg py-3 px-4 transition-all"
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 data-[state=active]:bg-white/20">
                  <Scissors className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <span className="font-semibold text-sm sm:text-base">Events</span>
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="venues" 
              className="data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg py-3 px-4 transition-all"
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 data-[state=active]:bg-white/20">
                  <Home className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <span className="font-semibold text-sm sm:text-base">Venues</span>
              </div>
            </TabsTrigger>
          </TabsList>

          {/* Search Bar */}
          <div className="flex gap-2 sm:gap-3 mb-4 sm:mb-6 mt-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
              <Input
                placeholder={activeTab === "events" ? "Search events..." : "Search venues..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 sm:pl-12 pr-4 bg-white border-2 border-primary/20 focus:border-primary h-12 sm:h-14 text-sm sm:text-base rounded-xl"
              />
            </div>
            <Button 
              size="icon" 
              className={`h-12 w-12 sm:h-14 sm:w-14 border-2 transition-all rounded-xl shadow-md hover:shadow-lg relative ${
                hasActiveFilters 
                  ? 'bg-primary text-white border-primary shadow-lg' 
                  : 'bg-primary/10 border-primary text-primary hover:bg-primary hover:text-white hover:border-primary'
              }`}
              onClick={() => setFilterSheetOpen(true)}
            >
              <SlidersHorizontal className="w-4 h-4 sm:w-5 sm:h-5" />
              {hasActiveFilters && (
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-accent rounded-full border-2 border-white"></span>
              )}
            </Button>
          </div>

          {/* Feed Content - Horizontal Scroll */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                <Sparkles className="w-6 h-6 text-primary animate-pulse" />
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
                            className="overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer border border-border hover:border-primary/50 rounded-2xl bg-white group"
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
                                className="absolute top-3 right-3 h-9 w-9 bg-white/90 hover:bg-white rounded-full shadow-md hover:shadow-lg z-10"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Handle save functionality
                                }}
                              >
                                <Heart className="w-4 h-4 text-gray-700 hover:text-primary hover:fill-primary transition-colors" />
                              </Button>
                              {/* Level Badge - Top Left */}
                              <Badge className={`absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 shadow-md ${levelColors[event.level] || levelColors.Beginner}`}>
                                {event.level}
                              </Badge>
                              {/* Guest Favorite Badge - Optional, can add logic later */}
                              {event.spots_available < event.total_spots * 0.3 && (
                                <Badge className="absolute bottom-3 left-3 text-xs font-semibold px-2.5 py-1 bg-white/95 text-gray-800 shadow-md border border-gray-200">
                                  Popular
                                </Badge>
                              )}
                            </div>
                            
                            {/* Content Section */}
                            <CardContent className="p-4 space-y-2.5">
                              {/* Location */}
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <MapPin className="w-3 h-3 flex-shrink-0" />
                                <span className="line-clamp-1 font-medium">{event.location || "Location TBD"}</span>
                              </div>
                              
                              {/* Title */}
                              <h3 className="font-semibold text-base leading-tight line-clamp-2 text-foreground group-hover:text-primary transition-colors min-h-[2.5rem]">
                                {event.title || "Untitled Event"}
                              </h3>
                              
                              {/* Instructor */}
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                with {event.instructor?.name || "Organizer"}
                              </p>
                              
                              {/* Date & Duration */}
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <CalendarIcon className="w-3 h-3 flex-shrink-0" />
                                <span className="line-clamp-1">{event.date || "Date TBD"}</span>
                                {event.duration && (
                                  <>
                                    <span>•</span>
                                    <span>{event.duration}</span>
                                  </>
                                )}
                              </div>
                              
                              {/* Price & Availability */}
                              <div className="flex items-center justify-between pt-2 border-t">
                                <div className="flex flex-col">
                                  <div className="flex items-baseline gap-1">
                                    <span className="text-lg font-bold text-primary">
                                      ${event.price ? event.price.toLocaleString() : "0"}
                                    </span>
                                    <span className="text-xs text-muted-foreground">per person</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Users className="w-3 h-3 flex-shrink-0" />
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
                    <CarouselPrevious className="left-0 sm:-left-12 bg-white border-2 border-primary/20 hover:bg-primary hover:text-white shadow-lg" />
                    <CarouselNext className="right-0 sm:-right-12 bg-white border-2 border-primary/20 hover:bg-primary hover:text-white shadow-lg" />
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
                            className="overflow-hidden hover:shadow-xl transition-all cursor-pointer border-2 border-transparent hover:border-primary/30 rounded-xl"
                            onClick={() => setSelectedVenue(venue)}
                          >
                            <div className="relative">
                              <img
                                src={venue.photos?.[0] || "/placeholder.svg"}
                                alt={venue.property_name}
                                className="w-full h-48 sm:h-56 object-cover"
                              />
                              <Badge className="absolute top-2 right-2 text-xs bg-green-100 text-green-700">
                                {venue.status}
                              </Badge>
                            </div>
                            <CardContent className="p-4">
                              <h3 className="font-semibold text-sm sm:text-base mb-1 line-clamp-1">{venue.property_name}</h3>
                              <p className="text-xs text-muted-foreground mb-2 line-clamp-1">{venue.location}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Users className="w-3 h-3" />
                                <span>Sleeps {venue.sleeps} • Max {venue.max_quilters} quilters</span>
                              </div>
                            </CardContent>
                          </Card>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <CarouselPrevious className="left-0 sm:-left-12 bg-white border-2 border-primary/20 hover:bg-primary hover:text-white" />
                    <CarouselNext className="right-0 sm:-right-12 bg-white border-2 border-primary/20 hover:bg-primary hover:text-white" />
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

        {/* View All Button */}
        <div className="mt-6 text-center">
          <Button 
            variant="outline" 
            className="border-2 border-primary text-primary hover:bg-primary hover:text-white rounded-xl px-6"
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
                    <p className="text-xl sm:text-2xl font-bold text-primary">${selectedEvent.price}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">per person</p>
                  </div>
                  <Button onClick={() => navigate(`/retreat/${selectedEvent.id}`)} className="rounded-xl">
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

      {/* Filter Sheet - Simplified for Home Page */}
      <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
        <SheetContent side="bottom" className="h-[85vh] max-h-[700px] rounded-t-3xl p-4 sm:p-6">
          <SheetHeader className="text-left pb-3 sm:pb-4 border-b">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10">
                <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
              <div>
                <SheetTitle className="text-xl sm:text-2xl">Filter & Sort</SheetTitle>
                <SheetDescription className="text-sm sm:text-base mt-1">
                  Refine your search
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>
          
          <div className="mt-4 sm:mt-6 space-y-6 sm:space-y-8 overflow-y-auto pb-20 sm:pb-24 max-h-[calc(85vh-180px)]">
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
                  <Label className="text-base sm:text-lg font-semibold">Location</Label>
                  <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                    <SelectTrigger className="h-11 sm:h-12 text-sm sm:text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Locations</SelectItem>
                      {uniqueLocations.map((location) => (
                        <SelectItem key={location} value={location}>
                          {location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                <Label className="text-base sm:text-lg font-semibold">Location</Label>
                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                  <SelectTrigger className="h-11 sm:h-12 text-sm sm:text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    {uniqueLocations.map((location) => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <SheetFooter className="flex-row gap-2 sm:gap-3 border-t pt-3 sm:pt-4 mt-3 sm:mt-4">
            <Button
              variant="outline"
              onClick={clearFilters}
              className="flex-1 sm:flex-initial h-11 sm:h-12 text-sm sm:text-base rounded-xl"
            >
              <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
              Clear All
            </Button>
            <Button
              onClick={() => setFilterSheetOpen(false)}
              className="flex-1 sm:flex-initial h-11 sm:h-12 text-sm sm:text-base bg-primary hover:bg-primary/90 rounded-xl"
            >
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
              Apply Filters
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </section>
  );
};
