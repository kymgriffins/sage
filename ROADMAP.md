# YouTube Sage MVP Roadmap

## Overview
YouTube Sage is a trading intelligence platform that allows users to discover, follow, and get automated analysis of trading education streams from YouTube channels.

## MVP Features (Phase 1)

### ✅ Completed Core Infrastructure
- [x] User authentication system (Stack)
- [x] Database schema (users, channels, subscriptions, streams, analytics)
- [x] Subscription tiers (Free: 3/month, Pro: 50/month, Enterprise: unlimited)
- [x] YouTube channel search with API integration + mock data fallback
- [x] Channel subscription/following system with database persistence
- [x] Basic dashboard UI with overview, channels, discover, analytics tabs
- [x] Responsive UI with dark theme using shadcn/ui components

### 🔄 In Progress / Next Priority Features

#### 1. Stream Discovery & Processing Pipeline
- [ ] Implement YouTube playlist/channels API integration to fetch videos
- [ ] Detect new streams from subscribed channels automatically
- [ ] Filter streams by content type (live, uploads, shorts) based on user preferences
- [ ] Stream metadata extraction (title, description, duration, view counts)
- [ ] Queue streams for processing with priority system

#### 2. Stream Analysis Engine
- [ ] YouTube API integration for getting captions/transcripts
- [ ] Transcript parsing and text cleaning
- [ ] Trade signal detection patterns (buy/sell signals, entry/exit points)
- [ ] Market analysis extraction (indicators, strategies, timeframes mentioned)
- [ ] Sentiment analysis and key insights generation
- [ ] Store analysis results in database

#### 3. Enhanced Dashboard Content
- [ ] Recent streams analysis view in dashboard
- [ ] Stream-specific analytics pages
- [ ] Trade signals history and visualization
- [ ] Performance metrics across channels
- [ ] Real-time processing status updates

#### 4. Processing Management
- [ ] Processing queue dashboard for users
- [ ] Processing priority settings (live streams get highest priority)
- [ ] Rate limiting and quota management
- [ ] Error handling and retry logic for failed analyses

### 📋 MVP Success Criteria
- Users can search and follow trading channels
- **Primary Goal: Automated analysis of streams from followed channels appears in dashboard**
- Basic trade detection works on sample streams
- Dashboard shows processed content with insights
- Free tier: 3 streams/month, Pro: 50/month working

### 🚀 Post-MVP Features (Phase 2+)
- Advanced analytics with charts and trends
- Export capabilities (PDF reports, CSV data)
- Real-time live stream analysis
- API access for enterprise users
- Custom analysis templates
- Multi-channel comparison tools
- Automated updates when traders post new content

### 🛠 Technical Debt & Improvements
- Add comprehensive error handling and logging
- Implement proper caching for API calls
- Add database indexing and query optimization
- Implement proper API versioning
- Add comprehensive testing suite
- Performance monitoring and metrics

### 📅 Timeline Estimate
**Week 1:** Complete stream discovery pipeline
**Week 2:** Basic transcript analysis and trade detection
**Week 3:** Dashboard integration and UI polish
**Week 4:** Testing, bug fixes, and MVP launch preparation

---

## Architecture Notes

### Current Stack
- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Next.js API routes, Stack authentication
- **Database:** Postgres via Neon, Drizzle ORM
- **APIs:** YouTube Data API v3

### Data Flow for MVP
1. User searches for trading channels → Gets channel list
2. User follows channels → Stores in subscriptions table
3. Background job fetches new videos from followed channels → Queues for processing
4. Processing pipeline fetches transcripts → Analyzes for trade signals → Stores results
5. Dashboard queries analysis results → Displays insights to user

### Key Integration Points
- YouTube API quota management (cost optimization)
- Stream processing prioritization (live > recent uploads > old content)
- Rate limiting per user tier
- Error recovery and retry mechanisms
