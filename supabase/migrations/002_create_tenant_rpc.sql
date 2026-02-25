-- ============================================================================
-- Migration 002: RPC for atomic tenant + admin user creation
-- ============================================================================
-- When a user signs up, they need a tenant row AND a users row created
-- atomically. Since the new user has no row in public.users yet, RLS policies
-- would block them. This SECURITY DEFINER function runs as the DB owner.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_tenant_with_admin(
  p_user_id    UUID,
  p_tenant_name TEXT,
  p_tenant_slug TEXT,
  p_tenant_type TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  -- Validate tenant type
  IF p_tenant_type NOT IN ('restaurant', 'event_organizer', 'band') THEN
    RAISE EXCEPTION 'Invalid tenant type: %', p_tenant_type;
  END IF;

  -- Validate slug format (lowercase, hyphens, no leading/trailing hyphens)
  IF p_tenant_slug !~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?$' THEN
    RAISE EXCEPTION 'Invalid slug format: %', p_tenant_slug;
  END IF;

  -- Validate slug length
  IF length(p_tenant_slug) < 3 OR length(p_tenant_slug) > 63 THEN
    RAISE EXCEPTION 'Slug must be between 3 and 63 characters';
  END IF;

  -- Check slug uniqueness (the UNIQUE constraint will catch it too, but a
  -- friendlier error message is better UX)
  IF EXISTS (SELECT 1 FROM tenants WHERE slug = p_tenant_slug) THEN
    RAISE EXCEPTION 'Slug already taken: %', p_tenant_slug;
  END IF;

  -- Create tenant
  INSERT INTO tenants (name, slug, type)
  VALUES (p_tenant_name, p_tenant_slug, p_tenant_type::tenant_type)
  RETURNING id INTO v_tenant_id;

  -- Create admin user linked to the tenant
  INSERT INTO users (id, tenant_id, role)
  VALUES (p_user_id, v_tenant_id, 'tenant_admin');

  RETURN v_tenant_id;
END;
$$;

-- Grant execute to authenticated users (they just signed up via Supabase Auth)
GRANT EXECUTE ON FUNCTION public.create_tenant_with_admin(UUID, TEXT, TEXT, TEXT) TO authenticated;
