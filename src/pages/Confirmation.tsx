import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Clock, Edit } from "lucide-react";
import calendar, { createGoogleCalendarUrl } from "@/lib/calendar";
import { convertReferral, getCurrentAffiliate, createPassiveCommission } from "@/lib/affiliate-tracking";
import { supabase } from "@/lib/supabase";
import { usePlatformSettings } from "@/contexts/PlatformSettingsContext";
import { getBedDetailsFromAssignment, getSeatDetailsFromAssignment, fetchEventRooms, fetchEventSeats, EventBed, EventRoom, EventSeat } from "@/lib/event-capacity";

const Confirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { instructorFeeRate } = usePlatformSettings();

  const retreat = (location.state as any)?.retreat;
  const booking = (location.state as any)?.booking;
  const bookingId = (location.state as any)?.bookingId;
  const paymentMethod = (location.state as any)?.paymentMethod; // 'manual' or 'stripe'
  const ticketType = booking?.ticket_type;
  const bedAssignment = booking?.bed_assignment;
  const seatAssignment = booking?.seat_assignment;

  const [bedDetails, setBedDetails] = useState<{ bed: EventBed; room: EventRoom } | null>(null);
  const [seatDetails, setSeatDetails] = useState<EventSeat | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Fetch bed/seat details if booking has assignment
  useEffect(() => {
    const fetchAssignmentDetails = async () => {
      if (!retreat?.id) return;

      setLoadingDetails(true);
      try {
        if (ticketType === 'STAY' && bedAssignment) {
          // bedAssignment structure: { bedId, roomId, bedTitle, roomName }
          // Try to fetch from database first (if booking is confirmed)
          if (bookingId) {
            const details = await getBedDetailsFromAssignment(bookingId);
            if (details) {
              setBedDetails(details);
              setLoadingDetails(false);
              return;
            }
          }
          // Fallback: fetch from event rooms using bedId from state
          const rooms = await fetchEventRooms(retreat.id);
          for (const room of rooms) {
            const bed = room.beds?.find(b => b.id === bedAssignment.bedId);
            if (bed) {
              setBedDetails({ bed, room });
              break;
            }
          }
        } else if (ticketType === 'SEAT_ONLY' && seatAssignment) {
          // seatAssignment structure: { seatId, seatIndex, row, col }
          // Try to fetch from database first (if booking is confirmed)
          if (bookingId) {
            const details = await getSeatDetailsFromAssignment(bookingId);
            if (details) {
              setSeatDetails(details);
              setLoadingDetails(false);
              return;
            }
          }
          // Fallback: fetch from event seats using seatId from state
          const seats = await fetchEventSeats(retreat.id);
          const seat = seats.find(s => s.id === seatAssignment.seatId);
          if (seat) {
            setSeatDetails(seat);
          }
        }
      } catch (error) {
        console.error('Error fetching assignment details:', error);
      } finally {
        setLoadingDetails(false);
      }
    };

    if (retreat) {
      fetchAssignmentDetails();
    }
  }, [retreat, bookingId, ticketType, bedAssignment, seatAssignment]);

  // Convert affiliate referral when booking is confirmed
  useEffect(() => {
    const handleAffiliateConversion = async () => {
      if (!bookingId || !retreat) return;

      const affiliateData = getCurrentAffiliate();
      if (!affiliateData) return;

      try {
        // Find the referral for this user
        const { data: referrals, error: referralError } = await supabase
          .from('affiliate_referrals')
          .select('id')
          .eq('affiliate_id', affiliateData.affiliateId)
          .eq('campaign_id', affiliateData.campaignId)
          .eq('referral_type', 'student')
          .eq('converted', false)
          .order('created_at', { ascending: false })
          .limit(1);

        if (referralError || !referrals || referrals.length === 0) {
          return; // No referral found
        }

        const referralId = referrals[0].id;
        const transactionAmount = retreat.price || 0;
        const platformFee = transactionAmount * instructorFeeRate;

        await convertReferral(
          referralId,
          'booking',
          bookingId,
          transactionAmount,
          platformFee
        );

        // Create passive commission for organizer referrals when booking is completed
        // Find organizer referral for this retreat's instructor
        if (retreat?.instructor_id) {
          const { data: organizerReferrals } = await supabase
            .from('affiliate_referrals')
            .select('id')
            .eq('referred_user_id', retreat.instructor_id)
            .eq('referral_type', 'organizer')
            .eq('converted', true);

          if (organizerReferrals && organizerReferrals.length > 0) {
            // Create passive commission for each organizer referral
            for (const referral of organizerReferrals) {
              await createPassiveCommission(
                retreat.instructor_id,
                'booking_completed',
                transactionAmount,
                platformFee,
                bookingId
              );
            }
          }
        }
      } catch (error) {
        console.error('Error converting affiliate referral:', error);
        // Don't show error to user
      }
    };

    handleAffiliateConversion();
  }, [bookingId, retreat, instructorFeeRate]);

  const email = booking?.email ?? "";

  const handleAddToCalendar = () => {
    const info = {
      title: retreat?.title ?? "Retreat",
      description: retreat?.description ?? "",
      location: retreat?.location ?? "",
      dateRange: retreat?.date,
      email,
    };

    // Trigger ICS download
    try {
      calendar.downloadICS(info);
    } catch (e) {
      // ignore
    }

    // Open Google Calendar in a new tab with prefilled event
    const url = createGoogleCalendarUrl(info);
    window.open(url, "_blank");
  };

  return (
    <div className="min-h-screen bg-gradient-hero pb-20 flex items-start justify-center pt-10">
      <div className="w-full max-w-2xl px-6">
        <div className="text-center mb-6">
          <div className="mx-auto w-24 h-24 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white text-3xl">✓</div>
          <h1 className="text-2xl font-bold mt-6">
            {paymentMethod === 'manual' ? 'Registration Submitted!' : "You're All Set!"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {paymentMethod === 'manual' 
              ? 'Your registration is pending organizer approval'
              : `Your spot has been reserved for ${retreat?.title}`}
          </p>
        </div>

        {/* 48-Hour Warning for Manual Payments */}
        {paymentMethod === 'manual' && (
          <Alert className="mb-6 border-orange-200 bg-orange-50">
            <AlertCircle className="h-5 w-5 text-orange-600" />
            <AlertTitle className="text-orange-800 font-semibold">Payment Required Within 48 Hours</AlertTitle>
            <AlertDescription className="text-orange-700 mt-2">
              <p className="mb-2">
                Your registration has been submitted and is pending organizer approval.
              </p>
              <p className="mb-2">
                <strong>⚠️ IMPORTANT:</strong> You must submit your payment to the organizer within <strong>48 hours</strong>, or your registration will be automatically cancelled.
              </p>
              <p className="mb-3">
                Please contact the organizer directly to arrange payment. Once the organizer receives your payment and approves your registration, you will receive a confirmation email.
              </p>
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <img src={retreat?.image} alt={retreat?.title} className="w-20 h-16 rounded-md object-cover" />
              <div>
                <p className="font-semibold text-card-foreground">{retreat?.title}</p>
                <p className="text-sm text-muted-foreground">{retreat?.date}</p>
              </div>
            </div>

            {/* Bed/Room Confirmation */}
            {ticketType === 'STAY' && (bedDetails || bedAssignment) && (
              <div className="mt-4 border-t border-border pt-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-card-foreground mb-2">Bed/Room Confirmation</p>
                    {bedDetails ? (
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
                    ) : (
                      <p className="text-sm text-muted-foreground">Bed assignment confirmed</p>
                    )}
                  </div>
                  {retreat?.id && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/retreat/${retreat.id}/booking`, { 
                        state: { 
                          retreat,
                          booking,
                          modifySelection: true 
                        } 
                      })}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Modify
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Seat Confirmation */}
            {ticketType === 'SEAT_ONLY' && (seatDetails || seatAssignment) && (
              <div className="mt-4 border-t border-border pt-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-card-foreground mb-2">Seat Confirmation</p>
                    {seatDetails ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Seat:</span>
                          <span className="text-sm font-medium text-card-foreground">
                            Row {seatDetails.row}, Seat {seatDetails.col} (Seat #{seatDetails.seat_index})
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Seat assignment confirmed</p>
                    )}
                  </div>
                  {retreat?.id && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/retreat/${retreat.id}/booking`, { 
                        state: { 
                          retreat,
                          booking,
                          modifySelection: true 
                        } 
                      })}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Modify
                    </Button>
                  )}
                </div>
              </div>
            )}

            <div className="mt-4 border-t border-border pt-4 text-muted-foreground">
              <p>Confirmation sent to: <span className="text-card-foreground">{email || "(no email provided)"}</span></p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 space-y-3">
          <Button className="w-full h-12 text-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white" onClick={handleAddToCalendar}>
            Add to Calendar
          </Button>

          <Button variant="outline" className="w-full h-12" onClick={() => navigate('/home')}>Back to Home</Button>
        </div>
      </div>
    </div>
  );
};

export default Confirmation;
