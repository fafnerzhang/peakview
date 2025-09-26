import { WorkoutBlockData } from '../WorkoutBlock'

export interface TrainingWeek {
  id: string
  title: string
  weekNumber: number
  startDate: string
  endDate: string
  workouts: WorkoutPlan[]
}

export interface TrainingPhase {
  id: string
  title: string
  description: string
  type: 'general' | 'specific' | 'peak' | 'recovery'
  startDate: string
  endDate: string
  weeks: TrainingWeek[]
}

export interface WorkoutPlan {
  id: string
  title: string
  description: string
  date: string
  totalTime: string
  totalDistance: string
  difficulty: 'easy' | 'moderate' | 'hard'
  tss: number
  workouts: WorkoutBlockData[]
  isStreaming?: boolean
  isCompleted?: boolean
  completionRate?: number // 0-100
  isSkipped?: boolean
}

export type ViewState = 'plan-list' | 'week-detail' | 'workout-detail'
export type SelectionMode = 'none' | 'multi'
export type WorkoutState = 'completed' | 'unfinished' | 'skipped' | 'future' | 'unplanned'
export type ContainerState = 'completed' | 'partial' | 'future' | 'unplanned'

export interface WorkoutPlanPanelProps {
  onRequestPlan: (request: string) => void
  phases: TrainingPhase[]
  onPlanUpdate: (planId: string, workouts: WorkoutBlockData[]) => void
  onClose: () => void
  streamingWorkout?: WorkoutPlan | null
  onWorkoutSelect?: (workout: WorkoutPlan) => void
  onSelectionChange?: (selectedItems: string[], selectionDetails: { [id: string]: { type: 'phase' | 'week' | 'workout', title: string } }) => void
  onRemoveSelection?: (id: string) => void
  selectedItems?: string[]
  selectionDetails?: { [id: string]: { type: 'phase' | 'week' | 'workout', title: string } }
}

export const difficultyColors = {
  easy: 'bg-green-100 text-green-700 border-green-200',
  moderate: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  hard: 'bg-red-100 text-red-700 border-red-200',
}

export const phaseColors = {
  general: 'bg-blue-100 text-blue-700 border-blue-200',
  specific: 'bg-purple-100 text-purple-700 border-purple-200',
  peak: 'bg-red-100 text-red-700 border-red-200',
  recovery: 'bg-green-100 text-green-700 border-green-200',
}

export const workoutStateColors = {
  completed: 'bg-green-50 border-green-200 hover:bg-green-100',
  unfinished: 'bg-orange-50 border-orange-200 hover:bg-orange-100',
  skipped: 'bg-gray-100 border-gray-300 hover:bg-gray-200',
  future: 'bg-white border-gray-200 hover:bg-gray-50',
  unplanned: 'bg-slate-50 border-slate-200 hover:bg-slate-100',
}

export const phaseStateColors = {
  completed: 'bg-green-50 border-green-200',
  partial: 'bg-orange-50 border-orange-200', 
  future: 'bg-white border-gray-200',
  unplanned: 'bg-slate-50 border-slate-200',
}
