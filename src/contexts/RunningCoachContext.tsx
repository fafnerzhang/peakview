'use client';

import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import { useChat, toUIMessage, MastraReactProvider } from '@mastra/react';
import { RuntimeContext } from '@mastra/core/runtime-context';
import type { ChunkType } from '@mastra/core/stream';
import type { UIMessage } from '@ai-sdk/react';
import { fetchUserIndicators, fetchUserZones } from '@/src/lib/userIndicators';

// MastraUIMessage type from @mastra/react
type MastraUIMessage = UIMessage<any, any, any>;


interface TrainingPhase {
  user_id: string;
  phase_id: string;
  name: string;
  coach_id: string | null;
  phase_type: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
  weeks: TrainingWeek[];
}

interface TrainingWeek {
  user_id: string;
  phase_id: string;
  week_id: string;
  week_number: number;
  weekly_tss_target: number | null;
  focus: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  workouts: any[];
}

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
  // Phase sync
  phases: TrainingPhase[];
  syncPhases: () => Promise<void>;
  isSyncingPhases: boolean;
  // Selected items for context
  selectedPhases: any[];
  selectedWeeks: any[];
  selectedWorkouts: any[];
  setSelectedPhases: (phases: any[]) => void;
  setSelectedWeeks: (weeks: any[]) => void;
  setSelectedWorkouts: (workouts: any[]) => void;
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
    const [phases, setPhases] = React.useState<TrainingPhase[]>([]);
    const [isSyncingPhases, setIsSyncingPhases] = React.useState(false);
    const [selectedPhases, setSelectedPhases] = React.useState<any[]>([]);
    const [selectedWeeks, setSelectedWeeks] = React.useState<any[]>([]);
    const [selectedWorkouts, setSelectedWorkouts] = React.useState<any[]>([]);
    const runtimeContext = new RuntimeContext()
    runtimeContext.set('accessToken', accessToken);
    runtimeContext.set('coachId', 'jack-daniels'); // Example coachId, could be dynamic

    const chatConfig = useChat<MastraUIMessage>({
      agentId: agentId,
    });

    // Sync phases from api-service
    const syncPhases = React.useCallback(async () => {
      if (!accessToken) {
        console.warn('Cannot sync phases: no access token');
        return;
      }

      setIsSyncingPhases(true);
      try {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

        // Get phase summaries
        const summaryResponse = await fetch(`${apiBaseUrl}/training-plans/phases`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (!summaryResponse.ok) {
          if (summaryResponse.status === 404) {
            console.log('No training phases found for user');
            setPhases([]);
            return;
          }
          throw new Error(`Failed to fetch phases: ${summaryResponse.status}`);
        }

        const summaries = await summaryResponse.json();

        // Fetch full phase data (with weeks) for each phase
        const phasePromises = summaries.map(async (summary: any) => {
          const detailResponse = await fetch(
            `${apiBaseUrl}/training-plans/phases/${summary.phase_id}`,
            {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
            }
          );

          if (!detailResponse.ok) {
            console.error(`Failed to fetch phase ${summary.phase_id}`);
            return null;
          }

          return await detailResponse.json();
        });

        const phasesData = await Promise.all(phasePromises);
        const validPhases = phasesData.filter(p => p !== null);

        setPhases(validPhases);
        console.log(`✅ Synced ${validPhases.length} training phases`);
        console.log('Phases:', validPhases);
      } catch (err) {
        console.error('Failed to sync phases:', err);
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
      } finally {
        setIsSyncingPhases(false);
      }
    }, [accessToken]);

    // Fetch user indicators and zones when access token is available
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

      const loadUserZones = async () => {
        if (accessToken) {
          try {
            const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const zones = await fetchUserZones(accessToken, apiBaseUrl);

            // Add zones to runtime context for Mastra agents
            if (zones) {
              runtimeContext.set('userZones', zones);
              console.log('✅ User zones loaded and added to runtime context');
            } else {
              console.log('ℹ️ User has not set up zones yet');
            }
          } catch (err) {
            console.error('Failed to fetch user zones:', err);
            // Don't set error state - zones are optional
          }
        }
      };

      loadUserIndicators();
      loadUserZones();
    }, [accessToken]);

    // Sync phases on mount
    useEffect(() => {
      syncPhases();
    }, [syncPhases]);

    // Update runtime context when selections change
    useEffect(() => {
      if (selectedPhases.length > 0) {
        runtimeContext.set('selectedPhases', selectedPhases);
        console.log('✅ Selected phases added to runtime context:', selectedPhases);
      } else {
        runtimeContext.delete('selectedPhases');
      }
    }, [selectedPhases]);

    useEffect(() => {
      if (selectedWeeks.length > 0) {
        runtimeContext.set('selectedWeeks', selectedWeeks);
        console.log('✅ Selected weeks added to runtime context:', selectedWeeks);
      } else {
        runtimeContext.delete('selectedWeeks');
      }
    }, [selectedWeeks]);

    useEffect(() => {
      if (selectedWorkouts.length > 0) {
        runtimeContext.set('selectedWorkouts', selectedWorkouts);
        console.log('✅ Selected workouts added to runtime context:', selectedWorkouts);
      } else {
        runtimeContext.delete('selectedWorkouts');
      }
    }, [selectedWorkouts]);

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

    // Phase sync
    phases,
    syncPhases,
    isSyncingPhases,

    // Selected items
    selectedPhases,
    selectedWeeks,
    selectedWorkouts,
    setSelectedPhases,
    setSelectedWeeks,
    setSelectedWorkouts,
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

export type { RunningCoachState, TrainingPhase, TrainingWeek };
