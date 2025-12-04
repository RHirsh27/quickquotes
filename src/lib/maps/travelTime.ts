/**
 * Travel Time Utilities using Google Maps Distance Matrix API
 * 
 * This module provides functions to calculate travel time between locations
 * for appointment scheduling conflict detection.
 */

export interface TravelTimeResult {
  durationMinutes: number
  distanceMeters: number
  status: 'OK' | 'ZERO_RESULTS' | 'NOT_FOUND' | 'ERROR'
  error?: string
}

export interface Location {
  latitude: number
  longitude: number
}

/**
 * Get travel time between two locations using Google Distance Matrix API
 * 
 * @param origin - Origin location (lat/long)
 * @param destination - Destination location (lat/long)
 * @param departureTime - Optional departure time (for traffic-aware estimates)
 * @returns Travel time result with duration in minutes
 */
export async function getTravelTime(
  origin: Location,
  destination: Location,
  departureTime?: Date
): Promise<TravelTimeResult> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    console.warn('[Travel Time] GOOGLE_MAPS_API_KEY not set. Returning default travel time.')
    return {
      durationMinutes: 30, // Default fallback
      distanceMeters: 0,
      status: 'ERROR',
      error: 'Google Maps API key not configured'
    }
  }

  try {
    // Format coordinates for Google API
    const origins = `${origin.latitude},${origin.longitude}`
    const destinations = `${destination.latitude},${destination.longitude}`

    // Build URL
    const baseUrl = 'https://maps.googleapis.com/maps/api/distancematrix/json'
    const params = new URLSearchParams({
      origins,
      destinations,
      key: apiKey,
      units: 'imperial', // or 'metric'
      mode: 'driving', // 'driving', 'walking', 'bicycling', 'transit'
    })

    // Add departure time if provided (for traffic-aware estimates)
    if (departureTime) {
      params.append('departure_time', Math.floor(departureTime.getTime() / 1000).toString())
      params.append('traffic_model', 'best_guess') // or 'pessimistic', 'optimistic'
    }

    const url = `${baseUrl}?${params.toString()}`

    const response = await fetch(url)
    const data = await response.json()

    if (data.status !== 'OK') {
      console.error('[Travel Time] API error:', data.status, data.error_message)
      return {
        durationMinutes: 30, // Default fallback
        distanceMeters: 0,
        status: 'ERROR',
        error: data.error_message || `API returned status: ${data.status}`
      }
    }

    const element = data.rows[0]?.elements[0]

    if (!element) {
      return {
        durationMinutes: 30,
        distanceMeters: 0,
        status: 'ZERO_RESULTS',
        error: 'No route found between locations'
      }
    }

    if (element.status !== 'OK') {
      return {
        durationMinutes: 30,
        distanceMeters: 0,
        status: element.status as 'NOT_FOUND' | 'ZERO_RESULTS',
        error: `Route status: ${element.status}`
      }
    }

    // Extract duration (in seconds) and convert to minutes
    // Use duration_in_traffic if available (traffic-aware), otherwise duration
    const durationSeconds = element.duration_in_traffic?.value || element.duration.value
    const durationMinutes = Math.ceil(durationSeconds / 60) // Round up to nearest minute

    // Extract distance (in meters)
    const distanceMeters = element.distance.value

    return {
      durationMinutes,
      distanceMeters,
      status: 'OK'
    }
  } catch (error: any) {
    console.error('[Travel Time] Error calling Google Distance Matrix API:', error)
    return {
      durationMinutes: 30, // Default fallback
      distanceMeters: 0,
      status: 'ERROR',
      error: error.message || 'Failed to calculate travel time'
    }
  }
}

/**
 * Geocode an address to get coordinates
 * Uses Google Geocoding API
 * 
 * @param address - Full address string
 * @returns Location coordinates or null
 */
export async function geocodeAddress(address: string): Promise<Location | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    console.warn('[Geocode] GOOGLE_MAPS_API_KEY not set.')
    return null
  }

  try {
    const baseUrl = 'https://maps.googleapis.com/maps/api/geocode/json'
    const params = new URLSearchParams({
      address,
      key: apiKey,
    })

    const url = `${baseUrl}?${params.toString()}`
    const response = await fetch(url)
    const data = await response.json()

    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      console.error('[Geocode] Failed to geocode address:', address, data.status)
      return null
    }

    const location = data.results[0].geometry.location

    return {
      latitude: location.lat,
      longitude: location.lng,
    }
  } catch (error: any) {
    console.error('[Geocode] Error geocoding address:', error)
    return null
  }
}

