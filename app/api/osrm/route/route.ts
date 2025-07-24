import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const start = searchParams.get("start") // format: "lng,lat"
  const end = searchParams.get("end") // format: "lng,lat"

  if (!start || !end) {
    return NextResponse.json({ error: "Start and end coordinates are required" }, { status: 400 })
  }

  try {
    // Use OSRM demo server for routing
    const response = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${start};${end}?overview=full&geometries=geojson`,
      {
        headers: {
          "User-Agent": "Desert Journey Planner",
        },
      },
    )

    if (!response.ok) {
      throw new Error("OSRM API request failed")
    }

    const data = await response.json()

    if (data.code !== "Ok" || !data.routes || data.routes.length === 0) {
      return NextResponse.json({ error: "No route found between the selected locations" }, { status: 404 })
    }

    const route = data.routes[0]
    const leg = route.legs[0]

    // Format distance and duration
    const distanceKm = (route.distance / 1000).toFixed(1)
    const durationHours = Math.floor(route.duration / 3600)
    const durationMinutes = Math.floor((route.duration % 3600) / 60)

    const formattedDuration = durationHours > 0 ? `${durationHours}h ${durationMinutes}m` : `${durationMinutes} minutes`

    return NextResponse.json({
      distance: `${distanceKm} km`,
      duration: formattedDuration,
      coordinates: route.geometry.coordinates, // [lng, lat] format
      waypoints: data.waypoints,
    })
  } catch (error) {
    console.error("OSRM routing error:", error)
    return NextResponse.json({ error: "Failed to calculate route" }, { status: 500 })
  }
}
