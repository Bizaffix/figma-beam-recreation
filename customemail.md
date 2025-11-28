import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

interface CustomEmailData {
  emails: string[];
  subject: string;
  message: string;
  recipientType: 'students' | 'instructors';
}

// Helper function to delay execution (for rate limiting)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const emailData: CustomEmailData = await req.json()

    // Validate input
    if (!emailData.emails || emailData.emails.length === 0) {
      return new Response(
        JSON.stringify({ error: "No email addresses provided" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      )
    }

    if (!emailData.subject || !emailData.message) {
      return new Response(
        JSON.stringify({ error: "Subject and message are required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      )
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY") ?? ""

    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY environment variable is not set")
    }

    // Base URL for the application
    const baseUrl = Deno.env.get("VITE_APP_URL") || "https://www.bookmyquiltretreat.com"

    // Create HTML email content
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${emailData.subject}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">BookMyQuiltRetreat</h1>
  </div>
  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0; border-top: none;">
    <h2 style="color: #667eea; margin-top: 0;">${emailData.subject}</h2>
    <div style="white-space: pre-wrap; color: #333; line-height: 1.8;">
${emailData.message}
    </div>
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center;">
      <p style="color: #666; font-size: 14px; margin: 0;">
        Visit us at <a href="${baseUrl}" style="color: #667eea; text-decoration: none;">${baseUrl}</a>
      </p>
    </div>
  </div>
  <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
    <p>This email was sent to ${emailData.recipientType} from BookMyQuiltRetreat Admin.</p>
  </div>
</body>
</html>
    `.trim()

    // Create plain text version
    const emailText = `
${emailData.subject}

${emailData.message}

---
Visit us at ${baseUrl}

This email was sent to ${emailData.recipientType} from BookMyQuiltRetreat Admin.
    `.trim()

    // Send emails with rate limiting (2 per second - Resend's free tier limit)
    const results: Array<{ email: string; success: boolean; error?: string }> = []
    const batchSize = 2 // Send 2 emails per second
    const delayBetweenBatches = 1000 // 1 second delay between batches

    for (let i = 0; i < emailData.emails.length; i += batchSize) {
      const batch = emailData.emails.slice(i, i + batchSize)
      
      // Send batch of emails in parallel
      const batchPromises = batch.map(async (email) => {
        try {
          const resendResponse = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${resendApiKey}`,
            },
            body: JSON.stringify({
              from: "BookMyQuiltRetreat <notifications@bookmyquiltretreat.com>",
              to: email,
              subject: emailData.subject,
              html: emailHtml,
              text: emailText,
            }),
          })

          if (!resendResponse.ok) {
            const errorText = await resendResponse.text()
            console.error(`Failed to send email to ${email}:`, errorText)
            return { email, success: false, error: errorText }
          }

          return { email, success: true }
        } catch (error) {
          console.error(`Error sending email to ${email}:`, error)
          return { 
            email, 
            success: false, 
            error: error instanceof Error ? error.message : String(error) 
          }
        }
      })

      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)

      // Wait before sending next batch (except for the last batch)
      if (i + batchSize < emailData.emails.length) {
        await delay(delayBetweenBatches)
      }
    }

    // Count successes and failures
    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length

    // Return response
    return new Response(
      JSON.stringify({
        success: true,
        total: emailData.emails.length,
        sent: successCount,
        failed: failureCount,
        results: results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    )
  } catch (error) {
    console.error("Error in send-custom-email:", error)
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Failed to send emails",
        details: error instanceof Error ? error.stack : String(error)
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    )
  }
})