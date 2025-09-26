import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Card } from '../ui/card'
import { Button } from '../ui/button'
import { Progress } from '../ui/progress'
import { WorkoutCard } from './WorkoutCard'
import { TrainingWeek, workoutStateColors } from './types'
import { getContainerState, getWeekSummary } from './utils'

interface WeekCardProps {
  week: TrainingWeek
  isSelected: boolean
  selectionMode: 'none' | 'multi'
  onItemClick: (id: string, type: 'phase' | 'week' | 'workout', event: React.MouseEvent) => void
  expandedWeeks: Set<string>
  onToggleExpansion: (weekId: string) => void
  selectedItems: Set<string>
  className?: string
}

export function WeekCard({ 
  week, 
  isSelected, 
  selectionMode, 
  onItemClick,
  expandedWeeks,
  onToggleExpansion,
  selectedItems,
  className = ''
}: WeekCardProps) {
  const weekState = getContainerState(week.workouts)
  const weekSummary = getWeekSummary(week)
  const isExpanded = expandedWeeks.has(week.id)

  return (
    <Card
      data-week-id={week.id}
      className={`
        transition-all duration-200 cursor-pointer
        ${workoutStateColors[weekState]}
        ${isSelected ? 'ring-2 ring-blue-400 ring-offset-2 relative z-20' : ''}
        ${selectionMode === 'multi' ? 'border-dashed' : 'border-solid'}
        ${className}
      `}
    >
      {/* Week Header */}
      <div 
        className="p-3 flex items-center justify-between"
        onClick={(e) => onItemClick(week.id, 'week', e)}
      >
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h4 className="font-medium text-gray-900">{week.title}</h4>
          </div>
          
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <span className="text-gray-500">TSS</span>
              <div className="font-medium">{weekSummary.totalTSS}</div>
            </div>
            <div>
              <span className="text-gray-500">Workouts</span>
              <div className="font-medium">{weekSummary.totalWorkouts}</div>
            </div>
            <div>
              <span className="text-gray-500">Progress</span>
              <div className="flex items-center gap-2">
                <span className="font-medium">{weekSummary.completionRate}%</span>
                <Progress value={weekSummary.completionRate} className="flex-1 h-1" />
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 ml-4">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggleExpansion(week.id)
            }}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            {isExpanded ? (
              <ChevronUp className="w-3 h-3 text-gray-400" />
            ) : (
              <ChevronDown className="w-3 h-3 text-gray-400" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded Workouts */}
      {isExpanded && (
        <div className="border-t border-gray-100">
          <div className="p-3 space-y-2">
            {week.workouts.map((workout) => (
              <WorkoutCard
                key={workout.id}
                workout={workout}
                isSelected={selectedItems.has(workout.id)}
                selectionMode={selectionMode}
                onItemClick={onItemClick}
                size="small"
                className="ml-4"
              />
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}
