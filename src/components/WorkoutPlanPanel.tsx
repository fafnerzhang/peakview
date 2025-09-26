"use client"

import type React from "react"

import { useState, useRef, useCallback, useEffect } from "react"
import {
  Calendar,
  Clock,
  MapPin,
  Target,
  Edit3,
  X,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  CheckCircle,
} from "lucide-react"
import { Card } from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Checkbox } from "./ui/checkbox"
import { Progress } from "./ui/progress"
import { WorkoutBlock, type WorkoutBlockData } from "./WorkoutBlock"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

interface TrainingWeek {
  id: string
  title: string
  weekNumber: number
  startDate: string
  endDate: string
  workouts: WorkoutPlan[]
}

interface TrainingPhase {
  id: string
  title: string
  description: string
  type: "general" | "specific" | "peak" | "recovery"
  startDate: string
  endDate: string
  weeks: TrainingWeek[]
}

interface WorkoutPlan {
  id: string
  title: string
  description: string
  date: string
  totalTime: string
  totalDistance: string
  difficulty: "easy" | "moderate" | "hard"
  tss: number
  workouts: WorkoutBlockData[]
  isStreaming?: boolean
  isCompleted?: boolean
  completionRate?: number // 0-100
  isSkipped?: boolean
}

interface WorkoutPlanPanelProps {
  onRequestPlan: (request: string) => void
  phases: TrainingPhase[]
  onPlanUpdate: (planId: string, workouts: WorkoutBlockData[]) => void
  onClose: () => void
  streamingWorkout?: WorkoutPlan | null
  onWorkoutSelect?: (workout: WorkoutPlan) => void
  onSelectionChange?: (
    selectedItems: string[],
    selectionDetails: { [id: string]: { type: "phase" | "week" | "workout"; title: string } },
  ) => void
}

type ViewState = "plan-list" | "week-detail" | "workout-detail"
type SelectionMode = "none" | "multi"

const difficultyColors = {
  easy: "bg-green-100 text-green-700 border-green-200",
  moderate: "bg-yellow-100 text-yellow-700 border-yellow-200",
  hard: "bg-red-100 text-red-700 border-red-200",
}

const phaseColors = {
  general: "bg-blue-100 text-blue-700 border-blue-200",
  specific: "bg-purple-100 text-purple-700 border-purple-200",
  peak: "bg-red-100 text-red-700 border-red-200",
  recovery: "bg-green-100 text-green-700 border-green-200",
}

const workoutColors = {
  easy: "#16a34a",
  moderate: "#ea580c",
  hard: "#dc2626",
}

// Natural color scheme for workout states
const workoutStateColors = {
  completed: "bg-green-50 border-green-200 hover:bg-green-100",
  unfinished: "bg-orange-50 border-orange-200 hover:bg-orange-100",
  skipped: "bg-gray-100 border-gray-300 hover:bg-gray-200",
  future: "bg-white border-gray-200 hover:bg-gray-50",
  unplanned: "bg-slate-50 border-slate-200 hover:bg-slate-100",
}

const phaseStateColors = {
  completed: "bg-green-50 border-green-200",
  partial: "bg-orange-50 border-orange-200",
  future: "bg-white border-gray-200",
  unplanned: "bg-slate-50 border-slate-200",
}

// Sortable wrapper for WorkoutBlock
function SortableWorkoutBlock({ workout }: { workout: WorkoutBlockData }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: workout.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <WorkoutBlock workout={workout} isDragging={isDragging} dragHandleProps={{ ...attributes, ...listeners }} />
    </div>
  )
}

