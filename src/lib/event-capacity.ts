// Event capacity management utilities

import { supabase } from './supabase';

export interface EventBed {
  id: string;
  event_id: number;
  event_room_id: string;
  source_bed_id?: string;
  title: string;
  image_url?: string;
  status: 'AVAILABLE' | 'BOOKED' | 'HELD';
  held_until?: string;
  sort_order?: number;
}

export interface EventSeat {
  id: string;
  event_id: number;
  seat_index: number;
  row: number;
  col: number;
  status: 'AVAILABLE' | 'BOOKED' | 'HELD';
  held_until?: string;
}

export interface EventRoom {
  id: string;
  event_id: number;
  source_room_id: string;
  name: string;
  image_url?: string;
  description?: string;
  bed_count: number;
  sort_order?: number;
  beds?: EventBed[];
}

/**
 * Create event venue snapshot (copy rooms/beds from venue to event)
 */
export async function createEventVenueSnapshot(
  eventId: number,
  venueId: string
): Promise<{ success: boolean; error?: string; snapshotId?: string }> {
  try {
    const { data, error } = await supabase.rpc('create_event_venue_snapshot', {
      p_event_id: eventId,
      p_venue_id: venueId
    });

    if (error) throw error;

    return { success: true, snapshotId: data };
  } catch (error: any) {
    console.error('Error creating event venue snapshot:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Create event seats grid
 */
export async function createEventSeatsGrid(
  eventId: number,
  seatCapacity: number,
  rows: number = 10,
  cols: number = 10
): Promise<{ success: boolean; error?: string; seatCount?: number }> {
  try {
    const { data, error } = await supabase.rpc('create_event_seats_grid', {
      p_event_id: eventId,
      p_seat_capacity: seatCapacity,
      p_rows: rows,
      p_cols: cols
    });

    if (error) throw error;

    return { success: true, seatCount: data };
  } catch (error: any) {
    console.error('Error creating event seats grid:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Fetch event rooms with beds
 */
export async function fetchEventRooms(eventId: number): Promise<EventRoom[]> {
  try {
    // Fetch rooms
    const { data: rooms, error: roomsError } = await supabase
      .from('event_rooms')
      .select('*')
      .eq('event_id', eventId)
      .order('sort_order', { ascending: true });

    if (roomsError) throw roomsError;

    if (!rooms || rooms.length === 0) {
      return [];
    }

    // Fetch beds for each room
    const { data: beds, error: bedsError } = await supabase
      .from('event_beds')
      .select('*')
      .eq('event_id', eventId)
      .order('sort_order', { ascending: true });

    if (bedsError) throw bedsError;

    // Group beds by room
    const roomsWithBeds: EventRoom[] = rooms.map(room => ({
      ...room,
      beds: (beds || []).filter(bed => bed.event_room_id === room.id)
    }));

    return roomsWithBeds;
  } catch (error: any) {
    console.error('Error fetching event rooms:', error);
    return [];
  }
}

/**
 * Fetch event seats
 */
export async function fetchEventSeats(eventId: number): Promise<EventSeat[]> {
  try {
    const { data, error } = await supabase
      .from('event_seats')
      .select('*')
      .eq('event_id', eventId)
      .order('row', { ascending: true })
      .order('col', { ascending: true });

    if (error) throw error;

    return data || [];
  } catch (error: any) {
    console.error('Error fetching event seats:', error);
    return [];
  }
}

/**
 * Hold a bed for booking (15 minute expiration)
 */
export async function holdBed(
  eventBedId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const heldUntil = new Date();
    heldUntil.setMinutes(heldUntil.getMinutes() + 15);

    const { error } = await supabase
      .from('event_beds')
      .update({
        status: 'HELD',
        held_until: heldUntil.toISOString()
      })
      .eq('id', eventBedId)
      .eq('status', 'AVAILABLE'); // Only hold if still available

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('Error holding bed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Hold a seat for booking (15 minute expiration)
 */
export async function holdSeat(
  eventSeatId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const heldUntil = new Date();
    heldUntil.setMinutes(heldUntil.getMinutes() + 15);

    const { error } = await supabase
      .from('event_seats')
      .update({
        status: 'HELD',
        held_until: heldUntil.toISOString()
      })
      .eq('id', eventSeatId)
      .eq('status', 'AVAILABLE'); // Only hold if still available

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('Error holding seat:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get attendee profile for booked bed/seat
 */
export async function getAttendeeProfileForBed(eventBedId: string) {
  try {
    const { data, error } = await supabase
      .from('bed_assignments')
      .select(`
        booking:bookings!inner(
          user_id,
          full_name,
          profile:profiles!bookings_user_id_fkey(
            id,
            full_name,
            avatar_url,
            bio
          )
        )
      `)
      .eq('event_bed_id', eventBedId)
      .single();

    if (error) throw error;

    return data?.booking?.profile || null;
  } catch (error: any) {
    console.error('Error fetching attendee profile for bed:', error);
    return null;
  }
}

export async function getAttendeeProfileForSeat(eventSeatId: string) {
  try {
    const { data, error } = await supabase
      .from('seat_assignments')
      .select(`
        booking:bookings!inner(
          user_id,
          full_name,
          profile:profiles!bookings_user_id_fkey(
            id,
            full_name,
            avatar_url,
            bio
          )
        )
      `)
      .eq('event_seat_id', eventSeatId)
      .single();

    if (error) throw error;

    return data?.booking?.profile || null;
  } catch (error: any) {
    console.error('Error fetching attendee profile for seat:', error);
    return null;
  }
}

/**
 * Expire held inventory (call this periodically or on page load)
 */
export async function expireHeldInventory(): Promise<void> {
  try {
    await supabase.rpc('expire_held_inventory');
  } catch (error) {
    console.error('Error expiring held inventory:', error);
  }
}

/**
 * Get bed details from assignment (for confirmation page)
 */
export async function getBedDetailsFromAssignment(bookingId: string): Promise<{
  bed: EventBed | null;
  room: EventRoom | null;
} | null> {
  try {
    const { data: assignment, error: assignmentError } = await supabase
      .from('bed_assignments')
      .select(`
        event_bed_id,
        bed:event_beds!inner(
          id,
          event_id,
          event_room_id,
          title,
          image_url,
          status
        )
      `)
      .eq('booking_id', bookingId)
      .single();

    if (assignmentError || !assignment?.bed) {
      return null;
    }

    const bed = assignment.bed as EventBed;

    // Fetch room details
    const { data: room, error: roomError } = await supabase
      .from('event_rooms')
      .select('*')
      .eq('id', bed.event_room_id)
      .single();

    if (roomError || !room) {
      return { bed, room: null };
    }

    return {
      bed,
      room: room as EventRoom
    };
  } catch (error: any) {
    console.error('Error fetching bed details from assignment:', error);
    return null;
  }
}

/**
 * Get seat details from assignment (for confirmation page)
 */
export async function getSeatDetailsFromAssignment(bookingId: string): Promise<EventSeat | null> {
  try {
    const { data: assignment, error: assignmentError } = await supabase
      .from('seat_assignments')
      .select(`
        event_seat_id,
        seat:event_seats!inner(
          id,
          event_id,
          seat_index,
          row,
          col,
          status
        )
      `)
      .eq('booking_id', bookingId)
      .single();

    if (assignmentError || !assignment?.seat) {
      return null;
    }

    return assignment.seat as EventSeat;
  } catch (error: any) {
    console.error('Error fetching seat details from assignment:', error);
    return null;
  }
}
