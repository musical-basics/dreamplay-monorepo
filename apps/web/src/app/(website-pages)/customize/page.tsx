import { Suspense } from 'react'
import CustomizeClient from './CustomizeClient'
import { getCustomizePageUrls, getHiddenProducts } from '@/actions/admin-actions'

export const revalidate = 60

export default async function CustomizePage() {
    const [urls, hiddenProducts] = await Promise.all([
        getCustomizePageUrls(),
        getHiddenProducts()
    ])

    return (
        <Suspense>
            <CustomizeClient urls={urls} hiddenProducts={hiddenProducts} />
        </Suspense>
    )
}
