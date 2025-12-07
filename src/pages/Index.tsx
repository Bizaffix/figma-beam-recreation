import { useState, useEffect, useMemo } from "react";
import { RetreatCard } from "@/components/RetreatCard";
import { BottomNav } from "@/components/BottomNav";
import { Input } from "@/components/ui/input";
import { Search, SlidersHorizontal, Calendar as CalendarIcon, MapPin, X, ArrowUpDown, Filter, Sparkles, TrendingUp } from "lucide-react";
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
import { format } from "date-fns";

interface RetreatData {
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
  instructor: {
    name: string;
    avatar: string;
    bio: string;
  };
}

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [retreats, setRetreats] = useState<RetreatData[]>([]);
  const [loading, setLoading] = useState(true);
  const { role, user } = useAuth();
  
  // Filter states
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  
  // Fetch published retreats from Supabase
  useEffect(() => {
    const fetchRetreats = async () => {
      try {
        // Fetch published retreats with instructor info
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
          // Transform data to match component expectations
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
            instructor: {
              name: retreat.instructor?.full_name || 'Instructor',
              avatar: retreat.instructor?.avatar_url || '',
              bio: retreat.instructor?.bio || '',
              facebook: retreat.instructor?.facebook_url || '',
              instagram: retreat.instructor?.instagram_url || '',
              pinterest: retreat.instructor?.pinterest_url || '',
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

  // Get unique locations for filter dropdown
  const uniqueLocations = useMemo(() => {
    const locations = Array.from(new Set(retreats.map(r => r.location))).sort();
    return locations;
  }, [retreats]);

  // Filter and sort retreats
  const filteredAndSortedRetreats = useMemo(() => {
    let filtered = [...retreats];

    // Text search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((retreat) =>
        retreat.title.toLowerCase().includes(query) ||
        retreat.location.toLowerCase().includes(query) ||
        retreat.instructor.name.toLowerCase().includes(query)
      );
    }

    // Location filter
    if (selectedLocation !== "all") {
      filtered = filtered.filter((retreat) => retreat.location === selectedLocation);
    }

    // Date range filter
    if (dateFrom) {
      filtered = filtered.filter((retreat) => {
        const retreatDate = new Date(retreat.date);
        retreatDate.setHours(0, 0, 0, 0);
        const fromDate = new Date(dateFrom);
        fromDate.setHours(0, 0, 0, 0);
        return retreatDate >= fromDate;
      });
    }
    if (dateTo) {
      filtered = filtered.filter((retreat) => {
        const retreatDate = new Date(retreat.date);
        retreatDate.setHours(0, 0, 0, 0);
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        return retreatDate <= toDate;
      });
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case "oldest":
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case "price-low":
          return a.price - b.price;
        case "price-high":
          return b.price - a.price;
        case "location":
          return a.location.localeCompare(b.location);
        case "title":
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    return filtered;
  }, [retreats, searchQuery, selectedLocation, dateFrom, dateTo, sortBy]);

  // Check if any filters are active
  const hasActiveFilters = dateFrom || dateTo || selectedLocation !== "all" || sortBy !== "newest";

  // Clear all filters
  const clearFilters = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
    setSelectedLocation("all");
    setSortBy("newest");
  };

  return (
    <div className="min-h-screen bg-gradient-hero pb-20">
      {/* Header - only show if not logged in */}
      {!user && <Header />}
      
      {/* Hero Section */}
      <div className="bg-gradient-primary text-white px-6 py-8 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full blur-3xl"></div>
        </div>
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">Quilting Retreats</h1>
          <p className="text-white/90 text-lg">Discover, Learn, and Connect</p>
        </div>
      </div>

      {/* Search & Filter Section */}
      <div className="px-6 -mt-4 mb-6 space-y-4">
        {/* Search Bar with Enhanced Styling */}
        <div className="flex gap-3">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
            <Input
              placeholder="Search by title, location, or instructor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-4 bg-card shadow-lg border-2 border-transparent focus:border-primary/20 h-14 text-base transition-all duration-200 hover:shadow-xl"
            />
          </div>
          <Button 
            size="icon" 
            className={`h-14 w-14 bg-card text-foreground hover:bg-primary hover:text-primary-foreground shadow-lg transition-all duration-300 relative group ${
              hasActiveFilters 
                ? 'ring-2 ring-primary ring-offset-2 bg-primary/10' 
                : 'hover:scale-105'
            }`}
            onClick={() => setFilterSheetOpen(true)}
          >
            <SlidersHorizontal className={`w-5 h-5 transition-transform duration-200 ${hasActiveFilters ? 'text-primary' : ''} group-hover:rotate-90`} />
            {hasActiveFilters && (
              <>
                <span className="absolute top-2 right-2 w-3 h-3 bg-primary rounded-full animate-pulse" />
                <span className="absolute top-2 right-2 w-3 h-3 bg-primary rounded-full animate-ping" />
              </>
            )}
          </Button>
        </div>
        
        {/* Results Count & Active Filters */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="font-medium">
              {loading ? (
                "Loading..."
              ) : (
                <>
                  <span className="text-foreground font-semibold">{filteredAndSortedRetreats.length}</span>{" "}
                  {filteredAndSortedRetreats.length === 1 ? "retreat found" : "retreats found"}
                </>
              )}
            </span>
          </div>
          
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-7 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50"
            >
              <X className="w-3 h-3 mr-1" />
              Clear All Filters
            </Button>
          )}
        </div>
        
        {/* Active Filters Display - Enhanced */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 animate-in slide-in-from-top-2 duration-300">
            {dateFrom && (
              <Badge 
                variant="secondary" 
                className="gap-1.5 px-3 py-1.5 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors cursor-default group"
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                <span className="font-medium">From: {format(dateFrom, "MMM d, yyyy")}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDateFrom(undefined);
                  }}
                  className="ml-1 hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            {dateTo && (
              <Badge 
                variant="secondary" 
                className="gap-1.5 px-3 py-1.5 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors cursor-default group"
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                <span className="font-medium">To: {format(dateTo, "MMM d, yyyy")}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDateTo(undefined);
                  }}
                  className="ml-1 hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            {selectedLocation !== "all" && (
              <Badge 
                variant="secondary" 
                className="gap-1.5 px-3 py-1.5 bg-accent/10 text-accent border-accent/20 hover:bg-accent/20 transition-colors cursor-default group"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span className="font-medium">{selectedLocation}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedLocation("all");
                  }}
                  className="ml-1 hover:bg-accent/20 rounded-full p-0.5 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            {sortBy !== "newest" && (
              <Badge 
                variant="secondary" 
                className="gap-1.5 px-3 py-1.5 bg-secondary text-secondary-foreground border-border hover:bg-secondary/80 transition-colors cursor-default group"
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span className="font-medium">
                  {sortBy === "oldest" ? "Oldest First" : 
                   sortBy === "price-low" ? "Price: Low to High" :
                   sortBy === "price-high" ? "Price: High to Low" :
                   sortBy === "location" ? "By Location" :
                   sortBy === "title" ? "By Title" : ""}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSortBy("newest");
                  }}
                  className="ml-1 hover:bg-secondary-foreground/10 rounded-full p-0.5 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Retreat Cards */}
      <div className="px-6 space-y-6 max-w-4xl mx-auto">
        {loading ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Search className="w-8 h-8 text-primary animate-pulse" />
            </div>
            <p className="text-muted-foreground text-lg font-medium">Loading retreats...</p>
            <p className="text-muted-foreground text-sm mt-2">Please wait a moment</p>
          </div>
        ) : filteredAndSortedRetreats.length > 0 ? (
          filteredAndSortedRetreats.map((retreat) => (
            <RetreatCard
              key={retreat.id}
              id={retreat.id}
              image={retreat.image || "/placeholder.svg"}
              level={retreat.level}
              title={retreat.title}
              instructor={{
                name: retreat.instructor.name,
                avatar: retreat.instructor.avatar,
              }}
              location={retreat.location}
              date={retreat.date}
              duration={retreat.duration}
              spotsAvailable={retreat.spots_available}
              totalSpots={retreat.total_spots}
              price={retreat.price}
            />
          ))
        ) : (
          <div className="text-center py-16 px-4">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-6">
              <Search className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              {searchQuery || hasActiveFilters 
                ? "No retreats found" 
                : "No retreats available"}
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {searchQuery || hasActiveFilters 
                ? "Try adjusting your search or filters to find more retreats." 
                : "Check back soon for new quilting retreats!"}
            </p>
            {(searchQuery || hasActiveFilters) && (
              <Button
                variant="outline"
                onClick={clearFilters}
                className="gap-2"
              >
                <X className="w-4 h-4" />
                Clear Filters
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Filter Sheet - Enhanced */}
      <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
        <SheetContent side="bottom" className="h-[90vh] max-h-[800px] rounded-t-3xl">
          <SheetHeader className="text-left pb-4 border-b">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Filter className="w-5 h-5 text-primary" />
              </div>
              <div>
                <SheetTitle className="text-2xl">Filter & Sort</SheetTitle>
                <SheetDescription className="text-base mt-1">
                  Refine your search to find the perfect retreat
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>
          
          <div className="mt-6 space-y-8 overflow-y-auto pb-24 max-h-[calc(90vh-200px)]">
            {/* Date Range Filters - Enhanced */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-primary" />
                <Label className="text-lg font-semibold">Date Range</Label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">From Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={`w-full justify-start text-left font-normal h-12 border-2 transition-all ${
                          dateFrom ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                        }`}
                      >
                        <CalendarIcon className="mr-3 h-4 w-4 text-primary" />
                        <span className={dateFrom ? 'font-medium text-foreground' : 'text-muted-foreground'}>
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
                  <Label className="text-sm font-medium text-muted-foreground">To Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={`w-full justify-start text-left font-normal h-12 border-2 transition-all ${
                          dateTo ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                        }`}
                      >
                        <CalendarIcon className="mr-3 h-4 w-4 text-primary" />
                        <span className={dateTo ? 'font-medium text-foreground' : 'text-muted-foreground'}>
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
              {(dateFrom || dateTo) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setDateFrom(undefined);
                    setDateTo(undefined);
                  }}
                  className="text-xs gap-1 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3 h-3" />
                  Clear date filters
                </Button>
              )}
            </div>

            {/* Location Filter - Enhanced */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-accent" />
                <Label className="text-lg font-semibold">Location</Label>
              </div>
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger className="h-12 border-2 text-base">
                  <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="All locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-base">All Locations</SelectItem>
                  {uniqueLocations.map((location) => (
                    <SelectItem key={location} value={location} className="text-base">
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sort Options - Enhanced */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <Label className="text-lg font-semibold">Sort By</Label>
              </div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-12 border-2 text-base">
                  <TrendingUp className="mr-2 h-4 w-4 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest" className="text-base">Newest First</SelectItem>
                  <SelectItem value="oldest" className="text-base">Oldest First</SelectItem>
                  <SelectItem value="price-low" className="text-base">Price: Low to High</SelectItem>
                  <SelectItem value="price-high" className="text-base">Price: High to Low</SelectItem>
                  <SelectItem value="location" className="text-base">Location (A-Z)</SelectItem>
                  <SelectItem value="title" className="text-base">Title (A-Z)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <SheetFooter className="flex-row gap-3 sm:gap-3 border-t pt-4 mt-4">
            <Button
              variant="outline"
              onClick={clearFilters}
              className="flex-1 sm:flex-initial h-12 text-base font-medium"
            >
              <X className="w-4 h-4 mr-2" />
              Clear All
            </Button>
            <Button
              onClick={() => setFilterSheetOpen(false)}
              className="flex-1 sm:flex-initial h-12 text-base font-medium bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Sparkles className="w-4 h-4 mr-2" />
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
