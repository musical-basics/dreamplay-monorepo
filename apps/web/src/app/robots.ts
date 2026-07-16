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
                    '/checkout-pages/',
                    '/vip',
                    '/accessories',
                ],
            },
        ],
        sitemap: 'https://dreamplaypianos.com/sitemap.xml',
    };
}
