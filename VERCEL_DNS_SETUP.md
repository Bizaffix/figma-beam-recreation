# Vercel DNS Setup for Resend Domain Verification

This guide will help you add the required DNS records in Vercel to verify your domain with Resend.

## Step 1: Access Vercel DNS Settings

1. **Go to your Vercel Dashboard**: https://vercel.com/dashboard
2. **Select your project** (or go to your account settings)
3. **Navigate to Domains**:
   - Click on your project → **Settings** → **Domains**
   - OR go to **Account Settings** → **Domains** (if managing at account level)
4. **Select your domain**: `bookmyquiltretreat.com`
5. **Click on "DNS Records"** or "Configure DNS"

## Step 2: Add DNS Records

You need to add the following DNS records that Resend requires:

### 1. DKIM Record (Domain Verification)

**Type**: `TXT`  
**Name**: `resend._domainkey`  
**Value**: `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDTD8JrAmABlryxi/QsQ0ZALFuUVWAmQEi4//XWh7vEETDy6YFedYLN+P5BAm+ETCLNJ8g6daW9owl5rLOXugjBm2N9RmyVIeA5oWnfN9J1xNQVjV0bEU1RzYDTJY2FT8R9WJOcMULDjA6qPlAHMN+cM0twc0J3uFe1gojUaDT20wIDAQAB`  
**TTL**: Auto (or 3600)

**In Vercel:**
- Click **"Add Record"**
- Select **Type**: `TXT`
- **Name**: `resend._domainkey`
- **Value**: Paste the entire `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDTD8JrAmABlryxi/QsQ0ZALFuUVWAmQEi4//XWh7vEETDy6YFedYLN+P5BAm+ETCLNJ8g6daW9owl5rLOXugjBm2N9RmyVIeA5oWnfN9J1xNQVjV0bEU1RzYDTJY2FT8R9WJOcMULDjA6qPlAHMN+cM0twc0J3uFe1gojUaDT20wIDAQAB`
- **TTL**: Leave as default or set to 3600
- Click **"Save"**

### 2. SPF Record (Enable Sending)

**Type**: `TXT`  
**Name**: `send` (or `@` if Vercel requires it)  
**Value**: `v=spf1 include:amazonses.com ~all`  
**TTL**: 60 (or Auto)

**In Vercel:**
- Click **"Add Record"**
- Select **Type**: `TXT`
- **Name**: `send` (if Vercel shows a dropdown, you might need to use `@` or leave blank for root domain)
- **Value**: `v=spf1 include:amazonses.com ~all`
- **TTL**: 60 or Auto
- Click **"Save"**

### 3. MX Record (Enable Sending)

**Type**: `MX`  
**Name**: `send` (or `@` if Vercel requires it)  
**Value**: `feedback-smtp.ap-northeast-1.amazonses.com`  
**Priority**: `10`  
**TTL**: 60 (or Auto)

**In Vercel:**
- Click **"Add Record"**
- Select **Type**: `MX`
- **Name**: `send` (or `@` for root domain)
- **Value**: `feedback-smtp.ap-northeast-1.amazonses.com`
- **Priority**: `10`
- **TTL**: 60 or Auto
- Click **"Save"**

### 4. MX Record (Enable Receiving)

**Type**: `MX`  
**Name**: `@` (root domain)  
**Value**: `inbound-smtp.ap-northeast-1.amazonaws.com`  
**Priority**: `10`  
**TTL**: 60 (or Auto)

**In Vercel:**
- Click **"Add Record"**
- Select **Type**: `MX`
- **Name**: `@` (or leave blank for root domain)
- **Value**: `inbound-smtp.ap-northeast-1.amazonaws.com`
- **Priority**: `10`
- **TTL**: 60 or Auto
- Click **"Save"**

### 5. DMARC Record (Optional but Recommended)

**Type**: `TXT`  
**Name**: `_dmarc`  
**Value**: `v=DMARC1; p=none;`  
**TTL**: Auto (or 3600)

**In Vercel:**
- Click **"Add Record"**
- Select **Type**: `TXT`
- **Name**: `_dmarc`
- **Value**: `v=DMARC1; p=none;`
- **TTL**: Auto or 3600
- Click **"Save"**

## Step 3: Verify Records in Resend

1. **Wait 5-10 minutes** for DNS propagation (can take up to 24 hours, but usually faster)
2. **Go back to Resend Dashboard** → **Domains** → `bookmyquiltretreat.com`
3. **Click "Verify Records"** button
4. Resend will check if all records are properly configured

## Important Notes

### Vercel DNS Naming Conventions

Vercel might handle subdomain records differently:
- For root domain records, you might need to use `@` or leave the name field blank
- For subdomain records like `send`, enter `send` in the name field
- If Vercel shows a dropdown, select the appropriate option

### If Records Don't Appear

1. **Check DNS propagation**: Use tools like:
   - https://dnschecker.org
   - https://mxtoolbox.com
   - Enter your domain and check if the records appear

2. **Verify record format**: Make sure there are no extra spaces or line breaks in the values

3. **Wait longer**: DNS changes can take up to 48 hours to fully propagate globally

### Common Issues

**Issue**: "Record not found" in Resend verification
- **Solution**: Wait longer for DNS propagation (5-10 minutes minimum)
- Check that you entered the exact values (no typos)

**Issue**: Vercel doesn't allow certain record types
- **Solution**: If Vercel doesn't support MX records directly, you may need to:
  - Use Vercel's DNS provider settings
  - Or manage DNS through your domain registrar instead

**Issue**: Name field confusion
- **Solution**: 
  - For root domain: Use `@` or leave blank
  - For subdomains: Enter the subdomain name (e.g., `send`, `resend._domainkey`)

## Alternative: Use Domain Registrar DNS

If Vercel's DNS management is limited, you can:

1. **Point your domain's nameservers** to your domain registrar
2. **Add DNS records** directly in your registrar's DNS settings
3. **Use the same values** from Resend

## After Verification

Once all records are verified in Resend:

1. ✅ Your domain status will change to "Verified"
2. ✅ You can send emails from `notifications@bookmyquiltretreat.com` (or any email @bookmyquiltretreat.com)
3. ✅ Update your Edge Function to use your verified domain:
   ```typescript
   from: "BookMyQuiltRetreat <notifications@bookmyquiltretreat.com>",
   ```

## Testing

After verification, test sending an email:
1. Go to Resend Dashboard → **Emails** → **Send Test Email**
2. Send a test email to yourself
3. Check your inbox to confirm it's working

---

**Need Help?**
- Resend Support: https://resend.com/support
- Vercel DNS Docs: https://vercel.com/docs/concepts/projects/domains

