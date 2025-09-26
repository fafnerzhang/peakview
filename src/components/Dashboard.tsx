import { Activity, Calendar, Target, TrendingUp, Award, Heart } from 'lucide-react'
import { Card } from './ui/card'
import { Progress } from './ui/progress'

export function Dashboard() {
  const weeklyGoal = {
    target: 50,
    current: 39.29,
    percentage: 78.58
  }

  const monthlyStats = [
    { label: 'Distance', value: '156.8 km', icon: Activity, color: 'text-green-600' },
    { label: 'Activities', value: '18', icon: Calendar, color: 'text-blue-600' },
    { label: 'Avg Pace', value: '5:42 /km', icon: TrendingUp, color: 'text-purple-600' },
    { label: 'Avg HR', value: '138 bpm', icon: Heart, color: 'text-red-600' },
  ]

  const recentAchievements = [
    { title: 'Personal Best', description: 'Fastest 5K time: 24:32', date: 'Sep 10' },
    { title: 'Consistency', description: '7 days running streak', date: 'Sep 8' },
    { title: 'Distance Goal', description: 'Weekly 40km target reached', date: 'Sep 5' },
  ]

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-medium text-gray-900">Your Fitness Dashboard</h1>
        <p className="text-gray-600">Track your progress across workouts, calories, hydration, and overall activity</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {monthlyStats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} className="p-4 bg-white border border-gray-100">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-gray-50 ${stat.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-lg font-medium text-gray-900">{stat.value}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Goal Progress */}
        <Card className="p-6 bg-white border border-gray-100 lg:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <Target className="w-5 h-5 text-green-600" />
            <h3 className="font-medium text-gray-900">Weekly Distance Goal</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Progress</span>
              <span className="text-sm font-medium text-gray-900">
                {weeklyGoal.current}km of {weeklyGoal.target}km
              </span>
            </div>
            <Progress 
              value={weeklyGoal.percentage} 
              className="h-3"
            />
            <div className="flex justify-between text-sm">
              <span className="text-green-600 font-medium">{weeklyGoal.percentage.toFixed(1)}% complete</span>
              <span className="text-gray-600">{(weeklyGoal.target - weeklyGoal.current).toFixed(1)}km remaining</span>
            </div>
          </div>
        </Card>

        {/* Quick Stats */}
        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
          <div className="text-center">
            <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div className="text-2xl font-medium text-green-700 mb-1">+12%</div>
            <div className="text-sm text-green-600">Improvement this month</div>
            <div className="text-xs text-green-500 mt-2">Compared to last month</div>
          </div>
        </Card>
      </div>

      {/* Recent Achievements */}
      <Card className="mt-6 p-6 bg-white border border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <Award className="w-5 h-5 text-yellow-600" />
          <h3 className="font-medium text-gray-900">Recent Achievements</h3>
        </div>
        <div className="space-y-3">
          {recentAchievements.map((achievement, index) => (
            <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <Award className="w-5 h-5 text-yellow-600" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">{achievement.title}</div>
                <div className="text-sm text-gray-600">{achievement.description}</div>
              </div>
              <div className="text-sm text-gray-500">{achievement.date}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Training Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <Card className="p-6 bg-white border border-gray-100">
          <h3 className="font-medium text-gray-900 mb-4">Training Load</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Fatigue</span>
              <span className="text-lg font-medium text-orange-600">7.2</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Fitness</span>
              <span className="text-lg font-medium text-green-600">8.5</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Form</span>
              <span className="text-lg font-medium text-blue-600">1.3</span>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white border border-gray-100">
          <h3 className="font-medium text-gray-900 mb-4">Recovery Metrics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Resting Heart Rate</span>
              <span className="text-lg font-medium text-green-600">45 bpm</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">HRV</span>
              <span className="text-lg font-medium text-blue-600">42 ms</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Sleep Duration</span>
              <span className="text-lg font-medium text-purple-600">7.2 hours</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
