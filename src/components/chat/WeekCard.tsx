import { useState, useEffect } from 'react'
import { ChevronDown, ChevronRight, Calendar, Clock, CheckCircle } from 'lucide-react'
import { Badge } from '@/src/components/ui/badge'
import { Card } from '@/src/components/ui/card'
import { WorkoutCard } from './WorkoutCard'

interface WorkflowStepOutput {
  stepName: string
  id: string
  stepCallId: string
  payload: any
  startedAt: number
  status: 'success' | 'running' | 'failed'
  output?: any
  endedAt?: number
}

interface WorkflowState {
  status: 'success' | 'running' | 'failed' | 'pending'
  steps: {
    [stepName: string]: WorkflowStepOutput
  }
}

interface WeekCardOutput {
  payload?: {
    workflowState?: WorkflowState
  }
  result?: any
}

interface WeekCardProps {
  toolName: string
  input?: any
  output?: WeekCardOutput
  result?: any
  state?: 'output-available' | 'input-available' | 'streaming' | 'complete'
  payload?: {
    workflowState?: WorkflowState
  }
  onAggregateWorkouts?: (workouts: any, phaseId?: string) => void
}

type WorkflowUIState = 'streaming' | 'success' | 'failed' | 'pending'

interface WorkoutPlan {
  workout_id: string
  title: string
  phase_id?: string
  date: string
  description: string
  detail: any[]
  estimated_tss: number | null
  total_time: number | null
  total_distance: number | null
}

export function WeekCard({ toolName, input, output, result, payload, onAggregateWorkouts }: WeekCardProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [selectedWorkout, setSelectedWorkout] = useState<string | null>(null)
  const [autoIntegrated, setAutoIntegrated] = useState(false)

  // Extract workouts from workflow state (similar to PhaseChunkCard)
  const extractWorkouts = (): Record<string, WorkoutPlan> | null => {
    // Priority 1: From output.payload.workflowState.steps
    const workflowState = output?.payload?.workflowState
    if (workflowState?.steps) {
      const aggregateStep = workflowState.steps['aggregate-workouts']
      if (aggregateStep?.output) {
        return aggregateStep.output
      }
    }

    // Priority 2: From payload.workflowState.steps
    if (payload?.workflowState?.steps) {
      const aggregateStep = payload.workflowState.steps['aggregate-workouts']
      if (aggregateStep?.output) {
        return aggregateStep.output
      }
    }

    // Priority 3: Direct result
    if (result && typeof result === 'object') {
      return result
    }

    return null
  }

  // Get workflow status
  const getWorkflowStatus = (): WorkflowUIState => {
    const workflowStatus = output?.payload?.workflowState?.status
    if (workflowStatus) {
      if (workflowStatus === 'running') return 'streaming'
      if (workflowStatus === 'success') return 'success'
      if (workflowStatus === 'failed') return 'failed'
      return 'pending'
    }

    const fallbackStatus = payload?.workflowState?.status
    if (fallbackStatus) {
      if (fallbackStatus === 'running') return 'streaming'
      if (fallbackStatus === 'success') return 'success'
      if (fallbackStatus === 'failed') return 'failed'
      return 'pending'
    }

    const workouts = extractWorkouts()
    return workouts ? 'success' : 'pending'
  }

  const workflowStatus = getWorkflowStatus()

  // Auto-integrate workouts when workflow completes
  useEffect(() => {
    if (workflowStatus === 'success' && !autoIntegrated && onAggregateWorkouts) {
      const workouts = extractWorkouts()
      if (workouts) {
        // Extract phase_id from first workout if available
        const firstWorkout = Object.values(workouts)[0]
        const phaseId = firstWorkout?.phase_id
        onAggregateWorkouts(workouts, phaseId)
        setAutoIntegrated(true)
      }
    }
  }, [workflowStatus, autoIntegrated, onAggregateWorkouts])

  // Show streaming state
  if (workflowStatus === 'streaming') {
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

  const workouts = extractWorkouts()
  const workoutCount = workouts ? Object.keys(workouts).length : 0

  // Don't render if pending with no workouts
  if (workflowStatus === 'pending' && !workouts) {
    return null
  }

  return (
    <div className="border-2 border-emerald-200 rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 shadow-lg">
      <div
        className="flex items-center justify-between p-5 cursor-pointer hover:bg-gradient-to-br hover:from-emerald-100 hover:to-green-100 transition-all duration-200 rounded-t-xl"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-emerald-100 rounded-xl">
            {workflowStatus === 'streaming' ? (
              <Calendar className="h-6 w-6 text-emerald-600 animate-pulse" />
            ) : workflowStatus === 'failed' ? (
              <Calendar className="h-6 w-6 text-red-600" />
            ) : (
              <Calendar className="h-6 w-6 text-emerald-600" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-emerald-900">
              {workflowStatus === 'streaming' && 'Creating Weekly Workouts'}
              {workflowStatus === 'failed' && 'Workout Generation Failed'}
              {(workflowStatus === 'success' || workflowStatus === 'pending') && 'Weekly Workout Plans'}
            </h3>
            <p className="text-sm text-emerald-700">
              {workflowStatus === 'streaming' && 'Generating detailed workout structures and intervals...'}
              {workflowStatus === 'failed' && 'Unable to generate workouts. Please try again.'}
              {(workflowStatus === 'success' || workflowStatus === 'pending') && (
                <>
                  {workoutCount} detailed workouts created
                  {workflowStatus === 'success' || autoIntegrated ? ' • Successfully integrated' : ''}
                </>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {workflowStatus === 'streaming' && (
            <Clock className="h-5 w-5 text-emerald-600 animate-spin" />
          )}
          {(workflowStatus === 'success' || autoIntegrated) && (
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
            {workflowStatus === 'success' || autoIntegrated ? (
              <p className="text-sm text-green-700 flex items-center space-x-1">
                <CheckCircle className="h-4 w-4" />
                <span>Workouts automatically added to your training plan</span>
              </p>
            ) : (
              <p className="text-sm text-emerald-700">
                Review your detailed workout plans below
              </p>
            )}
          </div>
          <div className="space-y-3">
            {workouts && Object.keys(workouts).length > 0 ? (
              Object.entries(workouts).map(([key, workout]) => {
                const workoutPlan = workout as WorkoutPlan
                return (
                  <WorkoutCard
                    key={key}
                    workout={workoutPlan}
                    isAdded={workflowStatus === 'success' || autoIntegrated}
                    onSelect={(id) => setSelectedWorkout(selectedWorkout === id ? null : id)}
                    isSelected={selectedWorkout === workoutPlan.workout_id}
                  />
                )
              })
            ) : (
              <p className="text-sm text-emerald-600 text-center py-4">Generating workouts...</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
