import { useState, useRef, useCallback, useEffect } from 'react'
import { X, BarChart3, LineChart, TrendingUp, Clock, MapPin, Activity, Zap, Target, Calendar } from 'lucide-react'
import { Card } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Progress } from './ui/progress'
import { ScrollArea } from './ui/scroll-area'
import { BarChart, Bar, LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'
import { usePanelContext } from '../contexts/PanelContext'

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
  splits?: { km: number, pace: string, hr?: number }[]
  intensityZones?: { zone: string, time: number, percentage: number }[]
  isCompleted?: boolean
  completionRate?: number
}

interface AIDisplayPanelProps {
  workouts: WorkoutComparison[]
  analysisType?: 'comparison' | 'progression' | 'performance'
  onSelectionChange?: (selectedItems: string[], selectionDetails: { [id: string]: { type: 'phase' | 'week' | 'workout', title: string } }) => void
  selectedItems?: string[]
  selectionDetails?: { [id: string]: { type: 'phase' | 'week' | 'workout', title: string } }
}

const difficultyColors = {
  easy: 'bg-green-100 text-green-700 border-green-200',
  moderate: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  hard: 'bg-red-100 text-red-700 border-red-200',
}

const workoutColors = {
  easy: '#16a34a',
  moderate: '#ea580c', 
  hard: '#dc2626',
}

// Sample intensity zone data
const sampleIntensityZones = [
  { zone: 'Zone 1', time: 15, percentage: 25 },
  { zone: 'Zone 2', time: 20, percentage: 33 },
  { zone: 'Zone 3', time: 18, percentage: 30 },
  { zone: 'Zone 4', time: 5, percentage: 8 },
  { zone: 'Zone 5', time: 2, percentage: 4 },
]

// Sample splits data  
const sampleSplits = [
  { km: 1, pace: '4:30', hr: 145 },
  { km: 2, pace: '4:25', hr: 152 },
  { km: 3, pace: '4:35', hr: 158 },
  { km: 4, pace: '4:40', hr: 162 },
  { km: 5, pace: '4:28', hr: 159 },
]

// Sample performance metrics for radar chart
const performanceMetrics = [
  { metric: 'Endurance', valueA: 85, valueB: 78, valueC: 92 },
  { metric: 'Speed', valueA: 72, valueB: 88, valueC: 65 },
  { metric: 'Power', valueA: 78, valueB: 82, valueC: 71 },
  { metric: 'Efficiency', valueA: 88, valueB: 75, valueC: 85 },
  { metric: 'Consistency', valueA: 82, valueB: 79, valueC: 88 },
  { metric: 'Recovery', valueA: 75, valueB: 83, valueC: 79 },
]

