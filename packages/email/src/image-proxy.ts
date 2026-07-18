/**
 * image-proxy.ts — scan email HTML for external <img src> / CSS url() images,
 * optimize oversized ones with sharp, store permanent copies in Supabase
 * Storage (bucket: email-images), and rewrite the HTML to the stored URLs.
 *
 * Ported from dreamplay-email-3 `src/lib/image-proxy.ts` with the Supabase
 * client injected (no module-level singleton).
 *
 * Failure policy: any failure returns the ORIGINAL url for that image (and is
 * reported in stats.failures) — a broken proxy never blocks a send, and a
 * failed optimization is never cached (so the next send retries it).
 */

import { createHash } from "node:crypto";
import type { AdminClient } from "@dreamplay/db";
import type { LogFn } from "./send-campaign";

const BUCKET = "email-images";

const WARN_BYTES = 500 * 1024;
const OPTIMIZE_BYTES = 150 * 1024;
const TARGET_WIDTH = 1200;
const JPEG_QUALITY = 82;
const JPEG_QUALITY_FALLBACK = 90;
const MIN_OUTPUT_BYTES = 40 * 1024;

const COMPRESS_FORMATS = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp", "image/avif"]);

const EXT_TO_MIME: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    gif: "image/gif",
    avif: "image/avif",
    svg: "image/svg+xml",
};

const MIME_TO_EXT: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
    "image/svg+xml": "svg",
    "image/avif": "avif",
};

export interface ProxyStats {
    scanned: number;
    alreadyProxied: number;
    proxied: number;
    unchanged: number;
    failures: Array<{ url: string; stage: string; reason: string }>;
}

interface ProxyOutcome {
    stage?: string;
    reason?: string;
}

