import { useState } from 'react'
import { Clock, MapPin, Target, Activity, CheckCircle, Zap, ChevronDown, ChevronUp, Timer, Gauge, Heart, Repeat } from 'lucide-react'
import { Badge } from '@/src/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Separator } from '@/src/components/ui/separator'

interface WorkoutSegment {
  type: "segment"
  distance_range?: {
    min: number
    max: number
  }
  duration?: number
  intensity_metric: string
  target_range: {
    min: number
    max: number
  }
  description: string
  tags?: string[]
  pre?: number
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

type WorkoutDetail = WorkoutSegment | LoopStart | LoopEnd

interface WorkoutPlan {
  id: string
  title: string
  date: string
  description: string
  detail: WorkoutDetail[]
  estimated_tss: number | null
  total_time: number | null
  total_distance: number | null
}

interface WorkoutCardProps {
  workout: WorkoutPlan
  isAdded?: boolean
  onSelect?: (id: string) => void
  isSelected?: boolean
}

export function WorkoutCard({ workout, isAdded, onSelect, isSelected }: WorkoutCardProps) {
  const [expandedLoops, setExpandedLoops] = useState<Set<string>>(new Set())
  const [showStructure, setShowStructure] = useState(false)

  const toggleLoop = (loopId: string) => {
    setExpandedLoops(prev => {
      const newSet = new Set(prev)
      if (newSet.has(loopId)) {
        newSet.delete(loopId)
      } else {
        newSet.add(loopId)
      }
      return newSet
    })
  }

  const getIntensityColor = (pre?: number) => {
    if (!pre) return 'bg-gray-100 text-gray-800 border-gray-200'
    if (pre <= 3) return 'bg-green-100 text-green-800 border-green-200'
    if (pre <= 6) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    return 'bg-red-100 text-red-800 border-red-200'
  }

  const getIntensityLabel = (pre?: number) => {
    if (!pre) return 'Varied'
    if (pre <= 3) return 'Easy'
    if (pre <= 6) return 'Moderate'
    return 'Hard'
  }

  const getIntensityIcon = (pre?: number) => {
    if (!pre) return Activity
    if (pre <= 3) return Activity
    if (pre <= 6) return Target
    return Zap
  }

  const formatDuration = (minutes?: number) => {
    if (!minutes) return 'N/A'
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  const formatDistance = (meters?: number) => {
    if (!meters) return 'N/A'
    return `${(meters / 1000).toFixed(1)}km`
  }

  const formatIntensityValue = (value: number, metric: string) => {
    switch (metric) {
      case "pace":
        const minutes = Math.floor(value / 60)
        const seconds = value % 60
        return `${minutes}:${seconds.toString().padStart(2, '0')}/km`
      case "power":
        return `${value}W`
      case "heart_rate":
        return `${value} bpm`
      default:
        return value.toString()
    }
  }

  const getMetricIcon = (metric: string) => {
    switch (metric) {
      case "pace":
        return <Timer className="h-4 w-4" />
      case "power":
        return <Zap className="h-4 w-4" />
      case "heart_rate":
        return <Heart className="h-4 w-4" />
      default:
        return <Target className="h-4 w-4" />
    }
  }

  const renderWorkoutStructure = (items: WorkoutDetail[], level = 0): JSX.Element[] => {
    const result: JSX.Element[] = []
    let i = 0

    while (i < items.length) {
      const item = items[i]

      if (item.type === "segment") {
        result.push(
          <div key={i} className={`${level > 0 ? 'ml-6' : ''}`}>
            <Card className="border-l-4 border-l-emerald-500 bg-white shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <p className="text-gray-900 mb-2 text-sm">{item.description}</p>

                    <div className="flex flex-wrap gap-3 mb-3">
                      {item.duration && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Clock className="h-3 w-3" />
                          <span className="text-xs">{item.duration} min</span>
                        </div>
                      )}

                      {item.distance_range && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <MapPin className="h-3 w-3" />
                          <span className="text-xs">
                            {item.distance_range.min === item.distance_range.max
                              ? `${item.distance_range.min} km`
                              : `${item.distance_range.min}-${item.distance_range.max} km`
                            }
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-gray-600">
                        {getMetricIcon(item.intensity_metric)}
                        <span className="text-xs">
                          {formatIntensityValue(item.target_range.min, item.intensity_metric)} - {formatIntensityValue(item.target_range.max, item.intensity_metric)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-1">
                        {item.tags?.map((tag, tagIndex) => (
                          <Badge key={tagIndex} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      {item.pre && (
                        <Badge
                          variant="outline"
                          className={`${getIntensityColor(item.pre)} border text-xs px-2 py-1`}
                        >
                          <Gauge className="h-3 w-3 mr-1" />
                          {getIntensityLabel(item.pre)} ({item.pre}/10)
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )
        i++
      } else if (item.type === "loop_start") {
        let depth = 1
        let j = i + 1
        while (j < items.length && depth > 0) {
          if (items[j].type === "loop_start") depth++
          if (items[j].type === "loop_end" && items[j].id === item.id) depth--
          j++
        }

        const loopItems = items.slice(i + 1, j - 1)
        const isExpanded = expandedLoops.has(item.id)

        result.push(
          <div key={`loop-${item.id}`} className={`${level > 0 ? 'ml-6' : ''}`}>
            <Card className="border-2 border-dashed border-blue-300 bg-blue-50/30">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Repeat className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-sm text-blue-900">
                        Repeat Block
                      </CardTitle>
                      <p className="text-xs text-blue-700 mt-1">
                        Repeat {item.repeat} times • {loopItems.filter(item => item.type === 'segment').length} segments
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleLoop(item.id)
                    }}
                    className="text-blue-600 hover:text-blue-800 h-8"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="h-3 w-3 mr-1" />
                        <span className="text-xs">Collapse</span>
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3 w-3 mr-1" />
                        <span className="text-xs">Expand</span>
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="pt-0">
                  <Separator className="mb-3 bg-blue-200" />
                  <div className="space-y-2">
                    {renderWorkoutStructure(loopItems, level + 1)}
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        )

        i = j
      } else {
        i++
      }
    }

    return result
  }

  const IntensityIcon = getIntensityIcon(
    workout.detail.find(d => d.type === 'segment')?.pre
  )

  return (
    <Card
      className="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer"
      onClick={() => {
        setShowStructure(!showStructure)
        onSelect?.(workout.id)
      }}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <IntensityIcon className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <h4 className="font-semibold text-gray-900">{workout.title}</h4>
                <Badge
                  variant="outline"
                  className={getIntensityColor(
                    workout.detail.find(d => d.type === 'segment')?.pre
                  )}
                >
                  {getIntensityLabel(
                    workout.detail.find(d => d.type === 'segment')?.pre
                  )}
                </Badge>
              </div>
              <p className="text-xs text-gray-600">
                {new Date(workout.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
          {isAdded && (
            <div className="flex items-center space-x-1 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="text-xs font-medium">Added</span>
            </div>
          )}
        </div>

        {/* Description */}
        <p className="text-sm text-gray-700 mb-4 bg-white/60 rounded-md p-3 leading-relaxed">
          {workout.description}
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {workout.total_time && (
            <div className="bg-white/70 rounded-lg p-2 text-center">
              <Clock className="h-3 w-3 text-emerald-600 mx-auto mb-1" />
              <div className="text-xs font-medium text-gray-900">{formatDuration(workout.total_time)}</div>
              <div className="text-xs text-gray-600">Duration</div>
            </div>
          )}
          {workout.total_distance && (
            <div className="bg-white/70 rounded-lg p-2 text-center">
              <MapPin className="h-3 w-3 text-emerald-600 mx-auto mb-1" />
              <div className="text-xs font-medium text-gray-900">{formatDistance(workout.total_distance)}</div>
              <div className="text-xs text-gray-600">Distance</div>
            </div>
          )}
          {workout.estimated_tss && (
            <div className="bg-white/70 rounded-lg p-2 text-center">
              <Target className="h-3 w-3 text-emerald-600 mx-auto mb-1" />
              <div className="text-xs font-medium text-gray-900">{workout.estimated_tss}</div>
              <div className="text-xs text-gray-600">TSS</div>
            </div>
          )}
        </div>

        {/* Workout Structure */}
        {showStructure && workout.detail && (
          <div className="mt-4 pt-3 border-t border-emerald-200">
            <div className="flex items-center justify-between mb-3">
              <h5 className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                <Activity className="h-4 w-4 text-emerald-600" />
                <span>Workout Structure</span>
              </h5>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowStructure(false)
                }}
                className="text-emerald-600 hover:text-emerald-800 h-8"
              >
                <ChevronUp className="h-3 w-3 mr-1" />
                <span className="text-xs">Collapse</span>
              </Button>
            </div>
            <div className="space-y-2">
              {renderWorkoutStructure(workout.detail)}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
