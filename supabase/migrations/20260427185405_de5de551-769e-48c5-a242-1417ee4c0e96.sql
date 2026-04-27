CREATE OR REPLACE FUNCTION private.handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  default_company_id uuid;
  assigned_role public.app_role := 'vendedor';
BEGIN
  SELECT id INTO default_company_id FROM public.companies WHERE cnpj = '66.050.090/0001-33' LIMIT 1;

  IF NOT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE company_id = default_company_id
      AND role = 'admin'
  ) THEN
    assigned_role := 'admin';
  END IF;

  INSERT INTO public.user_profiles (id, company_id, nome, email)
  VALUES (
    NEW.id,
    default_company_id,
    COALESCE(NEW.raw_user_meta_data ->> 'nome', NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.email, '')
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, company_id, role)
  VALUES (NEW.id, default_company_id, assigned_role)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.handle_new_user_profile() FROM PUBLIC;

UPDATE storage.buckets
SET public = true
WHERE id IN ('company-assets', 'proposal-photos');
