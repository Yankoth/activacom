-- ============================================================================
-- ActivaCom — Initial Schema
-- Migration: 001_initial_schema.sql
-- ============================================================================

-- ── 1. Extensions ───────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── 2. Helper functions ─────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS UUID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (SELECT tenant_id FROM public.users WHERE id = auth.uid());
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (SELECT role FROM public.users WHERE id = auth.uid());
END;
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'super_admin');
END;
$$;

-- ── 3. updated_at trigger function ──────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ── 4. Tables ───────────────────────────────────────────────────────────────

-- 4.1 tenants
CREATE TABLE public.tenants (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  type        TEXT NOT NULL CHECK (type IN ('restaurant', 'event_organizer', 'band')),
  plan        TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'basic', 'premium')),
  credit_balance INTEGER NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 4.2 users
CREATE TABLE public.users (
  id          UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  tenant_id   UUID NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  role        TEXT NOT NULL CHECK (role IN ('super_admin', 'tenant_admin', 'moderator')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_tenant_id ON public.users (tenant_id);

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 4.3 events
CREATE TABLE public.events (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id               UUID NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  name                    TEXT NOT NULL,
  description             TEXT,
  type                    TEXT NOT NULL CHECK (type IN ('raffle', 'photo_drop')),
  status                  TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'closed', 'archived')),
  code                    TEXT NOT NULL UNIQUE,
  qr_mode                 TEXT NOT NULL CHECK (qr_mode IN ('fixed', 'rotating')),
  photo_source            TEXT CHECK (photo_source IN ('camera', 'gallery', 'both')),
  geofencing_enabled      BOOLEAN NOT NULL DEFAULT false,
  geofencing_lat          DOUBLE PRECISION,
  geofencing_lng          DOUBLE PRECISION,
  geofencing_radius       DOUBLE PRECISION,
  privacy_notice_url      TEXT,
  display_photo_duration  INTEGER NOT NULL DEFAULT 5,
  max_display_sessions    INTEGER NOT NULL DEFAULT 3,
  starts_at               TIMESTAMPTZ,
  ends_at                 TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_events_tenant_status ON public.events (tenant_id, status);

CREATE TRIGGER events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 4.4 form_fields
CREATE TABLE public.form_fields (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id          UUID NOT NULL REFERENCES public.events (id) ON DELETE CASCADE,
  label             TEXT NOT NULL,
  field_type        TEXT NOT NULL CHECK (field_type IN ('text', 'email', 'phone', 'number', 'select', 'textarea')),
  is_required       BOOLEAN NOT NULL DEFAULT false,
  is_contact_field  BOOLEAN NOT NULL DEFAULT false,
  contact_type      TEXT CHECK (contact_type IN ('email', 'phone', 'name')),
  options           TEXT[],
  sort_order        INTEGER NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_form_fields_event_sort ON public.form_fields (event_id, sort_order);

-- 4.5 contacts
CREATE TABLE public.contacts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  email           TEXT,
  phone           TEXT,
  first_name      TEXT,
  last_name       TEXT,
  email_verified  BOOLEAN NOT NULL DEFAULT false,
  phone_verified  BOOLEAN NOT NULL DEFAULT false,
  marketing_opt_in BOOLEAN NOT NULL DEFAULT false,
  opted_out       BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT contacts_email_or_phone CHECK (email IS NOT NULL OR phone IS NOT NULL)
);

CREATE INDEX idx_contacts_tenant_id ON public.contacts (tenant_id);
CREATE UNIQUE INDEX idx_contacts_tenant_email ON public.contacts (tenant_id, email) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX idx_contacts_tenant_phone ON public.contacts (tenant_id, phone) WHERE phone IS NOT NULL;

CREATE TRIGGER contacts_updated_at
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 4.6 event_registrations
CREATE TABLE public.event_registrations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id          UUID NOT NULL REFERENCES public.events (id) ON DELETE CASCADE,
  contact_id        UUID NOT NULL REFERENCES public.contacts (id) ON DELETE CASCADE,
  form_data         JSONB NOT NULL DEFAULT '{}',
  privacy_accepted  BOOLEAN NOT NULL,
  marketing_opt_in  BOOLEAN NOT NULL DEFAULT false,
  ip_address        TEXT,
  user_agent        TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_registration_event_contact UNIQUE (event_id, contact_id)
);

CREATE INDEX idx_registrations_event_id ON public.event_registrations (event_id);
CREATE INDEX idx_registrations_contact_id ON public.event_registrations (contact_id);

