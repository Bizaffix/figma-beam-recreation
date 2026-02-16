// ============================================================
// QuiltMatch Admin – Supabase Edge Function
// Handles admin actions: approve, reject, request_edits, flag
// Sends emails to organizers and notifies interested students
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

// ---- Email Helpers ----

async function sendEmail(
  resendKey: string,
  fromEmail: string,
  to: string,
  subject: string,
  body: string,
): Promise<boolean> {
  if (!resendKey || !to) return false;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [to],
        subject,
        text: body,
      }),
    });

    if (res.ok) {
      console.log(`Email sent to ${to}: ${subject}`);
      return true;
    } else {
      console.error("Resend error:", res.status, await res.text());
      return false;
    }
  } catch (err) {
    console.error("Email error:", err);
    return false;
  }
}

// ---- Approval Email to Organizer ----

function buildApprovalEmail(listing: Record<string, unknown>, siteUrl: string): { subject: string; body: string } {
  const title = listing.title as string;
  const name = listing.organizer_name as string || "there";

  return {
    subject: `Your listing is live — your first student is waiting`,
    body: `Hi ${name},

Great news — your listing "${title}" is now live on Book My Quilt Retreat!

You can:
- Reply to students who expressed interest
- View your dashboard and see search analytics
- Update your listing anytime

👉 Go to your dashboard: ${siteUrl}/login

Let's fill those seats with quilters who can't wait to create together.

— The Book My Quilt Retreat Team
RetreatVenue0@gmail.com`,
  };
}

// ---- Rejection Email to Organizer ----

function buildRejectionEmail(
  listing: Record<string, unknown>,
  reason: string,
): { subject: string; body: string } {
  const title = listing.title as string;
  const name = listing.organizer_name as string || "there";

  return {
    subject: `Update on your listing "${title}"`,
    body: `Hi ${name},

Thank you for claiming your listing "${title}" on Book My Quilt Retreat.

After review, we weren't able to approve it at this time.

Reason: ${reason}

What you can do:
- Reply to this email with any questions or additional info
- Contact us at RetreatVenue0@gmail.com for help

We'd love to have you on the platform and are happy to work with you.

— The Book My Quilt Retreat Team
RetreatVenue0@gmail.com`,
  };
}

// ---- Request Edits Email to Organizer ----

function buildRequestEditsEmail(
  listing: Record<string, unknown>,
  message: string,
  siteUrl: string,
): { subject: string; body: string } {
  const title = listing.title as string;
  const name = listing.organizer_name as string || "there";
  const token = listing.invite_token as string;

  return {
    subject: `Almost there — a few updates needed for "${title}"`,
    body: `Hi ${name},

Your listing "${title}" is almost ready to go live! We just need a few updates:

${message}

You can edit your listing here:
${siteUrl}/claim?token=${token}

Once you've made the changes, click "Submit for Approval" again and we'll review it right away.

— The Book My Quilt Retreat Team
RetreatVenue0@gmail.com`,
  };
}

// ---- Student Notification (listing went live) ----

function buildStudentNotificationEmail(
  listing: Record<string, unknown>,
  studentName: string,
  siteUrl: string,
): { subject: string; body: string } {
  const title = listing.title as string;

  return {
    subject: `${title} just joined — they're ready to answer your questions`,
    body: `Hi ${studentName || "there"},

Good news! ${title} claimed their listing and completed it. You can now:

- See their full details (photos, pricing, rooming, availability)
- Message them directly
- Book your spot

👉 View the listing: ${siteUrl}/browse

Happy quilting,
Book My Quilt Retreat`,
  };
}

