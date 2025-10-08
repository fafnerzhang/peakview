import { useState, useEffect } from 'react'
import { ChevronDown, ChevronRight, Calendar, Target, Clock, CheckCircle } from 'lucide-react'
import { Badge } from '@/src/components/ui/badge'
import { Card } from '@/src/components/ui/card'
import { TrainingPhase } from '@/src/components/plan/types'

interface TrainingPhaseResultProps {
  toolName: string
  input?: any
  output?: any
  result?: any
  state?: 'streaming' | 'complete' | 'output-available' | 'input-available'
  onAddPhaseToPanel?: (phase: TrainingPhase) => void
}

interface PhaseData {
  id: string
  title: string
  phase_number: number
  duration_weeks: number
  start_date: string
  end_date: string
  description: string
  focus: string
  weekly_volume_range: string
  key_workouts: string[]
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

export function TrainingPhaseResult({ toolName, input, output, result, state, onAddPhaseToPanel }: TrainingPhaseResultProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [autoIntegrated, setAutoIntegrated] = useState(false)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-TW', {
      month: 'short',
      day: 'numeric',
      weekday: 'short',
      timeZone: 'Asia/Taipei'
    })
  }

  const getPhaseTypeColor = (focus: string) => {
    switch (focus.toLowerCase()) {
      case 'aerobic_base':
      case 'base':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'speed_development':
      case 'build':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'race_specific':
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
    const getPhaseType = (focus: string): 'general' | 'specific' | 'peak' | 'recovery' => {
      switch (focus.toLowerCase()) {
        case 'aerobic_base': return 'general'
        case 'speed_development': return 'specific'
        case 'race_specific': return 'peak'
        case 'taper': return 'recovery'
        default: return 'general'
      }
    }

    // Generate unique IDs to prevent duplicates
    const uniqueId = Date.now()

    return {
      id: `${phaseData.id}-${uniqueId}`,
      title: phaseData.title,
      description: phaseData.description,
      type: getPhaseType(phaseData.focus),
      startDate: phaseData.start_date,
      endDate: phaseData.end_date,
      weeks: (phaseData.weeks || []).map(week => ({
        id: `${week.id}-${uniqueId}`,
        title: week.description,
        weekNumber: parseInt(week.id.split('-')[1]) || 1,
        startDate: week.start_date,
        endDate: week.end_date,
        workouts: (week.critical_workouts || []).map((workout, index) => ({
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

  // Auto-integrate phases when streaming completes
  useEffect(() => {
    if (state === 'complete' && !autoIntegrated && onAddPhaseToPanel) {
      const phases = result?.phases || output?.payload?.workflowState?.steps?.['generate-training-phases']?.output?.phases
      if (phases && phases.length > 0) {
        phases.forEach((phaseData: PhaseData) => {
          const trainingPhase = convertToTrainingPhase(phaseData)
          onAddPhaseToPanel(trainingPhase)
        })
        setAutoIntegrated(true)
      }
    }
  }, [state, result, output, autoIntegrated, onAddPhaseToPanel])

  const renderPhaseCard = (phaseData: PhaseData, index: number) => {
    const weekCount = (phaseData.weeks || []).length
    const workoutCount = (phaseData.weeks || []).reduce((acc, week) => {
      if (!week || !week.critical_workouts || !Array.isArray(week.critical_workouts)) {
        return acc
      }
      return acc + week.critical_workouts.length
    }, 0)

    return (
      <Card key={index} className="p-4 bg-white border-gray-200">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h4 className="font-medium text-gray-900">{phaseData.title}</h4>
              <Badge variant="outline" className={getPhaseTypeColor(phaseData.focus)}>
                {phaseData.focus.replace('_', ' ')}
              </Badge>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed mb-3">
              {phaseData.description}
            </p>
            <div className="flex items-center space-x-4 text-xs text-gray-600">
              <div className="flex items-center space-x-1">
                <Calendar className="h-3 w-3" />
                <span>{weekCount} weeks</span>
              </div>
              <div className="flex items-center space-x-1">
                <Target className="h-3 w-3" />
                <span>{workoutCount} workouts</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>
                  {formatDate(phaseData.start_date)} - {formatDate(phaseData.end_date)}
                </span>
              </div>
            </div>
          </div>
          {(state === 'complete' || autoIntegrated) && (
            <div className="flex items-center space-x-1 text-green-600 ml-4">
              <CheckCircle className="h-4 w-4" />
              <span className="text-xs">Added to plan</span>
            </div>
          )}
        </div>

        {/* Key Workouts */}
        <div className="space-y-2">
          <h5 className="text-xs font-medium text-gray-700 mb-2">Key Training Focus</h5>
          <div className="flex flex-wrap gap-1 mb-2">
            {phaseData.key_workouts.map((workout, idx) => (
              <Badge key={idx} variant="outline" className="text-xs bg-gray-50">
                {workout}
              </Badge>
            ))}
          </div>
          <p className="text-xs text-gray-600">
            Weekly Volume: {phaseData.weekly_volume_range}
          </p>
        </div>

        {/* Week Summary */}
        <div className="space-y-2 mt-3">
          <h5 className="text-xs font-medium text-gray-700 mb-2">Week Overview</h5>
          <div className="grid grid-cols-1 gap-2">
            {(phaseData.weeks || []).slice(0, 2).map((week, weekIndex) => {
              if (!week) return null
              return (
                <div key={week.id} className="bg-gray-50 rounded-lg p-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-700">
                      Week {weekIndex + 1}: {week.description || 'Week'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {week.start_date ? formatDate(week.start_date) : ''}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600">
                    {(week.critical_workouts || []).length} key workouts
                  </div>
                </div>
              )
            })}
            {(phaseData.weeks || []).length > 2 && (
              <div className="text-xs text-gray-500 text-center">
                ... and {(phaseData.weeks || []).length - 2} more weeks
              </div>
            )}
          </div>
        </div>
      </Card>
    )
  }

  // Show streaming state
  if (state === 'streaming') {
    return (
      <div className="border border-blue-200 rounded-lg bg-blue-50 shadow-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <Target className="h-5 w-5 text-blue-600 animate-pulse" />
            <div>
              <h3 className="font-medium text-blue-900">Generating Training Phases</h3>
              <p className="text-sm text-blue-700">Analyzing your goals and creating a personalized training plan...</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className="bg-blue-600 text-white animate-pulse">Generating</Badge>
            <Clock className="h-4 w-4 text-blue-600 animate-spin" />
          </div>
        </div>
      </div>
    )
  }

  const phases = result?.phases || output?.payload?.workflowState?.steps?.['generate-training-phases']?.output?.phases
  if (!phases || phases.length === 0) {
    return null
  }

  const phaseCount = phases.length

  return (
    <div className="border border-blue-200 rounded-lg bg-blue-50 shadow-sm">
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-blue-100 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3">
          <Target className="h-5 w-5 text-blue-600" />
          <div>
            <h3 className="font-medium text-blue-900">Training Plan Created</h3>
            <p className="text-sm text-blue-700">
              Generated {phaseCount} training phases
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
            <ChevronDown className="h-4 w-4 text-blue-600" />
          ) : (
            <ChevronRight className="h-4 w-4 text-blue-600" />
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-blue-200 p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-blue-900">Training Phases</h4>
              {state === 'complete' || autoIntegrated ? (
                <p className="text-sm text-green-700 flex items-center space-x-1">
                  <CheckCircle className="h-3 w-3" />
                  <span>Phases automatically added to your training plan</span>
                </p>
              ) : (
                <p className="text-sm text-blue-700">
                  Review your personalized training phases below
                </p>
              )}
            </div>
            {phases.map((phase: PhaseData, index: number) => renderPhaseCard(phase, index))}
          </div>
        </div>
      )}
    </div>
  )
}
