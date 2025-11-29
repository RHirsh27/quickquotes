# Debugging 400 Bad Request Errors

## Step 1: Identify the Failing Request

1. Open Chrome DevTools (F12 or Right-click → Inspect)
2. Go to the **Network** tab
3. Reload the page or trigger the action causing the error
4. Look for requests with **red status** or **400** status code
5. Click on the failed request to see details

## Step 2: Check Request Details

### Headers Tab
- **Request URL**: Check if the URL is correct
- **Request Method**: Verify it matches what the API expects
- **Content-Type**: Should be `application/json` for JSON requests
- **Authorization**: Check if auth headers are present (if needed)

### Payload/Request Tab
- Check the data being sent
- Verify all required fields are present
- Ensure data types match what the API expects
- Look for null/undefined values in required fields

### Response Tab
- Read the error message from the server
- This often contains specific details about what's wrong

## Step 3: Common Issues in This App

### Supabase API Calls

**Issue**: Missing required fields in database inserts
- Check that all NOT NULL columns have values
- Verify foreign key references (user_id, customer_id, quote_id) are valid UUIDs

**Issue**: Invalid data types
- Numbers should be numbers, not strings
- Dates should be ISO strings
- Booleans should be true/false, not strings

**Issue**: RLS (Row Level Security) policies
- Ensure the user is authenticated
- Check that RLS policies allow the operation
- Verify user_id matches the authenticated user

### Specific Areas to Check

1. **Quote Creation** (`/quotes/new`)
   - Customer ID must be a valid UUID
   - All line items must have valid data
   - Tax rate should be a number (0-100)

2. **Profile Update** (`/profile`)
   - Fields can be null, but should be strings if provided
   - user_id must match authenticated user

3. **Customer Creation**
   - name is required (NOT NULL)
   - user_id must be set correctly

4. **Authentication**
   - Email must be valid format
   - Password must meet requirements
   - Check Supabase Auth settings

## Step 4: Quick Fixes to Try

### 1. Check Environment Variables
```bash
# Verify these are set in Vercel:
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### 2. Validate Data Before Sending
Add console.log before API calls:
```javascript
console.log('Sending data:', JSON.stringify(data, null, 2))
```

### 3. Check Supabase Dashboard
- Go to your Supabase project
- Check the **Logs** tab for detailed error messages
- Verify table schemas match your TypeScript types

### 4. Test with Minimal Data
Try creating a record with only required fields to isolate the issue.

## Step 5: Get More Details

If you can share:
1. The exact URL that's failing
2. The request payload/body
3. The response error message
4. Which page/action triggers it

I can help identify the specific issue!

