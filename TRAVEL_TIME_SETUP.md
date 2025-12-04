# Travel Time Warnings Setup Guide

This guide explains how to set up travel time warnings for appointment scheduling using Google Maps Platform.

## Overview

The travel time warning system automatically checks if technicians have enough time to travel between appointments. It uses Google Maps Distance Matrix API to calculate real-time travel times and warns dispatchers about scheduling conflicts.

## Setup Steps

### 1. Database Migration

Run the migration to add latitude and longitude columns to service locations:

```sql
-- Run this in your Supabase SQL Editor
-- File: supabase-migration-add-coordinates.sql
```

This migration:
- Adds `latitude` and `longitude` columns to `service_locations` table
- Creates indexes for efficient geospatial queries
- Adds documentation comments

### 2. Geocode Existing Addresses

You'll need to populate coordinates for existing service locations. You can:

**Option A: Use Google Geocoding API (Recommended)**
- Create a script to geocode all existing addresses
- Use the `geocodeAddress()` function from `src/lib/maps/travelTime.ts`

**Option B: Manual Entry**
- Update service locations through the UI (if you add a geocoding feature)
- Or manually update coordinates in Supabase Table Editor

**Option C: Batch Geocoding Script**
```typescript
// Example: Geocode all service locations
import { geocodeAddress } from '@/lib/maps/travelTime'
import { createClient } from '@/lib/supabase/client'

async function geocodeAllLocations() {
  const supabase = createClient()
  const { data: locations } = await supabase
    .from('service_locations')
    .select('*')
    .is('latitude', null)

  for (const location of locations || []) {
    const address = `${location.address_line_1}, ${location.city}, ${location.state} ${location.postal_code}`
    const coords = await geocodeAddress(address)
    
    if (coords) {
      await supabase
        .from('service_locations')
        .update({ latitude: coords.latitude, longitude: coords.longitude })
        .eq('id', location.id)
    }
  }
}
```

### 3. Google Maps API Setup

1. **Create a Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one

2. **Enable APIs**
   - Enable **Distance Matrix API**
   - Enable **Geocoding API** (for geocoding addresses)

3. **Create API Key**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "API Key"
   - **Important:** Restrict the API key:
     - Application restrictions: "HTTP referrers" (for web) or "IP addresses" (for server)
     - API restrictions: Select only "Distance Matrix API" and "Geocoding API"

4. **Add to Environment Variables**
   ```
   GOOGLE_MAPS_API_KEY=your-api-key-here
   ```
   - Add to Vercel Dashboard → Settings → Environment Variables
   - Add to `.env.local` for local development

### 4. Cost Considerations

**Google Distance Matrix API Pricing:**
- First 40,000 requests/month: Free
- $5.00 per 1,000 requests after that

**Google Geocoding API Pricing:**
- First $200 credit/month (approximately 40,000 requests)
- $5.00 per 1,000 requests after that

**Tips to Minimize Costs:**
- Cache travel times for common routes
- Only check travel time when user changes appointment details
- Use debouncing (already implemented - 500ms delay)
- Consider using Mapbox as alternative (cheaper for high volume)

## How It Works

### 1. When Creating/Editing Appointments

When a user selects a job, technician, and time:
1. System finds the previous appointment (immediately before) for that tech
2. System finds the next appointment (immediately after) for that tech
3. Calculates travel time from previous → new job
4. Calculates travel time from new job → next job
5. Compares available time vs required travel time
6. Shows warnings if conflicts detected

### 2. Warning Types

**Red Warning (Conflict):**
- Available time < Required travel time
- Example: "Conflict: Not enough travel time (Requires 45 mins, only 30 mins available)"
- User can still create appointment, but warned of conflict

**Yellow Warning (Tight Schedule):**
- Available time < Required travel time + 15 minutes buffer
- Example: "Tight schedule: Only 5 minutes buffer after travel time"
- User can proceed, but schedule is tight

**Green (OK):**
- Sufficient time with buffer
- Example: "No travel time conflicts detected"

### 3. Travel Time Calculation

- Uses Google Distance Matrix API
- Traffic-aware estimates (if departure time provided)
- Mode: Driving (can be changed to walking/bicycling/transit)
- Returns duration in minutes (rounded up)

## Features

- **Real-time Calculation:** Uses actual Google Maps data
- **Traffic-Aware:** Considers traffic conditions at departure time
- **Automatic Detection:** Checks both previous and next appointments
- **Visual Warnings:** Color-coded alerts (red/yellow/green)
- **Non-Blocking:** Warnings don't prevent appointment creation
- **Debounced:** Only checks after user stops typing (500ms delay)

## Testing

### Manual Testing

1. Create two service locations with coordinates
2. Create a job for each location
3. Schedule first appointment for a tech
4. Try to schedule second appointment immediately after
5. System should show travel time warning

### Test Coordinates

You can use these test coordinates:
- Location 1: `40.7128, -74.0060` (New York City)
- Location 2: `40.7589, -73.9851` (Times Square)
- Travel time: ~15-20 minutes

## Troubleshooting

### "Location coordinates not available"

- **Cause:** Service location doesn't have latitude/longitude
- **Fix:** Geocode the address or manually add coordinates

### "Unable to check travel time conflicts"

- **Cause:** Google Maps API key not set or invalid
- **Fix:** Verify `GOOGLE_MAPS_API_KEY` is set correctly

### API Errors

- Check Google Cloud Console for API quota/errors
- Verify API key restrictions allow your domain
- Check API is enabled in Google Cloud Console

### No Warnings Showing

- Verify service locations have coordinates
- Check browser console for errors
- Verify appointments exist before/after the proposed time
- Check network tab for API calls

## Alternative: Mapbox

If you prefer Mapbox (often cheaper for high volume):

1. Sign up at [Mapbox](https://www.mapbox.com/)
2. Get API access token
3. Update `src/lib/maps/travelTime.ts` to use Mapbox Directions API
4. API endpoint: `https://api.mapbox.com/directions/v5/mapbox/driving/{coordinates}`

## Future Enhancements

- Cache travel times for common routes
- Allow users to set default buffer time
- Show travel time on calendar view
- Optimize routes for multiple appointments
- Support different travel modes (walking, transit)

