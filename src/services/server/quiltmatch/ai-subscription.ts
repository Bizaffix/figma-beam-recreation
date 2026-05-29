import { runApiEndpoint } from "@/redux/apiDispatch";

import { quiltmatchApi } from "@/services/server";



export async function createAiSubscriptionCheckout(nextPath = "/find") {

  const data = await runApiEndpoint(quiltmatchApi.endpoints.createAiSubscriptionCheckout, { nextPath });

  const url = (data as { url?: string }).url;

  if (!url) throw new Error("Failed to create checkout session.");

  return url;

}



export async function createAiSubscriptionPortal() {

  const data = await runApiEndpoint(quiltmatchApi.endpoints.createAiSubscriptionPortal);

  const url = (data as { url?: string }).url;

  if (!url) throw new Error("Failed to create billing portal session.");

  return url;

}


