import { NextRequest, NextResponse } from 'next/server';
import { createRunningCoachAgentWithToken } from '../../../src/lib/mastra/agents/running-coach';

// Helper function to safely log request details
function logRequestDetails(req: NextRequest, context: string) {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.url;
  const userAgent = req.headers.get('user-agent') || 'Unknown';
  const contentType = req.headers.get('content-type') || 'Not specified';
  const authHeader = req.headers.get('authorization');
  
  console.log(`[${timestamp}] ${context} - Chat API Request Details:`, {
    method,
    url,
    userAgent,
    contentType,
    hasAuthHeader: !!authHeader,
    authHeaderFormat: authHeader ? 
      (authHeader.startsWith('Bearer ') ? 'Bearer token format' : 'Non-Bearer format') : 
      'No auth header',
    authHeaderLength: authHeader?.length || 0,
    requestId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  });
}

// Helper function to log authentication failures
function logAuthFailure(req: NextRequest, reason: string, details?: any) {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] Chat API Authentication Failure:`, {
    reason,
    url: req.url,
    method: req.method,
    userAgent: req.headers.get('user-agent'),
    referer: req.headers.get('referer'),
    origin: req.headers.get('origin'),
    details,
    timestamp
  });
}

export async function POST(req: NextRequest) {
  // Log incoming request details
  logRequestDetails(req, 'INCOMING_REQUEST');
  
  try {
    const { messages } = await req.json();
    
    console.log('📥 Chat API: Received messages array:', {
      messageCount: messages?.length || 0,
      hasMessages: !!messages,
      isArray: Array.isArray(messages)
    });
    
    // Extract access token from Authorization header
    console.log('🔍 All headers received:', Object.fromEntries(req.headers.entries()));
    console.log('🔍 Authorization header (uppercase):', req.headers.get('Authorization'));
    console.log('🔍 authorization header (lowercase):', req.headers.get('authorization'));
    
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
    const accessToken = authHeader?.replace('Bearer ', '');

    if (!accessToken) {
      logAuthFailure(req, 'Missing or empty access token', {
        authHeaderPresent: !!authHeader,
        authHeaderValue: authHeader ? '[REDACTED]' : null,
        authHeaderLength: authHeader?.length || 0
      });
      
      return NextResponse.json(
        { error: 'Access token is required' },
        { status: 401 }
      );
    }

    console.log('🔐 Chat API: Access token extracted successfully:', {
      tokenLength: accessToken.length,
      tokenPrefix: accessToken.substring(0, 10) + '...',
      tokenFormat: 'Bearer token detected'
    });

    if (!messages || !Array.isArray(messages)) {
      console.error('❌ Chat API: Invalid messages payload:', {
        hasMessages: !!messages,
        messageType: typeof messages,
        isArray: Array.isArray(messages),
        messagesValue: messages
      });
      
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    console.log('🤖 Chat API: Creating running coach agent with token...');

    try {
      const agent = await createRunningCoachAgentWithToken(accessToken);
      console.log('✅ Chat API: Running coach agent created successfully');
      const memory = await agent.getMemory()
      const {messages, uiMessages} = await memory!.query({threadId: 'default'})
      console.log('🚀 Chat API: Starting stream with Mastra Agent...');
      
      // Convert UIMessages to simple format expected by Mastra Agent
      const mastraMessages = messages.map((msg: any) => {
        if (msg.parts && Array.isArray(msg.parts)) {
          // Handle UIMessage format with parts array
          const textParts = msg.parts.filter((part: any) => part.type === 'text');
          const content = textParts.map((part: any) => part.text).join(' ');
          return {
            role: msg.role,
            content: content
          };
        } else if (msg.content) {
          // Handle already correct format
          return {
            role: msg.role,
            content: msg.content
          };
        } else {
          // Fallback for unexpected format
          return {
            role: msg.role || 'user',
            content: JSON.stringify(msg)
          };
        }
      });

      console.log('📝 Chat API: Converted messages for Mastra:', {
        originalCount: messages.length,
        convertedCount: mastraMessages.length,
        sample: mastraMessages.slice(0, 2)
      });
      
      // Use Mastra Agent's streamVNext method
      const agentStream = await agent.streamVNext(mastraMessages, {
        maxSteps: 5, // Allow multiple tool calls
        format: 'aisdk'
      });
      
      // In an API route for frontend integration
      return agentStream.toUIMessageStreamResponse();
      
    } catch (agentError) {
      console.error('🔥 Chat API: Failed to create agent or process stream:', {
        error: agentError,
        errorMessage: agentError instanceof Error ? agentError.message : 'Unknown agent error',
        errorStack: agentError instanceof Error ? agentError.stack : undefined,
        tokenLength: accessToken?.length || 0,
        timestamp: new Date().toISOString()
      });
      
      // Check if it's an authentication-related error
      if (agentError instanceof Error && 
          (agentError.message.includes('401') || 
           agentError.message.includes('Unauthorized') || 
           agentError.message.includes('Authentication failed'))) {
        
        logAuthFailure(req, 'Agent creation failed - token may be invalid or expired', {
          agentErrorMessage: agentError.message,
          tokenProvided: true,
          tokenLength: accessToken.length
        });
        
        return NextResponse.json(
          { error: 'Authentication failed - token may be invalid or expired' },
          { status: 401 }
        );
      }
      
      throw agentError; // Re-throw for general error handling
    }

  } catch (error) {
    console.error('🚨 Chat API: Unhandled error:', {
      error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined,
      errorType: error?.constructor?.name || 'Unknown',
      timestamp: new Date().toISOString(),
      url: req.url,
      method: req.method
    });

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
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] Chat API: Health check request received`, {
    url: req.url,
    userAgent: req.headers.get('user-agent'),
    timestamp
  });
  
  return NextResponse.json({ 
    message: 'Running Coach Chat API is running',
    timestamp,
    status: 'healthy'
  });
}