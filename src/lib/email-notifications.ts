import { supabase } from './supabase';

interface RetreatEmailData {
  id: number;
  title: string;
  description: string;
  image: string;
  date: string;
  location: string;
  price: number;
  instructor_id: string;
}

/**
 * Sends email notifications to all students when a new retreat is published
 * Uses the same pattern as existing edge functions (create-payment-intent, confirm-payment)
 */
export const notifyStudentsAboutNewRetreat = async (retreatData: RetreatEmailData): Promise<{ error?: any }> => {
  try {
    console.log('Calling notify-new-retreat with:', { retreatId: retreatData.id, title: retreatData.title });
    
    // Call the Supabase Edge Function to send emails (same pattern as stripe-payment.ts)
    const { data, error } = await supabase.functions.invoke('notify-new-retreat', {
      body: {
        retreatId: retreatData.id,
        title: retreatData.title,
        description: retreatData.description,
        image: retreatData.image,
        date: retreatData.date,
        location: retreatData.location,
        price: retreatData.price,
        instructorId: retreatData.instructor_id,
      },
    });

    if (error) {
      console.error('Edge Function error:', error);
      console.error('Error context:', error.context);
      
      // Try to get the actual error message from the response (same pattern as confirmPayment)
      let errorMessage = 'Failed to send email notifications';
      
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
      
      return { error: errorMessage };
    }

    console.log('Edge Function response:', data);
    return {};
  } catch (error: any) {
    console.error('Unexpected error sending email notifications:', error);
    const errorMessage = error.message || 'Failed to send email notifications. Check Edge Function logs for details.';
    return { error: errorMessage };
  }
};

