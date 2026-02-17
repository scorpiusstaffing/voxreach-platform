import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  section?: string;
  tags?: string[];
  canonical?: string;
  noindex?: boolean;
  nofollow?: boolean;
}

/**
 * SEO Component for dynamic meta tags
 * Usage: <SEO title="Page Title" description="Page description" />
 */
export function SEO({
  title = 'VoxReach AI Voice Agents | Enterprise-Grade AI Calling Software',
  description = 'Deploy enterprise AI voice agents in minutes. Make outbound calls at scale or never miss inbound calls. 24/7 AI phone agents for sales, support & appointment setting.',
  keywords = 'AI voice agent, voice agents, AI call, automated calling, outbound calling software, inbound call answering AI, sales call automation, customer service AI phone',
  image = 'https://voxreach.io/assets/og-image.png',
  url = 'https://voxreach.io',
  type = 'website',
  publishedTime,
  modifiedTime,
  author = 'VoxReach',
  section,
  tags = [],
  canonical,
  noindex = false,
  nofollow = false,
}: SEOProps) {
  const fullTitle = title.includes('VoxReach') ? title : `${title} | VoxReach`;
  const fullUrl = canonical || url;
  const robots = [];
  
  if (noindex) robots.push('noindex');
  if (nofollow) robots.push('nofollow');
  if (robots.length === 0) robots.push('index, follow');

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={author} />
      <meta name="robots" content={robots.join(', ')} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="VoxReach" />
      
      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={fullUrl} />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={image} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={fullUrl} />
      
      {/* Article-specific meta tags */}
      {type === 'article' && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {type === 'article' && modifiedTime && (
        <meta property="article:modified_time" content={modifiedTime} />
      )}
      {type === 'article' && author && (
        <meta property="article:author" content={author} />
      )}
      {type === 'article' && section && (
        <meta property="article:section" content={section} />
      )}
      {type === 'article' && tags.length > 0 && (
        tags.map(tag => (
          <meta key={tag} property="article:tag" content={tag} />
        ))
      )}
      
      {/* Additional SEO */}
      <meta name="language" content="English" />
      <meta name="revisit-after" content="7 days" />
      <meta name="rating" content="General" />
    </Helmet>
  );
}

/**
 * Predefined SEO configurations for common pages
 */
export const pageSEO = {
  home: {
    title: 'VoxReach AI Voice Agents | Enterprise-Grade AI Calling Software',
    description: 'Deploy enterprise AI voice agents in minutes. Make outbound calls at scale or never miss inbound calls. 24/7 AI phone agents for sales, support & appointment setting.',
    keywords: 'AI voice agent, voice agents, AI call, automated calling, outbound calling software',
  },
  
  pricing: {
    title: 'VoxReach Pricing | AI Voice Agent Plans & Pricing',
    description: 'Transparent pricing for AI voice agents. Start free, scale with usage. Compare plans for sales, support, and enterprise use cases.',
    keywords: 'voice agents pricing, AI call pricing, automated calling cost, sales automation pricing',
  },
  
  features: {
    title: 'VoxReach Features | Advanced AI Voice Agent Capabilities',
    description: 'Explore VoxReach features: natural conversation AI, multi-channel campaigns, real-time analytics, enterprise security, and 24/7 support.',
    keywords: 'AI voice agent features, voice agent capabilities, automated calling features',
  },
  
  blog: {
    title: 'VoxReach Blog | AI Voice Agent Insights & Tutorials',
    description: 'Learn about AI voice agents, sales automation, customer service AI, and industry trends. Tutorials, case studies, and expert insights.',
    keywords: 'AI voice agent blog, voice agents tutorial, automated calling guide',
    type: 'website' as const,
  },
  
  blogPost: (postTitle: string, excerpt: string, tags: string[]) => ({
    title: `${postTitle} | VoxReach Blog`,
    description: excerpt,
    keywords: tags.join(', '),
    type: 'article' as const,
    tags,
  }),
  
  useCase: (useCase: string, description: string) => ({
    title: `${useCase} with AI Voice Agents | VoxReach`,
    description,
    keywords: `${useCase} AI voice agent, ${useCase} automated calling`,
  }),
  
  docs: {
    title: 'VoxReach Documentation | API & Integration Guides',
    description: 'Complete documentation for VoxReach API, SDKs, integrations, and developer resources. Get started with AI voice agents in minutes.',
    keywords: 'VoxReach API, voice agent documentation, AI call API, integration guide',
  },
};

/**
 * JSON-LD structured data generator
 */
export function generateStructuredData(data: any) {
  return {
    '@context': 'https://schema.org',
    ...data,
  };
}

/**
 * FAQ structured data generator
 */
export function generateFAQStructuredData(questions: Array<{ question: string; answer: string }>) {
  return generateStructuredData({
    '@type': 'FAQPage',
    mainEntity: questions.map(q => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: q.answer,
      },
    })),
  });
}

/**
 * Product structured data generator
 */
export function generateProductStructuredData(productData: {
  name: string;
  description: string;
  image: string;
  offers: {
    price: number;
    priceCurrency: string;
    availability?: string;
  };
  aggregateRating?: {
    ratingValue: number;
    ratingCount: number;
  };
}) {
  return generateStructuredData({
    '@type': 'Product',
    name: productData.name,
    description: productData.description,
    image: productData.image,
    offers: {
      '@type': 'Offer',
      price: productData.offers.price,
      priceCurrency: productData.offers.priceCurrency,
      availability: productData.offers.availability || 'https://schema.org/InStock',
    },
    ...(productData.aggregateRating && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: productData.aggregateRating.ratingValue,
        ratingCount: productData.aggregateRating.ratingCount,
      },
    }),
  });
}

/**
 * Breadcrumb structured data generator
 */
export function generateBreadcrumbStructuredData(items: Array<{ name: string; url: string }>) {
  return generateStructuredData({
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  });
}