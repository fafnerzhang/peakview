import { Mastra } from '@mastra/core/mastra';
import { PostgresStore } from '@mastra/pg';
import { createRunningCoachAgentWithToken } from './agents/running-coach';
import { createWorkoutExpert } from './agents/workout-expert';
// PostgreSQL configuration from environment
const connectionString = `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

// Shared PostgresStore instance - eliminates duplicate connection warnings
export const sharedPostgresStore = new PostgresStore({
  connectionString,
});

// Basic Mastra configuration with shared PostgreSQL storage
const runningCoachAgent = createRunningCoachAgentWithToken(sharedPostgresStore)
const workoutExpertAgent = createWorkoutExpert(sharedPostgresStore)
export const mastra = new Mastra({
  agents: {
    runningCoach: runningCoachAgent,
    workoutExpert: workoutExpertAgent
  },
  storage: sharedPostgresStore,
});

// Export the agent creation functions
export { createWorkoutExpert } from './agents/workout-expert';
export { createRunningCoachAgent, createRunningCoachAgentWithToken } from './agents/running-coach';
export { createAuthenticatedPeakflowClient, createMcpClientWithToken } from './mcp/peakflow-client';