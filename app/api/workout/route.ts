import { NextRequest, NextResponse } from 'next/server';
import { mastra } from '../../../src/lib/mastra';
import { RuntimeContext } from "@mastra/core/runtime-context";
import { validateAuth, AuthError } from '../../../src/lib/auth';
import { logger } from '../../../src/lib/logger';
import { z } from "zod";
import type { WorkoutPlanWithMetadata } from '../../../src/types/workout';


type SupportRuntimeContext = {
  accessToken: string;
  userId: string;
  username: string;
};


export async function POST(req: NextRequest) {
  const requestId = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  logger.info({
    context: 'INCOMING_REQUEST',
    method: req.method,
    url: req.url,
    userAgent: req.headers.get('user-agent'),
    contentType: req.headers.get('content-type'),
    hasAuthHeader: !!req.headers.get('authorization'),
    requestId
  }, 'Chat API request received');

  try {
    const { messages } = await req.json();
    // Validate authentication and extract user information
    let authResult;
    try {
      authResult = await validateAuth(req);
      logger.info({
        userId: authResult.userId,
        username: authResult.username,
        userActive: authResult.user.is_active,
        userVerified: authResult.user.is_verified,
        requestId
      }, 'Authentication successful');
    } catch (error) {
      if (error instanceof AuthError) {
        logger.error({
          reason: error.message,
          statusCode: error.statusCode,
          errorType: 'AuthError',
          url: req.url,
          method: req.method,
          userAgent: req.headers.get('user-agent'),
          requestId
        }, 'Authentication failure');

        return NextResponse.json(
          { error: error.message },
          { status: error.statusCode }
        );
      }

      logger.error({ error, requestId }, 'Unexpected authentication error');
      return NextResponse.json(
        { error: 'Authentication service error' },
        { status: 500 }
      );
    }

    // Extract access token for agent context
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
    const accessToken = authHeader?.replace('Bearer ', '') || '';

    logger.debug({
      tokenLength: accessToken.length,
      tokenPrefix: accessToken.slice(0, 10) + '...',
      requestId
    }, 'Access token extracted for agent context');

    if (!messages || !Array.isArray(messages)) {
      logger.error({
        hasMessages: !!messages,
        messageType: typeof messages,
        isArray: Array.isArray(messages),
        requestId
      }, 'Invalid messages payload');
      
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    logger.info({ requestId }, 'Creating running coach agent');

    try {
      const agent = mastra.getAgent('workoutExpert');
      const runtimeContext = new RuntimeContext<SupportRuntimeContext>();
      runtimeContext.set('accessToken', accessToken);
      runtimeContext.set('userId', authResult.userId);
      runtimeContext.set('username', authResult.username);
      logger.info({
        userId: authResult.userId,
        username: authResult.username,
        requestId
      }, 'Running coach agent created successfully');
      // const memory = await agent.getMemory()
      // const {messages, uiMessages} = await memory!.query({threadId: 'default'})
      logger.info({ requestId }, 'Starting stream with Mastra Agent');

      // Get the latest user message since Mastra handles message history
      const latestMessage = messages[messages.length - 1];
      logger.debug({
        totalMessages: messages.length,
        latestMessage: latestMessage,
        requestId
      }, 'Using latest user message');
      
      // Define output schema matching the WorkoutPlan structure from peakflow
      const outputSchema = z.object({
        workoutPlan: z.object({
          name: z.string().optional().describe("Optional workout name"),
          description: z.string().optional().describe("Optional workout description"),
          segments: z.array(z.object({
            duration_minutes: z.number().positive().describe("Duration in minutes (must be positive)"),
            intensity_metric: z.enum(['power', 'heart_rate', 'pace']).describe("Type of intensity metric"),
            target_value: z.number().positive().describe("Target intensity value (watts, bpm, or min/km)")
          })).min(1).describe("Workout segments - at least one required"),
        }).describe("Complete workout plan as a collection of segments"),
        metadata: z.object({
          total_duration_minutes: z.number().describe("Total workout duration calculated from all segments"),
          primary_focus: z.string().describe("Main training focus (e.g., 'endurance', 'intervals', 'recovery')"),
          intensity_distribution: z.object({
            easy_percentage: z.number().min(0).max(100).describe("Percentage of time in easy/recovery zones"),
            moderate_percentage: z.number().min(0).max(100).describe("Percentage of time in moderate zones"),
            hard_percentage: z.number().min(0).max(100).describe("Percentage of time in hard/anaerobic zones")
          }).describe("Distribution of workout intensity across different zones"),
          estimated_tss: z.number().optional().describe("Estimated Training Stress Score if calculable"),
          pre_intensity: z.number().optional().describe("Pre-workout intensity level if applicable")
        }).describe("Additional workout metadata for context and planning")
      }).describe("Structured workout plan output matching the WorkoutPlan schema from peakflow analytics")
      
      const agentStream = await agent.streamVNext([latestMessage], {
        maxSteps: 5, // Allow multiple tool calls
        format: 'aisdk',
        runtimeContext: runtimeContext,
        structuredOutput: {
          schema: outputSchema,
        }
      });
      console.log('🚀 Agent stream started successfully');
      // In an API route for frontend integration
      return agentStream.toUIMessageStreamResponse();
      
    } catch (agentError) {
      logger.error({
        error: agentError,
        errorMessage: agentError instanceof Error ? agentError.message : 'Unknown agent error',
        tokenLength: accessToken?.length || 0,
        requestId
      }, 'Failed to create agent or process stream');
      
      // Check if it's an authentication-related error
      if (agentError instanceof Error && 
          (agentError.message.includes('401') || 
           agentError.message.includes('Unauthorized') || 
           agentError.message.includes('Authentication failed'))) {
        
        logger.error({
          reason: 'Agent creation failed - token may be invalid or expired',
          agentErrorMessage: agentError.message,
          tokenProvided: true,
          tokenLength: accessToken.length,
          url: req.url,
          method: req.method,
          requestId
        }, 'Agent creation authentication failure');
        
        return NextResponse.json(
          { error: 'Authentication failed - token may be invalid or expired' },
          { status: 401 }
        );
      }
      
      throw agentError; // Re-throw for general error handling
    }

  } catch (error) {
    logger.error({
      error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorType: error?.constructor?.name || 'Unknown',
      url: req.url,
      method: req.method,
      requestId
    }, 'Unhandled error in chat API');

    return NextResponse.json(
      {
        error: 'Failed to create chat response',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  logger.info({
    url: req.url,
    userAgent: req.headers.get('user-agent')
  }, 'Health check request received');
  
  return NextResponse.json({
    message: 'Running Coach Chat API is running',
    timestamp: new Date().toISOString(),
    status: 'healthy'
  });
}