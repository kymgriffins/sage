-- Subscription tiers: free, pro, enterprise
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  tier TEXT NOT NULL DEFAULT 'free', -- free, pro, enterprise
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  status TEXT DEFAULT 'active',
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- YouTube channels to track
CREATE TABLE channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  youtube_channel_id TEXT UNIQUE NOT NULL,
  channel_title TEXT NOT NULL,
  channel_description TEXT,
  custom_url TEXT,
  profile_image_url TEXT,
  country TEXT,
  view_count BIGINT DEFAULT 0,
  subscriber_count BIGINT DEFAULT 0,
  video_count INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User channel subscriptions (which channels user tracks)
CREATE TABLE channel_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  tracking_preferences JSONB DEFAULT '{
    "content_types": ["live", "uploads"],
    "notification_settings": {
      "live_start": true,
      "analysis_complete": true,
      "key_insights": false
    },
    "processing_modes": {
      "real_time": true,
      "post_stream": true,
      "batch": false
    }
  }'::jsonb,
  is_favorite BOOLEAN DEFAULT FALSE,
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, channel_id)
);

-- YouTube streams to analyze
CREATE TABLE streams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  youtube_url TEXT NOT NULL,
  youtube_id TEXT UNIQUE NOT NULL,
  title TEXT,
  description TEXT,
  duration_seconds INTEGER,
  view_count BIGINT DEFAULT 0,
  like_count BIGINT DEFAULT 0,
  status TEXT DEFAULT 'pending', -- pending, processing, completed, failed, cancelled
  stream_type TEXT DEFAULT 'upload', -- 'live', 'upload', 'short'
  is_live BOOLEAN DEFAULT FALSE,
  transcript TEXT,
  analysis_data JSONB, -- Stores trade analysis results
  processing_started_at TIMESTAMP WITH TIME ZONE,
  processing_completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stream processing queue
CREATE TABLE processing_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id UUID REFERENCES streams(id) ON DELETE CASCADE,
  user_id UUID,
  priority INTEGER DEFAULT 1, -- 1-3 (3=highest for live streams)
  status TEXT DEFAULT 'queued', -- queued, processing, completed, failed
  queued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processing_started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0
);

-- Rate limiting table
CREATE TABLE rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  action_type TEXT NOT NULL, -- 'stream_analysis', 'channel_subscription', 'api_call'
  count INTEGER DEFAULT 1,
  window_start TIMESTAMP WITH_TIME_ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH_TIME_ZONE DEFAULT NOW()
);

-- User analytics and insights
CREATE TABLE user_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  analysis_type TEXT NOT NULL, -- 'trade_detection', 'strategy_analysis', 'performance_metrics'
  insights JSONB, -- Store aggregated insights
  time_period TEXT, -- 'daily', 'weekly', 'monthly'
  period_start DATE,
  period_end DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_channel_subscriptions_user_id ON channel_subscriptions(user_id);
CREATE INDEX idx_channel_subscriptions_channel_id ON channel_subscriptions(channel_id);
CREATE INDEX idx_streams_channel_id ON streams(channel_id);
CREATE INDEX idx_streams_user_id ON streams(user_id);
CREATE INDEX idx_streams_status ON streams(status);
CREATE INDEX idx_streams_created_at ON streams(created_at);
CREATE INDEX idx_processing_queue_status ON processing_queue(status);
CREATE INDEX idx_processing_queue_stream_id ON processing_queue(stream_id);
CREATE INDEX idx_channels_youtube_channel_id ON channels(youtube_channel_id);
