import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import {
  useLazyGetMyVenuesQuery,
  useLazyGetEventRequestsQuery,
  useRespondToEventRequestMutation,
  useLazyGetMyAffiliateQuery,
  useLazyGetMyAffiliateLinksQuery,
  useLazyGetMyCommissionsQuery,
  useLazyGetConversationsQuery,
} from "@/services/server";
import { sumUnreadCount, toLegacyEventRequest, toLegacyAffiliateLink, toLegacyProperty } from "@/services/mappers";
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
import { VenueDetailsRequiredBanner } from "@/components/VenueDetailsRequiredBanner";
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
  const [fetchMyVenues] = useLazyGetMyVenuesQuery();
  const [fetchEventRequestsQuery] = useLazyGetEventRequestsQuery();
  const [respondToEventRequest] = useRespondToEventRequestMutation();
  const [fetchMyAffiliate] = useLazyGetMyAffiliateQuery();
  const [fetchMyAffiliateLinks] = useLazyGetMyAffiliateLinksQuery();
  const [fetchMyCommissions] = useLazyGetMyCommissionsQuery();
  const [fetchConversations] = useLazyGetConversationsQuery();

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
      const conversations = await fetchConversations().unwrap();
      setUnreadMessages(sumUnreadCount(conversations, user.id));
    } catch (error) {
      console.error('Error fetching unread messages:', error);
    }
  };

  const fetchEventRequests = async () => {
    if (!user || !selectedProperty) return;

    try {
      const items = await fetchEventRequestsQuery({ venueId: selectedProperty.id, limit: 100 }).unwrap();
      const mapped = items.map((item) => toLegacyEventRequest(item) as EventRequest);
      setEventRequests(mapped);
      setStats((prev) => ({
        ...prev,
        pendingRequests: mapped.filter((r) => r.status === 'pending').length,
      }));
    } catch (error) {
      console.error('Error fetching event requests:', error);
    }
  };

  // Fetch approved events for calendar
  const fetchCalendarEvents = async () => {
    if (!user || !selectedProperty) return;

    try {
      const items = await fetchEventRequestsQuery({
        venueId: selectedProperty.id,
        status: 'approved',
        limit: 100,
      }).unwrap();
      const mapped = items
        .map((item) => toLegacyEventRequest(item) as EventRequest)
        .sort((a, b) => a.start_date.localeCompare(b.start_date));
      setCalendarEvents(mapped);
    } catch (error) {
      console.error('Error fetching calendar events:', error);
    }
  };

  const fetchProperties = async () => {
    try {
      const venues = await fetchMyVenues({ limit: 100, sort: "createdAt:desc" }).unwrap();
      const mapped = venues.map((venue) => {
        const legacy = toLegacyProperty(venue);
        return {
          ...legacy,
          views: Number(venue.viewCount ?? venue.views ?? 0),
          saves: Number(venue.saveCount ?? venue.saves ?? 0),
          inquiries: Number(venue.inquiryCount ?? venue.inquiries ?? 0),
          base_pricing: (venue.basePricing ?? venue.base_pricing ?? {}) as Record<string, number>,
          stay_types: (venue.stayTypes ?? venue.stay_types ?? []) as string[],
          house_rules: (venue.houseRules ?? venue.house_rules ?? []) as string[],
        } as Property;
      });

      setProperties(mapped);

      if (mapped.length > 0) {
        setSelectedProperty(mapped[0]);
      }

      const nextStats = mapped.reduce(
        (acc, prop) => ({
          totalViews: acc.totalViews + (prop.views || 0),
          totalSaves: acc.totalSaves + (prop.saves || 0),
          totalInquiries: acc.totalInquiries + (prop.inquiries || 0),
          publishedProperties: acc.publishedProperties + (prop.status === 'published' || prop.status === 'verified' ? 1 : 0),
          pendingRequests: acc.pendingRequests,
        }),
        { totalViews: 0, totalSaves: 0, totalInquiries: 0, publishedProperties: 0, pendingRequests: 0 },
      );

      setStats(nextStats);
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
      const { affiliate, referrals: referralRows = [] } = await fetchMyAffiliate().unwrap();
      const affiliateRecord = affiliate as Record<string, unknown> | undefined;
      const affiliateType = String(affiliateRecord?.affiliateType ?? affiliateRecord?.affiliate_type ?? "");

      if (!affiliateRecord || affiliateType !== "venue_partner") {
        setLoadingAffiliate(false);
        return;
      }

      const links = await fetchMyAffiliateLinks().unwrap();
      if (links.length > 0) {
        setAffiliateLink(toLegacyAffiliateLink(links[0] as Record<string, unknown>) as typeof affiliateLink);
      }

      const commissions = await fetchMyCommissions().unwrap();
      const commissionsByReferral = new Map<string, Array<{ amount: number; status: string; created_at: string }>>();
      commissions.forEach((commission) => {
        const row = commission as Record<string, unknown>;
        const referralId = String(row.referralId ?? row.referral_id ?? "");
        if (!referralId) return;
        if (!commissionsByReferral.has(referralId)) {
          commissionsByReferral.set(referralId, []);
        }
        commissionsByReferral.get(referralId)!.push({
          amount: Number(row.amount ?? 0),
          status: String(row.status ?? "pending"),
          created_at: String(row.createdAt ?? row.created_at ?? ""),
        });
      });

      const mappedReferrals = (referralRows as Record<string, unknown>[]).map((ref) => {
        const profile = (ref.profile ?? ref.referredUser ?? ref.referred_user) as
          | Record<string, unknown>
          | undefined;
        const campaign = ref.campaign as Record<string, unknown> | undefined;
        const referralId = String(ref.id ?? ref.referral_id ?? "");
        return {
          id: referralId,
          referral_id: referralId,
          user_id: String(ref.referredUserId ?? ref.referred_user_id ?? ""),
          referral_type: String(ref.referralType ?? ref.referral_type ?? "organizer"),
          created_at: String(ref.createdAt ?? ref.created_at ?? ""),
          converted: Boolean(ref.converted),
          converted_at: String(ref.convertedAt ?? ref.converted_at ?? ""),
          profile: profile
            ? {
                full_name: String(profile.fullName ?? profile.full_name ?? ""),
                email: String(profile.email ?? ""),
                role: String(profile.role ?? ""),
              }
            : undefined,
          commissions: commissionsByReferral.get(referralId) ?? [],
          campaign: campaign
            ? {
                active_commission_value: Number(
                  campaign.activeCommissionValue ?? campaign.active_commission_value ?? 0,
                ),
                active_commission_type: String(
                  campaign.activeCommissionType ?? campaign.active_commission_type ?? "",
                ),
                active_commission_base: String(
                  campaign.activeCommissionBase ?? campaign.active_commission_base ?? "",
                ),
              }
            : undefined,
        };
      });

      setReferredUsers(mappedReferrals);
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
      await respondToEventRequest({
        id: requestId,
        body: { status: action === 'approve' ? 'APPROVED' : 'DECLINED' },
      }).unwrap();

      fetchEventRequests();
      fetchCalendarEvents();
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

          {/* Venue Details Required Banners */}
          {properties.length > 0 && properties
            .filter(p => p.status === 'published' || p.status === 'verified')
            .map(property => (
              <VenueDetailsRequiredBanner
                key={property.id}
                venueId={property.id}
              />
            ))}

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
