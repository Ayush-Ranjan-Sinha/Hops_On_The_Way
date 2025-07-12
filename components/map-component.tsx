"use client"

import { useEffect, useRef, useState } from "react"
import { CaravanIcon as Camel } from "lucide-react"

interface Location {
  name: string
  display_name: string
  lat: number
  lng: number
}

interface Waypoint {
  id: string
  location: Location | null
  type: "start" | "hop" | "destination"
}

interface OptimizedRoute {
  distance: string
  duration: string
  coordinates: Array<[number, number]>
  waypoints: Array<{
    location: Location
    distance_from_previous: string
    duration_from_previous: string
    waypoint_index: number
  }>
}

interface MapComponentProps {
  waypoints: Waypoint[]
  optimizedRoute: OptimizedRoute | null
  className?: string
}

export default function MapComponent({ waypoints, optimizedRoute, className }: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const routeLayerRef = useRef<any>(null)
  const vehicleMarkerRef = useRef<any>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [vehiclePosition, setVehiclePosition] = useState(0)

  useEffect(() => {
    if (typeof window === "undefined") return

    // Dynamically import Leaflet to avoid SSR issues
    import("leaflet").then((L) => {
      // Fix for default markers in Leaflet
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
      })

      if (!mapInstanceRef.current && mapRef.current) {
        // Initialize map
        mapInstanceRef.current = L.map(mapRef.current, {
          center: [25.0, 45.0], // Middle East center
          zoom: 4,
          zoomControl: true,
        })

        // Add OpenStreetMap tiles with desert-like styling
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 18,
        }).addTo(mapInstanceRef.current)

        // Add custom CSS for desert theme
        const style = document.createElement("style")
        style.textContent = `
          .leaflet-container {
            background: linear-gradient(135deg, #fef3c7, #fed7aa, #fecaca) !important;
          }
          .leaflet-tile {
            filter: sepia(0.3) saturate(1.2) hue-rotate(15deg) brightness(1.1);
          }
          .custom-marker {
            transition: all 0.3s ease;
          }
          .custom-marker:hover {
            transform: scale(1.1);
          }
        `
        document.head.appendChild(style)
      }
    })

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!mapInstanceRef.current) return

    import("leaflet").then((L) => {
      // Clear existing markers
      markersRef.current.forEach((marker) => marker.remove())
      markersRef.current = []

      if (waypoints.length === 0) return

      waypoints.forEach((waypoint, index) => {
        if (!waypoint.location) return

        const getMarkerIcon = (type: string, index: number) => {
          let backgroundColor = "#f59e0b" // amber
          let label = `${index + 1}`

          switch (type) {
            case "start":
              backgroundColor = "#10b981" // green
              label = "S"
              break
            case "destination":
              backgroundColor = "#ef4444" // red
              label = "E"
              break
            default:
              backgroundColor = "#f59e0b" // amber
              label = `${index}`
              break
          }

          return L.divIcon({
            html: `<div style="background: ${backgroundColor}; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.3); font-weight: bold; font-size: 14px; border: 2px solid white;">${label}</div>`,
            className: "custom-marker",
            iconSize: [32, 32],
            iconAnchor: [16, 16],
          })
        }

        const marker = L.marker([waypoint.location.lat, waypoint.location.lng], {
          icon: getMarkerIcon(waypoint.type, index),
        })
          .addTo(mapInstanceRef.current)
          .bindPopup(
            `<div class="text-center">
              <strong>${waypoint.type === "start" ? "Start" : waypoint.type === "destination" ? "Destination" : `Hop ${index}`}:</strong><br>
              ${waypoint.location.name}
            </div>`,
          )

        markersRef.current.push(marker)
      })

      // Fit map to show all markers
      if (markersRef.current.length > 0) {
        const group = L.featureGroup(markersRef.current)
        mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1))
      }
    })
  }, [waypoints])

  useEffect(() => {
    if (!mapInstanceRef.current || !optimizedRoute) return

    import("leaflet").then((L) => {
      // Remove existing route
      if (routeLayerRef.current) {
        routeLayerRef.current.remove()
      }

      // Add route polyline
      const routeCoordinates = optimizedRoute.coordinates.map(([lng, lat]) => [lat, lng] as [number, number])

      routeLayerRef.current = L.polyline(routeCoordinates, {
        color: "#f59e0b",
        weight: 5,
        opacity: 0.8,
        dashArray: "10, 5",
      }).addTo(mapInstanceRef.current)

      // Fit map to route
      mapInstanceRef.current.fitBounds(routeLayerRef.current.getBounds().pad(0.1))

      // Start vehicle animation
      startVehicleAnimation(L, routeCoordinates)
    })
  }, [optimizedRoute])

  const startVehicleAnimation = (L: any, coordinates: [number, number][]) => {
    if (coordinates.length < 2) return

    setIsAnimating(true)
    setVehiclePosition(0)

    // Remove existing vehicle marker
    if (vehicleMarkerRef.current) {
      vehicleMarkerRef.current.remove()
    }

    // Create vehicle icon
    const vehicleIcon = L.divIcon({
      html: `<div style="background: #d97706; color: white; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 3px 12px rgba(0,0,0,0.4); border: 3px solid white; animation: pulse 2s infinite;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      </div>`,
      className: "vehicle-marker",
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    })

    vehicleMarkerRef.current = L.marker(coordinates[0], { icon: vehicleIcon }).addTo(mapInstanceRef.current)

    // Animate vehicle along the route
    const duration = 6000 // 6 seconds
    const startTime = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Calculate position along the route
      const totalSegments = coordinates.length - 1
      const currentSegment = Math.floor(progress * totalSegments)
      const segmentProgress = (progress * totalSegments) % 1

      if (currentSegment < totalSegments) {
        const start = coordinates[currentSegment]
        const end = coordinates[currentSegment + 1]

        const lat = start[0] + (end[0] - start[0]) * segmentProgress
        const lng = start[1] + (end[1] - start[1]) * segmentProgress

        vehicleMarkerRef.current.setLatLng([lat, lng])
      }

      setVehiclePosition(progress * 100)

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setIsAnimating(false)
      }
    }

    requestAnimationFrame(animate)
  }

  return (
    <div className={className}>
      <div ref={mapRef} className="w-full h-full relative">
        {waypoints.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-amber-100 via-orange-100 to-red-100 z-10">
            <div className="text-center text-amber-700/60">
              <Camel className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Add waypoints to plan your journey</p>
              <p className="text-sm">Start with a starting location and destination</p>
            </div>
          </div>
        )}
      </div>

      {/* Animation Progress */}
      {isAnimating && (
        <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-lg border border-amber-200">
          <div className="flex items-center gap-3">
            <Camel className="w-6 h-6 text-amber-600 animate-bounce" />
            <div className="flex-1">
              <div className="text-sm font-medium text-amber-800 mb-2">Desert journey in progress...</div>
              <div className="w-full bg-amber-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-amber-500 to-orange-500 h-3 rounded-full transition-all duration-100 shadow-sm"
                  style={{ width: `${vehiclePosition}%` }}
                />
              </div>
            </div>
            <div className="text-sm font-bold text-amber-700 bg-amber-100 px-2 py-1 rounded">
              {Math.round(vehiclePosition)}%
            </div>
          </div>
        </div>
      )}

      {/* Load Leaflet CSS */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        crossOrigin=""
      />
    </div>
  )
}
