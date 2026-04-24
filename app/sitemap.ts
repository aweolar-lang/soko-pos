import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://localsoko.com';

  // 1. Map out the core static pages
  const staticRoutes = [
    '',
    '/about',
    '/contact',
    '/safety',
    '/privacy',
    '/terms',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1.0 : 0.8,
  }));

  // 2. Dynamically fetch all active stores from Supabase
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );

  const { data: stores } = await supabase
    .from('stores')
    .select('slug');

  // 3. Generate a route for every single store on the platform
  const dynamicRoutes = (stores || []).map((store) => ({
    url: `${baseUrl}/store/${store.slug}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'daily' as const,
    priority: 0.9,
  }));

  return [...staticRoutes, ...dynamicRoutes];
}