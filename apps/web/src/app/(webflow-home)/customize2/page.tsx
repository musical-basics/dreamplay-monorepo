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
    // Same configurator as /customize (the indexed one), restyled to match the
    // Webflow homepage: keep the duplicate out of search results.
    robots: { index: false, follow: true },
};

export default async function Customize2Page() {
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
