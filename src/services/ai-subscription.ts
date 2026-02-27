import { supabase } from "@/lib/supabase";

export async function createAiSubscriptionCheckout(nextPath = "/find") {
  const { data, error } = await supabase.functions.invoke("create-ai-subscription-checkout", {
    body: { next_path: nextPath },
  });

  if (error) throw error;
  if (!data?.url) throw new Error("Failed to create checkout session.");
  return data.url as string;
}

export async function createAiSubscriptionPortal() {
  const { data, error } = await supabase.functions.invoke("create-ai-subscription-portal");
  if (error) throw error;
  if (!data?.url) throw new Error("Failed to create billing portal session.");
  return data.url as string;
}

