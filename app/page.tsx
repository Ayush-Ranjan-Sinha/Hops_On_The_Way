"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  MapPin,
  Navigation,
  Route,
  CaravanIcon as Camel,
  Plus,
  X,
  AlertTriangle,
  Info,
} from "lucide-react";
import dynamic from "next/dynamic";
import { RouteHopCard } from "@/components/route-hop-card";
import { RouteSummary } from "@/components/route-summary";

// Dynamically import the map component to avoid SSR issues
const MapComponent = dynamic(() => import("@/components/map-component"), {
  ssr: false,
  loading: () => (
    <div className="h-96 bg-gradient-to-br from-amber-100 via-orange-100 to-red-100 rounded-b-lg flex items-center justify-center">
      <div className="text-amber-600">Loading map...</div>
    </div>
  ),
});

interface Location {
  name: string;
  display_name: string;
  lat: number;
  lng: number;
  place_id?: string;
}

interface Waypoint {
  id: string;
  location: Location | null;
  query: string;
  suggestions: Location[];
  type: "start" | "hop" | "destination";
  isSearching: boolean;
}

interface OptimizedWaypoint {
  location: Location;
  distance_from_previous: string;
  duration_from_previous: string;
  waypoint_index: number;
  optimized_order: number;
  original_waypoint_id: string;
  waypoint_type: "start" | "hop" | "destination";
}

interface OptimizedRoute {
  distance: string;
  duration: string;
  coordinates: Array<[number, number]>;
  waypoints: OptimizedWaypoint[];
}

const MAX_HOPS = 10;

