import { Calendar, Clock, MapPin, Target, CheckCircle, X } from 'lucide-react'
import { Card } from '../ui/card'
import { Badge } from '../ui/badge'
import { WorkoutPlan, difficultyColors, workoutStateColors } from './types'
import { getWorkoutState } from './utils'

interface WorkoutCardProps {
  workout: WorkoutPlan
  isSelected: boolean
  selectionMode: 'none' | 'multi'
  onItemClick: (id: string, type: 'phase' | 'week' | 'workout', event: React.MouseEvent) => void
  size?: 'small' | 'medium' | 'large'
  className?: string
}

export function WorkoutCard({ 
  workout, 
  isSelected, 
  selectionMode, 
  onItemClick,
  size = 'medium',
  className = ''
}: WorkoutCardProps) {
  const workoutState = getWorkoutState(workout)

  const sizeClasses = {
    small: 'p-3',
    medium: 'p-4', 
    large: 'p-6'
  }

  const titleClasses = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg'
  }

  const iconClasses = {
    small: 'w-3 h-3',
    medium: 'w-4 h-4',
    large: 'w-5 h-5'
  }

  return (
    <Card
      data-workout-id={workout.id}
      className={`
        cursor-pointer transition-all duration-200 
        ${workoutStateColors[workoutState]}
        ${isSelected ? 'ring-2 ring-blue-400 ring-offset-2 relative z-30' : ''}
        ${selectionMode === 'multi' ? 'border-dashed' : 'border-solid'}
        ${className}
      `}
      onClick={(e) => onItemClick(workout.id, 'workout', e)}
    >
      <div className={sizeClasses[size]}>
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className={`font-medium text-gray-900 ${titleClasses[size]}`}>
                {workout.title}
              </h4>
              {workout.isCompleted && (
                <CheckCircle className={`text-green-600 ${iconClasses[size]}`} />
              )}
              {workout.isSkipped && (
                <X className={`text-gray-400 ${iconClasses[size]}`} />
              )}

            </div>
            <p className={`text-gray-600 ${size === 'small' ? 'text-xs' : 'text-sm'}`}>
              {workout.description}
            </p>
          </div>
          <Badge className={`text-xs ${difficultyColors[workout.difficulty]}`}>
            {workout.difficulty}
          </Badge>
        </div>
        
        <div className={`flex items-center gap-3 text-gray-500 ${size === 'small' ? 'text-xs' : 'text-sm'}`}>
          <div className="flex items-center gap-1">
            <Clock className={iconClasses[size]} />
            <span>{workout.totalTime}</span>
          </div>
          <div className="flex items-center gap-1">
            <MapPin className={iconClasses[size]} />
            <span>{workout.totalDistance}</span>
          </div>
          <div className="flex items-center gap-1">
            <Target className={iconClasses[size]} />
            <span>TSS {workout.tss}</span>
          </div>
        </div>
      </div>
    </Card>
  )
}
