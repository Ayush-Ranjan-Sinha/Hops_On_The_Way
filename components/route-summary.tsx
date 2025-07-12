import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Route, Clock, MapPin } from "lucide-react"

interface OptimizedRoute {
  distance: string
  duration: string
  coordinates: Array<[number, number]>
  waypoints: Array<{
    location: { name: string; display_name: string; lat: number; lng: number }
    distance_from_previous: string
    duration_from_previous: string
    waypoint_index: number
  }>
}

interface RouteSummaryProps {
  route: OptimizedRoute
}

export function RouteSummary({ route }: RouteSummaryProps) {
  return (
    <Card className="bg-white/80 backdrop-blur-sm border-amber-200 shadow-xl">
      <CardHeader className="bg-gradient-to-r from-green-100 to-emerald-100 rounded-t-lg">
        <CardTitle className="flex items-center gap-2 text-green-800">
          <Route className="w-5 h-5" />
          Optimized Route Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        {/* Total Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-lg border border-amber-200">
            <div className="flex items-center gap-2 mb-1">
              <Route className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-700">Total Distance</span>
            </div>
            <div className="text-xl font-bold text-amber-800">{route.distance}</div>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">Total Duration</span>
            </div>
            <div className="text-xl font-bold text-blue-800">{route.duration}</div>
          </div>
        </div>

        {/* Waypoints Count */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Waypoints</span>
          </div>
          <Badge variant="secondary" className="bg-amber-100 text-amber-800">
            {route.waypoints.length} stops
          </Badge>
        </div>

        {/* Route Optimization Note */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="text-sm text-green-700">
            <strong>✨ Route Optimized!</strong>
            <br />
            This route has been calculated to minimize total travel distance while visiting all your selected waypoints.
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
