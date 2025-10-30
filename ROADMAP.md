# YouTube Sage MVP Roadmap

## Overview
YouTube Sage is the ultimate competitive platform for trading education streamers. It transforms the trading education space into a meritocratic ranking system where traders are judged by their actual market performance, content quality, and follower impact. **It's the dick measuring contest for traders** - where followers get unbiased data to compare who's truly the best.

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

#### 4. Competitive Ranking System
- [ ] **🏆 Trader Leaderboards**: Rank by performance, accuracy, follower growth
- [ ] **📊 Reality Check Metrics**: Claimed win-rate vs actual results
- [ ] **🤥 BS Detection**: Algorithm flags unprovable claims
- [ ] **🔍 Fact Checking**: Automated verification of trading strategies
- [ ] **🏅 Hall of Shame**: Traders with repeated market timing failures
- [ ] **🎯 Egg on Face Index**: Public score for obviously wrong predictions

#### 5. Processing Management
- [ ] Processing queue dashboard for users
- [ ] Processing priority settings (live streams get highest priority)
- [ ] Rate limiting and quota management
- [ ] Error handling and retry logic for failed analyses

### 📋 MVP Success Criteria
- **🏆 COMPETITIVE RANKING SYSTEM: Traders ranked by performance, insights, follower growth**
- **🐔 EGG ON FACE PREVENTION: Obvious failures get called out, winner takes all gets questioned**
- Users can search and compare trading educators head-to-head
- **Primary Goal: Data-driven comparison replaces hype and marketing**
- Comprehensive channel analytics and performance metrics
- Dashboard shows actual results vs promised outcomes
- **🎯-by-Market Reality Check**: Claims vs real trading performance

### 🚀 Post-MVP Features (Phase 2+) - **The Dick Measuring Contests Begin**

#### Competitive Features
- **🥇 Hall of Fame vs 🏅 Hall of Shame**: Separate leaderboards for winners and losers
- **🤝 Head-to-Head Battles**: Direct trader comparison dashboards
- **📈 Performance Streaks**: Win/loss tracking over time periods
- **🎯 Prediction Accuracy Scoring**: Market calls vs outcomes
- **💰 Profitability Rankings**: Based on claimed vs actual results
- **📊 User Vote Weights**: Community moderation of rankings

#### Advanced Analytics
- **🐔 Egg on Face Tracker**: Automated detection of wrong predictions
- **🤥 BS Meter**: Flags impossible or unprovable claims
- **🎪 Performance Streaks Dashboard**: Winners never quit, losers do
- **🏆 Trader Championships**: Seasonal competitions
- **📱 Mobile Rankings App**: Check your favorites on the go

#### Community Features
- **🗳️ Trader Elections**: User-voted rankings
- **💬 Discussion Forums**: "Why did XYZ get called out?"
- **🏷️ Trader Tags**: "Reliable", "Hype Train", "True Believer"
- **📈 Growth Trackers**: Measure influence over time
- **🎪 Reality TV**: Live tracking of trader predictions

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
