import { Calendar, Clock, MapPin, Edit3, CheckCircle } from 'lucide-react'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { WorkoutBlock, WorkoutBlockData } from '../WorkoutBlock'
import { WorkoutPlan, difficultyColors } from './types'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// Sortable wrapper for WorkoutBlock
function SortableWorkoutBlock({ workout }: { workout: WorkoutBlockData }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: workout.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <WorkoutBlock
        workout={workout}
        isDragging={isDragging}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  )
}

interface WorkoutDetailViewProps {
  workout: WorkoutPlan
  onBack: () => void
  onRequestPlan: (request: string) => void
  onPlanUpdate: (planId: string, workouts: WorkoutBlockData[]) => void
}

export function WorkoutDetailView({ 
  workout, 
  onBack, 
  onRequestPlan, 
  onPlanUpdate 
}: WorkoutDetailViewProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) return

    const oldIndex = workout.workouts.findIndex(item => item.id === active.id)
    const newIndex = workout.workouts.findIndex(item => item.id === over.id)

    const newWorkouts = arrayMove(workout.workouts, oldIndex, newIndex)
    onPlanUpdate(workout.id, newWorkouts)
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-gray-600 hover:text-gray-900"
          >
            ← Back to Week
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRequestPlan(`Modify this workout: ${workout.title}`)}
          >
            <Edit3 className="w-4 h-4 mr-1" />
            Edit
          </Button>
        </div>
        
        <h3 className="font-medium text-gray-900 mb-1">{workout.title}</h3>
        <p className="text-sm text-gray-600 mb-3">{workout.description}</p>
        
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span>{workout.date}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4 text-gray-500" />
            <span>{workout.totalTime}</span>
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4 text-gray-500" />
            <span>{workout.totalDistance}</span>
          </div>
          <Badge className={`text-xs ${difficultyColors[workout.difficulty]}`}>
            {workout.difficulty}
          </Badge>
          {workout.isCompleted && (
            <Badge className="text-xs bg-green-100 text-green-700 border-green-200">
              <CheckCircle className="w-3 h-3 mr-1" />
              Completed
            </Badge>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={workout.workouts.map(w => w.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {workout.workouts.map((workoutBlock) => (
                <SortableWorkoutBlock
                  key={workoutBlock.id}
                  workout={workoutBlock}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  )
}
