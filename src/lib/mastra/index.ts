import { Mastra } from '@mastra/core/mastra';
import { PostgresStore } from '@mastra/pg';

// PostgreSQL configuration from environment
const connectionString = `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

// Basic Mastra configuration with PostgreSQL storage
export const mastra = new Mastra({
  agents: {
    // Running Coach agent is created dynamically with authentication
    // Use createRunningCoachAgent() function instead
  },
  storage: new PostgresStore({
    connectionString,
  }),
});

// Export the agent creation functions
export { createRunningCoachAgent, createRunningCoachAgentWithToken } from './agents/running-coach';
export { createAuthenticatedPeakflowClient, createMcpClientWithToken } from './mcp/peakflow-client';