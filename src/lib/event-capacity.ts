import { runApiEndpoint } from "@/redux/apiDispatch";
import { retreatApi } from "@/services/server/retreat/api";
import { bookingApi } from "@/services/server/booking/api";

export interface EventBed {
  id: string;
  event_id: number | string;
  event_room_id: string;
  source_bed_id?: string;
  title: string;
  image_url?: string;
  status: "AVAILABLE" | "BOOKED" | "HELD";
  held_until?: string;
  sort_order?: number;
}

export interface EventSeat {
  id: string;
  event_id: number | string;
  seat_index: number;
  row: number;
  col: number;
  status: "AVAILABLE" | "BOOKED" | "HELD";
  held_until?: string;
}

export interface EventRoom {
  id: string;
  event_id: number | string;
  source_room_id: string;
  name: string;
  image_url?: string;
  description?: string;
  bed_count: number;
  sort_order?: number;
  beds?: EventBed[];
}

type BackendBed = {
  id: string;
  roomId: string;
  title: string;
  imageUrl?: string | null;
  status?: string;
  sortOrder?: number;
};

type BackendRoom = {
  id: string;
  retreatId?: string | null;
  sourceRoomId?: string | null;
  name: string;
  imageUrl?: string | null;
  description?: string | null;
  bedCount?: number;
  sortOrder?: number;
  beds?: BackendBed[];
};

type BackendSeat = {
  id: string;
  retreatId?: string;
  seatIndex: number;
  row: number;
  col: number;
  status?: string;
};

const mapBed = (bed: BackendBed, eventId: number | string, roomId: string): EventBed => ({
  id: bed.id,
  event_id: eventId,
  event_room_id: roomId,
  title: bed.title,
  image_url: bed.imageUrl ?? undefined,
  status: (bed.status?.toUpperCase() as EventBed["status"]) || "AVAILABLE",
  sort_order: bed.sortOrder,
});

const mapRoom = (room: BackendRoom, eventId: number | string): EventRoom => ({
  id: room.id,
  event_id: eventId,
  source_room_id: room.sourceRoomId ?? room.id,
  name: room.name,
  image_url: room.imageUrl ?? undefined,
  description: room.description ?? undefined,
  bed_count: room.bedCount ?? room.beds?.length ?? 0,
  sort_order: room.sortOrder,
  beds: (room.beds ?? []).map((bed) => mapBed(bed, eventId, room.id)),
});

const mapSeat = (seat: BackendSeat, eventId: number | string): EventSeat => ({
  id: seat.id,
  event_id: eventId,
  seat_index: seat.seatIndex,
  row: seat.row,
  col: seat.col,
  status: (seat.status?.toUpperCase() as EventSeat["status"]) || "AVAILABLE",
});

export async function createEventVenueSnapshot(
  eventId: number | string,
  venueId: string,
): Promise<{ success: boolean; error?: string; snapshotId?: string }> {
  try {
    await runApiEndpoint(retreatApi.endpoints.snapshotVenueToRetreat, {
      retreatId: String(eventId),
      venueId,
    });
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Snapshot failed";
    return { success: false, error: message };
  }
}

export async function createEventSeatsGrid(
  eventId: number | string,
  seatCapacity: number,
  rows = 10,
  cols = 10,
): Promise<{ success: boolean; error?: string; seatCount?: number }> {
  try {
    await runApiEndpoint(retreatApi.endpoints.updateRetreatSeatGrid, {
      id: String(eventId),
      body: { seatCapacity, rows, cols },
    });
    return { success: true, seatCount: seatCapacity };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Seat grid failed";
    return { success: false, error: message };
  }
}

export async function fetchEventRooms(eventId: number | string): Promise<EventRoom[]> {
  try {
    const rooms = await runApiEndpoint(retreatApi.endpoints.getRetreatRooms, String(eventId));
    return (rooms as BackendRoom[]).map((room) => mapRoom(room, eventId));
  } catch (error) {
    console.error("Error fetching event rooms:", error);
    return [];
  }
}

export async function fetchEventSeats(eventId: number | string): Promise<EventSeat[]> {
  try {
    const seats = await runApiEndpoint(retreatApi.endpoints.getRetreatSeats, String(eventId));
    return (seats as BackendSeat[]).map((seat) => mapSeat(seat, eventId));
  } catch (error) {
    console.error("Error fetching event seats:", error);
    return [];
  }
}

export async function holdBed(
  eventBedId: string,
  retreatId?: number | string,
): Promise<{ success: boolean; error?: string }> {
  if (!retreatId) return { success: false, error: "Retreat ID required" };
  try {
    await runApiEndpoint(bookingApi.endpoints.holdInventory, {
      retreatId: String(retreatId),
      body: { bedId: eventBedId },
    });
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Hold failed";
    return { success: false, error: message };
  }
}

export async function holdSeat(
  eventSeatId: string,
  retreatId?: number | string,
): Promise<{ success: boolean; error?: string }> {
  if (!retreatId) return { success: false, error: "Retreat ID required" };
  try {
    await runApiEndpoint(bookingApi.endpoints.holdInventory, {
      retreatId: String(retreatId),
      body: { seatId: eventSeatId },
    });
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Hold failed";
    return { success: false, error: message };
  }
}

export async function getAttendeeProfileForBed(eventBedId: string) {
  try {
    return await runApiEndpoint(retreatApi.endpoints.getBedAttendee, eventBedId);
  } catch {
    return null;
  }
}

export async function getAttendeeProfileForSeat(eventSeatId: string) {
  try {
    return await runApiEndpoint(retreatApi.endpoints.getSeatAttendee, eventSeatId);
  } catch {
    return null;
  }
}

export async function expireHeldInventory(): Promise<void> {
  // Handled by backend background job
}

export async function getBedDetailsFromAssignment(bookingId: string) {
  try {
    const booking = await runApiEndpoint(bookingApi.endpoints.getBookingById, bookingId);
    const item = (booking as { items?: { bed?: BackendBed; room?: BackendRoom }[] }).items?.[0];
    if (!item?.bed) return null;
    return {
      bed: mapBed(item.bed, "", item.room?.id ?? ""),
      room: item.room ? mapRoom(item.room, "") : null,
    };
  } catch {
    return null;
  }
}

export async function getSeatDetailsFromAssignment(bookingId: string): Promise<EventSeat | null> {
  try {
    const booking = await runApiEndpoint(bookingApi.endpoints.getBookingById, bookingId);
    const seat = (booking as { items?: { seat?: BackendSeat }[] }).items?.[0]?.seat;
    return seat ? mapSeat(seat, "") : null;
  } catch {
    return null;
  }
}
