import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const coordinates = searchParams.get("coordinates")

  if (!coordinates) {
    return NextResponse.json({ error: "Coordinates are required" }, { status: 400 })
  }

  try {
    // Use OSRM trip endpoint for route optimization (TSP solver)
    const response = await fetch(
      `https://router.project-osrm.org/trip/v1/driving/${coordinates}?overview=full&geometries=geojson&source=first&destination=last&roundtrip=false`,
      {
        headers: {
          "User-Agent": "Desert Route Optimizer",
        },
      },
    )

    if (!response.ok) {
      throw new Error("OSRM API request failed")
    }

    const data = await response.json()

    if (data.code !== "Ok" || !data.trips || data.trips.length === 0) {
      return NextResponse.json({ error: "No optimized route found between the selected locations" }, { status: 404 })
    }

    const trip = data.trips[0]
    const waypoints = data.waypoints

    // Format distance and duration
    const distanceKm = (trip.distance / 1000).toFixed(1)
    const durationHours = Math.floor(trip.duration / 3600)
    const durationMinutes = Math.floor((trip.duration % 3600) / 60)

    const formattedDuration = durationHours > 0 ? `${durationHours}h ${durationMinutes}m` : `${durationMinutes} min`

    // OSRM returns waypoints in the OPTIMIZED order
    // We need to preserve this order and calculate distances between consecutive waypoints
    const waypointDetails = waypoints.map((waypoint: any, optimizedIndex: number) => {
      let distanceFromPrevious = "0 km"
      let durationFromPrevious = "0 min"

      if (optimizedIndex > 0) {
        // Calculate distance between consecutive waypoints in optimized route
        const leg = trip.legs[optimizedIndex - 1]
        if (leg) {
          const legDistanceKm = (leg.distance / 1000).toFixed(1)
          const legDurationHours = Math.floor(leg.duration / 3600)
          const legDurationMinutes = Math.floor((leg.duration % 3600) / 60)

          distanceFromPrevious = `${legDistanceKm} km`
          durationFromPrevious =
            legDurationHours > 0 ? `${legDurationHours}h ${legDurationMinutes}m` : `${legDurationMinutes} min`
        }
      }

      return {
        location: {
          name: `Stop ${optimizedIndex + 1}`, // This will be overridden on the client side
          display_name: `Optimized stop ${optimizedIndex + 1}`,
          lat: waypoint.location[1],
          lng: waypoint.location[0],
        },
        distance_from_previous: distanceFromPrevious,
        duration_from_previous: durationFromPrevious,
        waypoint_index: waypoint.waypoint_index,
        optimized_order: optimizedIndex, // This preserves the OSRM optimized order
      }
    })

    return NextResponse.json({
      distance: `${distanceKm} km`,
      duration: formattedDuration,
      coordinates: trip.geometry.coordinates, // [lng, lat] format
      waypoints: waypointDetails, // Already in optimized order from OSRM
      algorithm_info: {
        name: "Traveling Salesman Problem (TSP)",
        method: "Nearest Neighbor Heuristic + 2-opt improvements",
        description: "Finds the shortest route visiting all waypoints exactly once",
      },
    })
  } catch (error) {
    console.error("OSRM trip optimization error:", error)
    return NextResponse.json({ error: "Failed to optimize route" }, { status: 500 })
  }
}
