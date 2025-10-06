import { useState } from 'react'
import { Send, Activity, Bot } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { SelectionTags } from './SelectionTags'
import { useRunningCoachContext } from '../contexts/RunningCoachContext'
import { useAuth } from '../contexts/AuthContext'
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton
} from './ai-elements/conversation'
import { Message, MessageContent } from './ai-elements/message'
import { Response } from './ai-elements/response'
import {
  Tool,
  ToolHeader,
  ToolContent,
  ToolInput,
  ToolOutput,
} from './ai-elements/tool'
import { usePanelContext } from '../contexts/PanelContext'
import { WorkflowResumePanel } from './WorkflowResumePanel'
import { MessageDisplay, type MessagePart } from './chat/MessageDisplay'
import { TrainingPhase } from './plan/types'

interface EnhancedChatPanelProps {
  onPlanGenerated?: (plan: any) => void
  selectedItems?: string[]
  selectionDetails?: { [id: string]: { type: 'phase' | 'week' | 'workout', title: string } }
  onRemoveSelection?: (id: string) => void
  onClearSelection?: () => void
  onRequestComparison?: (request: string) => void
  onOpenAnalysis?: () => void
  isAnalysisPanelVisible?: boolean
  hasExistingPlans?: boolean
}

export function EnhancedChatPanel({
  selectedItems = [],
  selectionDetails = {},
  onRemoveSelection,
  onClearSelection
}: EnhancedChatPanelProps) {
  const [inputValue, setInputValue] = useState('')
  const { user, logout } = useAuth()

  const {
    messages,
    isLoading,
    error,
    sendMessage,
    askAboutTraining,
    getPerformanceAnalysis,
    getWorkoutRecommendations,
    clearMessages,
    isInitialized
  } = useRunningCoachContext()

  const {
    isPlanPanelOpen,
    isAnalysisPanelOpen,
    setPlanPanelOpen,
    setAnalysisPanelOpen
  } = usePanelContext()

  const status = isLoading ? 'loading' : 'ready'

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || status !== 'ready') return

    sendMessage(inputValue)
    setInputValue('')
  }

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'performance':
        getPerformanceAnalysis()
        break
      case 'workout':
        getWorkoutRecommendations()
        break
      case 'training':
        askAboutTraining('What should I focus on in my training this week?')
        break
    }
  }

  // Handle phase integration from workflows
  const handleAddPhase = (phase: TrainingPhase) => {
    console.log('Adding phase to training plan:', phase)
    // TODO: Integrate with training plan panel
    // For now, just log the phase
  }

  // Handle workout aggregation from workflows
  const handleAggregateWorkouts = (workouts: any, phaseId?: string) => {
    console.log('Aggregating workouts:', workouts, 'for phase:', phaseId)
    // TODO: Integrate with training plan panel
    // For now, just log the workouts
  }

  // Convert UIMessage parts to MessagePart format for MessageDisplay
  const convertToMessageParts = (parts: any[]): MessagePart[] => {
    return parts.map(part => {
      if (part.type === 'text') {
        return {
          type: 'text',
          text: part.text,
          state: part.state
        }
      }

      if (part.type === 'dynamic-tool') {
        return {
          type: 'dynamic-tool',
          toolName: part.toolName,
          toolCallId: part.toolCallId,
          input: part.input,
          output: part.output,
          result: part.result,
          state: part.state,
          onAddPhaseToPanel: handleAddPhase,
          onAggregateWorkouts: handleAggregateWorkouts
        }
      }

      return part
    })
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-100 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-medium text-gray-900">Running Coach</h1>
              <p className="text-sm text-gray-600">
                Welcome, {user?.username} • {isInitialized ? 'Connected' : 'Initializing...'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500">
              Need to {!isPlanPanelOpen && !isAnalysisPanelOpen ? 'access your ' : ''}
              {!isPlanPanelOpen && (
                <>
                  <button
                    onClick={() => {
                      setPlanPanelOpen(true)
                      setAnalysisPanelOpen(false)
                    }}
                    className="text-green-600 hover:text-green-700 hover:underline"
                  >
                    training plans
                  </button>
                  {!isAnalysisPanelOpen && ' or '}
                </>
              )}
              {!isAnalysisPanelOpen && (
                <button
                  onClick={() => {
                    setAnalysisPanelOpen(true)
                    setPlanPanelOpen(false)}}
                  className="text-blue-600 hover:text-blue-700 hover:underline"
                >
                  workout analysis
                </button>
              )}
              ?
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <Conversation className="flex-1">
        <ConversationContent className="space-y-4">
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6">
              <div className="text-center mb-8">
                <div className="flex items-center justify-center w-16 h-16 bg-green-500 rounded-2xl mb-4 mx-auto">
                  <Activity className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">Welcome back!</h3>
                <p className="text-gray-600 max-w-md">
                  I'm your AI running coach. I can create personalized workout plans, analyze your performance, and help optimize your training.
                </p>
              </div>

              {selectedItems.length > 0 && onRemoveSelection && onClearSelection && (
                <div className="w-full max-w-lg mb-4">
                  <SelectionTags
                    selectedItems={selectedItems}
                    selectionDetails={selectionDetails}
                    onRemoveItem={onRemoveSelection}
                    onClearAll={onClearSelection}
                  />
                </div>
              )}

              <div className="w-full max-w-lg">
                <div className="flex gap-2 mb-4">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        if (!inputValue.trim() || status !== 'ready') return
                        sendMessage(inputValue)
                        setInputValue('')
                      }
                    }}
                    placeholder="How can I help you today?"
                    className="flex-1 text-center"
                  />
                  <Button
                    onClick={(e) => {
                      e.preventDefault()
                      if (!inputValue.trim() || status !== 'ready') return
                      sendMessage(inputValue)
                      setInputValue('')
                    }}
                    disabled={!inputValue.trim()}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => handleQuickAction('performance')}
                    className="block w-full p-3 text-left text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                  >
                    Analyze my recent performance
                  </button>
                  <button
                    onClick={() => handleQuickAction('workout')}
                    className="block w-full p-3 text-left text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                  >
                    What workout should I do today?
                  </button>
                  <button
                    onClick={() => handleQuickAction('training')}
                    className="block w-full p-3 text-left text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                  >
                    What should I focus on in my training this week?
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => {
                // Check if this is a workflow message that should use MessageDisplay
                const hasWorkflowParts = message.parts?.some(part =>
                  part.type === 'dynamic-tool' && (
                    part.toolName?.includes('runningPhaseWorkflow') ||
                    part.toolName?.includes('generateDetailedWorkouts') ||
                    part.toolName?.includes('aggregate')
                  )
                )

                if (hasWorkflowParts) {
                  // Use MessageDisplay for workflow results
                  return (
                    <Message key={message.id} from={message.role}>
                    <MessageContent variant={message.role === 'assistant' ? 'flat' : 'contained'}>
                      <MessageDisplay
                        key={message.id}
                        message={{
                          id: message.id,
                          role: message.role,
                          parts: convertToMessageParts(message.parts || [])
                        }}
                        onAddPhaseToPanel={handleAddPhase}
                        onAggregateWorkouts={handleAggregateWorkouts}
                      />
                    </MessageContent>
                  </Message>
                )
              }

                // Use standard rendering for other messages
                return (
                  <Message key={message.id} from={message.role}>
                    <MessageContent variant={message.role === 'assistant' ? 'flat' : 'contained'}>
                      {message.parts?.map((part, partIndex) => {
                      // Handle text content
                      if (part.type === 'text') {
                        return message.role === 'assistant' ? (
                          <Response key={partIndex}>{part.text}</Response>
                        ) : (
                          <div key={partIndex} className="whitespace-pre-wrap">{part.text}</div>
                        )
                      }

                      // Handle reasoning content (for models that support it)
                      if (part.type === 'reasoning') {
                        return (
                          <div key={partIndex} className="text-sm text-gray-600 italic border-l-2 border-gray-300 pl-3 my-2">
                            {part.text}
                          </div>
                        )
                      }

                      // Handle dynamic-tool parts (from @mastra/react toNetworkUIMessage)
                      if (part.type === 'dynamic-tool') {
                        // Extract network metadata from input/output
                        const input = 'input' in part ? part.input as any : undefined;
                        const output = 'output' in part ? part.output as any : undefined;
                        const toolName = 'toolName' in part ? part.toolName : 'unknown';

                        // Network metadata is stored in output
                        const networkMetadata = output?.networkMetadata;
                        const from = networkMetadata?.from; // 'AGENT' | 'WORKFLOW'
                        const messages = input?.messages; // Agent sub-messages
                        const state = 'state' in part ? part.state : 'input-available';

                        // Check if workflow is suspended - check output metadata
                        const isSuspended = output?.status === 'suspended' || output?.workflowState?.status === 'suspended';

                        return (
                          <Tool key={partIndex} defaultOpen={false}>
                            <ToolHeader
                              type={toolName}
                              state={state}
                            />
                            <ToolContent>
                              {/* Show network selection reason if present */}
                              {networkMetadata?.selectionReason && (
                                <div className="text-xs text-gray-600 italic mb-2 p-2 bg-blue-50 rounded">
                                  <strong>Selection reason:</strong> {networkMetadata.selectionReason}
                                </div>
                              )}

                              {/* Show agent/workflow badge if from network */}
                              {from && (
                                <div className="text-xs font-semibold text-gray-700 mb-2">
                                  {from === 'AGENT' ? '🤖 Agent' : '⚙️ Workflow'}: {toolName}
                                  {isSuspended && from === 'WORKFLOW' && (
                                    <span className="ml-2 px-2 py-0.5 bg-orange-100 text-orange-800 rounded-full text-xs">
                                      Suspended
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* Show sub-messages for agent network calls */}
                              {messages && messages.length > 0 && (
                                <div className="space-y-2 mb-2 p-2 border-l-2 border-green-300 bg-green-50">
                                  {messages.map((msg: any, msgIdx: number) => (
                                    <div key={msgIdx} className="text-sm">
                                      {msg.type === 'text' && (
                                        <div className="text-gray-700">{msg.content}</div>
                                      )}
                                      {msg.type === 'tool' && (
                                        <div className="text-gray-600">
                                          <span className="font-mono text-xs">🔧 {msg.toolName}</span>
                                          {msg.toolOutput && (
                                            <div className="ml-4 mt-1 text-xs text-gray-500">
                                              {typeof msg.toolOutput === 'object'
                                                ? JSON.stringify(msg.toolOutput, null, 2).substring(0, 100) + '...'
                                                : String(msg.toolOutput).substring(0, 100)}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Standard tool input/output */}
                              {input && !messages && <ToolInput input={input} />}
                              {input && messages && (
                                <ToolInput input={Object.fromEntries(
                                  Object.entries(input).filter(([key]) => key !== 'messages' && key !== '__mastraMetadata')
                                )} />
                              )}
                              {output !== undefined && (
                                <ToolOutput output={output.result !== undefined ? output.result : output} />
                              )}

                              {/* Workflow resume UI if suspended */}
                              {isSuspended && from === 'WORKFLOW' && output?.workflowId && output?.runId && (
                                <WorkflowResumePanel
                                  workflowId={output.workflowId}
                                  runId={output.runId}
                                  suspendedSteps={output.suspendedSteps || output.suspendedStep || 'unknown'}
                                  onResume={async (resumeData) => {
                                    // TODO: Implement workflow resume through Mastra client API
                                    console.log('Resume workflow:', {
                                      workflowId: output.workflowId,
                                      runId: output.runId,
                                      step: output.suspendedSteps || output.suspendedStep,
                                      resumeData
                                    });
                                  }}
                                />
                              )}
                            </ToolContent>
                          </Tool>
                        );
                      }

                      // Handle legacy tool-* format for backward compatibility
                      if (part.type.startsWith('tool-')) {
                        const toolName = part.type.replace('tool-', '');
                        const state = 'state' in part ? part.state : 'input-available';
                        return (
                          <Tool key={partIndex} defaultOpen={false}>
                            <ToolHeader type={toolName} state={state} />
                            <ToolContent>
                              {'input' in part && <ToolInput input={part.input} />}
                              {'output' in part && part.output !== undefined && (
                                <ToolOutput
                                  output={part.output}
                                  errorText={'errorText' in part ? part.errorText : undefined}
                                />
                              )}
                            </ToolContent>
                          </Tool>
                        );
                      }

                      return null
                    })}
                    <div className="text-xs opacity-60 mt-1">
                      {new Date().toLocaleTimeString()}
                    </div>
                  </MessageContent>
                </Message>
                )
              })}

              {isLoading && (
                <Message from="assistant">
                  <MessageContent variant="flat">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse delay-100" />
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse delay-200" />
                      </div>
                      <span className="text-sm text-gray-600">
                        Processing...
                      </span>
                    </div>
                  </MessageContent>
                </Message>
              )}
            </>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      {error && (
        <div className="p-4 bg-red-50 border-t border-red-200">
          <p className="text-sm text-red-600 mb-2">
            Error: {error?.message || 'An unknown error occurred'}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={clearMessages}
            >
              Clear Conversation
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={logout}
            >
              Sign Out & Retry
            </Button>
          </div>
        </div>
      )}

      {messages.length > 0 && (
        <div className="flex-shrink-0 p-4 border-t border-gray-100 bg-white">
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask me about your training..."
              disabled={status !== 'ready'}
              className="flex-1"
            />
            <Button
              type="submit"
              disabled={status !== 'ready' || !inputValue.trim()}
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      )}
    </div>
  )
}
