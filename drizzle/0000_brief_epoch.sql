CREATE TABLE "channel_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"channel_id" uuid,
	"tracking_preferences" jsonb DEFAULT '{"content_types":["live","uploads"],"notification_settings":{"live_start":true,"analysis_complete":true,"key_insights":false},"processing_modes":{"real_time":true,"post_stream":true,"batch":false}}'::jsonb,
	"is_favorite" boolean DEFAULT false,
	"subscribed_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "channels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"youtube_channel_id" text NOT NULL,
	"channel_title" text NOT NULL,
	"channel_description" text,
	"custom_url" text,
	"profile_image_url" text,
	"country" text,
	"view_count" bigint DEFAULT 0,
	"subscriber_count" bigint DEFAULT 0,
	"video_count" integer DEFAULT 0,
	"is_verified" boolean DEFAULT false,
	"last_updated" timestamp with time zone DEFAULT now(),
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "channels_youtube_channel_id_unique" UNIQUE("youtube_channel_id")
);
--> statement-breakpoint
CREATE TABLE "processing_queue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stream_id" uuid,
	"user_id" uuid,
	"priority" integer DEFAULT 1,
	"status" text DEFAULT 'queued',
	"queued_at" timestamp with time zone DEFAULT now(),
	"processing_started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"error_message" text,
	"retry_count" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "rate_limits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"action_type" text NOT NULL,
	"count" integer DEFAULT 1,
	"window_start" timestamp with time zone DEFAULT now(),
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "streams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"channel_id" uuid,
	"youtube_url" text NOT NULL,
	"youtube_id" text NOT NULL,
	"title" text,
	"description" text,
	"duration_seconds" integer,
	"view_count" bigint DEFAULT 0,
	"like_count" bigint DEFAULT 0,
	"status" text DEFAULT 'pending',
	"stream_type" text DEFAULT 'upload',
	"is_live" boolean DEFAULT false,
	"transcript" text,
	"analysis_data" jsonb,
	"processing_started_at" timestamp with time zone,
	"processing_completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "streams_youtube_id_unique" UNIQUE("youtube_id")
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"tier" text DEFAULT 'free' NOT NULL,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"status" text DEFAULT 'active',
	"current_period_start" timestamp with time zone,
	"current_period_end" timestamp with time zone,
	"cancel_at_period_end" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "subscriptions_stripe_customer_id_unique" UNIQUE("stripe_customer_id"),
	CONSTRAINT "subscriptions_stripe_subscription_id_unique" UNIQUE("stripe_subscription_id")
);
--> statement-breakpoint
CREATE TABLE "user_analytics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"channel_id" uuid,
	"analysis_type" text NOT NULL,
	"insights" jsonb,
	"time_period" text,
	"period_start" timestamp,
	"period_end" timestamp,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "channel_subscriptions" ADD CONSTRAINT "channel_subscriptions_channel_id_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."channels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "processing_queue" ADD CONSTRAINT "processing_queue_stream_id_streams_id_fk" FOREIGN KEY ("stream_id") REFERENCES "public"."streams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "streams" ADD CONSTRAINT "streams_channel_id_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."channels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_analytics" ADD CONSTRAINT "user_analytics_channel_id_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."channels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_channel_subscriptions_user_channel" ON "channel_subscriptions" USING btree ("user_id","channel_id");