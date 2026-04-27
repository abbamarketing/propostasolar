CREATE SCHEMA IF NOT EXISTS private;

DROP POLICY IF EXISTS "Company users can view their company" ON public.companies;
DROP POLICY IF EXISTS "Admins can update their company" ON public.companies;
DROP POLICY IF EXISTS "Users can view profiles from company" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update company profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage company roles" ON public.user_roles;
DROP POLICY IF EXISTS "Company users can manage clients" ON public.clients;
DROP POLICY IF EXISTS "Company users can manage modules" ON public.products_modules;
DROP POLICY IF EXISTS "Company users can manage inverters" ON public.products_inverters;
DROP POLICY IF EXISTS "Company users can manage structure costs" ON public.structure_costs;
DROP POLICY IF EXISTS "Company users can manage proposals" ON public.proposals;
DROP POLICY IF EXISTS "Users can view proposal items by company" ON public.proposal_items;
DROP POLICY IF EXISTS "Users can insert proposal items by company" ON public.proposal_items;
DROP POLICY IF EXISTS "Users can update proposal items by company" ON public.proposal_items;
DROP POLICY IF EXISTS "Users can delete proposal items by company" ON public.proposal_items;
DROP POLICY IF EXISTS "Users can view financing by company" ON public.proposal_financing_options;
DROP POLICY IF EXISTS "Users can insert financing by company" ON public.proposal_financing_options;
DROP POLICY IF EXISTS "Users can update financing by company" ON public.proposal_financing_options;
DROP POLICY IF EXISTS "Users can delete financing by company" ON public.proposal_financing_options;
DROP POLICY IF EXISTS "Users can view proposal photos by company" ON public.proposal_photos;
DROP POLICY IF EXISTS "Users can insert proposal photos by company" ON public.proposal_photos;
DROP POLICY IF EXISTS "Users can update proposal photos by company" ON public.proposal_photos;
DROP POLICY IF EXISTS "Users can delete proposal photos by company" ON public.proposal_photos;
DROP POLICY IF EXISTS "Authenticated users can view cities" ON public.cities_irradiance;
DROP POLICY IF EXISTS "Admins can manage cities" ON public.cities_irradiance;
DROP POLICY IF EXISTS "Authenticated users can view tariffs" ON public.tariffs;
DROP POLICY IF EXISTS "Admins can manage tariffs" ON public.tariffs;
DROP POLICY IF EXISTS "Company assets are public" ON storage.objects;
DROP POLICY IF EXISTS "Proposal photos are public" ON storage.objects;
DROP POLICY IF EXISTS "Users can manage company assets" ON storage.objects;
DROP POLICY IF EXISTS "Users can manage proposal photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can manage client documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can manage proposal PDFs" ON storage.objects;

CREATE OR REPLACE FUNCTION private.auth_company_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.user_profiles WHERE id = auth.uid() AND ativo = true LIMIT 1
$$;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
      AND (company_id IS NULL OR company_id = private.auth_company_id())
  )
$$;

