import { useParams, useNavigate, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, MapPin, Calendar, Users, Clock, Heart, MessageSquare, CreditCard } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  useLazyGetRetreatByIdQuery,
  useLazyGetMyRetreatsQuery,
  useLazyGetVenueByIdQuery,
  useLazyGetFavoritesQuery,
  useAddFavoriteMutation,
  useRemoveFavoriteMutation,
} from "@/services/server";
import { mapRetreatForDetail, toLegacyProperty } from "@/services/mappers";
import { Header } from "@/components/Header";
import { useToast } from "@/hooks/use-toast";
import MessagingSystem from "@/components/MessagingSystem";
import { EventVenuePreview } from "@/components/EventVenuePreview";
import { updateMetaTags, resetMetaTags } from "@/lib/meta-tags";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ContentCard {
  id: string;
  title: string;
  description: string;
  images: string[];
  videos: string[];
  order: number;
}

interface ItineraryBlock {
  id: string;
  type: string;
  title: string;
  description: string;
  day?: string;
  order?: number;
}

interface RetreatData {
  id: number;
  title: string;
  description: string;
  location: string;
  date: string;
  duration: string;
  level: "Any" | "Beginner" | "Intermediate" | "Advanced";
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
  deposit_amount?: number | null;
  deposit_refundable?: boolean | null;
  deposit_refund_days_before?: number | null;
  payment_days_before_event?: number | null;
  full_payment_non_refundable?: boolean | null;
  discount_coupon?: string | null;
  price_variants?: { id: string; name: string; price: number; description?: string }[] | null;
  add_ons?: { id: string; name: string; price: number; description?: string; required?: boolean }[] | null;
  content_cards?: ContentCard[] | null;
  itinerary_blocks?: ItineraryBlock[] | null;
  location_images?: string[] | null;
}

const RetreatDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role, user } = useAuth();
  const { toast } = useToast();
  const [retreat, setRetreat] = useState<RetreatData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSignupDialog, setShowSignupDialog] = useState(false);
  const [actionType, setActionType] = useState<'save' | 'register'>('register');
  const [showMessagingDialog, setShowMessagingDialog] = useState(false);
  const [selectedPriceVariant, setSelectedPriceVariant] = useState<string | null>(null);
  const [eventMode, setEventMode] = useState<'IN_PERSON' | 'ONLINE' | null>(null);
  const [venueId, setVenueId] = useState<string | null>(null);
  const [venueUsageType, setVenueUsageType] = useState<'AT_LOCATION' | 'OFFSITE' | null>(null);
  const [venueData, setVenueData] = useState<any>(null);
  const [fetchRetreatById] = useLazyGetRetreatByIdQuery();
  const [fetchMyRetreats] = useLazyGetMyRetreatsQuery();
  const [fetchVenueById] = useLazyGetVenueByIdQuery();
  const [fetchFavorites] = useLazyGetFavoritesQuery();
  const [addFavorite] = useAddFavoriteMutation();
  const [removeFavorite] = useRemoveFavoriteMutation();

  // Auto-select first price variant if available and none selected
  useEffect(() => {
    if (retreat?.price_variants && retreat.price_variants.length > 0 && !selectedPriceVariant) {
      const firstVariant = retreat.price_variants.find(v => v.id && v.name && v.name.trim());
      if (firstVariant) {
        setSelectedPriceVariant(firstVariant.id);
      }
    }
  }, [retreat?.price_variants, selectedPriceVariant]);

  // Fetch retreat from backend API
  useEffect(() => {
    const fetchRetreat = async () => {
      if (!id) return;

      try {
        let data: Record<string, unknown> | null = null;

        try {
          data = await fetchRetreatById(id).unwrap();
        } catch {
          data = null;
        }

        if (!data && role === "instructor" && user) {
          const mine = await fetchMyRetreats({ limit: 200 }).unwrap();
          data = mine.find((retreat) => String(retreat.id) === String(id)) ?? null;
        }

        if (!data) {
          setRetreat(null);
          return;
        }

        const isPublished = data.status === "published" || Boolean(data.published);
        const instructorId = String(data.instructorId ?? data.instructor_id ?? "");

        if ((role === "student" || !user) && !isPublished) {
          setRetreat(null);
          return;
        }

        if (role === "instructor" && user && instructorId !== user.id && !isPublished) {
          setRetreat(null);
          return;
        }

        const transformedRetreat = mapRetreatForDetail(data);
        setRetreat(transformedRetreat as unknown as RetreatData);

        if (data.mode) {
          setEventMode(data.mode as "IN_PERSON" | "ONLINE");
        }

        const resolvedVenueId = (data.venueId ?? data.venue_id) as string | null;
        if (resolvedVenueId) {
          setVenueId(resolvedVenueId);
          setVenueUsageType((data.venueUsageType ?? data.venue_usage_type) as "AT_LOCATION" | "OFFSITE" | null);

          try {
            const venue = await fetchVenueById(resolvedVenueId).unwrap();
            if (venue) {
              setVenueData(toLegacyProperty(venue));
            }
          } catch (venueError) {
            console.error("Error fetching venue:", venueError);
          }
        }
      } catch (error) {
        console.error("Unexpected error:", error);
        setRetreat(null);
      } finally {
        setLoading(false);
      }
    };

    fetchRetreat();
  }, [id, role, user, fetchRetreatById, fetchMyRetreats, fetchVenueById]);

  // Update meta tags when retreat data is loaded
  useEffect(() => {
    if (retreat) {
      const retreatUrl = `${window.location.origin}/retreat/${retreat.id}`;
      
      // Ensure image URL is absolute
      let absoluteImageUrl = `${window.location.origin}/favicon1.png`; // default
      if (retreat.image) {
        if (retreat.image.startsWith('http://') || retreat.image.startsWith('https://')) {
          absoluteImageUrl = retreat.image;
        } else if (retreat.image.startsWith('/')) {
          absoluteImageUrl = `${window.location.origin}${retreat.image}`;
        } else {
          absoluteImageUrl = `${window.location.origin}/${retreat.image}`;
        }
      }

      // Create a rich description with key details
      const description = `${retreat.description.substring(0, 150)}${retreat.description.length > 150 ? '...' : ''}\n\n📍 ${retreat.location}${retreat.date ? ` | 📅 ${retreat.date}` : ''} | 💰 $${retreat.price}`;

      updateMetaTags({
        title: `${retreat.title} - Quilting Retreats`,
        description: description,
        image: absoluteImageUrl,
        url: retreatUrl,
        type: 'website',
        price: retreat.price,
        location: retreat.location,
        date: retreat.date,
      });
    }

    // Cleanup: reset meta tags when component unmounts
    return () => {
      resetMetaTags();
    };
  }, [retreat]);

  // Check if retreat is saved
  useEffect(() => {
    const checkIfSaved = async () => {
      if (!user || !id) {
        setIsSaved(false);
        return;
      }

      try {
        const favorites = await fetchFavorites().unwrap();
        setIsSaved(favorites.some((favorite) => String(favorite.retreatId) === String(id)));
      } catch (error) {
        console.error('Unexpected error checking saved status:', error);
        setIsSaved(false);
      }
    };

    checkIfSaved();
  }, [user, id, fetchFavorites]);

  const handleSaveClick = async () => {
    if (!user) {
      setActionType('save');
      setShowSignupDialog(true);
      return;
    }

    if (!id) return;

    setSaving(true);
    try {
      if (isSaved) {
        await removeFavorite(String(id)).unwrap();
        setIsSaved(false);
        toast({
          title: "Retreat unsaved",
          description: "This retreat has been removed from your saved list.",
        });
      } else {
        await addFavorite(String(id)).unwrap();
        setIsSaved(true);
        toast({
          title: "Retreat saved!",
          description: "You can find this retreat in your saved list.",
        });
      }
    } catch (error: unknown) {
      console.error('Error saving/unsaving retreat:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save retreat. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRegisterClick = () => {
    if (!user) {
      setActionType('register');
      setShowSignupDialog(true);
    } else if (role === 'student') {
      navigate(`/retreat/${id}/book`, { 
        state: { 
          retreat: {
            ...retreat,
            spotsAvailable: retreat?.spots_available,
            totalSpots: retreat?.total_spots,
          },
          selectedPriceVariant: selectedPriceVariant
        } 
      });
    }
  };

  // Calculate displayed price based on selected variant
  const getDisplayPrice = () => {
    if (retreat?.price_variants && retreat.price_variants.length > 0) {
      if (selectedPriceVariant) {
        const variant = retreat.price_variants.find(v => v.id === selectedPriceVariant);
        return variant ? variant.price : Math.min(...retreat.price_variants.map(v => v.price));
      }
      return Math.min(...retreat.price_variants.map(v => v.price));
    }
    return retreat?.price || 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">Loading retreat details...</p>
        </div>
      </div>
    );
  }

  if (!retreat) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Retreat Not Found</h1>
          <Button onClick={() => navigate("/browse")}>Back to Retreats</Button>
        </div>
      </div>
    );
  }

  // Public users and students can only view published retreats
  // Admins can view drafts (view-only)
  if ((role === 'student' || !user) && !retreat.published) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Retreat Not Available</h1>
          <p className="text-muted-foreground mb-4">This retreat is not published yet.</p>
          <Button onClick={() => navigate("/browse")}>Back to Retreats</Button>
        </div>
      </div>
    );
  }

  // Show draft badge for admins viewing drafts
  const isDraftView = role === 'admin' && !retreat.published;

  return (
    <div className="min-h-screen bg-gradient-hero pb-20">
      {/* Header - only show if not logged in */}
      {!user && <Header />}
      
      {/* Header Image */}
      <div className="relative bg-white">
        <img
          src={retreat.image || "/placeholder.svg"}
          alt={retreat.title}
          className="w-full h-auto object-contain"
        />
        <Button
          variant="secondary"
          size="icon"
          className="absolute top-4 left-4 rounded-full"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          className={`absolute top-4 right-4 rounded-full ${isSaved ? 'bg-primary text-primary-foreground' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            handleSaveClick();
          }}
          disabled={saving}
        >
          <Heart className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
        </Button>
      </div>

      {/* Content */}
      <div className="px-4 sm:px-6 -mt-4 max-w-4xl mx-auto space-y-4 sm:space-y-6 pt-4 pb-24 sm:pb-20">
        {/* Main Info Card */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
              <div className="flex-1">
                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                    {retreat.level}
                  </Badge>
                  {isDraftView && (
                    <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">
                      DRAFT - VIEW ONLY
                    </Badge>
                  )}
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-card-foreground mb-2">
                  {retreat.title}
                </h1>
              </div>
              <div className="text-left sm:text-right">
                {retreat.price_variants && retreat.price_variants.length > 0 ? (
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-1">
                      {selectedPriceVariant ? 'Selected' : 'Starting from'}
                    </p>
                    <p className="text-2xl sm:text-3xl font-bold text-primary">
                      ${getDisplayPrice().toFixed(2)}
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {retreat.price_variants.length} option{retreat.price_variants.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-2xl sm:text-3xl font-bold text-primary">${retreat.price}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">per person</p>
                  </div>
                )}
              </div>
            </div>

            {/* Price Variants Selection */}
            {retreat.price_variants && retreat.price_variants.length > 0 && (
              <div className="mt-4 space-y-3">
                <p className="text-sm font-medium text-card-foreground">Select Pricing Option</p>
                <div className="space-y-2">
                  {retreat.price_variants
                    .filter(variant => variant.id && variant.name && variant.name.trim())
                    .map((variant) => (
                      <div
                        key={variant.id}
                        onClick={() => setSelectedPriceVariant(variant.id)}
                        className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                          selectedPriceVariant === variant.id
                            ? 'border-primary bg-primary/5 shadow-sm'
                            : 'border-border hover:border-primary/50 hover:bg-muted/30'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                selectedPriceVariant === variant.id
                                  ? 'border-primary bg-primary'
                                  : 'border-muted-foreground'
                              }`}>
                                {selectedPriceVariant === variant.id && (
                                  <div className="w-2 h-2 rounded-full bg-white" />
                                )}
                              </div>
                              <div className="font-medium text-card-foreground">{variant.name}</div>
                            </div>
                            {variant.description && (
                              <div className="text-sm text-muted-foreground mt-1 ml-6">
                                {variant.description}
                              </div>
                            )}
                          </div>
                          <div className="text-lg font-bold text-primary ml-4">
                            ${variant.price.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Instructor */}
            <div className="py-4 sm:py-6 border-y border-border">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img
                    src={retreat.instructor.avatar || "/placeholder.svg"}
                    alt={retreat.instructor.name}
                    className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="font-semibold text-card-foreground truncate">{retreat.instructor.name}</p>
                    <p className="text-sm text-muted-foreground">Instructor</p>
                  </div>
                </div>
                {user && role === 'student' && (
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto h-12 px-4 sm:px-6 text-sm sm:text-base font-medium"
                    onClick={() => setShowMessagingDialog(true)}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Message Organizer
                  </Button>
                )}
              </div>
            </div>

            {/* Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div className="flex items-start gap-2 text-muted-foreground">
                <MapPin className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground mb-1">Location</p>
                  <p className="text-sm font-medium text-card-foreground break-words break-all">{retreat.location}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-2 text-muted-foreground">
                <Calendar className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground mb-1">Dates</p>
                  <p className="text-sm font-medium text-card-foreground break-words">{retreat.date}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-2 text-muted-foreground">
                <Clock className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground mb-1">Duration</p>
                  <p className="text-sm font-medium text-card-foreground">{retreat.duration}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-2 text-muted-foreground">
                <Users className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground mb-1">Availability</p>
                  <p className="text-sm font-medium text-card-foreground">
                    {retreat.spots_available} of {retreat.total_spots} spots
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Venue Preview - Only for IN_PERSON events with venue */}
        {eventMode === 'IN_PERSON' && venueId && venueData && (
          <EventVenuePreview
            venueId={venueId}
            eventId={retreat.id}
            venueName={venueData.property_name}
            venueLocation={venueData.location}
            venuePhotos={venueData.photos || []}
          />
        )}

        {/* About */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-card-foreground mb-3">About This Retreat</h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{retreat.description}</p>
          </CardContent>
        </Card>

        {/* What's Included */}
        {retreat.includes && retreat.includes.length > 0 && retreat.includes.some(item => item && item.trim()) && (
          <Card>
            <CardContent className="p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold text-card-foreground mb-3">What's Included</h2>
              <ul className="space-y-2">
                {retreat.includes
                  .filter(item => item && item.trim())
                  .map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm sm:text-base text-muted-foreground">
                      <span className="text-primary mt-1">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Schedule */}
        {retreat.schedule && retreat.schedule.length > 0 && retreat.schedule.some(item => (item.day && item.day.trim()) || (item.activities && item.activities.trim())) && (
          <Card>
            <CardContent className="p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold text-card-foreground mb-3">Schedule</h2>
              <div className="space-y-3">
                {retreat.schedule
                  .filter(item => (item.day && item.day.trim()) || (item.activities && item.activities.trim()))
                  .map((item, idx) => (
                    <div key={idx} className="pb-3 border-b border-border last:border-0 last:pb-0">
                      {item.day && item.day.trim() && (
                        <p className="font-semibold text-sm sm:text-base text-card-foreground mb-1">{item.day}</p>
                      )}
                      {item.activities && item.activities.trim() && (
                        <p className="text-xs sm:text-sm text-muted-foreground">{item.activities}</p>
                      )}
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Itinerary Blocks */}
        {retreat.itinerary_blocks && retreat.itinerary_blocks.length > 0 && retreat.itinerary_blocks.some(block => (block.day && block.day.trim()) || (block.title && block.title.trim()) || (block.description && block.description.trim())) && (
          <Card>
            <CardContent className="p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold text-card-foreground mb-3">Itinerary</h2>
              <div className="space-y-3">
                {retreat.itinerary_blocks
                  .filter(block => (block.day && block.day.trim()) || (block.title && block.title.trim()) || (block.description && block.description.trim()))
                  .sort((a, b) => (a.order || 0) - (b.order || 0))
                  .map((block) => (
                    <div key={block.id} className="pb-3 border-b border-border last:border-0 last:pb-0">
                      {(block.day && block.day.trim()) || (block.title && block.title.trim()) ? (
                        <p className="font-semibold text-sm sm:text-base text-card-foreground mb-1">
                          {block.day && block.day.trim() ? block.day : block.title}
                        </p>
                      ) : null}
                      {block.description && block.description.trim() && (
                        <p className="text-xs sm:text-sm text-muted-foreground">{block.description}</p>
                      )}
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Content Cards */}
        {retreat.content_cards && retreat.content_cards.length > 0 && (
          <Card>
            <CardContent className="p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold text-card-foreground mb-4">Event Details</h2>
              <div className="space-y-6">
                {retreat.content_cards
                  .sort((a, b) => (a.order || 0) - (b.order || 0))
                  .map((card) => (
                    <div key={card.id} className="border rounded-lg p-4 sm:p-6 bg-card">
                      <h3 className="text-base sm:text-lg font-semibold text-card-foreground mb-3">{card.title}</h3>
                      {card.description && (
                        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">{card.description}</p>
                      )}
                      {/* Images */}
                      {card.images && card.images.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                          {card.images.map((img, idx) => (
                            <img
                              key={idx}
                              src={img}
                              alt={`${card.title} ${idx + 1}`}
                              className="w-full h-32 sm:h-40 object-cover rounded-md"
                            />
                          ))}
                        </div>
                      )}
                      {/* Videos */}
                      {card.videos && card.videos.length > 0 && (
                        <div className="space-y-3">
                          {card.videos.map((video, idx) => (
                            <div key={idx} className="relative w-full aspect-video bg-muted rounded-md overflow-hidden">
                              <video
                                src={video}
                                controls
                                className="w-full h-full object-contain"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Location Images */}
        {retreat.location_images && retreat.location_images.length > 0 && (
          <Card>
            <CardContent className="p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold text-card-foreground mb-3">Location Photos</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {retreat.location_images.map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`Location ${idx + 1}`}
                    className="w-full h-40 sm:h-48 object-cover rounded-md"
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment Terms */}
        {(retreat.deposit_amount || retreat.payment_days_before_event !== null || retreat.deposit_refundable !== null) && (
          <Card>
            <CardContent className="p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold text-card-foreground mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment Terms
              </h2>
              <div className="space-y-3 text-sm sm:text-base">
                {retreat.deposit_amount && (
                  <div className="flex items-center justify-between pb-2 border-b border-border">
                    <span className="text-muted-foreground">Deposit Amount</span>
                    <span className="font-medium text-card-foreground">${retreat.deposit_amount.toFixed(2)}</span>
                  </div>
                )}
                {retreat.deposit_refundable !== null && (
                  <div className="flex items-center justify-between pb-2 border-b border-border">
                    <span className="text-muted-foreground">Deposit Refundable</span>
                    <span className="font-medium text-card-foreground">
                      {retreat.deposit_refundable ? 'Yes' : 'No'}
                    </span>
                  </div>
                )}
                {retreat.deposit_refund_days_before && (
                  <div className="flex items-center justify-between pb-2 border-b border-border">
                    <span className="text-muted-foreground">Refund Deadline</span>
                    <span className="font-medium text-card-foreground">
                      {retreat.deposit_refund_days_before} days before event
                    </span>
                  </div>
                )}
                {retreat.payment_days_before_event !== null && (
                  <div className="flex items-center justify-between pb-2 border-b border-border">
                    <span className="text-muted-foreground">Full Payment Due</span>
                    <span className="font-medium text-card-foreground">
                      {retreat.payment_days_before_event} days before event
                    </span>
                  </div>
                )}
                {retreat.full_payment_non_refundable !== null && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Full Payment Refundable</span>
                    <span className="font-medium text-card-foreground">
                      {retreat.full_payment_non_refundable ? 'No' : 'Yes'}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* About Instructor */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-card-foreground">About the Instructor</h2>
              {user && role === 'student' && (
                <Button
                  variant="outline"
                  className="w-full sm:w-auto h-12 px-4 sm:px-6 text-sm sm:text-base font-medium"
                  onClick={() => setShowMessagingDialog(true)}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Message Organizer
                </Button>
              )}
            </div>
            <div className="flex items-start gap-3 sm:gap-4">
              <img
                src={retreat.instructor.avatar || "/placeholder.svg"}
                alt={retreat.instructor.name}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover flex-shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm sm:text-base text-card-foreground mb-1">{retreat.instructor.name}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">{retreat.instructor.bio || "Experienced quilting instructor"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Book Button - Show to all, but prompt for signup if not logged in */}
        {retreat.published && (
          <div className="fixed bottom-0 left-0 right-0 p-3 sm:p-4 bg-card border-t border-border pb-safe">
            <div className="max-w-4xl mx-auto flex gap-2">
              {user && role === 'student' ? (
                <>
                  <Button
                    className="flex-1 h-12 text-base sm:text-lg font-medium"
                    onClick={handleRegisterClick}
                  >
                    {retreat.price_variants && retreat.price_variants.length > 0 
                      ? `Book Now - $${getDisplayPrice().toFixed(2)}`
                      : `Book Now - $${retreat.price}`
                    }
                  </Button>
                </>
              ) : !user ? (
                <Button
                  className="w-full h-12 text-base sm:text-lg"
                  onClick={handleRegisterClick}
                >
                  {retreat.price_variants && retreat.price_variants.length > 0 
                    ? `Register for This Retreat - $${getDisplayPrice().toFixed(2)}`
                    : `Register for This Retreat - $${retreat.price}`
                  }
                </Button>
              ) : null}
            </div>
          </div>
        )}
        
        {/* View-Only Notice for Admin viewing drafts */}
        {isDraftView && (
          <div className="fixed bottom-0 left-0 right-0 p-3 sm:p-4 bg-card border-t border-border pb-safe">
            <div className="max-w-4xl mx-auto">
              <div className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-4 text-center">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  View-Only Mode: This is a draft event. You cannot make changes or bookings.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Edit Button for Instructors */}
        {role === 'instructor' && (
          <div className="fixed bottom-0 left-0 right-0 p-3 sm:p-4 bg-card border-t border-border pb-safe">
            <div className="max-w-4xl mx-auto">
              <Button
                className="w-full h-12 text-base sm:text-lg"
                onClick={() => navigate(`/instructor/retreats/${id}/edit`)}
              >
                Edit This Retreat
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Signup Dialog */}
      <Dialog open={showSignupDialog} onOpenChange={setShowSignupDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'save' ? 'Save This Retreat' : 'Register for This Retreat'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'save' 
                ? 'Create a free account to save retreats you\'re interested in and get notifications about upcoming events.'
                : 'Create a free account to register for this retreat and secure your spot.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowSignupDialog(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              asChild
              className="w-full sm:w-auto"
            >
              <Link to={`/signup?role=student${actionType === 'save' ? '&redirect=' + encodeURIComponent(`/retreat/${id}`) : ''}`}>
                Create Free Account
              </Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Messaging Dialog */}
      <Dialog open={showMessagingDialog} onOpenChange={setShowMessagingDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Ask a Question</DialogTitle>
            <DialogDescription>
              Message the instructor about this retreat
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            {retreat && (
              <MessagingSystem
                context="retreat_detail"
                retreat={{
                  id: retreat.id,
                  title: retreat.title,
                  instructor_id: retreat.instructor_id,
                  instructor_name: retreat.instructor.name,
                  location: retreat.location,
                  date: retreat.date,
                  level: retreat.level
                }}
                onClose={() => setShowMessagingDialog(false)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RetreatDetail;

