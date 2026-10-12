import type { Metadata } from "next";
import { Suspense } from "react";
import { getCustomizePageUrls, getHiddenProducts } from "@/actions/admin-actions";
import Navbar from "@/components/webflow-home/Navbar";
import Footer from "@/components/webflow-home/Footer";
import CustomizeClient from "../../(website-pages)/customize/CustomizeClient";
import styles from "./customize.module.css";

export const revalidate = 60;

export const metadata: Metadata = {
    title: "Customize Your DreamPlay",
    description: "Find your perfect keyboard size, choose your finish, and build your DreamPlay One or DreamPlay One Pro.",
    alternates: { canonical: "https://dreamplaypianos.com/customize" },
};

/**
 * /customize: the configurator, styled to match the Webflow homepage
 * (decision D19, 2026-10-12). Built as /customize2 (f555baf) and swapped in
 * here; /customize2 now redirects to /customize (next.config.ts). The
 * configurator itself is still `(website-pages)/customize/CustomizeClient.tsx`
 * with appearance="homepage"; the previous all-Tailwind page was that same
 * component with the default appearance (restore its page.tsx from git to
 * roll back).
 */

export default async function CustomizePage() {
    const [urls, hiddenProducts] = await Promise.all([
        getCustomizePageUrls(),
        getHiddenProducts(),
    ]);

    return (
        <div className={`page-wrapper ${styles.page}`}>
            <Navbar customizeHref="#section-0" />
            <main className="main-wrapper">
                <Suspense>
                    <CustomizeClient
                        urls={urls}
                        hiddenProducts={hiddenProducts}
                        appearance="homepage"
                        className={styles.customizer}
                    />
                </Suspense>
            </main>
            <Footer />
        </div>
    );
}
