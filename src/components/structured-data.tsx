import { Metadata } from 'next'

interface StructuredDataProps {
  type?: 'website' | 'software' | 'organization'
}

// Generate structured data (JSON-LD) for rich snippets
export function StructuredData({ type = 'software' }: StructuredDataProps) {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'SAGE AI',
    description: 'AI-powered trading stream analysis platform',
    url: 'https://sage-ai.com',
    logo: 'https://sage-ai.com/logo.png',
    sameAs: [
      'https://twitter.com/sage_ai',
      'https://linkedin.com/company/sage-ai'
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: 'support@sage-ai.com'
    }
  }

  const softwareSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'SAGE AI',
    description: 'AI-powered trading stream analysis platform that extracts trading insights from YouTube streams in seconds.',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web Browser',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      description: 'Free tier available'
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '1200',
      bestRating: '5',
      worstRating: '1'
    },
    featureList: [
      'Real-time YouTube stream analysis',
      'AI-powered trade detection',
      'Strategy pattern recognition',
      'Performance metrics calculation',
      'Export capabilities'
    ]
  }

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'SAGE AI',
    description: 'AI-powered trading stream analysis platform',
    url: 'https://sage-ai.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://sage-ai.com/search?q={search_term_string}',
      'query-input': 'required name=search_term_string'
    }
  }

  const getSchema = () => {
    switch (type) {
      case 'organization':
        return organizationSchema
      case 'software':
        return softwareSchema
      case 'website':
        return websiteSchema
      default:
        return softwareSchema
    }
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(getSchema(), null, 2),
      }}
    />
  )
}

// Component for FAQ structured data
export function FAQStructuredData({ faqs }: { faqs: Array<{ question: string; answer: string }> }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schema, null, 2),
      }}
    />
  )
}

// Component for breadcrumb structured data
export function BreadcrumbStructuredData({ items }: { items: Array<{ name: string; url: string }> }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schema, null, 2),
      }}
    />
  )
}

export default StructuredData
