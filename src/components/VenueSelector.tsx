import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  MapPin, 
  Building2, 
  Users, 
  BedDouble, 
  ExternalLink, 
  Search,
  CheckCircle2,
  Home,
  DollarSign,
  Star,
  MessageSquare
} from "lucide-react";
import {
  useLazyGetVenuesQuery,
  useCreateEventRequestMutation,
} from "@/services/server";
import { toLegacyProperty } from "@/services/mappers";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import MessagingSystem from "@/components/MessagingSystem";

interface Property {
  id: string;
  property_name: string;
  location: string;
  description: string;
  photos: string[];
  sleeps: number;
  max_quilters: number;
  status: 'draft' | 'published' | 'verified';
  views: number;
  saves: number;
  inquiries: number;
  base_pricing: Record<string, number>;
  stay_types: string[];
  dedicated_sewing_room: boolean;
  max_sewing_stations: number;
  outlets_near_stations: boolean;
  iron_support: boolean;
  cutting_stations: number;
  pressing_stations: number;
  irons_provided: boolean;
  design_walls: string;
  quiet_hours: string;
  natural_light: string;
  accessibility: boolean;
  house_rules: string[];
  owner_id: string;
}

interface VenueSelectorProps {
  selectedLocation: string;
  onLocationChange: (location: string, venueData?: Property) => void;
}

type LocationType = 'link' | 'venue';

