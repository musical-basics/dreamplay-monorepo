import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: [
                    '/api/',
                    '/admin/',
                    '/analytics/',
                    '/login',
                    '/register',
                    '/forgot-password',
                    '/reset-password',
                    '/activate',
                    // Landing page variants — canonical is root /
                    '/intro-offer',
                    '/premium-offer',
                    '/extended-offer',
                    // A/B funnel (D11): entry points + variant-only layouts
                    '/ab',
                    '/main',
                    '/legacy-home',
                    '/special-offer',
                    '/landing-page-1',
                    '/checkout-pages/',
                    '/vip',
                    '/accessories',
                ],
            },
        ],
        sitemap: 'https://dreamplaypianos.com/sitemap.xml',
    };
}
