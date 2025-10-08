import {
  TrainingPhase as UITrainingPhase,
  TrainingWeek as UITrainingWeek,
  WorkoutPlan
} from './types'
import {
  TrainingPhase as ContextTrainingPhase,
  TrainingWeek as ContextTrainingWeek
} from '@/src/contexts/RunningCoachContext'
import { WorkoutBlockData } from '../WorkoutBlock'

/**
 * Transform context phase data to UI phase data
 */
export function transformContextPhasesToUI(
  contextPhases: ContextTrainingPhase[]
): UITrainingPhase[] {
  console.log('🔧 Transformer received phases:', contextPhases)
  const transformed = contextPhases.map(phase => {
    console.log('🔧 Transforming phase:', phase)
    const result = transformPhase(phase)
    console.log('🔧 Transformed to:', result)
    return result
  })
  return transformed
}

function transformPhase(phase: ContextTrainingPhase): UITrainingPhase {
  return {
    id: phase.phase_id,
    title: phase.name,
    description: `Training phase: ${phase.phase_type || 'General'}`,
    type: mapPhaseType(phase.phase_type),
    startDate: phase.start_date || new Date().toISOString(),
    endDate: phase.end_date || new Date().toISOString(),
    weeks: phase.weeks.map(week => transformWeek(week, phase.phase_id))
  }
}

function transformWeek(
  week: ContextTrainingWeek,
  phaseId: string
): UITrainingWeek {
  const workouts = week.workouts
    .map(workout => transformWorkout(workout))
    .sort((a, b) => {
      // Sort by date or day_of_week
      const dateA = new Date(a.date).getTime()
      const dateB = new Date(b.date).getTime()
      return dateA - dateB
    })

  return {
    id: week.week_id,
    title: `Week ${week.week_number}`,
    weekNumber: week.week_number,
    startDate: calculateWeekStartDate(week),
    endDate: calculateWeekEndDate(week),
    workouts
  }
}

function transformWorkout(workout: any): WorkoutPlan {
  const metadata = workout.workout_metadata || {}
  const segments = workout.segments || []

  return {
    id: workout.id || `workout-${Date.now()}-${Math.random()}`,
    title: workout.name || 'Workout',
    description: metadata.description || workout.description || '',
    date: workout.scheduled_date || calculateDateFromDayOfWeek(workout.day_of_week),
    totalTime: formatDuration(metadata.total_time),
    totalDistance: formatDistance(metadata.total_distance),
    difficulty: mapWorkoutTypeToDifficulty(workout.workout_type),
    tss: Math.round(metadata.estimated_tss || 0),
    workouts: transformSegmentsToWorkoutBlocks(segments),
    isCompleted: workout.completed || false,
    completionRate: workout.completion_rate || undefined,
    isSkipped: workout.skipped || false
  }
}

function mapPhaseType(
  phaseType: string | null
): 'general' | 'specific' | 'peak' | 'recovery' {
  if (!phaseType) return 'general'

  const normalized = phaseType.toLowerCase()
  if (normalized.includes('specific')) return 'specific'
  if (normalized.includes('peak')) return 'peak'
  if (normalized.includes('recovery')) return 'recovery'
  return 'general'
}

function mapDifficulty(
  intensity: string | number | null | undefined
): 'easy' | 'moderate' | 'hard' {
  if (!intensity) return 'moderate'

  if (typeof intensity === 'string') {
    const normalized = intensity.toLowerCase()
    if (normalized.includes('easy') || normalized.includes('recovery')) return 'easy'
    if (normalized.includes('hard') || normalized.includes('intense')) return 'hard'
    return 'moderate'
  }

  // If numeric (1-10 scale)
  if (intensity <= 3) return 'easy'
  if (intensity >= 7) return 'hard'
  return 'moderate'
}

function calculateWeekStartDate(week: ContextTrainingWeek): string {
  // If we don't have explicit dates, calculate from week number
  const baseDate = new Date()
  baseDate.setDate(baseDate.getDate() - baseDate.getDay()) // Start of week
  baseDate.setDate(baseDate.getDate() + (week.week_number - 1) * 7)
  return baseDate.toISOString()
}

function calculateWeekEndDate(week: ContextTrainingWeek): string {
  const startDate = new Date(calculateWeekStartDate(week))
  startDate.setDate(startDate.getDate() + 6)
  return startDate.toISOString()
}

function formatDuration(minutes: number | undefined): string {
  if (!minutes) return '0 min'

  if (minutes < 60) {
    return `${minutes} min`
  }

  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60

  if (mins === 0) {
    return `${hours} hr`
  }

  return `${hours} hr ${mins} min`
}

function formatDistance(km: number | undefined): string {
  if (!km) return '0 km'
  return `${km.toFixed(1)} km`
}

function mapWorkoutTypeToDifficulty(
  workoutType: string | undefined
): 'easy' | 'moderate' | 'hard' {
  if (!workoutType) return 'moderate'

  const normalized = workoutType.toLowerCase()

  // Easy workouts
  if (normalized.includes('easy') || normalized.includes('recovery')) {
    return 'easy'
  }

  // Hard workouts
  if (
    normalized.includes('interval') ||
    normalized.includes('tempo') ||
    normalized.includes('threshold') ||
    normalized.includes('speed') ||
    normalized.includes('race')
  ) {
    return 'hard'
  }

  // Long runs and double sessions are moderate
  if (normalized.includes('long') || normalized.includes('double')) {
    return 'moderate'
  }

  return 'moderate'
}

