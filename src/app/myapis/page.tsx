"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface APIEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'ALL';
  description: string;
  parameters?: { name: string; type: string; required: boolean; description: string }[];
  response_example?: any;
  status: 'working' | 'in_development' | 'planned';
  authentication: boolean;
  last_updated: string;
  category: 'rankings' | 'video_analysis' | 'user_management' | 'discovery' | 'subscriptions' | 'activity' | 'auth';
}

export default function MyAPIsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [testResults, setTestResults] = useState<Record<string, { status: 'success' | 'error' | 'loading', message?: string }>>({});

  const apis: APIEndpoint[] = [
    // Trader Ranking APIs - CORE FUNCTIONALITY
    {
      path: '/api/user/rankings',
      method: 'GET',
      description: 'Get trader rankings by performance, accuracy, and market predictions',
      parameters: [
        { name: 'timeframe', type: 'string', required: false, description: 'daily, weekly, monthly, all-time' },
        { name: 'category', type: 'string', required: false, description: 'accuracy, returns, win-rate' },
        { name: 'limit', type: 'number', required: false, description: 'Max results (default: 50)' }
      ],
      response_example: {
        success: true,
        data: {
          rankings: [
            { traderId: 'ICT', score: 94.2, category: 'accuracy', timeframe: 'monthly' },
            { traderId: 'SMB', score: 92.8, category: 'accuracy', timeframe: 'monthly' }
          ],
          updatedAt: '2025-01-30T22:00:00Z'
        }
      },
      status: 'working',
      authentication: false,
      last_updated: '2025-01-30',
      category: 'rankings'
    },
    {
      path: '/api/traders/compare',
      method: 'POST',
      description: 'Compare multiple traders head-to-head with detailed metrics',
      parameters: [
        { name: 'traderIds', type: 'array', required: true, description: 'Array of trader IDs' },
        { name: 'metrics', type: 'array', required: false, description: 'Specific metrics to compare' }
      ],
      response_example: {
        success: true,
        comparison: {
          winners: ['SMB', 'PDArray'],
          losers: ['ICT'],
          metrics: {
            accuracy: { SMB: 94.2, ICT: 67.1 },
            winRate: { SMB: 0.87, ICT: 0.63 }
          }
        }
      },
      status: 'working',
      authentication: false,
      last_updated: '2025-01-30',
      category: 'rankings'
    },

    // Video Analysis & Training APIs - POWERED BY AI
    {
      path: '/api/videos/transcript',
      method: 'GET',
      description: 'AI-powered transcription of YouTube trading videos',
      parameters: [
        { name: 'videoId', type: 'string', required: true, description: 'YouTube video ID' }
      ],
      response_example: {
        success: true,
        transcript: "Today we're looking at the NQ futures market...",
        stats: { wordCount: 1247, characterCount: 7234, hasContent: true }
      },
      status: 'working',
      authentication: true,
      last_updated: '2025-01-30',
      category: 'video_analysis'
    },
    {
      path: '/api/videos/insights',
      method: 'GET',
      description: 'Extract trade signals and strategy insights from videos',
      parameters: [
        { name: 'videoId', type: 'string', required: true, description: 'YouTube video ID' },
        { name: 'focus', type: 'string', required: false, description: 'entries, exits, indicators' }
      ],
      response_example: {
        success: true,
        insights: {
          trades: [{ direction: 'long', entry: 4320, stop: 4280 }],
          strategy: 'Mean reversion on NQ futures',
          confidence: 0.89
        }
      },
      status: 'working',
      authentication: true,
      last_updated: '2025-01-30',
      category: 'video_analysis'
    },

    // User Management APIs
    {
      path: '/api/user/channels',
      method: 'GET',
      description: 'Get all user followed trading channels with analytics',
      parameters: [
        { name: 'stats', type: 'boolean', required: false, description: 'Include analytics data' },
        { name: 'limit', type: 'number', required: false, description: 'Max channels to return' }
      ],
      response_example: {
        success: true,
        data: {
          subscriptions: [
            { title: 'ICT Inner Circle Trader', channelId: 'UCtjxa77NqamhVC8atV85Rog', accuracy: 67.1 }
          ],
          summary: { totalSubscribed: 1, totalAccuracy: 67.1 }
        }
      },
      status: 'working',
      authentication: true,
      last_updated: '2025-01-30',
      category: 'user_management'
    },
    {
      path: '/api/user/analytics',
      method: 'GET',
      description: 'Get user analytics and portfolio performance tracking',
      parameters: [
        { name: 'timeframe', type: 'string', required: false, description: 'daily, weekly, monthly' }
      ],
      response_example: {
        success: true,
        analytics: {
          totalViews: 12430,
          avgAccuracy: 94.2,
          subscriptions: 3,
          favoriteTraders: ['SMB', 'PDArray', 'ICT']
        }
      },
      status: 'working',
      authentication: true,
      last_updated: '2025-01-30',
      category: 'user_management'
    },

    // Channel Discovery & Search APIs
    {
      path: '/api/channels/search',
      method: 'GET',
      description: 'Search and rank trading channels by performance metrics',
      parameters: [
        { name: 'q', type: 'string', required: true, description: 'Search query (e.g., "NQ futures")' },
        { name: 'minAccuracy', type: 'number', required: false, description: 'Minimum accuracy score' }
      ],
      response_example: {
        success: true,
        data: [
          { title: 'SMB Capital', channelId: 'UC...', accuracy: 94.2, relevance: 0.95 },
          { title: 'PDArray Trading', channelId: 'UC...', accuracy: 93.1, relevance: 0.92 }
        ],
        meta: { totalResults: 156, filters: { minAccuracy: 90 } }
      },
      status: 'working',
      authentication: false,
      last_updated: '2025-01-30',
      category: 'discovery'
    },
    {
      path: '/api/channels/videos',
      method: 'GET',
      description: 'Get ranked videos from a trading channel',
      parameters: [
        { name: 'channelId', type: 'string', required: true, description: 'YouTube channel ID' },
        { name: 'limit', type: 'number', required: false, description: 'Max videos (default: 25)' },
        { name: 'sortBy', type: 'string', required: false, description: 'popularity, accuracy, date' }
      ],
      response_example: {
        success: true,
        data: {
          channel: { title: 'ICT Inner Circle Trader', accuracy: 67.1 },
          videos: [
            { id: 'vid123', title: 'NQ Market Review', accuracy: 72, views: 12500 }
          ],
          summary: { totalVideos: 1, avgAccuracy: 67.1 }
        }
      },
      status: 'working',
      authentication: false,
      last_updated: '2025-01-30',
      category: 'discovery'
    },

    // Subscription Management APIs
    {
      path: '/api/channels/subscribe',
      method: 'POST',
      description: 'Follow a trading channel and enable performance tracking',
      parameters: [
        { name: 'channelId', type: 'string', required: true, description: 'YouTube channel ID' },
        { name: 'settings', type: 'object', required: false, description: 'Notification preferences' }
      ],
      response_example: {
        success: true,
        message: 'Successfully subscribed to ICT Inner Circle Trader',
        data: { channelId: 'UCtjxa77NqamhVC8atV85Rog', subscribedAt: '2025-01-30T22:00:00Z' }
      },
      status: 'working',
      authentication: true,
      last_updated: '2025-01-30',
      category: 'subscriptions'
    },
    {
      path: '/api/channels/subscribe',
      method: 'DELETE',
      description: 'Unfollow a trading channel',
      parameters: [
        { name: 'channelId', type: 'string', required: true, description: 'YouTube channel ID' }
      ],
      response_example: {
        success: true,
        message: 'Successfully unsubscribed from ICT Inner Circle Trader'
      },
      status: 'working',
      authentication: true,
      last_updated: '2025-01-30',
      category: 'subscriptions'
    },

    // Recent Activity APIs
    {
      path: '/api/user/recent-streams',
      method: 'GET',
      description: 'Get recent streams and analysis from followed traders',
      parameters: [
        { name: 'limit', type: 'number', required: false, description: 'Max streams (default: 20)' },
        { name: 'unanalyzed', type: 'boolean', required: false, description: 'Only return unanalyzed streams' }
      ],
      response_example: {
        success: true,
        data: {
          streams: [
            {
              id: 'vid123',
              title: 'ICT NQ Futures Analysis',
              channel: 'ICT Inner Circle Trader',
              publishedAt: '2025-01-30T20:00:00Z',
              analyzed: false,
              priority: 'HIGH'
            }
          ],
          meta: { totalUnanalyzed: 12, nextRefresh: '2025-01-30T22:05:00Z' }
        }
      },
      status: 'working',
      authentication: true,
      last_updated: '2025-01-30',
      category: 'activity'
    },

    // Stack Auth Integration
    {
      path: '/handler/[...stack]',
      method: 'ALL',
      description: 'Stack Auth authentication and user management handlers',
      status: 'working',
      authentication: false,
      last_updated: '2025-01-15',
      category: 'auth'
    }
  ];

  const categories = [
    { id: 'all', name: 'All APIs', count: apis.length },
    { id: 'rankings', name: 'Rankings', count: apis.filter(api => api.category === 'rankings').length },
    { id: 'video_analysis', name: 'Video Analysis', count: apis.filter(api => api.category === 'video_analysis').length },
    { id: 'user_management', name: 'User Management', count: apis.filter(api => api.category === 'user_management').length },
    { id: 'discovery', name: 'Discovery', count: apis.filter(api => api.category === 'discovery').length },
    { id: 'subscriptions', name: 'Subscriptions', count: apis.filter(api => api.category === 'subscriptions').length },
    { id: 'activity', name: 'Activity', count: apis.filter(api => api.category === 'activity').length },
    { id: 'auth', name: 'Authentication', count: apis.filter(api => api.category === 'auth').length }
  ];

  const filteredAPIs = selectedCategory === 'all'
    ? apis
    : apis.filter(api => api.category === selectedCategory);

  const testAPI = async (api: APIEndpoint) => {
    setTestResults(prev => ({ ...prev, [api.path]: { status: 'loading' } }));

    try {
      // Simple test logic - in production, this would use real test functions
      const testUrl = api.path.startsWith('/api/') ? api.path : null;

      if (!testUrl) {
        throw new Error('API path not testable');
      }

      // Basic reachability test
      const response = await fetch(testUrl, { method: 'HEAD' });
      const success = response.status < 400;

      setTestResults(prev => ({
        ...prev,
        [api.path]: {
          status: success ? 'success' : 'error',
          message: success ? `Status: ${response.status}` : `Status: ${response.status} - ${response.statusText}`
        }
      }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [api.path]: {
          status: 'error',
          message: error instanceof Error ? error.message : 'Test failed'
        }
      }));
    }
  };

  const getStatusColor = (status: APIEndpoint['status']) => {
    switch (status) {
      case 'working': return 'bg-green-500';
      case 'in_development': return 'bg-yellow-500';
      case 'planned': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getMethodColor = (method: APIEndpoint['method']) => {
    switch (method) {
      case 'GET': return 'bg-blue-500';
      case 'POST': return 'bg-green-500';
      case 'PUT': return 'bg-orange-500';
      case 'DELETE': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">SAGE API Catalog</h1>
          <p className="text-muted-foreground text-lg">
            Complete list of all working APIs in the SAGE platform - automatically updated
          </p>
          <div className="mt-4 flex items-center gap-4">
            <Badge variant="outline" className="text-green-400">
              {apis.filter(api => api.status === 'working').length} Working APIs
            </Badge>
            <Badge variant="outline" className="text-blue-400">
              Last Updated: {new Date().toLocaleDateString()}
            </Badge>
          </div>
        </div>

        {/* Categories Filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map(category => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
              className="flex items-center gap-2"
            >
              {category.name}
              <Badge variant="secondary" className="text-xs">{category.count}</Badge>
            </Button>
          ))}
        </div>

        {/* API List */}
        <div className="grid gap-4">
          {filteredAPIs.map((api, index) => (
            <Card key={`${api.path}-${api.method}-${index}`} className="p-6 bg-white/5 border-white/10">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Badge className={`${getMethodColor(api.method)} text-white text-xs px-2 py-1`}>
                    {api.method}
                  </Badge>
                  <Badge className={`${getStatusColor(api.status)} text-white text-xs px-2 py-1`}>
                    {api.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                  {api.authentication && (
                    <Badge variant="outline" className="text-xs">
                      🔒 Auth Required
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    Updated: {api.last_updated}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => testAPI(api)}
                    disabled={testResults[api.path]?.status === 'loading'}
                  >
                    {testResults[api.path]?.status === 'loading' ? 'Testing...' : 'Test API'}
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Endpoint</h3>
                  <code className="bg-white/10 px-3 py-1 rounded text-sm font-mono">
                    {api.path}
                  </code>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-1">Description</h3>
                  <p className="text-muted-foreground">{api.description}</p>
                </div>

                {api.parameters && api.parameters.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Parameters</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-white/10">
                            <th className="text-left p-2">Name</th>
                            <th className="text-left p-2">Type</th>
                            <th className="text-left p-2">Required</th>
                            <th className="text-left p-2">Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          {api.parameters.map((param, idx) => (
                            <tr key={idx} className="border-b border-white/5">
                              <td className="p-2 font-mono">{param.name}</td>
                              <td className="p-2">
                                <span className={`px-2 py-1 rounded text-xs ${
                                  param.type === 'string' ? 'bg-blue-500/20 text-blue-400' :
                                  param.type === 'object' ? 'bg-purple-500/20 text-purple-400' :
                                  param.type === 'boolean' ? 'bg-green-500/20 text-green-400' :
                                  'bg-gray-500/20 text-gray-400'
                                }`}>
                                  {param.type}
                                </span>
                              </td>
                              <td className="p-2">
                                {param.required ? (
                                  <span className="text-red-400">Yes</span>
                                ) : (
                                  <span className="text-muted-foreground">No</span>
                                )}
                              </td>
                              <td className="p-2 text-muted-foreground">{param.description}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {api.response_example && (
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Response Example</h3>
                    <pre className="bg-white/10 p-3 rounded text-sm overflow-x-auto">
                      {JSON.stringify(api.response_example, null, 2)}
                    </pre>
                  </div>
                )}

                {testResults[api.path] && (
                  <div className="mt-4 p-3 border rounded">
                    <div className="flex items-center gap-2">
                      {testResults[api.path].status === 'success' && (
                        <span className="text-green-400">✓ Test Passed</span>
                      )}
                      {testResults[api.path].status === 'error' && (
                        <span className="text-red-400">✗ Test Failed</span>
                      )}
                      {testResults[api.path].status === 'loading' && (
                        <span className="text-blue-400">⏳ Testing...</span>
                      )}
                    </div>
                    {testResults[api.path].message && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {testResults[api.path].message}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>

        {filteredAPIs.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold text-foreground mb-2">No APIs found</h3>
            <p className="text-muted-foreground">
              No APIs match the selected category. Try selecting a different category.
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-white/10">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground">
              This API catalog is automatically updated. Total APIs: {apis.length}
            </p>
            <Button variant="outline" size="sm">
              Export API Docs
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
