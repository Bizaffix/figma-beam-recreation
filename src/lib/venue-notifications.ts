import { runApiEndpoint } from "@/redux/apiDispatch";

import { venueApi } from "@/services/server";

import { sendCustomEmail } from "@/lib/email-notifications";

import { validateVenueRooms, type VenueRoom } from "@/lib/venue-validation";



export async function checkAndNotifyIncompleteVenues(): Promise<void> {

  try {

    const venues = await runApiEndpoint<Record<string, unknown>[]>(venueApi.endpoints.getVenues, {

      limit: 60,

      status: "published",

    });

    for (const venue of venues) {

      const isComplete = await checkVenueCompleteness(String(venue.id));

      if (!isComplete) {

        await sendVenueDetailsRequiredEmail(

          String(venue.id),

          String(venue.name ?? "Your venue"),

          String(venue.ownerId ?? ""),

        );

      }

    }

  } catch (error) {

    console.error("Error checking and notifying incomplete venues:", error);

  }

}



export async function checkVenueCompleteness(venueId: string): Promise<boolean> {

  try {

    const roomsData = await runApiEndpoint<Record<string, unknown>[]>(venueApi.endpoints.getVenueRooms, venueId);

    if (!roomsData.length) return false;



    const rooms: VenueRoom[] = roomsData.map((room) => {

      const beds = (room.beds as Record<string, unknown>[] | undefined) ?? [];

      return {

        id: String(room.id),

        name: String(room.name ?? ""),

        image_url: (room.imageUrl as string | undefined) ?? undefined,

        description: String(room.description ?? ""),

        bed_count: Number(room.bedCount ?? beds.length),

        beds: beds.map((bed) => ({

          id: String(bed.id),

          room_id: String(room.id),

          title: String(bed.title ?? bed.label ?? ""),

          image_url: (bed.imageUrl as string | undefined) ?? undefined,

        })),

      };

    });



    return validateVenueRooms(rooms).isValid;

  } catch (error) {

    console.error("Error checking venue completeness:", error);

    return false;

  }

}



async function sendVenueDetailsRequiredEmail(

  venueId: string,

  venueName: string,

  _ownerId: string,

): Promise<void> {

  try {

    const editUrl = `${window.location.origin}/location-owner/properties/${venueId}/edit`;

    const emailSubject = "Notice: Venue Details Required to complete profile";

    const emailMessage = `

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

      emails: [],

      subject: emailSubject,

      message: emailMessage,

      recipientType: "organizers",

    });

  } catch (error) {

    console.error("Error sending venue details required email:", error);

  }

}


