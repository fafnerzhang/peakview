import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: 'Environment configuration debug',
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    timestamp: new Date().toISOString()
  });
}