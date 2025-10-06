import { ToolCallPart } from './ToolCallPart'
import { PhaseChunkCard } from './PhaseChunkCard'
import { WeekCard } from './WeekCard'
import { TrainingPhase } from '@/src/components/plan/types'
import { Response } from '../ai-elements/response'

export interface MessagePart {
  type: 'text' | 'dynamic-tool'
  toolName?: string
  toolCallId?: string
  state?: 'streaming' | 'output-available' | 'input-available' | 'complete'
  text?: string
  input?: any
  output?: any
  result?: any
  onAddPhaseToPanel?: (phase: TrainingPhase) => void
  onAggregateWorkouts?: (workouts: any, phaseId?: string) => void
}

export interface Message {
  id: string
  role: 'assistant' | 'user'
  parts: MessagePart[]
}

interface LegacyMessage {
  id: string
  type: 'user' | 'bot' | 'ai-coach'
  content?: string
  timestamp: Date
  parts?: MessagePart[]
}

interface MessageDisplayProps {
  message: Message | LegacyMessage
  className?: string
  onAddPhaseToPanel?: (phase: TrainingPhase) => void
  onAggregateWorkouts?: (workouts: any, phaseId?: string) => void
}

export function MessageDisplay({ message, className = '', onAddPhaseToPanel, onAggregateWorkouts }: MessageDisplayProps) {
  // Handle legacy message format
  if ('type' in message && 'content' in message) {
    const legacyMessage = message as LegacyMessage

    // If it's a simple text message
    if (legacyMessage.content && !legacyMessage.parts) {
      return (
        <div className={`flex ${legacyMessage.type === 'user' ? 'justify-end' : 'justify-start'} ${className}`}>
          <div className={`max-w-3xl p-4 rounded-lg ${
            legacyMessage.type === 'user'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-900'
          }`}>
            <div className="whitespace-pre-wrap">{legacyMessage.content}</div>
          </div>
        </div>
      )
    }

    // If it has parts, render them
    if (legacyMessage.parts) {
      return (
        <div className={`space-y-4 ${className}`}>
          {legacyMessage.parts.map((part, index) => {
            const key = part.toolCallId || `${legacyMessage.id}-${index}`
            return renderMessagePart(part, key, onAddPhaseToPanel, onAggregateWorkouts)
          })}
        </div>
      )
    }

    return null
  }

  // Handle new message format
  const newMessage = message as Message
  return (
    <div className={`space-y-4 ${className}`}>
      {newMessage.parts.map((part, index) => {
        const key = part.toolCallId || `${newMessage.id}-${index}`
        return renderMessagePart(part, key, onAddPhaseToPanel, onAggregateWorkouts)
      })}
    </div>
  )
}

function renderMessagePart(
  part: MessagePart,
  key: string,
  onAddPhaseToPanel?: (phase: TrainingPhase) => void,
  onAggregateWorkouts?: (workouts: any, phaseId?: string) => void
) {
  switch (part.type) {
    case 'text':
      return (
        <Response key={key}>
          {part.text || ''}
        </Response>
      )

    case 'dynamic-tool':
      // Handle training phase workflow
      if (part.toolName?.includes('runningPhaseWorkflow')) {
        return (
          <PhaseChunkCard
            key={key}
            toolName={part.toolName}
            input={part.input}
            output={part.output}
            result={part.result}
            state={part.state}
            onAddPhaseToPanel={onAddPhaseToPanel}
          />
        )
      }

      // Handle generateDetailedWorkouts - these contain weekly workout data
      if (part.toolName?.includes('generateDetailedWorkouts') ||
          part.toolName?.includes('DetailedWorkouts') ||
          part.toolName?.includes('generateDetailedWork-outs')) {
        return (
          <WeekCard
            key={key}
            toolName={part.toolName}
            input={part.input}
            output={part.output}
            state={part.state}
            onAggregateWorkouts={onAggregateWorkouts}
          />
        )
      }

      // Handle workout aggregation
      if (part.toolName?.includes('aggregate')) {
        return (
          <WeekCard
            key={key}
            toolName={part.toolName}
            input={part.input}
            output={part.output}
            state={part.state}
            onAggregateWorkouts={onAggregateWorkouts}
          />
        )
      }

      return (
        <ToolCallPart
          key={key}
          toolName={part.toolName || ''}
          input={part.input}
          output={part.output}
          state={part.state}
        />
      )

    default:
      return null
  }
}
