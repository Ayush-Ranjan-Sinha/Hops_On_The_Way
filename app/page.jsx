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
  ArrowDownUp,
} from "lucide-react";
import dynamic from "next/dynamic";
import { RouteHopCard } from "@/components/route-hop-card";
import { RouteSummary } from "@/components/route-summary";
import clsx from "clsx";
import { useRouter } from "next/navigation";

const MapComponent = dynamic(() => import("@/components/map-component"), {
  ssr: false,
  loading: () => (
    <div className="h-96 bg-gradient-to-br from-amber-100 via-orange-100 to-red-100 rounded-b-lg flex items-center justify-center">
      <div className="text-amber-600">Loading map...</div>
    </div>
  ),
});

const MAX_HOPS = 10;

export default function DesertRouteOptimizer() {
  const [waypoints, setWaypoints] = useState([
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
  const [optimizedRoute, setOptimizedRoute] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const searchTimeoutRef = useRef({});
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [saveError, setSaveError] = useState("");
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem("currentUser"));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    setIsLoggedIn(false);
    router.push("/login");
  };

  const hopCount = waypoints.filter((w) => w.type === "hop").length;

  const themeColors = {
    bright: "bg-[#f07c4a]",
    dark: "bg-[#1f1a1f]",
  };
  const getBackgroundClass = () => {
    switch (theme) {
      case "dark":
        return "bg-gradient-to-br from-[#0f0f10] via-[#1a1a1d] to-[#2c2f33] text-white";
      case "bright":
      default:
        return "bg-gradient-to-br from-[#fff8e1] via-[#ffe0b2] to-[#ffcc80] text-gray-900";
    }
  };

  const getHeaderClass = () => {
    switch (theme) {
      case "dark":
        return "bg-gradient-to-r from-[#111827] via-[#1f2937] to-[#374151] ";
      case "bright":
      default:
        return "bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 ";
    }
  };

  const checkForDuplicates = (newLocation, excludeId) => {
    return waypoints.some((w) => {
      if (w.id === excludeId) return false;
      if (w.type !== "hop") return false;
      if (!w.location) return false;
      const latDiff = Math.abs(w.location.lat - newLocation.lat);
      const lngDiff = Math.abs(w.location.lng - newLocation.lng);
      return latDiff < 0.001 && lngDiff < 0.001;
    });
  };

  const handleSwapStartEnd = () => {
    setWaypoints((prevWaypoints) => {
      const startIndex = prevWaypoints.findIndex((w) => w.type === "start");
      const destIndex = prevWaypoints.findIndex((w) => w.type === "destination");
      if (startIndex === -1 || destIndex === -1) return prevWaypoints;
      const newWaypoints = [...prevWaypoints];
      const temp = { ...newWaypoints[startIndex] };
      newWaypoints[startIndex] = {
        ...newWaypoints[destIndex],
        type: "start",
        id: "start",
      };
      newWaypoints[destIndex] = {
        ...temp,
        type: "destination",
        id: "destination",
      };
      return newWaypoints;
    });
  };

  const addHop = () => {
    if (hopCount >= MAX_HOPS) return;
    const hasEmptyHop = waypoints.some(
      (w) => w.type === "hop" && (!w.query || w.query.trim() === "")
    );
    if (hasEmptyHop) return;
    const newHop = {
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

  const removeHop = (id) => {
    setWaypoints((prev) => prev.filter((w) => w.id !== id));
    setOptimizedRoute(null);
    setDuplicateWarning(null);
  };

  const searchPlaces = async (query, waypointId) => {
    try {
      const response = await fetch(
        `/api/nominatim/search?q=${encodeURIComponent(query)}`
      );
      const data = await response.json();
      if (data.error) {
        setWaypoints((prev) =>
          prev.map((w) =>
            w.id === waypointId
              ? { ...w, suggestions: [], isSearching: false }
              : w
          )
        );
        return;
      }
      const locations = data.results.map((result) => ({
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
      setWaypoints((prev) =>
        prev.map((w) =>
          w.id === waypointId
            ? { ...w, suggestions: [], isSearching: false }
            : w
        )
      );
    }
  };

  const updateWaypointQuery = (id, query) => {
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

  const selectLocation = (waypointId, location) => {
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

  const calculateOptimizedRoute = async () => {
    const locationsWithWaypoints = waypoints.filter((w) => w.location !== null);
    if (locationsWithWaypoints.length < 2) {
      setError("Please select at least a start and destination location");
      return;
    }
    const startLocation = waypoints.find((w) => w.type === "start")?.location;
    const destinationLocation = waypoints.find((w) => w.type === "destination")?.location;
    if (!startLocation || !destinationLocation) {
      setError("Please select both start and destination locations");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const coordinateToWaypointMap = new Map();
      locationsWithWaypoints.forEach((waypoint) => {
        const key = `${waypoint.location.lng.toFixed(6)},${waypoint.location.lat.toFixed(6)}`;
        coordinateToWaypointMap.set(key, waypoint);
      });
      const coordinates = locationsWithWaypoints
        .map((w) => `${w.location.lng},${w.location.lat}`)
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
      const optimizedWaypoints = data.waypoints.map((osrmWp, optimizedIdx) => {
        const wpLat = osrmWp.location.lat;
        const wpLng = osrmWp.location.lng;
        const coordKey = `${wpLng.toFixed(6)},${wpLat.toFixed(6)}`;
        let matched = coordinateToWaypointMap.get(coordKey);
        if (!matched) {
          let bestDist = Number.MAX_VALUE;
          locationsWithWaypoints.forEach((orig) => {
            const dLat = orig.location.lat - wpLat;
            const dLng = orig.location.lng - wpLng;
            const dist = dLat * dLat + dLng * dLng;
            if (dist < bestDist) {
              bestDist = dist;
              matched = orig;
            }
          });
        }
        const safeLoc = matched?.location ?? {
          name: `Stop ${optimizedIdx + 1}`,
          display_name: `Unnamed stop ${optimizedIdx + 1}`,
          lat: wpLat,
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
      });
      setOptimizedRoute({
        distance: data.distance,
        duration: data.duration,
        coordinates: data.coordinates,
        waypoints: optimizedWaypoints,
      });
    } catch (error) {
      setError("Failed to optimize route. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getWaypointColor = (type) => {
    switch (type) {
      case "start":
        return "text-green-500";
      case "destination":
        return "text-red-500";
      default:
        return "text-amber-500";
    }
  };

  const getWaypointLabel = (waypoint, index) => {
    switch (waypoint.type) {
      case "start":
        return "Start";
      case "destination":
        return "End";
      default:
        return `Hop ${waypoints.filter((w) => w.type === "hop").indexOf(waypoint) + 1}`;
    }
  };

  useEffect(() => {
    return () => {
      Object.values(searchTimeoutRef.current).forEach(clearTimeout);
    };
  }, []);

  const handleSaveTrip = () => {
    setSaveStatus("saving");
    setSaveError("");
    try {
      const userStr = localStorage.getItem("currentUser");
      if (!userStr) {
        setSaveStatus("error");
        setSaveError("You must be logged in to save trips.");
        return;
      }
      const user = JSON.parse(userStr);
      user.trips = user.trips || [];
      user.trips.push(optimizedRoute);
      localStorage.setItem("currentUser", JSON.stringify(user));
      const users = JSON.parse(localStorage.getItem("users") || "[]");
      const idx = users.findIndex((u) => u.email === user.email);
      if (idx !== -1) {
        users[idx] = user;
        localStorage.setItem("users", JSON.stringify(users));
      }
      setSaveStatus("success");
    } catch (err) {
      setSaveStatus("error");
      setSaveError(err.message);
    }
  };

  return (
    <div className={`flex flex-col min-h-screen ${getBackgroundClass()}`}>
      {/* Header */}
      <div className={` text-white p-6 shadow-lg ${getHeaderClass()}`}>
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <Camel className="w-8 h-8" />
          <h1 className="text-3xl font-bold">Hops On The Way</h1>
          <div className="ml-auto text-sm opacity-90">
            Multi-stop journey planner
          </div>
          <div className="ml-auto flex items-center space-x-3">
            {/* Toggle buttons */}
            <div className="flex bg-transparent rounded-full shadow-inner p-1 text-xs">
              {["bright", "dark"].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setTheme(mode)}
                  className={clsx(
                    "px-2 py-1 rounded-full transition-all duration-200 border-0 outline-none focus:ring-0",
                    theme === mode
                      ? `${themeColors[mode]} text-transparent shadow-md`
                      : "text-white hover:bg-gray-200"
                  )}
                >
                  {mode === "bright" ? "Bright" : "Dark"}
                </button>
              ))}
            </div>
            {/* Auth buttons */}
            {isLoggedIn ? (
              <>
                <button
                  onClick={() => router.push("/saved-trips")}
                  className="ml-4 px-4 py-2 rounded-lg shadow-sm bg-gradient-to-r from-gray-800 to-gray-700 hover:from-gray-700 hover:to-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 transition text-white font-semibold"
                >
                  Saved Trips
                </button>
                <button
                  onClick={handleLogout}
                  className="ml-2 px-4 py-2 rounded-lg shadow-sm bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-2 transition text-white font-semibold"
                >
                  Logout
                </button>
              </>
            ) : (
              <button
                onClick={() => router.push("/login")}
                className="ml-4 px-4 py-2 rounded-lg shadow-sm bg-gradient-to-r from-gray-800 to-gray-700 hover:from-gray-700 hover:to-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 transition text-white font-semibold"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="flex-grow max-w-7xl mx-auto p-6 grid lg:grid-cols-3 gap-6">
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
              <Alert className="border-blue-200 bg-blue-50">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800 text-sm">
                  <strong>TSP Algorithm:</strong> Uses OSRM's Traveling Salesman
                  Problem solver with nearest neighbor heuristic + 2-opt
                  improvements to find the shortest route visiting all
                  locations.
                </AlertDescription>
              </Alert>
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
                    {waypoint.type === "start" && (
                      <Button
                        onClick={() => handleSwapStartEnd()}
                        size="sm"
                        variant="ghost"
                        className="ml-auto h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <ArrowDownUp className="w-3 h-3 text-black" />
                      </Button>
                    )}
                  </div>
                  <div className="relative">
                    <Input
                      key={`input-${waypoint.id}`}
                      value={waypoint.query}
                      onChange={(e) => updateWaypointQuery(waypoint.id, e.target.value)}
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
                        {waypoint.suggestions.map((suggestion, suggestionIndex) => (
                          <button
                            key={`${waypoint.id}-suggestion-${suggestionIndex}`}
                            onClick={() => selectLocation(waypoint.id, suggestion)}
                            className="w-full px-3 py-2 text-left hover:bg-amber-50 first:rounded-t-md last:rounded-b-md transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <MapPin
                                className={`w-3 h-3 ${getWaypointColor(waypoint.type)} flex-shrink-0`}
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
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
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
              {duplicateWarning && (
                <Alert className="border-orange-200 bg-orange-50">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-800 text-sm">
                    {duplicateWarning}
                  </AlertDescription>
                </Alert>
              )}
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
          {optimizedRoute && <RouteSummary route={optimizedRoute} />}
          {optimizedRoute && isLoggedIn && (
            <div className="mt-4">
              <Button
                onClick={handleSaveTrip}
                disabled={saveStatus === "saving"}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white"
              >
                {saveStatus === "saving"
                  ? "Saving..."
                  : saveStatus === "success"
                  ? "Trip Saved!"
                  : "Save Trip"}
              </Button>
              {saveStatus === "error" && (
                <Alert className="border-red-200 bg-red-50 mt-2">
                  <AlertDescription className="text-red-800 text-sm">{saveError}</AlertDescription>
                </Alert>
              )}
              {saveStatus === "success" && (
                <Alert className="border-green-200 bg-green-50 mt-2">
                  <AlertDescription className="text-green-800 text-sm">Trip saved successfully!</AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>
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
      {optimizedRoute && optimizedRoute.waypoints && optimizedRoute.waypoints.length > 0 && (
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
                  minimum total distance of {optimizedRoute.distance} in {optimizedRoute.duration}. This sequence is
                  optimized by the TSP algorithm.
                </AlertDescription>{" "}
                by OpenStreetMap & OSRM TSP Algorithm
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
      <div className="max-w-7xl mx-auto text-center text-sm opacity-90">
        🐪 Desert Route Optimizer - Multi-stop journey planning • Powered by
        OpenStreetMap & OSRM TSP Algorithm • Lakshit and Ayush
      </div>
    </div>
  );
} 