export const VenueSelector = ({ selectedLocation, onLocationChange }: VenueSelectorProps) => {
  const [locationType, setLocationType] = useState<LocationType>('link');
  const [venues, setVenues] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVenue, setSelectedVenue] = useState<Property | null>(null);
  const [showMessagingDialog, setShowMessagingDialog] = useState(false);
  const [messagingVenue, setMessagingVenue] = useState<Property | null>(null);
  const { toast } = useToast();
  const { user, role } = useAuth();
  const [triggerGetVenues] = useLazyGetVenuesQuery();
  const [createEventRequestMutation] = useCreateEventRequestMutation();

  useEffect(() => {
    if (locationType === 'venue') {
      fetchPublishedVenues();
    }
  }, [locationType]);

  const fetchPublishedVenues = async () => {
    setLoading(true);
    try {
      const items = await triggerGetVenues({ limit: 100 }).unwrap();
      const published = items
        .map((v) => toLegacyProperty(v))
        .filter((v) => ["published", "verified"].includes(String(v.status ?? "")));
      setVenues(published as unknown as Property[]);
    } catch (error) {
      console.error('Error fetching venues:', error);
      toast({
        title: "Error",
        description: "Failed to load venues",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredVenues = venues.filter(venue => 
    venue.property_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    venue.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    venue.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleVenueSelect = (venue: Property) => {
    setSelectedVenue(venue);
    onLocationChange(venue.location, venue);
  };

  const handleLinkChange = (link: string) => {
    onLocationChange(link);
    setSelectedVenue(null);
  };

  const handleLocationTypeChange = (type: LocationType) => {
    setLocationType(type);
    if (type === 'link') {
      setSelectedVenue(null);
      onLocationChange('https://maps.app.goo.gl/GNhCfeCM7CHMpHW5A');
    } else {
      setSelectedVenue(null);
    }
  };

  const handleMessageVenue = (venue: Property, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent venue selection when clicking message button
    setMessagingVenue(venue);
    setShowMessagingDialog(true);
  };

  const createEventRequestForMessaging = async (venue: Property) => {
    if (!user || role !== 'instructor') return null;

    try {
      const data = await createEventRequestMutation({
        eventTitle: "Venue Inquiry",
        instructorName: user.user_metadata?.first_name && user.user_metadata?.last_name
          ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
          : user.email?.split("@")[0] || "Instructor",
        instructorId: user.id,
        propertyName: venue.property_name,
        venueId: venue.id,
        propertyOwnerId: venue.owner_id,
        startDate: new Date().toISOString().split("T")[0],
        endDate: new Date().toISOString().split("T")[0],
        expectedAttendees: 1,
        status: "pending",
        basicSchedule: {
          check_in: "Flexible",
          check_out: "Flexible",
          sewing_hours: "Flexible",
          meals: [],
        },
      }).unwrap();
      return data;
    } catch (error) {
      console.error('Error creating event request for messaging:', error);
      return null;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <Label className="text-sm font-semibold text-foreground mb-3 sm:mb-4 block">
          Location Selection Type
        </Label>
        <RadioGroup value={locationType} onValueChange={handleLocationTypeChange}>
          <div className="flex items-start sm:items-center space-x-2 mb-3">
            <RadioGroupItem value="link" id="link" className="mt-1 sm:mt-0" />
            <Label htmlFor="link" className="flex items-center gap-2 cursor-pointer text-sm">
              <ExternalLink className="w-4 h-4 flex-shrink-0" />
              <span>Location Link (Google Maps, etc.)</span>
            </Label>
          </div>
          <div className="flex items-start sm:items-center space-x-2">
            <RadioGroupItem value="venue" id="venue" className="mt-1 sm:mt-0" />
            <Label htmlFor="venue" className="flex items-center gap-2 cursor-pointer text-sm">
              <Building2 className="w-4 h-4 flex-shrink-0" />
              <span>Live Venue Selection</span>
            </Label>
          </div>
        </RadioGroup>
      </div>

      <Separator />

      {locationType === 'link' ? (
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-foreground">Location Link</Label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <Input
              value={selectedLocation}
              onChange={(e) => handleLinkChange(e.target.value)}
              placeholder="Enter Google Maps link or location URL"
              className="pl-10 pr-10 h-10 sm:h-12 text-sm sm:text-base border-2 focus:border-primary transition-colors rounded-lg"
            />
            {selectedLocation && (selectedLocation.startsWith('http://') || selectedLocation.startsWith('https://')) && (
              <a
                href={selectedLocation}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-primary hover:text-primary/80 transition-colors"
                title="Open location in new tab"
              >
                <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5" />
              </a>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Provide a Google Maps link or any location URL for your event
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search venues by name, location, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 text-sm sm:text-base"
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading venues...</p>
            </div>
          ) : filteredVenues.length === 0 ? (
            <Card className="text-center py-8">
              <CardContent>
                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {searchTerm ? 'No Venues Found' : 'No Published Venues Yet'}
                </h3>
                <p className="text-muted-foreground">
                  {searchTerm 
                    ? 'Try adjusting your search terms'
                    : 'Published venues from location owners will appear here'
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="h-96">
              <div className="space-y-4">
                {filteredVenues.map((venue) => (
                  <Card 
                    key={venue.id} 
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedVenue?.id === venue.id 
                        ? 'ring-2 ring-primary border-primary' 
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => handleVenueSelect(venue)}
                  >
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex gap-3 sm:gap-4">
                        {/* Venue Image */}
                        <div className="flex-shrink-0">
                          <img
                            src={venue.photos[0] || '/placeholder.svg'}
                            alt={venue.property_name}
                            className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg"
                          />
                        </div>

                        {/* Venue Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-2 gap-2">
                            <div className="min-w-0 flex-1">
                              <h4 className="font-semibold text-foreground text-sm sm:text-base truncate">
                                {venue.property_name}
                              </h4>
                              <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground mt-1">
                                <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span className="truncate">{venue.location}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 sm:ml-2">
                              <Badge 
                                variant={venue.status === 'verified' ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {venue.status}
                              </Badge>
                              {selectedVenue?.id === venue.id && (
                                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                              )}
                            </div>
                          </div>

                          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-3">
                            {venue.description}
                          </p>

                          {/* Venue Features - Responsive Grid */}
                          <div className="flex flex-wrap gap-1 sm:gap-2 mb-3">
                            <Badge variant="outline" className="text-xs">
                              <BedDouble className="w-3 h-3 mr-1" />
                              <span className="hidden sm:inline">Sleeps</span>
                              {venue.sleeps}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              <Users className="w-3 h-3 mr-1" />
                              <span className="hidden sm:inline">Max</span>
                              {venue.max_quilters}
                              <span className="hidden sm:inline">quilters</span>
                            </Badge>
                            {venue.dedicated_sewing_room && (
                              <Badge variant="outline" className="text-xs">
                                <Home className="w-3 h-3 mr-1" />
                                <span className="hidden sm:inline">Sewing</span>
                                <span className="sm:hidden">Sew</span>
                                Room
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-xs">
                              <Users className="w-3 h-3 mr-1" />
                              {venue.max_sewing_stations}
                              <span className="hidden sm:inline">stations</span>
                              <span className="sm:hidden">st</span>
                            </Badge>
                            {venue.accessibility && (
                              <Badge variant="outline" className="text-xs">
                                <Star className="w-3 h-3 mr-1" />
                                <span className="hidden sm:inline">Accessible</span>
                                <span className="sm:hidden">Acc</span>
                              </Badge>
                            )}
                          </div>

                          {/* Pricing */}
                          {Object.keys(venue.base_pricing).length > 0 && (
                            <div className="flex items-center gap-2 text-xs sm:text-sm mb-3">
                              <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                              <span className="text-green-600 font-medium">
                                From ${Object.values(venue.base_pricing)[0]}/night
                              </span>
                            </div>
                          )}

                          {/* Message Button */}
                          {role === 'instructor' && (
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => handleMessageVenue(venue, e)}
                                className="text-xs h-8 px-3"
                              >
                                <MessageSquare className="w-3 h-3 mr-1" />
                                Message Owner
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}

          {selectedVenue && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  <h4 className="font-semibold text-foreground text-sm sm:text-base">Selected Venue</h4>
                </div>
                <div className="text-xs sm:text-sm space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                    <span className="font-medium">Name:</span>
                    <span className="text-muted-foreground">{selectedVenue.property_name}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                    <span className="font-medium">Location:</span>
                    <span className="text-muted-foreground truncate">{selectedVenue.location}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                    <span className="font-medium">Capacity:</span>
                    <span className="text-muted-foreground">
                      Sleeps {selectedVenue.sleeps}, Max {selectedVenue.max_quilters} quilters
                    </span>
                  </div>
                  {selectedVenue.dedicated_sewing_room && (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <span className="font-medium">Features:</span>
                      <span className="text-muted-foreground">
                        Dedicated sewing room with {selectedVenue.max_sewing_stations} stations
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Messaging Dialog */}
      <Dialog open={showMessagingDialog} onOpenChange={setShowMessagingDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Message Venue Owner</DialogTitle>
          </DialogHeader>
          {messagingVenue && (
            <div className="space-y-4">
              <div className="bg-muted/50 p-3 rounded-lg">
                <div className="flex items-center gap-3">
                  <img
                    src={messagingVenue.photos[0] || '/placeholder.svg'}
                    alt={messagingVenue.property_name}
                    className="w-12 h-12 object-cover rounded-lg"
                  />
                  <div>
                    <h4 className="font-semibold">{messagingVenue.property_name}</h4>
                    <p className="text-sm text-muted-foreground">{messagingVenue.location}</p>
                  </div>
                </div>
              </div>
              <MessagingSystem 
                context="event_request"
                eventRequest={{
                  id: 'temp-' + messagingVenue.id,
                  event_title: 'Venue Inquiry',
                  instructor_name: user?.user_metadata?.first_name && user?.user_metadata?.last_name 
                    ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
                    : user?.email?.split('@')[0] || 'Instructor',
                  instructor_id: user?.id || '',
                  property_name: messagingVenue.property_name,
                  property_id: messagingVenue.id,
                  property_owner_id: messagingVenue.owner_id,
                  start_date: new Date().toISOString().split('T')[0],
                  end_date: new Date().toISOString().split('T')[0],
                  expected_headcount: 1,
                  status: 'pending' as const,
                  basic_schedule: {
                    check_in: 'Flexible',
                    check_out: 'Flexible',
                    sewing_hours: 'Flexible',
                    meals: []
                  },
                  created_at: new Date().toISOString()
                }}
                onClose={() => setShowMessagingDialog(false)} 
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
