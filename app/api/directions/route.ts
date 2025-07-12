import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const origin = searchParams.get("origin")
  const destination = searchParams.get("destination")

  if (!origin || !destination) {
    return NextResponse.json({ error: "Origin and destination are required" }, { status: 400 })
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&key=${process.env.GOOGLE_MAPS_API_KEY}`,
    )

    if (!response.ok) {
      throw new Error("Directions API request failed")
    }

    const data = await response.json()

    if (data.status === "OK") {
      const route = data.routes[0]
      const leg = route.legs[0]

      return NextResponse.json({
        distance: leg.distance.text,
        duration: leg.duration.text,
        steps: leg.steps.map((step: any) => ({
          lat: step.start_location.lat,
          lng: step.start_location.lng,
        })),
      })
    } else {
      throw new Error(`Directions API error: ${data.status}`)
    }
  } catch (error) {
    console.error("Directions API error:", error)
    return NextResponse.json({ error: "Failed to calculate route" }, { status: 500 })
  }
}
