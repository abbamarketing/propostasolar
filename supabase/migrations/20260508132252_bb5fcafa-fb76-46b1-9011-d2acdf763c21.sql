CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.prepare_proposal_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'private'
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

CREATE OR REPLACE FUNCTION public.prepare_client_document_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.company_id IS NULL THEN
    SELECT c.company_id INTO NEW.company_id
    FROM public.clients c
    WHERE c.id = NEW.client_id;
  END IF;

  IF NEW.uploaded_by IS NULL THEN
    NEW.uploaded_by := auth.uid();
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_companies_updated_at ON public.companies;
CREATE TRIGGER set_companies_updated_at
BEFORE UPDATE ON public.companies
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER set_user_profiles_updated_at
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_clients_updated_at ON public.clients;
CREATE TRIGGER set_clients_updated_at
BEFORE UPDATE ON public.clients
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_products_modules_updated_at ON public.products_modules;
CREATE TRIGGER set_products_modules_updated_at
BEFORE UPDATE ON public.products_modules
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_products_inverters_updated_at ON public.products_inverters;
CREATE TRIGGER set_products_inverters_updated_at
BEFORE UPDATE ON public.products_inverters
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_proposals_updated_at ON public.proposals;
CREATE TRIGGER set_proposals_updated_at
BEFORE UPDATE ON public.proposals
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS prepare_proposals_insert ON public.proposals;
CREATE TRIGGER prepare_proposals_insert
BEFORE INSERT ON public.proposals
FOR EACH ROW
EXECUTE FUNCTION public.prepare_proposal_insert();

DROP TRIGGER IF EXISTS prepare_client_document_insert_trigger ON public.client_documents;
CREATE TRIGGER prepare_client_document_insert_trigger
BEFORE INSERT ON public.client_documents
FOR EACH ROW
EXECUTE FUNCTION public.prepare_client_document_insert();