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
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          notes?: string | null;
          source?: BuyerSource;
          shopify_order_number?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          notes?: string | null;
          source?: BuyerSource;
          shopify_order_number?: string | null;
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
