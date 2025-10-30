// Authentication utilities and session management for SAGE
// Server-side authentication utilities
import { NextRequest } from 'next/server';
import { stackServerApp } from '@/stack/server';

export async function isAuthenticated(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser({
      tokenStore: request,
      or: 'return-null'
    });
    return user;
  } catch (error) {
    console.error('Authentication failed:', error);
    return null;
  }
}
