import { useState } from 'react'
import { ChevronDown, ChevronRight, Zap, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { Badge } from '@/src/components/ui/badge'

interface ToolCallPartProps {
  toolName: string
  input?: any
  output?: any
  state?: 'streaming' | 'output-available' | 'input-available'
}

export function ToolCallPart({ toolName, input, output, state }: ToolCallPartProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const getStateIcon = () => {
    switch (state) {
      case 'output-available':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'input-available':
        return <Clock className="h-4 w-4 text-blue-600" />
      case 'streaming':
        return <Clock className="h-4 w-4 text-orange-600 animate-pulse" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStateBadge = () => {
    switch (state) {
      case 'output-available':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Complete</Badge>
      case 'input-available':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Pending</Badge>
      case 'streaming':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800">Processing</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getToolDisplayName = (toolName: string) => {
    if (toolName.includes('runningPhase')) return 'Training Phase Planning'
    if (toolName.includes('generateDetailedWorkouts')) return 'Detailed Workout Generation'
    return toolName.replace(/([A-Z])/g, ' $1').trim()
  }

  const getStreamingMessage = (toolName: string) => {
    if (toolName.includes('runningPhase')) return 'Analyzing your goals and creating periodized training plan...'
    if (toolName.includes('generateDetailedWorkouts')) return 'Generating detailed workout content and intensity targets...'
    return 'Processing...'
  }

  const formatWorkflowSteps = (output: any) => {
    if (output?.payload?.workflowState?.steps) {
      const steps = output.payload.workflowState.steps
      return Object.entries(steps).map(([stepKey, stepData]: [string, any]) => (
        <div key={stepKey} className="border border-gray-200 rounded-lg p-4 mb-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-900">{stepData.stepName || stepKey}</h4>
            <Badge variant={stepData.status === 'success' ? 'secondary' : 'outline'}>
              {stepData.status === 'success' ? 'Complete' : stepData.status}
            </Badge>
          </div>
          {stepData.output && (
            <div className="text-sm text-gray-600">
              <pre className="whitespace-pre-wrap bg-gray-50 p-3 rounded text-xs overflow-auto max-h-32">
                {JSON.stringify(stepData.output, null, 2)}
              </pre>
            </div>
          )}
        </div>
      ))
    }
    return null
  }

  return (
    <div className="border border-gray-200 rounded-lg bg-white shadow-sm">
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3">
          <Zap className="h-5 w-5 text-green-600" />
          <div>
            <h3 className="font-medium text-gray-900">{getToolDisplayName(toolName)}</h3>
            <div className="flex items-center space-x-2 mt-1">
              {getStateIcon()}
              <span className="text-sm text-gray-600">Tool Call</span>
              {getStateBadge()}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-500" />
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-gray-200 p-4 space-y-4">
          {input && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Input Parameters</h4>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <pre className="text-sm text-blue-800 whitespace-pre-wrap overflow-auto max-h-40">
                  {JSON.stringify(input, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {output && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Execution Result</h4>
              <div className="space-y-3">
                {formatWorkflowSteps(output) || (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <pre className="text-sm text-green-800 whitespace-pre-wrap overflow-auto max-h-60">
                      {JSON.stringify(output, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}

          {!input && !output && (
            <div className="text-center py-8 text-gray-500">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Waiting for tool execution results...</p>
            </div>
          )}

          {state === 'streaming' && !output && (
            <div className="text-center py-8 text-blue-600">
              <Clock className="h-8 w-8 mx-auto mb-2 animate-pulse" />
              <p className="text-sm">{getStreamingMessage(toolName)}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
