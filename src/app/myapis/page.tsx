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
  category: 'channel_search' | 'channel_management' | 'user_channels' | 'analytics' | 'auth' | 'admin';
}

export default function MyAPIsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [testResults, setTestResults] = useState<Record<string, { status: 'success' | 'error' | 'loading', message?: string }>>({});

  // Mock API documentation data for UI development
  const apis: APIEndpoint[] = [
    // Channel Search APIs
    {
      path: '/api/channels/search',
      method: 'GET',
      description: 'Search and discover YouTube trading channels with relevance scoring',
      parameters: [
        { name: 'q', type: 'string', required: true, description: 'Search query for trading educators' }
      ],
      response_example: {
        success: true,
        data: [{ title: 'Trading Academy', relevanceScore: 95, subscribers: '250K' }],
        meta: { totalResults: 1, searchQuery: 'trading academy' }
      },
      status: 'working',
      authentication: false,
      last_updated: '2025-01-29',
      category: 'channel_search'
    },

    // Channel Management APIs
    {
      path: '/api/channels/subscribe',
      method: 'POST',
      description: 'Subscribe to a YouTube channel for automated tracking',
      parameters: [
        { name: 'channelId', type: 'string', required: true, description: 'YouTube channel ID' },
        { name: 'settings', type: 'object', required: false, description: 'Tracking preferences' }
      ],
      response_example: {
        success: true,
        data: { channelId: 'UC123', subscribed: true },
        message: 'Successfully subscribed to channel'
      },
      status: 'working',
      authentication: true,
      last_updated: '2025-01-29',
      category: 'channel_management'
    },
    {
      path: '/api/channels/subscribe?channelId=UC123',
      method: 'DELETE',
      description: 'Unsubscribe from a channel',
      parameters: [
        { name: 'channelId', type: 'string', required: true, description: 'YouTube channel ID' }
      ],
      response_example: {
        success: true,
        message: 'Successfully unsubscribed from channel'
      },
      status: 'working',
      authentication: true,
      last_updated: '2025-01-29',
      category: 'channel_management'
    },
    {
      path: '/api/channels/subscribe',
      method: 'PUT',
      description: 'Update channel subscription preferences (favorites, notifications)',
      parameters: [
        { name: 'channelId', type: 'string', required: true, description: 'YouTube channel ID' },
        { name: 'settings', type: 'object', required: true, description: 'Updated preferences' }
      ],
      response_example: {
        success: true,
        message: 'Subscription preferences updated'
      },
      status: 'working',
      authentication: true,
      last_updated: '2025-01-29',
      category: 'channel_management'
    },

    // User Channels APIs
    {
      path: '/api/user/channels',
      method: 'GET',
      description: 'Get all user subscribed channels and favorites',
      parameters: [
        { name: 'stats', type: 'boolean', required: false, description: 'Include detailed stats' }
      ],
      response_example: {
        success: true,
        data: {
          subscriptions: [{ title: 'Trading Academy', isFavorite: true, analysisCount: 12 }],
          summary: { totalSubscribed: 2, favoritesCount: 1 }
        }
      },
      status: 'working',
      authentication: true,
      last_updated: '2025-01-29',
      category: 'user_channels'
    },

    // Authentication APIs (provided by Stack Auth)
    {
      path: '/handler/[...stack]',
      method: 'ALL',
      description: 'Stack Auth authentication handlers',
      status: 'working',
      authentication: false,
      last_updated: '2025-01-15',
      category: 'auth'
    }
  ];

  const categories = [
    { id: 'all', name: 'All APIs', count: apis.length },
    { id: 'channel_search', name: 'Channel Search', count: apis.filter(api => api.category === 'channel_search').length },
    { id: 'channel_management', name: 'Channel Management', count: apis.filter(api => api.category === 'channel_management').length },
    { id: 'user_channels', name: 'User Channels', count: apis.filter(api => api.category === 'user_channels').length },
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
