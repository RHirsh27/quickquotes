# Appointment Reminders Setup Guide

This guide explains how to set up automated appointment reminder emails using Vercel Cron.

## Overview

The appointment reminder system sends email reminders to customers 24 hours before their scheduled appointments. It runs automatically every hour via Vercel Cron.

## Setup Steps

### 1. Database Migration

Run the migration to add the `reminder_sent` column to the `appointments` table:

```sql
-- Run this in your Supabase SQL Editor
-- File: supabase-migration-appointment-reminders.sql
```

This migration:
- Adds `reminder_sent` boolean column (default: `false`)
- Creates indexes for efficient querying
- Adds documentation comments

### 2. Environment Variables

Add the following environment variable to your Vercel project:

**`CRON_SECRET`** (Required)
- A secure random string used to authenticate cron requests
- Generate one using: `openssl rand -base64 32`
- Add it in Vercel Dashboard → Settings → Environment Variables

**Example:**
```
CRON_SECRET=your-secure-random-string-here
```

### 3. Vercel Cron Configuration

The cron job is configured in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/send-appointment-reminders",
      "schedule": "0 * * * *"
    }
  ]
}
```

This runs every hour at the top of the hour (e.g., 1:00 PM, 2:00 PM, etc.).

**To verify the cron job is set up:**
1. Deploy to Vercel
2. Go to Vercel Dashboard → Your Project → Settings → Cron Jobs
3. You should see the cron job listed

### 4. Email Configuration

Ensure you have:
- `RESEND_API_KEY` set in environment variables
- `DEFAULT_FROM_EMAIL` configured in `src/lib/resend.ts`
- Verified your sending domain in Resend

## How It Works

1. **Every hour**, Vercel calls `/api/cron/send-appointment-reminders`
2. The endpoint queries appointments where:
   - `status = 'confirmed'`
   - `reminder_sent = false`
   - `start_time` is between 24-25 hours from now
3. For each matching appointment:
   - Fetches customer email and team information
   - Sends reminder email via Resend
   - Updates `reminder_sent = true` in the database
4. Returns a summary of results

## Email Content

The reminder email includes:
- Service name (job title)
- Appointment date and time (formatted)
- Company name
- Company phone (if available)
- Professional HTML and plain text versions

## Testing

### Manual Testing

You can manually trigger the cron job for testing:

```bash
curl -X GET "https://your-domain.vercel.app/api/cron/send-appointment-reminders" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Local Testing

1. Create a test appointment with `start_time` 24-25 hours in the future
2. Set `reminder_sent = false`
3. Call the API route manually with the correct `CRON_SECRET`

## Monitoring

Check Vercel logs to monitor cron job execution:
1. Go to Vercel Dashboard → Your Project → Logs
2. Filter by the cron job path
3. Look for `[Cron]` prefixed log messages

## Troubleshooting

### Reminders Not Sending

1. **Check CRON_SECRET**: Ensure it matches in both Vercel and the API route
2. **Check Resend API Key**: Verify `RESEND_API_KEY` is set correctly
3. **Check Database**: Verify appointments exist with:
   - `status = 'confirmed'`
   - `reminder_sent = false`
   - `start_time` in the 24-25 hour window
4. **Check Vercel Cron**: Verify the cron job is enabled in Vercel Dashboard

### Email Delivery Issues

1. Check Resend dashboard for delivery status
2. Verify customer email addresses are valid
3. Check spam folders
4. Review Resend API logs

## Security Notes

- The cron endpoint requires `CRON_SECRET` authentication
- Only Vercel Cron can call this endpoint (with the secret)
- Never expose `CRON_SECRET` in client-side code
- Use a strong, random secret (at least 32 characters)

## Customization

### Change Reminder Timing

To send reminders at a different time (e.g., 48 hours before):

1. Update the time calculation in `src/app/api/cron/send-appointment-reminders/route.ts`:
   ```typescript
   const fortyEightHoursFromNow = new Date(now.getTime() + 48 * 60 * 60 * 1000)
   const fortyNineHoursFromNow = new Date(now.getTime() + 49 * 60 * 60 * 1000)
   ```

2. Update the query to use these new times

### Change Cron Schedule

Update `vercel.json` to change when the cron runs:
- `"0 * * * *"` - Every hour
- `"0 9 * * *"` - Daily at 9 AM
- `"0 */6 * * *"` - Every 6 hours

## Support

If you encounter issues:
1. Check Vercel logs for error messages
2. Verify all environment variables are set
3. Test the endpoint manually with curl
4. Check Resend dashboard for email delivery status

