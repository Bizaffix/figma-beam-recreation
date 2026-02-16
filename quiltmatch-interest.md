// ============================================================
// QuiltMatch Interest – Supabase Edge Function
// Saves student interest + sends organizer invite email
// with claim link. No Supabase dashboard access needed.
// ============================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ---- Email Sending ----

async function sendOrganizerInviteEmail(
  listing: Record<string, unknown>,
  studentName: string,
  studentMessage: string | null,
  claimUrl: string,
) {
  // Use Supabase's built-in SMTP or a free email service
  // For now, we'll use Resend (free 100 emails/day) or fallback to console log
  const resendKey = Deno.env.get("RESEND_API_KEY");
  const fromEmail = Deno.env.get("FROM_EMAIL") || "hello@bookmyquiltretreat.com";

  const organizerEmail = listing.organizer_email as string;
  const organizerName = listing.organizer_name as string || "there";
  const listingTitle = listing.title as string;
  const sourceUrl = listing.source_url as string;
  const locationCity = listing.location_city as string || "";
  const locationRegion = listing.location_region as string || "";
  const locationStr = [locationCity, locationRegion].filter(Boolean).join(", ") || "your area";

  const subject = `Someone wants to book your quilt retreat — claim your free listing`;

  const body = `Hi ${organizerName},

We're Book My Quilt Retreat, a new directory helping quilters discover retreats like yours.

Here's what happened:
${studentName} searched for a quilt retreat and found yours in our results. They indicated they're interested in booking.
${studentMessage ? `\nTheir message: "${studentMessage}"\n` : ""}
Here's what we did:
We created a draft listing for you using publicly available info from ${sourceUrl}. You can review it at the link below.

What you can do next (100% free):
1. Click the link below to claim your listing
2. Review the draft (we pulled title, description, pricing, and dates from public sources)
3. Edit, add photos, update details, and add availability
4. Message the interested student directly

No cost. No obligation. No surprise fees.
Claiming your listing is free. If you choose to accept bookings through Book My Quilt Retreat, our platform fees are transparent and only apply when you get a confirmed booking.

👉 Claim your listing now:
${claimUrl}

If this isn't you, or you'd prefer we remove the draft, just reply to this email and we'll take it down immediately.

Thank you for creating spaces where quilters connect and create,
The Book My Quilt Retreat Team
RetreatVenue0@gmail.com`;

  if (resendKey && organizerEmail) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [organizerEmail],
          subject,
          text: body,
        }),
      });

      if (res.ok) {
        console.log(`Invite email sent to ${organizerEmail} for listing: ${listingTitle}`);
        return true;
      } else {
        console.error("Resend API error:", res.status, await res.text());
      }
    } catch (err) {
      console.error("Email send error:", err);
    }
  }

  // Fallback: log the email (admin can check edge function logs)
  console.log("=== ORGANIZER INVITE EMAIL ===");
  console.log(`To: ${organizerEmail || "NO EMAIL FOUND"}`);
  console.log(`Subject: ${subject}`);
  console.log(`Claim URL: ${claimUrl}`);
  console.log("=== END EMAIL ===");

  return false;
}

// ---- Main Handler ----

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const {
      draft_listing_id,
      student_name,
      student_email,
      student_message,
      contact_preference,
    } = body;

    if (!draft_listing_id) {
      return jsonResponse({ error: "draft_listing_id is required" }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Fetch the draft listing
    const { data: listing, error: listingError } = await supabaseClient
      .from("draft_listings")
      .select("*")
      .eq("id", draft_listing_id)
      .single();

    if (listingError || !listing) {
      return jsonResponse({ error: "Draft listing not found" }, 404);
    }

    // 2. Save the interest (using service role — bypasses RLS completely)
    const { data: interest, error: interestError } = await supabaseClient
      .from("listing_interests")
      .insert({
        draft_listing_id,
        student_name: student_name || null,
        student_email: student_email || null,
        student_message: student_message || null,
        contact_preference: contact_preference || "platform",
        student_id: null,
      })
      .select()
      .single();

    if (interestError) {
      console.error("Error saving interest:", interestError);
      return jsonResponse({ error: "Failed to save interest" }, 500);
    }

    // 3. Build the claim URL (uses VITE_APP_URL which you already have in secrets)
    const siteUrl = Deno.env.get("VITE_APP_URL") || "https://www.bookmyquiltretreat.com";
    const claimUrl = `${siteUrl}/claim?token=${listing.invite_token}`;

    // 4. Send invite email to organizer (if not already sent)
    let emailSent = false;
    if (listing.organizer_email && listing.status === "draft") {
      emailSent = await sendOrganizerInviteEmail(
        listing,
        student_name || "A quilter",
        student_message || null,
        claimUrl,
      );

      // Update listing status to "invited"
      await supabaseClient
        .from("draft_listings")
        .update({
          status: "invited",
          invite_sent_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", draft_listing_id);
    }

    // 5. Count total interests for this listing
    const { count } = await supabaseClient
      .from("listing_interests")
      .select("*", { count: "exact", head: true })
      .eq("draft_listing_id", draft_listing_id);

    return jsonResponse({
      success: true,
      interest: interest,
      email_sent: emailSent,
      claim_url: claimUrl,
      total_interests: count || 1,
      message: emailSent
        ? `Interest saved! We've emailed ${listing.organizer_name || "the organizer"} to connect with you.`
        : `Interest saved! We'll notify the organizer when we have their contact info.`,
    });
  } catch (err) {
    console.error("QuiltMatch Interest error:", err);
    return jsonResponse(
      { error: "Internal server error", message: err instanceof Error ? err.message : "Unknown error" },
      500,
    );
  }
});
