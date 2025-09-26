import { ArrowLeft, Heart, MapPin, Timer, Zap } from 'lucide-react'
import { Card } from './ui/card'
import { Button } from './ui/button'

interface ActivityDetailProps {
  onBack: () => void
}

export function ActivityDetail({ onBack }: ActivityDetailProps) {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="hover:bg-gray-100"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-medium text-gray-900">Morning Run</h1>
          <p className="text-gray-600">September 15, 2025 • 7:55 AM</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main Stats */}
        <div className="xl:col-span-2 space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 bg-white border border-gray-100">
              <div className="text-2xl font-medium text-gray-900">8.06</div>
              <div className="text-sm text-gray-600">Distance (km)</div>
            </Card>
            <Card className="p-4 bg-white border border-gray-100">
              <div className="text-2xl font-medium text-gray-900">45:20</div>
              <div className="text-sm text-gray-600">Duration</div>
            </Card>
            <Card className="p-4 bg-white border border-gray-100">
              <div className="text-2xl font-medium text-gray-900">5:37</div>
              <div className="text-sm text-gray-600">Avg Pace (/km)</div>
            </Card>
            <Card className="p-4 bg-white border border-gray-100">
              <div className="text-2xl font-medium text-green-600">556</div>
              <div className="text-sm text-gray-600">Calories</div>
            </Card>
          </div>

          {/* Map */}
          <Card className="p-6 bg-white border border-gray-100">
            <h3 className="font-medium text-gray-900 mb-4">Route Map</h3>
            <div className="w-full h-80 bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center text-gray-500">
                <MapPin className="w-8 h-8 mx-auto mb-2" />
                <p>Interactive map would be displayed here</p>
                <p className="text-sm">Showing route from Songshan to Neihu District</p>
              </div>
            </div>
          </Card>

          {/* Performance Metrics */}
          <Card className="p-6 bg-white border border-gray-100">
            <h3 className="font-medium text-gray-900 mb-4">Performance Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-red-50 rounded-full mx-auto mb-2">
                  <Heart className="w-6 h-6 text-red-500" />
                </div>
                <div className="text-2xl font-medium text-gray-900">140</div>
                <div className="text-sm text-gray-600">Avg Heart Rate</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-50 rounded-full mx-auto mb-2">
                  <Zap className="w-6 h-6 text-blue-500" />
                </div>
                <div className="text-2xl font-medium text-gray-900">10</div>
                <div className="text-sm text-gray-600">Elevation Gain (m)</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-green-50 rounded-full mx-auto mb-2">
                  <Timer className="w-6 h-6 text-green-500" />
                </div>
                <div className="text-2xl font-medium text-gray-900">31.1°C</div>
                <div className="text-sm text-gray-600">Temperature</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Weather */}
          <Card className="p-4 bg-white border border-gray-100">
            <h4 className="font-medium text-gray-900 mb-3">Weather Conditions</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Temperature</span>
                <span className="text-gray-900">31.1°C</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Humidity</span>
                <span className="text-gray-900">65%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Wind</span>
                <span className="text-gray-900">8 km/h</span>
              </div>
            </div>
          </Card>

          {/* Splits */}
          <Card className="p-4 bg-white border border-gray-100">
            <h4 className="font-medium text-gray-900 mb-3">Kilometer Splits</h4>
            <div className="space-y-2 text-sm">
              {[
                { km: 1, pace: '5:42' },
                { km: 2, pace: '5:38' },
                { km: 3, pace: '5:35' },
                { km: 4, pace: '5:40' },
                { km: 5, pace: '5:33' },
                { km: 6, pace: '5:37' },
                { km: 7, pace: '5:41' },
                { km: 8, pace: '5:39' },
              ].map((split) => (
                <div key={split.km} className="flex justify-between">
                  <span className="text-gray-600">Km {split.km}</span>
                  <span className="text-gray-900">{split.pace}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Equipment */}
          <Card className="p-4 bg-white border border-gray-100">
            <h4 className="font-medium text-gray-900 mb-3">Equipment</h4>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <span className="text-xs">⌚</span>
              </div>
              <div>
                <div className="font-medium text-sm">Garmin Watch</div>
                <div className="text-xs text-gray-600">GPS + Heart Rate</div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
