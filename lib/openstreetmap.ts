// OpenStreetMap utilities for Nominatim and OSRM integration

export interface NominatimResult {
  place_id: string
  name: string
  display_name: string
  lat: string
  lon: string
  type: string
  importance: number
}

export interface OSRMRoute {
  distance: number // in meters
  duration: number // in seconds
  geometry: {
    coordinates: Array<[number, number]> // [lng, lat]
  }
  legs: Array<{
    distance: number
    duration: number
    steps: Array<{
      distance: number
      duration: number
      geometry: {
        coordinates: Array<[number, number]>
      }
    }>
  }>
}

export class OpenStreetMapService {
  private nominatimBaseUrl = "https://nominatim.openstreetmap.org"
  private osrmBaseUrl = "https://router.project-osrm.org"

  constructor(private userAgent = "Desert Journey Planner") {}

  async searchPlaces(query: string, limit = 5): Promise<NominatimResult[]> {
    if (query.length < 3) return []

    try {
      const response = await fetch(
        `${this.nominatimBaseUrl}/search?format=json&q=${encodeURIComponent(query)}&limit=${limit}&addressdetails=1`,
        {
          headers: {
            "User-Agent": this.userAgent,
          },
        },
      )

      if (!response.ok) {
        throw new Error(`Nominatim API error: ${response.status}`)
      }

      const data = await response.json()
      return data.filter((item: any) => item.lat && item.lon && item.display_name)
    } catch (error) {
      console.error("Nominatim search error:", error)
      throw new Error("Failed to search places")
    }
  }

  async calculateRoute(startLng: number, startLat: number, endLng: number, endLat: number): Promise<OSRMRoute> {
    try {
      const response = await fetch(
        `${this.osrmBaseUrl}/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`,
        {
          headers: {
            "User-Agent": this.userAgent,
          },
        },
      )

      if (!response.ok) {
        throw new Error(`OSRM API error: ${response.status}`)
      }

      const data = await response.json()

      if (data.code !== "Ok" || !data.routes || data.routes.length === 0) {
        throw new Error("No route found")
      }

      return data.routes[0]
    } catch (error) {
      console.error("OSRM routing error:", error)
      throw new Error("Failed to calculate route")
    }
  }

  async reverseGeocode(lat: number, lng: number): Promise<NominatimResult | null> {
    try {
      const response = await fetch(
        `${this.nominatimBaseUrl}/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
        {
          headers: {
            "User-Agent": this.userAgent,
          },
        },
      )

      if (!response.ok) {
        throw new Error(`Nominatim reverse geocoding error: ${response.status}`)
      }

      const data = await response.json()
      return data.display_name ? data : null
    } catch (error) {
      console.error("Reverse geocoding error:", error)
      return null
    }
  }

  formatDistance(meters: number): string {
    if (meters < 1000) {
      return `${Math.round(meters)} m`
    }
    return `${(meters / 1000).toFixed(1)} km`
  }

  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes} min`
  }
}

// Error handling
export class OpenStreetMapError extends Error {
  constructor(
    message: string,
    public code: string,
    public retryable = false,
  ) {
    super(message)
    this.name = "OpenStreetMapError"
  }
}

export const handleOSMError = (error: any): OpenStreetMapError => {
  if (error.message?.includes("No route found")) {
    return new OpenStreetMapError("No route found between the selected locations.", "NO_ROUTE", false)
  }

  if (error.message?.includes("API error: 429")) {
    return new OpenStreetMapError("Rate limit exceeded. Please try again in a moment.", "RATE_LIMIT", true)
  }

  if (error.message?.includes("API error: 5")) {
    return new OpenStreetMapError("Service temporarily unavailable. Please try again.", "SERVICE_ERROR", true)
  }

  return new OpenStreetMapError(error.message || "An unknown error occurred", "UNKNOWN_ERROR", false)
}
