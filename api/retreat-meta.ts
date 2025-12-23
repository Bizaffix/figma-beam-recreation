import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Social media crawler user agents
const CRAWLER_AGENTS = [
  'facebookexternalhit',
  'Facebot',
  'Twitterbot',
  'LinkedInBot',
  'WhatsApp',
  'Slackbot',
  'Applebot',
  'Googlebot',
  'bingbot',
];

function isCrawler(userAgent: string | undefined): boolean {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  return CRAWLER_AGENTS.some(agent => ua.includes(agent.toLowerCase()));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only handle GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userAgent = req.headers['user-agent'];
  
  // Extract retreat ID from query or URL
  const retreatId = req.query.id as string || req.url?.match(/\/retreat\/(\d+)/)?.[1];
  
  if (!retreatId) {
    return res.status(400).json({ error: 'Retreat ID required' });
  }

  // If not a crawler, we need to serve the React app (index.html)
  // Since we can't easily read the file, we'll return a minimal HTML that loads the app
  // The React app will handle the routing client-side
  if (!isCrawler(userAgent)) {
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : process.env.VITE_APP_URL || 'https://www.bookmyquiltretreat.com';
    
    // Return the index.html structure with React app
    // This will let React Router handle the /retreat/:id route
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
            // Ensure React Router navigates to the correct route
            if (window.location.pathname !== '/retreat/${retreatId}') {
              window.history.replaceState(null, '', '/retreat/${retreatId}');
            }
          </script>
        </body>
      </html>
    `);
  }
  
  // For crawlers, serve meta tags HTML
  try {
    // Initialize Supabase client
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

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
      .eq('id', Number(retreatId))
      .eq('published', true)
      .single();

    if (error || !retreat) {
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

    // Build absolute URLs
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : process.env.VITE_APP_URL || 'https://www.bookmyquiltretreat.com';
    
    const retreatUrl = `${baseUrl}/retreat/${retreat.id}`;
    
    // Handle image URL - ensure it's absolute
    let imageUrl = `${baseUrl}/favicon1.png`; // default
    if (retreat.image) {
      if (retreat.image.startsWith('http://') || retreat.image.startsWith('https://')) {
        imageUrl = retreat.image;
      } else if (retreat.image.startsWith('/')) {
        imageUrl = `${baseUrl}${retreat.image}`;
      } else {
        imageUrl = `${baseUrl}/${retreat.image}`;
      }
    }

    // Clean location - remove URLs and extract just the location name
    let cleanLocation = retreat.location || '';
    // If location contains a URL (like Google Maps), omit it from the description
    const isLocationUrl = cleanLocation.includes('http://') || 
                         cleanLocation.includes('https://') || 
                         cleanLocation.includes('maps.app.goo.gl') || 
                         cleanLocation.includes('goo.gl') ||
                         cleanLocation.includes('maps.google.com');
    
    if (isLocationUrl) {
      cleanLocation = ''; // Omit URL locations from description
    }
    
    // Clean description - remove placeholder text and format nicely
    let cleanDescription = retreat.description || '';
    // Remove common placeholder text
    if (cleanDescription.toLowerCase().includes('this is an example')) {
      cleanDescription = cleanDescription.replace(/this is an example\.?\s*/i, '').trim();
    }
    // Remove URLs from description
    cleanDescription = cleanDescription.replace(/https?:\/\/[^\s]+/g, '').trim();
    
    // Build description optimized for Facebook display
    // Facebook's optimal description length: 155-200 characters (best display rate)
    // Strategy: Description first (most important), then key details
    
    let description = '';
    
    // Start with the retreat description (primary content)
    if (cleanDescription && cleanDescription.length > 0) {
      // Use up to 140 chars for description to leave room for details
      const desc = cleanDescription.substring(0, 140).trim();
      description = desc + (cleanDescription.length > 140 ? '...' : '');
    }
    
    // Add key details in a clean, readable format
    const details: string[] = [];
    if (retreat.date) {
      details.push(retreat.date);
    }
    if (cleanLocation && cleanLocation.trim()) {
      details.push(cleanLocation);
    }
    if (retreat.price) {
      details.push(`$${retreat.price}`);
    }
    
    // Append details if we have description
    if (description && details.length > 0) {
      // Calculate remaining space (target: 155-200 chars total)
      const remainingSpace = 200 - description.length;
      if (remainingSpace > 20) {
        const detailsText = details.join(' • ');
        if (description.length + detailsText.length + 3 <= 200) {
          description += ' | ' + detailsText;
        } else {
          // Truncate details if needed
          const availableSpace = remainingSpace - 3; // 3 for " | "
          if (availableSpace > 10) {
            description += ' | ' + detailsText.substring(0, availableSpace - 3) + '...';
          }
        }
      }
    } else if (!description && details.length > 0) {
      // Fallback: create description from title and details
      description = `Join us for ${retreat.title}. ${details.join(' • ')}`;
    }
    
    // Ensure description is within Facebook's optimal range (155-200 chars)
    // Facebook can display up to 300 chars, but 155-200 has best display rate
    if (description.length > 200) {
      // Try to truncate at a word boundary
      const truncated = description.substring(0, 197);
      const lastSpace = truncated.lastIndexOf(' ');
      if (lastSpace > 150) {
        description = truncated.substring(0, lastSpace) + '...';
      } else {
        description = truncated + '...';
      }
    }
    
    // Ensure minimum length for better display (Facebook prefers 155+ chars)
    if (description.length < 100 && cleanDescription) {
      // Try to expand description if we have more content
      const expanded = cleanDescription.substring(0, 180).trim();
      if (expanded.length > description.length) {
        description = expanded + (cleanDescription.length > 180 ? '...' : '');
        if (details.length > 0 && description.length + details.join(' • ').length + 3 <= 200) {
          description += ' | ' + details.join(' • ');
        }
      }
    }
    
    // Remove newlines, normalize whitespace, and clean up
    description = description
      .replace(/\n+/g, ' ')           // Remove newlines
      .replace(/\r+/g, ' ')           // Remove carriage returns
      .replace(/\s+/g, ' ')            // Normalize whitespace
      .replace(/[^\x20-\x7E]/g, ' ')  // Remove non-printable characters (keep only ASCII printable)
      .trim();
    
    // Final safety check - ensure description is never empty and meaningful
    if (!description || description.length < 20) {
      description = `Join us for ${retreat.title}, an amazing quilting retreat experience`;
      if (details.length > 0) {
        const detailsText = details.join(' • ');
        if (description.length + detailsText.length + 3 <= 200) {
          description += ' | ' + detailsText;
        }
      }
    }
    
    // Final length check - ensure we're in the optimal range
    if (description.length < 155 && cleanDescription && cleanDescription.length > description.length) {
      // Try to expand to optimal length
      const targetLength = 180;
      const expanded = cleanDescription.substring(0, targetLength).trim();
      if (expanded.length >= 155) {
        description = expanded + (cleanDescription.length > targetLength ? '...' : '');
        if (details.length > 0) {
          const detailsText = details.join(' • ');
          const combined = description + ' | ' + detailsText;
          if (combined.length <= 200) {
            description = combined;
          }
        }
      }
    }

    // Generate HTML with meta tags
    const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(retreat.title)} - Quilting Retreats</title>
    <meta name="description" content="${escapeHtml(description)}" />
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${retreatUrl}" />
    <meta property="og:title" content="${escapeHtml(retreat.title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:image" content="${imageUrl}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${escapeHtml(retreat.title)}" />
    <meta property="og:image:type" content="image/jpeg" />
    <meta property="og:site_name" content="Quilting Retreats" />
    <meta property="og:locale" content="en_US" />
    ${process.env.FACEBOOK_APP_ID ? `<meta property="fb:app_id" content="${process.env.FACEBOOK_APP_ID}" />` : ''}
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(retreat.title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${imageUrl}" />
    
    <!-- Additional meta tags -->
    <meta name="author" content="${escapeHtml(retreat.instructor?.full_name || 'Quilting Retreats')}" />
  </head>
  <body>
    <div style="max-width: 800px; margin: 50px auto; padding: 20px; font-family: Arial, sans-serif;">
      <h1>${escapeHtml(retreat.title)}</h1>
      <p>${escapeHtml(description)}</p>
      <p><a href="${retreatUrl}">View Retreat Details</a></p>
    </div>
  </body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).send(html);

  } catch (error: any) {
    console.error('Error generating meta tags:', error);
    return res.status(500).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Error</title>
        </head>
        <body>Error loading retreat</body>
      </html>
    `);
  }
}

function escapeHtml(text: string): string {
  if (!text) return '';
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
