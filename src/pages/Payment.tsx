import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  useLazyGetRetreatByIdQuery,
  useGetRetreatRoomsQuery,
  useGetRetreatSeatsQuery,
  useCreateBookingMutation,
  useCreatePaymentIntentMutation,
  useConfirmPaymentMutation,
} from "@/services/server";
import { toLegacyRetreat } from "@/services/mappers";
import { useStripe, useElements, CardElement } from "@stripe/react-stripe-js";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Edit } from "lucide-react";
import type { EventBed, EventRoom, EventSeat } from "@/lib/event-capacity";

interface RetreatData {
  id: number;
  title: string;
  location: string;
  date: string;
  price: number;
  spots_available: number;
  total_spots: number;
  published: boolean;
  image: string;
  deposit_amount?: number | null;
  deposit_refundable?: boolean | null;
  deposit_refund_days_before?: number | null;
  payment_days_before_event?: number | null;
  full_payment_non_refundable?: boolean | null;
  discount_coupon?: string | null;
  price_variants?: { id: string; name: string; price: number; description?: string }[] | null;
  add_ons?: { id: string; name: string; price: number; description?: string; required?: boolean }[] | null;
}

const Payment = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const stripe = useStripe();
  const elements = useElements();
  const [triggerGetRetreat] = useLazyGetRetreatByIdQuery();
  const [createBooking] = useCreateBookingMutation();
  const [createPaymentIntent] = useCreatePaymentIntentMutation();
  const [confirmPayment] = useConfirmPaymentMutation();
  
  const [retreat, setRetreat] = useState<RetreatData | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [pendingBookingId, setPendingBookingId] = useState<string | null>(null);
  const bookingFromState = (location.state as any)?.booking;
  const selectedPriceVariant = bookingFromState?.price_variant || null;
  const selectedAddOns = bookingFromState?.selected_add_ons || [];
  const ticketType = bookingFromState?.ticket_type;
  const bedAssignment = bookingFromState?.bed_assignment;
  const seatAssignment = bookingFromState?.seat_assignment;

  const { data: roomsData } = useGetRetreatRoomsQuery(String(retreat?.id ?? ""), {
    skip: !retreat?.id || ticketType !== "STAY" || !bedAssignment,
  });
  const { data: seatsData } = useGetRetreatSeatsQuery(String(retreat?.id ?? ""), {
    skip: !retreat?.id || ticketType !== "SEAT_ONLY" || !seatAssignment,
  });

  // Stripe Card Element error state
  const [cardError, setCardError] = useState<string>("");

  // Bed/Seat details for confirmation display
  const [bedDetails, setBedDetails] = useState<{ bed: EventBed; room: EventRoom } | null>(null);
  const [seatDetails, setSeatDetails] = useState<EventSeat | null>(null);

  // Calculate total price based on selections
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

  // Derive bed/seat details for confirmation display
  useEffect(() => {
    if (ticketType === "STAY" && bedAssignment && roomsData && retreat?.id) {
      for (const room of roomsData) {
        const beds = (room.beds as Record<string, unknown>[]) ?? [];
        const bed = beds.find((b) => String(b.id) === bedAssignment.bedId);
        if (bed) {
          setBedDetails({
            bed: {
              id: String(bed.id),
              event_id: retreat.id,
              event_room_id: String(room.id),
              title: String(bed.title ?? ""),
              image_url: (bed.imageUrl ?? bed.image_url) as string | undefined,
              status: "AVAILABLE",
            },
            room: {
              id: String(room.id),
              event_id: retreat.id,
              source_room_id: String(room.sourceRoomId ?? room.source_room_id ?? room.id),
              name: String(room.name ?? ""),
              image_url: (room.imageUrl ?? room.image_url) as string | undefined,
              description: (room.description as string | undefined) ?? undefined,
              bed_count: Number(room.bedCount ?? room.bed_count ?? beds.length),
            },
          });
          break;
        }
      }
    } else if (ticketType === "SEAT_ONLY" && seatAssignment && seatsData && retreat?.id) {
      const seat = seatsData.find((s) => String(s.id) === seatAssignment.seatId);
      if (seat) {
        setSeatDetails({
          id: String(seat.id),
          event_id: retreat.id,
          seat_index: Number(seat.seatIndex ?? seat.seat_index ?? 0),
          row: Number(seat.row ?? 0),
          col: Number(seat.col ?? 0),
          status: "AVAILABLE",
        });
      }
    }
  }, [retreat, ticketType, bedAssignment, seatAssignment, roomsData, seatsData]);

  // Fetch retreat and create payment intent
  useEffect(() => {
    const retreatFromState = (location.state as any)?.retreat;

    const calculatePriceForRetreat = (retreatData: RetreatData) => {
      let basePrice = retreatData.price || 0;

      if (retreatData.price_variants && retreatData.price_variants.length > 0 && selectedPriceVariant) {
        const variant = retreatData.price_variants.find(v => v.id === selectedPriceVariant);
        if (variant) {
          basePrice = variant.price;
        }
      }

      let addOnsTotal = 0;
      if (retreatData.add_ons) {
        retreatData.add_ons.forEach(addOn => {
          if (addOn.required || selectedAddOns.includes(addOn.id)) {
            addOnsTotal += addOn.price;
          }
        });
      }

      return basePrice + addOnsTotal;
    };

    const buildBookingBody = (retreatData: RetreatData) => ({
      retreatId: String(retreatData.id),
      fullName: bookingFromState.fullName,
      email: bookingFromState.email,
      skillLevel: bookingFromState.skillLevel,
      amount: calculatePriceForRetreat(retreatData),
      status: "pending",
      priceVariant: bookingFromState.price_variant || null,
      addOns: bookingFromState.selected_add_ons?.length ? bookingFromState.selected_add_ons : null,
      ticketType: bookingFromState.ticket_type || null,
      bedAssignment: bookingFromState.bed_assignment || null,
      seatAssignment: bookingFromState.seat_assignment || null,
    });
    
    const initializePayment = async (retreatData: RetreatData) => {
      if (!bookingFromState || !user) {
        toast({
          title: "Error",
          description: "Booking information is missing",
          variant: "destructive",
        });
        return;
      }

      try {
        const booking = await createBooking(buildBookingBody(retreatData)).unwrap();
        const bookingId = String(booking.id);
        setPendingBookingId(bookingId);

        const { clientSecret: secret } = await createPaymentIntent({ bookingId }).unwrap();
        if (secret) {
          setClientSecret(secret);
        }
      } catch (error: unknown) {
        console.error('Error initializing payment:', error);
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to initialize payment",
          variant: "destructive",
        });
      }
    };
    
    if (retreatFromState) {
      setRetreat(retreatFromState);
      setLoading(false);
      initializePayment(retreatFromState);
    } else if (id) {
      const fetchRetreat = async () => {
        try {
          const data = await triggerGetRetreat(id).unwrap();
          const mapped = toLegacyRetreat(data) as RetreatData;
          if (mapped.published === false) {
            throw new Error("Retreat not found");
          }
          setRetreat(mapped);
          await initializePayment(mapped);
        } catch (error) {
          console.error('Error fetching retreat:', error);
          toast({
            title: "Error",
            description: "Failed to load retreat details",
            variant: "destructive",
          });
        } finally {
          setLoading(false);
        }
      };

      fetchRetreat();
    } else {
      setLoading(false);
    }
  }, [id, location.state, bookingFromState, user, toast, createBooking, createPaymentIntent, triggerGetRetreat]);

  // Handle payment submission
  const handleConfirmPayment = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret || !retreat || !bookingFromState) {
      toast({
        title: "Error",
        description: "Payment system is not ready. Please try again.",
        variant: "destructive",
      });
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      toast({
        title: "Error",
        description: "Card information is missing",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    setCardError("");

    try {
      // Confirm payment with Stripe
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: bookingFromState.fullName,
            email: bookingFromState.email,
          },
        },
      });

      if (stripeError) {
        setCardError(stripeError.message || "Payment failed");
        toast({
          title: "Payment Failed",
          description: stripeError.message || "Your payment could not be processed",
          variant: "destructive",
        });
        setProcessing(false);
        return;
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        const confirmResult = await confirmPayment({
          paymentIntentId: paymentIntent.id,
          bookingId: pendingBookingId,
          retreatId: String(retreat.id),
          bookingDetails: bookingFromState,
          userId: user?.id,
        }).unwrap() as { booking?: { id: string }; bookingId?: string };

        const bookingId = confirmResult.booking?.id ?? confirmResult.bookingId ?? pendingBookingId;

        if (bookingId) {
          toast({
            title: "Payment Successful",
            description: "Your booking has been confirmed!",
          });
          
          navigate(`/retreat/${id}/confirmed`, {
            state: {
              retreat,
              booking: bookingFromState,
              paymentIntent: paymentIntent.id,
              bookingId,
            },
          });
        } else {
          toast({
            title: "Error",
            description: "Payment succeeded but booking creation failed. Please contact support.",
            variant: "destructive",
          });
          setProcessing(false);
        }
      } else {
        toast({
          title: "Payment Pending",
          description: "Your payment is being processed",
        });
        setProcessing(false);
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      setCardError(error.message || "An unexpected error occurred");
      toast({
        title: "Error",
        description: error.message || "Payment processing failed",
        variant: "destructive",
      });
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">Loading payment details...</p>
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

  return (
    <div className="min-h-screen bg-gradient-hero pb-32">
      <div className="px-4 sm:px-6 max-w-4xl mx-auto space-y-4 sm:space-y-6 pt-4 sm:pt-6">
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
                  <p className="text-xs sm:text-sm text-muted-foreground truncate break-words break-all">{retreat.location}</p>
                </div>
              </div>
              <div className="text-left sm:text-right w-full sm:w-auto flex-shrink-0">
                <p className="text-base sm:text-lg font-bold text-primary">${calculateTotalPrice().toFixed(2)}</p>
                {retreat.price_variants && retreat.price_variants.length > 0 && selectedPriceVariant && (
                  <p className="text-xs text-muted-foreground">
                    {retreat.price_variants.find(v => v.id === selectedPriceVariant)?.name}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bed/Seat Confirmation Card */}
        {(ticketType === 'STAY' && bedDetails) || (ticketType === 'SEAT_ONLY' && seatDetails) ? (
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  {ticketType === 'STAY' && bedDetails && (
                    <>
                      <p className="text-sm font-semibold text-card-foreground mb-2">Bed/Room Confirmation</p>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Room:</span>
                          <span className="text-sm font-medium text-card-foreground">{bedDetails.room.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Bed:</span>
                          <span className="text-sm font-medium text-card-foreground">{bedDetails.bed.title}</span>
                        </div>
                        {bedDetails.bed.image_url && (
                          <img 
                            src={bedDetails.bed.image_url} 
                            alt={bedDetails.bed.title}
                            className="w-24 h-24 rounded-md object-cover mt-2"
                          />
                        )}
                      </div>
                    </>
                  )}
                  {ticketType === 'SEAT_ONLY' && seatDetails && (
                    <>
                      <p className="text-sm font-semibold text-card-foreground mb-2">Seat Confirmation</p>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Seat:</span>
                          <span className="text-sm font-medium text-card-foreground">
                            Row {seatDetails.row}, Seat {seatDetails.col} (Seat #{seatDetails.seat_index})
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/retreat/${id}/booking`, { 
                    state: { 
                      retreat,
                      booking: bookingFromState,
                      modifySelection: true 
                    } 
                  })}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Modify
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3 text-muted-foreground mb-4">
              <div className="w-5 h-5 rounded border border-border flex items-center justify-center flex-shrink-0">💳</div>
              <p className="text-xs sm:text-sm">Secure payment powered by Stripe</p>
            </div>

            <form id="payment-form" onSubmit={handleConfirmPayment}>
            <div className="space-y-4">
                <div>
                  <Label className="text-sm sm:text-base">Card Information *</Label>
                  <div className="mt-2 p-2 sm:p-3 border rounded-md bg-card">
                    <CardElement
                      options={{
                        hidePostalCode: true,
                        style: {
                          base: {
                            fontSize: '14px',
                            color: '#424770',
                            '::placeholder': {
                              color: '#aab7c4',
                            },
                          },
                          invalid: {
                            color: '#fa755a',
                            iconColor: '#fa755a',
                          },
                        },
                      }}
                      onChange={(e) => {
                        if (e.error) {
                          setCardError(e.error.message);
                        } else {
                          setCardError("");
                        }
                      }}
                    />
                </div>
                  {cardError && (
                    <p className="text-xs sm:text-sm text-destructive mt-1">{cardError}</p>
                  )}
              </div>

              <div className="mt-4 p-2 sm:p-3 bg-muted/20 rounded-md text-xs sm:text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="w-4 flex-shrink-0">🔒</span>
                  <span>Your payment information is encrypted and secure</span>
                </div>
              </div>
            </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-2">
              {/* Base Price or Selected Price Variant */}
              {retreat.price_variants && retreat.price_variants.length > 0 && selectedPriceVariant ? (
                <div className="flex items-center justify-between text-sm sm:text-base text-muted-foreground">
                  <span>
                    {retreat.price_variants.find(v => v.id === selectedPriceVariant)?.name}
                  </span>
                  <span>
                    ${retreat.price_variants.find(v => v.id === selectedPriceVariant)?.price.toFixed(2)}
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-between text-sm sm:text-base text-muted-foreground">
                  <span>Retreat price</span>
                  <span>${retreat.price}</span>
                </div>
              )}
              
              {/* Add-ons */}
              {retreat.add_ons && retreat.add_ons.length > 0 && (
                <>
                  {retreat.add_ons
                    .filter(addOn => addOn.required || selectedAddOns.includes(addOn.id))
                    .map(addOn => (
                      <div key={addOn.id} className="flex items-center justify-between text-sm sm:text-base text-muted-foreground">
                        <span>
                          {addOn.name}
                          {addOn.required && <span className="text-xs ml-1">(required)</span>}
                        </span>
                        <span>${addOn.price.toFixed(2)}</span>
                      </div>
                    ))}
                </>
              )}
              
              <div className="flex items-center justify-between text-base sm:text-lg font-semibold text-card-foreground pt-2 border-t">
                <span>Total</span>
                <span className="text-primary">${calculateTotalPrice().toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>

      <div className="fixed bottom-4 left-0 right-0 px-4 sm:px-6 pb-safe">
        <div className="max-w-4xl mx-auto">
          <Button
            type="submit"
            form="payment-form"
            className="w-full h-12 text-base sm:text-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white"
            disabled={!stripe || !elements || processing || !clientSecret}
          >
            {processing ? "Processing..." : `Confirm & Pay $${retreat?.price || 0}`}
          </Button>
          {cardError && (
            <p className="text-xs sm:text-sm text-destructive text-center mt-2">
              {cardError}
            </p>
          )}
          {!clientSecret && !loading && (
            <p className="text-xs sm:text-sm text-muted-foreground text-center mt-2">
              Initializing payment...
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Payment;
