'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';

interface RunningCoachState {
  // Essential chat state from useChat
  id: string;
  messages: any[];
  status: 'submitted' | 'streaming' | 'ready' | 'error';
  error: any;
  sendMessage: (message: any, options?: any) => void;
  regenerate: (options?: { messageId?: string }) => void;
  stop: () => void;
  clearError: () => void;
  resumeStream: () => void;
  addToolResult: (options: any) => void;
  setMessages: (messages: any[] | ((messages: any[]) => any[])) => void;

  // Custom helper methods
  askAboutTraining: (question: string) => void;
  getPerformanceAnalysis: (timeframe?: string) => void;
  getWorkoutRecommendations: () => void;
  isInitialized: boolean;

  // Computed properties
  isLoading: boolean;
}

interface RunningCoachProviderProps {
  children: ReactNode;
  accessToken?: string;
  onError?: (error: Error) => void;
}

const RunningCoachContext = createContext<RunningCoachState | null>(null);

export function RunningCoachProvider({
  children,
  accessToken,
  onError
}: RunningCoachProviderProps) {
  const chatConfig = useChat({
    transport: new DefaultChatTransport({
      api: '/api/workout',
      headers: accessToken ? {
        Authorization: `Bearer ${accessToken}`,
      } : {},
    }),
    onError: (error: Error) => {
      console.error('useChat error:', error);
      onError?.(error);
    },
  });

  // Helper methods using the correct useChat API
  const askAboutTraining = React.useCallback((question: string) => {
    chatConfig.sendMessage({'text': `Training question: ${question}`});
  }, [chatConfig]);

  const getPerformanceAnalysis = React.useCallback((timeframe?: string) => {
    const content = timeframe
      ? `Can you analyze my performance for ${timeframe}?`
      : 'Can you analyze my recent performance?';

    chatConfig.sendMessage({'text':content});
  }, [chatConfig]);

  const getWorkoutRecommendations = React.useCallback(() => {
    chatConfig.sendMessage({'text':'Based on my recent training data, what workout would you recommend for today?'});
  }, [chatConfig]);

  const contextValue: RunningCoachState = {
    // Essential properties from useChat
    id: chatConfig.id,
    messages: chatConfig.messages || [],
    status: chatConfig.status,
    error: chatConfig.error || null,
    sendMessage: chatConfig.sendMessage,
    regenerate: chatConfig.regenerate,
    stop: chatConfig.stop,
    clearError: chatConfig.clearError,
    resumeStream: chatConfig.resumeStream,
    addToolResult: chatConfig.addToolResult,
    setMessages: chatConfig.setMessages,

    // Helper methods
    askAboutTraining,
    getPerformanceAnalysis,
    getWorkoutRecommendations,
    isInitialized: !!accessToken,

    // Computed properties
    isLoading: chatConfig.status === 'streaming' || chatConfig.status === 'submitted',
  };

  return (
    <RunningCoachContext.Provider value={contextValue}>
      {children}
    </RunningCoachContext.Provider>
  );
}

export function useRunningCoachContext(): RunningCoachState {
  const context = useContext(RunningCoachContext);

  if (!context) {
    throw new Error('useRunningCoachContext must be used within a RunningCoachProvider');
  }

  return context;
}