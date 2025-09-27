import { useRunningCoachContext } from '../contexts/RunningCoachContext';

interface UseRunningCoachProps {
  accessToken?: string;
  onError?: (error: Error) => void;
}

/**
 * Legacy hook for backward compatibility.
 * Use useRunningCoachContext() directly for better performance.
 */
export function useRunningCoach(_props?: UseRunningCoachProps) {
  console.warn('useRunningCoach is deprecated. Use useRunningCoachContext() directly.');
  return useRunningCoachContext();
}