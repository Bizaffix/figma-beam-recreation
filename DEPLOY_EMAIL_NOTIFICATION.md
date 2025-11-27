# Deploy Email Notification Edge Function

This guide shows how to deploy the `notify-new-retreat` edge function using the same method as your existing edge functions (`create-payment-intent` and `confirm-payment`).

## Prerequisites

You should already have:
- ✅ Supabase CLI installed and configured
- ✅ Your project linked to Supabase
- ✅ Experience deploying edge functions (you've already deployed `create-payment-intent` and `confirm-payment`)

## Step 1: Set Environment Variables (Secrets)

Before deploying, set the required secrets in Supabase:

### Via Supabase Dashboard:
1. Go to **Supabase Dashboard** → **Project Settings** → **Edge Functions** → **Secrets**
2. Add the following secrets:
   - `RESEND_API_KEY`: Your Resend API key (e.g., `re_xxxxxxxxxxxxx`)
   - `VITE_APP_URL`: Your application URL (optional, defaults to `https://www.bookmyquiltretreat.com`)

### Via CLI (if you prefer):
```bash
supabase secrets set RESEND_API_KEY=re_your_api_key_here
supabase secrets set VITE_APP_URL=https://www.bookmyquiltretreat.com
```

## Step 2: Deploy the Edge Function

Deploy using the same method you used for your other edge functions:

```bash
supabase functions deploy notify-new-retreat
```

### Edge Function Code

The complete edge function code is located at `supabase/functions/notify-new-retreat/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

interface RetreatData {
  retreatId: number;
  title: string;
  description: string;
  image: string;
  date: string;
  location: string;
  price: number;
  instructorId: string;
}

// Helper function to delay execution (for rate limiting)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const retreatData: RetreatData = await req.json()

    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? ""
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    const resendApiKey = Deno.env.get("RESEND_API_KEY") ?? ""

    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY environment variable is not set")
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch all students
    const { data: students, error: studentsError } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("role", "student")

    if (studentsError) {
      throw new Error(`Failed to fetch students: ${studentsError.message}`)
    }

    if (!students || students.length === 0) {
      return new Response(
        JSON.stringify({ message: "No students found to notify" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      )
    }

    // Fetch instructor information
    const { data: instructor } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", retreatData.instructorId)
      .single()

    const instructorName = instructor?.full_name || "Our Instructor"

    // Parse date for formatting
    const eventDate = new Date(retreatData.date)
    const formattedDate = eventDate.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })

    // Extract city and state from location
    let locationCityState = retreatData.location
    if (retreatData.location.includes("http")) {
      locationCityState = "See event details for location"
    }

    // Create description snippet (first 200 characters)
    const descriptionSnippet = retreatData.description
      ? retreatData.description.substring(0, 200) + (retreatData.description.length > 200 ? "..." : "")
      : "Join us for an amazing quilting retreat experience!"

    // Format price
    const priceInfo = retreatData.price > 0
      ? `$${retreatData.price.toLocaleString()}`
      : "Contact for pricing"

    // Base URL for the application
    const baseUrl = Deno.env.get("VITE_APP_URL") || "https://www.bookmyquiltretreat.com"
    const eventUrl = `${baseUrl}/retreat/${retreatData.retreatId}`

    // Helper function to convert Supabase image URLs to CDN/proxy URLs
    // This addresses Resend's recommendation to host images on your sending domain
    const getImageUrl = (imageUrl: string): string => {
      // If image is from Supabase storage, you might want to proxy it through your domain
      // For now, we'll use the original URL, but you can implement a proxy if needed
      // Example: return imageUrl.replace('supabase.co/storage', 'bookmyquiltretreat.com/api/proxy-image')
      return imageUrl
    }

    // Create email templates with personalized content
    const createEmailContent = (firstName: string) => {
      const imageUrl = retreatData.image ? getImageUrl(retreatData.image) : ""
      
      const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Quilt Retreat Just Added 🎉</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">New Quilt Retreat Just Added 🎉</h1>
  </div>
  
  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hi ${firstName},</p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">
      A new quilt retreat has just been posted on BookMyQuiltRetreat.com and you're invited to take a look!
    </p>
    
    ${imageUrl ? `
    <div style="margin: 20px 0; text-align: center;">
      <img src="${imageUrl}" alt="${retreatData.title}" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    </div>
    ` : ""}
    
    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <h2 style="color: #667eea; margin-top: 0; font-size: 24px;">${retreatData.title}</h2>
      
      <div style="margin: 15px 0;">
        <p style="margin: 5px 0; font-size: 16px;"><strong>📅 Dates:</strong> ${formattedDate}</p>
        <p style="margin: 5px 0; font-size: 16px;"><strong>📍 Location:</strong> ${locationCityState}</p>
        <p style="margin: 5px 0; font-size: 16px;"><strong>👤 Instructor:</strong> ${instructorName}</p>
        <p style="margin: 5px 0; font-size: 16px;"><strong>💰 Price:</strong> ${priceInfo}</p>
      </div>
      
      <div style="margin: 20px 0; padding: 15px; background: #f0f0f0; border-radius: 5px;">
        <p style="margin: 0; font-size: 14px; font-style: italic;">${descriptionSnippet}</p>
      </div>
      
      <div style="text-align: center; margin-top: 25px;">
        <a href="${eventUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          View Full Event & Register
        </a>
      </div>
    </div>
    
    <p style="font-size: 14px; color: #666; margin-top: 30px;">
      Spots are limited, so if it feels like your kind of stitching getaway, click through and save your seat.
    </p>
    
    <p style="font-size: 14px; margin-top: 30px;">
      Warmly,<br>
      <strong>The BookMyQuiltRetreat Team</strong>
    </p>
  </div>
</body>
</html>
      `

      const emailText = `
New Quilt Retreat Just Added 🎉

Hi ${firstName},

A new quilt retreat has just been posted on BookMyQuiltRetreat.com and you're invited to take a look!

${retreatData.title}

📅 Dates: ${formattedDate}
📍 Location: ${locationCityState}
👤 Instructor: ${instructorName}
💰 Price: ${priceInfo}

${descriptionSnippet}

View the full event and register: ${eventUrl}

Spots are limited, so if it feels like your kind of stitching getaway, click through and save your seat.

Warmly,
The BookMyQuiltRetreat Team
      `

      return { html: emailHtml, text: emailText }
    }

    // Send emails with rate limiting (2 per second - Resend's free tier limit)
    const results: Array<{ email: string; success: boolean; error?: string }> = []
    const batchSize = 2 // Send 2 emails per second
    const delayBetweenBatches = 1000 // 1 second delay between batches

    for (let i = 0; i < students.length; i += batchSize) {
      const batch = students.slice(i, i + batchSize)
      
      // Send batch of emails in parallel with personalized content
      const batchPromises = batch.map(async (student) => {
        const firstName = student.full_name?.split(" ")[0] || "Quilter"
        const emailContent = createEmailContent(firstName)
        
        try {
          const resendResponse = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${resendApiKey}`,
            },
            body: JSON.stringify({
              from: "BookMyQuiltRetreat <notifications@bookmyquiltretreat.com>",
              to: student.email,
              subject: "New Quilt Retreat Just Added 🎉",
              html: emailContent.html,
              text: emailContent.text,
            }),
          })

          if (!resendResponse.ok) {
            const errorText = await resendResponse.text()
            console.error(`Failed to send email to ${student.email}:`, errorText)
            return { email: student.email, success: false, error: errorText }
          }

          return { email: student.email, success: true }
        } catch (error) {
          console.error(`Error sending email to ${student.email}:`, error)
          return { 
            email: student.email, 
            success: false, 
            error: error instanceof Error ? error.message : String(error) 
          }
        }
      })

      // Wait for batch to complete
      const batchResults = await Promise.allSettled(batchPromises)
      batchResults.forEach((result) => {
        if (result.status === "fulfilled") {
          results.push(result.value)
        } else {
          console.error("Batch promise rejected:", result.reason)
        }
      })

      // Wait before sending next batch (except for the last batch)
      if (i + batchSize < students.length) {
        await delay(delayBetweenBatches)
      }
    }

    const successful = results.filter((r) => r.success).length
    const failed = results.filter((r) => !r.success).length

    // Log failed emails for debugging
    if (failed > 0) {
      const failedEmails = results.filter((r) => !r.success)
      console.error("Failed emails:", failedEmails.map((r) => ({ email: r.email, error: r.error })))
    }

    return new Response(
      JSON.stringify({
        message: `Email notifications sent to ${successful} students${failed > 0 ? `, ${failed} failed` : ""}`,
        successful,
        failed,
        total: students.length,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    )
  } catch (error) {
    console.error("Error in notify-new-retreat function:", error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    )
  }
})
```

**Key Features:**
- ✅ Rate limiting: Sends 2 emails per second (respects Resend's free tier limit)
- ✅ Personalized emails: Each student gets an email with their first name
- ✅ Error handling: Logs failed emails with detailed error messages
- ✅ Image URL handling: Includes helper function for future image proxy implementation

This will:
- Deploy the function from `supabase/functions/notify-new-retreat/index.ts`
- Use the same project configuration as your other functions
- Make it available at: `https://[your-project-ref].supabase.co/functions/v1/notify-new-retreat`

## Step 3: Verify Deployment

1. **Check in Supabase Dashboard**:
   - Go to **Edge Functions** in your Supabase dashboard
   - You should see `notify-new-retreat` listed alongside `create-payment-intent` and `confirm-payment`

2. **Test the function** (optional):
   ```bash
   # Test locally first (if you want)
   supabase functions serve notify-new-retreat
   ```

## Step 4: Verify Integration

The function is already integrated in your code:
- ✅ `src/lib/email-notifications.ts` - calls the edge function
- ✅ `src/pages/InstructorRetreatForm.tsx` - triggers on retreat creation
- ✅ `src/pages/InstructorDashboard.tsx` - triggers on retreat publish/update

## How It Works

Just like your existing edge functions:

1. **Client calls the function**:
   ```typescript
   // In src/lib/email-notifications.ts
   await supabase.functions.invoke('notify-new-retreat', { body: {...} })
   ```

2. **Edge function processes the request**:
   - Handles CORS (same pattern as your other functions)
   - Fetches all students from `profiles` table
   - Sends emails via Resend API
   - Returns success/error response

3. **Error handling**:
   - Uses the same error handling pattern as `confirmPayment` in `stripe-payment.ts`
   - Logs errors for debugging
   - Non-blocking (doesn't prevent retreat creation if email fails)

## Testing

1. **Create a test retreat**:
   - Go to Instructor Dashboard
   - Create a new retreat
   - Set `published: true`
   - Save

2. **Check logs**:
   ```bash
   supabase functions logs notify-new-retreat
   ```

3. **Verify emails**:
   - Check Resend dashboard for sent emails
   - Check student email inboxes

## Image Hosting (Resend Recommendation)

**⚠️ Important**: Resend recommends hosting images on your sending domain for better deliverability, especially with Gmail.

Currently, images are served from Supabase Storage URLs (e.g., `https://gxyhzeihzxjqaqrdhsnr.supabase.co/storage/...`). 

### Option 1: Proxy Images Through Your Domain (Recommended)

Create a proxy endpoint on your domain to serve images:

1. **Create a proxy route** in your application (e.g., `/api/proxy-image?url=...`)
2. **Update the `getImageUrl` function** in the edge function to use your proxy:
   ```typescript
   const getImageUrl = (imageUrl: string): string => {
     if (imageUrl.includes('supabase.co')) {
       // Proxy through your domain
       const encodedUrl = encodeURIComponent(imageUrl)
       return `https://www.bookmyquiltretreat.com/api/proxy-image?url=${encodedUrl}`
     }
     return imageUrl
   }
   ```

### Option 2: Use a CDN on Your Domain

1. Set up a CDN (Cloudflare, AWS CloudFront, etc.) on a subdomain like `cdn.bookmyquiltretreat.com`
2. Configure it to proxy Supabase Storage
3. Update image URLs to use the CDN domain

### Option 3: Upload Images to Your Domain

1. Set up image hosting on your domain (e.g., `/images/retreats/`)
2. Upload retreat images to your own server/CDN
3. Update the image URLs in your database

**Note**: For now, the function works with Supabase Storage URLs, but implementing a proxy will improve email deliverability.

## Troubleshooting

### Function not found
- Make sure you deployed: `supabase functions deploy notify-new-retreat`
- Check function name matches exactly: `notify-new-retreat`

### RESEND_API_KEY error
- Verify the secret is set: `supabase secrets list`
- Make sure the key starts with `re_`

### No emails sent / Rate limit errors
- **Rate limiting**: The function sends 2 emails per second. For 9 students, this takes ~4-5 seconds
- Check Resend dashboard for errors
- Verify domain is verified in Resend
- Check edge function logs: `supabase functions logs notify-new-retreat`
- If you upgrade Resend plan, you can increase `batchSize` in the code

### CORS errors
- The function already handles CORS (same as your other functions)
- If issues persist, check the CORS headers match your other functions

### Image hosting warnings in Resend
- This is a recommendation, not an error
- Emails will still send, but deliverability may be affected
- See "Image Hosting" section above for solutions

## Function Structure

The function follows the same pattern as your existing functions:

```typescript
// Same CORS headers
const corsHeaders = { ... }

// Same serve pattern
serve(async (req) => {
  // Handle OPTIONS
  if (req.method === "OPTIONS") { ... }
  
  // Process request
  try {
    const data = await req.json()
    // ... process ...
    return new Response(JSON.stringify({...}), { headers: corsHeaders })
  } catch (error) {
    return new Response(JSON.stringify({error: ...}), { status: 500 })
  }
})
```

## Next Steps

Once deployed:
1. ✅ Emails will automatically send when retreats are published
2. ✅ No code changes needed - already integrated
3. ✅ Monitor via Supabase Edge Function logs
4. ✅ Check Resend dashboard for email delivery stats

---

**Note**: This follows the exact same deployment pattern as your `create-payment-intent` and `confirm-payment` functions. If those are working, this should work the same way!

