import { useState } from 'react'
import { Calendar, List, Activity, Heart, MapPin } from 'lucide-react'
import { Card } from './ui/card'
import { Button } from './ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'

interface ActivityOverviewProps {
  onActivitySelect: (activityId: string) => void
}

export function ActivityOverview({ onActivitySelect }: ActivityOverviewProps) {
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')

  const activities = [
    {
      id: '1',
      date: 'Sep 15',
      year: '2025',
      type: 'Running',
      title: 'Morning Run',
      distance: '8.06 km',
      duration: '45:20',
      pace: '5:37 /km',
      elevation: '10 m',
      heartRate: '140 bpm',
    },
    {
      id: '2',
      date: 'Sep 14',
      year: '2025',
      type: 'Running',
      title: 'Evening Run',
      distance: '6.06 km',
      duration: '32:55',
      pace: '5:26 /km',
      elevation: '10 m',
      heartRate: '146 bpm',
    },
    {
      id: '3',
      date: 'Sep 13',
      year: '2025',
      type: 'Running',
      title: 'Trail Run',
      distance: '3.99 km',
      duration: '22:46',
      pace: '5:42 /km',
      elevation: '45 m',
      heartRate: '132 bpm',
    },
    {
      id: '4',
      date: 'Sep 13',
      year: '2025',
      type: 'Running',
      title: 'Long Run',
      distance: '6.01 km',
      duration: '34:40',
      pace: '5:46 /km',
      elevation: '7 m',
      heartRate: '135 bpm',
    },
    {
      id: '5',
      date: 'Sep 12',
      year: '2025',
      type: 'Running',
      title: 'Speed Training',
      distance: '15.17 km',
      duration: '1:21:32',
      pace: '5:22 /km',
      elevation: '9 m',
      heartRate: '155 bpm',
    },
  ]

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-medium text-gray-900">Activities</h1>
          <p className="text-gray-600">Track your running progress and performance</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
            className={viewMode === 'list' ? 'bg-green-600 hover:bg-green-700' : ''}
          >
            <List className="w-4 h-4" />
            List
          </Button>
          <Button
            variant={viewMode === 'calendar' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('calendar')}
            className={viewMode === 'calendar' ? 'bg-green-600 hover:bg-green-700' : ''}
          >
            <Calendar className="w-4 h-4" />
            Calendar
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4 bg-gradient-to-r from-green-50 to-green-100 border border-green-200">
          <div className="text-2xl font-medium text-green-700">39.29</div>
          <div className="text-sm text-green-600">Total Distance (km)</div>
        </Card>
        <Card className="p-4 bg-white border border-gray-100">
          <div className="text-2xl font-medium text-gray-900">5</div>
          <div className="text-sm text-gray-600">Activities This Week</div>
        </Card>
        <Card className="p-4 bg-white border border-gray-100">
          <div className="text-2xl font-medium text-gray-900">5:38</div>
          <div className="text-sm text-gray-600">Avg Pace (/km)</div>
        </Card>
        <Card className="p-4 bg-white border border-gray-100">
          <div className="text-2xl font-medium text-gray-900">142</div>
          <div className="text-sm text-gray-600">Avg Heart Rate</div>
        </Card>
      </div>

      {/* Activity Content */}
      {viewMode === 'list' ? (
        <Card className="bg-white border border-gray-100">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-medium text-gray-900">Recent Activities</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => onActivitySelect(activity.id)}
              >
                <div className="flex items-center gap-4">
                  {/* Date */}
                  <div className="text-center min-w-[60px]">
                    <div className="text-lg font-medium text-gray-900">{activity.date.split(' ')[1]}</div>
                    <div className="text-xs text-gray-600">{activity.date.split(' ')[0]}</div>
                    <div className="text-xs text-gray-500">{activity.year}</div>
                  </div>

                  {/* Activity Icon */}
                  <div className="flex items-center justify-center w-10 h-10 bg-green-50 rounded-full">
                    <Activity className="w-5 h-5 text-green-600" />
                  </div>

                  {/* Activity Details */}
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-6 gap-4">
                    <div>
                      <div className="font-medium text-gray-900">{activity.title}</div>
                      <div className="text-sm text-gray-600">{activity.type}</div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{activity.distance}</div>
                      <div className="text-sm text-gray-600">Distance</div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{activity.duration}</div>
                      <div className="text-sm text-gray-600">Duration</div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{activity.pace}</div>
                      <div className="text-sm text-gray-600">Avg Pace</div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{activity.elevation}</div>
                      <div className="text-sm text-gray-600">Elevation</div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1">
                        <Heart className="w-4 h-4 text-red-500" />
                        <span className="font-medium text-gray-900">{activity.heartRate}</span>
                      </div>
                      <div className="text-sm text-gray-600">Avg HR</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <Card className="p-6 bg-white border border-gray-100">
          <div className="text-center py-20">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Calendar View</h3>
            <p className="text-gray-600">Interactive calendar with activity markers would be displayed here</p>
          </div>
        </Card>
      )}
    </div>
  )
}
