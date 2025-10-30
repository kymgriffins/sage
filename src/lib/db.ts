// Database connection and Drizzle ORM setup
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

// Create database connection
const sql = neon(process.env.DATABASE_URL!);

// Create drizzle instance with schema
export const db = drizzle(sql, { schema });

// Export schema types for type safety
export type NewChannel = typeof schema.channels.$inferInsert;
export type Channel = typeof schema.channels.$inferSelect;
export type NewChannelSubscription = typeof schema.channelSubscriptions.$inferInsert;
export type ChannelSubscription = typeof schema.channelSubscriptions.$inferSelect;
export type NewSubscription = typeof schema.subscriptions.$inferInsert;
export type Subscription = typeof schema.subscriptions.$inferSelect;
export type NewStream = typeof schema.streams.$inferInsert;
export type Stream = typeof schema.streams.$inferSelect;
export type NewProcessingQueue = typeof schema.processingQueue.$inferInsert;
export type ProcessingQueue = typeof schema.processingQueue.$inferSelect;
export type NewRateLimit = typeof schema.rateLimits.$inferInsert;
export type RateLimit = typeof schema.rateLimits.$inferSelect;
export type NewUserAnalytics = typeof schema.userAnalytics.$inferInsert;
export type UserAnalytics = typeof schema.userAnalytics.$inferSelect;