-- 4.7 photos
CREATE TABLE public.photos (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id          UUID NOT NULL REFERENCES public.events (id) ON DELETE CASCADE,
  registration_id   UUID NOT NULL REFERENCES public.event_registrations (id) ON DELETE CASCADE,
  storage_path      TEXT NOT NULL,
  thumbnail_path    TEXT,
  status            TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  moderated_by      UUID REFERENCES public.users (id) ON DELETE SET NULL,
  moderated_at      TIMESTAMPTZ,
  expires_at        TIMESTAMPTZ NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_photos_event_status ON public.photos (event_id, status);
CREATE INDEX idx_photos_registration_id ON public.photos (registration_id);

-- 4.8 event_winners
CREATE TABLE public.event_winners (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id          UUID NOT NULL REFERENCES public.events (id) ON DELETE CASCADE,
  registration_id   UUID NOT NULL REFERENCES public.event_registrations (id) ON DELETE CASCADE,
  contact_id        UUID NOT NULL REFERENCES public.contacts (id) ON DELETE CASCADE,
  selected_by       UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  selected_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  announced         BOOLEAN NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_winners_event_id ON public.event_winners (event_id);

-- 4.9 display_sessions
CREATE TABLE public.display_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        UUID NOT NULL REFERENCES public.events (id) ON DELETE CASCADE,
  device_code     TEXT NOT NULL CHECK (char_length(device_code) = 6),
  session_token   TEXT NOT NULL UNIQUE,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  last_heartbeat  TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at      TIMESTAMPTZ NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_display_sessions_event_active ON public.display_sessions (event_id, is_active);

-- 4.10 credit_transactions
CREATE TABLE public.credit_transactions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  amount        INTEGER NOT NULL,
  type          TEXT NOT NULL CHECK (type IN ('purchase', 'consumption', 'refund', 'bonus')),
  description   TEXT,
  reference_id  TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_credit_tx_tenant_created ON public.credit_transactions (tenant_id, created_at);

-- 4.11 licenses
CREATE TABLE public.licenses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  plan        TEXT NOT NULL CHECK (plan IN ('free', 'basic', 'premium')),
  starts_at   TIMESTAMPTZ NOT NULL,
  ends_at     TIMESTAMPTZ NOT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_licenses_tenant_id ON public.licenses (tenant_id);

CREATE TRIGGER licenses_updated_at
  BEFORE UPDATE ON public.licenses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 4.12 ads (global, no tenant_id)
CREATE TABLE public.ads (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  image_url   TEXT NOT NULL,
  click_url   TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  priority    INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER ads_updated_at
  BEFORE UPDATE ON public.ads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 4.13 ad_impressions
CREATE TABLE public.ad_impressions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id             UUID NOT NULL REFERENCES public.ads (id) ON DELETE CASCADE,
  event_id          UUID REFERENCES public.events (id) ON DELETE SET NULL,
  registration_id   UUID REFERENCES public.event_registrations (id) ON DELETE SET NULL,
  impression_type   TEXT NOT NULL CHECK (impression_type IN ('view', 'click')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ad_impressions_ad_id ON public.ad_impressions (ad_id);
CREATE INDEX idx_ad_impressions_event_id ON public.ad_impressions (event_id);

-- 4.14 campaigns (post-MVP)
CREATE TABLE public.campaigns (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES public.tenants (id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  type             TEXT NOT NULL CHECK (type IN ('sms', 'email')),
  subject          TEXT,
  body             TEXT,
  status           TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'cancelled')),
  recipient_count  INTEGER NOT NULL DEFAULT 0,
  scheduled_at     TIMESTAMPTZ,
  sent_at          TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_campaigns_tenant_status ON public.campaigns (tenant_id, status);

CREATE TRIGGER campaigns_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 4.15 campaign_messages (post-MVP)
CREATE TABLE public.campaign_messages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id   UUID NOT NULL REFERENCES public.campaigns (id) ON DELETE CASCADE,
  contact_id    UUID NOT NULL REFERENCES public.contacts (id) ON DELETE CASCADE,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'bounced')),
  sent_at       TIMESTAMPTZ,
  delivered_at  TIMESTAMPTZ,
  error_message TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_campaign_msgs_campaign_status ON public.campaign_messages (campaign_id, status);

-- 4.16 verification_tokens
CREATE TABLE public.verification_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id  UUID NOT NULL REFERENCES public.contacts (id) ON DELETE CASCADE,
  token       TEXT NOT NULL UNIQUE,
  type        TEXT NOT NULL CHECK (type IN ('email', 'phone')),
  expires_at  TIMESTAMPTZ NOT NULL,
  used_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_verification_tokens_contact_id ON public.verification_tokens (contact_id);
CREATE INDEX idx_verification_tokens_expires_at ON public.verification_tokens (expires_at);

-- ── 5. Row-Level Security ───────────────────────────────────────────────────

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_winners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.display_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_impressions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_tokens ENABLE ROW LEVEL SECURITY;

-- ── 5.1 tenants ─────────────────────────────────────────────────────────────

CREATE POLICY "tenants: own tenant or super_admin can select"
  ON public.tenants FOR SELECT
  TO authenticated
  USING (id = public.get_user_tenant_id() OR public.is_super_admin());

CREATE POLICY "tenants: super_admin can insert"
  ON public.tenants FOR INSERT
  TO authenticated
  WITH CHECK (public.is_super_admin());

CREATE POLICY "tenants: own tenant or super_admin can update"
  ON public.tenants FOR UPDATE
  TO authenticated
  USING (id = public.get_user_tenant_id() OR public.is_super_admin())
  WITH CHECK (id = public.get_user_tenant_id() OR public.is_super_admin());

CREATE POLICY "tenants: super_admin can delete"
  ON public.tenants FOR DELETE
  TO authenticated
  USING (public.is_super_admin());

-- ── 5.2 users ───────────────────────────────────────────────────────────────

CREATE POLICY "users: own tenant or super_admin can select"
  ON public.users FOR SELECT
  TO authenticated
  USING (tenant_id = public.get_user_tenant_id() OR public.is_super_admin());

CREATE POLICY "users: own tenant can insert"
  ON public.users FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = public.get_user_tenant_id() OR public.is_super_admin());

CREATE POLICY "users: own tenant or super_admin can update"
  ON public.users FOR UPDATE
  TO authenticated
  USING (tenant_id = public.get_user_tenant_id() OR public.is_super_admin())
  WITH CHECK (tenant_id = public.get_user_tenant_id() OR public.is_super_admin());

CREATE POLICY "users: super_admin can delete"
  ON public.users FOR DELETE
  TO authenticated
  USING (public.is_super_admin());

-- ── 5.3 events ──────────────────────────────────────────────────────────────

CREATE POLICY "events: own tenant or super_admin can select"
  ON public.events FOR SELECT
  TO authenticated
  USING (tenant_id = public.get_user_tenant_id() OR public.is_super_admin());

CREATE POLICY "events: own tenant can insert"
  ON public.events FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = public.get_user_tenant_id());

