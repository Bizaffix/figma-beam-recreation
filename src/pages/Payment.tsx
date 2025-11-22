import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { useStripe, useElements, CardElement } from "@stripe/react-stripe-js";
import { createPaymentIntent, confirmPayment } from "@/lib/stripe-payment";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface RetreatData {
  id: number;
  title: string;
  location: string;
  date: string;
  price: number;
  image: string;
}

const Payment = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const stripe = useStripe();
  const elements = useElements();
  
  const [retreat, setRetreat] = useState<RetreatData | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const bookingFromState = (location.state as any)?.booking;

  // Stripe Card Element error state
  const [cardError, setCardError] = useState<string>("");

  // Fetch retreat and create payment intent
  useEffect(() => {
    const retreatFromState = (location.state as any)?.retreat;
    
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
        // Create payment intent
        const { clientSecret: secret, error } = await createPaymentIntent(
          retreatData.id,
          retreatData.price,
          bookingFromState
        );

        if (error) {
          toast({
            title: "Error",
            description: error,
            variant: "destructive",
          });
        } else if (secret) {
          setClientSecret(secret);
        }
      } catch (error: any) {
        console.error('Error initializing payment:', error);
        toast({
          title: "Error",
          description: "Failed to initialize payment",
          variant: "destructive",
        });
      }
    };
    
    if (retreatFromState) {
      setRetreat(retreatFromState);
      setLoading(false);
      initializePayment(retreatFromState);
    } else if (id) {
      // Fetch from Supabase
      const fetchRetreat = async () => {
        try {
          const { data, error } = await supabase
            .from('retreats')
            .select('id, title, location, date, price, image')
            .eq('id', Number(id))
            .eq('published', true)
            .single();

          if (error) {
            console.error('Error fetching retreat:', error);
            toast({
              title: "Error",
              description: "Failed to load retreat details",
              variant: "destructive",
            });
          } else if (data) {
            setRetreat(data);
            await initializePayment(data);
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
  }, [id, location.state, bookingFromState, user, toast]);

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
        // Confirm payment and create booking in database
        const { success, bookingId, error: confirmError } = await confirmPayment(
          paymentIntent.id,
          retreat.id,
          bookingFromState,
          user?.id
        );

        if (success) {
          toast({
            title: "Payment Successful",
            description: "Your booking has been confirmed!",
          });
          
          // Navigate to confirmation page
          navigate(`/retreat/${id}/confirmed`, {
            state: {
              retreat,
              booking: bookingFromState,
              paymentIntent: paymentIntent.id,
              bookingId,
            },
          });
        } else {
          console.error('Booking creation failed:', confirmError);
          toast({
            title: "Error",
            description: confirmError || "Payment succeeded but booking creation failed. Please contact support.",
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
          <Button onClick={() => navigate("/")}>Back to Retreats</Button>
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
                <p className="text-base sm:text-lg font-bold text-primary">${retreat.price}</p>
              </div>
            </div>
          </CardContent>
        </Card>

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
              <div className="flex items-center justify-between text-sm sm:text-base text-muted-foreground">
                <span>Retreat price</span>
                <span>${retreat.price}</span>
              </div>
              <div className="flex items-center justify-between text-base sm:text-lg font-semibold text-card-foreground">
                <span>Total</span>
                <span className="text-primary">${retreat.price}</span>
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
