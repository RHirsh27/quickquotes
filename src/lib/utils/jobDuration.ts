/**
 * Utility functions for calculating job duration from quote line items
 */

import type { QuoteLineItem, ServicePreset } from '@/lib/types'

export interface DurationCalculationResult {
  totalMinutes: number
  breakdown: Array<{
    item: string
    duration: number
    quantity: number
    total: number
  }>
  bufferMinutes: number
}

// Type for line items that may not have all fields
type LineItemInput = {
  id?: string
  label: string
  quantity: number
  service_preset_id?: string | null
}

/**
 * Calculate job duration based on quote line items
 * 
 * @param lineItems - Array of quote line items (can be partial QuoteLineItem or simple objects)
 * @param servicePresets - Array of service presets (for lookup by name or ID)
 * @param bufferMinutes - Additional buffer time for setup/cleanup (default: 15)
 * @returns Duration calculation result with breakdown
 */
export function calculateJobDuration(
  lineItems: LineItemInput[],
  servicePresets: ServicePreset[],
  bufferMinutes: number = 15
): DurationCalculationResult {
  const breakdown: Array<{
    item: string
    duration: number
    quantity: number
    total: number
  }> = []

  let totalMinutes = 0

  for (const item of lineItems) {
    let itemDuration = 0

    // Try to find matching service preset
    // First, try by service_preset_id if available
    let preset: ServicePreset | undefined

    if (item.service_preset_id) {
      preset = servicePresets.find(p => p.id === item.service_preset_id)
    }

    // If not found by ID, try to match by label (name)
    if (!preset) {
      preset = servicePresets.find(
        p => p.name.toLowerCase().trim() === item.label.toLowerCase().trim()
      )
    }

    // Use preset duration if found, otherwise default to 60 minutes
    if (preset && preset.default_duration_minutes) {
      itemDuration = preset.default_duration_minutes
    } else {
      // Default duration for unknown items
      itemDuration = 60
    }

    // Calculate total duration for this item (duration * quantity)
    const itemTotal = itemDuration * item.quantity
    totalMinutes += itemTotal

    breakdown.push({
      item: item.label,
      duration: itemDuration,
      quantity: item.quantity,
      total: itemTotal,
    })
  }

  // Add buffer time
  const finalTotal = totalMinutes + bufferMinutes

  return {
    totalMinutes: finalTotal,
    breakdown,
    bufferMinutes,
  }
}

/**
 * Format duration in minutes to a human-readable string
 * 
 * @param minutes - Duration in minutes
 * @returns Formatted string (e.g., "1h 30m" or "45m")
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`
  }

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  if (remainingMinutes === 0) {
    return `${hours}h`
  }

  return `${hours}h ${remainingMinutes}m`
}

