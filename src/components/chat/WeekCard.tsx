import { useState, useEffect } from 'react'
import { ChevronDown, ChevronRight, Calendar, Clock, CheckCircle } from 'lucide-react'
import { Badge } from '@/src/components/ui/badge'
import { Card } from '@/src/components/ui/card'
import { WorkoutCard } from './WorkoutCard'

interface WeekCardProps {
  toolName: string
  input?: any
  output?: any
  state?: 'streaming' | 'complete' | 'output-available' | 'input-available'
  onAggregateWorkouts?: (workouts: any, phaseId?: string) => void
}

interface WorkoutPlan {
  id: string
  title: string
  date: string
  description: string
  detail: any[]
  estimated_tss: number | null
  total_time: number | null
  total_distance: number | null
}

export function WeekCard({ toolName, input, output, state, onAggregateWorkouts }: WeekCardProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [selectedWorkout, setSelectedWorkout] = useState<string | null>(null)
  const [autoIntegrated, setAutoIntegrated] = useState(false)

  // Auto-integrate workouts when streaming completes
  useEffect(() => {
    if (state === 'complete' && !autoIntegrated && onAggregateWorkouts) {
      // Handle aggregate-workouts step output
      const aggregateWorkouts = output?.payload?.workflowState?.steps?.['aggregate-workouts']?.output
      if (aggregateWorkouts) {
        onAggregateWorkouts(aggregateWorkouts)
        setAutoIntegrated(true)
        return
      }

      // Handle generateDetailedWorkoutsWorkflow direct output
      const workflowOutput = output?.payload?.workflowState?.result || output?.result
      if (workflowOutput) {
        onAggregateWorkouts(workflowOutput)
        setAutoIntegrated(true)
        return
      }
    }
  }, [state, output, autoIntegrated, onAggregateWorkouts])

  // Show streaming state
  if (state === 'streaming') {
    const isDetailedWorkflow = toolName?.includes('generateDetailedWorkouts') ||
                              toolName?.includes('DetailedWorkouts') ||
                              toolName?.includes('generateDetailedWork-outs')

    return (
      <div className="border-2 border-dashed border-emerald-300 rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 shadow-sm">
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-emerald-100 rounded-xl">
              <Calendar className="h-6 w-6 text-emerald-600 animate-pulse" />
            </div>
            <div>
              <h3 className="font-semibold text-emerald-900">
                {isDetailedWorkflow ? 'Creating Detailed Weekly Workouts' : 'Aggregating Workout Plans'}
              </h3>
              <p className="text-sm text-emerald-700">
                {isDetailedWorkflow
                  ? 'Generating specific workout structures and intervals for each week...'
                  : 'Compiling and organizing workout plans...'
                }
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className="bg-emerald-600 text-white animate-pulse">Generating</Badge>
            <Clock className="h-5 w-5 text-emerald-600 animate-spin" />
          </div>
        </div>
      </div>
    )
  }

  // Show input-available state (workflow ready to process)
  if (state === 'input-available') {
    return (
      <div className="border-2 border-dashed border-emerald-300 rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 shadow-sm">
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-emerald-100 rounded-xl">
              <Calendar className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold text-emerald-900">Weekly Workout Generation Ready</h3>
              <p className="text-sm text-emerald-700">Detailed workout plans will be created for this week...</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className="bg-emerald-600 text-white">Ready</Badge>
            <Clock className="h-5 w-5 text-emerald-600" />
          </div>
        </div>
      </div>
    )
  }

  // Get workouts from either workflow type
  const aggregateWorkouts = output?.payload?.workflowState?.steps?.['aggregate-workouts']?.output
  const workflowOutput = output?.payload?.workflowState?.result || output?.result

  const workouts = aggregateWorkouts || workflowOutput

  // Show card even if no workouts yet, but in a different state
  if (!workouts && state !== 'streaming' && state !== 'input-available') {
    return null
  }

  const workoutCount = workouts && typeof workouts === 'object' ? Object.keys(workouts).length : 0

  return (
    <div className="border-2 border-emerald-200 rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 shadow-lg">
      <div
        className="flex items-center justify-between p-5 cursor-pointer hover:bg-gradient-to-br hover:from-emerald-100 hover:to-green-100 transition-all duration-200 rounded-t-xl"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-emerald-100 rounded-xl">
            <Calendar className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-semibold text-emerald-900">Weekly Workout Plans</h3>
            <p className="text-sm text-emerald-700">
              {workoutCount} detailed workouts created
              {state === 'complete' || autoIntegrated ? ' • Successfully integrated' : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Badge className="bg-emerald-600 text-white font-medium">
            {state === 'complete' || autoIntegrated ? 'Complete' : 'Generated'}
          </Badge>
          {(state === 'complete' || autoIntegrated) && (
            <CheckCircle className="h-5 w-5 text-green-600" />
          )}
          {isExpanded ? (
            <ChevronDown className="h-5 w-5 text-emerald-600" />
          ) : (
            <ChevronRight className="h-5 w-5 text-emerald-600" />
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="border-t-2 border-emerald-200 p-5 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-emerald-900">Workout Details</h4>
            {state === 'complete' || autoIntegrated ? (
              <p className="text-sm text-green-700 flex items-center space-x-1">
                <CheckCircle className="h-4 w-4" />
                <span>Workouts automatically added to your training plan</span>
              </p>
            ) : (
              <p className="text-sm text-emerald-700">
                Click on any workout to view detailed structure
              </p>
            )}
          </div>
          <div className="space-y-3">
            {workouts && typeof workouts === 'object' ?
              Object.entries(workouts).map(([key, workout]) => {
                const workoutPlan = workout as WorkoutPlan
                return (
                  <WorkoutCard
                    key={key}
                    workout={workoutPlan}
                    isAdded={state === 'complete' || autoIntegrated}
                    onSelect={(id) => setSelectedWorkout(selectedWorkout === id ? null : id)}
                    isSelected={selectedWorkout === workoutPlan.id}
                  />
                )
              }) : (
                <div className="text-center py-4 text-emerald-600">
                  <p className="text-sm">Workout details will appear here once generated</p>
                </div>
              )
            }
          </div>
        </div>
      )}
    </div>
  )
}
