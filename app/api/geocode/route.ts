import { type NextRequest, NextResponse } from "next/server"

const API_KEY = process.env.OPENWEATHER_API_KEY

export async function GET(request: NextRequest) {
  if (!API_KEY) {
    return NextResponse.json({ error: "OpenWeather API key not configured" }, { status: 500 })
  }

  const { searchParams } = new URL(request.url)
  const city = searchParams.get("city")

  if (!city) {
    return NextResponse.json({ error: "City name is required" }, { status: 400 })
  }

  try {
    const response = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=5&appid=${API_KEY}`,
    )

    if (!response.ok) {
      throw new Error("Failed to fetch geocoding data")
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Geocoding API error:", error)
    return NextResponse.json({ error: "Failed to fetch location data" }, { status: 500 })
  }
}
