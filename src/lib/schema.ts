// Drizzle ORM schema definitions for SAGE database
import { pgTable, uuid, text, timestamp, bigint, integer, boolean, jsonb, serial, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Subscriptions table
export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id'),
  tier: text('tier').default('free').notNull(), // free, pro, enterprise
  stripeCustomerId: text('stripe_customer_id').unique(),
  stripeSubscriptionId: text('stripe_subscription_id').unique(),
  status: text('status').default('active'),
  currentPeriodStart: timestamp('current_period_start', { withTimezone: true }),
  currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Channels table
export const channels = pgTable('channels', {
  id: uuid('id').defaultRandom().primaryKey(),
  youtubeChannelId: text('youtube_channel_id').notNull().unique(),
  channelTitle: text('channel_title').notNull(),
  channelDescription: text('channel_description'),
  customUrl: text('custom_url'),
  profileImageUrl: text('profile_image_url'),
  country: text('country'),
  viewCount: bigint('view_count', { mode: 'number' }).default(0),
  subscriberCount: bigint('subscriber_count', { mode: 'number' }).default(0),
  videoCount: integer('video_count').default(0),
  isVerified: boolean('is_verified').default(false),
  lastUpdated: timestamp('last_updated', { withTimezone: true }).defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// Channel subscriptions table
export const channelSubscriptions = pgTable('channel_subscriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id'),
  channelId: uuid('channel_id').references(() => channels.id, { onDelete: 'cascade' }),
  trackingPreferences: jsonb('tracking_preferences').default({
    content_types: ["live", "uploads"],
    notification_settings: {
      live_start: true,
      analysis_complete: true,
      key_insights: false
    },
    processing_modes: {
      real_time: true,
      post_stream: true,
      batch: false
    }
  }),
  isFavorite: boolean('is_favorite').default(false),
  subscribedAt: timestamp('subscribed_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  userChannelIdx: index('idx_channel_subscriptions_user_channel').on(table.userId, table.channelId),
}));

// Streams table
export const streams = pgTable('streams', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id'),
  channelId: uuid('channel_id').references(() => channels.id, { onDelete: 'cascade' }),
  youtubeUrl: text('youtube_url').notNull(),
  youtubeId: text('youtube_id').notNull().unique(),
  title: text('title'),
  description: text('description'),
  durationSeconds: integer('duration_seconds'),
  viewCount: bigint('view_count', { mode: 'number' }).default(0),
  likeCount: bigint('like_count', { mode: 'number' }).default(0),
  status: text('status').default('pending'), // pending, processing, completed, failed, cancelled
  streamType: text('stream_type').default('upload'), // 'live', 'upload', 'short'
  isLive: boolean('is_live').default(false),
  transcript: text('transcript'),
  analysisData: jsonb('analysis_data'), // Stores trade analysis results
  processingStartedAt: timestamp('processing_started_at', { withTimezone: true }),
  processingCompletedAt: timestamp('processing_completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// Stream processing queue
export const processingQueue = pgTable('processing_queue', {
  id: uuid('id').defaultRandom().primaryKey(),
  streamId: uuid('stream_id').references(() => streams.id, { onDelete: 'cascade' }),
  userId: uuid('user_id'),
  priority: integer('priority').default(1), // 1-3 (3=highest for live streams)
  status: text('status').default('queued'), // queued, processing, completed, failed
  queuedAt: timestamp('queued_at', { withTimezone: true }).defaultNow(),
  processingStartedAt: timestamp('processing_started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  errorMessage: text('error_message'),
  retryCount: integer('retry_count').default(0),
});

// Rate limiting table
export const rateLimits = pgTable('rate_limits', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id'),
  actionType: text('action_type').notNull(), // 'stream_analysis', 'channel_subscription', 'api_call'
  count: integer('count').default(1),
  windowStart: timestamp('window_start', { withTimezone: true }).defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// User analytics and insights
export const userAnalytics = pgTable('user_analytics', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id'),
  channelId: uuid('channel_id').references(() => channels.id, { onDelete: 'cascade' }),
  analysisType: text('analysis_type').notNull(), // 'trade_detection', 'strategy_analysis', 'performance_metrics'
  insights: jsonb('insights'), // Store aggregated insights
  timePeriod: text('time_period'), // 'daily', 'weekly', 'monthly'
  periodStart: timestamp('period_start', { mode: 'date' }),
  periodEnd: timestamp('period_end', { mode: 'date' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// Relations definitions
export const channelsRelations = relations(channels, ({ many }) => ({
  channelSubscriptions: many(channelSubscriptions),
  streams: many(streams),
  analytics: many(userAnalytics),
}));

export const channelSubscriptionsRelations = relations(channelSubscriptions, ({ one }) => ({
  channel: one(channels, {
    fields: [channelSubscriptions.channelId],
    references: [channels.id],
  }),
}));

export const streamsRelations = relations(streams, ({ one, many }) => ({
  channel: one(channels, {
    fields: [streams.channelId],
    references: [channels.id],
  }),
  processingQueue: many(processingQueue),
}));

export const processingQueueRelations = relations(processingQueue, ({ one }) => ({
  stream: one(streams, {
    fields: [processingQueue.streamId],
    references: [streams.id],
  }),
}));

export const userAnalyticsRelations = relations(userAnalytics, ({ one }) => ({
  channel: one(channels, {
    fields: [userAnalytics.channelId],
    references: [channels.id],
  }),
}));
