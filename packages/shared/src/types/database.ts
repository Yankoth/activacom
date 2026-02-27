// ── Enum types ──────────────────────────────────────────────────────────────

export type EventType = 'raffle' | 'photo_drop';
export type EventStatus = 'draft' | 'active' | 'closed' | 'archived';
export type UserRole = 'super_admin' | 'tenant_admin' | 'moderator';
export type QRMode = 'fixed' | 'rotating';
export type PhotoSource = 'camera' | 'gallery' | 'both';
export type PhotoStatus = 'pending' | 'approved' | 'rejected';
export type FieldType = 'text' | 'email' | 'phone' | 'number' | 'select' | 'textarea';
export type ContactFieldType = 'email' | 'phone' | 'name';
export type PlanType = 'free' | 'basic' | 'premium';
export type TenantType = 'restaurant' | 'event_organizer' | 'band';
export type CreditTransactionType = 'purchase' | 'consumption' | 'refund' | 'bonus';
export type AdImpressionType = 'view' | 'click';
export type VerificationTokenType = 'email' | 'phone';
export type DisplayState = 'PLACEHOLDER' | 'PHOTOS' | 'WINNER' | 'IDLE';
export type CampaignType = 'sms' | 'email';
export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled';
export type CampaignMessageStatus = 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced';

// ── Database type (Supabase GenericSchema) ──────────────────────────────────

