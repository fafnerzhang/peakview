import { Mastra } from '@mastra/core/mastra';

// Basic Mastra configuration for Next.js
export const mastra = new Mastra({
  agents: {
    // Running Coach agent is created dynamically with authentication
    // Use createRunningCoachAgent() function instead
  },
  // Use in-memory storage for simplicity in Next.js
  storage: {
    // Simple in-memory storage
    async get(key: string) {
      return undefined;
    },
    async set(key: string, value: any) {
      return;
    },
    async delete(key: string) {
      return;
    }
  }
});

// Export the agent creation functions
export { createRunningCoachAgent, createRunningCoachAgentWithToken } from './agents/running-coach';
export { createAuthenticatedPeakflowClient, createMcpClientWithToken } from './mcp/peakflow-client';