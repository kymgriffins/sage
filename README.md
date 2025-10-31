# 🎯 YouTube Sage - Trading Education Analysis Platform

**Transforming trading education into a meritocratic ranking system where traders are judged by actual market performance, not hype.**

YouTube Sage provides data-driven comparison of trading educators based on real trading results rather than marketing claims. It's the ultimate competitive platform for trading education streamers.

## ✨ Features

- 🔐 **Authentication**: Secure user management with Stack
- 📺 **YouTube Integration**: Channel search, subscription, and video tracking
- 📊 **Market Data**: Real-time stock analysis with multiple providers
- 🎨 **Modern UI**: Responsive design with dark theme support
- 🗄️ **Database**: Comprehensive PostgreSQL schema with Drizzle ORM
- ⚡ **API**: RESTful endpoints with proper error handling
- 📱 **Mobile-First**: Fully responsive across all devices

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (Neon recommended)
- YouTube Data API v3 key
- Market data API keys (optional)

### Installation

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd sage
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your API keys
   ```

3. **Set up the database:**
   ```bash
   # Generate and push database schema
   npm run db:generate
   npm run db:push
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000)**

## 🔧 Environment Variables

Copy `.env.example` to `.env.local` and configure:

```bash
# Required
DATABASE_URL="postgresql://..."
YOUTUBE_API_KEY="AIzaSy..."

# Optional (enhance functionality)
OPENAI_API_KEY="sk-..."
ALPHA_VANTAGE_API_KEY="..."
POLYGON_API_KEY="..."
```

## 📁 Project Structure

```
sage/
├── src/
│   ├── app/                 # Next.js app router
│   │   ├── api/            # API routes
│   │   ├── dashboard/      # Dashboard pages
│   │   └── layout.tsx      # Root layout
│   ├── components/         # Reusable UI components
│   ├── lib/               # Utilities and configurations
│   └── types/             # TypeScript definitions
├── drizzle/               # Database migrations
├── public/               # Static assets
└── APP_FINALIZATION_CHECKLIST.md  # Launch preparation guide
```

## 🗄️ Database Schema

The app uses a comprehensive PostgreSQL schema with:

- **Users & Subscriptions**: Tier-based access control
- **Channels & Streams**: YouTube content tracking
- **Analytics**: Performance insights and metrics
- **Processing Queue**: Background job management

Run `npm run db:push` to deploy the schema.

## 🎯 Core Functionality

### User Management
- Registration and authentication via Stack
- Subscription tiers (Free/Pro/Enterprise)
- Profile management

### Channel Tracking
- Search YouTube trading channels
- Subscribe to channels for tracking
- Automatic video discovery

### Market Analysis
- Real-time stock data integration
- Multiple data providers
- Technical analysis tools

### Dashboard
- Overview of subscribed channels
- Analytics and insights
- Settings management

## 🧪 Testing

```bash
# Run build to check for errors
npm run build

# Database operations
npm run db:generate  # Generate migrations
npm run db:push      # Push schema changes
npm run db:migrate   # Run migrations
```

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect your repository to Vercel**
2. **Set environment variables in Vercel dashboard**
3. **Deploy automatically on push**

### Manual Deployment

```bash
# Build for production
npm run build

# Start production server
npm start
```

## 📚 API Reference

### Authentication Endpoints
- `POST /handler/[...stack]` - Stack authentication

### Channel Management
- `GET /api/channels/search` - Search YouTube channels
- `POST /api/channels/subscribe` - Subscribe to channel
- `GET /api/user/channels` - Get user subscriptions

### Market Data
- `GET /api/market-data` - Fetch market data

### User Analytics
- `GET /api/user/analytics` - User analytics
- `GET /api/user/recent-streams` - Recent streams

## 🛠️ Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:generate  # Generate database migrations
npm run db:push      # Push database schema
npm run db:migrate   # Run database migrations
```

### Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Database**: PostgreSQL, Drizzle ORM
- **Authentication**: Stack
- **APIs**: YouTube Data API, Market Data APIs
- **Deployment**: Vercel

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and build
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For questions or issues:
- Check the [APP_FINALIZATION_CHECKLIST.md](./APP_FINALIZATION_CHECKLIST.md) for setup help
- Review the [ROADMAP.md](./ROADMAP.md) for planned features
- Open an issue for bugs or feature requests

---

**🎉 Ready to revolutionize trading education analysis!**
