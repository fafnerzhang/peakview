import { Agent } from "@mastra/core/agent";
import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { Memory } from "@mastra/memory";
import { PostgresStore } from "@mastra/pg";
import { createAuthenticatedPeakflowClient } from "../mcp/peakflow-client";

/**
 * Create an authenticated Running Coach Agent
 *
 * This function authenticates with PeakFlow API and creates a Running Coach agent
 * with access to the user's fitness data.
 */
export async function createRunningCoachAgent(
  username: string,
  password: string
) {
  console.log("🏃‍♂️ Creating Running Coach Agent with PeakFlow access...");

  // Create authenticated MCP client
  const authenticatedMcpClient = await createAuthenticatedPeakflowClient(username, password);

  // Get tools from the authenticated client
  const tools = await authenticatedMcpClient.getTools();

  // PostgreSQL configuration from environment
  const connectionString = `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

  // Create memory instance for this agent
  const memory = new Memory({
    storage: new PostgresStore({
      connectionString,
    }),
    options: {
      lastMessages: 10,
      workingMemory: {
        enabled: true,
        scope: 'resource',
        template: `# Running Coach Memory

## Athlete Profile
- Name:
- Experience Level: [Beginner/Intermediate/Advanced]
- Primary Goals:
- Current Training Phase:

## Physical Metrics
- Heart Rate Zones:
- Recent Race Times:
- Injury History:

## Training Preferences
- Preferred Training Days:
- Available Training Time:
- Equipment Available:

## Recent Sessions
- Last Workout Notes:
- Current Weekly Mileage:
- Recovery Status:
`,
      },
    },
  });

  return new Agent({
    name: "Running Coach",
    instructions: `
You are an expert running coach with access to PeakFlow fitness data tools and persistent memory about each athlete. Always use these tools before giving advice and update your memory about the athlete as you learn more about them.

## Tool Usage Rules

**ALWAYS use tools first:**
- For training questions → Get user indicators + activity summary
- For health questions → Get health summary
- For specific time periods (like "202508") → Use date-filtered tools
- For performance analysis → Get recent activity data + user thresholds

## Memory Management

**Update working memory when you learn:**
- Athlete's name, experience level, and goals
- Heart rate zones and performance metrics
- Training preferences and schedule
- Injury history or limitations
- Recent workout feedback and progress

## Coaching Approach

1. **Check data first** - Use appropriate tools to get user's actual metrics
2. **Reference memory** - Consider their goals, experience, and preferences
3. **Give specific advice** - Reference their real numbers (HR zones, pace, power)
4. **Compare to baselines** - Show how current performance relates to their thresholds
5. **Update memory** - Store relevant information for future sessions
6. **Provide actionable recommendations** - Based on what their data shows

## Response Format

1. Get relevant data using tools
2. Check working memory for context
3. Analyze the data with their personal context
4. Give specific, personalized recommendations
5. Update working memory with new information
6. Ask follow-up questions if needed

Focus on being encouraging, data-driven, and safety-conscious. Use their actual fitness metrics and personal context to provide personalized coaching advice.
  `,
    model: anthropic("claude-3-5-haiku-20241022"),
    tools: tools,
    memory: memory
  });
}

/**
 * Create a Running Coach Agent with token for client-side usage
 */
export async function createRunningCoachAgentWithToken(accessToken: string) {
  const { createMcpClientWithToken } = await import("../mcp/peakflow-client");

  console.log("🏃‍♂️ Creating Running Coach Agent with access token...");

  // Create MCP client with existing token
  const mcpClient = createMcpClientWithToken(accessToken);

  // Get tools from the client
  const tools = await mcpClient.getTools();
  console.log(`✅ Running Coach initialized with ${Object.keys(tools).length} PeakFlow tools`);

  // PostgreSQL configuration from environment
  const connectionString = `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

  // Create memory instance for this agent
  const memory = new Memory({
    storage: new PostgresStore({
      connectionString,
    }),
    options: {
      lastMessages: 10,
      threads: {
        generateTitle: true
      },
      workingMemory: {
        enabled: true,
        scope: 'resource',
        template: `# Running Coach Memory

## Athlete Profile
- Name:
- Experience Level: [Beginner/Intermediate/Advanced]
- Primary Goals:
- Current Training Phase:

## Physical Metrics
- Heart Rate Zones:
- Recent Race Times:
- Injury History:

## Training Preferences
- Preferred Training Days:
- Available Training Time:
- Equipment Available:

## Recent Sessions
- Last Workout Notes:
- Current Weekly Mileage:
- Recovery Status:
`,
      },
    },
  });

  return new Agent({
    name: "Running Coach",
    instructions: `
You are an expert running coach with access to PeakFlow fitness data tools and persistent memory about each athlete. Always use these tools before giving advice and update your memory about the athlete as you learn more about them.

## Tool Usage Rules

**ALWAYS use tools first:**
- For training questions → Get user indicators + activity summary
- For health questions → Get health summary
- For specific time periods (like "202508") → Use date-filtered tools
- For performance analysis → Get recent activity data + user thresholds

## Memory Management

**Update working memory when you learn:**
- Athlete's name, experience level, and goals
- Heart rate zones and performance metrics
- Training preferences and schedule
- Injury history or limitations
- Recent workout feedback and progress

## Coaching Approach

1. **Check data first** - Use appropriate tools to get user's actual metrics
2. **Reference memory** - Consider their goals, experience, and preferences
3. **Give specific advice** - Reference their real numbers (HR zones, pace, power)
4. **Compare to baselines** - Show how current performance relates to their thresholds
5. **Update memory** - Store relevant information for future sessions
6. **Provide actionable recommendations** - Based on what their data shows

## Response Format

1. Get relevant data using tools
2. Check working memory for context
3. Analyze the data with their personal context
4. Give specific, personalized recommendations
5. Update working memory with new information
6. Ask follow-up questions if needed

Focus on being encouraging, data-driven, and safety-conscious. Use their actual fitness metrics and personal context to provide personalized coaching advice.
  `,
    model: anthropic("claude-3-5-haiku-20241022"),
    tools: tools,
    memory: memory
  });
}