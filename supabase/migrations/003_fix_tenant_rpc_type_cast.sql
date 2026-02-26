-- ============================================================================
-- Migration 003: Fix invalid ::tenant_type cast in create_tenant_with_admin
-- ============================================================================
-- The previous migration (002) cast p_tenant_type::tenant_type, but no such
-- enum exists. The tenants.type column is TEXT with a CHECK constraint, so the
-- cast is unnecessary and causes a runtime error.
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

  -- Create tenant (no ::tenant_type cast — column is TEXT with CHECK constraint)
  INSERT INTO tenants (name, slug, type)
  VALUES (p_tenant_name, p_tenant_slug, p_tenant_type)
  RETURNING id INTO v_tenant_id;

  -- Create admin user linked to the tenant
  INSERT INTO users (id, tenant_id, role)
  VALUES (p_user_id, v_tenant_id, 'tenant_admin');

  RETURN v_tenant_id;
END;
$$;
