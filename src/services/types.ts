// Badge message types for agent network visualization
export type TextMessage = {
  type: 'text';
  content: string;
};

export type ToolMessage = {
  type: 'tool';
  toolName: string;
  toolInput?: any;
  toolOutput?: any;
  args?: any;
  toolCallId: string;
  result?: any;
};

export type BadgeMessage = TextMessage | ToolMessage;

// Workflow stream chunk types (simplified for peakview)
export type StreamChunk =
  | { type: 'workflow-start'; runId: string }
  | { type: 'workflow-step-start'; payload: { id: string; [key: string]: any } }
  | { type: 'workflow-step-complete'; payload: { id: string; output?: any; [key: string]: any } }
  | { type: 'workflow-step-error'; payload: { id: string; error: string; [key: string]: any } }
  | { type: 'workflow-complete'; payload: { result: any } }
  | { type: 'workflow-error'; payload: { error: string } };