export function WorkoutPlanPanel({
  onRequestPlan,
  phases,
  onPlanUpdate,
  onClose,
  streamingWorkout,
  onWorkoutSelect,
  onSelectionChange,
}: WorkoutPlanPanelProps) {
  const [viewState, setViewState] = useState<ViewState>("plan-list")
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null)
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null)
  const [selectedWorkout, setSelectedWorkout] = useState<string | null>(null)
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set())
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set())
  const [selectionMode, setSelectionMode] = useState<SelectionMode>("none")
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())

  // Drag selection state
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null)
  const [dragEnd, setDragEnd] = useState<{ x: number; y: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [selectableElements, setSelectableElements] = useState<
    Map<string, { element: HTMLElement; type: "phase" | "week" | "workout"; rect: DOMRect }>
  >(new Map())

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || !selectedWorkout || active.id === over.id) return

    const plan = findWorkoutById(selectedWorkout)
    if (!plan || !plan.workouts) return

    const oldIndex = plan.workouts.findIndex((item) => item.id === active.id)
    const newIndex = plan.workouts.findIndex((item) => item.id === over.id)

    const newWorkouts = arrayMove(plan.workouts, oldIndex, newIndex)
    onPlanUpdate(selectedWorkout, newWorkouts)
  }

  const findWorkoutById = (workoutId: string): WorkoutPlan | null => {
    for (const phase of phases) {
      for (const week of phase.weeks) {
        const workout = week.workouts.find((w) => w.id === workoutId)
        if (workout) return workout
      }
    }
    return null
  }

  const findWeekById = (weekId: string): TrainingWeek | null => {
    for (const phase of phases) {
      const week = phase.weeks.find((w) => w.id === weekId)
      if (week) return week
    }
    return null
  }

  const findPhaseById = (phaseId: string): TrainingPhase | null => {
    return phases.find((p) => p.id === phaseId) || null
  }

  // Helper function to determine workout state
  const getWorkoutState = (workout: WorkoutPlan): "completed" | "unfinished" | "skipped" | "future" | "unplanned" => {
    const workoutDate = new Date(workout.date)
    const today = new Date()
    const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const workoutDateOnly = new Date(workoutDate.getFullYear(), workoutDate.getMonth(), workoutDate.getDate())

    if (workout.isSkipped) return "skipped"
    if (workout.isCompleted) return "completed"
    if (workout.completionRate !== undefined && workout.completionRate < 70) return "unfinished"
    if (workoutDateOnly > todayDateOnly) return "future"
    if (workoutDateOnly < todayDateOnly && !workout.isCompleted) return "unfinished"
    return "unplanned"
  }

  // Helper function to determine phase/week state
  const getContainerState = (workouts: WorkoutPlan[]): "completed" | "partial" | "future" | "unplanned" => {
    if (workouts.length === 0) return "unplanned"

    const states = workouts.map(getWorkoutState)
    const completedCount = states.filter((s) => s === "completed").length
    const totalCount = workouts.length

    if (completedCount === totalCount) return "completed"
    if (completedCount > 0) return "partial"

    const futureCount = states.filter((s) => s === "future").length
    if (futureCount === totalCount) return "future"

    return "unplanned"
  }

  const getWeekSummary = (week: TrainingWeek) => {
    const totalTSS = week.workouts.reduce((sum, workout) => sum + (workout.tss || 0), 0)
    const totalWorkouts = week.workouts.length
    const totalTime = week.workouts.reduce((total, workout) => {
      if (!workout.totalTime) return total
      const time = Number.parseFloat(workout.totalTime.replace(/[^\d.]/g, ""))
      return total + (isNaN(time) ? 0 : time)
    }, 0)

    const difficulties = week.workouts.reduce(
      (acc, workout) => {
        acc[workout.difficulty] = (acc[workout.difficulty] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    // Calculate completion stats
    const completedWorkouts = week.workouts.filter((w) => w.isCompleted).length
    const skippedWorkouts = week.workouts.filter((w) => w.isSkipped).length
    const completionRate = totalWorkouts > 0 ? Math.round((completedWorkouts / totalWorkouts) * 100) : 0

    return {
      totalTSS,
      totalWorkouts,
      totalTime,
      difficulties,
      completedWorkouts,
      skippedWorkouts,
      completionRate,
    }
  }

  const getPhaseSummary = (phase: TrainingPhase) => {
    const totalWeeks = phase.weeks.length
    const totalTSS = phase.weeks.reduce((sum, week) => {
      return sum + week.workouts.reduce((weekSum, workout) => weekSum + (workout.tss || 0), 0)
    }, 0)
    const totalWorkouts = phase.weeks.reduce((sum, week) => sum + week.workouts.length, 0)

    // Calculate completion stats
    const allWorkouts = phase.weeks.flatMap((week) => week.workouts)
    const completedWorkouts = allWorkouts.filter((w) => w.isCompleted).length
    const completionRate = totalWorkouts > 0 ? Math.round((completedWorkouts / totalWorkouts) * 100) : 0

    return {
      totalWeeks,
      totalTSS,
      totalWorkouts,
      completedWorkouts,
      completionRate,
    }
  }

  const togglePhaseExpansion = (phaseId: string) => {
    const newExpanded = new Set(expandedPhases)
    if (newExpanded.has(phaseId)) {
      newExpanded.delete(phaseId)
      // Also collapse all weeks in this phase
      const phase = findPhaseById(phaseId)
      if (phase) {
        phase.weeks.forEach((week) => {
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

  const handleItemClick = (id: string, type: "phase" | "week" | "workout", event: React.MouseEvent) => {
    if (selectionMode === "multi") {
      // Multi-selection mode
      event.preventDefault()
      toggleItemSelection(id)
    } else {
      // Detail view mode
      if (type === "phase") {
        setSelectedPhase(id)
        setViewState("plan-list") // Stay in plan list but focus phase
        togglePhaseExpansion(id)
      } else if (type === "week") {
        setSelectedWeek(id)
        setViewState("week-detail")
      } else if (type === "workout") {
        setSelectedWorkout(id)
        setViewState("workout-detail")
        const workout = findWorkoutById(id)
        if (workout) {
          onWorkoutSelect?.(workout)
        }
      }
    }
  }

  const toggleItemSelection = (id: string) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }

    // Handle hierarchical selection - when phase is selected, toggle its weeks
    if (newSelected.has(id)) {
      const phase = findPhaseById(id)
      if (phase) {
        phase.weeks.forEach((week) => {
          newSelected.add(week.id)
        })
      }
    } else {
      // If deselecting a phase, also deselect its weeks
      const phase = findPhaseById(id)
      if (phase) {
        phase.weeks.forEach((week) => {
          newSelected.delete(week.id)
          // Also deselect workouts in those weeks
          week.workouts.forEach((workout) => {
            newSelected.delete(workout.id)
          })
        })
      }
    }

    setSelectedItems(newSelected)
    notifySelectionChange(newSelected)
  }

  const notifySelectionChange = (selectedSet: Set<string>) => {
    const selectionDetails: { [id: string]: { type: "phase" | "week" | "workout"; title: string } } = {}

    selectedSet.forEach((id) => {
      const phase = findPhaseById(id)
      if (phase) {
        selectionDetails[id] = { type: "phase", title: phase.title }
        return
      }

      const week = findWeekById(id)
      if (week) {
        selectionDetails[id] = { type: "week", title: week.title }
        return
      }

      const workout = findWorkoutById(id)
      if (workout) {
        selectionDetails[id] = { type: "workout", title: workout.title }
      }
    })

    onSelectionChange?.(Array.from(selectedSet), selectionDetails)
  }

  const toggleSelectionMode = () => {
    if (selectionMode === "multi") {
      setSelectionMode("none")
      setSelectedItems(new Set())
      notifySelectionChange(new Set())
    } else {
      setSelectionMode("multi")
    }
  }

  // Reset drag state when view changes
  useEffect(() => {
    setIsDragging(false)
    setDragStart(null)
    setDragEnd(null)
  }, [viewState])

  // Update selectable elements when component renders
  useEffect(() => {
    if (containerRef.current) {
      const elements = new Map()

      // Find all selectable cards
      const phaseCards = containerRef.current.querySelectorAll("[data-phase-id]")
      phaseCards.forEach((card) => {
        const id = card.getAttribute("data-phase-id")
        if (id) {
          elements.set(id, {
            element: card as HTMLElement,
            type: "phase" as const,
            rect: card.getBoundingClientRect(),
          })
        }
      })

      const weekCards = containerRef.current.querySelectorAll("[data-week-id]")
      weekCards.forEach((card) => {
        const id = card.getAttribute("data-week-id")
        if (id) {
          elements.set(id, {
            element: card as HTMLElement,
            type: "week" as const,
            rect: card.getBoundingClientRect(),
          })
        }
      })

      const workoutCards = containerRef.current.querySelectorAll("[data-workout-id]")
      workoutCards.forEach((card) => {
        const id = card.getAttribute("data-workout-id")
        if (id) {
          elements.set(id, {
            element: card as HTMLElement,
            type: "workout" as const,
            rect: card.getBoundingClientRect(),
          })
        }
      })

      setSelectableElements(elements)
    }
  }, [phases, expandedPhases, expandedWeeks, viewState])

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return // Only left click
      if (viewState !== "plan-list" && viewState !== "week-detail") return // Only in plan list or week detail view

      const scrollArea = e.currentTarget as HTMLElement
      const rect = scrollArea.getBoundingClientRect()
      if (!rect) return

      const x = e.clientX - rect.left + scrollArea.scrollLeft
      const y = e.clientY - rect.top + scrollArea.scrollTop

      setDragStart({ x, y })
      setIsDragging(true)

      // Prevent text selection
      e.preventDefault()
    },
    [viewState],
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || !dragStart) return

      const scrollArea = e.currentTarget as HTMLElement
      const rect = scrollArea.getBoundingClientRect()
      if (!rect) return

      const x = e.clientX - rect.left + scrollArea.scrollLeft
      const y = e.clientY - rect.top + scrollArea.scrollTop

      setDragEnd({ x, y })
    },
    [isDragging, dragStart],
  )

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
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
        // Switch to selection mode
        setSelectionMode("multi")

        // Find intersecting elements
        const containerRect = scrollArea.getBoundingClientRect()
        if (containerRect) {
          const newSelected = new Set<string>()

          selectableElements.forEach((elementInfo, id) => {
            const elementRect = elementInfo.element.getBoundingClientRect()
            const relativeRect = {
              left: elementRect.left - containerRect.left + scrollArea.scrollLeft,
              right: elementRect.right - containerRect.left + scrollArea.scrollLeft,
              top: elementRect.top - containerRect.top + scrollArea.scrollTop,
              bottom: elementRect.bottom - containerRect.top + scrollArea.scrollTop,
            }

            // Check if element intersects with selection rectangle
            if (
              relativeRect.left < maxX &&
              relativeRect.right > minX &&
              relativeRect.top < maxY &&
              relativeRect.bottom > minY
            ) {
              newSelected.add(id)

              // Handle hierarchical selection
              if (elementInfo.type === "phase") {
                const phase = findPhaseById(id)
                if (phase) {
                  phase.weeks.forEach((week) => {
                    newSelected.add(week.id)
                  })
                }
              }
            }
          })

          setSelectedItems(newSelected)
          notifySelectionChange(newSelected)
        }
      }

      setIsDragging(false)
      setDragStart(null)
      setDragEnd(null)
    },
    [isDragging, dragStart, dragEnd, selectableElements],
  )

  // Get selection rectangle for rendering
  const getSelectionRect = () => {
    if (!isDragging || !dragStart || !dragEnd) return null

    return {
      left: Math.min(dragStart.x, dragEnd.x),
      top: Math.min(dragStart.y, dragEnd.y),
      width: Math.abs(dragEnd.x - dragStart.x),
      height: Math.abs(dragEnd.y - dragStart.y),
    }
  }

  const handleBackToList = () => {
    setViewState("plan-list")
    setSelectedWeek(null)
    setSelectedWorkout(null)
  }

  const handleBackToWeek = () => {
    setViewState("week-detail")
    setSelectedWorkout(null)
  }

  const currentWorkout = selectedWorkout ? findWorkoutById(selectedWorkout) : null
  const currentWeek = selectedWeek ? findWeekById(selectedWeek) : null
  const selectionRect = getSelectionRect()

  return (
    <div className="h-screen flex flex-col bg-white border-l border-gray-200" ref={containerRef}>
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            <h2 className="font-medium text-gray-900">Training Plans</h2>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                {viewState === "plan-list"
                  ? "Structured training schedule"
                  : viewState === "week-detail"
                    ? "Weekly training overview"
                    : "Workout details"}
                {(viewState === "plan-list" || viewState === "week-detail") && (
                  <span className="ml-2">
                    <button
                      onClick={toggleSelectionMode}
                      className="text-green-600 hover:text-green-700 hover:underline"
                    >
                      {selectionMode === "multi" ? "Done selecting" : "Select items"}
                    </button>
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={onClose} variant="ghost" size="sm" className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Navigation breadcrumbs */}
        {viewState !== "plan-list" && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToList}
              className="text-gray-600 hover:text-gray-900 p-0 h-auto"
            >
              Training Plans
            </Button>
            {currentWeek && (
              <>
                <ChevronRight className="w-4 h-4" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewState("week-detail")}
                  className="text-gray-600 hover:text-gray-900 p-0 h-auto"
                >
                  {currentWeek.title}
                </Button>
              </>
            )}
            {currentWorkout && (
              <>
                <ChevronRight className="w-4 h-4" />
                <span className="font-medium text-gray-900">{currentWorkout.title}</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {viewState === "workout-detail" && currentWorkout ? (
          /* Workout Detail View */
          <div className="h-full flex flex-col">
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToWeek}
                  className="text-gray-600 hover:text-gray-900"
                >
                  ← Back to Week
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRequestPlan(`Modify this workout: ${currentWorkout.title}`)}
                >
                  <Edit3 className="w-4 h-4 mr-1" />
                  Edit
                </Button>
              </div>

              <h3 className="font-medium text-gray-900 mb-1">{currentWorkout.title}</h3>
              <p className="text-sm text-gray-600 mb-3">{currentWorkout.description}</p>

              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span>{currentWorkout.date}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span>{currentWorkout.totalTime}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span>{currentWorkout.totalDistance}</span>
                </div>
                <Badge className={`text-xs ${difficultyColors[currentWorkout.difficulty]}`}>
                  {currentWorkout.difficulty}
                </Badge>
                {currentWorkout.isCompleted && (
                  <Badge className="text-xs bg-green-100 text-green-700 border-green-200">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Completed
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4">
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext
                  items={currentWorkout?.workouts?.map((w) => w.id) || []}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3">
                    {currentWorkout?.workouts && currentWorkout.workouts.length > 0 ? (
                      currentWorkout.workouts?.map((workout) => (
                        <SortableWorkoutBlock key={workout.id} workout={workout} />
                      ))
                    ) : (
                      <div className="text-center text-gray-500 py-8">No workouts available</div>
                    )}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          </div>
        ) : viewState === "week-detail" && currentWeek ? (
          /* Week Detail View */
          <div className="h-full flex flex-col">
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900">{currentWeek.title}</h3>
                <Button variant="ghost" size="sm" onClick={() => onRequestPlan(`Modify week: ${currentWeek.title}`)}>
                  <Edit3 className="w-4 h-4 mr-1" />
                  Edit Week
                </Button>
              </div>

              {(() => {
                const summary = getWeekSummary(currentWeek)
                return (
                  <div className="grid grid-cols-4 gap-4 text-sm">
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
                )
              })()}
            </div>

            <div
              className="flex-1 overflow-auto p-4 relative"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
            >
              <div className="space-y-3">
                {currentWeek?.workouts?.map((workout) => {
                  const workoutState = getWorkoutState(workout)
                  const isSelected = selectedItems.has(workout.id)

                  return (
                    <Card
                      key={workout.id}
                      data-workout-id={workout.id}
                      className={`
                        cursor-pointer transition-all duration-200 
                        ${workoutStateColors[workoutState]}
                        ${isSelected ? "ring-2 ring-blue-400 ring-offset-2" : ""}
                        ${selectionMode === "multi" ? "border-dashed" : "border-solid"}
                      `}
                      onClick={(e) => handleItemClick(workout.id, "workout", e)}
                    >
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 mb-1">{workout.title}</h4>
                            <p className="text-sm text-gray-600">{workout.description}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={`text-xs ${difficultyColors[workout.difficulty]}`}>
                              {workout.difficulty}
                            </Badge>
                            {workout.isCompleted && <CheckCircle className="w-4 h-4 text-green-600" />}
                            {workout.isSkipped && <X className="w-4 h-4 text-gray-400" />}
                            {selectionMode === "multi" && <Checkbox checked={isSelected} readOnly />}
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{workout.totalTime}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span>{workout.totalDistance}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Target className="w-3 h-3" />
                            <span>TSS {workout.tss}</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>

              {/* Selection rectangle overlay */}
              {selectionRect && (
                <div
                  className="absolute border-2 border-blue-400 bg-blue-100/30 pointer-events-none"
                  style={{
                    left: selectionRect.left,
                    top: selectionRect.top,
                    width: selectionRect.width,
                    height: selectionRect.height,
                  }}
                />
              )}
            </div>
          </div>
        ) : (
          /* Plan List View */
          <div
            className="flex-1 overflow-auto p-4 relative"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            <div className="space-y-4">
              {phases?.map((phase) => {
                const phaseState = getContainerState(phase.weeks.flatMap((w) => w.workouts))
                const phaseSummary = getPhaseSummary(phase)
                const isPhaseExpanded = expandedPhases.has(phase.id)
                const isPhaseSelected = selectedItems.has(phase.id)

                return (
                  <Card
                    key={phase.id}
                    data-phase-id={phase.id}
                    className={`
                      transition-all duration-200 cursor-pointer
                      ${phaseStateColors[phaseState]}
                      ${isPhaseSelected ? "ring-2 ring-blue-400 ring-offset-2" : ""}
                      ${selectionMode === "multi" ? "border-dashed" : "border-solid"}
                    `}
                  >
                    {/* Phase Header */}
                    <div
                      className="p-4 flex items-center justify-between"
                      onClick={(e) => handleItemClick(phase.id, "phase", e)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-medium text-gray-900">{phase.title}</h3>
                          <Badge className={`text-xs ${phaseColors[phase.type]}`}>{phase.type}</Badge>
                          {selectionMode === "multi" && <Checkbox checked={isPhaseSelected} readOnly />}
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{phase.description}</p>

                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Weeks</span>
                            <div className="font-medium">{phaseSummary.totalWeeks}</div>
                          </div>
                          <div>
                            <span className="text-gray-500">Total TSS</span>
                            <div className="font-medium">{phaseSummary.totalTSS}</div>
                          </div>
                          <div>
                            <span className="text-gray-500">Workouts</span>
                            <div className="font-medium">{phaseSummary.totalWorkouts}</div>
                          </div>
                          <div>
                            <span className="text-gray-500">Progress</span>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{phaseSummary.completionRate}%</span>
                              <Progress value={phaseSummary.completionRate} className="flex-1 h-2" />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        {selectionMode === "none" && (
                          <button
                            onClick={(e) => handleItemClick(phase.id, "phase", e)}
                            className="text-green-600 hover:text-green-700 hover:underline text-sm"
                          >
                            {isPhaseExpanded ? "Collapse" : "Expand"}
                          </button>
                        )}
                        {isPhaseExpanded ? (
                          <ChevronUp className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    </div>

                    {/* Expanded Weeks */}
                    {isPhaseExpanded && (
                      <div className="border-t border-gray-100">
                        <div className="p-4 space-y-3">
                          {phase.weeks?.map((week) => {
                            const weekState = getContainerState(week.workouts)
                            const weekSummary = getWeekSummary(week)
                            const isWeekExpanded = expandedWeeks.has(week.id)
                            const isWeekSelected = selectedItems.has(week.id)

                            return (
                              <Card
                                key={week.id}
                                data-week-id={week.id}
                                className={`
                                  transition-all duration-200 cursor-pointer ml-4
                                  ${workoutStateColors[weekState]}
                                  ${isWeekSelected ? "ring-2 ring-blue-400 ring-offset-2" : ""}
                                  ${selectionMode === "multi" ? "border-dashed" : "border-solid"}
                                `}
                              >
                                {/* Week Header */}
                                <div
                                  className="p-3 flex items-center justify-between"
                                  onClick={(e) => handleItemClick(week.id, "week", e)}
                                >
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                      <h4 className="font-medium text-gray-900">{week.title}</h4>
                                      {selectionMode === "multi" && <Checkbox checked={isWeekSelected} readOnly />}
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
                                    {selectionMode === "none" && (
                                      <button
                                        onClick={(e) => handleItemClick(week.id, "week", e)}
                                        className="text-blue-600 hover:text-blue-700 hover:underline text-sm"
                                      >
                                        View Details
                                      </button>
                                    )}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        toggleWeekExpansion(week.id)
                                      }}
                                      className="p-1 hover:bg-gray-100 rounded"
                                    >
                                      {isWeekExpanded ? (
                                        <ChevronUp className="w-3 h-3 text-gray-400" />
                                      ) : (
                                        <ChevronDown className="w-3 h-3 text-gray-400" />
                                      )}
                                    </button>
                                  </div>
                                </div>

                                {/* Expanded Workouts */}
                                {isWeekExpanded && (
                                  <div className="border-t border-gray-100">
                                    <div className="p-3 space-y-2">
                                      {week.workouts?.map((workout) => {
                                        const workoutState = getWorkoutState(workout)
                                        const isWorkoutSelected = selectedItems.has(workout.id)

                                        return (
                                          <Card
                                            key={workout.id}
                                            data-workout-id={workout.id}
                                            className={`
                                              transition-all duration-200 cursor-pointer ml-4
                                              ${workoutStateColors[workoutState]}
                                              ${isWorkoutSelected ? "ring-2 ring-blue-400 ring-offset-1" : ""}
                                              ${selectionMode === "multi" ? "border-dashed" : "border-solid"}
                                            `}
                                            onClick={(e) => handleItemClick(workout.id, "workout", e)}
                                          >
                                            <div className="p-3">
                                              <div className="flex items-start justify-between mb-2">
                                                <div className="flex-1">
                                                  <div className="flex items-center gap-2 mb-1">
                                                    <h5 className="font-medium text-gray-900 text-sm">
                                                      {workout.title}
                                                    </h5>
                                                    {workout.isCompleted && (
                                                      <CheckCircle className="w-3 h-3 text-green-600" />
                                                    )}
                                                    {workout.isSkipped && <X className="w-3 h-3 text-gray-400" />}
                                                    {selectionMode === "multi" && (
                                                      <Checkbox checked={isWorkoutSelected} readOnly />
                                                    )}
                                                  </div>
                                                  <p className="text-xs text-gray-600">{workout.description}</p>
                                                </div>
                                                <Badge className={`text-xs ${difficultyColors[workout.difficulty]}`}>
                                                  {workout.difficulty}
                                                </Badge>
                                              </div>

                                              <div className="flex items-center gap-3 text-xs text-gray-500">
                                                <div className="flex items-center gap-1">
                                                  <Clock className="w-3 h-3" />
                                                  <span>{workout.totalTime}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                  <MapPin className="w-3 h-3" />
                                                  <span>{workout.totalDistance}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                  <Target className="w-3 h-3" />
                                                  <span>TSS {workout.tss}</span>
                                                </div>
                                              </div>
                                            </div>
                                          </Card>
                                        )
                                      })}
                                    </div>
                                  </div>
                                )}
                              </Card>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </Card>
                )
              })}
            </div>

            {/* Selection rectangle overlay */}
            {selectionRect && (
              <div
                className="absolute border-2 border-blue-400 bg-blue-100/30 pointer-events-none"
                style={{
                  left: selectionRect.left,
                  top: selectionRect.top,
                  width: selectionRect.width,
                  height: selectionRect.height,
                }}
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
