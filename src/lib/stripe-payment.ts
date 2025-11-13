import { supabase } from './supabase';

/**
 * Create a payment intent for a retreat booking
 * This function should call your backend API or Supabase Edge Function
 * to create a Stripe Payment Intent
 */
export const createPaymentIntent = async (
  retreatId: number,
  amount: number,
  bookingDetails: {
    fullName: string;
    email: string;
    skillLevel: string;
  }
) => {
  try {
    // Option 1: Using Supabase Edge Function
    // Replace 'create-payment-intent' with your actual Edge Function name
    const { data, error } = await supabase.functions.invoke('create-payment-intent', {
      body: {
        retreatId,
        amount: Math.round(amount * 100), // Convert to cents
        bookingDetails,
      },
    });

    if (error) {
      throw error;
    }

    return { clientSecret: data.clientSecret, error: null };
  } catch (error: any) {
    console.error('Error creating payment intent:', error);
    return { clientSecret: null, error: error.message || 'Failed to create payment intent' };
  }
};

/**
 * Confirm payment and create booking
 * This function should call your backend API or Supabase Edge Function
 * to confirm the payment and save the booking
 */
export const confirmPayment = async (
  paymentIntentId: string,
  retreatId: number,
  bookingDetails: {
    fullName: string;
    email: string;
    skillLevel: string;
  },
  userId?: string
) => {
  try {
    console.log('Calling confirm-payment with:', { paymentIntentId, retreatId, userId });
    
    const { data, error } = await supabase.functions.invoke('confirm-payment', {
      body: {
        paymentIntentId,
        retreatId,
        bookingDetails,
        userId,
      },
    });

    if (error) {
      console.error('Edge Function error:', error);
      console.error('Error context:', error.context);
      
      // Try to get the actual error message from the response
      let errorMessage = 'Failed to confirm payment';
      
      // Check if there's a response body with error details
      if (error.context?.body) {
        try {
          const body = typeof error.context.body === 'string' 
            ? JSON.parse(error.context.body) 
            : error.context.body;
          errorMessage = body.error || body.message || errorMessage;
          console.error('Error from Edge Function:', errorMessage);
        } catch (e) {
          console.error('Could not parse error body:', error.context.body);
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }

    console.log('Edge Function response:', data);

    if (!data || !data.bookingId) {
      throw new Error('Invalid response from server - no booking ID returned');
    }

    return { success: true, bookingId: data.bookingId, error: null };
  } catch (error: any) {
    console.error('Error confirming payment:', error);
    const errorMessage = error.message || 'Failed to confirm payment. Check Edge Function logs for details.';
    return { success: false, bookingId: null, error: errorMessage };
  }
};

