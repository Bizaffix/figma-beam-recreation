import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@15.12.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

serve(async (req) => {
  const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY")!;
  const webhookSecret = Deno.env.get("STRIPE_AI_WEBHOOK_SECRET")!;
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const stripe = new Stripe(stripeSecret, { apiVersion: "2024-04-10" });
  const admin = createClient(supabaseUrl, serviceRoleKey);

  const signature = req.headers.get("stripe-signature");
  if (!signature) return new Response("Missing signature", { status: 400 });

  const body = await req.text();
  let event: Stripe.Event;

  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook verification failed:", err);
    return new Response("Invalid signature", { status: 400 });
  }

  const syncSubscription = async (subscription: Stripe.Subscription) => {
    const customerId = subscription.customer as string;
    const profileStatus =
      subscription.status === "active"
        ? "active"
        : subscription.status === "past_due"
          ? "past_due"
          : "canceled";

    await admin
      .from("profiles")
      .update({
        ai_subscription_status: profileStatus,
        ai_subscription_id: subscription.id,
        ai_subscription_price_id: subscription.items.data[0]?.price?.id ?? null,
        ai_subscription_current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      })
      .eq("ai_stripe_customer_id", customerId);
  };

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription" && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          await syncSubscription(subscription);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await syncSubscription(subscription);
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error("Webhook processing failed:", err);
    return new Response("Webhook error", { status: 500 });
  }

  return new Response("ok", { status: 200 });
});

