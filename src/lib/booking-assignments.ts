import { runApiEndpoint } from "@/redux/apiDispatch";

import { bookingApi } from "@/services/server";



/**

 * Bed/seat assignment is handled server-side when creating a booking (bedId/seatId).

 * These helpers hold inventory before checkout.

 */

export async function createBedAssignment(

  retreatId: string,

  eventBedId: string,

): Promise<{ success: boolean; error?: string }> {

  try {

    await runApiEndpoint(bookingApi.endpoints.holdInventory, {

      retreatId,

      body: { bedId: eventBedId },

    });

    return { success: true };

  } catch (error: unknown) {

    const message = error instanceof Error ? error.message : "Failed to assign bed";

    return { success: false, error: message };

  }

}



export async function createSeatAssignment(

  retreatId: string,

  eventSeatId: string,

): Promise<{ success: boolean; error?: string }> {

  try {

    await runApiEndpoint(bookingApi.endpoints.holdInventory, {

      retreatId,

      body: { seatId: eventSeatId },

    });

    return { success: true };

  } catch (error: unknown) {

    const message = error instanceof Error ? error.message : "Failed to assign seat";

    return { success: false, error: message };

  }

}


