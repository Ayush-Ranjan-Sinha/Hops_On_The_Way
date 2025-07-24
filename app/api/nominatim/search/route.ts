import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("q")

  if (!query || query.length < 3) {
    return NextResponse.json({ results: [] })
  }

  try {
    // Use Nominatim API for geocoding with enhanced parameters
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=8&addressdetails=1&extratags=1&namedetails=1&dedupe=1`,
      {
        headers: {
          "User-Agent": "Desert Route Optimizer (https://your-domain.com)", // Replace with your domain
        },
      },
    )

    if (!response.ok) {
      throw new Error("Nominatim API request failed")
    }

    const data = await response.json()

    // Filter and format results with better prioritization
    const results = data
      .filter((item: any) => item.lat && item.lon && item.display_name)
      .map((item: any) => ({
        place_id: item.place_id,
        name: item.name || item.display_name.split(",")[0],
        display_name: item.display_name,
        lat: item.lat,
        lon: item.lon,
        type: item.type,
        class: item.class,
        importance: item.importance || 0,
      }))
      .sort((a: any, b: any) => {
        // Prioritize by importance and type
        const typeScore = (item: any) => {
          if (item.class === "place" && ["city", "town", "village"].includes(item.type)) return 3
          if (item.class === "boundary" && item.type === "administrative") return 2
          if (item.class === "highway") return 1
          return 0
        }

        const scoreA = typeScore(a) + (a.importance || 0)
        const scoreB = typeScore(b) + (b.importance || 0)

        return scoreB - scoreA
      })
      .slice(0, 5)

    return NextResponse.json({ results })
  } catch (error) {
    console.error("Nominatim search error:", error)
    return NextResponse.json({ error: "Failed to search locations" }, { status: 500 })
  }
}