// ---- Main Handler ----

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { listing_id, action, message_to_organizer } = body;

    if (!listing_id || !action) {
      return jsonResponse({ error: "listing_id and action are required" }, 400);
    }

    if (!["approve", "reject", "request_edits", "flag"].includes(action)) {
      return jsonResponse({ error: "Invalid action. Must be: approve, reject, request_edits, flag" }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendKey = Deno.env.get("RESEND_API_KEY") || "";
    const fromEmail = Deno.env.get("FROM_EMAIL") || "hello@bookmyquiltretreat.com";
    const siteUrl = Deno.env.get("VITE_APP_URL") || "https://www.bookmyquiltretreat.com";

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Fetch the listing
    const { data: listing, error: listingError } = await supabaseClient
      .from("draft_listings")
      .select("*")
      .eq("id", listing_id)
      .single();

    if (listingError || !listing) {
      return jsonResponse({ error: "Listing not found" }, 404);
    }

    const organizerEmail = listing.organizer_email as string;
    let emailsSent: string[] = [];

    // 2. Process action
    if (action === "approve") {
      // Update listing status to live
      await supabaseClient
        .from("draft_listings")
        .update({
          status: "live",
          approved_at: new Date().toISOString(),
          admin_notes: message_to_organizer || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", listing_id);

      // Send approval email to organizer
      if (organizerEmail) {
        const { subject, body: emailBody } = buildApprovalEmail(listing, siteUrl);
        const sent = await sendEmail(resendKey, fromEmail, organizerEmail, subject, emailBody);
        if (sent) emailsSent.push(`organizer: ${organizerEmail}`);
      }

      // Send notification to all interested students
      const { data: interests } = await supabaseClient
        .from("listing_interests")
        .select("student_name, student_email")
        .eq("draft_listing_id", listing_id);

      if (interests) {
        for (const interest of interests) {
          if (interest.student_email) {
            const { subject, body: emailBody } = buildStudentNotificationEmail(
              listing,
              interest.student_name || "there",
              siteUrl,
            );
            const sent = await sendEmail(resendKey, fromEmail, interest.student_email, subject, emailBody);
            if (sent) emailsSent.push(`student: ${interest.student_email}`);
          }
        }
      }

      return jsonResponse({
        success: true,
        action: "approve",
        new_status: "live",
        emails_sent: emailsSent,
        message: `Listing approved and live! ${emailsSent.length} email(s) sent.`,
      });
    }

    if (action === "reject") {
      await supabaseClient
        .from("draft_listings")
        .update({
          status: "rejected",
          rejection_reason: message_to_organizer || "Did not meet listing requirements",
          admin_notes: message_to_organizer || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", listing_id);

      if (organizerEmail && message_to_organizer) {
        const { subject, body: emailBody } = buildRejectionEmail(listing, message_to_organizer);
        const sent = await sendEmail(resendKey, fromEmail, organizerEmail, subject, emailBody);
        if (sent) emailsSent.push(`organizer: ${organizerEmail}`);
      }

      return jsonResponse({
        success: true,
        action: "reject",
        new_status: "rejected",
        emails_sent: emailsSent,
        message: `Listing rejected. ${emailsSent.length} email(s) sent.`,
      });
    }

    if (action === "request_edits") {
      // Revert to "invited" so organizer can re-edit via claim link
      await supabaseClient
        .from("draft_listings")
        .update({
          status: "invited",
          admin_notes: message_to_organizer || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", listing_id);

      if (organizerEmail && message_to_organizer) {
        const { subject, body: emailBody } = buildRequestEditsEmail(listing, message_to_organizer, siteUrl);
        const sent = await sendEmail(resendKey, fromEmail, organizerEmail, subject, emailBody);
        if (sent) emailsSent.push(`organizer: ${organizerEmail}`);
      }

      return jsonResponse({
        success: true,
        action: "request_edits",
        new_status: "invited",
        emails_sent: emailsSent,
        message: `Edit request sent. Listing reverted to "invited" so organizer can re-submit.`,
      });
    }

    if (action === "flag") {
      // Just add admin notes, keep current status
      const flags = (listing.review_flags as string[] || []);
      flags.push(`Flagged: ${message_to_organizer || "Admin flagged for follow-up"} (${new Date().toISOString()})`);

      await supabaseClient
        .from("draft_listings")
        .update({
          review_flags: flags,
          admin_notes: message_to_organizer || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", listing_id);

      return jsonResponse({
        success: true,
        action: "flag",
        new_status: listing.status,
        message: "Listing flagged for follow-up.",
      });
    }

    return jsonResponse({ error: "Unknown action" }, 400);
  } catch (err) {
    console.error("QuiltMatch Admin error:", err);
    return jsonResponse(
      { error: "Internal server error", message: err instanceof Error ? err.message : "Unknown error" },
      500,
    );
  }
});