CREATE POLICY "events: own tenant or super_admin can update"
  ON public.events FOR UPDATE
  TO authenticated
  USING (tenant_id = public.get_user_tenant_id() OR public.is_super_admin())
  WITH CHECK (tenant_id = public.get_user_tenant_id() OR public.is_super_admin());

CREATE POLICY "events: own tenant or super_admin can delete"
  ON public.events FOR DELETE
  TO authenticated
  USING (tenant_id = public.get_user_tenant_id() OR public.is_super_admin());

-- ── 5.4 form_fields ─────────────────────────────────────────────────────────

CREATE POLICY "form_fields: own tenant or super_admin can select"
  ON public.form_fields FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = form_fields.event_id
        AND (e.tenant_id = public.get_user_tenant_id() OR public.is_super_admin())
    )
  );

CREATE POLICY "form_fields: own tenant can insert"
  ON public.form_fields FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = form_fields.event_id
        AND e.tenant_id = public.get_user_tenant_id()
    )
  );

CREATE POLICY "form_fields: own tenant or super_admin can update"
  ON public.form_fields FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = form_fields.event_id
        AND (e.tenant_id = public.get_user_tenant_id() OR public.is_super_admin())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = form_fields.event_id
        AND (e.tenant_id = public.get_user_tenant_id() OR public.is_super_admin())
    )
  );

CREATE POLICY "form_fields: own tenant or super_admin can delete"
  ON public.form_fields FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = form_fields.event_id
        AND (e.tenant_id = public.get_user_tenant_id() OR public.is_super_admin())
    )
  );

-- ── 5.5 contacts ────────────────────────────────────────────────────────────

CREATE POLICY "contacts: own tenant or super_admin can select"
  ON public.contacts FOR SELECT
  TO authenticated
  USING (tenant_id = public.get_user_tenant_id() OR public.is_super_admin());

CREATE POLICY "contacts: own tenant can insert"
  ON public.contacts FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = public.get_user_tenant_id());

CREATE POLICY "contacts: own tenant or super_admin can update"
  ON public.contacts FOR UPDATE
  TO authenticated
  USING (tenant_id = public.get_user_tenant_id() OR public.is_super_admin())
  WITH CHECK (tenant_id = public.get_user_tenant_id() OR public.is_super_admin());

