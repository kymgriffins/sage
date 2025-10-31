export const TIER_LIMITS = {
  free: {
    streams_per_month: 3,
    features: ['basic_analysis', 'community_streams'],
    rate_limit: '10 req/hour'
  },
  pro: {
    streams_per_month: 50,
    features: ['advanced_analysis', 'export_data', 'priority_processing'],
    rate_limit: '100 req/hour'
  },
  enterprise: {
    streams_per_month: -1, // unlimited
    features: ['white_label', 'api_access', 'dedicated_support'],
    rate_limit: '1000 req/hour'
  }
}

// Rate limiting configuration for stock market data
export const MARKET_DATA_LIMITS = {
  free: {
    'market-data': 50, // 50 stock analysis requests per hour (increased for development)
  },
  pro: {
    'market-data': 100,  // 100 stock analysis requests per hour
  },
  enterprise: {
    'market-data': 1000,  // 1000 stock analysis requests per hour
  }
} as const;

// In-memory rate limiting store (in production, use Redis/database)
interface RateLimitEntry {
  count: number;
  resetTime: Date;
}

class RateLimitStore {
  private store = new Map<string, RateLimitEntry>();

  private getKey(userId: string, endpoint: string): string {
    return `${userId}:${endpoint}`;
  }

  get(userId: string, endpoint: string): RateLimitEntry | undefined {
    const key = this.getKey(userId, endpoint);
    const entry = this.store.get(key);

    // Clean up expired entries
    if (entry && entry.resetTime < new Date()) {
      this.store.delete(key);
      return undefined;
    }

    return entry;
  }

  set(userId: string, endpoint: string, entry: RateLimitEntry): void {
    const key = this.getKey(userId, endpoint);
    this.store.set(key, entry);
  }

  delete(userId: string, endpoint: string): void {
    const key = this.getKey(userId, endpoint);
    this.store.delete(key);
  }
}

export class RateLimiter {
  private static store = new RateLimitStore();
  private static readonly WINDOW_MS = 60 * 60 * 1000; // 1 hour

  static async checkLimit(
    userId: string,
    endpoint: 'market-data',
    tier: 'free' | 'pro' | 'enterprise' = 'free'
  ): Promise<{
    allowed: boolean;
    remaining: number;
    limit: number;
    resetTime: Date;
    message?: string;
    retryAfter?: number;
  }> {
    const limit = MARKET_DATA_LIMITS[tier][endpoint];
    const key = `${userId}:${endpoint}:${tier}`;

    const now = new Date();
    const resetTime = new Date(now.getTime() + this.WINDOW_MS);
    const entry = this.store.get(key, endpoint);

    if (!entry || entry.resetTime < now) {
      // New or expired window
      const remaining = limit - 1;
      const newEntry: RateLimitEntry = {
        count: 1,
        resetTime
      };

      this.store.set(key, endpoint, newEntry);

      return {
        allowed: true,
        remaining,
        limit,
        resetTime,
      };
    }

    const remaining = Math.max(0, limit - entry.count);

    if (entry.count >= limit) {
      // Rate limit exceeded
      const retryAfter = Math.ceil((entry.resetTime.getTime() - now.getTime()) / 1000);

      return {
        allowed: false,
        remaining: 0,
        limit,
        resetTime: entry.resetTime,
        message: `Rate limit exceeded. ${tier} tier allows ${limit} stock analysis requests per hour. Upgrade to Pro for higher limits.`,
        retryAfter,
      };
    }

    return {
      allowed: true,
      remaining: remaining - 1, // Account for this request
      limit,
      resetTime: entry.resetTime,
    };
  }

  static async recordRequest(
    userId: string,
    endpoint: 'market-data',
    tier: 'free' | 'pro' | 'enterprise' = 'free'
  ): Promise<void> {
    const key = `${userId}:${endpoint}:${tier}`;
    const entry = this.store.get(key, endpoint);

    if (entry) {
      entry.count += 1;
      this.store.set(key, endpoint, entry);
    }
  }
}
