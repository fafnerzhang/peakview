'use client';

import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import { useChat, toUIMessage, MastraReactProvider } from '@mastra/react';
import { RuntimeContext } from '@mastra/core/runtime-context';
import type { ChunkType } from '@mastra/core/stream';
import type { UIMessage } from '@ai-sdk/react';
import { fetchUserIndicators } from '@/src/lib/userIndicators';

// MastraUIMessage type from @mastra/react
type MastraUIMessage = UIMessage<any, any, any>;


interface RunningCoachState {
  // Core useChat methods
  stream: ReturnType<typeof useChat<MastraUIMessage>>['stream'];
  isRunning: boolean;
  messages: MastraUIMessage[];
  setMessages: React.Dispatch<React.SetStateAction<MastraUIMessage[]>>;
  cancelRun: () => void;
  // Custom helper methods
  sendMessage: (message: string) => Promise<void>;
  askAboutTraining: (question: string) => Promise<void>;
  getPerformanceAnalysis: (timeframe?: string) => Promise<void>;
  getWorkoutRecommendations: () => Promise<void>;
  clearMessages: () => void;
  isInitialized: boolean;
  error: Error | null;
  // Computed properties
  isLoading: boolean;
}

interface RunningCoachProviderProps {
  children: ReactNode;
  agentId: string;
  accessToken?: string | null;
  onError?: (error: Error) => void;
}

const RunningCoachContext = createContext<RunningCoachState | null>(null);

if (process.env.NODE_ENV !== 'production') {
  RunningCoachContext.displayName = 'RunningCoachContext';
}

export function RunningCoachProvider({
  children,
  accessToken,
  agentId,
  onError
}: RunningCoachProviderProps) {
    const [error, setError] = React.useState<Error | null>(null);
    const runtimeContext = new RuntimeContext()
    runtimeContext.set('accessToken', accessToken);
    runtimeContext.set('coachId', 'jack-daniels'); // Example coachId, could be dynamic

    const chatConfig = useChat<MastraUIMessage>({
      agentId: agentId,
    });

    // Fetch user indicators when access token is available
    useEffect(() => {
      const loadUserIndicators = async () => {
        if (accessToken) {
          try {
            const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const indicators = await fetchUserIndicators(accessToken, apiBaseUrl);

            // Add indicators to runtime context for Mastra agents
            if (indicators) {
              runtimeContext.set('userIndicators', indicators);
              console.log('✅ User indicators loaded and added to runtime context');
            } else {
              console.log('ℹ️ User has not set up indicators yet');
            }
          } catch (err) {
            console.error('Failed to fetch user indicators:', err);
            // Don't set error state - indicators are optional
          }
        }
      };

      loadUserIndicators();
    }, [accessToken]);

    useEffect(()=>{
      console.log('Messages updated:', chatConfig.messages[chatConfig.messages.length - 1]);
    }, [chatConfig.messages])

    // Single streamMessage helper - use stream() with built-in toUIMessage
    const streamMessage = React.useCallback(async (message: string) => {
      setError(null);
      chatConfig.setMessages((prev) => [
        ...prev,
        {
          role: 'user',
          parts: [{ type: 'text', text: message }],
          id: `user-${Date.now()}`,
        },
      ]);
      try {
        // Stream the agent response - useChat manages conversation history automatically
        await chatConfig.stream({
          coreUserMessages: [
            { role: 'user', content: message }
          ], 
          runtimeContext: runtimeContext,
          threadId: 'running-coach-thread',
          onChunk: (chunk: ChunkType, conversation: MastraUIMessage[]) => {
            return toUIMessage({ chunk, conversation });
          }
        });
      } catch (err) {
        console.error('Stream error:', err);
        throw err;
      }
    }, [chatConfig, runtimeContext]);

    const sendMessage = React.useCallback(async (message: string) => {
      try {
        streamMessage(message);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        onError?.(error);
      }
    }, [streamMessage, onError]);

  const askAboutTraining = React.useCallback(async (question: string) => {
    try {
      streamMessage(question);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      onError?.(error);
    }
  }, [streamMessage, onError]);

  const getPerformanceAnalysis = React.useCallback(async (timeframe?: string) => {
    try {
      const content = timeframe
        ? `Can you analyze my performance for ${timeframe}?`
        : 'Can you analyze my recent performance?';

      streamMessage(content);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      onError?.(error);
    }
  }, [streamMessage, onError]);

  const getWorkoutRecommendations = React.useCallback(async () => {
    try {
      const content = 'Based on my recent training data, what workout would you recommend for today?';
      streamMessage(content);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      onError?.(error);
    }
  }, [streamMessage, onError]);

  const clearMessages = React.useCallback(() => {
    chatConfig.setMessages([]);
    setError(null);
  }, [chatConfig]);

  const contextValue: RunningCoachState = {
    ...chatConfig,

    sendMessage,
    askAboutTraining,
    getPerformanceAnalysis,
    getWorkoutRecommendations,
    clearMessages,
    isInitialized: !!accessToken,
    error,

    // Computed properties
    isLoading: chatConfig.isRunning,
  };
  return (
        <RunningCoachContext.Provider value={contextValue}>
          {children}
        </RunningCoachContext.Provider>
  );
}

export function useRunningCoachContext() {
  const context = useContext(RunningCoachContext);

  if (!context) {
    throw new Error('useRunningCoachContext must be used within a RunningCoachProvider');
  }

  return context;
}

export type { RunningCoachState };
