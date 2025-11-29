# Troubleshooting 400 Bad Request Errors

## Quick Checklist

### 1. Check Browser Console
- Open DevTools (F12) → Console tab
- Look for error messages with details
- Check for `Error details:` logs that show Supabase error codes

### 2. Check Network Tab
- Open DevTools (F12) → Network tab
- Find the failed request (red/400 status)
- Click it to see:
  - **Request URL**: Is it correct?
  - **Request Payload**: What data is being sent?
  - **Response**: What error message does the server return?

### 3. Verify Environment Variables
In Vercel, ensure these are set:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 4. Check Supabase Dashboard
- Go to your Supabase project → **Logs** tab
- Look for API errors with 400 status
- Check the error message for specific field issues

### 5. Verify Database Schema
Run the SQL in `supabase-setup.sql` to ensure:
- All tables exist
- RLS policies are set correctly
- Required fields match your TypeScript types

## Common 400 Error Causes

### Issue 1: Missing Required Fields
**Symptom**: Error mentions a NOT NULL constraint
**Fix**: Ensure all required fields are provided:
- Customer: `name` is required
- Quote: All numeric fields must be valid numbers
- Line Items: `label`, `quantity`, `unit_price` are required

### Issue 2: Invalid Data Types
**Symptom**: Error mentions type mismatch
**Fix**: The code now converts all values:
- Numbers: `Number(value) || 0`
- Booleans: `Boolean(value)`
- Strings: `.trim()` or `null`

### Issue 3: Invalid UUID Format
**Symptom**: Error mentions foreign key constraint
**Fix**: Customer ID is validated to be a valid UUID format before use

### Issue 4: RLS Policy Blocking
**Symptom**: Error mentions permission denied
**Fix**: 
- Ensure you're authenticated
- Check RLS policies in Supabase
- Verify `user_id` matches authenticated user

### Issue 5: Missing Environment Variables
**Symptom**: Middleware or API calls fail
**Fix**: Set environment variables in Vercel project settings

## Enhanced Error Logging

The app now logs detailed error information:

```javascript
console.error('Error details:', {
  message: error.message,      // Human-readable error
  details: error.details,       // Specific field/constraint issue
  hint: error.hint,             // Suggested fix
  code: error.code              // Supabase error code
})
```

## Testing Steps

1. **Test Quote Creation**:
   - Select an existing customer OR create a new one
   - Add at least one line item with:
     - Label/description
     - Quantity > 0
     - Price >= 0
   - Check console for any validation errors

2. **Test Profile Update**:
   - All fields are optional (can be null)
   - Check console if update fails

3. **Check Supabase Logs**:
   - Go to Supabase Dashboard → Logs
   - Filter by "API" or "Database"
   - Look for 400 errors with specific messages

## Getting Help

If you're still seeing 400 errors, share:
1. The exact error message from console
2. The request payload from Network tab
3. The Supabase error code (if available)
4. Which action triggers it (create quote, update profile, etc.)

This will help identify the specific issue!

