# Facebook Open Graph Image Fix

## Problem
Facebook's crawler doesn't execute JavaScript, so it can't see meta tags that are set client-side in React. This causes the `og:image` warning in Facebook's Sharing Debugger.

## Solution Implemented

### 1. Serverless Function for Crawlers
Created `/api/retreat/[id].ts` that:
- Detects if the request is from a crawler (Facebook, Twitter, LinkedIn, etc.)
- If crawler: Fetches retreat data from Supabase and returns HTML with proper Open Graph meta tags
- If not crawler: Serves the React app HTML

### 2. Vercel Configuration
Updated `vercel.json` to rewrite `/retreat/:id` requests to `/api/retreat/:id`, which then handles routing based on user agent.

### 3. Meta Tags
The serverless function sets all required Open Graph tags:
- `og:title` - Retreat title
- `og:description` - Retreat description  
- `og:image` - Retreat image (full URL from Supabase)
- `og:url` - Retreat page URL
- `og:type` - website
- `og:site_name` - BookMyQuiltRetreat
- `og:image:secure_url` - HTTPS image URL
- `og:image:type` - image/jpeg
- Twitter Card tags

## Testing

1. **Deploy to Vercel** - The serverless function will be automatically deployed
2. **Test with Facebook Sharing Debugger**:
   - Go to https://developers.facebook.com/tools/debug/
   - Enter your retreat URL: `https://www.bookmyquiltretreat.com/retreat/9`
   - Click "Debug" then "Scrape Again"
   - You should now see:
     - ✅ `og:image` property is present
     - ✅ Image preview shows the retreat image
     - ✅ All retreat details are included

## Environment Variables Required

Make sure these are set in Vercel:
- `VITE_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## How It Works

1. **Normal User**: Visits `/retreat/9` → Rewritten to `/api/retreat/9` → Detected as non-crawler → Serves React app HTML
2. **Facebook Crawler**: Visits `/retreat/9` → Rewritten to `/api/retreat/9` → Detected as crawler → Fetches retreat data → Returns HTML with meta tags

## Notes

- The function caches responses for 1 hour (`s-maxage=3600`)
- Images must be publicly accessible (Supabase public URLs work)
- Recommended image size: 1200x630 pixels
- After deploying, use Facebook's Sharing Debugger to refresh the cache

