import { StreamChunk } from './types';

// Simplified workflow state tracking for peakview
export interface WorkflowWatchResult {
  type: 'watch';
  runId?: string;
  eventTimestamp: Date;
  payload: {
    currentStep?: {
      id: string;
      [key: string]: any;
    };
    workflowState: {
      status: 'running' | 'success' | 'failed' | 'suspended' | 'waiting';
      steps: Record<
        string,
        {
          status: 'success' | 'failed' | 'running' | 'suspended' | 'waiting';
          output?: any;
          error?: string;
          startedAt?: number;
          endedAt?: number;
        }
      >;
      result?: any;
      error?: string;
      payload?: any;
    };
  };
}

export const mapWorkflowStreamChunkToWatchResult = (
  prev: WorkflowWatchResult | Record<string, never>,
  chunk: StreamChunk,
): WorkflowWatchResult => {
  const prevTyped = 'type' in prev ? prev : createEmptyWorkflowState();

  if (chunk.type === 'workflow-start') {
    return {
      ...prevTyped,
      runId: chunk.runId,
      eventTimestamp: new Date(),
      payload: {
        ...prevTyped.payload,
        workflowState: {
          ...prevTyped.payload.workflowState,
          status: 'running',
          steps: {},
        },
      },
    };
  }

  if (chunk.type === 'workflow-step-start') {
    const current = prevTyped.payload?.workflowState?.steps?.[chunk.payload.id] || {};

    return {
      ...prevTyped,
      payload: {
        ...prevTyped.payload,
        currentStep: {
          id: chunk.payload.id,
          ...chunk.payload,
        },
        workflowState: {
          ...prevTyped.payload.workflowState,
          steps: {
            ...prevTyped.payload.workflowState.steps,
            [chunk.payload.id]: {
              ...current,
              status: 'running',
              startedAt: Date.now(),
            },
          },
        },
      },
    };
  }

  if (chunk.type === 'workflow-step-complete') {
    const current = prevTyped.payload?.workflowState?.steps?.[chunk.payload.id] || {};

    return {
      ...prevTyped,
      payload: {
        ...prevTyped.payload,
        workflowState: {
          ...prevTyped.payload.workflowState,
          steps: {
            ...prevTyped.payload.workflowState.steps,
            [chunk.payload.id]: {
              ...current,
              status: 'success',
              output: chunk.payload.output,
              endedAt: Date.now(),
            },
          },
        },
      },
    };
  }

  if (chunk.type === 'workflow-step-error') {
    const current = prevTyped.payload?.workflowState?.steps?.[chunk.payload.id] || {};

    return {
      ...prevTyped,
      payload: {
        ...prevTyped.payload,
        workflowState: {
          ...prevTyped.payload.workflowState,
          status: 'failed',
          steps: {
            ...prevTyped.payload.workflowState.steps,
            [chunk.payload.id]: {
              ...current,
              status: 'failed',
              error: chunk.payload.error,
              endedAt: Date.now(),
            },
          },
        },
      },
    };
  }

  if (chunk.type === 'workflow-complete') {
    return {
      ...prevTyped,
      payload: {
        ...prevTyped.payload,
        workflowState: {
          ...prevTyped.payload.workflowState,
          status: 'success',
          result: chunk.payload.result,
        },
      },
    };
  }

  if (chunk.type === 'workflow-error') {
    return {
      ...prevTyped,
      payload: {
        ...prevTyped.payload,
        workflowState: {
          ...prevTyped.payload.workflowState,
          status: 'failed',
          error: chunk.payload.error,
        },
      },
    };
  }

  return prevTyped;
};

function createEmptyWorkflowState(): WorkflowWatchResult {
  return {
    type: 'watch',
    eventTimestamp: new Date(),
    payload: {
      workflowState: {
        status: 'waiting',
        steps: {},
      },
    },
  };
}
