// Google Maps API integration utilities
import * as google from "google-maps"

export interface GoogleMapsConfig {
  apiKey: string
  libraries: string[]
}

export interface PlaceResult {
  place_id: string
  description: string
  structured_formatting: {
    main_text: string
    secondary_text: string
  }
}

export interface DirectionsResult {
  routes: Array<{
    legs: Array<{
      distance: { text: string; value: number }
      duration: { text: string; value: number }
      steps: Array<{
        start_location: { lat: number; lng: number }
        end_location: { lat: number; lng: number }
      }>
    }>
    overview_polyline: { points: string }
  }>
}

export class GoogleMapsService {
  private autocompleteService: google.maps.places.AutocompleteService | null = null
  private directionsService: google.maps.DirectionsService | null = null
  private placesService: google.maps.places.PlacesService | null = null

  constructor(private config: GoogleMapsConfig) {}

  async initialize(): Promise<void> {
    if (typeof window === "undefined") return

    return new Promise((resolve, reject) => {
      if (window.google?.maps) {
        this.initializeServices()
        resolve()
        return
      }

      const script = document.createElement("script")
      script.src = `https://maps.googleapis.com/maps/api/js?key=${this.config.apiKey}&libraries=${this.config.libraries.join(",")}`
      script.async = true
      script.defer = true

      script.onload = () => {
        this.initializeServices()
        resolve()
      }

      script.onerror = () => {
        reject(new Error("Failed to load Google Maps API"))
      }

      document.head.appendChild(script)
    })
  }

  private initializeServices(): void {
    if (!window.google?.maps) return

    this.autocompleteService = new google.maps.places.AutocompleteService()
    this.directionsService = new google.maps.DirectionsService()

    // Create a dummy div for PlacesService
    const div = document.createElement("div")
    this.placesService = new google.maps.places.PlacesService(div)
  }

  async getPlacePredictions(input: string): Promise<PlaceResult[]> {
    if (!this.autocompleteService || input.length < 3) {
      return []
    }

    return new Promise((resolve, reject) => {
      this.autocompleteService!.getPlacePredictions(
        {
          input,
          types: ["(cities)"],
          componentRestrictions: { country: [] }, // Remove to allow worldwide
        },
        (predictions, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
            resolve(predictions as PlaceResult[])
          } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
            resolve([])
          } else {
            reject(new Error(`Places API error: ${status}`))
          }
        },
      )
    })
  }

  async getDirections(origin: string, destination: string): Promise<DirectionsResult> {
    if (!this.directionsService) {
      throw new Error("Directions service not initialized")
    }

    return new Promise((resolve, reject) => {
      this.directionsService!.route(
        {
          origin,
          destination,
          travelMode: google.maps.TravelMode.DRIVING,
          unitSystem: google.maps.UnitSystem.METRIC,
          avoidHighways: false,
          avoidTolls: false,
        },
        (result, status) => {
          if (status === google.maps.DirectionsStatus.OK && result) {
            resolve(result as DirectionsResult)
          } else {
            reject(new Error(`Directions API error: ${status}`))
          }
        },
      )
    })
  }

  async getPlaceDetails(placeId: string): Promise<google.maps.places.PlaceResult> {
    if (!this.placesService) {
      throw new Error("Places service not initialized")
    }

    return new Promise((resolve, reject) => {
      this.placesService!.getDetails(
        {
          placeId,
          fields: ["name", "geometry", "formatted_address"],
        },
        (place, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && place) {
            resolve(place)
          } else {
            reject(new Error(`Place details API error: ${status}`))
          }
        },
      )
    })
  }
}

// Error handling utilities
export class GoogleMapsError extends Error {
  constructor(
    message: string,
    public code: string,
    public retryable = false,
  ) {
    super(message)
    this.name = "GoogleMapsError"
  }
}

export const handleGoogleMapsError = (error: any): GoogleMapsError => {
  if (error.code === "OVER_QUERY_LIMIT") {
    return new GoogleMapsError("API quota exceeded. Please try again later.", "QUOTA_EXCEEDED", true)
  }

  if (error.code === "REQUEST_DENIED") {
    return new GoogleMapsError("API key is invalid or restricted.", "INVALID_KEY", false)
  }

  if (error.code === "ZERO_RESULTS") {
    return new GoogleMapsError("No route found between the selected locations.", "NO_ROUTE", false)
  }

  return new GoogleMapsError(error.message || "An unknown error occurred", "UNKNOWN_ERROR", false)
}
