import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BottomNav } from "@/components/BottomNav";
import { VenueCard } from "@/components/VenueCard";
import MessagingSystem from "@/components/MessagingSystem";
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
  CalendarDays,
  Link as LinkIcon,
  Copy,
  Check
} from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { format, isWithinInterval, parseISO } from "date-fns";

interface Property {
  id: string;
  property_name: string;
  location: string;
  description?: string;
  photos?: string[];
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
  owner_id: string;
}

interface EventRequest {
  id: string;
  event_title: string;
  instructor_name: string;
  instructor_id: string;
  property_name: string;
  property_id: string;
  property_owner_id: string;
  start_date: string;
  end_date: string;
  expected_headcount: number;
  status: 'pending' | 'approved' | 'declined';
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
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [eventRequests, setEventRequests] = useState<EventRequest[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<EventRequest[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<EventRequest | null>(null);
  const [showMessagingDialog, setShowMessagingDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [stats, setStats] = useState({
    totalViews: 0,
    totalSaves: 0,
    totalInquiries: 0,
    publishedProperties: 0,
    pendingRequests: 0
  });
  
  // Affiliate data
  const [affiliateLink, setAffiliateLink] = useState<{
    id: string;
    full_url: string;
    link_code: string;
    clicks: number;
    campaign?: { name: string; active_commission_value: number; active_commission_type: string };
  } | null>(null);
  const [referredUsers, setReferredUsers] = useState<Array<{
    id: string;
    referral_id: string;
    user_id: string;
    referral_type: string;
    created_at: string;
    converted: boolean;
    converted_at: string | null;
    profile?: { full_name: string; email: string; role: string };
    commissions?: Array<{ amount: number; status: string; created_at: string }>;
    campaign?: { active_commission_value: number; active_commission_type: string; active_commission_base: string };
  }>>([]);
  const [linkCopied, setLinkCopied] = useState(false);
  const [loadingAffiliate, setLoadingAffiliate] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProperties();
      fetchUnreadMessages();
      fetchAffiliateData();
    }
  }, [user]);

  useEffect(() => {
    if (selectedProperty) {
      fetchEventRequests();
      fetchCalendarEvents();
    }
  }, [selectedProperty]);

  const fetchUnreadMessages = async () => {
    if (!user) return;
    
    try {
      // Get all properties for this venue owner
      const { data: properties, error: propertiesError } = await supabase
        .from('properties')
        .select('id')
        .eq('owner_id', user.id);

      if (propertiesError) throw propertiesError;

      if (!properties || properties.length === 0) {
        setUnreadMessages(0);
        return;
      }

      // Get event requests for all properties
      const propertyIds = properties.map(p => p.id);
      const { data: eventRequests, error: requestsError } = await supabase
        .from('event_requests')
        .select('id')
        .in('property_id', propertyIds);

      if (requestsError) throw requestsError;

      if (!eventRequests || eventRequests.length === 0) {
        setUnreadMessages(0);
        return;
      }

      // Count unread messages for all event requests
      const eventRequestIds = eventRequests.map(er => er.id);
      const { count, error: countError } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .in('related_id', eventRequestIds)
        .eq('message_type', 'event_request')
        .eq('receiver_id', user.id)
        .eq('read', false);

      if (countError) throw countError;
      setUnreadMessages(count || 0);
    } catch (error) {
      console.error('Error fetching unread messages:', error);
    }
  };

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

