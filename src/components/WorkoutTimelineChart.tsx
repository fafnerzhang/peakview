import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Timer, Heart, Zap, TrendingUp } from 'lucide-react'

// Types from your schema
interface WorkoutSegment {
  type: "segment"
  distance_range?: {
    min: number
    max: number
  }
  duration: number
  intensity_metric: "pace" | "power" | "heart_rate"
  target_range: {
    min: number
    max: number
  }
  description: string
  tags?: string[]
  pre: number
}

interface LoopStart {
  type: "loop_start"
  id: string
  repeat: number
}

interface LoopEnd {
  type: "loop_end"
  id: string
}

type WorkoutItem = WorkoutSegment | LoopStart | LoopEnd

interface SegmentBlock {
  startTime: number
  endTime: number
  duration: number
  intensity: number
  segment: WorkoutSegment
  inLoop: boolean
  loopIteration?: number
  loopId?: string
  color: string
}

interface WorkoutTimelineChartProps {
  workoutItems?: WorkoutItem[]
  workout?: { detail: any[] }
}

export function WorkoutTimelineChart({ workoutItems, workout }: WorkoutTimelineChartProps) {
  const [selectedMetric, setSelectedMetric] = useState<"pace" | "power" | "heart_rate">("pace")
  const [hoveredSegment, setHoveredSegment] = useState<number | null>(null)

  // Early return if no data is provided
  if (!workoutItems && !workout?.detail) {
    return null
  }

  // Convert workout.detail format to WorkoutItem format if needed
  const processedWorkoutItems = useMemo(() => {
    if (workoutItems) {
      return workoutItems
    }
    
    if (workout?.detail) {
      return workout.detail.map((segment: any, index: number) => {
        if (segment.type === 'loop-start') {
          return {
            type: 'loop_start' as const,
            id: `loop-${index}`,
            repeat: segment.loop_count || 1
          }
        } else if (segment.type === 'loop-end') {
          return {
            type: 'loop_end' as const,
            id: `loop-${index}`
          }
        } else {
          return {
            type: 'segment' as const,
            duration: segment.duration || 0,
            intensity_metric: segment.intensity_metric || 'pace',
            target_range: segment.target_range || { min: 0, max: 0 },
            description: segment.description || '',
            tags: segment.tags || [],
            pre: segment.pre || 1,
            distance_range: segment.distance_range
          }
        }
      })
    }
    
    return []
  }, [workoutItems, workout])

  // Process workout items to create segment blocks
  const segmentBlocks = useMemo(() => {
    const blocks: SegmentBlock[] = []
    
    // Track current state
    let currentTime = 0
    const loopColors = new Map<string, string>()
    const loopColorPalette = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#06b6d4']
    let colorIndex = 0
    
    const processItems = (items: WorkoutItem[], currentLoopId?: string, loopIteration?: number) => {
      let i = 0
      while (i < items.length) {
        const item = items[i]
        
        if (item.type === 'segment') {
          // Include ALL segments, not just matching metric
          // Determine color based on segment type and loop status
          let color = '#10b981' // Default green
          
          if (currentLoopId) {
            // If in a loop, use loop-specific color
            if (!loopColors.has(currentLoopId)) {
              loopColors.set(currentLoopId, loopColorPalette[colorIndex % loopColorPalette.length])
              colorIndex++
            }
            color = loopColors.get(currentLoopId)!
          } else {
            // Use color based on difficulty for non-loop segments
            if (item.pre <= 3) color = '#10b981' // Easy - green
            else if (item.pre <= 6) color = '#f59e0b' // Moderate - orange  
            else color = '#ef4444' // Hard - red
          }
          
          blocks.push({
            startTime: currentTime,
            endTime: currentTime + item.duration,
            duration: item.duration,
            intensity: (item.target_range.min + item.target_range.max) / 2,
            segment: item,
            inLoop: currentLoopId !== undefined,
            loopIteration,
            loopId: currentLoopId,
            color
          })
          
          currentTime += item.duration
          i++
        } else if (item.type === 'loop_start') {
          // Find matching loop_end
          let depth = 1
          let j = i + 1
          while (j < items.length && depth > 0) {
            if (items[j].type === 'loop_start') depth++
            if (items[j].type === 'loop_end' && items[j].id === item.id) depth--
            j++
          }
          
          const loopItems = items.slice(i + 1, j - 1)
          
          // Repeat the loop
          for (let rep = 0; rep < item.repeat; rep++) {
            processItems(loopItems, item.id, rep + 1)
          }
          
          i = j
        } else {
          i++
        }
      }
    }
    
    processItems(processedWorkoutItems)
    
    return blocks
  }, [processedWorkoutItems, selectedMetric])

  // Get available metrics from workout items
  const availableMetrics = useMemo(() => {
    const metrics = new Set<"pace" | "power" | "heart_rate">()
    
    const collectMetrics = (items: WorkoutItem[]) => {
      items.forEach(item => {
        if (item.type === 'segment') {
          metrics.add(item.intensity_metric)
        }
      })
    }
    
    collectMetrics(processedWorkoutItems)
    return Array.from(metrics)
  }, [processedWorkoutItems])

  const formatIntensityValue = (value: number) => {
    switch (selectedMetric) {
      case "pace":
        const minutes = Math.floor(value / 60)
        const seconds = value % 60
        return `${minutes}:${seconds.toString().padStart(2, '0')}/km`
      case "power":
        return `${Math.round(value)}W`
      case "heart_rate":
        return `${Math.round(value)} bpm`
      default:
        return value.toString()
    }
  }

  const getMetricIcon = (metric: "pace" | "power" | "heart_rate") => {
    switch (metric) {
      case "pace":
        return <Timer className="h-4 w-4" />
      case "power":
        return <Zap className="h-4 w-4" />
      case "heart_rate":
        return <Heart className="h-4 w-4" />
    }
  }

  const getMetricLabel = (metric: "pace" | "power" | "heart_rate") => {
    switch (metric) {
      case "pace":
        return "Pace"
      case "power":
        return "Power"
      case "heart_rate":
        return "Heart Rate"
    }
  }

  // Calculate chart dimensions and scales
  const totalDuration = segmentBlocks.length > 0 ? Math.max(...segmentBlocks.map(b => b.endTime)) : 0
  
  // Only consider matching metric segments for intensity scale
  const matchingSegments = segmentBlocks.filter(b => b.segment.intensity_metric === selectedMetric)
  const minIntensity = matchingSegments.length > 0 ? Math.min(...matchingSegments.map(b => b.intensity)) : 0
  const maxIntensity = matchingSegments.length > 0 ? Math.max(...matchingSegments.map(b => b.intensity)) : 100
  
  const chartWidth = 800
  const chartHeight = 300
  const marginLeft = 80
  const marginRight = 40
  const marginTop = 20
  const marginBottom = 60
  
  const plotWidth = chartWidth - marginLeft - marginRight
  const plotHeight = chartHeight - marginTop - marginBottom

  if (segmentBlocks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Workout Intensity Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            No segments available for the selected metric
          </div>
        </CardContent>
      </Card>
    )
  }

  // Generate Y-axis ticks
  const yTicks = []
  const tickCount = 6
  for (let i = 0; i <= tickCount; i++) {
    const value = selectedMetric === 'pace' 
      ? maxIntensity - (maxIntensity - minIntensity) * (i / tickCount) // Reversed for pace
      : minIntensity + (maxIntensity - minIntensity) * (i / tickCount)
    yTicks.push(value)
  }

  // Generate X-axis ticks
  const xTicks = []
  const xTickCount = Math.min(8, Math.ceil(totalDuration / 5))
  for (let i = 0; i <= xTickCount; i++) {
    xTicks.push((totalDuration * i) / xTickCount)
  }

  return (
    <div className="space-y-2">
      {/* Compact header with metric selector */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Intensity Timeline</span>
        <div className="flex gap-1">
          {availableMetrics.map((metric) => (
            <button
              key={metric}
              onClick={() => setSelectedMetric(metric)}
              className={`flex items-center gap-1 px-2 py-1 text-xs rounded-md transition-colors ${
                selectedMetric === metric 
                  ? 'bg-green-100 text-green-700 border border-green-200' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {getMetricIcon(metric)}
              {getMetricLabel(metric)}
            </button>
          ))}
        </div>
      </div>
      
      {/* Compact chart */}
      <div className="relative" style={{ width: chartWidth * 0.8, height: chartHeight * 0.6 }}>
        <svg width={chartWidth * 0.8} height={chartHeight * 0.6} className="border border-gray-200 rounded bg-gray-50">
          {/* Simplified grid - fewer lines */}
          {yTicks.filter((_, index) => index % 2 === 0).map((value, index) => {
            const normalizedValue = selectedMetric === 'pace'
              ? (maxIntensity - value) / (maxIntensity - minIntensity)
              : (value - minIntensity) / (maxIntensity - minIntensity)
            const y = (marginTop * 0.5) + (plotHeight * 0.6) - (plotHeight * 0.6 * normalizedValue * 0.9)
            return (
              <line
                key={`y-grid-${index}`}
                x1={marginLeft * 0.6}
                y1={y}
                x2={marginLeft * 0.6 + plotWidth * 0.8}
                y2={y}
                stroke="#f1f5f9"
                strokeDasharray="2 2"
              />
            )
          })}

          {/* Segment blocks */}
          {segmentBlocks.map((block, index) => {
            const x = (marginLeft * 0.6) + (plotWidth * 0.8 * block.startTime) / totalDuration
            const width = (plotWidth * 0.8 * block.duration) / totalDuration
            
            const isMatchingMetric = block.segment.intensity_metric === selectedMetric
            let barHeight
            
            if (isMatchingMetric) {
              const normalizedIntensity = selectedMetric === 'pace'
                ? (maxIntensity - block.intensity) / (maxIntensity - minIntensity)
                : (block.intensity - minIntensity) / (maxIntensity - minIntensity)
              barHeight = Math.max(3, plotHeight * 0.6 * normalizedIntensity * 0.9)
            } else {
              barHeight = plotHeight * 0.6 * 0.1
            }
            
            const y = (marginTop * 0.5) + (plotHeight * 0.6) - barHeight

            return (
              <rect
                key={index}
                x={x}
                y={y}
                width={Math.max(1, width)}
                height={barHeight}
                fill={isMatchingMetric ? block.color : '#e5e7eb'}
                opacity={hoveredSegment === index ? 1 : (isMatchingMetric ? 0.8 : 0.6)}
                stroke="#ffffff"
                strokeWidth={0.5}
                rx={1}
                className="cursor-pointer transition-opacity"
                onMouseEnter={() => setHoveredSegment(index)}
                onMouseLeave={() => setHoveredSegment(null)}
              />
            )
          })}

          {/* Y-axis labels - fewer, smaller */}
          {yTicks.filter((_, index) => index % 2 === 0).map((value, index) => {
            const normalizedValue = selectedMetric === 'pace'
              ? (maxIntensity - value) / (maxIntensity - minIntensity)
              : (value - minIntensity) / (maxIntensity - minIntensity)
            const y = (marginTop * 0.5) + (plotHeight * 0.6) - (plotHeight * 0.6 * normalizedValue * 0.9)
            return (
              <text
                key={`y-label-${index}`}
                x={(marginLeft * 0.6) - 5}
                y={y + 3}
                textAnchor="end"
                fontSize="10"
                fill="#64748b"
              >
                {formatIntensityValue(value)}
              </text>
            )
          })}

          {/* X-axis labels - fewer */}
          {xTicks.filter((_, index) => index % 2 === 0).map((value, index) => {
            const x = (marginLeft * 0.6) + (plotWidth * 0.8 * value) / totalDuration
            return (
              <text
                key={`x-label-${index}`}
                x={x}
                y={(marginTop * 0.5) + (plotHeight * 0.6) + 15}
                textAnchor="middle"
                fontSize="10"
                fill="#64748b"
              >
                {Math.round(value)}m
              </text>
            )
          })}
        </svg>

        {/* Simplified tooltip */}
        {hoveredSegment !== null && (
          <div
            className="absolute bg-white border border-gray-200 rounded shadow-md p-2 text-xs z-10 pointer-events-none max-w-48"
            style={{
              left: Math.min(
                (marginLeft * 0.6) + (plotWidth * 0.8 * segmentBlocks[hoveredSegment].startTime) / totalDuration,
                chartWidth * 0.8 - 160
              ),
              top: marginTop * 0.5 - 5,
              transform: 'translateY(-100%)'
            }}
          >
            <p className="font-medium text-gray-900 mb-1">
              {segmentBlocks[hoveredSegment].segment.description}
            </p>
            <p className="text-gray-600">
              {segmentBlocks[hoveredSegment].duration}min • {formatIntensityValue(segmentBlocks[hoveredSegment].intensity)}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}