import { MastraUIMessage } from '@mastra/react';
import { ChunkType } from '@mastra/core';
import { ReadonlyJSONObject } from '@mastra/core/stream';
import { BadgeMessage, StreamChunk } from './types';
import { mapWorkflowStreamChunkToWatchResult } from './workflow-utils';

export interface HandleStreamChunkOptions {
  conversation: MastraUIMessage[];
  chunk: ChunkType;
}

export const handleStreamChunk = ({ chunk, conversation }: HandleStreamChunkOptions): MastraUIMessage[] => {
  switch (chunk.type) {
    case 'start': {
      const newMessage: MastraUIMessage = {
        role: 'assistant',
        parts: [],
        id: `msg-${Date.now()}`,
      };

      return [...conversation, newMessage];
    }

    case 'text-start':
    case 'text-delta': {
      // Always add a new last text chunk if one doesn't exist yet to maintain content ordering
      const lastMessage = conversation[conversation.length - 1];
      if (!lastMessage) return conversation;

      if (
        lastMessage.role === 'assistant' &&
        (!lastMessage.parts ||
          lastMessage.parts.length === 0 ||
          lastMessage.parts[lastMessage.parts.length - 1]?.type !== 'text')
      ) {
        return [
          ...conversation.slice(0, -1),
          {
            ...lastMessage,
            parts: [...(lastMessage.parts || []), { type: 'text', text: '' }],
          },
        ];
      }

      // if we're text start then all we need is the empty text part above
      if (chunk.type === 'text-start') return conversation;

      // otherwise continue to append the text deltas
      const lastPart = lastMessage.parts?.[lastMessage.parts.length - 1];
      if (!lastPart || lastPart.type !== 'text') return conversation;

      return [
        ...conversation.slice(0, -1),
        {
          ...lastMessage,
          parts: [...lastMessage.parts.slice(0, -1), { ...lastPart, text: lastPart.text + chunk.payload.text }],
        },
      ];
    }

    case 'tool-output': {
      if (chunk.payload.output?.type?.startsWith('workflow-')) {
        return handleWorkflowChunk({
          workflowChunk: chunk.payload.output,
          conversation,
          entityName: chunk.payload.toolName,
        });
      }
      // Get the last message (should be the assistant's message)
      const lastMessage = conversation[conversation.length - 1];

      // Only process if the last message is from the assistant and has parts array
      if (lastMessage && lastMessage.role === 'assistant' && Array.isArray(lastMessage.parts)) {
        // Find the tool call content part that this result belongs to
        const updatedParts = lastMessage.parts.map(part => {
          if (part.type === 'tool-call' && part.toolCallId === chunk.payload.toolCallId) {
            const existingToolOutput = part.args?.__mastraMetadata?.toolOutput || [];

            return {
              ...part,
              args: {
                ...part.args,
                __mastraMetadata: {
                  ...part.args?.__mastraMetadata,
                  toolOutput: [...existingToolOutput, chunk?.payload?.output],
                },
              },
            };
          }
          return part;
        });

        // Create a new message with the updated content
        const updatedMessage: MastraUIMessage = {
          ...lastMessage,
          parts: updatedParts,
        };
        // Replace the last message with the updated one
        return [...conversation.slice(0, -1), updatedMessage];
      }

      return [...conversation];
    }

    case 'tool-call': {
      // Update the messages state

      // Get the last message (should be the assistant's message)
      const lastMessage = conversation[conversation.length - 1];

      // Only process if the last message is from the assistant
      if (lastMessage && lastMessage.role === 'assistant') {
        // Create a new message with the tool call part
        const updatedMessage: MastraUIMessage = {
          ...lastMessage,
          parts: [
            ...(lastMessage.parts || []),
            {
              type: 'tool-call',
              toolCallId: chunk.payload.toolCallId,
              toolName: chunk.payload.toolName,
              args: {
                ...chunk.payload.args,
                __mastraMetadata: {
                  ...chunk.payload.args?.__mastraMetadata,
                  isStreaming: true,
                },
              },
            },
          ],
        };

        // Replace the last message with the updated one
        return [...conversation.slice(0, -1), updatedMessage];
      }

      // If there's no assistant message yet, create one
      const newMessage: MastraUIMessage = {
        role: 'assistant',
        id: `msg-${Date.now()}`,
        parts: [
          {
            type: 'tool-call',
            toolCallId: chunk.payload.toolCallId,
            toolName: chunk.payload.toolName,
            args: {
              ...chunk.payload.args,
              __mastraMetadata: {
                ...(chunk.payload.args?.__mastraMetadata as ReadonlyJSONObject),
                isStreaming: true,
              },
            },
          },
        ],
      };

      return [...conversation, newMessage];
    }

    case 'tool-result': {
      // Update the messages state

      // Get the last message (should be the assistant's message)
      const lastMessage = conversation[conversation.length - 1];

      // Only process if the last message is from the assistant and has parts array
      if (lastMessage && lastMessage.role === 'assistant' && Array.isArray(lastMessage.parts)) {
        // Find the tool call content part that this result belongs to
        const updatedParts = lastMessage.parts.map(part => {
          if (part.type === 'tool-call' && part.toolCallId === chunk.payload.toolCallId) {
            return {
              ...part,
              result: chunk.payload.result,
            };
          }
          return part;
        });

        // Create a new message with the updated content
        const updatedMessage: MastraUIMessage = {
          ...lastMessage,
          parts: updatedParts,
        };
        // Replace the last message with the updated one
        return [...conversation.slice(0, -1), updatedMessage];
      }

      return [...conversation];
    }

    case 'error': {
      if (typeof chunk.payload.error === 'string') {
        // Add error message to conversation instead of throwing
        const errorMessage: MastraUIMessage = {
          role: 'assistant',
          id: `msg-${Date.now()}`,
          parts: [{ type: 'text', text: `Error: ${chunk.payload.error}` }],
        };
        return [...conversation, errorMessage];
      }
      return [...conversation];
    }

    case 'finish': {
      const lastMessage = conversation[conversation.length - 1];

      handleFinishReason(chunk.payload.stepResult.reason);
      // Only process if the last message is from the assistant
      if (lastMessage && lastMessage.role === 'assistant') {
        // Create a new message with the modelMetadata in metadata
        const updatedMessage: MastraUIMessage = {
          ...lastMessage,
          metadata: {
            custom: {
              modelMetadata: chunk.payload.metadata.modelMetadata,
            },
          },
        };

        // Replace the last message with the updated one
        return [...conversation.slice(0, -1), updatedMessage];
      }

      return [...conversation];
    }

    case 'reasoning-delta': {
      // Get the last message (should be the assistant's message)
      const lastMessage = conversation[conversation.length - 1];

      // Only process if the last message is from the assistant
      if (lastMessage && lastMessage.role === 'assistant' && Array.isArray(lastMessage.parts)) {
        // Find and update the reasoning content type
        const hasReasoning = lastMessage.parts.some(part => part.type === 'reasoning');

        if (hasReasoning) {
          const updatedParts = lastMessage.parts.map(part => {
            if (part.type === 'reasoning') {
              return {
                ...part,
                text: part.text + chunk.payload.text,
              };
            }
            return part;
          });
          // Create a new message with the updated reasoning content
          const updatedMessage: MastraUIMessage = {
            ...lastMessage,
            parts: updatedParts,
          };

          // Replace the last message with the updated one
          return [...conversation.slice(0, -1), updatedMessage];
        } else {
          // Add new reasoning part
          return [
            ...conversation.slice(0, -1),
            {
              ...lastMessage,
              parts: [
                ...lastMessage.parts,
                {
                  type: 'reasoning',
                  text: chunk.payload.text,
                },
              ],
            },
          ];
        }
      }

      // If there's no assistant message yet, create one
      const newMessage: MastraUIMessage = {
        role: 'assistant',
        id: `msg-${Date.now()}`,
        parts: [
          {
            type: 'reasoning',
            text: chunk.payload.text,
          },
        ],
      };

      return [...conversation, newMessage];
    }

    default:
      return [...conversation];
  }
};