function calculateDateFromDayOfWeek(dayOfWeek: number | undefined): string {
  if (dayOfWeek === undefined) return new Date().toISOString()

  // Calculate date based on current week and day_of_week (0=Sunday, 6=Saturday)
  const now = new Date()
  const currentDay = now.getDay()
  const daysToAdd = dayOfWeek - currentDay

  const targetDate = new Date(now)
  targetDate.setDate(now.getDate() + daysToAdd)

  return targetDate.toISOString()
}

function transformSegmentsToWorkoutBlocks(segments: any[]): WorkoutBlockData[] {
  const blocks: WorkoutBlockData[] = []
  let segmentIndex = 0

  for (const segment of segments) {
    // Skip loop markers
    if (segment.type === 'loop_start' || segment.type === 'loop_end') {
      continue
    }

    const block = transformSegmentToBlock(segment, segmentIndex++)
    blocks.push(block)
  }

  return blocks
}

function transformSegmentToBlock(segment: any, index: number): WorkoutBlockData {
  const duration = segment.duration || 0
  const targetRange = segment.target_range || {}
  const distanceRange = segment.distance_range || {}
  const pre = segment.pre || 5 // Default to moderate intensity

  // Determine block type based on description or pre value
  const type = inferBlockType(segment.description, pre)
  const intensity = mapPreToIntensity(pre)
  const zone = mapPreToZone(pre)

  // Calculate pace from target range (min/km format)
  // Handle both numeric values and ensure proper averaging
  let avgPace: number | undefined = undefined
  if (targetRange.min !== undefined && targetRange.max !== undefined) {
    const minVal = Number(targetRange.min)
    const maxVal = Number(targetRange.max)
    if (!isNaN(minVal) && !isNaN(maxVal) && minVal > 0 && maxVal > 0) {
      avgPace = (minVal + maxVal) / 2
    }
  }

  // Format pace as min:sec/km or show range
  let pace: string | undefined = undefined
  if (avgPace) {
    pace = formatPace(avgPace)
  } else if (targetRange.min !== undefined || targetRange.max !== undefined) {
    // Show range if we have partial data
    const minVal = Number(targetRange.min)
    const maxVal = Number(targetRange.max)
    if (!isNaN(minVal) && minVal > 0 && !isNaN(maxVal) && maxVal > 0) {
      pace = `${formatPace(minVal)} - ${formatPace(maxVal)}`
    }
  }

  // Calculate distance - use mean of range
  let distance: string | undefined = undefined
  if (distanceRange.min !== undefined && distanceRange.max !== undefined) {
    const minDist = Number(distanceRange.min)
    const maxDist = Number(distanceRange.max)
    if (!isNaN(minDist) && !isNaN(maxDist)) {
      const avgDistance = (minDist + maxDist) / 2
      distance = `${avgDistance.toFixed(1)} km`
    }
  }

  return {
    id: `segment-${index}`,
    type,
    title: segment.description?.split(':')[0] || `Segment ${index + 1}`,
    duration: `${duration} min`,
    distance,
    pace,
    zone,
    intensity,
    description: segment.description || ''
  }
}

function inferBlockType(
  description: string = '',
  pre: number
): 'warmup' | 'interval' | 'steady' | 'recovery' | 'cooldown' {
  const desc = description.toLowerCase()

  if (desc.includes('warm') || desc.includes('warmup')) return 'warmup'
  if (desc.includes('cool') || desc.includes('cooldown')) return 'cooldown'
  if (desc.includes('recovery') || desc.includes('rest')) return 'recovery'
  if (desc.includes('interval') || desc.includes('repeat')) return 'interval'

  // Use PRE to infer type
  if (pre <= 3) return 'warmup'
  if (pre >= 7) return 'interval'

  return 'steady'
}

function mapPreToIntensity(pre: number): 'easy' | 'moderate' | 'hard' | 'recovery' {
  if (pre <= 2) return 'recovery'
  if (pre <= 4) return 'easy'
  if (pre <= 6) return 'moderate'
  return 'hard'
}

function mapPreToZone(pre: number): number {
  // Map PRE (0-10) to HR zones (1-5)
  if (pre <= 2) return 1
  if (pre <= 4) return 2
  if (pre <= 6) return 3
  if (pre <= 8) return 4
  return 5
}

function formatPace(minPerKm: number): string {
  // Handle edge cases
  if (!minPerKm || minPerKm <= 0) return 'N/A'

  // Convert to absolute value to handle any sign issues
  const absValue = Math.abs(minPerKm)

  const minutes = Math.floor(absValue)
  const seconds = Math.round((absValue - minutes) * 60)

  // Ensure seconds don't overflow to 60
  const finalMinutes = seconds >= 60 ? minutes + 1 : minutes
  const finalSeconds = seconds >= 60 ? 0 : seconds

  return `${finalMinutes}:${finalSeconds.toString().padStart(2, '0')}/km`
}
