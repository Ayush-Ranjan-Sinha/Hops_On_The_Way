"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar, MapPin, Timer, Route, CaravanIcon as Camel, List } from "lucide-react";

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleString();
}

export default function SavedTripsPage() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const userStr = localStorage.getItem("currentUser");
    if (!userStr) {
      router.replace("/login");
      return;
    }
    const user = JSON.parse(userStr);
    setTrips(user.trips || []);
    setLoading(false);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-950">
      <Card className="w-full max-w-2xl bg-gray-900 shadow-2xl border-none">
        <CardHeader className="flex flex-col items-center gap-2 pb-2">
          <Camel className="w-10 h-10 text-amber-400 mb-2" />
          <CardTitle className="text-2xl text-white font-bold">Saved Trips</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-gray-300">Loading...</div>
          ) : error ? (
            <Alert className="border-red-400 bg-red-900/30 mb-4">
              <AlertDescription className="text-red-200 text-sm">{error}</AlertDescription>
            </Alert>
          ) : trips.length === 0 ? (
            <div className="text-center text-gray-400">No saved trips found.</div>
          ) : (
            <div className="space-y-6">
              {trips.map((trip, i) => {
                let date = trip.savedAt;
                if (!date) {
                  date = new Date().toISOString();
                  trip.savedAt = date;
                  const userStr = localStorage.getItem("currentUser");
                  if (userStr) {
                    const user = JSON.parse(userStr);
                    user.trips[i].savedAt = date;
                    localStorage.setItem("currentUser", JSON.stringify(user));
                    const users = JSON.parse(localStorage.getItem("users") || "[]");
                    const idx = users.findIndex((u) => u.email === user.email);
                    if (idx !== -1) {
                      users[idx] = user;
                      localStorage.setItem("users", JSON.stringify(users));
                    }
                  }
                }
                const start = trip.waypoints?.[0]?.location?.name || "Start";
                const end = trip.waypoints?.[trip.waypoints.length - 1]?.location?.name || "End";
                const stops = trip.waypoints && trip.waypoints.length > 2
                  ? trip.waypoints
                      .slice(1, -1)
                      .map((wp) => wp.location?.name)
                      .filter(Boolean)
                      .join(", ")
                  : "None";
                return (
                  <div key={i} className="relative rounded-xl bg-gray-800/90 border border-gray-700 shadow-lg p-5 flex flex-col gap-2 overflow-hidden">
                    <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-amber-400 to-orange-500 rounded-l-xl" />
                    <div className="flex items-center gap-2 mb-2">
                      <Route className="w-5 h-5 text-amber-400" />
                      <span className="text-lg font-semibold text-white">Trip #{i + 1}</span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-200">
                      <div className="flex items-center gap-1"><Calendar className="w-4 h-4 text-amber-300" /> {formatDate(date)}</div>
                      <div className="flex items-center gap-1"><MapPin className="w-4 h-4 text-green-400" /> <b>From:</b> {start}</div>
                      <div className="flex items-center gap-1"><MapPin className="w-4 h-4 text-red-400" /> <b>To:</b> {end}</div>
                      <div className="flex items-center gap-1"><List className="w-4 h-4 text-blue-400" /> <b>Stops:</b> {stops}</div>
                      <div className="flex items-center gap-1"><Route className="w-4 h-4 text-amber-400" /> <b>Distance:</b> {trip.distance || trip.route?.distance}</div>
                      <div className="flex items-center gap-1"><Timer className="w-4 h-4 text-purple-400" /> <b>Duration:</b> {trip.duration || trip.route?.duration}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <Button className="mt-8 w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-lg shadow-md hover:from-amber-600 hover:to-orange-600 focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 transition" onClick={() => router.push("/")}>Back to Planner</Button>
        </CardContent>
      </Card>
    </div>
  );
} 