-- 1. Add is_active column
ALTER TABLE public.users
  ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;

-- 2. Update RLS helper functions to respect is_active
CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS UUID LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN (SELECT tenant_id FROM public.users WHERE id = auth.uid() AND is_active = true);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN (SELECT role FROM public.users WHERE id = auth.uid() AND is_active = true);
END;
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'super_admin' AND is_active = true
  );
END;
$$;

-- 3. RPC to list moderators with emails (joins auth.users safely)
CREATE OR REPLACE FUNCTION public.get_tenant_moderators(p_tenant_id UUID)
RETURNS TABLE(id UUID, email TEXT, role TEXT, is_active BOOLEAN, created_at TIMESTAMPTZ)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Only allow tenant_admin of the same tenant or super_admin
  IF NOT EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
      AND users.is_active = true
      AND (users.tenant_id = p_tenant_id OR users.role = 'super_admin')
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT u.id, au.email::TEXT, u.role, u.is_active, u.created_at
  FROM public.users u
  JOIN auth.users au ON au.id = u.id
  WHERE u.tenant_id = p_tenant_id AND u.role = 'moderator'
  ORDER BY u.created_at DESC;
END;
$$;
