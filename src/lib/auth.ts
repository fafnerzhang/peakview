import { NextRequest } from 'next/server';
import { Pool } from 'pg';

interface AuthUser {
  id: string;
  username: string;
  email: string;
  is_active: boolean;
  is_verified: boolean;
}

interface AuthSession {
  id: string;
  user_id: string;
  is_active: boolean;
  refresh_token_expires: Date;
  revoked_at: Date | null;
}

interface JWTPayload {
  sub: string;
  session_id: string;
  iat: number;
  exp: number;
}

class AuthError extends Error {
  constructor(message: string, public statusCode: number = 401) {
    super(message);
    this.name = 'AuthError';
  }
}

class TokenService {
  private static decodeJWT(token: string): JWTPayload {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new AuthError('Invalid token format');
      }

      const payload = parts[1];
      const decoded = Buffer.from(payload, 'base64url').toString('utf-8');
      const parsed = JSON.parse(decoded);

      if (!parsed.sub || !parsed.session_id) {
        throw new AuthError('Invalid token payload');
      }

      const now = Math.floor(Date.now() / 1000);
      if (parsed.exp && parsed.exp < now) {
        throw new AuthError('Token expired');
      }

      return parsed as JWTPayload;
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      throw new AuthError('Token decode failed');
    }
  }

  static extractToken(req: NextRequest): string {
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');

    if (!authHeader) {
      throw new AuthError('Missing authorization header');
    }

    if (!authHeader.startsWith('Bearer ')) {
      throw new AuthError('Invalid authorization header format');
    }

    const token = authHeader.slice(7);
    if (!token) {
      throw new AuthError('Empty access token');
    }

    return token;
  }

  static decodeToken(token: string): JWTPayload {
    return this.decodeJWT(token);
  }
}

export class AuthMiddleware {
  private pool: Pool;

  constructor() {
    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'codetrekking',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    };

    this.pool = new Pool(dbConfig);
  }

  async validateAccessToken(req: NextRequest): Promise<{ user: AuthUser; userId: string; username: string }> {
    try {
      const token = TokenService.extractToken(req);
      const payload = TokenService.decodeToken(token);

      const userId = payload.sub;
      const sessionId = payload.session_id;

      const client = await this.pool.connect();

      try {
        const sessionResult = await client.query(
          `SELECT id, user_id, is_active, refresh_token_expires, revoked_at
           FROM sessions
           WHERE id = $1`,
          [sessionId]
        );

        if (sessionResult.rows.length === 0) {
          throw new AuthError('Session not found');
        }

        const session: AuthSession = sessionResult.rows[0];

        if (!session.is_active) {
          throw new AuthError('Session is inactive');
        }

        if (session.revoked_at) {
          throw new AuthError('Session has been revoked');
        }

        if (new Date() > session.refresh_token_expires) {
          throw new AuthError('Session expired');
        }

        if (session.user_id !== userId) {
          throw new AuthError('Session user mismatch');
        }

        const userResult = await client.query(
          `SELECT id, username, email, is_active, is_verified
           FROM users
           WHERE id = $1`,
          [userId]
        );

        if (userResult.rows.length === 0) {
          throw new AuthError('User not found');
        }

        const user: AuthUser = userResult.rows[0];

        if (!user.is_active) {
          throw new AuthError('User account is disabled', 403);
        }

        return {
          user,
          userId: user.id,
          username: user.username
        };

      } finally {
        client.release();
      }

    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }

      console.error('Auth middleware unexpected error:', error);
      throw new AuthError('Authentication service error', 500);
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

export async function validateAuth(req: NextRequest): Promise<{ user: AuthUser; userId: string; username: string }> {
  const authMiddleware = new AuthMiddleware();
  return authMiddleware.validateAccessToken(req);
}

export { AuthError };