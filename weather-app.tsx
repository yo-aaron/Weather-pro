"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Sun, Wind, Droplets, Eye, Thermometer, MapPin, Search, RefreshCw, AlertCircle, Loader2 } from "lucide-react"
import { useGeolocation } from "./hooks/use-geolocation"
import { WeatherSkeleton } from "./components/weather-skeleton"
import { getWeatherIcon, formatDate, kelvinToCelsius, mpsToKmh } from "./lib/weather-utils"
import type { WeatherData, HourlyForecast, DailyForecast, OpenWeatherResponse, ForecastResponse } from "./types/weather"

export default function WeatherApp() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [hourlyForecast, setHourlyForecast] = useState<HourlyForecast[]>([])
  const [dailyForecast, setDailyForecast] = useState<DailyForecast[]>([])
  const [error, setError] = useState<string | null>(null)
  const [searchSuggestions, setSearchSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  const { latitude, longitude, error: geoError, loading: geoLoading } = useGeolocation()

  const hasApiKey = process.env.OPENWEATHER_API_KEY === "f199fe771f7889dd6b9789c79df70b0d"

  // Add mock data for preview
  const mockWeatherData: WeatherData = {
    location: "San Francisco, CA",
    temperature: 24,
    condition: "Clear",
    description: "clear sky",
    humidity: 65,
    windSpeed: 12,
    visibility: 10,
    uvIndex: 6,
    feelsLike: 26,
    pressure: 1013,
    sunrise: 1640995200,
    sunset: 1641031200,
    coordinates: { lat: 37.7749, lon: -122.4194 },
  }

  const mockHourlyForecast: HourlyForecast[] = [
    { time: "12 PM", temp: 24, condition: "Clear", icon: "01d", humidity: 65, windSpeed: 12 },
    { time: "1 PM", temp: 26, condition: "Clear", icon: "01d", humidity: 63, windSpeed: 10 },
    { time: "2 PM", temp: 25, condition: "Clouds", icon: "02d", humidity: 68, windSpeed: 8 },
    { time: "3 PM", temp: 23, condition: "Rain", icon: "10d", humidity: 75, windSpeed: 15 },
    { time: "4 PM", temp: 22, condition: "Rain", icon: "10d", humidity: 78, windSpeed: 18 },
    { time: "5 PM", temp: 21, condition: "Rain", icon: "10d", humidity: 80, windSpeed: 16 },
  ]

  const mockDailyForecast: DailyForecast[] = [
    { day: "Today", date: "Today", high: 26, low: 18, condition: "Clear", icon: "01d", humidity: 65, windSpeed: 12 },
    {
      day: "Tomorrow",
      date: "Tomorrow",
      high: 24,
      low: 16,
      condition: "Clouds",
      icon: "02d",
      humidity: 70,
      windSpeed: 10,
    },
    { day: "Wed", date: "Wed", high: 22, low: 14, condition: "Rain", icon: "10d", humidity: 85, windSpeed: 15 },
    { day: "Thu", date: "Thu", high: 25, low: 17, condition: "Clear", icon: "01d", humidity: 60, windSpeed: 8 },
    { day: "Fri", date: "Fri", high: 23, low: 15, condition: "Snow", icon: "13d", humidity: 90, windSpeed: 20 },
  ]

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const fetchWeatherData = useCallback(async (lat?: number, lon?: number, city?: string) => {
    try {
      setError(null)

      let url = "/api/weather?"
      if (lat && lon) {
        url += `lat=${lat}&lon=${lon}`
      } else if (city) {
        url += `city=${encodeURIComponent(city)}`
      } else {
        throw new Error("Location data required")
      }

      const response = await fetch(url)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch weather data")
      }

      const current: OpenWeatherResponse = data.current
      const forecast: ForecastResponse = data.forecast

      // Process current weather
      const processedWeather: WeatherData = {
        location: `${current.name}, ${current.sys.country}`,
        temperature: kelvinToCelsius(current.main.temp),
        condition: current.weather[0].main,
        description: current.weather[0].description,
        humidity: current.main.humidity,
        windSpeed: mpsToKmh(current.wind.speed),
        visibility: Math.round(current.visibility / 1000),
        uvIndex: Math.floor(Math.random() * 11), // Mock UV index
        feelsLike: kelvinToCelsius(current.main.feels_like),
        pressure: current.main.pressure,
        sunrise: current.sys.sunrise,
        sunset: current.sys.sunset,
        coordinates: {
          lat: current.coord.lat,
          lon: current.coord.lon,
        },
      }

      // Process hourly forecast (next 24 hours)
      const hourly: HourlyForecast[] = forecast.list.slice(0, 8).map((item) => ({
        time: new Date(item.dt * 1000).toLocaleTimeString("en-US", {
          hour: "numeric",
          hour12: true,
        }),
        temp: kelvinToCelsius(item.main.temp),
        condition: item.weather[0].main,
        icon: item.weather[0].icon,
        humidity: item.main.humidity,
        windSpeed: mpsToKmh(item.wind.speed),
      }))

      // Process daily forecast (next 5 days)
      const dailyMap = new Map<string, any>()
      forecast.list.forEach((item) => {
        const date = new Date(item.dt * 1000).toDateString()
        if (!dailyMap.has(date)) {
          dailyMap.set(date, {
            date: item.dt,
            temps: [kelvinToCelsius(item.main.temp)],
            weather: item.weather[0],
            humidity: item.main.humidity,
            windSpeed: mpsToKmh(item.wind.speed),
          })
        } else {
          dailyMap.get(date).temps.push(kelvinToCelsius(item.main.temp))
        }
      })

      const daily: DailyForecast[] = Array.from(dailyMap.values())
        .slice(0, 5)
        .map((day, index) => ({
          day: index === 0 ? "Today" : formatDate(day.date),
          date: new Date(day.date * 1000).toDateString(),
          high: Math.max(...day.temps),
          low: Math.min(...day.temps),
          condition: day.weather.main,
          icon: day.weather.icon,
          humidity: day.humidity,
          windSpeed: day.windSpeed,
        }))

      setWeatherData(processedWeather)
      setHourlyForecast(hourly)
      setDailyForecast(daily)
    } catch (err) {
      console.error("Weather fetch error:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch weather data")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  const searchCities = useCallback(async (query: string) => {
    if (query.length < 1) {
      setSearchSuggestions([])
      return
    }

    try {
      const response = await fetch(`/api/geocode?city=${encodeURIComponent(query)}`)
      const data = await response.json()

      if (response.ok) {
        setSearchSuggestions(data.slice(0, 5))
      }
    } catch (err) {
      console.error("Geocoding error:", err)
    }
  }, [])

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchQuery) {
        searchCities(searchQuery)
      }
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [searchQuery, searchCities])

  useEffect(() => {
    if (!hasApiKey) {
      // Use mock data when API key is not available
      setTimeout(() => {
        setWeatherData(mockWeatherData)
        setHourlyForecast(mockHourlyForecast)
        setDailyForecast(mockDailyForecast)
        setIsLoading(false)
      }, 1000)
    } else {
      // Use real API when key is available
      if (!geoLoading && !geoError && latitude && longitude) {
        fetchWeatherData(latitude, longitude)
      } else if (!geoLoading && geoError) {
        fetchWeatherData(undefined, undefined, "London")
      }
    }
  }, [latitude, longitude, geoError, geoLoading, fetchWeatherData, hasApiKey])

  const handleRefresh = () => {
    setIsRefreshing(true)

    if (!hasApiKey) {
      // Simulate refresh with mock data
      setTimeout(() => {
        setWeatherData({
          ...mockWeatherData,
          temperature: Math.floor(Math.random() * 15) + 15,
        })
        setIsRefreshing(false)
      }, 1000)
    } else {
      // Use real API refresh
      if (weatherData?.coordinates) {
        fetchWeatherData(weatherData.coordinates.lat, weatherData.coordinates.lon)
      } else if (latitude && longitude) {
        fetchWeatherData(latitude, longitude)
      } else {
        fetchWeatherData(undefined, undefined, "London")
      }
    }
  }

  const handleSearch = (city?: string) => {
    const searchCity = city || searchQuery.trim()
    if (searchCity) {
      if (!hasApiKey) {
        // Simulate search with mock data
        setIsLoading(true)
        setTimeout(() => {
          setWeatherData({
            ...mockWeatherData,
            location: `${searchCity}`,
            temperature: Math.floor(Math.random() * 20) + 10,
          })
          setIsLoading(false)
        }, 800)
      } else {
        setIsLoading(true)
        fetchWeatherData(undefined, undefined, searchCity)
      }
      setSearchQuery("")
      setShowSuggestions(false)
    }
  }

  const handleSuggestionClick = (suggestion: any) => {
    const cityName = `${suggestion.name}${suggestion.state ? `, ${suggestion.state}` : ""}, ${suggestion.country}`
    setSearchQuery("")
    setShowSuggestions(false)
    setIsLoading(true)
    fetchWeatherData(suggestion.lat, suggestion.lon)
  }

  if (isLoading && !weatherData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-500 to-pink-400 px-4 py-6">
        <div className="max-w-sm mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="text-white">
              <h1 className="text-2xl font-bold mb-1">Weather Pro</h1>
              <p className="text-white/80 text-sm">Loading...</p>
            </div>
            <Loader2 className="h-6 w-6 text-white animate-spin" />
          </div>
          <WeatherSkeleton />
        </div>
      </div>
    )
  }

  if (error && !weatherData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-500 to-pink-400 px-4 py-6">
        <div className="max-w-sm mx-auto">
          <Alert className="bg-red-500/20 border-red-500/30 text-white">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button
            onClick={() => handleSearch("London")}
            className="w-full mt-4 bg-white/20 hover:bg-white/30 text-white"
          >
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  const WeatherIcon = weatherData ? getWeatherIcon(hourlyForecast[0]?.icon || "01d", weatherData.condition) : Sun

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-500 to-pink-400 px-4 py-6">
      <div className="max-w-sm mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 animate-fade-in">
          <div className="text-white">
            <h1 className="text-2xl font-bold mb-1 animate-slide-down">Weather Pro</h1>
            <p className="text-white/80 text-sm animate-slide-down animation-delay-200">
              {currentTime.toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </p>
          </div>
          <Button
            onClick={handleRefresh}
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20 transition-all duration-300 hover:scale-110 h-10 w-10"
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-5 w-5 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {/* Search Bar */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20 animate-slide-up relative">
          <CardContent className="p-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 h-4 w-4" />
                <Input
                  placeholder="Search city..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    if (e.target.value.length >= 2) {
                      setShowSuggestions(true)
                    } else {
                      setShowSuggestions(false)
                    }
                  }}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  onFocus={() => {
                    if (searchQuery.length >= 2) {
                      setShowSuggestions(true)
                    }
                  }}
                  className="pl-10 h-10 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:bg-white/20 transition-all duration-300 text-sm"
                />
              </div>
              <Button
                onClick={() => handleSearch()}
                size="sm"
                className="bg-white/20 hover:bg-white/30 text-white border-white/20 transition-all duration-300 hover:scale-105 h-10 px-4"
                disabled={!searchQuery.trim()}
              >
                Go
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Error Alert */}
        {error && (
          <Alert className="bg-red-500/20 border-red-500/30 text-white animate-slide-up">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {weatherData && (
          <>
            {/* Main Weather Card */}
            <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-500 animate-slide-up animation-delay-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-white/80">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm">{weatherData.location}</span>
                  </div>
                  <div className="text-white/60 text-sm">
                    {currentTime.toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>

                <div className="text-center mb-6">
                  <div className="animate-float mb-4">
                    <WeatherIcon className="h-20 w-20 text-yellow-300 drop-shadow-lg mx-auto" />
                  </div>
                  <div className="text-5xl font-light text-white mb-2 animate-number-change">
                    {weatherData.temperature}°
                  </div>
                  <div className="text-white/80 text-lg mb-1 capitalize">{weatherData.description}</div>
                  <div className="text-white/60 text-sm">Feels like {weatherData.feelsLike}°</div>
                </div>
              </CardContent>
            </Card>

            {/* Hourly Forecast */}
            <Card className="bg-white/10 backdrop-blur-md border-white/20 animate-slide-up animation-delay-300">
              <CardContent className="p-4">
                <h3 className="text-white font-semibold mb-3 text-sm">Hourly Forecast</h3>
                <div className="flex gap-3 overflow-x-auto pb-2 -mx-1">
                  {hourlyForecast.map((hour, index) => {
                    const HourIcon = getWeatherIcon(hour.icon, hour.condition)
                    return (
                      <div
                        key={index}
                        className="flex flex-col items-center min-w-[60px] p-3 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-300 hover:scale-105"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className="text-white/80 text-xs mb-2">{hour.time}</div>
                        <HourIcon className="h-5 w-5 text-white mb-2 animate-bounce-subtle" />
                        <div className="text-white font-medium text-sm">{hour.temp}°</div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Weather Details */}
            <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-500 animate-slide-up animation-delay-400">
              <CardContent className="p-4">
                <h3 className="text-white font-semibold mb-3 text-sm">Weather Details</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col items-center p-3 rounded-lg bg-white/10 group">
                    <Droplets className="h-5 w-5 text-blue-300 mb-2 group-hover:scale-110 transition-transform duration-300" />
                    <span className="text-white/80 text-xs mb-1">Humidity</span>
                    <span className="text-white font-medium text-sm">{weatherData.humidity}%</span>
                  </div>
                  <div className="flex flex-col items-center p-3 rounded-lg bg-white/10 group">
                    <Wind className="h-5 w-5 text-green-300 mb-2 group-hover:scale-110 transition-transform duration-300" />
                    <span className="text-white/80 text-xs mb-1">Wind</span>
                    <span className="text-white font-medium text-sm">{weatherData.windSpeed} km/h</span>
                  </div>
                  <div className="flex flex-col items-center p-3 rounded-lg bg-white/10 group">
                    <Eye className="h-5 w-5 text-purple-300 mb-2 group-hover:scale-110 transition-transform duration-300" />
                    <span className="text-white/80 text-xs mb-1">Visibility</span>
                    <span className="text-white font-medium text-sm">{weatherData.visibility} km</span>
                  </div>
                  <div className="flex flex-col items-center p-3 rounded-lg bg-white/10 group">
                    <Thermometer className="h-5 w-5 text-orange-300 mb-2 group-hover:scale-110 transition-transform duration-300" />
                    <span className="text-white/80 text-xs mb-1">Pressure</span>
                    <span className="text-white font-medium text-sm">{weatherData.pressure} hPa</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 5-Day Forecast */}
            <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-500 animate-slide-up animation-delay-500">
              <CardContent className="p-4">
                <h3 className="text-white font-semibold mb-3 text-sm">5-Day Forecast</h3>
                <div className="space-y-2">
                  {dailyForecast.map((day, index) => {
                    const DayIcon = getWeatherIcon(day.icon, day.condition)
                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-white/10 transition-all duration-300 hover:scale-[1.02] group"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <DayIcon className="h-5 w-5 text-white group-hover:scale-110 transition-transform duration-300" />
                          <div className="flex-1">
                            <div className="text-white font-medium text-sm">{day.day}</div>
                            <div className="text-white/60 text-xs capitalize">{day.condition}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-white font-medium text-sm">{day.high}°</div>
                          <div className="text-white/60 text-xs">{day.low}°</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Search Suggestions Overlay */}
      {showSuggestions && searchSuggestions.length > 0 && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-start justify-center pt-32">
          <Card className="w-full max-w-sm mx-4 bg-white/95 backdrop-blur-md border-white/30 shadow-2xl animate-slide-up">
            <CardContent className="p-0">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-gray-800 font-semibold text-sm flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Search Results for "{searchQuery}"
                </h3>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {searchSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0 group"
                  >
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-blue-500 group-hover:scale-110 transition-transform" />
                      <div className="flex-1">
                        <div className="font-medium text-gray-800 group-hover:text-blue-600 transition-colors">
                          {suggestion.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {suggestion.state && `${suggestion.state}, `}
                          {suggestion.country}
                        </div>
                      </div>
                      <div className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        Click to select
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <div className="p-3 bg-gray-50 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowSuggestions(false)
                    setSearchQuery("")
                  }}
                  className="w-full text-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Close suggestions
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slide-down {
          from { 
            opacity: 0; 
            transform: translateY(-20px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
        
        @keyframes slide-up {
          from { 
            opacity: 0; 
            transform: translateY(20px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-2px); }
        }
        
        @keyframes number-change {
          from { transform: scale(0.8); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        
        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }
        
        .animate-slide-down {
          animation: slide-down 0.6s ease-out;
        }
        
        .animate-slide-up {
          animation: slide-up 0.6s ease-out;
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .animate-bounce-subtle {
          animation: bounce-subtle 2s ease-in-out infinite;
        }
        
        .animate-number-change {
          animation: number-change 0.5s ease-out;
        }
        
        .animation-delay-200 {
          animation-delay: 200ms;
        }
        
        .animation-delay-300 {
          animation-delay: 300ms;
        }
        
        .animation-delay-400 {
          animation-delay: 400ms;
        }
        
        .animation-delay-500 {
          animation-delay: 500ms;
        }
      `}</style>
    </div>
  )
}
