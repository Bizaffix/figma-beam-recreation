import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import MessagingSystem from "@/components/MessagingSystem";
import InstructorModeToggle from "@/components/InstructorModeToggle";
import { 
  Building2, 
  Plus, 
  Calendar as CalendarIcon, 
  Users, 
  TrendingUp, 
  Star,
  Eye,
  Heart,
  MessageSquare,
  Settings,
  ArrowRight,
  MapPin,
  BedDouble,
  CheckCircle2,
  Clock,
  User,
  Mail,
  Phone,
  Home,
  Shield,
  DollarSign,
  CalendarDays
} from "lucide-react";
import { format, isWithinInterval, parseISO } from "date-fns";

interface Property {
  id: string;
  name: string;
  location: string;
  sleeps: number;
  max_quilters: number;
  status: 'draft' | 'published' | 'verified';
  views: number;
  saves: number;
  inquiries: number;
  created_at: string;
  base_pricing: Record<string, number>;
  stay_types: string[];
  house_rules: string[];
  availability_calendar: string[];
}

interface EventRequest {
  id: string;
  event_title: string;
  instructor_name: string;
  property_name: string;
  start_date: string;
  end_date: string;
  expected_headcount: number;
  status: 'pending' | 'approved' | 'declined';
  property_id: string;
  basic_schedule: {
    check_in: string;
    check_out: string;
    sewing_hours: string;
    meals: string[];
  };
  created_at: string;
}

