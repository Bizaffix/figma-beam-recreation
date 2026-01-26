// Helper functions for creating bed/seat assignments when booking is created

import { supabase } from './supabase';

/**
 * Create bed assignment for a booking
 */
export async function createBedAssignment(
  bookingId: string,
  eventBedId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // First, mark the bed as booked
    const { error: bedError } = await supabase
      .from('event_beds')
      .update({
        status: 'BOOKED',
        held_until: null
      })
      .eq('id', eventBedId)
      .eq('status', 'HELD'); // Only update if currently held

    if (bedError) {
      console.error('Error updating bed status:', bedError);
      // Continue anyway - might already be booked
    }

    // Create bed assignment
    const { error: assignmentError } = await supabase
      .from('bed_assignments')
      .insert({
        booking_id: bookingId,
        event_bed_id: eventBedId
      });

    if (assignmentError) {
      // Check if it's a unique constraint violation (double booking)
      if (assignmentError.code === '23505') {
        return {
          success: false,
          error: 'This bed has already been booked. Please select another bed.'
        };
      }
      throw assignmentError;
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error creating bed assignment:', error);
    return {
      success: false,
      error: error.message || 'Failed to assign bed'
    };
  }
}

/**
 * Create seat assignment for a booking
 */
export async function createSeatAssignment(
  bookingId: string,
  eventSeatId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // First, mark the seat as booked
    const { error: seatError } = await supabase
      .from('event_seats')
      .update({
        status: 'BOOKED',
        held_until: null
      })
      .eq('id', eventSeatId)
      .eq('status', 'HELD'); // Only update if currently held

    if (seatError) {
      console.error('Error updating seat status:', seatError);
      // Continue anyway - might already be booked
    }

    // Create seat assignment
    const { error: assignmentError } = await supabase
      .from('seat_assignments')
      .insert({
        booking_id: bookingId,
        event_seat_id: eventSeatId
      });

    if (assignmentError) {
      // Check if it's a unique constraint violation (double booking)
      if (assignmentError.code === '23505') {
        return {
          success: false,
          error: 'This seat has already been booked. Please select another seat.'
        };
      }
      throw assignmentError;
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error creating seat assignment:', error);
    return {
      success: false,
      error: error.message || 'Failed to assign seat'
    };
  }
}
