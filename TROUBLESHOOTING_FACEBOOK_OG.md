# Troubleshooting Facebook OG Image Issue

## Current Status
Facebook's Sharing Debugger is still showing the warning: "The 'og:image' property should be explicitly provided"

## What Was Fixed

1. **Improved User Agent Detection**
   - Enhanced crawler detection to catch Facebook's crawler more reliably
   - Added fallback patterns for bot detection

2. **Fixed TypeScript Errors**
   - Properly handle VercelRequest headers (can be string or string[])

3. **Improved HTML Escaping**
   - Properly escape special characters in titles and descriptions to prevent issues

4. **Better Response Handling**
   - Changed from `res.send()` to `res.end()` for more reliable responses
   - Added proper headers

## Next Steps to Fix

### 1. Deploy to Vercel
The serverless function must be deployed for it to work:

```bash
# Make sure you're committed and pushed
git add .
git commit -m "Add Facebook OG image support"
git push

# Or deploy directly via Vercel CLI
vercel --prod
```

### 2. Verify Function is Deployed
- Go to your Vercel dashboard
- Check the "Functions" tab
- You should see `/api/retreat/[id]` listed

### 3. Test the Function Directly
Test if the function is working by visiting:
```
https://www.bookmyquiltretreat.com/api/retreat/9
```

You should see HTML with meta tags if it's a crawler, or the React app if it's a normal browser.

### 4. Check Environment Variables
Make sure these are set in Vercel:
- `VITE_SUPABASE_URL` (or `NEXT_PUBLIC_SUPABASE_URL`)
- `VITE_SUPABASE_ANON_KEY` (or `NEXT_PUBLIC_SUPABASE_ANON_KEY`)

### 5. Test with Facebook Sharing Debugger
1. Go to https://developers.facebook.com/tools/debug/
2. Enter: `https://www.bookmyquiltretreat.com/retreat/9`
3. Click "Debug" then "Scrape Again"
4. Check the "Scraped URL" tab to see what Facebook actually sees

## Debugging Tips

### Check Vercel Function Logs
1. Go to Vercel Dashboard → Your Project → Functions
2. Click on `/api/retreat/[id]`
3. Check the logs for any errors

### Test Crawler Detection
You can test if crawler detection works by setting your user agent:
```bash
curl -H "User-Agent: facebookexternalhit/1.1" https://www.bookmyquiltretreat.com/retreat/9
```

This should return HTML with meta tags.

### Verify Rewrite is Working
The `vercel.json` should have:
```json
{
  "rewrites": [
    {
      "source": "/retreat/:id",
      "destination": "/api/retreat/:id"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

## Common Issues

### Issue: Function not found (404)
- **Solution**: Make sure the file is at `api/retreat/[id].ts` (not `api/retreat/[id].js`)
- **Solution**: Redeploy to Vercel

### Issue: Environment variables not set
- **Solution**: Add them in Vercel Dashboard → Settings → Environment Variables

### Issue: Still seeing old meta tags
- **Solution**: Facebook caches results. Use "Scrape Again" in Sharing Debugger
- **Solution**: Clear Facebook's cache: https://developers.facebook.com/tools/debug/og/object/

### Issue: Response Code 206 (Partial Content)
- This might indicate the function isn't handling the request correctly
- Check Vercel function logs for errors
- Verify the function is deployed and accessible

## Expected Result

After deploying and testing, Facebook's Sharing Debugger should show:
- ✅ `og:image` property is present
- ✅ Image URL is valid and accessible
- ✅ All Open Graph tags are present
- ✅ No warnings about missing `og:image`

