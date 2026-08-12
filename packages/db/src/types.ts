/**
 * Hand-authored to match migrations; replace with `supabase gen types` output
 * once CLI access exists.
 *
 * Source of truth: packages/db/supabase/migrations/*.sql
 *   20260716000100_commerce.sql   — settings, buyers, reservation_decisions,
 *                                   customers, waitlist, admin_variables
 *   20260716000200_email.sql      — subscribers, rotations, campaigns,
 *                                   sent_history, email_events, suppressions,
 *                                   send_logs, tag_definitions, merge_tags,
 *                                   email_chains, chain_processes,
 *                                   email_triggers, app_settings
 *   20260716000300_analytics.sql  — events, experiments, ip_email_map,
 *                                   chat_sessions, chat_messages
 *   20260716000500_analytics_functions.sql — get_analytics_summary,
 *                                   get_setting_text_array
 *   20260804120000_blog.sql       — posts, post_versions, blog_themes,
 *                                   research_knowledgebase, media_assets,
 *                                   asset_tags, asset_tag_links
 *   20260804120100_crowdfunding.sql — cf_creator, cf_campaign, cf_reward,
 *                                   cf_faq, cf_update, cf_comment, cf_pledge
 *   20260804130000_preorder_orders.sql — preorder_orders
 *   20260805170000_buyer_update_emails.sql — buyer_update_emails
 *   20260806090000_buyers_order_details.sql — order-detail columns merged
 *                                   into buyers above
 *   20260806150000_buyer_preferences.sql — buyer_preference_changes,
 *                                   buyers.pro_upgrade_requested
 *   20260806190000_buyers_unit_count.sql — buyers.unit_count
 *   20260810090000_buyer_research.sql — buyer_survey_responses,
 *                                   buyer_call_requests
 *   20260810150000_store_credit.sql — store_credits
 *   20260810190000_ab_test_august_10.sql — call request days/parts columns
 *
 * Conventions mirroring `supabase gen types typescript`:
 *   - columns with defaults are optional in Insert
 *   - GENERATED ALWAYS AS IDENTITY columns are `never` in Insert/Update
 *   - citext columns are `string`
 *   - text CHECK-constrained columns are narrowed to their literal unions
 *     (gen types emits plain `string` for CHECKs; the narrowing here is a
 *     deliberate improvement — revisit if it fights the generated output)
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

// --- CHECK-constraint unions -------------------------------------------------

export type BuyerSource = "shopify_webhook" | "backfill" | "manual";
export type BuyerKind = "buyer" | "waitlist" | "founder" | "test" | "unknown";
export type ReservationDecision = "refund_requested" | "keep_reservation" | "upgrade_to_pro";
export type SubscriberStatus =
  | "active"
  | "unsubscribed"
  | "bounced"
  | "complained"
  | "inactive"
  | "deleted";
export type CampaignStatus = "draft" | "scheduled" | "sending" | "completed" | "deleted";
export type CampaignEmailType = "campaign" | "automated";
export type CampaignScheduledStatus = "pending" | "scheduled" | "sent" | "cancelled";
export type EmailEventType = "open" | "click" | "bounce" | "complaint" | "unsubscribe" | "delivery";
export type SuppressionReason = "bounce" | "complaint" | "unsubscribe" | "manual";
export type SendLogStatus = "pending" | "success" | "error";
export type ChainProcessStatus = "active" | "paused" | "completed" | "cancelled" | "error";
export type ExperimentStatus = "draft" | "running" | "paused" | "concluded";
export type ChatSessionStatus = "active" | "closed" | "admin_takeover";
export type ChatMessageRole = "user" | "assistant" | "admin" | "system";
export type PostStatus = "draft" | "published";
export type MediaAssetType = "image" | "video" | "document";
export type MediaAssetRole = "master" | "derivative";
export type BuyerUpdateEmailStatus = "draft" | "scheduled" | "sent";
export type BuyerCallContactMethod = "zoom" | "phone" | "whatsapp";
export type BuyerCallStatus = "requested" | "scheduled" | "completed" | "cancelled";

// --- Database ------------------------------------------------------------------

export interface Database {
  public: {
    Tables: {
      // --- commerce ----------------------------------------------------------
      settings: {
        Row: {
          key: string;
          value: Json;
          description: string | null;
          updated_at: string;
        };
        Insert: {
          key: string;
          value: Json;
          description?: string | null;
          updated_at?: string;
        };
        Update: {
          key?: string;
          value?: Json;
          description?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      buyers: {
        Row: {
          id: string;
          email: string;
          notes: string | null;
          source: BuyerSource;
          shopify_order_number: string | null;
          kind: BuyerKind;
          purchase_date: string | null;
          price_paid_usd: number | null;
          product_line: string | null;
          size_variant: string | null;
          finish: string | null;
          est_ship_date: string | null;
          order_details_source: string | null;
          pro_upgrade_requested: boolean;
          unit_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          notes?: string | null;
          source?: BuyerSource;
          shopify_order_number?: string | null;
          kind?: BuyerKind;
          purchase_date?: string | null;
          price_paid_usd?: number | null;
          product_line?: string | null;
          size_variant?: string | null;
          finish?: string | null;
          est_ship_date?: string | null;
          order_details_source?: string | null;
          pro_upgrade_requested?: boolean;
          unit_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          notes?: string | null;
          source?: BuyerSource;
          shopify_order_number?: string | null;
          kind?: BuyerKind;
          purchase_date?: string | null;
          price_paid_usd?: number | null;
          product_line?: string | null;
          size_variant?: string | null;
          finish?: string | null;
          est_ship_date?: string | null;
          order_details_source?: string | null;
          pro_upgrade_requested?: boolean;
          unit_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      reservation_decisions: {
        Row: {
          id: string;
          user_id: string;
          email: string;
          decision: ReservationDecision;
          selected_at: string;
          order_metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          email: string;
          decision: ReservationDecision;
          selected_at?: string;
          order_metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          email?: string;
          decision?: ReservationDecision;
          selected_at?: string;
          order_metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      customers: {
        Row: {
          id: string;
          email: string;
          name: string;
          tags: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name?: string;
          tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      waitlist: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          full_name: string;
          email: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          email?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      admin_variables: {
        Row: {
          key: string;
          value: string | null;
          updated_at: string;
        };
        Insert: {
          key: string;
          value?: string | null;
          updated_at?: string;
        };
        Update: {
          key?: string;
          value?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      // --- email ---------------------------------------------------------------
      subscribers: {
        Row: {
          id: string;
          email: string;
          first_name: string;
          last_name: string;
          status: SubscriberStatus;
          tags: string[];
          smart_tags: Json;
          country: string | null;
          country_code: string | null;
          phone_code: string | null;
          phone_number: string | null;
          shipping_address1: string | null;
          shipping_address2: string | null;
          shipping_city: string | null;
          shipping_zip: string | null;
          shipping_province: string | null;
          shopify_customer_id: string | null;
          klaviyo_profile_id: string | null;
          workspace: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          first_name?: string;
          last_name?: string;
          status?: SubscriberStatus;
          tags?: string[];
          smart_tags?: Json;
          country?: string | null;
          country_code?: string | null;
          phone_code?: string | null;
          phone_number?: string | null;
          shipping_address1?: string | null;
          shipping_address2?: string | null;
          shipping_city?: string | null;
          shipping_zip?: string | null;
          shipping_province?: string | null;
          shopify_customer_id?: string | null;
          klaviyo_profile_id?: string | null;
          workspace?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          first_name?: string;
          last_name?: string;
          status?: SubscriberStatus;
          tags?: string[];
          smart_tags?: Json;
          country?: string | null;
          country_code?: string | null;
          phone_code?: string | null;
          phone_number?: string | null;
          shipping_address1?: string | null;
          shipping_address2?: string | null;
          shipping_city?: string | null;
          shipping_zip?: string | null;
          shipping_province?: string | null;
          shopify_customer_id?: string | null;
          klaviyo_profile_id?: string | null;
          workspace?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      rotations: {
        Row: {
          id: string;
          name: string;
          campaign_ids: string[];
          cursor_position: number;
          workspace: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          campaign_ids?: string[];
          cursor_position?: number;
          workspace?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          campaign_ids?: string[];
          cursor_position?: number;
          workspace?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      campaigns: {
        Row: {
          id: string;
          name: string;
          subject_line: string | null;
          html_content: string | null;
          variable_values: Json;
          status: CampaignStatus;
          email_type: CampaignEmailType;
          is_template: boolean;
          is_ready: boolean;
          is_starred_template: boolean;
          parent_template_id: string | null;
          rotation_id: string | null;
          template_folder_id: string | null;
          category: string | null;
          send_key: string | null;
          sent_from_email: string | null;
          resend_email_id: string | null;
          scheduled_at: string | null;
          scheduled_status: CampaignScheduledStatus | null;
          total_recipients: number;
          total_opens: number;
          total_clicks: number;
          workspace: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          subject_line?: string | null;
          html_content?: string | null;
          variable_values?: Json;
          status?: CampaignStatus;
          email_type?: CampaignEmailType;
          is_template?: boolean;
          is_ready?: boolean;
          is_starred_template?: boolean;
          parent_template_id?: string | null;
          rotation_id?: string | null;
          template_folder_id?: string | null;
          category?: string | null;
          send_key?: string | null;
          sent_from_email?: string | null;
          resend_email_id?: string | null;
          scheduled_at?: string | null;
          scheduled_status?: CampaignScheduledStatus | null;
          total_recipients?: number;
          total_opens?: number;
          total_clicks?: number;
          workspace?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          subject_line?: string | null;
          html_content?: string | null;
          variable_values?: Json;
          status?: CampaignStatus;
          email_type?: CampaignEmailType;
          is_template?: boolean;
          is_ready?: boolean;
          is_starred_template?: boolean;
          parent_template_id?: string | null;
          rotation_id?: string | null;
          template_folder_id?: string | null;
          category?: string | null;
          send_key?: string | null;
          sent_from_email?: string | null;
          resend_email_id?: string | null;
          scheduled_at?: string | null;
          scheduled_status?: CampaignScheduledStatus | null;
          total_recipients?: number;
          total_opens?: number;
          total_clicks?: number;
          workspace?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "campaigns_parent_template_id_fkey";
            columns: ["parent_template_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "campaigns_rotation_id_fkey";
            columns: ["rotation_id"];
            isOneToOne: false;
            referencedRelation: "rotations";
            referencedColumns: ["id"];
          },
        ];
      };
      sent_history: {
        Row: {
          id: string;
          campaign_id: string;
          subscriber_id: string;
          resend_email_id: string | null;
          sent_at: string;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          subscriber_id: string;
          resend_email_id?: string | null;
          sent_at?: string;
        };
        Update: {
          id?: string;
          campaign_id?: string;
          subscriber_id?: string;
          resend_email_id?: string | null;
          sent_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sent_history_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sent_history_subscriber_id_fkey";
            columns: ["subscriber_id"];
            isOneToOne: false;
            referencedRelation: "subscribers";
            referencedColumns: ["id"];
          },
        ];
      };
      email_events: {
        Row: {
          id: number;
          subscriber_id: string | null;
          campaign_id: string | null;
          type: EmailEventType;
          url: string | null;
          ip: string | null;
          user_agent: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: never;
          subscriber_id?: string | null;
          campaign_id?: string | null;
          type: EmailEventType;
          url?: string | null;
          ip?: string | null;
          user_agent?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: never;
          subscriber_id?: string | null;
          campaign_id?: string | null;
          type?: EmailEventType;
          url?: string | null;
          ip?: string | null;
          user_agent?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "email_events_subscriber_id_fkey";
            columns: ["subscriber_id"];
            isOneToOne: false;
            referencedRelation: "subscribers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "email_events_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["id"];
          },
        ];
      };
      suppressions: {
        Row: {
          id: string;
          email: string;
          reason: SuppressionReason;
          source: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          reason: SuppressionReason;
          source?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          reason?: SuppressionReason;
          source?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      send_logs: {
        Row: {
          id: string;
          campaign_id: string | null;
          triggered_by: string | null;
          status: SendLogStatus;
          error_message: string | null;
          logs: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          campaign_id?: string | null;
          triggered_by?: string | null;
          status?: SendLogStatus;
          error_message?: string | null;
          logs?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          campaign_id?: string | null;
          triggered_by?: string | null;
          status?: SendLogStatus;
          error_message?: string | null;
          logs?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "send_logs_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["id"];
          },
        ];
      };
      tag_definitions: {
        Row: {
          id: string;
          name: string;
          color: string;
          workspace: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          color?: string;
          workspace?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          color?: string;
          workspace?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      merge_tags: {
        Row: {
          id: string;
          name: string;
          default_value: string;
          description: string | null;
          workspace: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          default_value?: string;
          description?: string | null;
          workspace?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          default_value?: string;
          description?: string | null;
          workspace?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      email_chains: {
        Row: {
          id: string;
          name: string;
          status: string;
          steps: Json;
          branches: Json;
          subscriber_id: string | null;
          is_snapshot: boolean;
          workspace: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          status?: string;
          steps?: Json;
          branches?: Json;
          subscriber_id?: string | null;
          is_snapshot?: boolean;
          workspace?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          status?: string;
          steps?: Json;
          branches?: Json;
          subscriber_id?: string | null;
          is_snapshot?: boolean;
          workspace?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "email_chains_subscriber_id_fkey";
            columns: ["subscriber_id"];
            isOneToOne: false;
            referencedRelation: "subscribers";
            referencedColumns: ["id"];
          },
        ];
      };
      chain_processes: {
        Row: {
          id: string;
          chain_id: string;
          subscriber_id: string;
          status: ChainProcessStatus;
          current_step: number;
          state: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          chain_id: string;
          subscriber_id: string;
          status?: ChainProcessStatus;
          current_step?: number;
          state?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          chain_id?: string;
          subscriber_id?: string;
          status?: ChainProcessStatus;
          current_step?: number;
          state?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "chain_processes_chain_id_fkey";
            columns: ["chain_id"];
            isOneToOne: false;
            referencedRelation: "email_chains";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chain_processes_subscriber_id_fkey";
            columns: ["subscriber_id"];
            isOneToOne: false;
            referencedRelation: "subscribers";
            referencedColumns: ["id"];
          },
        ];
      };
      email_triggers: {
        Row: {
          id: string;
          name: string | null;
          trigger_type: string;
          trigger_value: string;
          chain_id: string | null;
          campaign_id: string | null;
          is_active: boolean;
          metadata: Json;
          workspace: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name?: string | null;
          trigger_type?: string;
          trigger_value: string;
          chain_id?: string | null;
          campaign_id?: string | null;
          is_active?: boolean;
          metadata?: Json;
          workspace?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string | null;
          trigger_type?: string;
          trigger_value?: string;
          chain_id?: string | null;
          campaign_id?: string | null;
          is_active?: boolean;
          metadata?: Json;
          workspace?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "email_triggers_chain_id_fkey";
            columns: ["chain_id"];
            isOneToOne: false;
            referencedRelation: "email_chains";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "email_triggers_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["id"];
          },
        ];
      };
      app_settings: {
        Row: {
          key: string;
          value: Json | null;
          updated_at: string;
        };
        Insert: {
          key: string;
          value?: Json | null;
          updated_at?: string;
        };
        Update: {
          key?: string;
          value?: Json | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      // --- analytics -------------------------------------------------------------
      events: {
        Row: {
          id: number;
          created_at: string;
          event_name: string;
          path: string | null;
          session_id: string | null;
          visitor_id: string | null;
          ip_address: string | null;
          user_agent: string | null;
          country: string | null;
          city: string | null;
          region: string | null;
          email: string | null;
          subscriber_id: string | null;
          duration_seconds: number | null;
          metadata: Json;
        };
        Insert: {
          id?: never;
          created_at?: string;
          event_name: string;
          path?: string | null;
          session_id?: string | null;
          visitor_id?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
          country?: string | null;
          city?: string | null;
          region?: string | null;
          email?: string | null;
          subscriber_id?: string | null;
          duration_seconds?: number | null;
          metadata?: Json;
        };
        Update: {
          id?: never;
          created_at?: string;
          event_name?: string;
          path?: string | null;
          session_id?: string | null;
          visitor_id?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
          country?: string | null;
          city?: string | null;
          region?: string | null;
          email?: string | null;
          subscriber_id?: string | null;
          duration_seconds?: number | null;
          metadata?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "events_subscriber_id_fkey";
            columns: ["subscriber_id"];
            isOneToOne: false;
            referencedRelation: "subscribers";
            referencedColumns: ["id"];
          },
        ];
      };
      experiments: {
        Row: {
          id: string;
          key: string;
          name: string;
          status: ExperimentStatus;
          variants: Json;
          winner: string | null;
          started_at: string | null;
          concluded_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          key: string;
          name: string;
          status?: ExperimentStatus;
          variants?: Json;
          winner?: string | null;
          started_at?: string | null;
          concluded_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          key?: string;
          name?: string;
          status?: ExperimentStatus;
          variants?: Json;
          winner?: string | null;
          started_at?: string | null;
          concluded_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      ip_email_map: {
        Row: {
          id: string;
          ip_address: string;
          email: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          ip_address: string;
          email: string;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          ip_address?: string;
          email?: string;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      chat_sessions: {
        Row: {
          id: string;
          visitor_id: string | null;
          status: ChatSessionStatus;
          message_count: number;
          admin_takeover_at: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          visitor_id?: string | null;
          status?: ChatSessionStatus;
          message_count?: number;
          admin_takeover_at?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          visitor_id?: string | null;
          status?: ChatSessionStatus;
          message_count?: number;
          admin_takeover_at?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      chat_messages: {
        Row: {
          id: number;
          session_id: string;
          role: ChatMessageRole;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: never;
          session_id: string;
          role: ChatMessageRole;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: never;
          session_id?: string;
          role?: ChatMessageRole;
          content?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "chat_sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      // --- blog ----------------------------------------------------------------
      posts: {
        Row: {
          id: string;
          title: string;
          slug: string;
          excerpt: string | null;
          category: string | null;
          featured_image: string | null;
          html_content: string | null;
          variable_values: Json | null;
          status: PostStatus | null;
          published_at: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          excerpt?: string | null;
          category?: string | null;
          featured_image?: string | null;
          html_content?: string | null;
          variable_values?: Json | null;
          status?: PostStatus | null;
          published_at?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string;
          excerpt?: string | null;
          category?: string | null;
          featured_image?: string | null;
          html_content?: string | null;
          variable_values?: Json | null;
          status?: PostStatus | null;
          published_at?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      post_versions: {
        Row: {
          id: string;
          post_id: string | null;
          html_content: string;
          prompt: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          post_id?: string | null;
          html_content: string;
          prompt?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          post_id?: string | null;
          html_content?: string;
          prompt?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      blog_themes: {
        Row: {
          id: string;
          name: string;
          html_template: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          html_template: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          html_template?: string;
          created_at?: string | null;
        };
        Relationships: [];
      };
      research_knowledgebase: {
        Row: {
          id: string;
          title: string;
          author: string | null;
          year: string | null;
          url: string | null;
          content: string;
          is_active: boolean | null;
          created_at: string | null;
          updated_at: string | null;
          r2_key: string | null;
          source: string | null;
          description: string | null;
          file_size_kb: number | null;
          batch: string | null;
          download_status: string | null;
          abstract: string | null;
          citation_count: number | null;
        };
        Insert: {
          id?: string;
          title: string;
          author?: string | null;
          year?: string | null;
          url?: string | null;
          content: string;
          is_active?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
          r2_key?: string | null;
          source?: string | null;
          description?: string | null;
          file_size_kb?: number | null;
          batch?: string | null;
          download_status?: string | null;
          abstract?: string | null;
          citation_count?: number | null;
        };
        Update: {
          id?: string;
          title?: string;
          author?: string | null;
          year?: string | null;
          url?: string | null;
          content?: string;
          is_active?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
          r2_key?: string | null;
          source?: string | null;
          description?: string | null;
          file_size_kb?: number | null;
          batch?: string | null;
          download_status?: string | null;
          abstract?: string | null;
          citation_count?: number | null;
        };
        Relationships: [];
      };
      media_assets: {
        Row: {
          id: string;
          filename: string;
          folder_path: string | null;
          storage_hash: string;
          public_url: string;
          size: number | null;
          is_deleted: boolean | null;
          created_at: string | null;
          description: string | null;
          is_starred: boolean | null;
          asset_type: MediaAssetType | null;
          role: MediaAssetRole | null;
          parent_id: string | null;
          usage_score: number | null;
          category_id: string | null;
        };
        Insert: {
          id?: string;
          filename: string;
          folder_path?: string | null;
          storage_hash: string;
          public_url: string;
          size?: number | null;
          is_deleted?: boolean | null;
          created_at?: string | null;
          description?: string | null;
          is_starred?: boolean | null;
          asset_type?: MediaAssetType | null;
          role?: MediaAssetRole | null;
          parent_id?: string | null;
          usage_score?: number | null;
          category_id?: string | null;
        };
        Update: {
          id?: string;
          filename?: string;
          folder_path?: string | null;
          storage_hash?: string;
          public_url?: string;
          size?: number | null;
          is_deleted?: boolean | null;
          created_at?: string | null;
          description?: string | null;
          is_starred?: boolean | null;
          asset_type?: MediaAssetType | null;
          role?: MediaAssetRole | null;
          parent_id?: string | null;
          usage_score?: number | null;
          category_id?: string | null;
        };
        Relationships: [];
      };
      asset_tags: {
        Row: {
          id: string;
          name: string;
          color: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          color?: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          color?: string;
          created_at?: string | null;
        };
        Relationships: [];
      };
      asset_tag_links: {
        Row: {
          asset_id: string;
          tag_id: string;
        };
        Insert: {
          asset_id: string;
          tag_id: string;
        };
        Update: {
          asset_id?: string;
          tag_id?: string;
        };
        Relationships: [];
      };
      // --- crowdfunding --------------------------------------------------------
      cf_creator: {
        Row: {
          id: string;
          name: string;
          avatar_url: string | null;
          bio: string | null;
          location: string | null;
          projects_created: number | null;
          projects_backed: number | null;
          created_at: string;
          page_content: string | null;
        };
        Insert: {
          id: string;
          name: string;
          avatar_url?: string | null;
          bio?: string | null;
          location?: string | null;
          projects_created?: number | null;
          projects_backed?: number | null;
          created_at?: string;
          page_content?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          avatar_url?: string | null;
          bio?: string | null;
          location?: string | null;
          projects_created?: number | null;
          projects_backed?: number | null;
          created_at?: string;
          page_content?: string | null;
        };
        Relationships: [];
      };
      cf_campaign: {
        Row: {
          id: string;
          creator_id: string | null;
          title: string;
          subtitle: string | null;
          story: string | null;
          risks: string | null;
          hero_image: string | null;
          gallery_images: string[] | null;
          goal_amount: number;
          total_pledged: number | null;
          total_backers: number | null;
          ends_at: string | null;
          created_at: string;
          key_features: Json | null;
          tech_specs: Json | null;
          shipping: string | null;
          technical_details: string | null;
          faq_page_content: string | null;
          media_gallery: Json | null;
          manufacturer_details: string | null;
          loves_count: number | null;
          total_supply: number | null;
          is_variant_a: boolean | null;
          show_announcement: boolean;
          show_reserved_amount: boolean;
          show_sold_out_percent: boolean;
          hidden_sections: Json | null;
        };
        Insert: {
          id: string;
          creator_id?: string | null;
          title: string;
          subtitle?: string | null;
          story?: string | null;
          risks?: string | null;
          hero_image?: string | null;
          gallery_images?: string[] | null;
          goal_amount: number;
          total_pledged?: number | null;
          total_backers?: number | null;
          ends_at?: string | null;
          created_at?: string;
          key_features?: Json | null;
          tech_specs?: Json | null;
          shipping?: string | null;
          technical_details?: string | null;
          faq_page_content?: string | null;
          media_gallery?: Json | null;
          manufacturer_details?: string | null;
          loves_count?: number | null;
          total_supply?: number | null;
          is_variant_a?: boolean | null;
          show_announcement?: boolean;
          show_reserved_amount?: boolean;
          show_sold_out_percent?: boolean;
          hidden_sections?: Json | null;
        };
        Update: {
          id?: string;
          creator_id?: string | null;
          title?: string;
          subtitle?: string | null;
          story?: string | null;
          risks?: string | null;
          hero_image?: string | null;
          gallery_images?: string[] | null;
          goal_amount?: number;
          total_pledged?: number | null;
          total_backers?: number | null;
          ends_at?: string | null;
          created_at?: string;
          key_features?: Json | null;
          tech_specs?: Json | null;
          shipping?: string | null;
          technical_details?: string | null;
          faq_page_content?: string | null;
          media_gallery?: Json | null;
          manufacturer_details?: string | null;
          loves_count?: number | null;
          total_supply?: number | null;
          is_variant_a?: boolean | null;
          show_announcement?: boolean;
          show_reserved_amount?: boolean;
          show_sold_out_percent?: boolean;
          hidden_sections?: Json | null;
        };
        Relationships: [];
      };
      cf_reward: {
        Row: {
          id: string;
          campaign_id: string | null;
          title: string;
          price: number;
          original_price: number | null;
          description: string | null;
          items_included: string[] | null;
          estimated_delivery: string | null;
          ships_to: string[] | null;
          limit_quantity: number | null;
          backers_count: number | null;
          is_sold_out: boolean | null;
          created_at: string;
          image_url: string | null;
          is_featured: boolean | null;
          checkout_url: string | null;
          shopify_variant_id: string | null;
          is_visible: boolean | null;
          sort_order: number | null;
          badge_type: string | null;
          reward_type: string | null;
        };
        Insert: {
          id: string;
          campaign_id?: string | null;
          title: string;
          price: number;
          original_price?: number | null;
          description?: string | null;
          items_included?: string[] | null;
          estimated_delivery?: string | null;
          ships_to?: string[] | null;
          limit_quantity?: number | null;
          backers_count?: number | null;
          is_sold_out?: boolean | null;
          created_at?: string;
          image_url?: string | null;
          is_featured?: boolean | null;
          checkout_url?: string | null;
          shopify_variant_id?: string | null;
          is_visible?: boolean | null;
          sort_order?: number | null;
          badge_type?: string | null;
          reward_type?: string | null;
        };
        Update: {
          id?: string;
          campaign_id?: string | null;
          title?: string;
          price?: number;
          original_price?: number | null;
          description?: string | null;
          items_included?: string[] | null;
          estimated_delivery?: string | null;
          ships_to?: string[] | null;
          limit_quantity?: number | null;
          backers_count?: number | null;
          is_sold_out?: boolean | null;
          created_at?: string;
          image_url?: string | null;
          is_featured?: boolean | null;
          checkout_url?: string | null;
          shopify_variant_id?: string | null;
          is_visible?: boolean | null;
          sort_order?: number | null;
          badge_type?: string | null;
          reward_type?: string | null;
        };
        Relationships: [];
      };
      cf_faq: {
        Row: {
          id: string;
          campaign_id: string | null;
          category: string | null;
          question: string;
          answer: string;
          order: number | null;
        };
        Insert: {
          id: string;
          campaign_id?: string | null;
          category?: string | null;
          question: string;
          answer: string;
          order?: number | null;
        };
        Update: {
          id?: string;
          campaign_id?: string | null;
          category?: string | null;
          question?: string;
          answer?: string;
          order?: number | null;
        };
        Relationships: [];
      };
      cf_update: {
        Row: {
          id: string;
          campaign_id: string;
          title: string;
          content: string;
          image: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          campaign_id?: string;
          title: string;
          content: string;
          image?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          campaign_id?: string;
          title?: string;
          content?: string;
          image?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      cf_comment: {
        Row: {
          id: string;
          update_id: string | null;
          email: string;
          name: string;
          content: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          update_id?: string | null;
          email: string;
          name: string;
          content: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          update_id?: string | null;
          email?: string;
          name?: string;
          content?: string;
          created_at?: string | null;
        };
        Relationships: [];
      };
      cf_pledge: {
        Row: {
          id: string;
          campaign_id: string | null;
          reward_id: string | null;
          customer_id: string | null;
          amount: number;
          status: string | null;
          created_at: string;
          shipping_address: string | null;
          shipping_location: string | null;
        };
        Insert: {
          id?: string;
          campaign_id?: string | null;
          reward_id?: string | null;
          customer_id?: string | null;
          amount: number;
          status?: string | null;
          created_at?: string;
          shipping_address?: string | null;
          shipping_location?: string | null;
        };
        Update: {
          id?: string;
          campaign_id?: string | null;
          reward_id?: string | null;
          customer_id?: string | null;
          amount?: number;
          status?: string | null;
          created_at?: string;
          shipping_address?: string | null;
          shipping_location?: string | null;
        };
        Relationships: [];
      };
      // --- preorder orders -----------------------------------------------------
      preorder_orders: {
        Row: {
          id: string;
          order_name: string;
          raw_shopify_id: string | null;
          import_batch_id: string;
          source: string;
          email: string;
          customer_name: string | null;
          created_at: string;
          financial_status: string | null;
          fulfillment_status: string | null;
          total_paid_usd: number | null;
          payment_type: string;
          is_reservation: boolean;
          lineitem_name: string | null;
          product_line: string | null;
          size_variant: string | null;
          finish: string | null;
          inserted_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_name: string;
          raw_shopify_id?: string | null;
          import_batch_id: string;
          source?: string;
          email: string;
          customer_name?: string | null;
          created_at: string;
          financial_status?: string | null;
          fulfillment_status?: string | null;
          total_paid_usd?: number | null;
          payment_type: string;
          is_reservation?: boolean;
          lineitem_name?: string | null;
          product_line?: string | null;
          size_variant?: string | null;
          finish?: string | null;
          inserted_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_name?: string;
          raw_shopify_id?: string | null;
          import_batch_id?: string;
          source?: string;
          email?: string;
          customer_name?: string | null;
          created_at?: string;
          financial_status?: string | null;
          fulfillment_status?: string | null;
          total_paid_usd?: number | null;
          payment_type?: string;
          is_reservation?: boolean;
          lineitem_name?: string | null;
          product_line?: string | null;
          size_variant?: string | null;
          finish?: string | null;
          inserted_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      // --- buyer update emails -------------------------------------------------
      buyer_update_emails: {
        Row: {
          id: string;
          update_key: string;
          title: string;
          status: BuyerUpdateEmailStatus;
          subject_lines: string[];
          campaign_ids: string[];
          sent_first_at: string | null;
          sent_last_at: string | null;
          recipient_count: number;
          audience: string;
          website_url: string | null;
          video_url: string | null;
          summary: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          update_key: string;
          title: string;
          status?: BuyerUpdateEmailStatus;
          subject_lines?: string[];
          campaign_ids?: string[];
          sent_first_at?: string | null;
          sent_last_at?: string | null;
          recipient_count?: number;
          audience?: string;
          website_url?: string | null;
          video_url?: string | null;
          summary?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          update_key?: string;
          title?: string;
          status?: BuyerUpdateEmailStatus;
          subject_lines?: string[];
          campaign_ids?: string[];
          sent_first_at?: string | null;
          sent_last_at?: string | null;
          recipient_count?: number;
          audience?: string;
          website_url?: string | null;
          video_url?: string | null;
          summary?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      buyer_survey_responses: {
        Row: {
          id: string;
          buyer_id: string;
          answers: Json;
          reward_usd: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          buyer_id: string;
          answers?: Json;
          reward_usd?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          buyer_id?: string;
          answers?: Json;
          reward_usd?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      buyer_call_requests: {
        Row: {
          id: string;
          buyer_id: string;
          contact_method: BuyerCallContactMethod;
          contact_value: string | null;
          preferred_times: string[];
          preferred_days: string[];
          day_parts: string[];
          timezone: string | null;
          notes: string | null;
          status: BuyerCallStatus;
          reward_usd: number;
          scheduled_at: string | null;
          scheduled_minutes: number;
          meeting_url: string | null;
          meeting_provider_id: string | null;
          invite_sent_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          buyer_id: string;
          contact_method: BuyerCallContactMethod;
          contact_value?: string | null;
          preferred_times?: string[];
          preferred_days?: string[];
          day_parts?: string[];
          timezone?: string | null;
          notes?: string | null;
          status?: BuyerCallStatus;
          reward_usd?: number;
          scheduled_at?: string | null;
          scheduled_minutes?: number;
          meeting_url?: string | null;
          meeting_provider_id?: string | null;
          invite_sent_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          buyer_id?: string;
          contact_method?: BuyerCallContactMethod;
          contact_value?: string | null;
          preferred_times?: string[];
          preferred_days?: string[];
          day_parts?: string[];
          timezone?: string | null;
          notes?: string | null;
          status?: BuyerCallStatus;
          reward_usd?: number;
          scheduled_at?: string | null;
          scheduled_minutes?: number;
          meeting_url?: string | null;
          meeting_provider_id?: string | null;
          invite_sent_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      store_credits: {
        Row: {
          id: string;
          buyer_id: string;
          amount_usd: number;
          reason: string;
          source: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          buyer_id: string;
          amount_usd: number;
          reason: string;
          source?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          buyer_id?: string;
          amount_usd?: number;
          reason?: string;
          source?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      buyer_preference_changes: {
        Row: {
          id: string;
          buyer_id: string;
          size_variant: string | null;
          finish: string | null;
          upgrade_to_pro: boolean;
          previous: Json;
          source: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          buyer_id: string;
          size_variant?: string | null;
          finish?: string | null;
          upgrade_to_pro?: boolean;
          previous?: Json;
          source?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          buyer_id?: string;
          size_variant?: string | null;
          finish?: string | null;
          upgrade_to_pro?: boolean;
          previous?: Json;
          source?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_analytics_summary: {
        Args: {
          p_range?: string;
          p_exclude_admin?: boolean;
          p_exclude_bots?: boolean;
        };
        Returns: Json;
      };
      get_setting_text_array: {
        Args: {
          p_key: string;
        };
        Returns: string[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

// --- convenience aliases ---------------------------------------------------------

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
