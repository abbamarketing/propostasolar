ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_clients_company_deleted ON public.clients(company_id, deleted_at);
CREATE INDEX IF NOT EXISTS idx_clients_company_nome ON public.clients(company_id, nome);
CREATE INDEX IF NOT EXISTS idx_clients_company_cpf_cnpj ON public.clients(company_id, cpf_cnpj);
CREATE INDEX IF NOT EXISTS idx_clients_company_cidade ON public.clients(company_id, endereco_cidade);
CREATE INDEX IF NOT EXISTS idx_clients_company_concessionaria ON public.clients(company_id, concessionaria);

CREATE TABLE IF NOT EXISTS public.client_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  client_id UUID NOT NULL,
  categoria TEXT NOT NULL DEFAULT 'outros',
  nome_arquivo TEXT NOT NULL,
  url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT,
  tamanho_bytes INTEGER,
  uploaded_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.client_documents ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_client_documents_client ON public.client_documents(client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_client_documents_company ON public.client_documents(company_id);

CREATE OR REPLACE FUNCTION public.prepare_client_document_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
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

DROP TRIGGER IF EXISTS prepare_client_document_insert_trigger ON public.client_documents;
CREATE TRIGGER prepare_client_document_insert_trigger
BEFORE INSERT ON public.client_documents
FOR EACH ROW
EXECUTE FUNCTION public.prepare_client_document_insert();

DROP POLICY IF EXISTS "Company users can view client documents" ON public.client_documents;
CREATE POLICY "Company users can view client documents"
ON public.client_documents
FOR SELECT
TO authenticated
USING (company_id = private.auth_company_id());

DROP POLICY IF EXISTS "Company users can insert client documents" ON public.client_documents;
CREATE POLICY "Company users can insert client documents"
ON public.client_documents
FOR INSERT
TO authenticated
WITH CHECK (
  company_id = private.auth_company_id()
  AND EXISTS (
    SELECT 1 FROM public.clients c
    WHERE c.id = client_id
      AND c.company_id = private.auth_company_id()
      AND c.deleted_at IS NULL
  )
);

DROP POLICY IF EXISTS "Company users can update client documents" ON public.client_documents;
CREATE POLICY "Company users can update client documents"
ON public.client_documents
FOR UPDATE
TO authenticated
USING (company_id = private.auth_company_id())
WITH CHECK (company_id = private.auth_company_id());

DROP POLICY IF EXISTS "Company users can delete client documents" ON public.client_documents;
CREATE POLICY "Company users can delete client documents"
ON public.client_documents
FOR DELETE
TO authenticated
USING (company_id = private.auth_company_id());