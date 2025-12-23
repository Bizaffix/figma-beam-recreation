import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// List of crawler user agents
const CRAWLER_USER_AGENTS = [
  'facebookexternalhit',
  'Facebot',
  'Twitterbot',
  'LinkedInBot',
  'WhatsApp',
  'Applebot',
  'bingbot',
  'Googlebot',
  'Slurp',
  'DuckDuckBot',
  'Baiduspider',
  'YandexBot',
  'Sogou',
  'Exabot',
  'ia_archiver',
];

function isCrawler(userAgent: string | undefined): boolean {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  return CRAWLER_USER_AGENTS.some(crawler => ua.includes(crawler.toLowerCase()));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;
  const userAgent = req.headers['user-agent'];

  // Handle non-crawlers: serve the React app HTML directly
  // This avoids redirect loops - the React app will handle routing client-side
  if (!isCrawler(userAgent)) {
    // Return the React app's index.html
    // The React Router will handle the /retreat/:id route client-side
    const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Quilting Retreats - Discover, Learn, and Connect</title>
    <meta name="description" content="Discover amazing quilting retreats. Learn modern techniques, create art quilts, and connect with expert instructors in beautiful locations." />
    <link rel="icon" type="image/png" href="/favicon1.png" />
    <script>
      // Preserve the route for React Router
      if (window.location.pathname !== '/retreat/${id}') {
        window.history.replaceState(null, '', '/retreat/${id}');
      }
    </script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(html);
  }

  // Initialize Supabase client
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).send('Server configuration error');
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Fetch retreat data
    const { data: retreat, error } = await supabase
      .from('retreats')
      .select(`
        *,
        instructor:profiles!instructor_id(
          full_name,
          avatar_url
        )
      `)
      .eq('id', Number(id))
      .eq('published', true)
      .single();

    if (error || !retreat) {
      // If retreat not found, return basic HTML
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Retreat Not Found - Quilting Retreats</title>
            <meta property="og:title" content="Retreat Not Found" />
            <meta property="og:description" content="This retreat is not available." />
            <meta property="og:type" content="website" />
          </head>
          <body>
            <h1>Retreat Not Found</h1>
          </body>
        </html>
      `);
    }

    // Ensure image URL is absolute
    let imageUrl = retreat.image || '';
    if (imageUrl && !imageUrl.startsWith('http')) {
      const baseUrl = process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}` 
        : 'https://www.bookmyquiltretreat.com';
      imageUrl = imageUrl.startsWith('/') 
        ? `${baseUrl}${imageUrl}`
        : `${baseUrl}/${imageUrl}`;
    }

    // If no image, use a placeholder
    if (!imageUrl) {
      const baseUrl = process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}` 
        : 'https://www.bookmyquiltretreat.com';
      imageUrl = `${baseUrl}/placeholder.svg`;
    }

    const retreatUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}/retreat/${id}`
      : `https://www.bookmyquiltretreat.com/retreat/${id}`;

    const title = retreat.title || 'Quilting Retreat';
    const description = retreat.description || 'Join us for an amazing quilting retreat!';
    const instructorName = retreat.instructor?.full_name || 'Expert Instructor';
    const location = retreat.location || '';
    const date = retreat.date || '';
    const price = retreat.price ? `$${retreat.price}` : '';

    // Generate HTML with proper meta tags
    const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title} - Quilting Retreats</title>
    <meta name="description" content="${description.substring(0, 160)}" />
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${retreatUrl}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description.substring(0, 200)}" />
    <meta property="og:image" content="${imageUrl}" />
    <meta property="og:image:secure_url" content="${imageUrl}" />
    <meta property="og:image:type" content="image/jpeg" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:site_name" content="BookMyQuiltRetreat" />
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="${retreatUrl}" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description.substring(0, 200)}" />
    <meta name="twitter:image" content="${imageUrl}" />
    
    <!-- Additional Meta -->
    <meta name="author" content="${instructorName}" />
    
    <!-- Redirect to actual page for non-crawlers -->
    <script>
      if (!navigator.userAgent.match(/${CRAWLER_USER_AGENTS.join('|')}/i)) {
        window.location.href = '/retreat/${id}';
      }
    </script>
  </head>
  <body>
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
      <h1>${title}</h1>
      <img src="${imageUrl}" alt="${title}" style="max-width: 100%; height: auto; margin: 20px 0;" />
      <p>${description}</p>
      ${location ? `<p><strong>Location:</strong> ${location}</p>` : ''}
      ${date ? `<p><strong>Date:</strong> ${date}</p>` : ''}
      ${price ? `<p><strong>Price:</strong> ${price}</p>` : ''}
      <p><strong>Instructor:</strong> ${instructorName}</p>
      <p><a href="${retreatUrl}">View Full Retreat Details</a></p>
    </div>
  </body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).send(html);

  } catch (error) {
    console.error('Error fetching retreat:', error);
    return res.status(500).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Error - Quilting Retreats</title>
          <meta property="og:title" content="Error Loading Retreat" />
          <meta property="og:description" content="An error occurred while loading this retreat." />
        </head>
        <body>
          <h1>Error Loading Retreat</h1>
        </body>
      </html>
    `);
  }
}

