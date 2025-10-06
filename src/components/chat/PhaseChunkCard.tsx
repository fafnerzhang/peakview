import { useState, useEffect } from 'react'
import { ChevronDown, ChevronRight, Calendar, Clock, CheckCircle, Layers, Activity } from 'lucide-react'
import { Badge } from '@/src/components/ui/badge'
import { Card } from '@/src/components/ui/card'
import { TrainingPhase } from '@/src/components/plan/types'

interface WorkflowStepOutput {
  stepName: string
  id: string
  stepCallId: string
  payload: any
  startedAt: number
  status: 'success' | 'running' | 'failed'
  output?: {
    phases?: PhaseData[]
  }
  endedAt?: number
}

interface WorkflowState {
  status: 'success' | 'running' | 'failed' | 'pending'
  steps: {
    [stepName: string]: WorkflowStepOutput
  }
}

interface PhaseChunkCardOutput {
  payload?: {
    workflowState?: WorkflowState
  }
  phases?: PhaseData[]
}

interface PhaseChunkCardProps {
  toolName: string
  input?: any
  output?: PhaseChunkCardOutput
  result?: any
  state?: 'output-available' | 'input-available' | 'streaming' | 'complete'
  payload?: {
    workflowState?: WorkflowState
  }
  onAddPhaseToPanel?: (phase: TrainingPhase) => void
}

type WorkflowUIState = 'streaming' | 'success' | 'failed' | 'pending'

interface PhaseData {
  id?: string
  name: string
  tag: string
  description: string
  weeks: Array<{
    id: string
    start_date: string
    end_date: string
    description: string
    critical_workouts: Array<{
      id: string
      description: string
      tags?: string[]
    }>
  }>
}

