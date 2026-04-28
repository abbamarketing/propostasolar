ALTER TABLE public.user_profiles
ALTER COLUMN id SET DEFAULT gen_random_uuid();

CREATE POLICY "Admins can insert company profiles"
ON public.user_profiles
FOR INSERT
TO authenticated
WITH CHECK (
  company_id = private.auth_company_id()
  AND private.has_role(auth.uid(), 'admin'::app_role)
);