import { ChevronDown, ChevronUp } from 'lucide-react'
import { Card } from '../ui/card'
import { Badge } from '../ui/badge'
import { Progress } from '../ui/progress'
import { WeekCard } from './WeekCard'
import { TrainingPhase, phaseColors, phaseStateColors } from './types'
import { getContainerState, getPhaseSummary } from './utils'

interface PhaseCardProps {
  phase: TrainingPhase
  isSelected: boolean
  selectionMode: 'none' | 'multi'
  onItemClick: (id: string, type: 'phase' | 'week' | 'workout', event: React.MouseEvent) => void
  isExpanded: boolean
  onToggleExpansion: (phaseId: string) => void
  expandedWeeks: Set<string>
  onToggleWeekExpansion: (weekId: string) => void
  selectedItems: Set<string>
}

export function PhaseCard({ 
  phase, 
  isSelected, 
  selectionMode, 
  onItemClick,
  isExpanded,
  onToggleExpansion,
  expandedWeeks,
  onToggleWeekExpansion,
  selectedItems
}: PhaseCardProps) {
  const phaseState = getContainerState(phase.weeks.flatMap(w => w.workouts))
  const phaseSummary = getPhaseSummary(phase)

  return (
    <Card
      data-phase-id={phase.id}
      className={`
        transition-all duration-200 cursor-pointer
        ${phaseStateColors[phaseState]}
        ${isSelected ? 'ring-2 ring-blue-400 ring-offset-2 relative z-10' : ''}
        ${selectionMode === 'multi' ? 'border-dashed' : 'border-solid'}
      `}
    >
      {/* Phase Header */}
      <div 
        className="p-4 flex items-center justify-between"
        onClick={(e) => onItemClick(phase.id, 'phase', e)}
      >
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-medium text-gray-900">{phase.title}</h3>
            <Badge className={`text-xs ${phaseColors[phase.type]}`}>
              {phase.type}
            </Badge>
          </div>
          <p className="text-sm text-gray-600 mb-3">{phase.description}</p>
          
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex-1 min-w-0">
              <span className="text-gray-500">Weeks</span>
              <div className="font-medium">{phaseSummary.totalWeeks}</div>
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-gray-500">Total TSS</span>
              <div className="font-medium">{phaseSummary.totalTSS}</div>
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-gray-500">Workouts</span>
              <div className="font-medium">{phaseSummary.totalWorkouts}</div>
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-gray-500">Progress</span>
              <div className="flex items-center gap-2">
                <span className="font-medium">{phaseSummary.completionRate}%</span>
                <Progress value={phaseSummary.completionRate} className="flex-1 h-2" />
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 ml-4">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggleExpansion(phase.id)
            }}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded Weeks */}
      {isExpanded && (
        <div className="border-t border-gray-100">
          <div className="p-4 space-y-3">
            {phase.weeks.map((week) => (
              <WeekCard
                key={week.id}
                week={week}
                isSelected={selectedItems.has(week.id)}
                selectionMode={selectionMode}
                onItemClick={onItemClick}
                expandedWeeks={expandedWeeks}
                onToggleExpansion={onToggleWeekExpansion}
                selectedItems={selectedItems}
                className="ml-4"
              />
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}
