import type {
  EventType,
  EventStatus,
  UserRole,
  QRMode,
  PhotoSource,
  PhotoStatus,
  FieldType,
  ContactFieldType,
  PlanType,
  TenantType,
  CreditTransactionType,
  AdImpressionType,
  VerificationTokenType,
  DisplayState,
  CampaignType,
  CampaignStatus,
  CampaignMessageStatus,
} from '../types';

// ── Enum arrays ─────────────────────────────────────────────────────────────

export const EVENT_TYPES: EventType[] = ['raffle', 'photo_drop'];
export const EVENT_STATUSES: EventStatus[] = ['draft', 'active', 'closed', 'archived'];
export const USER_ROLES: UserRole[] = ['super_admin', 'tenant_admin', 'moderator'];
export const QR_MODES: QRMode[] = ['fixed', 'rotating'];
export const PHOTO_SOURCES: PhotoSource[] = ['camera', 'gallery', 'both'];
export const PHOTO_STATUSES: PhotoStatus[] = ['pending', 'approved', 'rejected'];
export const FIELD_TYPES: FieldType[] = ['text', 'email', 'phone', 'number', 'select', 'textarea'];
export const CONTACT_FIELD_TYPES: ContactFieldType[] = ['email', 'phone', 'name'];
export const PLAN_TYPES: PlanType[] = ['free', 'basic', 'premium'];
export const TENANT_TYPES: TenantType[] = ['restaurant', 'event_organizer', 'band'];
export const CREDIT_TRANSACTION_TYPES: CreditTransactionType[] = ['purchase', 'consumption', 'refund', 'bonus'];
export const AD_IMPRESSION_TYPES: AdImpressionType[] = ['view', 'click'];
export const VERIFICATION_TOKEN_TYPES: VerificationTokenType[] = ['email', 'phone'];
export const DISPLAY_STATES: DisplayState[] = ['PLACEHOLDER', 'PHOTOS', 'WINNER', 'IDLE'];
export const CAMPAIGN_TYPES: CampaignType[] = ['sms', 'email'];
export const CAMPAIGN_STATUSES: CampaignStatus[] = ['draft', 'scheduled', 'sending', 'sent', 'cancelled'];
export const CAMPAIGN_MESSAGE_STATUSES: CampaignMessageStatus[] = ['pending', 'sent', 'delivered', 'failed', 'bounced'];

// ── Numeric constants ───────────────────────────────────────────────────────

export const MAX_PHOTO_SIZE = 5 * 1024 * 1024; // 5MB
export const PHOTO_EXPIRE_DAYS = 30;
export const DISPLAY_HEARTBEAT_INTERVAL = 30_000; // 30 seconds
export const DEVICE_CODE_EXPIRY = 5 * 60 * 1000; // 5 minutes
export const MAX_DISPLAY_SESSIONS = 3;
export const DEFAULT_DISPLAY_PHOTO_DURATION = 5; // seconds
export const PHOTO_MAX_WIDTH = 1920;
export const PHOTO_COMPRESSION_QUALITY = 0.8;
export const PHOTO_THUMBNAIL_WIDTH = 400;
export const PHOTO_THUMBNAIL_QUALITY = 0.7;
export const RATE_LIMIT_ATTEMPTS_PER_MINUTE = 10;
export const DEVICE_CODE_LENGTH = 6;
