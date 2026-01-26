// Venue notification utilities for missing required details

import { supabase } from './supabase';
import { sendCustomEmail } from './email-notifications';
import { validateVenueRooms, type VenueRoom } from './venue-validation';

/**
 * Check all published venues and send notifications for incomplete ones
 */
export async function checkAndNotifyIncompleteVenues(): Promise<void> {
  try {
    // Fetch all published/verified venues
    const { data: venues, error } = await supabase
      .from('properties')
      .select('id, property_name, owner_id, status')
      .in('status', ['published', 'verified']);

    if (error) throw error;

    if (!venues || venues.length === 0) {
      return;
    }

    // Check each venue for completeness
    for (const venue of venues) {
      const isComplete = await checkVenueCompleteness(venue.id);
      
      if (!isComplete) {
        // Send notification email to venue owner
        await sendVenueDetailsRequiredEmail(venue.id, venue.property_name, venue.owner_id);
      }
    }
  } catch (error) {
    console.error('Error checking and notifying incomplete venues:', error);
  }
}

/**
 * Check if a specific venue has all required room/bed details
 */
export async function checkVenueCompleteness(venueId: string): Promise<boolean> {
  try {
    // Fetch rooms
    const { data: roomsData, error: roomsError } = await supabase
      .from('venue_rooms')
      .select('*')
      .eq('venue_id', venueId);

    if (roomsError) throw roomsError;

    if (!roomsData || roomsData.length === 0) {
      return false;
    }

    // Fetch beds
    const roomIds = roomsData.map(r => r.id);
    const { data: bedsData, error: bedsError } = await supabase
      .from('venue_beds')
      .select('*')
      .in('room_id', roomIds);

    if (bedsError) throw bedsError;

    // Transform to VenueRoom format
    const rooms: VenueRoom[] = roomsData.map(room => ({
      id: room.id,
      name: room.name,
      image_url: room.image_url || undefined,
      description: room.description || '',
      bed_count: room.bed_count,
      beds: (bedsData || []).filter(bed => bed.room_id === room.id)
    }));

    // Validate
    const validation = validateVenueRooms(rooms);
    return validation.isValid;
  } catch (error) {
    console.error('Error checking venue completeness:', error);
    return false;
  }
}

/**
 * Send email notification to venue owner about missing required details
 */
async function sendVenueDetailsRequiredEmail(
  venueId: string,
  venueName: string,
  ownerId: string
): Promise<void> {
  try {
    // Fetch owner profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', ownerId)
      .single();

    if (profileError || !profile) {
      console.error('Error fetching owner profile:', profileError);
      return;
    }

    const editUrl = `${window.location.origin}/location-owner/properties/${venueId}/edit`;

    const emailSubject = 'Notice: Venue Details Required to complete profile';
    const emailMessage = `
Hello ${profile.full_name || 'Venue Owner'},

To make booking an individual bed a more friendly, transparent process, we've added Room and Bed details to Venue listings.

Your venue "${venueName}" is missing some required information. Please complete the room and bed details to enable the full booking experience for your guests.

Update your venue listing: ${editUrl}

Required information:
- Room name, image, and description
- Number of beds per room
- For rooms with multiple beds: bed titles and images

Thank you,
Book My Quilt Retreat Team
    `.trim();

    await sendCustomEmail({
      emails: [profile.email],
      subject: emailSubject,
      message: emailMessage,
      recipientType: 'organizers' // Using organizers type for venue owners
    });
  } catch (error) {
    console.error('Error sending venue details required email:', error);
  }
}
