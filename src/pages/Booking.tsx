import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { MapPin, Calendar, Clock, Users, Info, DollarSign, CreditCard } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { sendCustomEmail } from "@/lib/email-notifications";

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

interface DiscountCoupon {
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  max_uses?: number;
  expires_at?: string;
}

interface RetreatData {
  id: number;
  title: string;
  description?: string;
  location: string;
  date: string;
  duration?: string;
  level?: "Any" | "Beginner" | "Intermediate" | "Advanced";
  price: number;
  spots_available: number;
  total_spots: number;
  published: boolean;
  image: string;
  includes?: string[];
  schedule?: { day: string; activities: string }[];
  deposit_amount?: number | null;
  deposit_refundable?: boolean | null;
  deposit_refund_days_before?: number | null;
  payment_days_before_event?: number | null;
  full_payment_non_refundable?: boolean | null;
  discount_coupon?: DiscountCoupon | null;
  price_variants?: { id: string; name: string; price: number; description?: string }[] | null;
  add_ons?: { id: string; name: string; price: number; description?: string; required?: boolean }[] | null;
  content_cards?: ContentCard[] | null;
  itinerary_blocks?: ItineraryBlock[] | null;
  location_images?: string[] | null;
}

const Booking = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [retreat, setRetreat] = useState<RetreatData | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingManualPayment, setProcessingManualPayment] = useState(false);
  
  // Form state - must be declared before any conditional returns
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [skillLevel, setSkillLevel] = useState<"Any" | "Beginner" | "Intermediate" | "Advanced" | "">("");
  const [selectedPriceVariant, setSelectedPriceVariant] = useState("");
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [paidManually, setPaidManually] = useState(false);
  
  // Form validation errors
  const [errors, setErrors] = useState({
    fullName: "",
    email: "",
    skillLevel: "",
    priceVariant: "",
  });
  
  // Price calculation function
  const calculateTotalPrice = () => {
    let basePrice = retreat?.price || 0;
    
    // Use selected price variant if available
    if (retreat?.price_variants && retreat.price_variants.length > 0 && selectedPriceVariant) {
      const variant = retreat.price_variants.find(v => v.id === selectedPriceVariant);
      if (variant) {
        basePrice = variant.price;
      }
    }
    
    // Add selected add-ons
    let addOnsTotal = 0;
    if (retreat?.add_ons) {
      retreat.add_ons.forEach(addOn => {
        if (addOn.required || selectedAddOns.includes(addOn.id)) {
          addOnsTotal += addOn.price;
        }
      });
    }
    
    return basePrice + addOnsTotal;
  };

  // Validation function
  const validateForm = () => {
    const newErrors = {
      fullName: "",
      email: "",
      skillLevel: "",
      priceVariant: "",
    };
    
    let isValid = true;
    
    // Validate full name
    if (!fullName.trim()) {
      newErrors.fullName = "Full name is required";
      isValid = false;
    } else if (fullName.trim().length < 2) {
      newErrors.fullName = "Full name must be at least 2 characters";
      isValid = false;
    }
    
    // Validate email
    if (!email.trim()) {
      newErrors.email = "Email is required";
      isValid = false;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        newErrors.email = "Please enter a valid email address";
        isValid = false;
      }
    }
    
    // Validate skill level
    if (!skillLevel) {
      newErrors.skillLevel = "Skill level is required";
      isValid = false;
    }
    
    // Validate price variant if available
    if (retreat?.price_variants && retreat.price_variants.length > 0 && !selectedPriceVariant) {
      newErrors.priceVariant = "Please select a pricing option";
      isValid = false;
    }
    
    setErrors(newErrors);
    return isValid;
  };
  
  useEffect(() => {
    // Auto-select required add-ons when retreat data loads
    if (retreat?.add_ons) {
      const requiredAddOns = retreat.add_ons.filter(addOn => addOn.required).map(addOn => addOn.id);
      setSelectedAddOns(requiredAddOns);
    }
  }, [retreat]);

  // Handle field blur for real-time validation
  const handleBlur = (field: 'fullName' | 'email' | 'skillLevel') => {
    const newErrors = { ...errors };
    
    switch (field) {
      case 'fullName':
        if (!fullName.trim()) {
          newErrors.fullName = "Full name is required";
        } else if (fullName.trim().length < 2) {
          newErrors.fullName = "Full name must be at least 2 characters";
        } else {
          newErrors.fullName = "";
        }
        break;
      case 'email':
        if (!email.trim()) {
          newErrors.email = "Email is required";
        } else {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(email.trim())) {
            newErrors.email = "Please enter a valid email address";
          } else {
            newErrors.email = "";
          }
        }
        break;
      case 'skillLevel':
        if (!skillLevel) {
          newErrors.skillLevel = "Skill level is required";
        } else {
          newErrors.skillLevel = "";
        }
        break;
    }
    
    setErrors(newErrors);
  };
  
  // Handle manual payment booking creation
  const handleManualPayment = async () => {
    if (!validateForm() || !retreat || !user) {
      return;
    }

    setProcessingManualPayment(true);

    try {
      const totalPrice = calculateTotalPrice();
      
      // Create booking with manual payment status (pending approval)
      const { data: booking, error } = await supabase
        .from('bookings')
        .insert({
          retreat_id: retreat.id,
          user_id: user.id,
          payment_intent_id: `manual_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`, // Unique ID for manual payments
          full_name: fullName.trim(),
          email: email.trim(),
          skill_level: skillLevel,
          amount: totalPrice,
          status: 'confirmed', // Set status for database consistency
          payment_status: 'paid_manual',
          manual_payment_status: 'pending_approval', // Requires organizer approval
          full_amount: totalPrice,
          price_variant: selectedPriceVariant || null,
          add_ons: selectedAddOns.length > 0 ? selectedAddOns : null,
          booking_date: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Update retreat spots available
      await supabase.rpc('decrement_spots', { retreat_id: retreat.id });

      // Send initial email notification about manual payment submission
      const emailSubject = `Registration Submitted: ${retreat.title}`;
      const emailMessage = `
Hello ${fullName.trim()},

Thank you for registering for "${retreat.title}"!

Your manual payment registration has been submitted and is currently pending organizer approval.

⚠️ IMPORTANT: You must submit your payment to the organizer within 48 hours, or your registration will be automatically cancelled.

Please contact the organizer directly to arrange payment. Once the organizer receives your payment and approves your registration, you will receive a confirmation email.

Retreat Details:
- Event: ${retreat.title}
- Date: ${retreat.date}
- Location: ${retreat.location}
- Amount: $${totalPrice.toFixed(2)}

If you have any questions, please contact the organizer directly.

Thank you,
BookMyQuiltRetreat Team
      `.trim();

      // Send email notification (don't block on error)
      sendCustomEmail({
        emails: [email.trim()],
        subject: emailSubject,
        message: emailMessage,
        recipientType: 'students',
      }).catch(error => {
        console.error('Error sending initial email notification:', error);
        // Don't show error to user - registration succeeded
      });

      toast({
        title: "Registration Submitted",
        description: "Your manual payment registration has been submitted and is pending organizer approval.",
      });

      // Navigate to confirmation page
      navigate(`/retreat/${id}/confirmed`, {
        state: {
          retreat,
          booking: { 
            fullName: fullName.trim(), 
            email: email.trim(), 
            skillLevel: skillLevel,
            price_variant: selectedPriceVariant,
            selected_add_ons: selectedAddOns
          },
          bookingId: booking.id,
          paymentMethod: 'manual',
        },
      });
    } catch (error: any) {
      console.error('Error creating manual payment booking:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessingManualPayment(false);
    }
  };

  // Handle form submission
  const handleContinue = () => {
    if (validateForm()) {
      // If manual payment is selected, create booking directly
      if (paidManually) {
        handleManualPayment();
        return;
      }

      // Otherwise, proceed to payment page
      navigate(`/retreat/${id}/payment`, {
        state: {
          retreat,
          booking: { 
            fullName: fullName.trim(), 
            email: email.trim(), 
            skillLevel: skillLevel,
            price_variant: selectedPriceVariant,
            selected_add_ons: selectedAddOns
          },
        },
      });
    }
  };

  // Fetch user profile to auto-fill name and email
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching user profile:', error);
        } else if (data) {
          if (data.full_name) {
            setFullName(data.full_name);
          }
          if (data.email || user.email) {
            setEmail(data.email || user.email || "");
          }
        }
      } catch (error) {
        console.error('Unexpected error fetching profile:', error);
      }
    };

    fetchUserProfile();
  }, [user]);

  // Try to get retreat from navigation state first, then fetch by id
  useEffect(() => {
    const retreatFromState = (location.state as any)?.retreat;
    const selectedVariantFromState = (location.state as any)?.selectedPriceVariant;
    
    if (retreatFromState) {
      // Transform if needed - include all fields
      const transformed = {
        id: retreatFromState.id,
        title: retreatFromState.title,
        description: retreatFromState.description,
        location: retreatFromState.location,
        date: retreatFromState.date,
        duration: retreatFromState.duration,
        level: retreatFromState.level,
        price: retreatFromState.price,
        spots_available: retreatFromState.spots_available || retreatFromState.spotsAvailable,
        total_spots: retreatFromState.total_spots || retreatFromState.totalSpots,
        published: retreatFromState.published,
        image: retreatFromState.image,
        includes: retreatFromState.includes,
        schedule: retreatFromState.schedule,
        deposit_amount: retreatFromState.deposit_amount,
        deposit_refundable: retreatFromState.deposit_refundable,
        deposit_refund_days_before: retreatFromState.deposit_refund_days_before,
        payment_days_before_event: retreatFromState.payment_days_before_event,
        full_payment_non_refundable: retreatFromState.full_payment_non_refundable,
        discount_coupon: retreatFromState.discount_coupon,
        price_variants: retreatFromState.price_variants,
        add_ons: retreatFromState.add_ons,
        content_cards: retreatFromState.content_cards,
        itinerary_blocks: retreatFromState.itinerary_blocks,
        location_images: retreatFromState.location_images,
      };
      setRetreat(transformed);
      // Set selected price variant if provided from navigation state
      if (selectedVariantFromState) {
        setSelectedPriceVariant(selectedVariantFromState);
      }
      setLoading(false);
    } else if (id) {
      // Fetch from Supabase - get all fields
      const fetchRetreat = async () => {
        try {
          const { data, error } = await supabase
            .from('retreats')
            .select('*')
            .eq('id', Number(id))
            .eq('published', true)
            .single();

          if (error) {
            console.error('Error fetching retreat:', error);
          } else if (data) {
            setRetreat(data);
          }
        } catch (error) {
          console.error('Unexpected error:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchRetreat();
    } else {
      setLoading(false);
    }
  }, [id, location.state]);

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

  // Students can only book published retreats
  if (!retreat.published) {
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

  return (
    <div className="min-h-screen bg-gradient-hero pb-32">
      <div className="px-4 sm:px-6 max-w-4xl mx-auto space-y-4 sm:space-y-6 pt-4 sm:pt-6">
        {/* Event Header Card */}
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                <img 
                  src={retreat.image || "/placeholder.svg"} 
                  alt={retreat.title} 
                  className="w-16 h-12 sm:w-20 sm:h-16 rounded-md object-cover flex-shrink-0" 
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-card-foreground text-sm sm:text-base truncate">{retreat.title}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">{retreat.date}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">{retreat.location}</p>
                </div>
              </div>
              <div className="text-left sm:text-right w-full sm:w-auto flex-shrink-0">
                {retreat.price_variants && retreat.price_variants.length > 0 ? (
                  <div>
                    <p className="text-base sm:text-lg font-bold text-primary">
                      ${calculateTotalPrice().toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selectedPriceVariant ? 
                        retreat.price_variants.find(v => v.id === selectedPriceVariant)?.name :
                        'Select pricing option'
                      }
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-base sm:text-lg font-bold text-primary">${calculateTotalPrice().toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">per person</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Event Details Section */}
        {((retreat.description && retreat.description.trim()) || 
          (retreat.duration && retreat.duration.trim()) || 
          retreat.level || 
          (retreat.includes && retreat.includes.length > 0) || 
          (retreat.schedule && retreat.schedule.length > 0) || 
          (retreat.itinerary_blocks && retreat.itinerary_blocks.length > 0) || 
          (retreat.content_cards && retreat.content_cards.length > 0 && retreat.content_cards.some(card => (card.title && card.title.trim()) || (card.description && card.description.trim()) || (card.images && card.images.length > 0) || (card.videos && card.videos.length > 0))) || 
          (retreat.location_images && retreat.location_images.length > 0)) && (
          <Card>
            <CardContent className="p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold text-card-foreground mb-4">Event Details</h2>
              <div className="space-y-4">
                {/* Description */}
                {retreat.description && retreat.description.trim() && (
                  <div>
                    <h3 className="text-sm font-medium text-card-foreground mb-2">About This Event</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{retreat.description}</p>
                  </div>
                )}

                {/* Key Details Grid */}
                {((retreat.duration && retreat.duration.trim()) || 
                  retreat.level || 
                  (retreat.spots_available !== undefined && retreat.total_spots !== undefined)) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {retreat.duration && retreat.duration.trim() && (
                      <div className="flex items-start gap-2 text-muted-foreground">
                        <Clock className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-muted-foreground mb-0.5">Duration</p>
                          <p className="text-sm font-medium text-card-foreground">{retreat.duration}</p>
                        </div>
                      </div>
                    )}
                    {retreat.level && (
                      <div className="flex items-start gap-2 text-muted-foreground">
                        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-muted-foreground mb-0.5">Skill Level</p>
                          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-xs">
                            {retreat.level}
                          </Badge>
                        </div>
                      </div>
                    )}
                    {retreat.spots_available !== undefined && retreat.total_spots !== undefined && (
                      <div className="flex items-start gap-2 text-muted-foreground">
                        <Users className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-muted-foreground mb-0.5">Availability</p>
                          <p className="text-sm font-medium text-card-foreground">
                            {retreat.spots_available} of {retreat.total_spots} spots available
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* What's Included */}
                {retreat.includes && retreat.includes.length > 0 && retreat.includes.some(item => item && item.trim()) && (
                  <div>
                    <h3 className="text-sm font-medium text-card-foreground mb-2">What's Included</h3>
                    <ul className="space-y-1.5">
                      {retreat.includes
                        .filter(item => item && item.trim())
                        .map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <span className="text-primary mt-0.5">✓</span>
                            <span>{item}</span>
                          </li>
                        ))}
                    </ul>
                  </div>
                )}

                {/* Schedule */}
                {retreat.schedule && retreat.schedule.length > 0 && retreat.schedule.some(item => (item.day && item.day.trim()) || (item.activities && item.activities.trim())) && (
                  <div>
                    <h3 className="text-sm font-medium text-card-foreground mb-2">Schedule</h3>
                    <div className="space-y-2">
                      {retreat.schedule
                        .filter(item => (item.day && item.day.trim()) || (item.activities && item.activities.trim()))
                        .map((item, idx) => (
                          <div key={idx} className="pb-2 border-b border-border last:border-0 last:pb-0">
                            {item.day && item.day.trim() && (
                              <p className="font-medium text-sm text-card-foreground mb-0.5">{item.day}</p>
                            )}
                            {item.activities && item.activities.trim() && (
                              <p className="text-xs text-muted-foreground">{item.activities}</p>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Itinerary Blocks */}
                {retreat.itinerary_blocks && retreat.itinerary_blocks.length > 0 && retreat.itinerary_blocks.some(block => (block.day && block.day.trim()) || (block.title && block.title.trim()) || (block.description && block.description.trim())) && (
                  <div>
                    <h3 className="text-sm font-medium text-card-foreground mb-2">Itinerary</h3>
                    <div className="space-y-2">
                      {retreat.itinerary_blocks
                        .filter(block => (block.day && block.day.trim()) || (block.title && block.title.trim()) || (block.description && block.description.trim()))
                        .sort((a, b) => (a.order || 0) - (b.order || 0))
                        .map((block) => (
                          <div key={block.id} className="pb-2 border-b border-border last:border-0 last:pb-0">
                            {(block.day && block.day.trim()) || (block.title && block.title.trim()) ? (
                              <p className="font-medium text-sm text-card-foreground mb-0.5">
                                {block.day && block.day.trim() ? block.day : block.title}
                              </p>
                            ) : null}
                            {block.description && block.description.trim() && (
                              <p className="text-xs text-muted-foreground">{block.description}</p>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Content Cards */}
                {retreat.content_cards && retreat.content_cards.length > 0 && retreat.content_cards.some(card => 
                  (card.title && card.title.trim()) || 
                  (card.description && card.description.trim()) || 
                  (card.images && card.images.length > 0 && card.images.some(img => img && img.trim())) || 
                  (card.videos && card.videos.length > 0 && card.videos.some(vid => vid && vid.trim()))
                ) && (
                  <div className="space-y-4">
                    {retreat.content_cards
                      .filter(card => 
                        (card.title && card.title.trim()) || 
                        (card.description && card.description.trim()) || 
                        (card.images && card.images.length > 0 && card.images.some(img => img && img.trim())) || 
                        (card.videos && card.videos.length > 0 && card.videos.some(vid => vid && vid.trim()))
                      )
                      .sort((a, b) => (a.order || 0) - (b.order || 0))
                      .map((card) => (
                        <div key={card.id} className="border rounded-lg p-4 bg-card">
                          {card.title && card.title.trim() && (
                            <h3 className="text-sm font-semibold text-card-foreground mb-2">{card.title}</h3>
                          )}
                          {card.description && card.description.trim() && (
                            <p className="text-sm text-muted-foreground leading-relaxed mb-3">{card.description}</p>
                          )}
                          {/* Images */}
                          {card.images && card.images.length > 0 && card.images.filter(img => img && img.trim()).length > 0 && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
                              {card.images
                                .filter(img => img && img.trim())
                                .map((img, idx) => (
                                  <img
                                    key={idx}
                                    src={img}
                                    alt={`${card.title || 'Content'} ${idx + 1}`}
                                    className="w-full h-24 object-cover rounded-md"
                                  />
                                ))}
                            </div>
                          )}
                          {/* Videos */}
                          {card.videos && card.videos.length > 0 && card.videos.filter(vid => vid && vid.trim()).length > 0 && (
                            <div className="space-y-2">
                              {card.videos
                                .filter(vid => vid && vid.trim())
                                .map((video, idx) => (
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
                )}

                {/* Location Images */}
                {retreat.location_images && retreat.location_images.length > 0 && retreat.location_images.some(img => img && img.trim()) && (
                  <div>
                    <h3 className="text-sm font-medium text-card-foreground mb-2">Location Photos</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {retreat.location_images
                        .filter(img => img && img.trim())
                        .map((img, idx) => (
                          <img
                            key={idx}
                            src={img}
                            alt={`Location ${idx + 1}`}
                            className="w-full h-32 object-cover rounded-md"
                          />
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment Terms */}
        {(retreat.deposit_amount && retreat.deposit_amount > 0) || 
         (retreat.payment_days_before_event !== null && retreat.payment_days_before_event !== undefined) || 
         (retreat.deposit_refundable !== null && retreat.deposit_refundable !== undefined) ||
         (retreat.deposit_refund_days_before && retreat.deposit_refund_days_before > 0) ||
         (retreat.full_payment_non_refundable !== null && retreat.full_payment_non_refundable !== undefined) ? (
          <Card>
            <CardContent className="p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold text-card-foreground mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment Terms
              </h2>
              <div className="space-y-2 text-sm">
                {retreat.deposit_amount && retreat.deposit_amount > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Deposit Amount</span>
                    <span className="font-medium text-card-foreground">${retreat.deposit_amount.toFixed(2)}</span>
                  </div>
                )}
                {retreat.deposit_refundable !== null && retreat.deposit_refundable !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Deposit Refundable</span>
                    <span className="font-medium text-card-foreground">
                      {retreat.deposit_refundable ? 'Yes' : 'No'}
                    </span>
                  </div>
                )}
                {retreat.deposit_refund_days_before && retreat.deposit_refund_days_before > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Refund Deadline</span>
                    <span className="font-medium text-card-foreground">
                      {retreat.deposit_refund_days_before} days before event
                    </span>
                  </div>
                )}
                {retreat.payment_days_before_event !== null && retreat.payment_days_before_event !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Full Payment Due</span>
                    <span className="font-medium text-card-foreground">
                      {retreat.payment_days_before_event} days before event
                    </span>
                  </div>
                )}
                {retreat.full_payment_non_refundable !== null && retreat.full_payment_non_refundable !== undefined && (
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
        ) : null}

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (errors.fullName) {
                      setErrors({ ...errors, fullName: "" });
                    }
                  }}
                  onBlur={() => handleBlur('fullName')}
                  className={errors.fullName ? "border-destructive" : ""}
                />
                {errors.fullName && (
                  <p className="text-sm text-destructive mt-1">{errors.fullName}</p>
                )}
              </div>

              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  placeholder="your.email@example.com"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) {
                      setErrors({ ...errors, email: "" });
                    }
                  }}
                  onBlur={() => handleBlur('email')}
                  className={errors.email ? "border-destructive" : ""}
                />
                {errors.email && (
                  <p className="text-sm text-destructive mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <Label htmlFor="skillLevel">Your Skill Level *</Label>
                <Select
                  value={skillLevel}
                  onValueChange={(value: "Any" | "Beginner" | "Intermediate" | "Advanced") => {
                    setSkillLevel(value);
                    if (errors.skillLevel) {
                      setErrors({ ...errors, skillLevel: "" });
                    }
                  }}
                >
                  <SelectTrigger id="skillLevel" className={errors.skillLevel ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select your skill level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Any">Any Skill Level</SelectItem>
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
                {errors.skillLevel && (
                  <p className="text-sm text-destructive mt-1">{errors.skillLevel}</p>
                )}
              </div>

              {/* Price Variants Selection */}
              {retreat.price_variants && retreat.price_variants.length > 0 && retreat.price_variants.some(v => v.id && v.name && v.name.trim()) && (
                <div>
                  <Label htmlFor="priceVariant">Select Pricing Option *</Label>
                  <p className="text-xs text-muted-foreground mb-2">Choose your preferred pricing tier</p>
                  <div className="space-y-3">
                    {retreat.price_variants
                      .filter(variant => variant.id && variant.name && variant.name.trim())
                      .map((variant) => (
                      <div 
                        key={variant.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedPriceVariant === variant.id 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => {
                          setSelectedPriceVariant(variant.id);
                          if (errors.priceVariant) {
                            setErrors({ ...errors, priceVariant: "" });
                          }
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-card-foreground">{variant.name}</div>
                            {variant.description && (
                              <div className="text-sm text-muted-foreground mt-1">{variant.description}</div>
                            )}
                          </div>
                          <div className="text-lg font-bold text-primary">${variant.price.toFixed(2)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {errors.priceVariant && (
                    <p className="text-sm text-destructive mt-1">{errors.priceVariant}</p>
                  )}
                </div>
              )}

              {/* Add-ons Selection */}
              {retreat.add_ons && retreat.add_ons.length > 0 && retreat.add_ons.some(a => a.id && a.name && a.name.trim()) && (
                <div>
                  <Label>Additional Options</Label>
                  <p className="text-xs text-muted-foreground mb-2">Enhance your retreat experience</p>
                  <div className="space-y-3">
                    {retreat.add_ons
                      .filter(addOn => addOn.id && addOn.name && addOn.name.trim())
                      .map((addOn) => {
                      const isSelected = selectedAddOns.includes(addOn.id) || addOn.required;
                      return (
                        <div 
                          key={addOn.id}
                          className={`p-3 border rounded-lg transition-colors ${
                            addOn.required 
                              ? 'border-orange-200 bg-orange-50 cursor-not-allowed' 
                              : isSelected
                                ? 'border-primary bg-primary/5 cursor-pointer'
                                : 'border-border cursor-pointer hover:border-primary/50'
                          }`}
                          onClick={() => {
                            if (!addOn.required) {
                              if (isSelected) {
                                setSelectedAddOns(prev => prev.filter(id => id !== addOn.id));
                              } else {
                                setSelectedAddOns(prev => [...prev, addOn.id]);
                              }
                            }
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <div className="font-medium text-card-foreground">{addOn.name}</div>
                                {addOn.required && (
                                  <span className="text-xs bg-orange-100 text checked:by-orange-800 px-2 py-1 rounded">Required</span>
                                )}
                              </div>
                              {addOn.description && (
                                <div className="text-sm text-muted-foreground mt-1">{addOn.description}</div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-lg font-bold text-primary">${addOn.price.toFixed(2)}</div>
                              {!addOn.required && (
                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                  isSelected ? 'border-primary bg-primary' : 'border-border'
                                }`}>
                                  {isSelected && (
                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-2">
              {/* Base Price or Selected Price Variant */}
              {retreat.price_variants && retreat.price_variants.length > 0 && selectedPriceVariant ? (
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>
                    {retreat.price_variants.find(v => v.id === selectedPriceVariant)?.name}
                  </span>
                  <span>
                    ${retreat.price_variants.find(v => v.id === selectedPriceVariant)?.price.toFixed(2)}
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Retreat price</span>
                  <span>${retreat.price}</span>
                </div>
              )}
              
              {/* Add-ons */}
              {retreat.add_ons && retreat.add_ons.length > 0 && retreat.add_ons.some(a => a.id && a.name && a.name.trim() && (a.required || selectedAddOns.includes(a.id))) && (
                <>
                  {retreat.add_ons
                    .filter(addOn => addOn.id && addOn.name && addOn.name.trim() && (addOn.required || selectedAddOns.includes(addOn.id)))
                    .map(addOn => (
                      <div key={addOn.id} className="flex items-center justify-between text-muted-foreground">
                        <span>
                          {addOn.name}
                          {addOn.required && <span className="text-xs ml-1">(required)</span>}
                        </span>
                        <span>${addOn.price.toFixed(2)}</span>
                      </div>
                    ))}
                </>
              )}
              
              <div className="flex items-center justify-between font-semibold text-card-foreground pt-2 border-t">
                <span>Total</span>
                <span className="text-primary">${calculateTotalPrice().toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Manual Payment Checkbox */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="paidManually"
                checked={paidManually}
                onCheckedChange={(checked) => setPaidManually(checked === true)}
                className="mt-1"
              />
              <div className="flex-1">
                <Label
                  htmlFor="paidManually"
                  className="text-sm sm:text-base font-normal cursor-pointer"
                >
                  I've paid manually via check, Venmo or other method
                </Label>
                {paidManually && (
                  <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                    Your registration will be confirmed immediately after submitting.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

      </div>

      <div className="fixed bottom-4 left-0 right-0 px-4 sm:px-6 pb-safe">
        <div className="max-w-4xl mx-auto">
          <Button
            className="w-full h-12 text-base sm:text-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white"
            onClick={handleContinue}
            disabled={processingManualPayment}
          >
            {processingManualPayment 
              ? "Processing..." 
              : paidManually 
                ? "Complete Registration" 
                : "Continue to Payment"}
          </Button>
          {(errors.fullName || errors.email || errors.skillLevel) && (
            <p className="text-xs sm:text-sm text-destructive text-center mt-2">
              Please fill in all required fields correctly
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Booking;
