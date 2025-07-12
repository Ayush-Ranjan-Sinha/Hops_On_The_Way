import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const input = searchParams.get("input")

  if (!input || input.length < 3) {
    return NextResponse.json({ predictions: [] })
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&types=(cities)&key=${process.env.GOOGLE_MAPS_API_KEY}`,
    )

    if (!response.ok) {
      throw new Error("Places API request failed")
    }

    const data = await response.json()

    if (data.status === "OK") {
      return NextResponse.json({ predictions: data.predictions })
    } else {
      throw new Error(`Places API error: ${data.status}`)
    }
  } catch (error) {
    console.error("Places API error:", error)
    return NextResponse.json({ error: "Failed to fetch place suggestions" }, { status: 500 })
  }
}
