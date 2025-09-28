import { Edit3 } from 'lucide-react'
import { Button } from '../ui/button'
import { Progress } from '../ui/progress'
import { WorkoutCard } from './WorkoutCard'
import { SelectionOverlay } from './SelectionOverlay'
import { TrainingWeek, SelectionMode, TrainingPhase } from './types'
import { getWeekSummary } from './utils'
import { useDragSelection } from './hooks/useDragSelection'

interface WeekDetailViewProps {
  week: TrainingWeek
  phases: TrainingPhase[]
  selectedItems: Set<string>
  selectionMode: 'none' | 'multi'
  onItemClick: (id: string, type: 'phase' | 'week' | 'workout', event: React.MouseEvent) => void
  onRequestPlan: (request: string) => void
  onSelectionModeChange: (mode: SelectionMode) => void
  onSelectionChange: (items: Set<string>) => void
}

export function WeekDetailView({ 
  week, 
  phases,
  selectedItems, 
  selectionMode, 
  onItemClick, 
  onRequestPlan,
  onSelectionModeChange,
  onSelectionChange
}: WeekDetailViewProps) {
  const summary = getWeekSummary(week)

  const {
    containerRef,
    selectionRect,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp
  } = useDragSelection({
    phases,
    viewState: 'week-detail',
    expandedPhases: new Set(),
    expandedWeeks: new Set(),
    onSelectionModeChange,
    onSelectionChange
  })

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-gray-900">{week.title}</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRequestPlan(`Modify week: ${week.title}`)}
          >
            <Edit3 className="w-4 h-4 mr-1" />
            Edit Week
          </Button>
        </div>
        
        <div className="flex flex-wrap gap-4 text-sm">
          <div>
            <span className="text-gray-500">Total TSS</span>
            <div className="font-medium">{summary.totalTSS}</div>
          </div>
          <div>
            <span className="text-gray-500">Workouts</span>
            <div className="font-medium">{summary.totalWorkouts}</div>
          </div>
          <div>
            <span className="text-gray-500">Total Time</span>
            <div className="font-medium">{summary.totalTime.toFixed(1)}h</div>
          </div>
          <div>
            <span className="text-gray-500">Completion</span>
            <div className="flex items-center gap-2">
              <span className="font-medium">{summary.completionRate}%</span>
              <Progress value={summary.completionRate} className="flex-1 h-2" />
            </div>
          </div>
        </div>
      </div>

      <div 
        ref={containerRef}
        className="flex-1 overflow-auto p-4 relative"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <SelectionOverlay selectionRect={selectionRect} />
        <div className="space-y-3">
          {week.workouts.map((workout) => (
            <WorkoutCard
              key={workout.id}
              workout={workout}
              isSelected={selectedItems.has(workout.id)}
              selectionMode={selectionMode}
              onItemClick={onItemClick}
              size="medium"
            />
          ))}
        </div>
      </div>
    </div>
  )
}
