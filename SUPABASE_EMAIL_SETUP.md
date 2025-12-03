# Supabase Email Configuration Guide

## Issue: Email Confirmation Emails Not Sending

If users aren't receiving email confirmation emails after signup, follow these steps:

### 1. Check Email Confirmation Settings

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **Authentication** → **Settings** → **Email Auth**
4. Verify the following settings:

   **Email Confirmation:**
   - ✅ **Enable email confirmations** should be ON (for production)
   - ⚠️ **Disable email confirmations** can be ON for development/testing

   **Email Templates:**
   - Check that the "Confirm signup" template is enabled
   - Customize the email template if needed

### 2. Configure Redirect URLs

1. In Supabase Dashboard, go to **Authentication** → **URL Configuration**
2. Add your redirect URLs to the **Redirect URLs** list:

   **For Production:**
   ```
   https://www.quotd.app/auth/callback
   https://quotd.app/auth/callback
   ```

   **For Development:**
   ```
   http://localhost:3000/auth/callback
   ```

   **Site URL** should be set to:
   ```
   https://www.quotd.app
   ```
   (or `http://localhost:3000` for development)

### 3. Configure SMTP (Required for Production)

By default, Supabase uses their own email service, but it has rate limits. For production, you should configure custom SMTP:

1. Go to **Authentication** → **Settings** → **SMTP Settings**
2. Enable **Custom SMTP**
3. Configure your SMTP provider (Gmail, SendGrid, Mailgun, etc.):

   **Example for Gmail:**
   - Host: `smtp.gmail.com`
   - Port: `587`
   - Username: `your-email@gmail.com`
   - Password: `your-app-password` (not your regular password!)
   - Sender email: `your-email@gmail.com`
   - Sender name: `Quotd`

   **Example for SendGrid:**
   - Host: `smtp.sendgrid.net`
   - Port: `587`
   - Username: `apikey`
   - Password: `your-sendgrid-api-key`
   - Sender email: `noreply@quotd.app`
   - Sender name: `Quotd`

### 4. Test Email Configuration

1. Go to **Authentication** → **Users**
2. Click **Invite user** or try signing up with a test email
3. Check your email inbox (and spam folder)
4. Check Supabase logs: **Logs** → **Auth Logs** for any errors

### 5. Check Email Rate Limits

Supabase free tier has email rate limits:
- **Free tier**: 3 emails per hour per user
- **Pro tier**: Higher limits

If you're hitting rate limits, you'll see errors in the Auth Logs.

### 6. Verify Email Template

1. Go to **Authentication** → **Email Templates**
2. Check the **Confirm signup** template
3. The template should include a link like this:

   ```html
   <h2>Confirm your signup</h2>
   
   <p>Follow this link to confirm your user:</p>
   
   <p><a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=signup">Confirm your email</a></p>
   ```

4. **Important**: Make sure:
   - `{{ .SiteURL }}` is used (Supabase will replace this with your Site URL)
   - `{{ .TokenHash }}` is used (Supabase will replace this with the actual token)
   - The path is `/auth/callback` (matches your callback route)
   - Parameters are `token_hash` and `type=signup`

5. **Alternative**: You can also use `{{ .ConfirmationURL }}` which includes everything:
   ```html
   <a href="{{ .ConfirmationURL }}">Confirm your email</a>
   ```
   But make sure your Site URL and Redirect URLs are configured correctly.

### 7. Common Issues

**Issue: Emails go to spam**
- Solution: Configure SPF/DKIM records for your domain
- Use a custom domain email (not Gmail) for better deliverability

**Issue: "Email rate limit exceeded"**
- Solution: Upgrade to Pro tier or configure custom SMTP

**Issue: Emails not sending at all**
- Solution: Check SMTP configuration, verify credentials
- Check Supabase Auth Logs for error messages
- Ensure email confirmations are enabled

### 8. Development Workaround

For local development, you can:
1. Disable email confirmations in Supabase Dashboard
2. Users will be automatically confirmed on signup
3. **Remember to re-enable for production!**

### 9. Code Verification

The signup code in `src/app/(auth)/login/page.tsx` sets:
```typescript
emailRedirectTo: `${baseUrl}/auth/callback`
```

Make sure this matches your Supabase redirect URL configuration.

## Quick Checklist

- [ ] **Email confirmations enabled** in Supabase Dashboard (Authentication → Settings → Email Auth)
- [ ] **Site URL** set to `https://www.quotd.app` (or your production domain)
- [ ] **Redirect URLs** include:
  - `https://www.quotd.app/auth/callback`
  - `https://quotd.app/auth/callback` (if using both domains)
  - `http://localhost:3000/auth/callback` (for development)
- [ ] **Email template** uses correct format:
  - `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=signup`
  - OR `{{ .ConfirmationURL }}`
- [ ] **SMTP configured** (for production - optional but recommended)
- [ ] **No rate limit errors** in Auth Logs
- [ ] **Test email received** successfully (check spam folder too!)

## Email Template Example (Current Configuration)

Your email template should look like this:

```html
<h2>Confirm your signup</h2>

<p>Follow this link to confirm your user:</p>

<p><a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=signup">Confirm your email</a></p>
```

This matches your callback route at `src/app/auth/callback/route.ts` which handles `token_hash` and `type=signup` parameters.

## Need Help?

If emails still aren't sending:
1. Check Supabase Auth Logs for specific error messages
2. Verify SMTP credentials are correct
3. Test with a different email provider
4. Contact Supabase support if issue persists

