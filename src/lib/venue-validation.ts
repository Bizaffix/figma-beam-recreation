// Venue validation utilities for room/bed requirements

export interface VenueRoom {
  id?: string;
  name: string;
  image_url?: string;
  description: string;
  bed_count: number;
  beds?: VenueBed[];
}

export interface VenueBed {
  id?: string;
  title: string;
  image_url?: string;
  sort_order?: number;
}

export interface VenueValidationResult {
  isValid: boolean;
  missingFields: string[];
  rooms: RoomValidationResult[];
}

export interface RoomValidationResult {
  roomId?: string;
  roomName: string;
  isValid: boolean;
  missingFields: string[];
  beds: BedValidationResult[];
}

export interface BedValidationResult {
  bedId?: string;
  bedTitle: string;
  isValid: boolean;
  missingFields: string[];
}

/**
 * Validates venue room requirements
 * Each room requires: name, image_url, description, bed_count
 * If bed_count > 1, each bed requires: title, image_url
 */
export function validateVenueRooms(rooms: VenueRoom[]): VenueValidationResult {
  const missingFields: string[] = [];
  const roomResults: RoomValidationResult[] = [];

  if (!rooms || rooms.length === 0) {
    return {
      isValid: false,
      missingFields: ['At least one room is required'],
      rooms: []
    };
  }

  let allValid = true;

  for (const room of rooms) {
    const roomMissing: string[] = [];
    const bedResults: BedValidationResult[] = [];

    // Validate room fields
    if (!room.name || room.name.trim() === '') {
      roomMissing.push('Room name');
    }
    if (!room.image_url || room.image_url.trim() === '') {
      roomMissing.push('Room image');
    }
    if (!room.description || room.description.trim() === '') {
      roomMissing.push('Room description');
    }
    if (!room.bed_count || room.bed_count < 1) {
      roomMissing.push('Bed count (must be at least 1)');
    }

    // Validate beds if bed_count > 1
    if (room.bed_count > 1) {
      if (!room.beds || room.beds.length === 0) {
        roomMissing.push(`Bed details (${room.bed_count} beds required)`);
      } else if (room.beds.length !== room.bed_count) {
        roomMissing.push(`Bed count mismatch (expected ${room.bed_count}, found ${room.beds.length})`);
      } else {
        // Validate each bed
        for (const bed of room.beds) {
          const bedMissing: string[] = [];
          
          if (!bed.title || bed.title.trim() === '') {
            bedMissing.push('Bed title');
          }
          if (!bed.image_url || bed.image_url.trim() === '') {
            bedMissing.push('Bed image');
          }

          bedResults.push({
            bedId: bed.id,
            bedTitle: bed.title || 'Unnamed bed',
            isValid: bedMissing.length === 0,
            missingFields: bedMissing
          });

          if (bedMissing.length > 0) {
            allValid = false;
          }
        }
      }
    } else if (room.bed_count === 1) {
      // Single bed room - no bed records needed, but validate room itself
      bedResults.push({
        bedTitle: 'Single Bed',
        isValid: roomMissing.length === 0,
        missingFields: []
      });
    }

    roomResults.push({
      roomId: room.id,
      roomName: room.name || 'Unnamed room',
      isValid: roomMissing.length === 0,
      missingFields: roomMissing,
      beds: bedResults
    });

    if (roomMissing.length > 0) {
      allValid = false;
      missingFields.push(...roomMissing.map(field => `${room.name || 'Unnamed room'}: ${field}`));
    }
  }

  return {
    isValid: allValid,
    missingFields,
    rooms: roomResults
  };
}

/**
 * Checks if a venue has all required room/bed details
 */
export function isVenueComplete(rooms: VenueRoom[]): boolean {
  const validation = validateVenueRooms(rooms);
  return validation.isValid;
}

/**
 * Gets a summary of missing fields for display
 */
export function getMissingFieldsSummary(validation: VenueValidationResult): string {
  if (validation.isValid) {
    return '';
  }

  const summaries: string[] = [];
  
  for (const room of validation.rooms) {
    if (!room.isValid) {
      summaries.push(`${room.roomName}: ${room.missingFields.join(', ')}`);
    }
    for (const bed of room.beds) {
      if (!bed.isValid) {
        summaries.push(`${room.roomName} - ${bed.bedTitle}: ${bed.missingFields.join(', ')}`);
      }
    }
  }

  return summaries.join('; ');
}
