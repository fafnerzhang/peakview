import { TrainingPhase, TrainingWeek, WorkoutPlan, WorkoutState, ContainerState } from './types'

// Helper function to determine workout state
export const getWorkoutState = (workout: WorkoutPlan): WorkoutState => {
  const workoutDate = new Date(workout.date)
  const today = new Date()
  const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const workoutDateOnly = new Date(workoutDate.getFullYear(), workoutDate.getMonth(), workoutDate.getDate())
  
  if (workout.isSkipped) return 'skipped'
  if (workout.isCompleted) return 'completed'
  if (workout.completionRate !== undefined && workout.completionRate < 70) return 'unfinished'
  if (workoutDateOnly > todayDateOnly) return 'future'
  if (workoutDateOnly < todayDateOnly && !workout.isCompleted) return 'unfinished'
  return 'unplanned'
}

// Helper function to determine phase/week state
export const getContainerState = (workouts: WorkoutPlan[]): ContainerState => {
  if (workouts.length === 0) return 'unplanned'
  
  const states = workouts.map(getWorkoutState)
  const completedCount = states.filter(s => s === 'completed').length
  const totalCount = workouts.length
  
  if (completedCount === totalCount) return 'completed'
  if (completedCount > 0) return 'partial'
  
  const futureCount = states.filter(s => s === 'future').length
  if (futureCount === totalCount) return 'future'
  
  return 'unplanned'
}

export const getWeekSummary = (week: TrainingWeek) => {
  const totalTSS = week.workouts.reduce((sum, workout) => sum + (workout.tss || 0), 0)
  const totalWorkouts = week.workouts.length
  const totalTime = week.workouts.reduce((total, workout) => {
    if (!workout.totalTime) return total
    const time = parseFloat(workout.totalTime.replace(/[^\d.]/g, ''))
    return total + (isNaN(time) ? 0 : time)
  }, 0)
  
  const difficulties = week.workouts.reduce((acc, workout) => {
    acc[workout.difficulty] = (acc[workout.difficulty] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Calculate completion stats
  const completedWorkouts = week.workouts.filter(w => w.isCompleted).length
  const skippedWorkouts = week.workouts.filter(w => w.isSkipped).length
  const completionRate = totalWorkouts > 0 ? Math.round((completedWorkouts / totalWorkouts) * 100) : 0

  return { 
    totalTSS, 
    totalWorkouts, 
    totalTime, 
    difficulties, 
    completedWorkouts, 
    skippedWorkouts, 
    completionRate 
  }
}

export const getPhaseSummary = (phase: TrainingPhase) => {
  const totalWeeks = phase.weeks.length
  const totalTSS = phase.weeks.reduce((sum, week) => {
    return sum + week.workouts.reduce((weekSum, workout) => weekSum + (workout.tss || 0), 0)
  }, 0)
  const totalWorkouts = phase.weeks.reduce((sum, week) => sum + week.workouts.length, 0)
  
  // Calculate completion stats
  const allWorkouts = phase.weeks.flatMap(week => week.workouts)
  const completedWorkouts = allWorkouts.filter(w => w.isCompleted).length
  const completionRate = totalWorkouts > 0 ? Math.round((completedWorkouts / totalWorkouts) * 100) : 0
  
  return { 
    totalWeeks, 
    totalTSS, 
    totalWorkouts, 
    completedWorkouts, 
    completionRate 
  }
}

export const findWorkoutById = (phases: TrainingPhase[], workoutId: string): WorkoutPlan | null => {
  for (const phase of phases) {
    for (const week of phase.weeks) {
      const workout = week.workouts.find(w => w.id === workoutId)
      if (workout) return workout
    }
  }
  return null
}

export const findWeekById = (phases: TrainingPhase[], weekId: string): TrainingWeek | null => {
  for (const phase of phases) {
    const week = phase.weeks.find(w => w.id === weekId)
    if (week) return week
  }
  return null
}

export const findPhaseById = (phases: TrainingPhase[], phaseId: string): TrainingPhase | null => {
  return phases.find(p => p.id === phaseId) || null
}
