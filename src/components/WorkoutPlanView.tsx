import { useEffect, useState } from 'react'
import { EnhancedChatPanel } from './EnhancedChatPanel'
import { WorkoutPlanPanel } from './plan/WorkoutPlanPanel'
import { AIDisplayPanel } from './AIDisplayPanel'
import { WorkoutBlockData } from './WorkoutBlock'
import { TrainingPhase, WorkoutPlan } from './plan/types'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/src/components/ui/resizable'
import { PanelProvider, usePanelContext } from '../contexts/PanelContext'
import { useRunningCoachContext } from '../contexts/RunningCoachContext'
import { transformContextPhasesToUI } from './plan/phaseTransformer'

interface WorkoutComparison {
  id: string
  title: string
  date: string
  duration: string
  distance: string
  difficulty: 'easy' | 'moderate' | 'hard'
  tss: number
  avgPace?: string
  avgHR?: number
  maxHR?: number
  calories?: number
  elevation?: number
  isCompleted?: boolean
  completionRate?: number
}

interface WorkoutPlanViewProps {
  onClose: () => void
}

function WorkoutPlanViewContent(_props: WorkoutPlanViewProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [selectionDetails, setSelectionDetails] = useState<{ [id: string]: { type: 'phase' | 'week' | 'workout', title: string } }>({})
  const [comparisonWorkouts, setComparisonWorkouts] = useState<WorkoutComparison[]>([])
  const [analysisType, setAnalysisType] = useState<'comparison' | 'progression' | 'performance'>('comparison')

  // Get phases from RunningCoachContext
  const {
    phases: contextPhases,
    isSyncingPhases,
    setSelectedPhases,
    setSelectedWeeks,
    setSelectedWorkouts
  } = useRunningCoachContext()

  // Use panel context for state only
  const {
    isPlanPanelOpen,
    isAnalysisPanelOpen,
    setPlanPanelOpen,
    setAnalysisPanelOpen
  } = usePanelContext()

  // Transform context phases to UI phases and maintain local state
  const [trainingPhases, setTrainingPhases] = useState<TrainingPhase[]>([])

  // Sync context phases to local UI state
  useEffect(() => {
    console.log('🔍 Context phases changed:', contextPhases)
    console.log('🔍 Context phases length:', contextPhases.length)
    console.log('🔍 isSyncingPhases:', isSyncingPhases)

    if (contextPhases.length > 0) {
      console.log('🔄 Transforming context phases to UI format...')
      try {
        const uiPhases = transformContextPhasesToUI(contextPhases)
        console.log('✅ Transformed UI phases:', uiPhases)
        setTrainingPhases(uiPhases)
      } catch (error) {
        console.error('❌ Error transforming phases:', error)
      }
    } else {
      console.log('⚠️ No context phases to transform')
      setTrainingPhases([])
    }
  }, [contextPhases, isSyncingPhases])

  const handlePlanGenerated = (plan: WorkoutPlan | TrainingPhase) => {
    // Check if this is a complete phase or a single workout
    if ('weeks' in plan) {
      // This is a TrainingPhase
      const phase = plan as TrainingPhase
      setTrainingPhases(prev => [...prev, phase])
    } else {
      // This is a single WorkoutPlan
      const workout = plan as WorkoutPlan
      
      // Create a new phase if none exist
      if (trainingPhases.length === 0) {
        const newPhase: TrainingPhase = {
          id: 'phase1',
          title: 'General Preparation Phase',
          description: 'Building aerobic base and running form',
          type: 'general',
          startDate: new Date().toLocaleDateString('zh-TW', { timeZone: 'Asia/Taipei' }),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('zh-TW', { timeZone: 'Asia/Taipei' }),
          weeks: [{
            id: 'week1',
            title: 'Week 1: Base Building',
            weekNumber: 1,
            startDate: new Date().toLocaleDateString('zh-TW', { timeZone: 'Asia/Taipei' }),
            endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('zh-TW', { timeZone: 'Asia/Taipei' }),
            workouts: [workout]
          }]
        }
        setTrainingPhases([newPhase])
      } else {
        // Add to the first week of the first phase
        setTrainingPhases(prev => 
          prev.map(phase => 
            phase.id === trainingPhases[0].id
              ? {
                  ...phase,
                  weeks: phase.weeks.map(week => 
                    week.id === phase.weeks[0]?.id
                      ? { ...week, workouts: [workout, ...week.workouts] }
                      : week
                  )
                }
              : phase
          )
        )
      }
    }
  }

  const handlePlanUpdate = (planId: string, workouts: WorkoutBlockData[]) => {
    setTrainingPhases(prev => 
      prev.map(phase => ({
        ...phase,
        weeks: phase.weeks.map(week => ({
          ...week,
          workouts: week.workouts.map(plan => 
            plan.id === planId 
              ? { ...plan, workouts }
              : plan
          )
        }))
      }))
    )
  }

  const handlePlanRequest = (request: string) => {
    // Check if this is a comparison request
    if (request.toLowerCase().includes('compare') || request.toLowerCase().includes('analysis')) {
      handleRequestComparison(request)
    }
    // This could be used to send the request back to the chat
    // For now, we'll handle it in the chat component directly
  }

  const handleSelectionChange = (items: string[], details: { [id: string]: { type: 'phase' | 'week' | 'workout', title: string } }) => {
    setSelectedItems(items)
    setSelectionDetails(details)

    // Extract phase objects
    const phaseObjects = items
      .filter(id => details[id]?.type === 'phase')
      .map(phaseId => trainingPhases.find(p => p.id === phaseId))
      .filter(p => p !== undefined)

    // Extract week objects
    const weekObjects = items
      .filter(id => details[id]?.type === 'week')
      .map(weekId => {
        for (const phase of trainingPhases) {
          const week = phase.weeks.find(w => w.id === weekId)
          if (week) return week
        }
        return null
      })
      .filter(w => w !== null)

    // Extract workout objects
    const workoutObjects = items
      .filter(id => details[id]?.type === 'workout')
      .map(workoutId => {
        for (const phase of trainingPhases) {
          for (const week of phase.weeks) {
            const workout = week.workouts.find(w => w.id === workoutId)
            if (workout) return workout
          }
        }
        return null
      })
      .filter(w => w !== null)

    // Update context with all selected items
    setSelectedPhases(phaseObjects)
    setSelectedWeeks(weekObjects)
    setSelectedWorkouts(workoutObjects)
  }

  const handleRemoveSelection = (id: string) => {
    // Find and remove just this item, without affecting hierarchical relationships
    // When removing via tag, we only remove that specific item
    const newItems = selectedItems.filter(item => item !== id)
    const newDetails = { ...selectionDetails }
    delete newDetails[id]
    
    setSelectedItems(newItems)
    setSelectionDetails(newDetails)
  }

  const handleClearSelection = () => {
    setSelectedItems([])
    setSelectionDetails({})
    // Sync to all panels by clearing their selection states
  }

  const handleOpenComparison = (workouts: WorkoutComparison[], type: 'comparison' | 'progression' | 'performance' = 'comparison') => {
    setComparisonWorkouts(workouts)
    setAnalysisType(type)
    setPlanPanelOpen(false)
    setAnalysisPanelOpen(true)
  }

  // Sample function to demonstrate workout comparison
  const handleRequestComparison = (_request: string) => {
    // This would be called from the chat panel when AI needs to show comparisons
    // For demo purposes, let's create some sample comparison data
    const sampleWorkouts: WorkoutComparison[] = [
      {
        id: 'comp1',
        title: 'Easy Base Run',
        date: '2024-10-02',
        duration: '45 minutes',
        distance: '7.5 km',
        difficulty: 'easy',
        tss: 65,
        avgPace: '6:00',
        avgHR: 145,
        maxHR: 158,
        calories: 420,
        elevation: 45,
        isCompleted: true,
      },
      {
        id: 'comp2',
        title: 'Tempo Run',
        date: '2024-10-05',
        duration: '40 minutes',
        distance: '6.5 km',
        difficulty: 'moderate',
        tss: 85,
        avgPace: '5:30',
        avgHR: 162,
        maxHR: 175,
        calories: 385,
        elevation: 32,
        isCompleted: true,
      },
      {
        id: 'comp3',
        title: 'Intervals',
        date: '2024-11-18',
        duration: '50 minutes',
        distance: '8.5 km',
        difficulty: 'hard',
        tss: 120,
        avgPace: '4:45',
        avgHR: 172,
        maxHR: 185,
        calories: 520,
        elevation: 28,
        completionRate: 60,
      }
    ]
    
    handleOpenComparison(sampleWorkouts, 'comparison')
  }

  return (
    <div className="h-screen bg-gray-50">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        {/* Chat Panel - always visible */}
        <ResizablePanel
          id="chat-panel"
          defaultSize={isPlanPanelOpen || isAnalysisPanelOpen ? 60 : 100}
          minSize={30}
        >
          <div className="h-full border-r border-gray-200">
            <EnhancedChatPanel
              onPlanGenerated={handlePlanGenerated}
              selectedItems={selectedItems}
              selectionDetails={selectionDetails}
              onRemoveSelection={handleRemoveSelection}
              onClearSelection={handleClearSelection}
              onRequestComparison={handleRequestComparison}
              hasExistingPlans={trainingPhases.length > 0}
            />
          </div>
        </ResizablePanel>

        {/* Plan Panel - conditionally rendered */}
        {isPlanPanelOpen && (
          <>
            <ResizableHandle withHandle />
            <ResizablePanel
              id='plan-panel'
              defaultSize={40}
              minSize={20}
              maxSize={70}
            >
              <WorkoutPlanPanel
                onRequestPlan={handlePlanRequest}
                phases={trainingPhases}
                onPlanUpdate={handlePlanUpdate}
                onSelectionChange={handleSelectionChange}
                selectedItems={selectedItems}
                selectionDetails={selectionDetails}
              />
            </ResizablePanel>
          </>
        )}

        {/* Analysis Panel - conditionally rendered */}
        {isAnalysisPanelOpen && (
          <>
            <ResizableHandle withHandle />
            <ResizablePanel
              id='analysis-panel'
              defaultSize={40}
              minSize={20}
              maxSize={70}
            >
              <AIDisplayPanel
                workouts={comparisonWorkouts}
                analysisType={analysisType}
                onSelectionChange={handleSelectionChange}
                selectedItems={selectedItems}
                selectionDetails={selectionDetails}
              />
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </div>
  )
}

export function WorkoutPlanView(props: WorkoutPlanViewProps) {
  return (
    <PanelProvider>
      <WorkoutPlanViewContent {...props} />
    </PanelProvider>
  )
}
