import { useState, useEffect } from 'react'
import { ChevronDown, ChevronRight, Calendar, Clock, MapPin, Target, Activity, CheckCircle } from 'lucide-react'
import { Badge } from '@/src/components/ui/badge'
import { Card } from '@/src/components/ui/card'

interface WorkoutPlanResultProps {
  toolName: string
  input?: any
  output?: any
  state?: 'streaming' | 'complete' | 'output-available' | 'input-available'
  onAggregateWorkouts?: (workouts: any, phaseId?: string) => void
}

interface WorkoutDetail {
  type: string
  duration?: number
  distance_range?: { min: number; max: number }
  intensity_metric: string
  target_range: { min: number; max: number }
  description: string
  pre?: number
  tags?: string[]
}

interface WorkoutPlan {
  id: string
  title: string
  date: string
  description: string
  detail: WorkoutDetail[]
  estimated_tss: number | null
  total_time: number | null
  total_distance: number | null
}

export function WorkoutPlanResult({ toolName, input, output, state, onAggregateWorkouts }: WorkoutPlanResultProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [selectedWorkout, setSelectedWorkout] = useState<string | null>(null)
  const [autoIntegrated, setAutoIntegrated] = useState(false)

  const getIntensityColor = (pre?: number) => {
    switch (pre) {
      case 1: return 'bg-blue-100 text-blue-800 border-blue-200'  // Recovery
      case 2: return 'bg-green-100 text-green-800 border-green-200'  // Easy
      case 3: return 'bg-yellow-100 text-yellow-800 border-yellow-200'  // Moderate
      case 7: return 'bg-red-100 text-red-800 border-red-200'  // High intensity
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getIntensityLabel = (pre?: number) => {
    switch (pre) {
      case 1: return 'Recovery'
      case 2: return 'Easy'
      case 3: return 'Moderate'
      case 7: return 'Hard'
      default: return 'Varied'
    }
  }

  // Auto-integrate workouts when streaming completes
  useEffect(() => {
    if (state === 'complete' && !autoIntegrated && onAggregateWorkouts) {
      const workouts = output?.payload?.workflowState?.steps?.['aggregate-workouts']?.output
      if (workouts) {
        onAggregateWorkouts(workouts)
        setAutoIntegrated(true)
      }
    }
  }, [state, output, autoIntegrated, onAggregateWorkouts])

  const formatDuration = (minutes?: number) => {
    if (!minutes) return 'N/A'
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  const formatDistance = (meters?: number) => {
    if (!meters) return 'N/A'
    return `${(meters / 1000).toFixed(1)}km`
  }

  const renderWorkoutCard = (workout: WorkoutPlan) => {
    const isSelected = selectedWorkout === workout.id

    return (
      <Card
        key={workout.id}
        className={`p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
          isSelected ? 'ring-2 ring-green-500' : ''
        }`}
        onClick={() => setSelectedWorkout(isSelected ? null : workout.id)}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h4 className="font-medium text-gray-900">{workout.title}</h4>
              <Badge variant="outline" className={getIntensityColor(workout.detail[0]?.pre)}>
                {getIntensityLabel(workout.detail[0]?.pre)}
              </Badge>
            </div>
            <p className="text-sm text-gray-700 mb-3">{workout.description}</p>

            <div className="flex items-center space-x-4 text-xs text-gray-600">
              <div className="flex items-center space-x-1">
                <Calendar className="h-3 w-3" />
                <span>{new Date(workout.date).toLocaleDateString()}</span>
              </div>
              {workout.total_time && (
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>{formatDuration(workout.total_time)}</span>
                </div>
              )}
              {workout.total_distance && (
                <div className="flex items-center space-x-1">
                  <MapPin className="h-3 w-3" />
                  <span>{formatDistance(workout.total_distance)}</span>
                </div>
              )}
              {workout.estimated_tss && (
                <div className="flex items-center space-x-1">
                  <Target className="h-3 w-3" />
                  <span>TSS: {workout.estimated_tss}</span>
                </div>
              )}
            </div>
          </div>
          {(state === 'complete' || autoIntegrated) && (
            <div className="flex items-center space-x-1 text-green-600 ml-4">
              <CheckCircle className="h-4 w-4" />
              <span className="text-xs">Added</span>
            </div>
          )}
        </div>

        {isSelected && workout.detail && (
          <div className="mt-4 pt-3 border-t border-gray-200">
            <h5 className="text-sm font-medium text-gray-700 mb-3">Workout Structure</h5>
            <div className="space-y-2">
              {workout.detail.map((detail, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">{detail.type}</span>
                    {detail.tags && detail.tags.length > 0 && (
                      <div className="flex gap-1">
                        {detail.tags.map((tag, tagIndex) => (
                          <Badge key={tagIndex} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{detail.description}</p>
                  <div className="flex items-center space-x-3 text-xs text-gray-600">
                    {detail.duration && (
                      <div>Duration: {formatDuration(detail.duration)}</div>
                    )}
                    {detail.distance_range && (
                      <div>
                        Distance: {formatDistance(detail.distance_range.min * 1000)} - {formatDistance(detail.distance_range.max * 1000)}
                      </div>
                    )}
                    {detail.target_range && (
                      <div>
                        {detail.intensity_metric}: {detail.target_range.min} - {detail.target_range.max}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    )
  }

  // Show streaming state
  if (state === 'streaming') {
    return (
      <div className="border border-green-200 rounded-lg bg-green-50 shadow-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <Calendar className="h-5 w-5 text-green-600 animate-pulse" />
            <div>
              <h3 className="font-medium text-green-900">Generating Detailed Workouts</h3>
              <p className="text-sm text-green-700">Creating specific workout content for each training phase...</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className="bg-green-600 text-white animate-pulse">Generating</Badge>
            <Clock className="h-4 w-4 text-green-600 animate-spin" />
          </div>
        </div>
      </div>
    )
  }

  if (!output?.payload?.workflowState?.steps?.['aggregate-workouts']?.output) {
    return null
  }

  const workouts = output.payload.workflowState.steps['aggregate-workouts'].output
  const workoutCount = Object.keys(workouts).length

  return (
    <div className="border border-green-200 rounded-lg bg-green-50 shadow-sm">
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-green-100 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3">
          <Calendar className="h-5 w-5 text-green-600" />
          <div>
            <h3 className="font-medium text-green-900">Detailed Workouts Created</h3>
            <p className="text-sm text-green-700">
              Generated {workoutCount} detailed workout plans
              {state === 'complete' || autoIntegrated ? ' • Automatically added to your plan' : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className="bg-green-600 text-white">
            {state === 'complete' || autoIntegrated ? 'Complete' : 'Generated'}
          </Badge>
          {(state === 'complete' || autoIntegrated) && (
            <CheckCircle className="h-4 w-4 text-green-600" />
          )}
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-green-600" />
          ) : (
            <ChevronRight className="h-4 w-4 text-green-600" />
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-green-200 p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-green-900">Workout Plans</h4>
              {state === 'complete' || autoIntegrated ? (
                <p className="text-sm text-green-700 flex items-center space-x-1">
                  <CheckCircle className="h-3 w-3" />
                  <span>Workouts automatically added to your training plan</span>
                </p>
              ) : (
                <p className="text-sm text-green-700">
                  Click on any workout to view detailed structure
                </p>
              )}
            </div>
            <div className="space-y-3">
              {Object.entries(workouts).map(([key, workout]) =>
                renderWorkoutCard(workout as WorkoutPlan)
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
