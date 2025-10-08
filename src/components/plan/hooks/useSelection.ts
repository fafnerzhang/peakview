import { useState, useCallback, useEffect } from 'react'
import { TrainingPhase, SelectionMode } from '../types'
import { findPhaseById } from '../utils'

interface SelectionHook {
  selectedItems: Set<string>
  selectionMode: SelectionMode
  toggleSelectionMode: () => void
  toggleItemSelection: (id: string) => void
  removeItemSelection: (id: string) => void
  clearSelection: () => void
  handleItemClick: (id: string, type: 'phase' | 'week' | 'workout', event: React.MouseEvent) => void
  notifySelectionChange: (selectedSet: Set<string>) => void
  setSelectionMode: (mode: SelectionMode) => void
  setSelectedItems: (items: Set<string>) => void
}

interface UseSelectionProps {
  phases: TrainingPhase[]
  onSelectionChange?: (selectedItems: string[], selectionDetails: { [id: string]: { type: 'phase' | 'week' | 'workout', title: string } }) => void
  onItemSelect?: (id: string, type: 'phase' | 'week' | 'workout') => void
  externalSelectedItems?: string[]
  externalSelectionDetails?: { [id: string]: { type: 'phase' | 'week' | 'workout', title: string } }
}

export const useSelection = ({ 
  phases, 
  onSelectionChange,
  onItemSelect,
  externalSelectedItems = [],
  externalSelectionDetails = {}
}: UseSelectionProps): SelectionHook => {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set(externalSelectedItems))
  const [selectionMode, setSelectionMode] = useState<SelectionMode>('none')
  // Track items that were independently selected (not via parent selection)
  const [independentSelections, setIndependentSelections] = useState<Set<string>>(new Set())
  
  // Sync with external selection changes
  useEffect(() => {
    const newSelected = new Set(externalSelectedItems)
    setSelectedItems(newSelected)
    if (externalSelectedItems.length > 0) {
      setSelectionMode('multi')
    } else {
      setSelectionMode('none')
      setIndependentSelections(new Set())
    }
  }, [externalSelectedItems])

  const findWeekById = useCallback((weekId: string) => {
    for (const phase of phases) {
      const week = phase.weeks.find(w => w.id === weekId)
      if (week) return week
    }
    return null
  }, [phases])

  const findWorkoutById = useCallback((workoutId: string) => {
    for (const phase of phases) {
      for (const week of phase.weeks) {
        const workout = week.workouts.find(w => w.id === workoutId)
        if (workout) return workout
      }
    }
    return null
  }, [phases])

  const notifySelectionChange = useCallback((selectedSet: Set<string>) => {
    const selectionDetails: { [id: string]: { type: 'phase' | 'week' | 'workout', title: string } } = {}

    selectedSet.forEach(id => {
      const phase = findPhaseById(phases, id)
      if (phase) {
        selectionDetails[id] = { type: 'phase', title: phase.title }
        return
      }

      const week = findWeekById(id)
      if (week) {
        selectionDetails[id] = { type: 'week', title: week.title }
        return
      }

      const workout = findWorkoutById(id)
      if (workout) {
        selectionDetails[id] = { type: 'workout', title: workout.title }
      }
    })

    onSelectionChange?.(Array.from(selectedSet), selectionDetails)
  }, [phases, findWeekById, findWorkoutById, onSelectionChange])

  const toggleSelectionMode = useCallback(() => {
    if (selectionMode === 'multi') {
      setSelectionMode('none')
      setSelectedItems(new Set())
      setIndependentSelections(new Set())
      notifySelectionChange(new Set())
    } else {
      setSelectionMode('multi')
    }
  }, [selectionMode, notifySelectionChange])

  const toggleItemSelection = useCallback((id: string) => {
    const newSelected = new Set(selectedItems)
    const newIndependent = new Set(independentSelections)
    
    if (newSelected.has(id)) {
      // Deselecting - remove from both sets
      newSelected.delete(id)
      newIndependent.delete(id)
      
      // If deselecting a phase, only remove child items that weren't independently selected
      const phase = findPhaseById(phases, id)
      if (phase) {
        phase.weeks.forEach(week => {
          // Only remove week if it wasn't independently selected
          if (!newIndependent.has(week.id)) {
            newSelected.delete(week.id)
            // Also remove workouts that weren't independently selected
            week.workouts.forEach(workout => {
              if (!newIndependent.has(workout.id)) {
                newSelected.delete(workout.id)
              }
            })
          }
        })
      }
    } else {
      // Selecting - add to independent set (user explicitly clicked)
      newSelected.add(id)
      newIndependent.add(id)
      
      // Handle hierarchical selection - when phase is selected, add its weeks (but don't mark them as independent)
      const phase = findPhaseById(phases, id)
      if (phase) {
        phase.weeks.forEach(week => {
          if (!newSelected.has(week.id)) {
            newSelected.add(week.id)
            // Don't add to independent set - these are hierarchically selected
          }
        })
      }
    }
    
    setSelectedItems(newSelected)
    setIndependentSelections(newIndependent)
    notifySelectionChange(newSelected)
  }, [selectedItems, independentSelections, phases, notifySelectionChange])

  const removeItemSelection = useCallback((id: string) => {
    const newSelected = new Set(selectedItems)
    const newIndependent = new Set(independentSelections)
    
    // Remove the item
    newSelected.delete(id)
    newIndependent.delete(id)
    
    // If removing a phase, only remove child items that weren't independently selected
    const phase = findPhaseById(phases, id)
    if (phase) {
      phase.weeks.forEach(week => {
        // Only remove week if it wasn't independently selected
        if (!newIndependent.has(week.id)) {
          newSelected.delete(week.id)
          // Also remove workouts that weren't independently selected
          week.workouts.forEach(workout => {
            if (!newIndependent.has(workout.id)) {
              newSelected.delete(workout.id)
            }
          })
        }
      })
    }
    
    setSelectedItems(newSelected)
    setIndependentSelections(newIndependent)
    notifySelectionChange(newSelected)
  }, [selectedItems, independentSelections, phases, notifySelectionChange])

  const clearSelection = useCallback(() => {
    setSelectedItems(new Set())
    setIndependentSelections(new Set())
    notifySelectionChange(new Set())
  }, [notifySelectionChange])

  const handleItemClick = useCallback((id: string, type: 'phase' | 'week' | 'workout', event: React.MouseEvent) => {
    if (selectionMode === 'multi') {
      // Multi-selection mode
      event.preventDefault()
      toggleItemSelection(id)
    } else {
      // Detail view mode
      onItemSelect?.(id, type)
    }
  }, [selectionMode, toggleItemSelection, onItemSelect])

  return {
    selectedItems,
    selectionMode,
    toggleSelectionMode,
    toggleItemSelection,
    removeItemSelection,
    clearSelection,
    handleItemClick,
    notifySelectionChange,
    setSelectionMode,
    setSelectedItems
  }
}