export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string;
          name: string;
          slug: string;
          type: TenantType;
          plan: PlanType;
          credit_balance: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          type: TenantType;
          plan?: PlanType;
          credit_balance?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          slug?: string;
          type?: TenantType;
          plan?: PlanType;
          credit_balance?: number;
          is_active?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      users: {
        Row: {
          id: string;
          tenant_id: string;
          role: UserRole;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          tenant_id: string;
          role: UserRole;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          tenant_id?: string;
          role?: UserRole;
          updated_at?: string;
        };
        Relationships: [];
      };
      events: {
        Row: {
          id: string;
          tenant_id: string;
          name: string;
          description: string | null;
          type: EventType;
          status: EventStatus;
          code: string;
          qr_mode: QRMode;
          photo_source: PhotoSource | null;
          geofencing_enabled: boolean;
          geofencing_lat: number | null;
          geofencing_lng: number | null;
          geofencing_radius: number | null;
          privacy_notice_url: string | null;
          display_photo_duration: number;
          max_display_sessions: number;
          starts_at: string | null;
          ends_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          name: string;
          description?: string | null;
          type: EventType;
          status?: EventStatus;
          code: string;
          qr_mode: QRMode;
          photo_source?: PhotoSource | null;
          geofencing_enabled?: boolean;
          geofencing_lat?: number | null;
          geofencing_lng?: number | null;
          geofencing_radius?: number | null;
          privacy_notice_url?: string | null;
          display_photo_duration?: number;
          max_display_sessions?: number;
          starts_at?: string | null;
          ends_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          tenant_id?: string;
          name?: string;
          description?: string | null;
          type?: EventType;
          status?: EventStatus;
          code?: string;
          qr_mode?: QRMode;
          photo_source?: PhotoSource | null;
          geofencing_enabled?: boolean;
          geofencing_lat?: number | null;
          geofencing_lng?: number | null;
          geofencing_radius?: number | null;
          privacy_notice_url?: string | null;
          display_photo_duration?: number;
          max_display_sessions?: number;
          starts_at?: string | null;
          ends_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      form_fields: {
        Row: {
          id: string;
          event_id: string;
          label: string;
          field_type: FieldType;
          is_required: boolean;
          is_contact_field: boolean;
          contact_type: ContactFieldType | null;
          options: string[] | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          label: string;
          field_type: FieldType;
          is_required?: boolean;
          is_contact_field?: boolean;
          contact_type?: ContactFieldType | null;
          options?: string[] | null;
          sort_order: number;
          created_at?: string;
        };
        Update: {
          event_id?: string;
          label?: string;
          field_type?: FieldType;
          is_required?: boolean;
          is_contact_field?: boolean;
          contact_type?: ContactFieldType | null;
          options?: string[] | null;
          sort_order?: number;
        };
        Relationships: [];
      };
      contacts: {
        Row: {
          id: string;
          tenant_id: string;
          email: string | null;
          phone: string | null;
          first_name: string | null;
          last_name: string | null;
          email_verified: boolean;
          phone_verified: boolean;
          marketing_opt_in: boolean;
          opted_out: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          email?: string | null;
          phone?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          email_verified?: boolean;
          phone_verified?: boolean;
          marketing_opt_in?: boolean;
          opted_out?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          tenant_id?: string;
          email?: string | null;
          phone?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          email_verified?: boolean;
          phone_verified?: boolean;
          marketing_opt_in?: boolean;
          opted_out?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      event_registrations: {
        Row: {
          id: string;
          event_id: string;
          contact_id: string;
          form_data: Record<string, unknown>;
          privacy_accepted: boolean;
          marketing_opt_in: boolean;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          contact_id: string;
          form_data: Record<string, unknown>;
          privacy_accepted: boolean;
          marketing_opt_in?: boolean;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          event_id?: string;
          contact_id?: string;
          form_data?: Record<string, unknown>;
          privacy_accepted?: boolean;
          marketing_opt_in?: boolean;
          ip_address?: string | null;
          user_agent?: string | null;
        };
        Relationships: [];
      };
      photos: {
        Row: {
          id: string;
          event_id: string;
          registration_id: string;
          storage_path: string;
          thumbnail_path: string | null;
          status: PhotoStatus;
          moderated_by: string | null;
          moderated_at: string | null;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          registration_id: string;
          storage_path: string;
          thumbnail_path?: string | null;
          status?: PhotoStatus;
          moderated_by?: string | null;
          moderated_at?: string | null;
          expires_at: string;
          created_at?: string;
        };
        Update: {
          event_id?: string;
          registration_id?: string;
          storage_path?: string;
          thumbnail_path?: string | null;
          status?: PhotoStatus;
          moderated_by?: string | null;
          moderated_at?: string | null;
          expires_at?: string;
        };
        Relationships: [];
      };
      event_winners: {
        Row: {
          id: string;
          event_id: string;
          registration_id: string;
          contact_id: string;
          selected_by: string;
          selected_at: string;
          announced: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          registration_id: string;
          contact_id: string;
          selected_by: string;
          selected_at?: string;
          announced?: boolean;
          created_at?: string;
        };
        Update: {
          event_id?: string;
          registration_id?: string;
          contact_id?: string;
          selected_by?: string;
          selected_at?: string;
          announced?: boolean;
        };
        Relationships: [];
      };
      display_sessions: {
        Row: {
          id: string;
          event_id: string;
          device_code: string;
          session_token: string;
          is_active: boolean;
          last_heartbeat: string;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          device_code: string;
          session_token: string;
          is_active?: boolean;
          last_heartbeat?: string;
          expires_at: string;
          created_at?: string;
        };
        Update: {
          event_id?: string;
          device_code?: string;
          session_token?: string;
          is_active?: boolean;
          last_heartbeat?: string;
          expires_at?: string;
        };
        Relationships: [];
      };
      credit_transactions: {
        Row: {
          id: string;
          tenant_id: string;
          amount: number;
          type: CreditTransactionType;
          description: string | null;
          reference_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          amount: number;
          type: CreditTransactionType;
          description?: string | null;
          reference_id?: string | null;
          created_at?: string;
        };
        Update: {
          tenant_id?: string;
          amount?: number;
          type?: CreditTransactionType;
          description?: string | null;
          reference_id?: string | null;
        };
        Relationships: [];
      };
      licenses: {
        Row: {
          id: string;
          tenant_id: string;
          plan: PlanType;
          starts_at: string;
          ends_at: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          plan: PlanType;
          starts_at: string;
          ends_at: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          tenant_id?: string;
          plan?: PlanType;
          starts_at?: string;
          ends_at?: string;
          is_active?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      ads: {
        Row: {
          id: string;
          title: string;
          image_url: string;
          click_url: string | null;
          is_active: boolean;
          priority: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          image_url: string;
          click_url?: string | null;
          is_active?: boolean;
          priority?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          image_url?: string;
          click_url?: string | null;
          is_active?: boolean;
          priority?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      ad_impressions: {
        Row: {
          id: string;
          ad_id: string;
          event_id: string | null;
          registration_id: string | null;
          impression_type: AdImpressionType;
          created_at: string;
        };
        Insert: {
          id?: string;
          ad_id: string;
          event_id?: string | null;
          registration_id?: string | null;
          impression_type: AdImpressionType;
          created_at?: string;
        };
        Update: {
          ad_id?: string;
          event_id?: string | null;
          registration_id?: string | null;
          impression_type?: AdImpressionType;
        };
        Relationships: [];
      };
      verification_tokens: {
        Row: {
          id: string;
          contact_id: string;
          token: string;
          type: VerificationTokenType;
          expires_at: string;
          used_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          contact_id: string;
          token: string;
          type: VerificationTokenType;
          expires_at: string;
          used_at?: string | null;
          created_at?: string;
        };
        Update: {
          contact_id?: string;
          token?: string;
          type?: VerificationTokenType;
          expires_at?: string;
          used_at?: string | null;
        };
        Relationships: [];
      };
      campaigns: {
        Row: {
          id: string;
          tenant_id: string;
          name: string;
          type: CampaignType;
          subject: string | null;
          body: string | null;
          status: CampaignStatus;
          recipient_count: number;
          scheduled_at: string | null;
          sent_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          name: string;
          type: CampaignType;
          subject?: string | null;
          body?: string | null;
          status?: CampaignStatus;
          recipient_count?: number;
          scheduled_at?: string | null;
          sent_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          tenant_id?: string;
          name?: string;
          type?: CampaignType;
          subject?: string | null;
          body?: string | null;
          status?: CampaignStatus;
          recipient_count?: number;
          scheduled_at?: string | null;
          sent_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      campaign_messages: {
        Row: {
          id: string;
          campaign_id: string;
          contact_id: string;
          status: CampaignMessageStatus;
          sent_at: string | null;
          delivered_at: string | null;
          error_message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          contact_id: string;
          status?: CampaignMessageStatus;
          sent_at?: string | null;
          delivered_at?: string | null;
          error_message?: string | null;
          created_at?: string;
        };
        Update: {
          campaign_id?: string;
          contact_id?: string;
          status?: CampaignMessageStatus;
          sent_at?: string | null;
          delivered_at?: string | null;
          error_message?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_tenant_with_admin: {
        Args: {
          p_user_id: string;
          p_tenant_name: string;
          p_tenant_slug: string;
          p_tenant_type: string;
        };
        Returns: string;
      };
    };
  };
}

// ── Entity aliases ──────────────────────────────────────────────────────────

// Row aliases (what SELECT returns)
export type Tenant = Database['public']['Tables']['tenants']['Row'];
export type User = Database['public']['Tables']['users']['Row'];
export type Event = Database['public']['Tables']['events']['Row'];
export type FormField = Database['public']['Tables']['form_fields']['Row'];
export type Contact = Database['public']['Tables']['contacts']['Row'];
export type EventRegistration = Database['public']['Tables']['event_registrations']['Row'];
export type Photo = Database['public']['Tables']['photos']['Row'];
export type EventWinner = Database['public']['Tables']['event_winners']['Row'];
export type DisplaySession = Database['public']['Tables']['display_sessions']['Row'];
export type CreditTransaction = Database['public']['Tables']['credit_transactions']['Row'];
export type License = Database['public']['Tables']['licenses']['Row'];
export type Ad = Database['public']['Tables']['ads']['Row'];
export type AdImpression = Database['public']['Tables']['ad_impressions']['Row'];
export type VerificationToken = Database['public']['Tables']['verification_tokens']['Row'];
export type Campaign = Database['public']['Tables']['campaigns']['Row'];
export type CampaignMessage = Database['public']['Tables']['campaign_messages']['Row'];

// Insert aliases
export type TenantInsert = Database['public']['Tables']['tenants']['Insert'];
export type UserInsert = Database['public']['Tables']['users']['Insert'];
export type EventInsert = Database['public']['Tables']['events']['Insert'];
export type FormFieldInsert = Database['public']['Tables']['form_fields']['Insert'];
export type ContactInsert = Database['public']['Tables']['contacts']['Insert'];
export type EventRegistrationInsert = Database['public']['Tables']['event_registrations']['Insert'];
export type PhotoInsert = Database['public']['Tables']['photos']['Insert'];
export type EventWinnerInsert = Database['public']['Tables']['event_winners']['Insert'];
export type DisplaySessionInsert = Database['public']['Tables']['display_sessions']['Insert'];
export type CreditTransactionInsert = Database['public']['Tables']['credit_transactions']['Insert'];
export type LicenseInsert = Database['public']['Tables']['licenses']['Insert'];
export type AdInsert = Database['public']['Tables']['ads']['Insert'];
export type AdImpressionInsert = Database['public']['Tables']['ad_impressions']['Insert'];
export type VerificationTokenInsert = Database['public']['Tables']['verification_tokens']['Insert'];
export type CampaignInsert = Database['public']['Tables']['campaigns']['Insert'];
export type CampaignMessageInsert = Database['public']['Tables']['campaign_messages']['Insert'];

// Update aliases
export type TenantUpdate = Database['public']['Tables']['tenants']['Update'];
export type UserUpdate = Database['public']['Tables']['users']['Update'];
export type EventUpdate = Database['public']['Tables']['events']['Update'];
export type FormFieldUpdate = Database['public']['Tables']['form_fields']['Update'];
export type ContactUpdate = Database['public']['Tables']['contacts']['Update'];
export type EventRegistrationUpdate = Database['public']['Tables']['event_registrations']['Update'];
export type PhotoUpdate = Database['public']['Tables']['photos']['Update'];
export type EventWinnerUpdate = Database['public']['Tables']['event_winners']['Update'];
export type DisplaySessionUpdate = Database['public']['Tables']['display_sessions']['Update'];
export type CreditTransactionUpdate = Database['public']['Tables']['credit_transactions']['Update'];
export type LicenseUpdate = Database['public']['Tables']['licenses']['Update'];
export type AdUpdate = Database['public']['Tables']['ads']['Update'];
export type AdImpressionUpdate = Database['public']['Tables']['ad_impressions']['Update'];
export type VerificationTokenUpdate = Database['public']['Tables']['verification_tokens']['Update'];
export type CampaignUpdate = Database['public']['Tables']['campaigns']['Update'];
export type CampaignMessageUpdate = Database['public']['Tables']['campaign_messages']['Update'];

// ── Edge Function input/response types ──────────────────────────────────────

export interface RegisterParticipantInput {
  event_code: string;
  form_data: Record<string, unknown>;
  privacy_accepted: boolean;
  marketing_opt_in: boolean;
  turnstile_token: string;
}

export interface RegisterParticipantResponse {
  success: true;
  registration_id: string;
  contact_id: string;
  is_returning: boolean;
}

export interface AlreadyRegisteredResponse {
  already_registered: true;
  contact_name: string | null;
}

export interface UploadPhotoResponse {
  photo_id: string;
  storage_path: string;
}

export interface AuthorizeDisplayInput {
  device_code: string;
  event_code: string;
}

export interface AuthorizeDisplayResponse {
  session_token: string;
  event: Pick<Event, 'id' | 'name' | 'type' | 'status' | 'display_photo_duration'>;
}

export interface EventPublicData {
  id: string;
  name: string;
  type: EventType;
  status: EventStatus;
  privacy_notice_url: string | null;
  photo_source: PhotoSource | null;
  geofencing_enabled: boolean;
  geofencing_lat: number | null;
  geofencing_lng: number | null;
  geofencing_radius: number | null;
  form_fields: Array<{
    id: string;
    label: string;
    field_type: FieldType;
    is_required: boolean;
    options: string[] | null;
    sort_order: number;
  }>;
}

export interface CheckParticipantInput {
  event_code: string;
  email?: string;
  phone?: string;
}

export interface CheckParticipantResponse {
  registered_in_event: boolean;
  returning_contact: boolean;
  contact_name: string | null;
  prefill_data: Record<string, unknown> | null;
}

export interface SelectWinnerInput {
  event_id: string;
  method: 'random' | 'manual';
  registration_id?: string; // required only when method === 'manual'
}

export interface SelectWinnerResponse {
  winner: {
    id: string;
    event_id: string;
    registration_id: string;
    contact_id: string;
    selected_by: string;
    selected_at: string;
    contact: {
      first_name: string | null;
      last_name: string | null;
      email: string | null;
      phone: string | null;
    };
  };
  winner_number: number;
}

export interface DisplayEventState {
  display_state: DisplayState;
  current_photo_id?: string;
  winner?: EventWinner & { contact: Pick<Contact, 'first_name' | 'last_name'> };
}

// ── Application-level input types (admin panel forms) ───────────────────────

export interface CreateEventInput {
  name: string;
  description?: string;
  type: EventType;
  qr_mode: QRMode;
  photo_source?: PhotoSource;
  geofencing_enabled?: boolean;
  geofencing_lat?: number;
  geofencing_lng?: number;
  geofencing_radius?: number;
  privacy_notice_url?: string;
  display_photo_duration?: number;
  max_display_sessions?: number;
  starts_at?: string;
  ends_at?: string;
}

export interface UpdateEventInput extends Partial<CreateEventInput> {
  status?: EventStatus;
}

export interface CreateFormFieldInput {
  label: string;
  field_type: FieldType;
  is_required?: boolean;
  is_contact_field?: boolean;
  contact_type?: ContactFieldType;
  options?: string[];
  sort_order: number;
}
