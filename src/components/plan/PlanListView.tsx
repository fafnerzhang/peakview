import { useState } from 'react'
import { PhaseCard } from './PhaseCard'
import { SelectionOverlay } from './SelectionOverlay'
import { TrainingPhase, SelectionMode } from './types'
import { useDragSelection } from './hooks/useDragSelection'

interface PlanListViewProps {
  phases: TrainingPhase[]
  selectedItems: Set<string>
  selectionMode: 'none' | 'multi'
  onItemClick: (id: string, type: 'phase' | 'week' | 'workout', event: React.MouseEvent) => void
  onSelectionModeChange: (mode: SelectionMode) => void
  onSelectionChange: (items: Set<string>) => void
}

export function PlanListView({ 
  phases, 
  selectedItems, 
  selectionMode, 
  onItemClick,
  onSelectionModeChange,
  onSelectionChange
}: PlanListViewProps) {
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set())
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set())

  const togglePhaseExpansion = (phaseId: string) => {
    const newExpanded = new Set(expandedPhases)
    if (newExpanded.has(phaseId)) {
      newExpanded.delete(phaseId)
      // Also collapse all weeks in this phase
      const phase = phases.find(p => p.id === phaseId)
      if (phase) {
        phase.weeks.forEach(week => {
          expandedWeeks.delete(week.id)
        })
        setExpandedWeeks(new Set(expandedWeeks))
      }
    } else {
      newExpanded.add(phaseId)
    }
    setExpandedPhases(newExpanded)
  }

  const toggleWeekExpansion = (weekId: string) => {
    const newExpanded = new Set(expandedWeeks)
    if (newExpanded.has(weekId)) {
      newExpanded.delete(weekId)
    } else {
      newExpanded.add(weekId)
    }
    setExpandedWeeks(newExpanded)
  }

  const {
    containerRef,
    selectionRect,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp
  } = useDragSelection({
    phases,
    viewState: 'plan-list',
    expandedPhases,
    expandedWeeks,
    onSelectionModeChange,
    onSelectionChange
  })

  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-auto p-4 relative"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <SelectionOverlay selectionRect={selectionRect} />
      <div className="space-y-4">
        {phases.map((phase) => (
          <PhaseCard
            key={phase.id}
            phase={phase}
            isSelected={selectedItems.has(phase.id)}
            selectionMode={selectionMode}
            onItemClick={onItemClick}
            isExpanded={expandedPhases.has(phase.id)}
            onToggleExpansion={togglePhaseExpansion}
            expandedWeeks={expandedWeeks}
            onToggleWeekExpansion={toggleWeekExpansion}
            selectedItems={selectedItems}
          />
        ))}
      </div>
    </div>
  )
}
