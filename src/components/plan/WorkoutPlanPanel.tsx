import { useState } from 'react'
import { X, ChevronRight } from 'lucide-react'
import { Button } from '../ui/button'
import { ScrollArea } from '../ui/scroll-area'
import { PlanListView } from './PlanListView'
import { WeekDetailView } from './WeekDetailView'
import { WorkoutDetailView } from './WorkoutDetailView'
import { useSelection } from './hooks/useSelection'
import { WorkoutPlanPanelProps, ViewState } from './types'
import { findWorkoutById, findWeekById } from './utils'
import { usePanelContext } from '../../contexts/PanelContext'

export function WorkoutPlanPanel({
  onRequestPlan,
  phases,
  onPlanUpdate,
  streamingWorkout,
  onWorkoutSelect,
  onSelectionChange,
  onRemoveSelection,
  selectedItems: externalSelectedItems = [],
  selectionDetails: externalSelectionDetails = {}
}: Omit<WorkoutPlanPanelProps, 'onClose'>) {
  const { setPlanPanelOpen } = usePanelContext()
  const [viewState, setViewState] = useState<ViewState>('plan-list')
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null)
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null)
  const [selectedWorkout, setSelectedWorkout] = useState<string | null>(null)

  const handleItemSelect = (id: string, type: 'phase' | 'week' | 'workout') => {
    if (type === 'phase') {
      setSelectedPhase(id)
      setViewState('plan-list') // Stay in plan list but focus phase
    } else if (type === 'week') {
      setSelectedWeek(id)
      setViewState('week-detail')
    } else if (type === 'workout') {
      setSelectedWorkout(id)
      setViewState('workout-detail')
      const workout = findWorkoutById(phases, id)
      if (workout) {
        onWorkoutSelect?.(workout)
      }
    }
  }

  const {
    selectedItems,
    selectionMode,
    toggleSelectionMode,
    handleItemClick,
    removeItemSelection,
    setSelectionMode,
    setSelectedItems,
    notifySelectionChange
  } = useSelection({
    phases,
    onSelectionChange,
    onItemSelect: handleItemSelect,
    externalSelectedItems,
    externalSelectionDetails
  })

  const handleSelectionModeChange = (mode: 'none' | 'multi') => {
    setSelectionMode(mode)
  }

  const handleSelectionChange = (items: Set<string>) => {
    setSelectedItems(items)
    notifySelectionChange(items)
  }

  const handleBackToList = () => {
    setViewState('plan-list')
    setSelectedWeek(null)
    setSelectedWorkout(null)
  }

  const handleBackToWeek = () => {
    setViewState('week-detail')
    setSelectedWorkout(null)
  }

  const currentWorkout = selectedWorkout ? findWorkoutById(phases, selectedWorkout) : null
  const currentWeek = selectedWeek ? findWeekById(phases, selectedWeek) : null

  const renderContent = () => {
    switch (viewState) {
      case 'workout-detail':
        if (!currentWorkout) return null
        return (
          <WorkoutDetailView
            workout={currentWorkout}
            onBack={handleBackToWeek}
            onRequestPlan={onRequestPlan}
            onPlanUpdate={onPlanUpdate}
          />
        )
      
      case 'week-detail':
        if (!currentWeek) return null
        return (
          <WeekDetailView
            week={currentWeek}
            phases={phases}
            selectedItems={selectedItems}
            selectionMode={selectionMode}
            onItemClick={handleItemClick}
            onRequestPlan={onRequestPlan}
            onSelectionModeChange={handleSelectionModeChange}
            onSelectionChange={handleSelectionChange}
          />
        )
      
      default:
        return (
          <PlanListView
            phases={phases}
            selectedItems={selectedItems}
            selectionMode={selectionMode}
            onItemClick={handleItemClick}
            onSelectionModeChange={handleSelectionModeChange}
            onSelectionChange={handleSelectionChange}
          />
        )
    }
  }

  return (
    <div className="h-full flex flex-col bg-white border-l border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex-1">
            <h2 className="text-lg font-medium text-gray-900">Training Plans</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setPlanPanelOpen(false)}
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Header Content - Description and Selection Button */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {viewState === 'plan-list' 
              ? 'Structured training schedule' 
              : viewState === 'week-detail' 
              ? 'Weekly training overview'
              : 'Workout details'
            }
          </p>
          {(viewState === 'plan-list' || viewState === 'week-detail') && (
            <Button
              onClick={toggleSelectionMode}
              variant="ghost"
              size="sm"
              className="text-green-600 hover:text-green-700 hover:bg-green-50"
            >
              {selectionMode === 'multi' ? 'Done selecting' : 'Select items'}
            </Button>
          )}
        </div>

        {/* Navigation breadcrumbs */}
        {viewState !== 'plan-list' && (
          <div className="flex items-center gap-2 text-sm text-gray-600 mt-3 pt-3 border-t border-gray-100">
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
                  onClick={() => setViewState('week-detail')}
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

      {/* Content - Fixed Height with Scroll */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4">
            {/* Debug info */}
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-xs">
              <p className="font-mono">
                📊 Phases loaded: {phases.length}
              </p>
              {phases.length > 0 && (
                <p className="font-mono mt-1">
                  Phase IDs: {phases.map(p => p.id).join(', ')}
                </p>
              )}
            </div>
            {renderContent()}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
