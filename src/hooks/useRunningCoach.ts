import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useState } from 'react';

interface UseRunningCoachProps {
  accessToken: string;
  onError?: (error: Error) => void;
}

export function useRunningCoach({ accessToken, onError }: UseRunningCoachProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  
  console.log('useRunningCoach initialized with accessToken:', accessToken);
  console.log('accessToken type:', typeof accessToken);
  console.log('accessToken length:', accessToken?.length);
  
  const chatConfig = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }),
    onError: (error: Error) => {
      console.error('useChat error:', error);
      onError?.(error);
    },
  });

  return {
    ...chatConfig,
    isInitialized,
    // Helper method to ask about training
    askAboutTraining: (question: string) => {
      chatConfig.sendMessage({ text: `Training question: ${question}` });
    },
    // Helper method to get performance analysis
    getPerformanceAnalysis: (timeframe?: string) => {
      const content = timeframe
        ? `Can you analyze my performance for ${timeframe}?`
        : 'Can you analyze my recent performance?';

      chatConfig.sendMessage({ text: content });
    },
    // Helper method to get workout recommendations
    getWorkoutRecommendations: () => {
      chatConfig.sendMessage({ text: 'Based on my recent training data, what workout would you recommend for today?' });
    }
  };
}