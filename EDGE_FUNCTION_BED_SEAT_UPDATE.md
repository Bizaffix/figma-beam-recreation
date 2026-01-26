import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
})

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const { paymentIntentId, retreatId, bookingDetails, userId } = await req.json()

    if (!userId) {
      throw new Error("User ID is required")
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    if (paymentIntent.status !== "succeeded") {
      throw new Error("Payment not completed")
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    )

    // Create booking with ticket_type
    const { data: booking, error } = await supabase
      .from("bookings")
      .insert({
        retreat_id: retreatId,
        user_id: userId,
        payment_intent_id: paymentIntentId,
        full_name: bookingDetails.fullName,
        email: bookingDetails.email,
        skill_level: bookingDetails.skillLevel,
        amount: paymentIntent.amount / 100,
        status: "confirmed",
        ticket_type: bookingDetails.ticket_type || null,
      })
      .select()
      .single()

    if (error) {
      console.error("Database error:", error)
      throw new Error(`Database error: ${error.message}`)
    }

    // Decrement spots
    const { error: updateError } = await supabase.rpc("decrement_spots", {
      retreat_id: retreatId,
    })

    if (updateError) {
      console.error("Error decrementing spots:", updateError)
    }

    // Handle bed assignment for STAY tickets
    if (booking && bookingDetails.ticket_type === 'STAY' && bookingDetails.bed_assignment) {
      const bedId = bookingDetails.bed_assignment.bedId || bookingDetails.bed_assignment.event_bed_id;
      
      if (bedId) {
        try {
          // Mark bed as booked
          const { error: bedError } = await supabase
            .from('event_beds')
            .update({
              status: 'BOOKED',
              held_until: null
            })
            .eq('id', bedId)
            .in('status', ['HELD', 'AVAILABLE']); // Update if held or available

          if (bedError) {
            console.error("Error updating bed status:", bedError);
            // Continue - might already be booked, but we'll try to create assignment anyway
          }

          // Create bed assignment
          const { error: assignmentError } = await supabase
            .from('bed_assignments')
            .insert({
              booking_id: booking.id,
              event_bed_id: bedId
            });

          if (assignmentError) {
            // Check for unique constraint violation (double booking)
            if (assignmentError.code === '23505') {
              console.error("Bed already assigned:", assignmentError);
              // Don't throw - booking is already created, just log the error
            } else {
              console.error("Error creating bed assignment:", assignmentError);
              // Log but don't fail the booking
            }
          }
        } catch (assignmentErr) {
          console.error("Error in bed assignment process:", assignmentErr);
          // Don't throw - booking is already created
        }
      }
    }

    // Handle seat assignment for SEAT_ONLY tickets
    if (booking && bookingDetails.ticket_type === 'SEAT_ONLY' && bookingDetails.seat_assignment) {
      const seatId = bookingDetails.seat_assignment.seatId || bookingDetails.seat_assignment.event_seat_id;
      
      if (seatId) {
        try {
          // Mark seat as booked
          const { error: seatError } = await supabase
            .from('event_seats')
            .update({
              status: 'BOOKED',
              held_until: null
            })
            .eq('id', seatId)
            .in('status', ['HELD', 'AVAILABLE']); // Update if held or available

          if (seatError) {
            console.error("Error updating seat status:", seatError);
            // Continue - might already be booked, but we'll try to create assignment anyway
          }

          // Create seat assignment
          const { error: assignmentError } = await supabase
            .from('seat_assignments')
            .insert({
              booking_id: booking.id,
              event_seat_id: seatId
            });

          if (assignmentError) {
            // Check for unique constraint violation (double booking)
            if (assignmentError.code === '23505') {
              console.error("Seat already assigned:", assignmentError);
              // Don't throw - booking is already created, just log the error
            } else {
              console.error("Error creating seat assignment:", assignmentError);
              // Log but don't fail the booking
            }
          }
        } catch (assignmentErr) {
          console.error("Error in seat assignment process:", assignmentErr);
          // Don't throw - booking is already created
        }
      }
    }

    return new Response(
      JSON.stringify({ bookingId: booking.id, success: true }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    )
  } catch (error) {
    console.error("Error:", error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    )
  }
})
