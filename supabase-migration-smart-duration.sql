-- Migration: Add default_duration_minutes to service_presets table
-- This enables "Smart Duration" estimates for jobs based on quote line items

-- Add default_duration_minutes column to service_presets
ALTER TABLE public.service_presets
ADD COLUMN IF NOT EXISTS default_duration_minutes INTEGER DEFAULT 60 NOT NULL;

-- Add index for efficient querying
CREATE INDEX IF NOT EXISTS idx_service_presets_duration 
ON public.service_presets(default_duration_minutes);

-- Add comment
COMMENT ON COLUMN public.service_presets.default_duration_minutes IS 'Default duration in minutes for this service when creating jobs. Used for smart duration estimates.';

-- Optional: Add service_preset_id to quote_line_items for better tracking
-- This allows direct reference to the service preset used
ALTER TABLE public.quote_line_items
ADD COLUMN IF NOT EXISTS service_preset_id UUID REFERENCES public.service_presets(id) ON DELETE SET NULL;

-- Add index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_quote_line_items_service_preset 
ON public.quote_line_items(service_preset_id) 
WHERE service_preset_id IS NOT NULL;

-- Add comment
COMMENT ON COLUMN public.quote_line_items.service_preset_id IS 'Optional reference to the service preset used for this line item. Enables smart duration calculations.';

