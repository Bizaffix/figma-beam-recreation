# Facebook Sharing Setup Guide

## Issue
Facebook's crawler doesn't execute JavaScript, so it won't see meta tags that are set client-side in React. This means when you first share a retreat link, Facebook might not show the image preview.

## Solution

### Step 1: Share the Link
After implementing the share functionality, share your retreat link on Facebook.

### Step 2: Use Facebook Sharing Debugger
1. Go to [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
2. Paste your retreat URL (e.g., `https://www.bookmyquiltretreat.com/retreat/9`)
3. Click "Debug"
4. Click "Scrape Again" to force Facebook to re-fetch the page and update the cache

### Step 3: Verify
After scraping, the preview should show:
- ✅ Retreat title
- ✅ Retreat description
- ✅ Retreat image
- ✅ Location, date, and price information

## How It Works

The app now:
1. **Dynamically sets Open Graph meta tags** when a retreat page loads
2. **Includes all retreat details** in the meta tags:
   - `og:title` - Retreat title
   - `og:description` - Retreat description
   - `og:image` - Retreat image (full URL from Supabase)
   - `og:url` - Retreat page URL
   - `og:type` - website
   - `og:site_name` - BookMyQuiltRetreat

3. **Share Dialog** provides:
   - Direct Facebook share button
   - Copy link functionality
   - Preview of what will be shared

## Important Notes

- **First Share**: Facebook needs to scrape the page first. Use the Sharing Debugger to force this.
- **Image Requirements**: 
  - Image must be publicly accessible (Supabase public URLs work)
  - Recommended size: 1200x630 pixels
  - Supported formats: JPG, PNG
- **Caching**: Facebook caches link previews. If you update a retreat, use the Sharing Debugger to refresh the cache.

## Future Improvements

For better SEO and social sharing without manual cache refresh:
- Consider server-side rendering (SSR) with Next.js
- Use a prerendering service (e.g., prerender.io)
- Create a Vercel serverless function to serve pre-rendered HTML for crawlers