const handleFinishReason = (finishReason: string) => {
  switch (finishReason) {
    case 'tool-calls':
      console.warn('Stream finished with reason tool-calls, consider increasing maxSteps');
      break;
    default:
      break;
  }
};

interface HandleWorkflowChunkOptions {
  workflowChunk: object;
  conversation: MastraUIMessage[];
  entityName?: string;
}

export const handleWorkflowChunk = ({
  workflowChunk,
  conversation,
  entityName,
}: HandleWorkflowChunkOptions): MastraUIMessage[] => {
  const lastMessage = conversation[conversation.length - 1];
  const partsArray = lastMessage.parts || [];

  const newMessage = {
    ...lastMessage,
    parts: partsArray.map(part => {
      if (part.type === 'tool-call') {
        return {
          ...part,
          toolName: entityName,
          args: {
            ...part.args,
            __mastraMetadata: {
              ...part.args?.__mastraMetadata,
              workflowFullState: mapWorkflowStreamChunkToWatchResult(
                part.args?.__mastraMetadata?.workflowFullState || {},
                workflowChunk as StreamChunk,
              ),
              isStreaming: true,
            },
          },
        };
      }

      return part;
    }),
  };

  return [...conversation.slice(0, -1), newMessage];
};

interface HandleAgentChunkOptions {
  agentChunk: any;
  conversation: MastraUIMessage[];
  entityName: string;
}

