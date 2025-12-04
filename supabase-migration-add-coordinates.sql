-- Migration: Add latitude and longitude to service_locations
-- This enables travel time calculations using mapping APIs

-- Add coordinate columns to service_locations
ALTER TABLE public.service_locations
ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 8),
ADD COLUMN IF NOT EXISTS longitude NUMERIC(11, 8);

-- Add index for geospatial queries (if using PostGIS later)
CREATE INDEX IF NOT EXISTS idx_service_locations_coordinates 
ON public.service_locations(latitude, longitude) 
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Add comments
COMMENT ON COLUMN public.service_locations.latitude IS 'Latitude coordinate for the service location (for travel time calculations)';
COMMENT ON COLUMN public.service_locations.longitude IS 'Longitude coordinate for the service location (for travel time calculations)';

-- Note: You'll need to geocode existing addresses to populate these fields
-- Consider using Google Geocoding API or similar service