export function PhaseChunkCard({ toolName, input, output, result, payload, onAddPhaseToPanel }: PhaseChunkCardProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [autoIntegrated, setAutoIntegrated] = useState(false)

  // Extract phases from workflow state
  const extractPhases = (): PhaseData[] | null => {
    // Priority 1: From output.payload.workflowState.steps (primary structure from data)
    const workflowState = output?.payload?.workflowState
    if (workflowState?.steps) {
      const generateStep = workflowState.steps['generate-training-phases']
      if (generateStep?.output?.phases && Array.isArray(generateStep.output.phases)) {
        return generateStep.output.phases
      }
    }

    // Priority 2: From payload.workflowState.steps (alternative structure)
    if (payload?.workflowState?.steps) {
      const generateStep = payload.workflowState.steps['generate-training-phases']
      if (generateStep?.output?.phases && Array.isArray(generateStep.output.phases)) {
        return generateStep.output.phases
      }
    }

    // Priority 3: Direct result.phases (fallback)
    if (result?.phases && Array.isArray(result.phases)) {
      return result.phases
    }

    return null
  }

  // Get workflow status from output.payload.workflowState - this is the source of truth
  const getWorkflowStatus = (): WorkflowUIState => {
    // Priority 1: Check output.payload.workflowState.status
    const workflowStatus = output?.payload?.workflowState?.status

    if (workflowStatus) {
      // Map workflow status to UI state
      if (workflowStatus === 'running') return 'streaming'
      if (workflowStatus === 'success') return 'success'
      if (workflowStatus === 'failed') return 'failed'
      return 'pending'
    }

    // Priority 2: Check payload.workflowState.status (fallback)
    const fallbackStatus = payload?.workflowState?.status
    if (fallbackStatus) {
      if (fallbackStatus === 'running') return 'streaming'
      if (fallbackStatus === 'success') return 'success'
      if (fallbackStatus === 'failed') return 'failed'
      return 'pending'
    }

    // Priority 3: If no workflow state, check if we have data
    const phases = extractPhases()
    return phases ? 'success' : 'pending'
  }

  const workflowStatus = getWorkflowStatus()

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      weekday: 'short'
    })
  }

  const getPhaseTypeColor = (tag: string) => {
    switch (tag.toLowerCase()) {
      case 'base':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'build':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'peak':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'taper':
      case 'recovery':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const convertToTrainingPhase = (phaseData: PhaseData): TrainingPhase => {
    const getPhaseType = (tag: string): 'general' | 'specific' | 'peak' | 'recovery' => {
      switch (tag.toLowerCase()) {
        case 'base': return 'general'
        case 'build': return 'specific'
        case 'peak': return 'peak'
        case 'taper': return 'recovery'
        default: return 'general'
      }
    }

    const uniqueId = Date.now()
    const firstWeek = phaseData.weeks[0]
    const lastWeek = phaseData.weeks[phaseData.weeks.length - 1]

    return {
      id: `${phaseData.id || phaseData.tag}-${uniqueId}`,
      title: phaseData.name,
      description: phaseData.description,
      type: getPhaseType(phaseData.tag),
      startDate: firstWeek?.start_date || new Date().toISOString(),
      endDate: lastWeek?.end_date || new Date().toISOString(),
      weeks: (phaseData.weeks || []).map(week => ({
        id: `${week.id}-${uniqueId}`,
        title: week.description,
        weekNumber: parseInt(week.id.split('-')[1]) || 1,
        startDate: week.start_date,
        endDate: week.end_date,
        workouts: (week.critical_workouts || []).map((workout) => ({
          id: `${workout.id}-${uniqueId}`,
          title: workout.description.split(':')[0] || 'Workout',
          description: workout.description,
          date: week.start_date,
          totalTime: '45 minutes',
          totalDistance: '7.5 km',
          difficulty: 'moderate' as const,
          tss: 65,
          workouts: [{
            id: `${workout.id}-block-${uniqueId}`,
            type: 'steady' as const,
            title: workout.description.split(':')[0] || 'Training Block',
            duration: '45 min',
            zone: 2,
            intensity: 'moderate' as const,
            description: workout.description,
            tags: workout.tags || []
          }]
        }))
      }))
    }
  }

  // Auto-integrate phases when workflow completes successfully
  useEffect(() => {
    if (workflowStatus === 'success' && !autoIntegrated && onAddPhaseToPanel) {
      const phases = extractPhases()
      if (phases && phases.length > 0) {
        phases.forEach((phaseData: PhaseData) => {
          const trainingPhase = convertToTrainingPhase(phaseData)
          onAddPhaseToPanel(trainingPhase)
        })
        setAutoIntegrated(true)
      }
    }
  }, [workflowStatus, autoIntegrated, onAddPhaseToPanel])

  const renderPhaseCard = (phaseData: PhaseData, index: number) => {
    const weekCount = (phaseData.weeks || []).length
    const workoutCount = (phaseData.weeks || []).reduce((acc, week) => {
      if (!week || !week.critical_workouts || !Array.isArray(week.critical_workouts)) {
        return acc
      }
      return acc + week.critical_workouts.length
    }, 0)

    const firstWeek = phaseData.weeks[0]
    const lastWeek = phaseData.weeks[phaseData.weeks.length - 1]

    return (
      <Card key={index} className="bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-200 shadow-md">
        <div className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Layers className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className="font-semibold text-gray-900">{phaseData.name}</h3>
                  <Badge variant="outline" className={getPhaseTypeColor(phaseData.tag)}>
                    {phaseData.tag.charAt(0).toUpperCase() + phaseData.tag.slice(1)}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">
                  {weekCount} {weekCount === 1 ? 'week' : 'weeks'}
                </p>
              </div>
            </div>
            {(workflowStatus === 'success' || autoIntegrated) && (
              <div className="flex items-center space-x-1 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="text-xs font-medium">Integrated</span>
              </div>
            )}
          </div>

          {/* Description */}
          <p className="text-sm text-gray-700 leading-relaxed mb-4">
            {phaseData.description}
          </p>

          {/* Compact Stats Row */}
          <div className="flex items-center space-x-6 text-sm text-gray-600 mb-4">
            <div className="flex items-center space-x-1">
              <Calendar className="h-4 w-4 text-indigo-600" />
              <span className="font-medium text-gray-900">{weekCount}</span>
              <span>weeks</span>
            </div>
            <div className="flex items-center space-x-1">
              <Activity className="h-4 w-4 text-indigo-600" />
              <span className="font-medium text-gray-900">{workoutCount}</span>
              <span>key workouts</span>
            </div>
          </div>

          {/* Inline Timeline */}
          {firstWeek && lastWeek && (
            <div className="flex items-center text-sm mb-4 py-2 px-3 bg-white/50 rounded-lg">
              <div className="flex items-center space-x-2">
                <span className="text-gray-600">Duration:</span>
                <span className="font-medium text-gray-900">
                  {formatDate(firstWeek.start_date)} - {formatDate(lastWeek.end_date)}
                </span>
              </div>
            </div>
          )}
        </div>
      </Card>
    )
  }

  const phases = extractPhases()
  const phaseCount = phases?.length || 0

  // Don't render if we have no workflow state and no phases
  if (workflowStatus === 'pending' && (!phases || phases.length === 0)) {
    return null
  }

  return (
    <div className="border-2 border-indigo-200 rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 shadow-lg">
      <div
        className="flex items-center justify-between p-5 cursor-pointer hover:bg-gradient-to-br hover:from-indigo-100 hover:to-blue-100 transition-all duration-200 rounded-t-xl"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-indigo-100 rounded-xl">
            {workflowStatus === 'streaming' ? (
              <Layers className="h-6 w-6 text-indigo-600 animate-pulse" />
            ) : workflowStatus === 'failed' ? (
              <Layers className="h-6 w-6 text-red-600" />
            ) : (
              <Layers className="h-6 w-6 text-indigo-600" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-indigo-900">
              {workflowStatus === 'streaming' && 'Creating Training Phases'}
              {workflowStatus === 'failed' && 'Phase Generation Failed'}
              {(workflowStatus === 'success' || workflowStatus === 'pending') && 'Training Phase Structure'}
            </h3>
            <p className="text-sm text-indigo-700">
              {workflowStatus === 'streaming' && 'Analyzing your goals and designing a structured training approach...'}
              {workflowStatus === 'failed' && 'Unable to generate training phases. Please try again.'}
              {(workflowStatus === 'success' || workflowStatus === 'pending') && (
                <>
                  {phaseCount} training phases created
                  {workflowStatus === 'success' || autoIntegrated ? ' • Successfully integrated' : ''}
                </>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {workflowStatus === 'streaming' && (
            <Clock className="h-5 w-5 text-indigo-600 animate-spin" />
          )}
          {(workflowStatus === 'success' || autoIntegrated) && (
            <CheckCircle className="h-5 w-5 text-green-600" />
          )}
          {isExpanded ? (
            <ChevronDown className="h-5 w-5 text-indigo-600" />
          ) : (
            <ChevronRight className="h-5 w-5 text-indigo-600" />
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="border-t-2 border-indigo-200 p-5 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-indigo-900">Phase Overview</h4>
            {workflowStatus === 'success' || autoIntegrated ? (
              <p className="text-sm text-green-700 flex items-center space-x-1">
                <CheckCircle className="h-4 w-4" />
                <span>Phases automatically added to your training plan</span>
              </p>
            ) : (
              <p className="text-sm text-indigo-700">
                Review your personalized training phases below
              </p>
            )}
          </div>
          <div className="space-y-4">
            {phases && phases.length > 0 ? (
              phases.map((phase: PhaseData, index: number) => renderPhaseCard(phase, index))
            ) : (
              <p className="text-sm text-indigo-600 text-center py-4">Generating phases...</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