export default function DesertRouteOptimizer() {
  const [waypoints, setWaypoints] = useState<Waypoint[]>([
    {
      id: "start",
      location: null,
      query: "",
      suggestions: [],
      type: "start",
      isSearching: false,
    },
    {
      id: "destination",
      location: null,
      query: "",
      suggestions: [],
      type: "destination",
      isSearching: false,
    },
  ]);
  const [optimizedRoute, setOptimizedRoute] = useState<OptimizedRoute | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const searchTimeoutRef = useRef<{ [key: string]: NodeJS.Timeout }>({});

  const hopCount = waypoints.filter((w) => w.type === "hop").length;

  // Check for duplicate locations
  const checkForDuplicates = (
    newLocation: Location,
    excludeId?: string
  ): boolean => {
    return waypoints.some((w) => {
      // Skip current waypoint
      if (w.id === excludeId) return false;

      // Only check for duplicates among hops
      if (w.type !== "hop") return false;

      if (!w.location) return false;

      const latDiff = Math.abs(w.location.lat - newLocation.lat);
      const lngDiff = Math.abs(w.location.lng - newLocation.lng);

      return latDiff < 0.001 && lngDiff < 0.001;
    });
  };

  // Add a new hop
  const addHop = () => {
    if (hopCount >= MAX_HOPS) return;

    const newHop: Waypoint = {
      id: `hop-${Date.now()}-${Math.random()}`,
      location: null,
      query: "",
      suggestions: [],
      type: "hop",
      isSearching: false,
    };

    setWaypoints((prev) => {
      const destinationIndex = prev.findIndex((w) => w.type === "destination");
      const newWaypoints = [...prev];
      newWaypoints.splice(destinationIndex, 0, newHop);
      return newWaypoints;
    });
  };

  // Remove a hop
  const removeHop = (id: string) => {
    setWaypoints((prev) => prev.filter((w) => w.id !== id));
    setOptimizedRoute(null);
    setDuplicateWarning(null);
  };

  // Search places with debouncing
  const searchPlaces = async (query: string, waypointId: string) => {
    try {
      const response = await fetch(
        `/api/nominatim/search?q=${encodeURIComponent(query)}`
      );
      const data = await response.json();

      if (data.error) {
        console.error("Search error:", data.error);
        setWaypoints((prev) =>
          prev.map((w) =>
            w.id === waypointId
              ? { ...w, suggestions: [], isSearching: false }
              : w
          )
        );
        return;
      }

      const locations: Location[] = data.results.map((result: any) => ({
        name: result.name || result.display_name.split(",")[0],
        display_name: result.display_name,
        lat: Number.parseFloat(result.lat),
        lng: Number.parseFloat(result.lon),
        place_id: result.place_id,
      }));

      setWaypoints((prev) =>
        prev.map((w) =>
          w.id === waypointId
            ? { ...w, suggestions: locations.slice(0, 5), isSearching: false }
            : w
        )
      );
    } catch (error) {
      console.error("Search error:", error);
      setWaypoints((prev) =>
        prev.map((w) =>
          w.id === waypointId
            ? { ...w, suggestions: [], isSearching: false }
            : w
        )
      );
    }
  };

  // Update waypoint query
  const updateWaypointQuery = (id: string, query: string) => {
    setWaypoints((prev) =>
      prev.map((w) =>
        w.id === id
          ? { ...w, query, suggestions: query.length < 3 ? [] : w.suggestions }
          : w
      )
    );
    setError(null);
    setDuplicateWarning(null);

    if (searchTimeoutRef.current[id]) {
      clearTimeout(searchTimeoutRef.current[id]);
    }

    if (query.length >= 3) {
      setWaypoints((prev) =>
        prev.map((w) => (w.id === id ? { ...w, isSearching: true } : w))
      );
      searchTimeoutRef.current[id] = setTimeout(() => {
        searchPlaces(query, id);
      }, 300);
    } else {
      setWaypoints((prev) =>
        prev.map((w) =>
          w.id === id ? { ...w, isSearching: false, suggestions: [] } : w
        )
      );
    }
  };

  // Select location for waypoint
  const selectLocation = (waypointId: string, location: Location) => {
    if (checkForDuplicates(location, waypointId)) {
      setDuplicateWarning(
        `"${location.name}" is already selected as another hop. Please choose a different location.`
      );
      return;
    }

    setWaypoints((prev) =>
      prev.map((w) =>
        w.id === waypointId
          ? {
              ...w,
              location,
              query: location.name,
              suggestions: [],
              isSearching: false,
            }
          : w
      )
    );
    setOptimizedRoute(null);
    setDuplicateWarning(null);
  };

  // Calculate optimized route
  const calculateOptimizedRoute = async () => {
    const locationsWithWaypoints = waypoints.filter((w) => w.location !== null);

    if (locationsWithWaypoints.length < 2) {
      setError("Please select at least a start and destination location");
      return;
    }

    const startLocation = waypoints.find((w) => w.type === "start")?.location;
    const destinationLocation = waypoints.find(
      (w) => w.type === "destination"
    )?.location;

    if (!startLocation || !destinationLocation) {
      setError("Please select both start and destination locations");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create a mapping of coordinates to original waypoints
      const coordinateToWaypointMap = new Map();
      locationsWithWaypoints.forEach((waypoint) => {
        const key = `${waypoint.location!.lng.toFixed(
          6
        )},${waypoint.location!.lat.toFixed(6)}`;
        coordinateToWaypointMap.set(key, waypoint);
      });

      // Prepare coordinates for OSRM trip endpoint
      const coordinates = locationsWithWaypoints
        .map((w) => `${w.location!.lng},${w.location!.lat}`)
        .join(";");

      const response = await fetch(
        `/api/osrm/trip?coordinates=${encodeURIComponent(coordinates)}`
      );
      const data = await response.json();

      if (data.error) {
        setError(data.error);
        setIsLoading(false);
        return;
      }

      // Map the OSRM response back to our original waypoints in the OPTIMIZED order
      const optimizedWaypoints: OptimizedWaypoint[] = data.waypoints.map(
        (osrmWp: any, optimizedIdx: number) => {
          // OSRM waypoint coordinates
          const wpLat = osrmWp.location.lat;
          const wpLng = osrmWp.location.lng;

          // ⚡ FAST lookup (exact-round match)  ──────────────
          const coordKey = `${wpLng.toFixed(6)},${wpLat.toFixed(6)}`;
          let matched = coordinateToWaypointMap.get(coordKey) as
            | Waypoint
            | undefined;

          // 🔍 If not an exact match, fall back to nearest waypoint (≤0.01° ≈1 km)
          if (!matched) {
            let bestDist = Number.MAX_VALUE;
            locationsWithWaypoints.forEach((orig) => {
              const dLat = orig.location!.lat - wpLat;
              const dLng = orig.location!.lng - wpLng;
              const dist = dLat * dLat + dLng * dLng;
              if (dist < bestDist) {
                bestDist = dist;
                matched = orig;
              }
            });
          }

          // 🛡️ Final safety: if STILL not found, build a dummy waypoint so we never hit “null.location”
          const safeLoc = matched?.location ?? {
            name: `Stop ${optimizedIdx + 1}`,
            display_name: `Unnamed stop ${optimizedIdx + 1}`,
            lat: wpLat,
            lng: wpLng,
          };

          return {
            location: safeLoc,
            distance_from_previous: osrmWp.distance_from_previous ?? "0 km",
            duration_from_previous: osrmWp.duration_from_previous ?? "0 min",
            waypoint_index: osrmWp.waypoint_index ?? optimizedIdx,
            optimized_order: optimizedIdx,
            original_waypoint_id: matched?.id ?? `osrm-${optimizedIdx}`,
            waypoint_type: matched?.type ?? "hop",
          };
        }
      );

      setOptimizedRoute({
        distance: data.distance,
        duration: data.duration,
        coordinates: data.coordinates,
        waypoints: optimizedWaypoints, // Already in optimized order
      });
    } catch (error) {
      console.error("Route optimization error:", error);
      setError("Failed to optimize route. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Get waypoint icon color
  const getWaypointColor = (type: string) => {
    switch (type) {
      case "start":
        return "text-green-500";
      case "destination":
        return "text-red-500";
      default:
        return "text-amber-500";
    }
  };

  // Get waypoint label
  const getWaypointLabel = (waypoint: Waypoint, index: number) => {
    switch (waypoint.type) {
      case "start":
        return "Start";
      case "destination":
        return "End";
      default:
        return `Hop ${
          waypoints.filter((w) => w.type === "hop").indexOf(waypoint) + 1
        }`;
    }
  };

  useEffect(() => {
    return () => {
      Object.values(searchTimeoutRef.current).forEach(clearTimeout);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <Camel className="w-8 h-8" />
          <h1 className="text-3xl font-bold">Hops On The Way</h1>
          <div className="ml-auto text-sm opacity-90">
            Multi-stop journey planner
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 grid lg:grid-cols-3 gap-6">
        {/* Waypoints Panel */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="bg-white/80 backdrop-blur-sm border-amber-200 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-amber-100 to-orange-100 rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-amber-800">
                <Navigation className="w-5 h-5" />
                Plan Your Journey
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {/* Algorithm Info */}
              <Alert className="border-blue-200 bg-blue-50">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800 text-sm">
                  <strong>TSP Algorithm:</strong> Uses OSRM's Traveling Salesman
                  Problem solver with nearest neighbor heuristic + 2-opt
                  improvements to find the shortest route visiting all
                  locations.
                </AlertDescription>
              </Alert>

              {/* Waypoints */}
              {waypoints.map((waypoint, index) => (
                <div key={waypoint.id} className="relative">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin
                      className={`w-4 h-4 ${getWaypointColor(waypoint.type)}`}
                    />
                    <label className="text-sm font-medium text-amber-700">
                      {getWaypointLabel(waypoint, index)}
                    </label>
                    {waypoint.type === "hop" && (
                      <Button
                        onClick={() => removeHop(waypoint.id)}
                        size="sm"
                        variant="ghost"
                        className="ml-auto h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    )}
                  </div>

                  <div className="relative">
                    <Input
                      key={`input-${waypoint.id}`}
                      value={waypoint.query}
                      onChange={(e) =>
                        updateWaypointQuery(waypoint.id, e.target.value)
                      }
                      placeholder={`Enter ${
                        waypoint.type === "start"
                          ? "starting"
                          : waypoint.type === "destination"
                          ? "destination"
                          : "stop"
                      } location...`}
                      className="border-amber-200 focus:border-amber-400 focus:ring-amber-400"
                      autoComplete="off"
                    />

                    {waypoint.isSearching && (
                      <div className="absolute right-3 top-3">
                        <div className="w-4 h-4 border-2 border-amber-300 border-t-amber-600 rounded-full animate-spin" />
                      </div>
                    )}

                    {waypoint.suggestions.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-amber-200 rounded-md shadow-lg animate-in fade-in-0 slide-in-from-top-2">
                        {waypoint.suggestions.map(
                          (suggestion, suggestionIndex) => (
                            <button
                              key={`${waypoint.id}-suggestion-${suggestionIndex}`}
                              onClick={() =>
                                selectLocation(waypoint.id, suggestion)
                              }
                              className="w-full px-3 py-2 text-left hover:bg-amber-50 first:rounded-t-md last:rounded-b-md transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <MapPin
                                  className={`w-3 h-3 ${getWaypointColor(
                                    waypoint.type
                                  )} flex-shrink-0`}
                                />
                                <div className="min-w-0">
                                  <div className="font-medium text-sm truncate">
                                    {suggestion.name}
                                  </div>
                                  <div className="text-xs text-gray-500 truncate">
                                    {suggestion.display_name}
                                  </div>
                                </div>
                              </div>
                            </button>
                          )
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Add Hop Button */}
              {hopCount < MAX_HOPS && (
                <Button
                  onClick={addHop}
                  variant="outline"
                  className="w-full border-amber-300 text-amber-700 hover:bg-amber-50 hover:border-amber-400 bg-transparent"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Hop ({hopCount}/{MAX_HOPS})
                </Button>
              )}

              {/* Optimize Route Button */}
              <Button
                onClick={calculateOptimizedRoute}
                disabled={
                  isLoading || waypoints.filter((w) => w.location).length < 2
                }
                className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-semibold py-3"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Optimizing Route...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Route className="w-4 h-4" />
                    Optimize Journey
                  </div>
                )}
              </Button>

              {/* Duplicate Warning */}
              {duplicateWarning && (
                <Alert className="border-orange-200 bg-orange-50">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-800 text-sm">
                    {duplicateWarning}
                  </AlertDescription>
                </Alert>
              )}

              {/* Error Display */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg animate-in fade-in-0">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm">{error}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Route Summary */}
          {optimizedRoute && <RouteSummary route={optimizedRoute} />}
        </div>

        {/* Map Panel */}
        <div className="lg:col-span-2">
          <Card className="bg-white/80 backdrop-blur-sm border-amber-200 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-orange-100 to-red-100 rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-orange-800">
                <MapPin className="w-5 h-5" />
                Optimized Route Visualization
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <MapComponent
                waypoints={waypoints.filter((w) => w.location !== null)}
                optimizedRoute={optimizedRoute}
                className="h-[600px] rounded-b-lg"
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Optimized Route Order */}
      {optimizedRoute && optimizedRoute.waypoints.length > 0 && (
        <div className="max-w-7xl mx-auto px-6 pb-6">
          <Card className="bg-white/80 backdrop-blur-sm border-amber-200 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-green-100 to-emerald-100 rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-green-800">
                <Route className="w-5 h-5" />
                Optimized Journey Order (Follow This Exact Sequence)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <Alert className="mb-4 border-green-200 bg-green-50">
                <Info className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>Follow this exact order</strong> to achieve the
                  minimum total distance of{" "}
                  <strong>{optimizedRoute.distance}</strong> in{" "}
                  <strong>{optimizedRoute.duration}</strong>. This sequence is
                  optimized by the TSP algorithm.
                </AlertDescription>
              </Alert>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {optimizedRoute.waypoints.map((waypoint, index) => (
                  <RouteHopCard
                    key={`optimized-${waypoint.optimized_order}`}
                    waypoint={waypoint}
                    index={index}
                    isOptimized={true}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Footer */}
      <div className="bg-gradient-to-r from-amber-800 via-orange-800 to-red-800 text-white p-4 mt-12">
        <div className="max-w-7xl mx-auto text-center text-sm opacity-90">
          🐪 Desert Route Optimizer - Multi-stop journey planning • Powered by
          OpenStreetMap & OSRM TSP Algorithm
        </div>
      </div>
    </div>
  );
}
