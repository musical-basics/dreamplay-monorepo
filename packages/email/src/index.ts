export const EMAIL_PACKAGE = "@dreamplay/email";

// Rendering
export { renderTemplate, renderConditionalBlocks, STANDARD_TAGS } from "./render-template";
export {
    applyMergeTags,
    getMergeTagDefaults,
    clearMergeTagCache,
    type ApplyMergeTagsOptions,
} from "./merge-tags";
export { injectPreheader } from "./preheader";

// Unsubscribe
export {
    unsubscribeToken,
    verifyUnsubscribeToken,
    buildUnsubscribeUrls,
    unsubscribeHeaders,
    appendUnsubscribeFooter,
    processUnsubscribe,
    type UnsubscribeUrls,
    type ProcessUnsubscribeInput,
    type ProcessUnsubscribeResult,
} from "./unsubscribe";

// Tracking
export {
    pickTrackingBaseUrl,
    rewriteLinks,
    injectOpenPixel,
    type ClickTrackingMode,
    type RewriteLinksOptions,
} from "./tracking-links";

// Suppression
export { isSuppressed, getSuppressedEmails, type SuppressionCheck } from "./suppression";

// Retry
export {
    withRetry,
    retryDb,
    isRetryableStatus,
    HttpStatusError,
    type RetryOptions,
} from "./retry";

// Sender
export {
    createResendSender,
    defaultFromAddress,
    type EmailSender,
    type SendEmailPayload,
    type SendEmailResult,
} from "./sender";

// Audience
export {
    resolveAudience,
    audienceTargeting,
    type AudienceSubscriber,
    type ResolvedAudience,
} from "./audience";

// Send engine
export {
    sendCampaign,
    type SendCampaignDeps,
    type SendCampaignOptions,
    type SendCampaignResult,
    type LogFn,
    type LogLevel,
} from "./send-campaign";
export {
    sendRotation,
    type SendRotationOptions,
    type SendRotationResult,
} from "./send-rotation";

// Image proxy
export { proxyEmailImages, type ProxyStats } from "./image-proxy";
