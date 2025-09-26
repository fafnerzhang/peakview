import { useState, useRef, useCallback, useEffect } from 'react'
import { TrainingPhase, ViewState, SelectionMode } from '../types'
import { findPhaseById } from '../utils'

interface DragSelectionHook {
  containerRef: React.RefObject<HTMLDivElement>
  isDragging: boolean
  selectionRect: { left: number; top: number; width: number; height: number } | null
  handleMouseDown: (e: React.MouseEvent) => void
  handleMouseMove: (e: React.MouseEvent) => void
  handleMouseUp: (e: React.MouseEvent) => void
}

interface UseDragSelectionProps {
  phases: TrainingPhase[]
  viewState: ViewState
  expandedPhases: Set<string>
  expandedWeeks: Set<string>
  onSelectionModeChange: (mode: SelectionMode) => void
  onSelectionChange: (selectedItems: Set<string>) => void
}

interface SelectableElement {
  element: HTMLElement
  type: 'phase' | 'week' | 'workout'
  rect: DOMRect
}

export const useDragSelection = ({ 
  phases, 
  viewState, 
  expandedPhases, 
  expandedWeeks,
  onSelectionModeChange,
  onSelectionChange
}: UseDragSelectionProps): DragSelectionHook => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<{ x: number, y: number } | null>(null)
  const [dragEnd, setDragEnd] = useState<{ x: number, y: number } | null>(null)
  const [selectableElements, setSelectableElements] = useState<Map<string, SelectableElement>>(new Map())

  // Reset drag state when view changes
  useEffect(() => {
    setIsDragging(false)
    setDragStart(null)
    setDragEnd(null)
  }, [viewState])

  // Update selectable elements when component renders
  const updateSelectableElements = useCallback(() => {
    if (containerRef.current) {
      const elements = new Map<string, SelectableElement>()
      
      // Find all selectable cards
      const phaseCards = containerRef.current.querySelectorAll('[data-phase-id]')
      phaseCards.forEach(card => {
        const id = card.getAttribute('data-phase-id')
        if (id) {
          elements.set(id, {
            element: card as HTMLElement,
            type: 'phase',
            rect: card.getBoundingClientRect()
          })
        }
      })
      
      const weekCards = containerRef.current.querySelectorAll('[data-week-id]')
      weekCards.forEach(card => {
        const id = card.getAttribute('data-week-id')
        if (id) {
          elements.set(id, {
            element: card as HTMLElement,
            type: 'week',
            rect: card.getBoundingClientRect()
          })
        }
      })
      
      const workoutCards = containerRef.current.querySelectorAll('[data-workout-id]')
      workoutCards.forEach(card => {
        const id = card.getAttribute('data-workout-id')
        if (id) {
          elements.set(id, {
            element: card as HTMLElement,
            type: 'workout',
            rect: card.getBoundingClientRect()
          })
        }
      })
      
      setSelectableElements(elements)
    }
  }, [])

  useEffect(() => {
    updateSelectableElements()
  }, [phases.length, expandedPhases.size, expandedWeeks.size, viewState, updateSelectableElements])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return // Only left click
    if (viewState !== 'plan-list' && viewState !== 'week-detail') return // Only in plan list or week detail view
    
    const scrollArea = e.currentTarget as HTMLElement
    const rect = scrollArea.getBoundingClientRect()
    if (!rect) return
    
    const x = e.clientX - rect.left + scrollArea.scrollLeft
    const y = e.clientY - rect.top + scrollArea.scrollTop
    
    setDragStart({ x, y })
    setIsDragging(true)
    
    // Prevent text selection
    e.preventDefault()
  }, [viewState])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !dragStart) return
    
    const scrollArea = e.currentTarget as HTMLElement
    const rect = scrollArea.getBoundingClientRect()
    if (!rect) return
    
    const x = e.clientX - rect.left + scrollArea.scrollLeft
    const y = e.clientY - rect.top + scrollArea.scrollTop
    
    setDragEnd({ x, y })
  }, [isDragging, dragStart])

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !dragStart || !dragEnd) {
      setIsDragging(false)
      setDragStart(null)
      setDragEnd(null)
      return
    }
    
    // Calculate selection rectangle (accounting for scroll)
    const scrollArea = e.currentTarget as HTMLElement
    const minX = Math.min(dragStart.x, dragEnd.x)
    const maxX = Math.max(dragStart.x, dragEnd.x)
    const minY = Math.min(dragStart.y, dragEnd.y)
    const maxY = Math.max(dragStart.y, dragEnd.y)
    
    // Only proceed if drag area is significant (more than 10px in both directions)
    if (maxX - minX > 10 && maxY - minY > 10) {
      // Update selectable elements with current positions
      updateSelectableElements()
      
      // Switch to selection mode
      onSelectionModeChange('multi')
      
      // Find intersecting elements
      const containerRect = scrollArea.getBoundingClientRect()
      if (containerRect) {
        const newSelected = new Set<string>()
        
        // Get current selectable elements
        const currentElements = new Map<string, SelectableElement>()
        
        // Find all selectable cards at time of selection
        const phaseCards = scrollArea.querySelectorAll('[data-phase-id]')
        phaseCards.forEach(card => {
          const id = card.getAttribute('data-phase-id')
          if (id) {
            currentElements.set(id, {
              element: card as HTMLElement,
              type: 'phase',
              rect: card.getBoundingClientRect()
            })
          }
        })
        
        const weekCards = scrollArea.querySelectorAll('[data-week-id]')
        weekCards.forEach(card => {
          const id = card.getAttribute('data-week-id')
          if (id) {
            currentElements.set(id, {
              element: card as HTMLElement,
              type: 'week',
              rect: card.getBoundingClientRect()
            })
          }
        })
        
        const workoutCards = scrollArea.querySelectorAll('[data-workout-id]')
        workoutCards.forEach(card => {
          const id = card.getAttribute('data-workout-id')
          if (id) {
            currentElements.set(id, {
              element: card as HTMLElement,
              type: 'workout',
              rect: card.getBoundingClientRect()
            })
          }
        })
        
        currentElements.forEach((elementInfo, id) => {
          const elementRect = elementInfo.element.getBoundingClientRect()
          const relativeRect = {
            left: elementRect.left - containerRect.left + scrollArea.scrollLeft,
            right: elementRect.right - containerRect.left + scrollArea.scrollLeft,
            top: elementRect.top - containerRect.top + scrollArea.scrollTop,
            bottom: elementRect.bottom - containerRect.top + scrollArea.scrollTop
          }
          
          // Check if element intersects with selection rectangle
          if (relativeRect.left < maxX && 
              relativeRect.right > minX && 
              relativeRect.top < maxY && 
              relativeRect.bottom > minY) {
            newSelected.add(id)
            
            // Handle hierarchical selection
            if (elementInfo.type === 'phase') {
              const phase = findPhaseById(phases, id)
              if (phase) {
                phase.weeks.forEach(week => {
                  newSelected.add(week.id)
                })
              }
            }
          }
        })
        
        onSelectionChange(newSelected)
      }
    }
    
    setIsDragging(false)
    setDragStart(null)
    setDragEnd(null)
  }, [isDragging, dragStart, dragEnd, phases, onSelectionModeChange, onSelectionChange, updateSelectableElements])

  // Get selection rectangle for rendering
  const selectionRect = (() => {
    if (!isDragging || !dragStart || !dragEnd) return null
    
    return {
      left: Math.min(dragStart.x, dragEnd.x),
      top: Math.min(dragStart.y, dragEnd.y),
      width: Math.abs(dragEnd.x - dragStart.x),
      height: Math.abs(dragEnd.y - dragStart.y)
    }
  })()

  return {
    containerRef,
    isDragging,
    selectionRect,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp
  }
}
