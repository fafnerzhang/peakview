import { useState, useEffect } from 'react'
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

interface EnhancedChatPanelProps {
  onPlanGenerated?: (plan: any) => void
  selectedItems?: string[]
  selectionDetails?: { [id: string]: { type: 'phase' | 'week' | 'workout', title: string } }
  onRemoveSelection?: (id: string) => void
  onClearSelection?: () => void
  onOpenPlanPanel?: () => void
  isPlanPanelVisible?: boolean
  onRequestComparison?: (request: string) => void
  onOpenAnalysis?: () => void
  isAnalysisPanelVisible?: boolean
  hasExistingPlans?: boolean
}

export function EnhancedChatPanel({
  selectedItems = [],
  selectionDetails = {},
  onRemoveSelection,
  onClearSelection,
  onOpenPlanPanel,
  isPlanPanelVisible = false,
  onOpenAnalysis,
  isAnalysisPanelVisible = false,
  hasExistingPlans = false
}: EnhancedChatPanelProps) {
  const [inputValue, setInputValue] = useState('')
  const { user, logout } = useAuth()

  // Use the running coach context (state is managed at App level)
  const {
    messages,
    isLoading,
    error,
    askAboutTraining,
    getPerformanceAnalysis,
    getWorkoutRecommendations,
    isInitialized,
    sendMessage: contextSendMessage
  } = useRunningCoachContext()

  // Map new API to old API for compatibility
  const status = isLoading ? 'loading' : 'ready'
  const sendMessage = contextSendMessage || (({ text }: { text: string }) => {
    console.warn('sendMessage not available in context');
  })

  // Handle manual message sending
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || status !== 'ready') return

    sendMessage({ text: inputValue })
    setInputValue('')
  }

  // Remove input sync since we're managing input locally

  // Quick action handlers
  const handleQuickAction = (action: string) => {
    console.log('handleQuickAction called with:', action)
    console.log('Available functions:', { getPerformanceAnalysis, getWorkoutRecommendations, askAboutTraining })

    switch (action) {
      case 'performance':
        if (getPerformanceAnalysis) {
          console.log('Calling getPerformanceAnalysis')
          getPerformanceAnalysis()
        } else {
          console.log('getPerformanceAnalysis not available')
        }
        break
      case 'workout':
        if (getWorkoutRecommendations) {
          console.log('Calling getWorkoutRecommendations')
          getWorkoutRecommendations()
        } else {
          console.log('getWorkoutRecommendations not available')
        }
        break
      case 'training':
        if (askAboutTraining) {
          console.log('Calling askAboutTraining')
          askAboutTraining('What should I focus on in my training this week?')
        } else {
          console.log('askAboutTraining not available')
        }
        break
      default:
        console.log('Unknown action:', action)
    }
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

          {/* Panel toggle buttons */}
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500">
              Need to {!isPlanPanelVisible && !isAnalysisPanelVisible ? 'access your ' : ''}
              {!isPlanPanelVisible && onOpenPlanPanel && (
                <>
                  <button
                    onClick={onOpenPlanPanel}
                    className="text-green-600 hover:text-green-700 hover:underline"
                  >
                    training plans
                  </button>
                  {!isAnalysisPanelVisible && onOpenAnalysis && ' or '}
                </>
              )}
              {!isAnalysisPanelVisible && onOpenAnalysis && (
                <button
                  onClick={onOpenAnalysis}
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

              {/* Selection Tags - positioned above centered input */}
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

              {/* Centered Input */}
              <div className="w-full max-w-lg">
                <div className="flex gap-2 mb-4">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        console.log('Enter key pressed', { inputValue, status })
                        e.preventDefault()
                        if (!inputValue.trim() || status !== 'ready') {
                          console.log('Input validation failed')
                          return
                        }
                        console.log('Calling sendMessage from enter')
                        sendMessage({ text: inputValue })
                        setInputValue('')
                      }
                    }}
                    placeholder="How can I help you today?"
                    className="flex-1 text-center"
                  />
                  <Button
                    onClick={(e) => {
                      console.log('Button clicked', { inputValue, status })
                      e.preventDefault()
                      if (!inputValue.trim() || status !== 'ready') {
                        console.log('Button validation failed')
                        return
                      }
                      console.log('Calling sendMessage from button')
                      sendMessage({ text: inputValue })
                      setInputValue('')
                    }}
                    disabled={!inputValue.trim()}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>

                {/* Quick Questions */}
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
              {messages.map((message) => (
                <Message key={message.id} from={message.role}>
                  <MessageContent variant={message.role === 'assistant' ? 'flat' : 'contained'}>
                    {(() => {
                      // Handle different message formats
                      if (message.parts && Array.isArray(message.parts)) {
                        // AI SDK UIMessage format with parts
                        return message.parts.map((part, partIndex) => {
                          if (part.type === 'text') {
                            return message.role === 'assistant' ? (
                              <Response key={partIndex}>{part.text}</Response>
                            ) : (
                              <div key={partIndex} className="whitespace-pre-wrap">{part.text}</div>
                            )
                          }
                          return null
                        });
                      } else if ((message as any).content) {
                        // Simple message format with content property
                        const content = (message as any).content;
                        return message.role === 'assistant' ? (
                          <Response>{content}</Response>
                        ) : (
                          <div className="whitespace-pre-wrap">{content}</div>
                        );
                      } else if (typeof message === 'string') {
                        // Simple string message
                        return message.role === 'assistant' ? (
                          <Response>{message}</Response>
                        ) : (
                          <div className="whitespace-pre-wrap">{message}</div>
                        );
                      } else {
                        // Fallback: display the message as JSON for debugging
                        console.warn('Unknown message format:', message);
                        return <div className="text-red-500 text-sm">Message format error: {JSON.stringify(message)}</div>;
                      }
                    })()}
                    <div className="text-xs opacity-60 mt-1">
                      {new Date().toLocaleTimeString()}
                    </div>
                  </MessageContent>
                </Message>
              ))}

              {status === 'streaming' && (
                <Message from="assistant">
                  <MessageContent variant="flat">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse delay-100" />
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse delay-200" />
                      </div>
                      <span className="text-sm text-gray-600">
                        {status === 'streaming' ? 'Streaming...' :
                         status === 'in_progress' ? 'Processing...' :
                         'Analyzing your data...'}
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

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border-t border-red-200">
          <p className="text-sm text-red-600">
            Error: {error?.message || 'An unknown error occurred'}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={logout}
          >
            Sign Out & Retry
          </Button>
        </div>
      )}

      {/* Input - only show when there are messages */}
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