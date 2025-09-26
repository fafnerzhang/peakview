import { Clock, Zap, Heart, MapPin, GripVertical } from 'lucide-react'
import { Card } from './ui/card'
import { Badge } from './ui/badge'

export interface WorkoutBlockData {
  id: string
  type: 'warmup' | 'interval' | 'steady' | 'recovery' | 'cooldown'
  title: string
  duration: string
  distance?: string
  pace?: string
  zone: number
  intensity: 'easy' | 'moderate' | 'hard' | 'recovery'
  restTime?: string
  watts?: number
  description: string
}

interface WorkoutBlockProps {
  workout: WorkoutBlockData
  isDragging?: boolean
  dragHandleProps?: any
}

const zoneColors = {
  1: 'bg-gray-100 text-gray-700 border-gray-200',
  2: 'bg-blue-100 text-blue-700 border-blue-200',
  3: 'bg-green-100 text-green-700 border-green-200',
  4: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  5: 'bg-red-100 text-red-700 border-red-200',
}

const intensityColors = {
  recovery: 'bg-gray-50 border-gray-200',
  easy: 'bg-green-50 border-green-200',
  moderate: 'bg-yellow-50 border-yellow-200',
  hard: 'bg-red-50 border-red-200',
}

export function WorkoutBlock({ workout, isDragging, dragHandleProps }: WorkoutBlockProps) {
  return (
    <Card 
      className={`p-4 transition-all duration-200 ${intensityColors[workout.intensity]} ${
        isDragging ? 'opacity-50 scale-105 shadow-lg' : 'hover:shadow-md'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Drag Handle */}
        <div 
          {...dragHandleProps}
          className="mt-1 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 touch-none"
        >
          <GripVertical className="w-4 h-4" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-900 truncate">{workout.title}</h4>
            <Badge className={`text-xs ${zoneColors[workout.zone]}`}>
              Zone {workout.zone}
            </Badge>
          </div>

          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{workout.description}</p>

          {/* Workout Details */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="font-medium text-gray-900">{workout.duration}</span>
            </div>

            {workout.distance && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span className="font-medium text-gray-900">{workout.distance}</span>
              </div>
            )}

            {workout.pace && (
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-gray-500" />
                <span className="font-medium text-gray-900">{workout.pace}</span>
              </div>
            )}

            {workout.watts && (
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-gray-500" />
                <span className="font-medium text-gray-900">{workout.watts}W</span>
              </div>
            )}

            {workout.restTime && (
              <div className="col-span-2 flex items-center gap-2 text-orange-600">
                <Clock className="w-4 h-4" />
                <span className="font-medium">Rest: {workout.restTime}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
