import { VercelRequest, VercelResponse } from "@vercel/node";

const CRAWLER_AGENTS = [
  "facebookexternalhit",
  "Facebot",
  "Twitterbot",
  "LinkedInBot",
  "WhatsApp",
  "Slackbot",
  "Applebot",
  "Googlebot",
  "bingbot",
];

function isCrawler(userAgent: string | undefined): boolean {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  return CRAWLER_AGENTS.some((agent) => ua.includes(agent.toLowerCase()));
}

async function fetchRetreatFromBackend(retreatId: string) {
  const apiUrl = (process.env.VITE_API_URL || process.env.API_URL || "http://localhost:4000/api").replace(
    /\/+$/,
    "",
  );
  const res = await fetch(`${apiUrl}/retreats/${retreatId}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return null;
  const body = await res.json();
  const retreat = (body?.data?.retreat ?? body?.retreat ?? body?.data ?? body) as Record<string, unknown>;
  if (!retreat || retreat.status === "draft") return null;
  return retreat;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const userAgent = req.headers["user-agent"];
  const retreatId = (req.query.id as string) || req.url?.match(/\/retreat\/(\d+)/)?.[1];

  if (!retreatId) {
    return res.status(400).json({ error: "Retreat ID required" });
  }

  if (!isCrawler(userAgent)) {
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.VITE_APP_URL || "https://www.bookmyquiltretreat.com";

    return res.status(200).send(`
      <!doctype html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Quilting Retreats - Discover, Learn, and Connect</title>
          <meta name="description" content="Discover amazing quilting retreats. Learn modern techniques, create art quilts, and connect with expert instructors in beautiful locations." />
          <link rel="icon" type="image/png" href="/favicon1.png" />
        </head>
        <body>
          <div id="root"></div>
          <script type="module" src="/src/main.tsx"></script>
          <script>
            if (window.location.pathname !== '/retreat/${retreatId}') {
              window.history.replaceState(null, '', '/retreat/${retreatId}');
            }
          </script>
        </body>
      </html>
    `);
  }

  try {
    const retreat = await fetchRetreatFromBackend(retreatId);

    if (!retreat) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Retreat Not Found</title>
            <meta property="og:title" content="Retreat Not Found" />
          </head>
          <body>Retreat not found</body>
        </html>
      `);
    }

    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.VITE_APP_URL || "https://www.bookmyquiltretreat.com";

    const retreatUrl = `${baseUrl}/retreat/${retreat.id}`;
    const instructor = retreat.instructor as Record<string, unknown> | undefined;

    let imageUrl = `${baseUrl}/favicon1.png`;
    const coverImage = String(retreat.coverImageUrl ?? retreat.image ?? "");
    if (coverImage) {
      if (coverImage.startsWith("http://") || coverImage.startsWith("https://")) {
        imageUrl = coverImage;
      } else if (coverImage.startsWith("/")) {
        imageUrl = `${baseUrl}${coverImage}`;
      } else {
        imageUrl = `${baseUrl}/${coverImage}`;
      }
    }

    const locationParts = [retreat.locationCity, retreat.locationState, retreat.location].filter(Boolean);
    let cleanLocation = locationParts.join(", ") || String(retreat.location ?? "");
    const isLocationUrl =
      cleanLocation.includes("http://") ||
      cleanLocation.includes("https://") ||
      cleanLocation.includes("maps.app.goo.gl") ||
      cleanLocation.includes("goo.gl") ||
      cleanLocation.includes("maps.google.com");

    if (isLocationUrl) cleanLocation = "";

    let cleanDescription = String(retreat.description ?? "");
    if (cleanDescription.toLowerCase().includes("this is an example")) {
      cleanDescription = cleanDescription.replace(/this is an example\.?\s*/i, "").trim();
    }
    cleanDescription = cleanDescription.replace(/https?:\/\/[^\s]+/g, "").trim();

    const title = String(retreat.title ?? "Quilting Retreat");
    const date = String(retreat.startDate ?? retreat.date ?? "");
    const price = Number(retreat.basePrice ?? retreat.price ?? 0);

    let description = "";
    if (cleanDescription) {
      const desc = cleanDescription.substring(0, 140).trim();
      description = desc + (cleanDescription.length > 140 ? "..." : "");
    }

    const details: string[] = [];
    if (date) details.push(date);
    if (cleanLocation.trim()) details.push(cleanLocation);
    if (price) details.push(`$${price}`);

    if (description && details.length > 0) {
      const remainingSpace = 200 - description.length;
      if (remainingSpace > 20) {
        const detailsText = details.join(" • ");
        if (description.length + detailsText.length + 3 <= 200) {
          description += " | " + detailsText;
        }
      }
    } else if (!description && details.length > 0) {
      description = `Join us for ${title}. ${details.join(" • ")}`;
    }

    if (description.length > 200) {
      const truncated = description.substring(0, 197);
      const lastSpace = truncated.lastIndexOf(" ");
      description = lastSpace > 150 ? `${truncated.substring(0, lastSpace)}...` : `${truncated}...`;
    }

    if (!description || description.length < 20) {
      description = `Join us for ${title}, an amazing quilting retreat experience`;
    }

    description = description.replace(/\s+/g, " ").trim();

    const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)} - Quilting Retreats</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${retreatUrl}" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:image" content="${imageUrl}" />
    <meta property="og:site_name" content="Quilting Retreats" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${imageUrl}" />
    <meta name="author" content="${escapeHtml(String(instructor?.fullName ?? instructor?.full_name ?? "Quilting Retreats"))}" />
  </head>
  <body>
    <div style="max-width: 800px; margin: 50px auto; padding: 20px; font-family: Arial, sans-serif;">
      <h1>${escapeHtml(title)}</h1>
      <p>${escapeHtml(description)}</p>
      <p><a href="${retreatUrl}">View Retreat Details</a></p>
    </div>
  </body>
</html>`;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
    return res.status(200).send(html);
  } catch (error) {
    console.error("Error generating meta tags:", error);
    return res.status(500).send("<html><body>Error loading retreat</body></html>");
  }
}

function escapeHtml(text: string): string {
  if (!text) return "";
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
