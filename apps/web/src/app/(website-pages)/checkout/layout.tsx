import type { Metadata } from 'next';
import ProductJsonLd from '@/components/ProductJsonLd';

export const metadata: Metadata = {
    title: 'Checkout — DreamPlay One',
    description: 'Configure and purchase your DreamPlay One digital piano with ergonomic narrow keys. Choose your key size, finish, and bundle.',
};

export default function CheckoutLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <ProductJsonLd />
            {children}
        </>
    );
}