CREATE POLICY "contacts: own tenant or super_admin can delete"
  ON public.contacts FOR DELETE
  TO authenticated
  USING (tenant_id = public.get_user_tenant_id() OR public.is_super_admin());

-- ── 5.6 event_registrations ─────────────────────────────────────────────────
-- No direct INSERT from clients — only via Edge Functions with service_role.

CREATE POLICY "event_registrations: own tenant or super_admin can select"
  ON public.event_registrations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_registrations.event_id
        AND (e.tenant_id = public.get_user_tenant_id() OR public.is_super_admin())
    )
  );

CREATE POLICY "event_registrations: own tenant or super_admin can update"
  ON public.event_registrations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_registrations.event_id
        AND (e.tenant_id = public.get_user_tenant_id() OR public.is_super_admin())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_registrations.event_id
        AND (e.tenant_id = public.get_user_tenant_id() OR public.is_super_admin())
    )
  );

CREATE POLICY "event_registrations: own tenant or super_admin can delete"
  ON public.event_registrations FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_registrations.event_id
        AND (e.tenant_id = public.get_user_tenant_id() OR public.is_super_admin())
    )
  );

-- ── 5.7 photos ──────────────────────────────────────────────────────────────
-- INSERT via Edge Functions only. Moderators can UPDATE status.

CREATE POLICY "photos: own tenant or super_admin can select"
  ON public.photos FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = photos.event_id
        AND (e.tenant_id = public.get_user_tenant_id() OR public.is_super_admin())
    )
  );

CREATE POLICY "photos: own tenant (admin or moderator) can update"
  ON public.photos FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = photos.event_id
        AND e.tenant_id = public.get_user_tenant_id()
    )
    AND public.get_user_role() IN ('tenant_admin', 'moderator', 'super_admin')
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = photos.event_id
        AND e.tenant_id = public.get_user_tenant_id()
    )
    AND public.get_user_role() IN ('tenant_admin', 'moderator', 'super_admin')
  );

CREATE POLICY "photos: super_admin can update any"
  ON public.photos FOR UPDATE
  TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

CREATE POLICY "photos: own tenant or super_admin can delete"
  ON public.photos FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = photos.event_id
        AND (e.tenant_id = public.get_user_tenant_id() OR public.is_super_admin())
    )
  );

-- ── 5.8 event_winners ───────────────────────────────────────────────────────

CREATE POLICY "event_winners: own tenant or super_admin can select"
  ON public.event_winners FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_winners.event_id
        AND (e.tenant_id = public.get_user_tenant_id() OR public.is_super_admin())
    )
  );

CREATE POLICY "event_winners: own tenant can insert"
  ON public.event_winners FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_winners.event_id
        AND e.tenant_id = public.get_user_tenant_id()
    )
  );

CREATE POLICY "event_winners: own tenant or super_admin can update"
  ON public.event_winners FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_winners.event_id
        AND (e.tenant_id = public.get_user_tenant_id() OR public.is_super_admin())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_winners.event_id
        AND (e.tenant_id = public.get_user_tenant_id() OR public.is_super_admin())
    )
  );

CREATE POLICY "event_winners: own tenant or super_admin can delete"
  ON public.event_winners FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_winners.event_id
        AND (e.tenant_id = public.get_user_tenant_id() OR public.is_super_admin())
    )
  );

-- ── 5.9 display_sessions ────────────────────────────────────────────────────
-- Additional policy for Display App to SELECT by session_token (anon role).

CREATE POLICY "display_sessions: own tenant or super_admin can select"
  ON public.display_sessions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = display_sessions.event_id
        AND (e.tenant_id = public.get_user_tenant_id() OR public.is_super_admin())
    )
  );

CREATE POLICY "display_sessions: anon can select by session_token"
  ON public.display_sessions FOR SELECT
  TO anon
  USING (is_active = true);

CREATE POLICY "display_sessions: own tenant can insert"
  ON public.display_sessions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = display_sessions.event_id
        AND e.tenant_id = public.get_user_tenant_id()
    )
  );

CREATE POLICY "display_sessions: own tenant or super_admin can update"
  ON public.display_sessions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = display_sessions.event_id
        AND (e.tenant_id = public.get_user_tenant_id() OR public.is_super_admin())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = display_sessions.event_id
        AND (e.tenant_id = public.get_user_tenant_id() OR public.is_super_admin())
    )
  );

CREATE POLICY "display_sessions: own tenant or super_admin can delete"
  ON public.display_sessions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = display_sessions.event_id
        AND (e.tenant_id = public.get_user_tenant_id() OR public.is_super_admin())
    )
  );

