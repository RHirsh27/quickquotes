# Password Reset Email Setup Guide

## Issue: Password Reset Emails Not Arriving

If password reset emails are not being received, check the following:

## 1. Supabase Dashboard Configuration

### Step 1: Configure Redirect URLs

1. Go to your **Supabase Dashboard** → **Authentication** → **URL Configuration**
2. Under **Redirect URLs**, add:
   - `http://localhost:3000/reset-password` (for local development)
   - `https://your-production-domain.com/reset-password` (for production)
   - `https://your-vercel-domain.vercel.app/reset-password` (for Vercel)

### Step 2: Configure Site URL

1. In **Authentication** → **URL Configuration**
2. Set **Site URL** to your production domain (or `http://localhost:3000` for local)

## 2. Email Provider Configuration

### Check Email Provider Settings

1. Go to **Supabase Dashboard** → **Authentication** → **Email Templates**
2. Verify that **Reset Password** template is enabled
3. Check if you're using:
   - **Supabase Email** (default, limited to 3 emails/hour on free tier)
   - **Custom SMTP** (recommended for production)

### If Using Custom SMTP

1. Go to **Project Settings** → **Auth** → **SMTP Settings**
2. Configure your SMTP provider (Gmail, SendGrid, etc.)
3. Test the connection

## 3. Check Email Spam Folder

- Password reset emails often go to spam
- Check your spam/junk folder
- Add `noreply@mail.app.supabase.io` to your contacts if using Supabase Email

## 4. Rate Limiting

Supabase free tier limits:
- **3 emails per hour** per user with default email provider
- If you've sent multiple reset requests, wait 1 hour before trying again

## 5. Verify Email Address

- Make sure the email address you're using is the one you signed up with
- Check for typos in the email address
- The email must exist in your Supabase `auth.users` table

## 6. Debug Steps

### Check Browser Console

1. Open browser DevTools (F12)
2. Go to Console tab
3. Try requesting a password reset
4. Look for any errors with `[Forgot Password]` prefix

### Check Supabase Logs

1. Go to **Supabase Dashboard** → **Logs** → **Auth Logs**
2. Look for password reset attempts
3. Check for any errors or rate limiting messages

### Check Vercel Function Logs

1. Go to **Vercel Dashboard** → Your Project → **Functions** → **Logs**
2. Look for any server-side errors

## 7. Common Issues

### Issue: "Email rate limit exceeded"
**Solution:** Wait 1 hour or upgrade to a custom SMTP provider

### Issue: "Invalid redirect URL"
**Solution:** Add the redirect URL to Supabase Dashboard → Authentication → Redirect URLs

### Issue: "User not found"
**Solution:** Make sure the email exists in your Supabase auth.users table

### Issue: Email goes to spam
**Solution:** 
- Check spam folder
- Configure SPF/DKIM records if using custom domain
- Use a reputable SMTP provider

## 8. Testing

1. Request a password reset
2. Check browser console for `[Forgot Password]` logs
3. Check email inbox (and spam folder)
4. Click the reset link in the email
5. Should redirect to `/reset-password` with a token in the URL hash

## 9. Production Checklist

- [ ] Redirect URLs configured in Supabase
- [ ] Site URL set correctly
- [ ] Custom SMTP configured (recommended)
- [ ] Email templates customized (optional)
- [ ] Tested on production domain

