import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Code, Globe, Database, Play, CheckCircle, Route, MapPin } from "lucide-react"

export default function SetupInstructions() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          <strong>100% Free Multi-Stop Route Optimizer!</strong> No API keys, no billing, no payment methods required.
          Uses OpenStreetMap's free services for unlimited route optimization.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Route className="w-5 h-5" />
            Multi-Stop Route Optimization Features
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <h3 className="font-semibold">Core Capabilities</h3>
            <ul className="list-disc list-inside space-y-2 text-sm ml-4">
              <li>
                <strong>Starting Location:</strong> Set your journey's beginning point
              </li>
              <li>
                <strong>Up to 10 Intermediate Hops:</strong> Add multiple stops along your route
              </li>
              <li>
                <strong>Final Destination:</strong> Set your journey's end point
              </li>
              <li>
                <strong>Route Optimization:</strong> Uses OSRM's TSP solver to find the shortest path visiting all
                points
              </li>
              <li>
                <strong>Dynamic Planning:</strong> Add/remove hops and recalculate routes instantly
              </li>
              <li>
                <strong>Animated Visualization:</strong> Watch your vehicle travel the optimized route
              </li>
            </ul>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-2">Free Services Used</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>
                • <strong>OSRM Trip API:</strong> Traveling Salesman Problem solver
              </li>
              <li>
                • <strong>Nominatim:</strong> Place search and geocoding
              </li>
              <li>
                • <strong>OpenStreetMap:</strong> Map tiles and geographic data
              </li>
              <li>
                • <strong>Leaflet:</strong> Interactive map visualization
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="w-5 h-5" />
            Local Development Setup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <h3 className="font-semibold">Quick Start (3 Steps)</h3>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="bg-green-100 text-green-800">
                  Step 1
                </Badge>
                <div className="bg-gray-100 p-2 rounded-md flex-1">
                  <code className="text-sm">npm install</code>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Badge variant="outline" className="bg-blue-100 text-blue-800">
                  Step 2
                </Badge>
                <div className="bg-gray-100 p-2 rounded-md flex-1">
                  <code className="text-sm">npm run dev</code>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Badge variant="outline" className="bg-purple-100 text-purple-800">
                  Step 3
                </Badge>
                <div className="text-sm">
                  Open <code className="bg-gray-100 px-2 py-1 rounded">http://localhost:3000</code> and start planning!
                </div>
              </div>
            </div>
          </div>

          <Alert className="border-amber-200 bg-amber-50">
            <MapPin className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              <strong>No Configuration Required!</strong> The app works immediately with public OpenStreetMap services.
              Perfect for development and testing.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="w-5 h-5" />
            API Endpoints & Usage
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <h3 className="font-semibold">Available API Routes</h3>

            <div className="space-y-3">
              <div className="bg-gray-50 p-3 rounded-md">
                <div className="font-mono text-sm mb-2 text-blue-600">GET /api/nominatim/search?q=cairo</div>
                <div className="text-xs text-gray-600">Search for places using Nominatim geocoding service</div>
              </div>

              <div className="bg-gray-50 p-3 rounded-md">
                <div className="font-mono text-sm mb-2 text-green-600">
                  GET /api/osrm/trip?coordinates=lng1,lat1;lng2,lat2;lng3,lat3
                </div>
                <div className="text-xs text-gray-600">Calculate optimized multi-stop route using OSRM Trip API</div>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-800 mb-2">Route Optimization Algorithm</h4>
            <div className="text-sm text-green-700">
              The app uses OSRM's Trip API which implements a Traveling Salesman Problem (TSP) solver to find the
              shortest route that visits all waypoints exactly once and returns to the destination.
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Production Deployment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <h3 className="font-semibold">For High-Traffic Production Use</h3>

            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
              <h4 className="font-semibold text-amber-800 mb-2">Recommended Infrastructure</h4>
              <ul className="text-sm text-amber-700 space-y-1">
                <li>• Host your own OSRM server for unlimited requests</li>
                <li>• Set up local Nominatim instance for geocoding</li>
                <li>• Use your own tile server for map rendering</li>
                <li>• Implement Redis caching for API responses</li>
                <li>• Add rate limiting and request queuing</li>
              </ul>
            </div>

            <div className="bg-gray-100 p-3 rounded-md text-sm">
              <div className="font-semibold mb-2">Docker Setup Example:</div>
              <pre className="text-xs overflow-x-auto">{`# OSRM Backend
docker run -t -v "\${PWD}:/data" osrm/osrm-backend osrm-extract -p /opt/car.lua /data/region.osm.pbf
docker run -t -v "\${PWD}:/data" osrm/osrm-backend osrm-partition /data/region.osrm
docker run -t -v "\${PWD}:/data" osrm/osrm-backend osrm-customize /data/region.osrm
docker run -t -i -p 5000:5000 -v "\${PWD}:/data" osrm/osrm-backend osrm-routed --algorithm mld /data/region.osrm

# Nominatim
docker run -it -e PBF_URL=https://download.geofabrik.de/africa-latest.osm.pbf \\
  -e REPLICATION_URL=https://download.geofabrik.de/africa-updates/ \\
  -p 8080:8080 --name nominatim mediagis/nominatim:4.2`}</pre>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Usage Limits & Fair Use
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-2">Nominatim Limits</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• 1 request per second</li>
                <li>• No more than 1 request per IP</li>
                <li>• Bulk geocoding discouraged</li>
                <li>• Provide proper User-Agent</li>
              </ul>
            </div>

            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-800 mb-2">OSRM Demo Server</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• No strict rate limits</li>
                <li>• Best effort service</li>
                <li>• May have occasional downtime</li>
                <li>• Perfect for development</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Ready to Optimize Routes!</strong> The multi-stop route optimizer is fully functional with free
          OpenStreetMap services. Start planning complex journeys with up to 10 intermediate stops!
        </AlertDescription>
      </Alert>
    </div>
  )
}
