export const TIER_LIMITS = {
  free: {
    streams_per_month: 3,
    features: ['basic_analysis', 'community_streams'],
    rate_limit: '10 req/hour'
  },
  pro: {
    streams_per_month: 50,
    features: ['advanced_analysis', 'export_data', 'priority_processing'],
    rate_limit: '100 req/hour'
  },
  enterprise: {
    streams_per_month: -1, // unlimited
    features: ['white_label', 'api_access', 'dedicated_support'],
    rate_limit: '1000 req/hour'
  }
}