export function AIDisplayPanel({
  workouts,
  analysisType = 'comparison',
  onSelectionChange,
  selectedItems: externalSelectedItems = [],
  selectionDetails: externalSelectionDetails = {}
}: AIDisplayPanelProps) {
  const { setAnalysisPanelOpen } = usePanelContext()
  const [activeTab, setActiveTab] = useState('overview')
  const [selectionMode, setSelectionMode] = useState<'none' | 'multi'>('none')
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set(externalSelectedItems))
  
  // Sync external selection changes
  useEffect(() => {
    setSelectedItems(new Set(externalSelectedItems))
    if (externalSelectedItems.length > 0) {
      setSelectionMode('multi')
    }
  }, [externalSelectedItems])
  
  // Drag selection state
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<{ x: number, y: number } | null>(null)
  const [dragEnd, setDragEnd] = useState<{ x: number, y: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [selectableElements, setSelectableElements] = useState<Map<string, { element: HTMLElement, type: 'workout', rect: DOMRect }>>(new Map())

  const handleWorkoutClick = (workoutId: string, event: React.MouseEvent) => {
    if (selectionMode === 'multi') {
      event.preventDefault()
      toggleItemSelection(workoutId)
    }
  }

  const toggleItemSelection = (id: string) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedItems(newSelected)
    notifySelectionChange(newSelected)
  }

  const notifySelectionChange = (selectedSet: Set<string>) => {
    const selectionDetails: { [id: string]: { type: 'workout', title: string } } = {}
    
    selectedSet.forEach(id => {
      const workout = workouts.find(w => w.id === id)
      if (workout) {
        selectionDetails[id] = { type: 'workout', title: workout.title }
      }
    })
    
    onSelectionChange?.(Array.from(selectedSet), selectionDetails)
  }

  const toggleSelectionMode = () => {
    if (selectionMode === 'multi') {
      setSelectionMode('none')
      setSelectedItems(new Set())
      notifySelectionChange(new Set())
    } else {
      setSelectionMode('multi')
    }
  }

  const isSelected = (workoutId: string) => selectedItems.has(workoutId)

  const getCardClassName = (workout: WorkoutComparison) => {
    let baseClass = "p-4 cursor-pointer transition-all duration-200"
    
    if (selectionMode === 'multi') {
      if (isSelected(workout.id)) {
        baseClass += " ring-2 ring-blue-500 ring-offset-2"
      } else {
        baseClass += " hover:ring-1 hover:ring-blue-200"
      }
    } else {
      baseClass += " hover:shadow-md"
    }
    
    return baseClass
  }

  // Reset drag state when view changes
  useEffect(() => {
    setIsDragging(false)
    setDragStart(null)
    setDragEnd(null)
  }, [activeTab])

  // Update selectable elements when component renders
  useEffect(() => {
    if (containerRef.current) {
      const elements = new Map()
      
      // Find all selectable workout cards
      const workoutCards = containerRef.current.querySelectorAll('[data-workout-id]')
      workoutCards.forEach(card => {
        const id = card.getAttribute('data-workout-id')
        if (id) {
          elements.set(id, {
            element: card as HTMLElement,
            type: 'workout' as const,
            rect: card.getBoundingClientRect()
          })
        }
      })
      
      setSelectableElements(elements)
    }
  }, [workouts, activeTab])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return // Only left click
    if (activeTab !== 'overview') return // Only in overview tab
    
    const scrollArea = e.currentTarget as HTMLElement
    const rect = scrollArea.getBoundingClientRect()
    if (!rect) return
    
    const x = e.clientX - rect.left + scrollArea.scrollLeft
    const y = e.clientY - rect.top + scrollArea.scrollTop
    
    setDragStart({ x, y })
    setIsDragging(true)
    
    // Prevent text selection
    e.preventDefault()
  }, [activeTab])

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
      // Switch to selection mode
      setSelectionMode('multi')
      
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
            bottom: elementRect.bottom - containerRect.top + scrollArea.scrollTop
          }
          
          // Check if element intersects with selection rectangle
          if (relativeRect.left < maxX && 
              relativeRect.right > minX && 
              relativeRect.top < maxY && 
              relativeRect.bottom > minY) {
            newSelected.add(id)
          }
        })
        
        setSelectedItems(newSelected)
        notifySelectionChange(newSelected)
      }
    }
    
    setIsDragging(false)
    setDragStart(null)
    setDragEnd(null)
  }, [isDragging, dragStart, dragEnd, selectableElements])

  // Get selection rectangle for rendering
  const getSelectionRect = () => {
    if (!isDragging || !dragStart || !dragEnd) return null
    
    return {
      left: Math.min(dragStart.x, dragEnd.x),
      top: Math.min(dragStart.y, dragEnd.y),
      width: Math.abs(dragEnd.x - dragStart.x),
      height: Math.abs(dragEnd.y - dragStart.y)
    }
  }

  const renderWorkoutCard = (workout: WorkoutComparison, index: number) => (
    <Card 
      key={workout.id} 
      className={getCardClassName(workout)}
      onClick={(e) => handleWorkoutClick(workout.id, e)}
      data-workout-id={workout.id}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-medium text-gray-900 mb-1">{workout.title}</h3>
          <p className="text-sm text-gray-600 mb-2">{workout.date}</p>
          <div className="flex items-center gap-2">
            <Badge className={`text-xs ${difficultyColors[workout.difficulty]}`}>
              {workout.difficulty}
            </Badge>
            {workout.isCompleted && (
              <Badge className="text-xs bg-green-100 text-green-700">
                Completed
              </Badge>
            )}
            {workout.completionRate && workout.completionRate < 100 && (
              <Badge className="text-xs bg-orange-100 text-orange-700">
                {workout.completionRate}% Complete
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-full border-2 border-white shadow-md"
            style={{
              backgroundColor: workoutColors[workout.difficulty],
              transform: `scale(${0.8 + (workout.tss / 150) * 0.4})`,
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-500" />
          <span>{workout.duration}</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-gray-500" />
          <span>{workout.distance}</span>
        </div>
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-gray-500" />
          <span>TSS: {workout.tss}</span>
        </div>
        {workout.avgPace && (
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-gray-500" />
            <span>{workout.avgPace}/km</span>
          </div>
        )}
        {workout.avgHR && (
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-gray-500" />
            <span>{workout.avgHR} bpm avg</span>
          </div>
        )}
        {workout.calories && (
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-gray-500" />
            <span>{workout.calories} cal</span>
          </div>
        )}
      </div>
    </Card>
  )

  const renderComparisonCharts = () => (
    <div className="space-y-6">
      {/* TSS Comparison */}
      <Card className="p-6">
        <h4 className="font-medium mb-4">Training Stress Score Comparison</h4>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={workouts.map((w, i) => ({ name: `Workout ${i + 1}`, tss: w.tss, difficulty: w.difficulty }))}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="tss" fill="#16a34a" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Performance Radar */}
      {workouts.length >= 2 && (
        <Card className="p-6">
          <h4 className="font-medium mb-4">Performance Metrics Radar</h4>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={performanceMetrics}>
              <PolarGrid />
              <PolarAngleAxis dataKey="metric" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} />
              <Radar name="Workout 1" dataKey="valueA" stroke="#16a34a" fill="#16a34a" fillOpacity={0.1} />
              <Radar name="Workout 2" dataKey="valueB" stroke="#ea580c" fill="#ea580c" fillOpacity={0.1} />
              {workouts.length >= 3 && (
                <Radar name="Workout 3" dataKey="valueC" stroke="#dc2626" fill="#dc2626" fillOpacity={0.1} />
              )}
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Intensity Zones */}
      <Card className="p-6">
        <h4 className="font-medium mb-4">Training Intensity Distribution</h4>
        <div className="space-y-3">
          {sampleIntensityZones.map((zone, index) => (
            <div key={zone.zone} className="flex items-center gap-3">
              <span className="w-16 text-sm text-gray-600">{zone.zone}</span>
              <div className="flex-1">
                <Progress value={zone.percentage} className="h-2" />
              </div>
              <span className="w-12 text-sm text-gray-600">{zone.time}min</span>
              <span className="w-8 text-sm text-gray-600">{zone.percentage}%</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )

  const renderSplitsAnalysis = () => (
    <Card className="p-6">
      <h4 className="font-medium mb-4">Pace Analysis</h4>
      <ResponsiveContainer width="100%" height={250}>
        <RechartsLineChart data={sampleSplits}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="km" label={{ value: 'Kilometer', position: 'insideBottom', offset: -5 }} />
          <YAxis label={{ value: 'Heart Rate', angle: -90, position: 'insideLeft' }} />
          <Tooltip />
          <Line type="monotone" dataKey="hr" stroke="#16a34a" strokeWidth={2} />
        </RechartsLineChart>
      </ResponsiveContainer>
    </Card>
  )

  const renderAIInsights = () => (
    <Card className="p-6">
      <h4 className="font-medium mb-4">AI Coach Analysis</h4>
      <div className="space-y-4">
        <div className="p-4 bg-blue-50 rounded-lg">
          <h5 className="font-medium text-blue-900 mb-2">Key Insights</h5>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Workout intensity shows consistent improvement over time</li>
            <li>• Recovery metrics indicate adequate rest between sessions</li>
            <li>• Pace distribution suggests good aerobic base development</li>
          </ul>
        </div>
        
        <div className="p-4 bg-green-50 rounded-lg">
          <h5 className="font-medium text-green-900 mb-2">Strengths</h5>
          <ul className="text-sm text-green-800 space-y-1">
            <li>• Strong endurance capacity in longer sessions</li>
            <li>• Good consistency in training execution</li>
            <li>• Effective pacing strategy across different distances</li>
          </ul>
        </div>

        <div className="p-4 bg-orange-50 rounded-lg">
          <h5 className="font-medium text-orange-900 mb-2">Recommendations</h5>
          <ul className="text-sm text-orange-800 space-y-1">
            <li>• Consider increasing high-intensity training volume</li>
            <li>• Focus on speed development in upcoming sessions</li>
            <li>• Maintain current recovery protocols</li>
          </ul>
        </div>
      </div>
    </Card>
  )

  const selectionRect = getSelectionRect()

  return (
    <div className="h-full flex flex-col bg-white border-l border-gray-200" ref={containerRef}>
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex-1">
            <h2 className="text-lg font-medium text-gray-900">AI Coach Analysis</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setAnalysisPanelOpen(false)}
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Header Content - Description and Selection Button */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-gray-600">
            Detailed workout comparison and performance insights
          </p>
          <Button
            onClick={toggleSelectionMode}
            variant="ghost"
            size="sm"
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          >
            {selectionMode === 'multi' ? 'Done selecting' : 'Select workouts'}
          </Button>
        </div>

        {/* Analysis Type Indicator */}
        <div className="flex items-center gap-2">
          <Badge className="bg-blue-100 text-blue-700 border-blue-200">
            {analysisType === 'comparison' && 'Workout Comparison'}
            {analysisType === 'progression' && 'Progress Analysis'}
            {analysisType === 'performance' && 'Performance Review'}
          </Badge>
          <span className="text-sm text-gray-600">
            {workouts.length} workout{workouts.length > 1 ? 's' : ''} analyzed
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <div className="px-4 pt-3 flex-shrink-0">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="metrics">Metrics</TabsTrigger>
              <TabsTrigger value="analysis">Analysis</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 min-h-0 overflow-hidden">
            <ScrollArea className="h-full">
              <div 
                className="p-4 relative"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
              >
            <TabsContent value="overview" className="space-y-4 mt-0">
              {/* Workout Cards */}
              <div className="grid gap-4">
                {workouts.map((workout, index) => renderWorkoutCard(workout, index))}
              </div>

              {/* Quick Stats */}
              <Card className="p-6">
                <h4 className="font-medium mb-4">Summary Statistics</h4>
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-medium text-gray-900">
                      {workouts.reduce((sum, w) => sum + w.tss, 0)}
                    </div>
                    <div className="text-sm text-gray-600">Total TSS</div>
                  </div>
                  <div>
                    <div className="text-2xl font-medium text-gray-900">
                      {workouts.length}
                    </div>
                    <div className="text-sm text-gray-600">Workouts</div>
                  </div>
                  <div>
                    <div className="text-2xl font-medium text-gray-900">
                      {workouts.length > 0 ? Math.round(workouts.reduce((sum, w) => sum + w.tss, 0) / workouts.length) : 0}
                    </div>
                    <div className="text-sm text-gray-600">Avg TSS</div>
                  </div>
                  <div>
                    <div className="text-2xl font-medium text-gray-900">
                      {workouts.length > 0 ? Math.round((workouts.filter(w => w.isCompleted).length / workouts.length) * 100) : 0}%
                    </div>
                    <div className="text-sm text-gray-600">Completion</div>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="metrics" className="mt-0">
              {renderComparisonCharts()}
            </TabsContent>

            <TabsContent value="analysis" className="mt-0">
              {renderSplitsAnalysis()}
            </TabsContent>

            <TabsContent value="insights" className="mt-0">
              {renderAIInsights()}
            </TabsContent>

                {/* Drag selection rectangle */}
                {selectionRect && (
                  <div
                    className="absolute border-2 border-blue-500 border-dashed bg-blue-50/20 backdrop-blur-[0.5px] pointer-events-none z-50"
                    style={{
                      left: `${selectionRect.left}px`,
                      top: `${selectionRect.top}px`,
                      width: `${selectionRect.width}px`,
                      height: `${selectionRect.height}px`,
                    }}
                  />
                )}
              </div>
            </ScrollArea>
          </div>
        </Tabs>
      </div>
    </div>
  )
}
