import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  return [{
    url: 'https://biswajit1999.github.io/betelgeuse-observatory/',
    lastModified: new Date('2026-10-14'),
    changeFrequency: 'monthly',
    priority: 1,
  }];
}
