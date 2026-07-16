export const DB_PACKAGE = "@dreamplay/db";

export { createBrowserClient, type BrowserClient } from "./client";
export { createServerClient, type ServerClient, type CookieAdapter } from "./server";
export { createAdminClient, type AdminClient } from "./admin";

export type {
  Database,
  Json,
  Tables,
  TablesInsert,
  TablesUpdate,
  BuyerSource,
  ReservationDecision,
  SubscriberStatus,
  CampaignStatus,
  CampaignEmailType,
  CampaignScheduledStatus,
  EmailEventType,
  SuppressionReason,
  SendLogStatus,
  ChainProcessStatus,
  ExperimentStatus,
  ChatSessionStatus,
  ChatMessageRole,
} from "./types";
