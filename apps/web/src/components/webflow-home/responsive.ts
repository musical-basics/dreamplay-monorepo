/**
 * Responsive `srcSet` for the Webflow homepage's large `<img>` tags.
 *
 * The Webflow export shipped `-p-500/-p-800/...` resized copies of each image
 * and referenced them from `srcset`. Those copies were purged from /public in
 * March 2026 (perf commit 161e19b in dreamplay-website), so instead of
 * committing them again we let the Next.js image optimiser produce the
 * candidates on demand. Widths are Next's default `images.deviceSizes`; the
 * quality must be one of `images.qualities` in next.config.ts.
 */
const WIDTHS = [640, 750, 828, 1080, 1200, 1920, 2048, 3840] as const;

export function respSrcSet(path: string, quality: 75 | 85 | 90 | 95 | 100 = 75): string {
    const url = encodeURIComponent(path);
    return WIDTHS.map((w) => `/_next/image?url=${url}&w=${w}&q=${quality} ${w}w`).join(", ");
}