  const fetchAffiliateData = async () => {
    if (!user) return;
    setLoadingAffiliate(true);
    
    try {
      // Get affiliate record for this venue manager
      const { data: affiliate, error: affiliateError } = await supabase
        .from('affiliates')
        .select('id')
        .eq('user_id', user.id)
        .eq('affiliate_type', 'venue_partner')
        .maybeSingle();

      if (affiliateError || !affiliate) {
        console.log('No affiliate record found for venue manager');
        setLoadingAffiliate(false);
        return;
      }

      // Get affiliate link for organizer referral campaign
      const { data: links, error: linksError } = await supabase
        .from('affiliate_links')
        .select(`
          id,
          full_url,
          link_code,
          clicks,
          campaign:affiliate_campaigns(
            name,
            active_commission_value,
            active_commission_type,
            active_commission_base
          )
        `)
        .eq('affiliate_id', affiliate.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (linksError) throw linksError;

      if (links && links.length > 0) {
        setAffiliateLink(links[0] as any);
      }

      // Get referred users
      const { data: referrals, error: referralsError } = await supabase
        .from('affiliate_referrals')
        .select(`
          id,
          referral_id:id,
          referred_user_id,
          referral_type,
          created_at,
          converted,
          converted_at,
          campaign:affiliate_campaigns(
            active_commission_value,
            active_commission_type,
            active_commission_base
          )
        `)
        .eq('affiliate_id', affiliate.id)
        .order('created_at', { ascending: false });

      if (referralsError) throw referralsError;

      // Fetch profile data for referred users
      if (referrals && referrals.length > 0) {
        const userIds = referrals
          .map(r => r.referred_user_id)
          .filter(Boolean) as string[];

        let profilesMap = new Map();
        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name, email, role')
            .in('id', userIds);

          if (profiles) {
            profilesMap = new Map(profiles.map(p => [p.id, p]));
          }
        }

        // Fetch commissions for each referral
        const referralIds = referrals.map(r => r.id);
        const commissionsMap = new Map();
        if (referralIds.length > 0) {
          const { data: commissions } = await supabase
            .from('affiliate_commissions')
            .select('referral_id, amount, status, created_at')
            .in('referral_id', referralIds);

          if (commissions) {
            commissions.forEach(c => {
              if (!commissionsMap.has(c.referral_id)) {
                commissionsMap.set(c.referral_id, []);
              }
              commissionsMap.get(c.referral_id).push(c);
            });
          }
        }

        const referralsWithData = referrals.map(ref => ({
          ...ref,
          profile: ref.referred_user_id ? profilesMap.get(ref.referred_user_id) : null,
          commissions: commissionsMap.get(ref.id) || []
        }));

        setReferredUsers(referralsWithData as any);
      } else {
        setReferredUsers([]);
      }
    } catch (error) {
      console.error('Error fetching affiliate data:', error);
    } finally {
      setLoadingAffiliate(false);
    }
  };