-- ── 5.10 credit_transactions ────────────────────────────────────────────────

CREATE POLICY "credit_transactions: own tenant or super_admin can select"
  ON public.credit_transactions FOR SELECT
  TO authenticated
  USING (tenant_id = public.get_user_tenant_id() OR public.is_super_admin());

CREATE POLICY "credit_transactions: super_admin can insert"
  ON public.credit_transactions FOR INSERT
  TO authenticated
  WITH CHECK (public.is_super_admin());

CREATE POLICY "credit_transactions: super_admin can update"
  ON public.credit_transactions FOR UPDATE
  TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

CREATE POLICY "credit_transactions: super_admin can delete"
  ON public.credit_transactions FOR DELETE
  TO authenticated
  USING (public.is_super_admin());

-- ── 5.11 licenses ───────────────────────────────────────────────────────────

CREATE POLICY "licenses: own tenant or super_admin can select"
  ON public.licenses FOR SELECT
  TO authenticated
  USING (tenant_id = public.get_user_tenant_id() OR public.is_super_admin());

CREATE POLICY "licenses: super_admin can insert"
  ON public.licenses FOR INSERT
  TO authenticated
  WITH CHECK (public.is_super_admin());

CREATE POLICY "licenses: super_admin can update"
  ON public.licenses FOR UPDATE
  TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

CREATE POLICY "licenses: super_admin can delete"
  ON public.licenses FOR DELETE
  TO authenticated
  USING (public.is_super_admin());

-- ── 5.12 ads (global — readable by everyone) ────────────────────────────────

CREATE POLICY "ads: anyone can select active ads"
  ON public.ads FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "ads: super_admin can insert"
  ON public.ads FOR INSERT
  TO authenticated
  WITH CHECK (public.is_super_admin());

CREATE POLICY "ads: super_admin can update"
  ON public.ads FOR UPDATE
  TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

CREATE POLICY "ads: super_admin can delete"
  ON public.ads FOR DELETE
  TO authenticated
  USING (public.is_super_admin());

-- ── 5.13 ad_impressions ─────────────────────────────────────────────────────
-- INSERT via Edge Functions (service_role). SELECT only for super_admin.

CREATE POLICY "ad_impressions: super_admin can select"
  ON public.ad_impressions FOR SELECT
  TO authenticated
  USING (public.is_super_admin());

-- ── 5.14 campaigns (post-MVP) ───────────────────────────────────────────────

CREATE POLICY "campaigns: own tenant or super_admin can select"
  ON public.campaigns FOR SELECT
  TO authenticated
  USING (tenant_id = public.get_user_tenant_id() OR public.is_super_admin());

CREATE POLICY "campaigns: own tenant can insert"
  ON public.campaigns FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = public.get_user_tenant_id());

CREATE POLICY "campaigns: own tenant or super_admin can update"
  ON public.campaigns FOR UPDATE
  TO authenticated
  USING (tenant_id = public.get_user_tenant_id() OR public.is_super_admin())
  WITH CHECK (tenant_id = public.get_user_tenant_id() OR public.is_super_admin());

CREATE POLICY "campaigns: own tenant or super_admin can delete"
  ON public.campaigns FOR DELETE
  TO authenticated
  USING (tenant_id = public.get_user_tenant_id() OR public.is_super_admin());

-- ── 5.15 campaign_messages (post-MVP) ───────────────────────────────────────

CREATE POLICY "campaign_messages: own tenant or super_admin can select"
  ON public.campaign_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = campaign_messages.campaign_id
        AND (c.tenant_id = public.get_user_tenant_id() OR public.is_super_admin())
    )
  );

-- ── 5.16 verification_tokens ────────────────────────────────────────────────
-- No direct access. Only via Edge Functions with service_role.
-- No policies = all access denied for authenticated/anon (RLS blocks by default).

-- ── 6. Seed data ────────────────────────────────────────────────────────────

-- Demo tenant
INSERT INTO public.tenants (id, name, slug, type, plan, credit_balance)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Demo Restaurant',
  'demo-restaurant',
  'restaurant',
  'premium',
  100
);

-- Demo super_admin user (requires matching auth.users entry created via Supabase Auth)
-- ID: 00000000-0000-0000-0000-000000000010
-- In local dev, create this user via supabase auth admin or seed auth.users separately.

-- Demo tenant_admin user
-- ID: 00000000-0000-0000-0000-000000000011
-- Same note as above.

-- Note: In production, users are created through Supabase Auth flow.
-- The public.users entries are created by a trigger or post-signup Edge Function.
-- For local development with `supabase db reset`, you can add auth.users entries
-- in supabase/seed.sql which runs after migrations.
