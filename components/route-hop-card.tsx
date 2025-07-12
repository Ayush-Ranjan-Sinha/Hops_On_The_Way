import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Route, Clock, ArrowRight } from "lucide-react"

interface RouteHopCardProps {
  waypoint: {
    location: { name: string; display_name: string; lat: number; lng: number }
    distance_from_previous: string
    duration_from_previous: string
    waypoint_index?: number
    optimized_order?: number
    waypoint_type?: "start" | "hop" | "destination"
  }
  index: number
  isOptimized?: boolean
}

export function RouteHopCard({ waypoint, index, isOptimized = false }: RouteHopCardProps) {
  const isFirst = index === 0
  const isLast = waypoint.waypoint_type === "destination"

  // Determine the step type based on waypoint type
  const getStepInfo = () => {
    if (waypoint.waypoint_type === "start" || isFirst) {
      return { label: "START", color: "bg-green-500", textColor: "text-green-800" }
    }
    if (waypoint.waypoint_type === "destination" || isLast) {
      return { label: "END", color: "bg-red-500", textColor: "text-red-800" }
    }
    return { label: `${index}`, color: "bg-gradient-to-r from-amber-500 to-orange-500", textColor: "text-amber-800" }
  }

  const stepInfo = getStepInfo()

  return (
    <Card className="bg-gradient-to-br from-white to-amber-50 border-amber-200 hover:shadow-lg transition-all duration-300 relative">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Step Number */}
          <div className="flex-shrink-0">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-lg ${stepInfo.color}`}
            >
              {stepInfo.label}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <h3 className="font-semibold text-amber-800 truncate">{waypoint.location.name}</h3>
              {isOptimized && (
                <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs ml-auto">
                  Step {index + 1}
                </Badge>
              )}
            </div>

            <p className="text-xs text-gray-600 mb-3 line-clamp-2">{waypoint.location.display_name}</p>

            {!isFirst && (
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div className="flex items-center gap-1">
                  <Route className="w-3 h-3 text-blue-500" />
                  <span className="text-xs text-blue-600 font-medium">{waypoint.distance_from_previous}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-green-500" />
                  <span className="text-xs text-green-600 font-medium">{waypoint.duration_from_previous}</span>
                </div>
              </div>
            )}

            {isFirst && (
              <Badge variant="secondary" className={`${stepInfo.textColor} bg-green-100 text-xs`}>
                Starting Point
              </Badge>
            )}

            {isLast && (
              <Badge variant="secondary" className={`${stepInfo.textColor} bg-red-100 text-xs`}>
                Final Destination
              </Badge>
            )}

            {isOptimized && !isFirst && !isLast && (
              <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                <ArrowRight className="w-3 h-3" />
                <span>Optimized stop</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