const LocationOwnerDashboard = () => {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [eventRequests, setEventRequests] = useState<EventRequest[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<EventRequest[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<EventRequest | null>(null);
  const [showMessagingDialog, setShowMessagingDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalViews: 0,
    totalSaves: 0,
    totalInquiries: 0,
    publishedProperties: 0,
    pendingRequests: 0
  });

  useEffect(() => {
    if (user) {
      fetchProperties();
    }
  }, [user]);

  useEffect(() => {
    if (selectedProperty) {
      fetchEventRequests();
      fetchCalendarEvents();
    }
  }, [selectedProperty]);

  const fetchEventRequests = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('event_requests')
        .select('*')
        .eq('property_id', selectedProperty?.id || '')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEventRequests(data || []);
    } catch (error) {
      console.error('Error fetching event requests:', error);
    }
  };

  // Fetch approved events for calendar
  const fetchCalendarEvents = async () => {
    if (!user || !selectedProperty) return;
    
    try {
      const { data, error } = await supabase
        .from('event_requests')
        .select('*')
        .eq('property_id', selectedProperty.id)
        .eq('status', 'approved')
        .order('start_date', { ascending: true });

      if (error) throw error;
      setCalendarEvents(data || []);
    } catch (error) {
      console.error('Error fetching calendar events:', error);
    }
  };

  const fetchProperties = async () => {
    try {
      const { data: properties, error } = await supabase
        .from('properties')
        .select('*')
        .eq('owner_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setProperties(properties || []);
      
      if (properties && properties.length > 0) {
        setSelectedProperty(properties[0]);
      }
      
      // Calculate stats
      const stats = properties?.reduce((acc, prop) => {
        return {
          totalViews: acc.totalViews + (prop.views || 0),
          totalSaves: acc.totalSaves + (prop.saves || 0),
          totalInquiries: acc.totalInquiries + (prop.inquiries || 0),
          publishedProperties: acc.publishedProperties + (prop.status === 'published' ? 1 : 0)
        };
      }, { totalViews: 0, totalSaves: 0, totalInquiries: 0, publishedProperties: 0 });

      setStats(stats);
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleEventRequest = async (requestId: string, action: 'approve' | 'decline') => {
    try {
      const { error } = await supabase
        .from('event_requests')
        .update({ status: action === 'approve' ? 'approved' : 'declined' })
        .eq('id', requestId);

      if (error) throw error;

      fetchEventRequests();
      
      // Send notification to instructor
      // TODO: Implement notification system
    } catch (error) {
      console.error('Error updating event request:', error);
    }
  };

  const openMessaging = (request: EventRequest) => {
    setSelectedRequest(request);
    setShowMessagingDialog(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your venues...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Venue Dashboard</h1>
                <p className="text-muted-foreground mt-2">
                  Manage your venue listings and track their performance
                </p>
              </div>
              <Button asChild className="bg-primary hover:bg-primary/90">
                <Link to="/location-owner/properties/new">
                  <Plus className="w-4 h-4 mr-2" />
                  Add a Venue
                </Link>
              </Button>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Views</p>
                    <p className="text-2xl font-bold text-foreground">{stats.totalViews.toLocaleString()}</p>
                  </div>
                  <Eye className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Saves</p>
                    <p className="text-2xl font-bold text-foreground">{stats.totalSaves.toLocaleString()}</p>
                  </div>
                  <Heart className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Inquiries</p>
                    <p className="text-2xl font-bold text-foreground">{stats.totalInquiries.toLocaleString()}</p>
                  </div>
                  <MessageSquare className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Published</p>
                    <p className="text-2xl font-bold text-foreground">{stats.publishedProperties}</p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Pending Requests</p>
                    <p className="text-2xl font-bold text-foreground">{stats.pendingRequests}</p>
                  </div>
                  <Clock className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Property Selector and Calendar View */}
          {properties.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Property Selector */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Your Venues</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {properties.map((property) => (
                      <div
                        key={property.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedProperty?.id === property.id
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => setSelectedProperty(property)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-sm">{property.name}</h4>
                            <p className="text-xs text-muted-foreground flex items-center mt-1">
                              <MapPin className="w-3 h-3 mr-1" />
                              {property.location}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                property.status === 'published'
                                  ? 'default'
                                  : property.status === 'verified'
                                  ? 'secondary'
                                  : 'outline'
                              }
                              className="text-xs"
                            >
                              {property.status}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                              className="h-6 w-6 p-0"
                            >
                              <Link to={`/location-owner/properties/${property.id}/edit`}>
                                <Settings className="w-3 h-3" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Calendar View */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CalendarIcon className="w-5 h-5" />
                      {selectedProperty?.name} - Calendar View
                    </CardTitle>
                    <CardDescription>
                      View your availability and scheduled events
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Calendar
                      mode="single"
                      selected={new Date()}
                      className="rounded-md border"
                      modifiers={{
                        booked: (date) => {
                          return calendarEvents.some(event => {
                            try {
                              const startDate = parseISO(event.start_date);
                              const endDate = parseISO(event.end_date);
                              return isWithinInterval(date, { start: startDate, end: endDate });
                            } catch (error) {
                              return false;
                            }
                          });
                        }
                      }}
                      modifiersStyles={{
                        booked: {
                          backgroundColor: '#10b981',
                          color: 'white',
                          fontWeight: 'bold'
                        }
                      }}
                      disabled={(date) => {
                        // Disable dates that are already booked
                        return calendarEvents.some(event => {
                          try {
                            const startDate = parseISO(event.start_date);
                            const endDate = parseISO(event.end_date);
                            return isWithinInterval(date, { start: startDate, end: endDate });
                          } catch (error) {
                            return false;
                          }
                        });
                      }}
                    />
                    
                    <div className="mt-6 space-y-4">
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-foreground">Legend</h4>
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-3 h-3 bg-green-500 rounded"></div>
                          <span>Confirmed events (booked)</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-3 h-3 bg-orange-500 rounded"></div>
                          <span>Pending requests</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-3 h-3 bg-blue-500 rounded"></div>
                          <span>Your blocked dates</span>
                        </div>
                      </div>

                      {calendarEvents.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-foreground">Upcoming Events</h4>
                          <div className="space-y-2 max-h-32 overflow-y-auto">
                            {calendarEvents.slice(0, 5).map((event) => (
                              <div key={event.id} className="flex items-center justify-between p-2 bg-muted rounded text-xs">
                                <div>
                                  <span className="font-medium">{event.event_title}</span>
                                  <span className="text-muted-foreground ml-2">
                                    {format(parseISO(event.start_date), 'MMM d')} - {format(parseISO(event.end_date), 'MMM d')}
                                  </span>
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  {event.expected_headcount} people
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {calendarEvents.length === 0 && (
                        <div className="text-center py-4">
                          <CalendarDays className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">No confirmed events scheduled</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Event Requests Section */}
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-foreground">Event Requests</h2>
              {eventRequests.length === 0 && (
                <p className="text-muted-foreground text-sm">No requests yet</p>
              )}
            </div>

            {properties.length === 0 ? (
                  <Card className="text-center py-12">
                    <CardContent>
                      <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-foreground mb-2">No Venues Yet</h3>
                      <p className="text-muted-foreground mb-6">
                        Get started by adding your first retreat venue to start attracting quilters.
                      </p>
                      <Button asChild className="bg-primary hover:bg-primary/90">
                        <Link to="/location-owner/properties/new">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Your First Venue
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
              <div className="space-y-4">
                {eventRequests.map((request) => (
                  <Card key={request.id}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="font-semibold text-lg">{request.event_title}</h4>
                          <p className="text-muted-foreground flex items-center mt-1">
                            <User className="w-4 h-4 mr-1" />
                            {request.instructor_name}
                          </p>
                        </div>
                        <Badge
                          variant={
                            request.status === 'approved'
                              ? 'default'
                              : request.status === 'declined'
                              ? 'destructive'
                              : 'secondary'
                          }
                        >
                          {request.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Dates</p>
                          <p className="text-sm">{request.start_date} - {request.end_date}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Expected Headcount</p>
                          <p className="text-sm">{request.expected_headcount} people</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Sewing Hours</p>
                          <p className="text-sm">{request.basic_schedule.sewing_hours}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Check-in/Out</p>
                          <p className="text-sm">{request.basic_schedule.check_in} - {request.basic_schedule.check_out}</p>
                        </div>
                      </div>

                      {request.basic_schedule.meals.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm font-medium text-muted-foreground mb-2">Meals Included</p>
                          <div className="flex flex-wrap gap-1">
                            {request.basic_schedule.meals.map((meal, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {meal}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {request.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleEventRequest(request.id, 'approve')}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Approve Request
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handleEventRequest(request.id, 'decline')}
                            className="border-red-600 text-red-600 hover:bg-red-50"
                          >
                            Decline Request
                          </Button>
                          <Button variant="outline" onClick={() => openMessaging(request)}>
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Message Instructor
                          </Button>
                        </div>
                      )}

                      {request.status !== 'pending' && (
                        <div className="flex gap-2">
                          <Button variant="outline" onClick={() => openMessaging(request)}>
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Message Instructor
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Instructor Mode Settings */}
          <InstructorModeToggle />

          </div>
      </main>

      {/* Messaging Dialog */}
      <Dialog open={showMessagingDialog} onOpenChange={setShowMessagingDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Event Logistics Discussion</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <MessagingSystem 
              eventRequest={selectedRequest} 
              onClose={() => setShowMessagingDialog(false)} 
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LocationOwnerDashboard;
