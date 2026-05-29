import { useState, useEffect } from 'react';

import { useGetVenueRoomsQuery } from '@/services/server';

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

  const { data: roomsData, isLoading, isError } = useGetVenueRoomsQuery(venueId ?? '', {

    skip: !venueId,

  });



  const [status, setStatus] = useState<VenueCompletenessStatus>({

    isComplete: false,

    validation: null,

    loading: true,

  });



  useEffect(() => {

    if (!venueId) {

      setStatus({ isComplete: false, validation: null, loading: false });

      return;

    }



    if (isLoading) {

      setStatus((prev) => ({ ...prev, loading: true }));

      return;

    }



    if (isError || !roomsData) {

      setStatus({

        isComplete: false,

        validation: null,

        loading: false,

      });

      return;

    }



    if (!roomsData.length) {

      setStatus({

        isComplete: false,

        validation: {

          isValid: false,

          missingFields: ['At least one room is required'],

          rooms: [],

        },

        loading: false,

      });

      return;

    }



    const rooms: VenueRoom[] = roomsData.map((room) => {

      const beds = (room.beds as Record<string, unknown>[] | undefined) ?? [];

      return {

        id: String(room.id),

        name: String(room.name ?? ''),

        image_url: (room.imageUrl as string | undefined) ?? undefined,

        description: String(room.description ?? ''),

        bed_count: Number(room.bedCount ?? beds.length),

        beds: beds.map((bed) => ({

          id: String(bed.id),

          title: String(bed.title ?? bed.label ?? ''),

          image_url: (bed.imageUrl as string | undefined) ?? undefined,

          sort_order: bed.sortOrder as number | undefined,

        })),

      };

    });



    const validation = validateVenueRooms(rooms);



    setStatus({

      isComplete: validation.isValid,

      validation,

      loading: false,

    });

  }, [venueId, roomsData, isLoading, isError]);



  return status;

}


