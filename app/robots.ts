import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/dashboard/', 
        '/api/', 
        '/admin/', 
        '/auth/',
        '/order-success/',
        '/payment-success/'

      ],
    },
    sitemap: 'https://localsoko.com/sitemap.xml',
  };
}