import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://dreamplaypianos.com';
    const now = new Date();

    // Core pages that should be indexed
    const corePages = [
        { path: '/', priority: 1.0, changeFrequency: 'weekly' as const },
        { path: '/how-it-works', priority: 0.9, changeFrequency: 'monthly' as const },
        { path: '/product-information', priority: 0.9, changeFrequency: 'monthly' as const },
        { path: '/buyers-guide', priority: 0.8, changeFrequency: 'monthly' as const },
        { path: '/parents-guide', priority: 0.8, changeFrequency: 'monthly' as const },
        { path: '/learn', priority: 0.7, changeFrequency: 'monthly' as const },
        { path: '/our-story', priority: 0.6, changeFrequency: 'monthly' as const },
        { path: '/why-narrow', priority: 0.8, changeFrequency: 'monthly' as const },
        { path: '/better-practice', priority: 0.7, changeFrequency: 'monthly' as const },
        { path: '/customize', priority: 0.8, changeFrequency: 'weekly' as const },
        { path: '/extended-offer', priority: 0.7, changeFrequency: 'weekly' as const },
        { path: '/dreamplay-pro', priority: 0.8, changeFrequency: 'weekly' as const },
        { path: '/production-timeline', priority: 0.5, changeFrequency: 'monthly' as const },
        { path: '/contact', priority: 0.5, changeFrequency: 'yearly' as const },
        { path: '/faq', priority: 0.7, changeFrequency: 'monthly' as const },
        { path: '/privacy', priority: 0.2, changeFrequency: 'yearly' as const },
        { path: '/terms', priority: 0.2, changeFrequency: 'yearly' as const },
        { path: '/information-and-policies/faq', priority: 0.7, changeFrequency: 'monthly' as const },
        { path: '/information-and-policies/shipping', priority: 0.5, changeFrequency: 'monthly' as const },
        { path: '/about-us/ds-standard', priority: 0.6, changeFrequency: 'monthly' as const },
        { path: '/hidden-barrier', priority: 0.6, changeFrequency: 'monthly' as const },
        { path: '/historical-facts', priority: 0.5, changeFrequency: 'monthly' as const },
        { path: '/blog', priority: 0.7, changeFrequency: 'weekly' as const },
    ];

    const pages = corePages.map(({ path, priority, changeFrequency }) => ({
        url: `${baseUrl}${path}`,
        lastModified: now,
        changeFrequency,
        priority,
    }));

    return [
        ...pages,
        {
            url: 'https://shop.dreamplaypianos.com',
            lastModified: now,
            changeFrequency: 'weekly' as const,
            priority: 0.9,
        },
    ];
}