CREATE OR REPLACE FUNCTION private.proposal_company_id(_proposal_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.proposals WHERE id = _proposal_id LIMIT 1
$$;

CREATE OR REPLACE FUNCTION private.generate_proposal_number(_company_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  year_text text := to_char(current_date, 'YYYY');
  next_number int;
BEGIN
  SELECT COALESCE(MAX((substring(numero from 6 for 4))::int), 0) + 1
  INTO next_number
  FROM public.proposals
  WHERE company_id = _company_id
    AND numero ~ ('^' || year_text || '-[0-9]{4}$');

  RETURN year_text || '-' || lpad(next_number::text, 4, '0');
END;
$$;

CREATE OR REPLACE FUNCTION private.handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  default_company_id uuid;
BEGIN
  SELECT id INTO default_company_id FROM public.companies WHERE cnpj = '66.050.090/0001-33' LIMIT 1;

  INSERT INTO public.user_profiles (id, company_id, nome, email)
  VALUES (
    NEW.id,
    default_company_id,
    COALESCE(NEW.raw_user_meta_data ->> 'nome', NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.email, '')
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, company_id, role)
  VALUES (NEW.id, default_company_id, 'vendedor')
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.prepare_proposal_insert()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.numero IS NULL OR btrim(NEW.numero) = '' THEN
    NEW.numero := private.generate_proposal_number(NEW.company_id);
  END IF;

  IF NEW.valido_ate IS NULL THEN
    NEW.valido_ate := current_date + COALESCE(NEW.validade_dias, 15);
  END IF;

  IF NEW.vendedor_id IS NULL THEN
    NEW.vendedor_id := auth.uid();
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION private.handle_new_user_profile();

DROP FUNCTION IF EXISTS public.auth_company_id();
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);
DROP FUNCTION IF EXISTS public.proposal_company_id(uuid);
DROP FUNCTION IF EXISTS public.generate_proposal_number(uuid);
DROP FUNCTION IF EXISTS public.handle_new_user_profile();

REVOKE ALL ON SCHEMA private FROM PUBLIC;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA private FROM PUBLIC;
REVOKE ALL ON FUNCTION public.prepare_proposal_insert() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC;

CREATE POLICY "Company users can view their company" ON public.companies FOR SELECT TO authenticated USING (id = private.auth_company_id());
CREATE POLICY "Admins can update their company" ON public.companies FOR UPDATE TO authenticated USING (id = private.auth_company_id() AND private.has_role(auth.uid(), 'admin')) WITH CHECK (id = private.auth_company_id() AND private.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view profiles from company" ON public.user_profiles FOR SELECT TO authenticated USING (id = auth.uid() OR company_id = private.auth_company_id());
CREATE POLICY "Users can update own profile" ON public.user_profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid() AND company_id = private.auth_company_id());
CREATE POLICY "Admins can update company profiles" ON public.user_profiles FOR UPDATE TO authenticated USING (company_id = private.auth_company_id() AND private.has_role(auth.uid(), 'admin')) WITH CHECK (company_id = private.auth_company_id() AND private.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can insert own profile" ON public.user_profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR company_id = private.auth_company_id());
CREATE POLICY "Admins can manage company roles" ON public.user_roles FOR ALL TO authenticated USING (company_id = private.auth_company_id() AND private.has_role(auth.uid(), 'admin')) WITH CHECK (company_id = private.auth_company_id() AND private.has_role(auth.uid(), 'admin'));

CREATE POLICY "Company users can manage clients" ON public.clients FOR ALL TO authenticated USING (company_id = private.auth_company_id()) WITH CHECK (company_id = private.auth_company_id());
CREATE POLICY "Company users can manage modules" ON public.products_modules FOR ALL TO authenticated USING (company_id = private.auth_company_id()) WITH CHECK (company_id = private.auth_company_id());
CREATE POLICY "Company users can manage inverters" ON public.products_inverters FOR ALL TO authenticated USING (company_id = private.auth_company_id()) WITH CHECK (company_id = private.auth_company_id());
CREATE POLICY "Company users can manage structure costs" ON public.structure_costs FOR ALL TO authenticated USING (company_id = private.auth_company_id()) WITH CHECK (company_id = private.auth_company_id());
CREATE POLICY "Company users can manage proposals" ON public.proposals FOR ALL TO authenticated USING (company_id = private.auth_company_id()) WITH CHECK (company_id = private.auth_company_id());

CREATE POLICY "Users can view proposal items by company" ON public.proposal_items FOR SELECT TO authenticated USING (private.proposal_company_id(proposal_id) = private.auth_company_id());
CREATE POLICY "Users can insert proposal items by company" ON public.proposal_items FOR INSERT TO authenticated WITH CHECK (private.proposal_company_id(proposal_id) = private.auth_company_id());
CREATE POLICY "Users can update proposal items by company" ON public.proposal_items FOR UPDATE TO authenticated USING (private.proposal_company_id(proposal_id) = private.auth_company_id()) WITH CHECK (private.proposal_company_id(proposal_id) = private.auth_company_id());
CREATE POLICY "Users can delete proposal items by company" ON public.proposal_items FOR DELETE TO authenticated USING (private.proposal_company_id(proposal_id) = private.auth_company_id());

CREATE POLICY "Users can view financing by company" ON public.proposal_financing_options FOR SELECT TO authenticated USING (private.proposal_company_id(proposal_id) = private.auth_company_id());
CREATE POLICY "Users can insert financing by company" ON public.proposal_financing_options FOR INSERT TO authenticated WITH CHECK (private.proposal_company_id(proposal_id) = private.auth_company_id());
CREATE POLICY "Users can update financing by company" ON public.proposal_financing_options FOR UPDATE TO authenticated USING (private.proposal_company_id(proposal_id) = private.auth_company_id()) WITH CHECK (private.proposal_company_id(proposal_id) = private.auth_company_id());
CREATE POLICY "Users can delete financing by company" ON public.proposal_financing_options FOR DELETE TO authenticated USING (private.proposal_company_id(proposal_id) = private.auth_company_id());

CREATE POLICY "Users can view proposal photos by company" ON public.proposal_photos FOR SELECT TO authenticated USING (private.proposal_company_id(proposal_id) = private.auth_company_id());
CREATE POLICY "Users can insert proposal photos by company" ON public.proposal_photos FOR INSERT TO authenticated WITH CHECK (private.proposal_company_id(proposal_id) = private.auth_company_id());
CREATE POLICY "Users can update proposal photos by company" ON public.proposal_photos FOR UPDATE TO authenticated USING (private.proposal_company_id(proposal_id) = private.auth_company_id()) WITH CHECK (private.proposal_company_id(proposal_id) = private.auth_company_id());
CREATE POLICY "Users can delete proposal photos by company" ON public.proposal_photos FOR DELETE TO authenticated USING (private.proposal_company_id(proposal_id) = private.auth_company_id());

CREATE POLICY "Authenticated users can view cities" ON public.cities_irradiance FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage cities" ON public.cities_irradiance FOR ALL TO authenticated USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated users can view tariffs" ON public.tariffs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage tariffs" ON public.tariffs FOR ALL TO authenticated USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));

UPDATE storage.buckets SET public = false WHERE id IN ('company-assets', 'proposal-photos');

CREATE POLICY "Users can view company assets" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'company-assets' AND private.auth_company_id()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can manage company assets" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'company-assets' AND private.auth_company_id()::text = (storage.foldername(name))[1]) WITH CHECK (bucket_id = 'company-assets' AND private.auth_company_id()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can view proposal photos" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'proposal-photos' AND private.auth_company_id()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can manage proposal photos" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'proposal-photos' AND private.auth_company_id()::text = (storage.foldername(name))[1]) WITH CHECK (bucket_id = 'proposal-photos' AND private.auth_company_id()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can manage client documents" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'client-documents' AND private.auth_company_id()::text = (storage.foldername(name))[1]) WITH CHECK (bucket_id = 'client-documents' AND private.auth_company_id()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can manage proposal PDFs" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'proposal-pdfs' AND private.auth_company_id()::text = (storage.foldername(name))[1]) WITH CHECK (bucket_id = 'proposal-pdfs' AND private.auth_company_id()::text = (storage.foldername(name))[1]);
