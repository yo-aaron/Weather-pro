export function WeatherSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Main Weather Card Skeleton */}
      <div className="bg-white/10 backdrop-blur-md border-white/20 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 bg-white/20 rounded"></div>
            <div className="h-4 w-32 bg-white/20 rounded"></div>
          </div>
          <div className="h-4 w-16 bg-white/20 rounded"></div>
        </div>

        <div className="text-center mb-6">
          <div className="h-20 w-20 bg-white/20 rounded-full mx-auto mb-4"></div>
          <div className="h-12 w-24 bg-white/20 rounded mx-auto mb-2"></div>
          <div className="h-6 w-32 bg-white/20 rounded mx-auto mb-1"></div>
          <div className="h-4 w-24 bg-white/20 rounded mx-auto"></div>
        </div>
      </div>

      {/* Hourly Forecast Skeleton */}
      <div className="bg-white/10 backdrop-blur-md border-white/20 rounded-lg p-4">
        <div className="h-4 w-32 bg-white/20 rounded mb-3"></div>
        <div className="flex gap-3 overflow-x-auto">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex flex-col items-center min-w-[60px] p-3 rounded-lg bg-white/10">
              <div className="h-3 w-12 bg-white/20 rounded mb-2"></div>
              <div className="h-5 w-5 bg-white/20 rounded mb-2"></div>
              <div className="h-4 w-8 bg-white/20 rounded"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Weather Details Skeleton */}
      <div className="bg-white/10 backdrop-blur-md border-white/20 rounded-lg p-4">
        <div className="h-4 w-32 bg-white/20 rounded mb-3"></div>
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex flex-col items-center p-3 rounded-lg bg-white/10">
              <div className="h-5 w-5 bg-white/20 rounded mb-2"></div>
              <div className="h-3 w-16 bg-white/20 rounded mb-1"></div>
              <div className="h-4 w-12 bg-white/20 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
