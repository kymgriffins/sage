// Authentication utilities and session management for SAGE
import { useUser, useStackApp } from "@stackframe/stack";
import { useState, useEffect } from "react";

// Session persistence hook
export function useAuth() {
  const user = useUser();
  const app = useStackApp();

  return {
    user,
    isSignedIn: !!user,
    isLoading: user === null && app !== null,
    app,
  };
}

// User role and permissions hook
export function useUserPermissions() {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState({
    canAnalyze: false,
    canAccessApi: false,
    canExportData: false,
    analysisLimit: 0,
    currentUsage: 0,
  });

  useEffect(() => {
    if (user) {
      // Fetch user subscription and permissions from database
      const fetchPermissions = async () => {
        try {
          // This would typically fetch from your database
          // For now, we'll set basic permissions based on user existence
          setPermissions({
            canAnalyze: true,
            canAccessApi: false, // Set based on subscription tier
            canExportData: true,
            analysisLimit: 5, // Default free tier limit
            currentUsage: 0,
          });
        } catch (error) {
          console.error('Failed to fetch user permissions:', error);
        }
      };

      fetchPermissions();
    }
  }, [user]);

  return permissions;
}

// Rate limiting hook
export function useRateLimit(actionType: string) {
  const { user } = useAuth();
  const [rateLimit, setRateLimit] = useState({
    remaining: 0,
    resetTime: 0,
    canProceed: false,
  });

  useEffect(() => {
    if (user && actionType) {
      // Check rate limit from database/cache
      const checkRateLimit = async () => {
        try {
          // This would typically check Redis or database for rate limits
          setRateLimit({
            remaining: 5, // Example remaining analyses
            resetTime: Date.now() + 3600000, // 1 hour from now
            canProceed: true,
          });
        } catch (error) {
          console.error('Failed to check rate limit:', error);
        }
      };

      checkRateLimit();
    }
  }, [user, actionType]);

  return rateLimit;
}

// Subscription management hook
export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState({
    tier: 'free',
    status: 'active',
    currentPeriodEnd: null,
    isActive: false,
  });

  useEffect(() => {
    if (user) {
      // Fetch subscription status
      const fetchSubscription = async () => {
        try {
          // This would fetch from Stripe/Stripe metadata
          setSubscription({
            tier: 'free',
            status: 'active',
            currentPeriodEnd: null,
            isActive: true,
          });
        } catch (error) {
          console.error('Failed to fetch subscription:', error);
        }
      };

      fetchSubscription();
    }
  }, [user]);

  return subscription;
}

// Sign out utility
export function useSignOut() {
  const app = useStackApp();

  const signOut = () => {
    try {
      // Stack Auth handles sign out automatically via UserButton
      // Navigate to home after sign out
      window.location.href = '/';
    } catch (error) {
      console.error('Sign out navigation failed:', error);
    }
  };

  return signOut;
}

// Export all auth utilities for easy importing
export * from './auth';