  const copyAffiliateLink = () => {
    if (affiliateLink?.full_url) {
      navigator.clipboard.writeText(affiliateLink.full_url);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
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

  const handleVenueSelect = (venueId: string) => {
    const venue = properties.find(p => p.id === venueId);
    if (venue) {
      setSelectedProperty(venue);
      // Scroll to calendar view
      setTimeout(() => {
        const calendarElement = document.getElementById('calendar-view');
        if (calendarElement) {
          calendarElement.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
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
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate('/location-owner/messages')}
                  className="relative"
                >
                  <MessageSquare className="w-4 h-4" />
                  {unreadMessages > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-2 -right-2 text-xs px-1.5 py-0.5 h-5 min-w-[20px] flex items-center justify-center"
                    >
                      {unreadMessages > 99 ? '99+' : unreadMessages}
                    </Badge>
                  )}
                </Button>
                <Button asChild className="bg-primary hover:bg-primary/90">
                  <Link to="/location-owner/properties/new">
                    <Plus className="w-4 h-4 mr-2" />
                    Add a Venue
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <StatCard
              icon={Eye}
              value={stats.totalViews.toLocaleString()}
              label="Total Views"
              variant="default"
            />
            <StatCard
              icon={Heart}
              value={stats.totalSaves.toLocaleString()}
              label="Total Saves"
              variant="default"
            />
            <StatCard
              icon={MessageSquare}
              value={stats.totalInquiries.toLocaleString()}
              label="Inquiries"
              variant="default"
            />
            <StatCard
              icon={CheckCircle2}
              value={stats.publishedProperties}
              label="Published"
              variant="default"
            />
            <StatCard
              icon={Clock}
              value={stats.pendingRequests}
              label="Pending Requests"
              variant="default"
            />
          </div>

          {/* Affiliate Program Section */}
          {affiliateLink && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LinkIcon className="w-5 h-5" />
                  Your Affiliate Program
                </CardTitle>
                <CardDescription>
                  Share your link to invite organizers and earn revenue share
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Affiliate Link */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Your Affiliate Link</Label>
                  <div className="flex gap-2">
                    <Input
                      value={affiliateLink.full_url}
                      readOnly
                      className="flex-1 font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyAffiliateLink}
                      className="flex-shrink-0"
                    >
                      {linkCopied ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                    <span>{affiliateLink.clicks} clicks</span>
                    {affiliateLink.campaign && (
                      <span>
                        Commission: {
                          affiliateLink.campaign.active_commission_type === 'percentage'
                            ? `${affiliateLink.campaign.active_commission_value}%`
                            : `$${affiliateLink.campaign.active_commission_value}`
                        }
                      </span>
                    )}
                  </div>
                </div>

                {/* Referred Users List */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <Label className="text-sm font-medium">Referred Users</Label>
                    <Badge variant="outline">{referredUsers.length} total</Badge>
                  </div>
                  
                  {loadingAffiliate ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                      <p className="text-sm text-muted-foreground">Loading...</p>
                    </div>
                  ) : referredUsers.length === 0 ? (
                    <div className="text-center py-8 border rounded-lg">
                      <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No referred users yet</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Share your affiliate link to start earning
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {referredUsers.map((refUser) => {
                        const accountTypeLabel = refUser.referral_type === 'organizer' 
                          ? 'Organizer' 
                          : refUser.referral_type === 'student'
                          ? 'Student'
                          : 'Venue';
                        
                        const totalCommissions = refUser.commissions?.reduce(
                          (sum, c) => sum + Number(c.amount || 0), 
                          0
                        ) || 0;
                        
                        const commissionRate = refUser.campaign?.active_commission_type === 'percentage'
                          ? `${refUser.campaign.active_commission_value}%`
                          : refUser.campaign?.active_commission_type === 'fixed'
                          ? `$${refUser.campaign.active_commission_value}`
                          : 'N/A';

                        return (
                          <Card key={refUser.id} className="p-4">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="outline">{accountTypeLabel}</Badge>
                                  {refUser.converted && (
                                    <Badge variant="default" className="text-xs">
                                      Converted
                                    </Badge>
                                  )}
                                </div>
                                <div className="space-y-1 text-sm">
                                  <p className="font-medium">
                                    {refUser.profile?.full_name || refUser.profile?.email || 'Unknown User'}
                                  </p>
                                  <p className="text-muted-foreground">
                                    {refUser.profile?.email || 'No email'}
                                  </p>
                                  <div className="flex gap-4 text-xs text-muted-foreground mt-2">
                                    <span>
                                      Signed up: {new Date(refUser.created_at).toLocaleDateString()}
                                    </span>
                                    {refUser.converted_at && (
                                      <span>
                                        Converted: {new Date(refUser.converted_at).toLocaleDateString()}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-2 text-sm">
                                <div className="text-right">
                                  <p className="text-xs text-muted-foreground">Revenue Share Rate</p>
                                  <p className="font-semibold">{commissionRate}</p>
                                </div>
                                {totalCommissions > 0 && (
                                  <div className="text-right">
                                    <p className="text-xs text-muted-foreground">Total Earned</p>
                                    <p className="font-semibold text-green-600">
                                      ${totalCommissions.toFixed(2)}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Venue Feed and Calendar View */}
          {properties.length > 0 && (
            <div className="space-y-8">
              {/* Venue Feed */}
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-foreground">Your Venues</h2>
                  <Button asChild className="bg-primary hover:bg-primary/90">
                    <Link to="/location-owner/properties/new">
                      <Plus className="w-4 h-4 mr-2" />
                      Add a Venue
                    </Link>
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {properties.map((property) => (
                    <VenueCard
                      key={property.id}
                      id={property.id}
                      name={property.property_name}
                      location={property.location}
                      description={property.description || "A beautiful quilting retreat venue perfect for creative gatherings and workshops."}
                      photos={property.photos || []}
                      sleeps={property.sleeps}
                      max_quilters={property.max_quilters}
                      status={property.status}
                      views={property.views}
                      saves={property.saves}
                      inquiries={property.inquiries}
                      onSelect={handleVenueSelect}
                    />
                  ))}
                </div>
              </div>

              {/* Calendar View for Selected Venue */}
              {selectedProperty && (
                <div id="calendar-view">
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                      <CalendarIcon className="w-5 h-5" />
                      {selectedProperty.property_name} - Calendar View
                    </h2>
                    <p className="text-muted-foreground">
                      View your availability and scheduled events
                    </p>
                  </div>
                  
                  <Card>
                    <CardContent className="p-6">
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
              )}
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
            ) : eventRequests.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <CalendarDays className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No Event Requests Yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Once organizers request to book your venues, you'll see their requests here.
                  </p>
                  <Button variant="outline" asChild>
                    <Link to="/browse">
                      <Users className="w-4 h-4 mr-2" />
                      Browse Events
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
                          <p className="text-sm">{request.basic_schedule?.sewing_hours || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Check-in/Out</p>
                          <p className="text-sm">{request.basic_schedule?.check_in || 'N/A'} - {request.basic_schedule?.check_out || 'N/A'}</p>
                        </div>
                      </div>

                      {request.basic_schedule?.meals && request.basic_schedule.meals.length > 0 && (
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

          </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNav />

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
