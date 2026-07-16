export default function ProductJsonLd() {
    const schema = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": "DreamPlay One Digital Piano",
        "description": "A premium digital piano with narrow keys designed specifically for small hands, children, and preventing hand injury. Available in DS5.5 (7/8ths) and DS6.0 (15/16ths) sizes.",
        "image": "https://dreamplaypianos.com/images/marketing/dreamplay-one-hero.jpg",
        "brand": {
            "@type": "Brand",
            "name": "DreamPlay Pianos"
        },
        "offers": {
            "@type": "Offer",
            "url": "https://dreamplaypianos.com",
            "priceCurrency": "USD",
            "price": "999",
            "priceValidUntil": "2026-12-31",
            "availability": "https://schema.org/PreOrder",
            "itemCondition": "https://schema.org/NewCondition"
        },
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "5",
            "bestRating": "5",
            "worstRating": "1",
            "ratingCount": "208"
        }
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
    );
}
