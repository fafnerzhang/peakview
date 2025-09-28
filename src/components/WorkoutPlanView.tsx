import { useEffect, useState, useRef } from 'react'
import { ImperativePanelHandle } from 'react-resizable-panels'
import { EnhancedChatPanel } from './EnhancedChatPanel'
import { WorkoutPlanPanel } from './plan/WorkoutPlanPanel'
import { AIDisplayPanel } from './AIDisplayPanel'
import { WorkoutBlockData } from './WorkoutBlock'
import { TrainingPhase, TrainingWeek, WorkoutPlan } from './plan/types'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '../../components/ui/resizable'
import { PanelProvider, usePanelContext } from '../contexts/PanelContext'

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

function WorkoutPlanViewContent({ onClose }: WorkoutPlanViewProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [selectionDetails, setSelectionDetails] = useState<{ [id: string]: { type: 'phase' | 'week' | 'workout', title: string } }>({})
  const [comparisonWorkouts, setComparisonWorkouts] = useState<WorkoutComparison[]>([])
  const [analysisType, setAnalysisType] = useState<'comparison' | 'progression' | 'performance'>('comparison')

  // Local panel refs
  const planPanelRef = useRef<ImperativePanelHandle>(null)
  const analysisPanelRef = useRef<ImperativePanelHandle>(null)
  const blankRef = useRef<ImperativePanelHandle>(null)
  const chatRef = useRef<ImperativePanelHandle>(null)
  // Use panel context for state only
  const {
    isPlanPanelOpen,
    isAnalysisPanelOpen,
    setPlanPanelOpen,
    setAnalysisPanelOpen
  } = usePanelContext()

  // Handle panel operations with useEffect
  useEffect(() => {
    console.log('Panel states changed:', { isPlanPanelOpen, isAnalysisPanelOpen })
    console.log('Blank panel size:', blankRef.current?.getSize())
    // Control panels imperatively
    if (isPlanPanelOpen && !isAnalysisPanelOpen) {
      console.log('Opening plan panel')
      analysisPanelRef.current?.collapse()
      planPanelRef.current?.expand(40)
    } else if (!isPlanPanelOpen && isAnalysisPanelOpen) {
      console.log('Opening analysis panel')
      if (planPanelRef.current){
        console.log('Plan panel collapsed')
      }
      analysisPanelRef.current?.expand(40)
    } else {
      console.log('Closing all panels')
      planPanelRef.current?.collapse()
      console.log(`plan panel collapsed: ${planPanelRef.current?.isCollapsed()}`)
      analysisPanelRef.current?.collapse()
      chatRef.current?.expand(0.999)
    }
    console.log('Plan panel size:', planPanelRef.current?.getSize())
    console.log('Analysis panel size:', analysisPanelRef.current?.getSize())
    console.log('Chat panel size:', chatRef.current?.getSize())
    
  }, [isPlanPanelOpen, isAnalysisPanelOpen])

  // Initial collapse on mount
  useEffect(() => {
    // Collapse both panels initially since both states start as false
    setTimeout(() => {
      planPanelRef.current?.collapse()
      analysisPanelRef.current?.collapse()
    }, 100)
  }, [])
  const [trainingPhases, setTrainingPhases] = useState<TrainingPhase[]>([
    {
      id: 'phase-1',
      title: 'Base Building Phase',
      description: 'Building aerobic base and endurance foundation',
      type: 'general',
      startDate: '2024-01-01',
      endDate: '2024-01-28',
      weeks: [
        {
          id: 'week-1',
          title: 'Week 1: Base Building',
          weekNumber: 1,
          startDate: '2024-01-01',
          endDate: '2024-01-07',
          workouts: [
            {
              id: 'workout-1',
              title: 'Easy Run',
              description: 'Comfortable aerobic pace run to build base fitness',
              date: '2024-01-01',
              totalTime: '45 min',
              totalDistance: '6 km',
              difficulty: 'easy',
              tss: 45,
              workouts: [],
              isCompleted: false
            },
            {
              id: 'workout-2',
              title: 'Interval Training',
              description: '4x800m at threshold pace with 2min recovery',
              date: '2024-01-03',
              totalTime: '60 min',
              totalDistance: '8 km',
              difficulty: 'hard',
              tss: 85,
              workouts: [],
              isCompleted: true
            },
            {
              id: 'workout-3',
              title: 'Recovery Run',
              description: 'Easy recovery pace for active recovery',
              date: '2024-01-05',
              totalTime: '30 min',
              totalDistance: '4 km',
              difficulty: 'easy',
              tss: 25,
              workouts: [],
              isCompleted: false
            }
          ]
        },
        {
          id: 'week-2',
          title: 'Week 2: Progressive Build',
          weekNumber: 2,
          startDate: '2024-01-08',
          endDate: '2024-01-14',
          workouts: [
            {
              id: 'workout-4',
              title: 'Long Run',
              description: 'Steady aerobic pace long run',
              date: '2024-01-08',
              totalTime: '75 min',
              totalDistance: '12 km',
              difficulty: 'moderate',
              tss: 95,
              workouts: [],
              isCompleted: false
            },
            {
              id: 'workout-5',
              title: 'Tempo Run',
              description: '20min tempo effort at lactate threshold',
              date: '2024-01-10',
              totalTime: '50 min',
              totalDistance: '7 km',
              difficulty: 'moderate',
              tss: 75,
              workouts: [],
              isCompleted: false
            }
          ]
        }
      ]
    },
    {
      id: 'phase-2',
      title: 'Speed Development Phase',
      description: 'Developing speed and race pace efficiency',
      type: 'specific',
      startDate: '2024-02-01',
      endDate: '2024-02-28',
      weeks: [
        {
          id: 'week-3',
          title: 'Week 3: Speed Work',
          weekNumber: 3,
          startDate: '2024-02-01',
          endDate: '2024-02-07',
          workouts: [
            {
              id: 'workout-6',
              title: 'Track Intervals',
              description: '6x400m at VO2max pace with 90s rest',
              date: '2024-02-03',
              totalTime: '55 min',
              totalDistance: '8 km',
              difficulty: 'hard',
              tss: 110,
              workouts: [],
              isCompleted: false
            }
          ]
        }
      ]
    }
  ])

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
          startDate: new Date().toLocaleDateString(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          weeks: [{
            id: 'week1',
            title: 'Week 1: Base Building',
            weekNumber: 1,
            startDate: new Date().toLocaleDateString(),
            endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
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

  const handleOpenAnalysisPanel = () => {
    setPlanPanelOpen(false)
    setAnalysisPanelOpen(true)
    // Load sample comparison data for demonstration
    handleRequestComparison('Show analysis')
  }

  const handleOpenComparison = (workouts: WorkoutComparison[], type: 'comparison' | 'progression' | 'performance' = 'comparison') => {
    setComparisonWorkouts(workouts)
    setAnalysisType(type)
    setPlanPanelOpen(false)
    setAnalysisPanelOpen(true)
  }

  // Sample function to demonstrate workout comparison
  const handleRequestComparison = (request: string) => {
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
      <ResizablePanelGroup direction="horizontal" className="h-full" >
        {/* Chat Panel - always visible */}
        <ResizablePanel
          id='blank'
          ref={blankRef}
          defaultSize={0.0001}
          minSize={0}
          maxSize={0}
          collapsible={true}
          collapsedSize={0}
        />
          <ResizableHandle />
        <ResizablePanel
          id="chat-panel"
          defaultSize={100}
          minSize={30}
          maxSize={100}
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
        { isPlanPanelOpen ? <ResizableHandle withHandle /> : null }
        {isPlanPanelOpen && (
        <ResizablePanel
          ref={planPanelRef}
          id='plan-panel'
          defaultSize={40}
          minSize={0}
          maxSize={50}
          collapsible={true}
          collapsedSize={0}
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
          )}
        
        {isAnalysisPanelOpen ? <ResizableHandle withHandle /> : null}
        <ResizablePanel
          ref={analysisPanelRef}
          id='analysis-panel'
          defaultSize={0}
          minSize={0}
          maxSize={70}
          collapsible={true}
          collapsedSize={0}
        >
          {isAnalysisPanelOpen && (
            <AIDisplayPanel
              workouts={comparisonWorkouts}
              analysisType={analysisType}
              onSelectionChange={handleSelectionChange}
              selectedItems={selectedItems}
              selectionDetails={selectionDetails}
            />
          )}
        </ResizablePanel>
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
