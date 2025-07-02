import { Sun, Cloud, CloudRain, CloudSnow, CloudDrizzle, Zap, CloudFog, type LucideIcon } from "lucide-react"

export function getWeatherIcon(iconCode: string, condition: string): LucideIcon {
  const iconMap: Record<string, LucideIcon> = {
    "01d": Sun, // clear sky day
    "01n": Sun, // clear sky night
    "02d": Cloud, // few clouds day
    "02n": Cloud, // few clouds night
    "03d": Cloud, // scattered clouds
    "03n": Cloud,
    "04d": Cloud, // broken clouds
    "04n": Cloud,
    "09d": CloudDrizzle, // shower rain
    "09n": CloudDrizzle,
    "10d": CloudRain, // rain day
    "10n": CloudRain, // rain night
    "11d": Zap, // thunderstorm
    "11n": Zap,
    "13d": CloudSnow, // snow
    "13n": CloudSnow,
    "50d": CloudFog, // mist
    "50n": CloudFog,
  }

  return iconMap[iconCode] || Cloud
}

export function formatTime(timestamp: number, timezone: number): string {
  const date = new Date((timestamp + timezone) * 1000)
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
}

export function formatDate(timestamp: number): string {
  const date = new Date(timestamp * 1000)
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  })
}

export function kelvinToCelsius(kelvin: number): number {
  return Math.round(kelvin - 273.15)
}

export function mpsToKmh(mps: number): number {
  return Math.round(mps * 3.6)
}

export function getUVIndex(lat: number, lon: number): Promise<number> {
  // This would typically require a separate API call to OpenWeatherMap's UV Index API
  // For now, we'll return a mock value
  return Promise.resolve(Math.floor(Math.random() * 11))
}
