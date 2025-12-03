# 📧 Resend Email Setup Guide

## How to Get Your Resend API Key

**You do NOT create API keys programmatically.** Instead, follow these steps:

### Step 1: Sign Up for Resend
1. Go to https://resend.com
2. Click "Sign Up" or "Get Started"
3. Create an account (free tier available)

### Step 2: Get Your API Key
1. After signing up, go to https://resend.com/api-keys
2. You'll see your API key (starts with `re_`)
3. **Copy this key** - it looks like: `re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### Step 3: Add to Environment Variables
Add this to your **Vercel Environment Variables**:

```bash
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Steps**:
- [ ] Go to https://vercel.com/dashboard
- [ ] Select your project
- [ ] Settings → Environment Variables
- [ ] Add: `RESEND_API_KEY` = `[your-key-from-resend]`
- [ ] Set environment to: **Production, Preview, Development** (all)
- [ ] Save changes

### Step 4: Verify Domain (Optional but Recommended)
For production, you should verify your domain:

1. Go to https://resend.com/domains
2. Click "Add Domain"
3. Enter: `quotd.app` (or your domain)
4. Add the DNS records provided by Resend to your domain registrar
5. Wait for verification (usually 5-10 minutes)

**After verification**, update `src/lib/resend.ts`:
```typescript
export const DEFAULT_FROM_EMAIL = 'noreply@quotd.app' // ✅ Use your verified domain
```

---

## ❌ What NOT to Do

**DO NOT** try to create API keys programmatically like this:
```typescript
// ❌ WRONG - Don't do this
const resend = new Resend('re_xxxxxxxxx');
const { data, error } = await resend.apiKeys.create({ name: 'Production' });
```

**Why?**
- API keys are created in the Resend Dashboard, not programmatically
- The `apiKeys.create()` method is for managing API keys via their API (advanced use case)
- You need an existing API key to use the Resend SDK

---

## ✅ Correct Setup

Your code in `src/lib/resend.ts` is already correct:

```typescript
import { Resend } from 'resend'

// Initialize Resend client
const resendApiKey = process.env.RESEND_API_KEY

if (!resendApiKey) {
  console.warn('[Resend] RESEND_API_KEY is not set. Email functionality will be disabled.')
}

export const resend = resendApiKey ? new Resend(resendApiKey) : null

// Default from email (update this to your verified domain)
export const DEFAULT_FROM_EMAIL = 'noreply@quotd.app'
```

**What you need to do:**
1. Get your API key from Resend Dashboard
2. Add it to Vercel Environment Variables
3. (Optional) Verify your domain in Resend
4. (Optional) Update `DEFAULT_FROM_EMAIL` to use your verified domain

---

## 🧪 Testing

After setting up:

1. **Test Email Sending**:
   - Sign up a new user
   - Check if confirmation email arrives
   - Test password reset flow
   - Check spam folder if emails don't arrive

2. **Check Logs**:
   - Vercel Function Logs should show: `[Resend] Email sent successfully`
   - If you see: `[Resend] RESEND_API_KEY is not set`, the env var isn't configured

3. **Resend Dashboard**:
   - Go to https://resend.com/emails
   - You should see sent emails and their status

---

## 📚 Resources

- **Resend Docs**: https://resend.com/docs
- **Resend Dashboard**: https://resend.com/overview
- **API Keys**: https://resend.com/api-keys
- **Domains**: https://resend.com/domains

---

## 🆘 Troubleshooting

### Issue: "RESEND_API_KEY is not set"
**Fix**: Add `RESEND_API_KEY` to Vercel Environment Variables

### Issue: Emails not arriving
**Fix**: 
1. Check spam folder
2. Verify domain in Resend (if using custom domain)
3. Check Resend Dashboard → Emails for delivery status
4. Verify `DEFAULT_FROM_EMAIL` matches your verified domain

### Issue: "Invalid API key"
**Fix**: 
1. Go to Resend Dashboard → API Keys
2. Copy the correct API key (starts with `re_`)
3. Update Vercel Environment Variables
4. Redeploy your app

---

**That's it!** Once you add the API key to Vercel, your email functionality will work automatically. 🎉