export const handleAgentChunk = ({
  agentChunk,
  conversation,
  entityName,
}: HandleAgentChunkOptions): MastraUIMessage[] => {
  switch (agentChunk.type) {
    case 'tool-result': {
      const lastMessage = conversation[conversation.length - 1];
      const partsArray = lastMessage.parts || [];

      const newMessage = {
        ...lastMessage,
        parts: partsArray.map(part => {
          if (part.type === 'tool-call') {
            const messages: BadgeMessage[] = part.args?.__mastraMetadata?.messages || [];

            return {
              ...part,
              toolName: entityName,
              args: {
                ...part.args,
                __mastraMetadata: {
                  ...part.args?.__mastraMetadata,
                  isStreaming: true,
                  messages: [
                    ...messages.slice(0, -1),
                    {
                      ...messages[messages.length - 1],
                      type: 'tool' as const,
                      toolName: agentChunk.payload.toolName,
                      args: agentChunk.payload.args,
                      toolOutput: agentChunk.payload.result,
                      toolCallId: agentChunk.payload.toolCallId || '',
                    },
                  ],
                },
              },
            };
          }

          return part;
        }),
      };

      return [...conversation.slice(0, -1), newMessage];
    }

    case 'tool-call': {
      const lastMessage = conversation[conversation.length - 1];
      const partsArray = lastMessage.parts || [];

      const newMessage = {
        ...lastMessage,
        parts: partsArray.map(part => {
          if (part.type === 'tool-call') {
            const messages: BadgeMessage[] = part.args?.__mastraMetadata?.messages || [];

            return {
              ...part,
              toolName: entityName,
              args: {
                ...part.args,
                __mastraMetadata: {
                  ...part.args?.__mastraMetadata,
                  isStreaming: true,
                  messages: [
                    ...messages,
                    {
                      type: 'tool' as const,
                      toolCallId: agentChunk.payload.toolCallId,
                      toolName: agentChunk.payload.toolName,
                      args: {
                        ...agentChunk.payload.args,
                        __mastraMetadata: {
                          ...agentChunk.payload.args?.__mastraMetadata,
                          isStreaming: true,
                        },
                      },
                    },
                  ],
                },
              },
            };
          }

          return part;
        }),
      };

      return [...conversation.slice(0, -1), newMessage];
    }

    case 'text-delta': {
      const lastMessage = conversation[conversation.length - 1];
      const partsArray = lastMessage.parts || [];

      const newMessage = {
        ...lastMessage,
        parts: partsArray.map(part => {
          if (part.type === 'tool-call') {
            const messages: BadgeMessage[] = part.args?.__mastraMetadata?.messages || [];
            const lastMastraMessage = messages[messages.length - 1];

            const nextMessages: BadgeMessage[] =
              lastMastraMessage?.type === 'text'
                ? [
                    ...messages.slice(0, -1),
                    { type: 'text', content: (lastMastraMessage?.content || '') + agentChunk.payload.text },
                  ]
                : [...messages, { type: 'text', content: agentChunk.payload.text }];

            return {
              ...part,
              toolName: entityName,
              args: {
                ...part.args,
                __mastraMetadata: {
                  ...part.args?.__mastraMetadata,
                  isStreaming: true,
                  messages: nextMessages,
                },
              },
            };
          }

          return part;
        }),
      };

      return [...conversation.slice(0, -1), newMessage];
    }

    case 'tool-output': {
      if (!agentChunk.payload.output?.type?.startsWith('workflow-')) return [...conversation];

      const lastMessage = conversation[conversation.length - 1];
      const partsArray = lastMessage.parts || [];

      const newMessage = {
        ...lastMessage,
        parts: partsArray.map(part => {
          if (part.type === 'tool-call') {
            const messages: BadgeMessage[] = part.args?.__mastraMetadata?.messages || [];
            const lastMastraMessage = messages[messages.length - 1];

            const nextMessages: BadgeMessage[] =
              lastMastraMessage?.type === 'tool'
                ? [
                    ...messages.slice(0, -1),
                    {
                      ...lastMastraMessage,
                      args: {
                        ...agentChunk.payload.args,
                        __mastraMetadata: {
                          ...agentChunk.payload.args?.__mastraMetadata,
                          workflowFullState: mapWorkflowStreamChunkToWatchResult(
                            lastMastraMessage.args?.__mastraMetadata?.workflowFullState || {},
                            agentChunk.payload.output as StreamChunk,
                          ),
                          isStreaming: true,
                        },
                      },
                    },
                  ]
                : messages;

            return {
              ...part,
              toolName: entityName,
              args: {
                ...part.args,
                __mastraMetadata: {
                  ...part.args?.__mastraMetadata,
                  isStreaming: true,
                  messages: nextMessages,
                },
              },
            };
          }

          return part;
        }),
      };

      return [...conversation.slice(0, -1), newMessage];
    }

    default:
    case 'agent-execution-end':
      return [...conversation];
  }
};

interface CreateRootToolAssistantMessageOptions {
  chunk: any;
  entityName: string;
  conversation: MastraUIMessage[];
  runId: string;
  from: 'AGENT' | 'WORKFLOW';
  networkMetadata: {
    selectionReason?: string;
    input?: string | Record<string, unknown>;
  };
}

export const createRootToolAssistantMessage = ({
  chunk,
  entityName,
  conversation,
  runId,
  from,
  networkMetadata,
}: CreateRootToolAssistantMessageOptions): MastraUIMessage[] => {
  if (!entityName || !runId) return [...conversation];

  // If there's no assistant message yet, create one
  const newMessage: MastraUIMessage = {
    role: 'assistant',
    id: `msg-${Date.now()}`,
    parts: [
      {
        type: 'tool-call',
        toolCallId: runId,
        toolName: entityName,
        args: {
          ...chunk?.payload?.args,
          __mastraMetadata: {
            from,
            networkMetadata,
            ...chunk.payload.args?.__mastraMetadata,
            isStreaming: true,
          },
        },
      },
    ],
  };

  return [...conversation, newMessage];
};
