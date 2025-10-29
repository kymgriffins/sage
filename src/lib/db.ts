// Database connection and Drizzle ORM setup
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

// Create database connection
const sql = neon(process.env.DATABASE_URL!);

// Create drizzle instance with schema
export const db = drizzle(sql, { schema });

// Export schema types for type safety
export type NewUser = typeof schema.users.$inferInsert;
export type User = typeof schema.users.$inferSelect;
export type NewChannel = typeof schema.channels.$inferInsert;
export type Channel = typeof schema.channels.$inferSelect;
export type NewSubscription = typeof schema.channelSubscriptions.$inferInsert;
export type Subscription = typeof schema.channelSubscriptions.$inferSelect;
export type NewStream = typeof schema.streams.$inferInsert;