function inferMimeFromUrl(url: string): string | null {
    try {
        const pathname = new URL(url).pathname.toLowerCase();
        const ext = pathname.split(".").pop()?.replace(/[?#].*$/, "") ?? "";
        return EXT_TO_MIME[ext] ?? null;
    } catch {
        return null;
    }
}

function shortLabel(url: string): string {
    try {
        return new URL(url).pathname.split("/").pop()?.slice(0, 40) ?? url;
    } catch {
        return url;
    }
}

function isAlreadyProxied(url: string): boolean {
    try {
        const parsed = new URL(url);
        const isSupabaseDomain =
            parsed.hostname.includes(".supabase.co") || parsed.hostname.includes(".supabase.in");
        if (!isSupabaseDomain) return false;
        const path = parsed.pathname;
        return (
            path.includes(`/object/public/${BUCKET}/optimized/`) ||
            path.includes(`/object/public/${BUCKET}/hashed/`) ||
            path.includes(`/object/public/${BUCKET}/video-thumbnails/`)
        );
    } catch {
        return false;
    }
}

async function storeOriginal(
    db: AdminClient,
    buf: Buffer,
    sourceUrl: string,
    contentType: string,
    log: LogFn,
    outcome: ProxyOutcome
): Promise<string> {
    const label = shortLabel(sourceUrl);
    const ext = MIME_TO_EXT[contentType] ?? "bin";
    const hash = createHash("sha256").update(buf).digest("hex");
    const path = `hashed/${hash}.${ext}`;

    const { data: existing } = await db.storage.from(BUCKET).list("hashed", { search: `${hash}.${ext}`, limit: 1 });
    if (existing && existing.length > 0) {
        const { data: urlData } = db.storage.from(BUCKET).getPublicUrl(path);
        log("info", `[ImageProxy] Cache hit (original): ${label}`);
        return urlData.publicUrl;
    }

    const { error } = await db.storage.from(BUCKET).upload(path, buf, { contentType, upsert: false });
    if (error) {
        if (error.message === "The resource already exists") {
            const { data: urlData } = db.storage.from(BUCKET).getPublicUrl(path);
            return urlData.publicUrl;
        }
        log("error", `[ImageProxy] Upload failed for ${label}: ${error.message}`);
        outcome.stage = "upload-original";
        outcome.reason = error.message;
        return sourceUrl;
    }
    const { data: urlData } = db.storage.from(BUCKET).getPublicUrl(path);
    log("success", `[ImageProxy] Stored original: ${label}`);
    return urlData.publicUrl;
}

async function optimizeAndStore(
    db: AdminClient,
    buf: Buffer,
    sourceUrl: string,
    log: LogFn,
    outcome: ProxyOutcome
): Promise<string> {
    const label = shortLabel(sourceUrl);
    const cacheKey = createHash("sha256").update(sourceUrl + `w${TARGET_WIDTH}q${JPEG_QUALITY}`).digest("hex");
    const path = `optimized/${cacheKey}.jpg`;

    const { data: existing } = await db.storage
        .from(BUCKET)
        .list("optimized", { search: `${cacheKey}.jpg`, limit: 1 });
    if (existing && existing.length > 0) {
        const { data: urlData } = db.storage.from(BUCKET).getPublicUrl(path);
        log("info", `[ImageProxy] Cache hit (optimized): ${label}`);
        return urlData.publicUrl;
    }

    let optimizedBuf: Buffer;
    try {
        // Lazy import: sharp is a native module; only load when actually optimizing.
        const sharp = (await import("sharp")).default;
        optimizedBuf = await sharp(buf)
            .resize({ width: TARGET_WIDTH, withoutEnlargement: true })
            .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
            .toBuffer();
        if (optimizedBuf.length < MIN_OUTPUT_BYTES) {
            optimizedBuf = await sharp(buf)
                .resize({ width: TARGET_WIDTH, withoutEnlargement: true })
                .jpeg({ quality: JPEG_QUALITY_FALLBACK, mozjpeg: true })
                .toBuffer();
        }
        log(
            "info",
            `[ImageProxy] Optimized ${label}: ${Math.round(buf.length / 1024)}KB -> ${Math.round(optimizedBuf.length / 1024)}KB`
        );
    } catch (sharpErr) {
        const message = sharpErr instanceof Error ? sharpErr.message : String(sharpErr);
        log("error", `[ImageProxy] Sharp failed for ${label}: ${message}`);
        // Return original URL; do NOT fall back to storeOriginal — caching the
        // unoptimized copy would permanently skip this image on future sends.
        outcome.stage = "sharp";
        outcome.reason = message;
        return sourceUrl;
    }

    const { error } = await db.storage
        .from(BUCKET)
        .upload(path, optimizedBuf, { contentType: "image/jpeg", upsert: false });
    if (error) {
        if (error.message === "The resource already exists") {
            const { data: urlData } = db.storage.from(BUCKET).getPublicUrl(path);
            return urlData.publicUrl;
        }
        log("error", `[ImageProxy] Optimized upload failed for ${label}: ${error.message}`);
        outcome.stage = "upload-optimized";
        outcome.reason = error.message;
        return sourceUrl;
    }
    const { data: urlData } = db.storage.from(BUCKET).getPublicUrl(path);
    log("success", `[ImageProxy] Stored optimized: ${label}`);
    return urlData.publicUrl;
}

async function proxyImage(db: AdminClient, imageUrl: string, log: LogFn, outcome: ProxyOutcome): Promise<string> {
    const label = shortLabel(imageUrl);
    if (isAlreadyProxied(imageUrl)) return imageUrl;

    try {
        const res = await fetch(imageUrl, { signal: AbortSignal.timeout(20_000) });
        if (!res.ok) {
            log("error", `[ImageProxy] GET failed HTTP ${res.status} for ${label}; keeping original URL`);
            outcome.stage = "get";
            outcome.reason = `HTTP ${res.status}`;
            return imageUrl;
        }

        const serverContentType = (res.headers.get("content-type") || "").split(";")[0]!.trim().toLowerCase();
        const buf = Buffer.from(await res.arrayBuffer());
        const urlInferredMime = inferMimeFromUrl(imageUrl);
        const contentType =
            serverContentType && serverContentType !== "application/octet-stream" && serverContentType !== "binary/octet-stream"
                ? serverContentType
                : (urlInferredMime ?? serverContentType ?? "application/octet-stream");

        if (buf.length > WARN_BYTES) {
            log("warn", `[ImageProxy] Large image ${label}: ${Math.round(buf.length / 1024)}KB`);
        }

        const shouldOptimize = buf.length > OPTIMIZE_BYTES && COMPRESS_FORMATS.has(contentType);
        return shouldOptimize
            ? await optimizeAndStore(db, buf, imageUrl, log, outcome)
            : await storeOriginal(db, buf, imageUrl, contentType, log, outcome);
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        log("error", `[ImageProxy] Unexpected error for ${label}: ${message}`);
        outcome.stage = "unexpected";
        outcome.reason = message;
        return imageUrl;
    }
}

/** Scan HTML, proxy/optimize all external images, rewrite the HTML. */
export async function proxyEmailImages(
    db: AdminClient,
    html: string,
    logger?: LogFn
): Promise<{ html: string; stats: ProxyStats }> {
    const log: LogFn = logger ?? (() => {});
    const stats: ProxyStats = { scanned: 0, alreadyProxied: 0, proxied: 0, unchanged: 0, failures: [] };
    if (!html) return { html, stats };

    const allUrls = new Set<string>();
    const alreadyProxied = new Set<string>();

    const srcRegex = /src=["']?(https?:\/\/[^"'\s>]+)["']?/gi;
    let m: RegExpExecArray | null;
    while ((m = srcRegex.exec(html)) !== null) {
        const url = m[1]!.replace(/["'>\s].*$/, "");
        (isAlreadyProxied(url) ? alreadyProxied : allUrls).add(url);
    }
    const urlFnRegex = /url\(["']?(https?:\/\/[^"'\s)]+)["']?\)/gi;
    while ((m = urlFnRegex.exec(html)) !== null) {
        const url = m[1]!.replace(/["')\s].*$/, "");
        (isAlreadyProxied(url) ? alreadyProxied : allUrls).add(url);
    }

    stats.scanned = allUrls.size + alreadyProxied.size;
    stats.alreadyProxied = alreadyProxied.size;
    if (allUrls.size === 0) return { html, stats };

    const urlMap = new Map<string, string>();
    const outcomeMap = new Map<string, ProxyOutcome>();
    await Promise.all(
        Array.from(allUrls).map(async (url) => {
            const outcome: ProxyOutcome = {};
            outcomeMap.set(url, outcome);
            urlMap.set(url, await proxyImage(db, url, log, outcome));
        })
    );

    let rewritten = html;
    for (const [original, proxied] of urlMap) {
        if (original !== proxied) {
            stats.proxied++;
            const escaped = original.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            rewritten = rewritten.replace(new RegExp(escaped, "g"), proxied);
        } else {
            stats.unchanged++;
            const outcome = outcomeMap.get(original);
            if (outcome?.stage) {
                stats.failures.push({ url: original, stage: outcome.stage, reason: outcome.reason ?? "unknown" });
            }
        }
    }

    log("info", `[ImageProxy] Done: ${stats.proxied}/${allUrls.size} proxied, ${stats.failures.length} failed`);
    return { html: rewritten, stats };
}
