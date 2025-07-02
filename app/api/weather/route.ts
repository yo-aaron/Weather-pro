import { type NextRequest, NextResponse } from "next/server"

const API_KEY = process.env.OPENWEATHER_API_KEY

export async function GET(request: NextRequest) {
  if (!API_KEY) {
    return NextResponse.json({ error: "OpenWeather API key not configured" }, { status: 500 })
  }

  const { searchParams } = new URL(request.url)
  const lat = searchParams.get("lat")
  const lon = searchParams.get("lon")
  const city = searchParams.get("city")

  let weatherUrl = "https://api.openweathermap.org/data/2.5/weather"
  let forecastUrl = "https://api.openweathermap.org/data/2.5/forecast"

  if (lat && lon) {
    weatherUrl += `?lat=${lat}&lon=${lon}&appid=${API_KEY}`
    forecastUrl += `?lat=${lat}&lon=${lon}&appid=${API_KEY}`
  } else if (city) {
    weatherUrl += `?q=${encodeURIComponent(city)}&appid=${API_KEY}`
    forecastUrl += `?q=${encodeURIComponent(city)}&appid=${API_KEY}`
  } else {
    return NextResponse.json({ error: "Either coordinates (lat, lon) or city name is required" }, { status: 400 })
  }

  try {
    const [weatherResponse, forecastResponse] = await Promise.all([fetch(weatherUrl), fetch(forecastUrl)])

    if (!weatherResponse.ok || !forecastResponse.ok) {
      throw new Error("Failed to fetch weather data")
    }

    const weatherData = await weatherResponse.json()
    const forecastData = await forecastResponse.json()

    return NextResponse.json({
      current: weatherData,
      forecast: forecastData,
    })
  } catch (error) {
    console.error("Weather API error:", error)
    return NextResponse.json({ error: "Failed to fetch weather data" }, { status: 500 })
  }
}
