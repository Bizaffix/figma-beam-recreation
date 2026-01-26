import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { validateVenueRooms, type VenueRoom, type VenueValidationResult } from '@/lib/venue-validation';

export interface VenueCompletenessStatus {
  isComplete: boolean;
  validation: VenueValidationResult | null;
  loading: boolean;
}

/**
 * Hook to check if a venue has all required room/bed details
 */
export function useVenueCompleteness(venueId: string | null): VenueCompletenessStatus {
  const [status, setStatus] = useState<VenueCompletenessStatus>({
    isComplete: false,
    validation: null,
    loading: true
  });

  useEffect(() => {
    if (!venueId) {
      setStatus({ isComplete: false, validation: null, loading: false });
      return;
    }

    const checkCompleteness = async () => {
      try {
        // Fetch rooms
        const { data: roomsData, error: roomsError } = await supabase
          .from('venue_rooms')
          .select('*')
          .eq('venue_id', venueId)
          .order('sort_order', { ascending: true });

        if (roomsError) throw roomsError;

        if (!roomsData || roomsData.length === 0) {
          setStatus({
            isComplete: false,
            validation: {
              isValid: false,
              missingFields: ['At least one room is required'],
              rooms: []
            },
            loading: false
          });
          return;
        }

        // Fetch beds
        const roomIds = roomsData.map(r => r.id);
        const { data: bedsData, error: bedsError } = await supabase
          .from('venue_beds')
          .select('*')
          .in('room_id', roomIds)
          .order('sort_order', { ascending: true });

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

        setStatus({
          isComplete: validation.isValid,
          validation,
          loading: false
        });
      } catch (error: any) {
        console.error('Error checking venue completeness:', error);
        setStatus({
          isComplete: false,
          validation: null,
          loading: false
        });
      }
    };

    checkCompleteness();
  }, [venueId]);

  return status;
}
