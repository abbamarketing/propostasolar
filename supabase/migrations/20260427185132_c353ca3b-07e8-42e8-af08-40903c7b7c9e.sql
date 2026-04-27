-- Roles kept separate from profiles for security
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'vendedor', 'gestor');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  razao_social text NOT NULL,
  nome_fantasia text,
  cnpj text NOT NULL UNIQUE,
  inscricao_estadual text,
  endereco_logradouro text,
  endereco_numero text,
  endereco_complemento text,
  endereco_bairro text,
  endereco_cidade text,
  endereco_uf text CHECK (endereco_uf IS NULL OR length(endereco_uf) = 2),
  endereco_cep text,
  email text,
  telefone text,
  whatsapp text,
  site text,
  logo_url text,
  cor_primaria text DEFAULT '#16A34A',
  cor_secundaria text DEFAULT '#0F172A',
  responsavel_tecnico_nome text,
  responsavel_tecnico_crea text,
  responsavel_tecnico_email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.companies(id),
  nome text NOT NULL,
  email text NOT NULL,
  telefone text,
  cargo text,
  avatar_url text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'vendedor',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, company_id, role)
);

CREATE TABLE public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('PF','PJ')),
  nome text NOT NULL,
  nome_fantasia text,
  cpf_cnpj text NOT NULL,
  rg_ie text,
  email text,
  telefone text,
  whatsapp text,
  endereco_logradouro text,
  endereco_numero text,
  endereco_complemento text,
  endereco_bairro text,
  endereco_cidade text,
  endereco_uf text CHECK (endereco_uf IS NULL OR length(endereco_uf) = 2),
  endereco_cep text,
  concessionaria text,
  numero_instalacao text,
  tipo_ligacao text CHECK (tipo_ligacao IS NULL OR tipo_ligacao IN ('monofasica','bifasica','trifasica')),
  tipo_telhado text CHECK (tipo_telhado IS NULL OR tipo_telhado IN ('colonial','fibrocimento','metalico','laje','solo','outro')),
  conta_luz_media numeric(10,2),
  consumo_medio_kwh numeric(10,2),
  conta_luz_url text,
  observacoes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, cpf_cnpj)
);

CREATE TABLE public.products_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  marca text NOT NULL,
  modelo text NOT NULL,
  potencia_w int NOT NULL CHECK (potencia_w > 0),
  tecnologia text,
  eficiencia_pct numeric(5,2),
  garantia_produto_anos int DEFAULT 12,
  garantia_geracao_anos int DEFAULT 25,
  preco_custo numeric(10,2),
  preco_venda numeric(10,2),
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.products_inverters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  marca text NOT NULL,
  modelo text NOT NULL,
  potencia_kw numeric(6,2) NOT NULL CHECK (potencia_kw > 0),
  mppts int DEFAULT 1,
  fases text CHECK (fases IS NULL OR fases IN ('mono','bi','tri')),
  tipo text CHECK (tipo IS NULL OR tipo IN ('string','microinversor','hibrido')),
  garantia_anos int DEFAULT 10,
  preco_custo numeric(10,2),
  preco_venda numeric(10,2),
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.cities_irradiance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cidade text NOT NULL,
  uf text NOT NULL CHECK (length(uf) = 2),
  hsp_medio numeric(4,2) NOT NULL,
  hsp_jan numeric(4,2), hsp_fev numeric(4,2), hsp_mar numeric(4,2), hsp_abr numeric(4,2),
  hsp_mai numeric(4,2), hsp_jun numeric(4,2), hsp_jul numeric(4,2), hsp_ago numeric(4,2),
  hsp_set numeric(4,2), hsp_out numeric(4,2), hsp_nov numeric(4,2), hsp_dez numeric(4,2),
  UNIQUE (cidade, uf)
);

CREATE TABLE public.tariffs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  concessionaria text NOT NULL,
  uf text NOT NULL CHECK (length(uf) = 2),
  classe text CHECK (classe IS NULL OR classe IN ('residencial','comercial','rural','industrial')),
  subgrupo text,
  valor_kwh numeric(8,4) NOT NULL,
  bandeira_atual text CHECK (bandeira_atual IS NULL OR bandeira_atual IN ('verde','amarela','vermelha1','vermelha2')),
  atualizado_em date NOT NULL
);

CREATE TABLE public.structure_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  tipo_telhado text NOT NULL,
  placas_min int NOT NULL,
  placas_max int NOT NULL,
  custo_por_placa numeric(10,2) NOT NULL,
  CHECK (placas_min > 0 AND placas_max >= placas_min)
);

CREATE TABLE public.proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero text,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
  vendedor_id uuid REFERENCES auth.users(id),
  status text NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho','enviada','negociacao','aceita','recusada','expirada')),
  cidade_projeto text,
  uf_projeto text CHECK (uf_projeto IS NULL OR length(uf_projeto) = 2),
  hsp_usado numeric(4,2),
  performance_ratio numeric(4,3) DEFAULT 0.80,
  tarifa_kwh numeric(8,4),
  custo_disponibilidade_kwh int,
  consumo_estimado_kwh numeric(10,2),
  energia_compensar_kwh numeric(10,2),
  kwp_necessario numeric(8,3),
  kwp_instalado numeric(8,3),
  geracao_estimada_mensal numeric(10,2),
  geracao_estimada_anual numeric(10,2),
  modulo_id uuid REFERENCES public.products_modules(id),
  modulo_marca text,
  modulo_modelo text,
  modulo_potencia_w int,
  qtd_modulos int,
  inversor_id uuid REFERENCES public.products_inverters(id),
  inversor_marca text,
  inversor_modelo text,
  inversor_potencia_kw numeric(6,2),
  qtd_inversores int DEFAULT 1,
  custo_modulos numeric(10,2),
  custo_inversor numeric(10,2),
  custo_estrutura numeric(10,2),
  custo_cabos_protecoes numeric(10,2),
  custo_projeto_art numeric(10,2),
  custo_mao_obra numeric(10,2),
  custo_outros numeric(10,2),
  custo_total numeric(10,2),
  margem_pct numeric(5,2),
  valor_total numeric(10,2),
  valor_a_vista numeric(10,2),
  economia_mensal numeric(10,2),
  economia_anual numeric(10,2),
  payback_anos numeric(5,2),
  payback_descontado_anos numeric(5,2),
  co2_evitado_kg_ano numeric(10,2),
  template text DEFAULT 'on-grid-residencial',
  observacoes_comerciais text,
  validade_dias int DEFAULT 15,
  valido_ate date,
  pdf_url text,
  enviada_em timestamptz,
  aceita_em timestamptz,
  recusada_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, numero)
);

CREATE TABLE public.proposal_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  ordem int NOT NULL,
  categoria text,
  descricao text NOT NULL,
  quantidade numeric(10,2) DEFAULT 1,
  unidade text DEFAULT 'un',
  valor_unitario numeric(10,2),
  valor_total numeric(10,2)
);

CREATE TABLE public.proposal_financing_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  banco text,
  prazo_meses int,
  taxa_mensal numeric(6,4),
  valor_parcela numeric(10,2),
  valor_total_financiado numeric(10,2),
  entrada numeric(10,2) DEFAULT 0
);

CREATE TABLE public.proposal_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  url text NOT NULL,
  legenda text,
  ordem int DEFAULT 0
);

CREATE INDEX idx_user_profiles_company_id ON public.user_profiles(company_id);
CREATE INDEX idx_user_roles_user_company ON public.user_roles(user_id, company_id);
CREATE INDEX idx_clients_company_id ON public.clients(company_id);
CREATE INDEX idx_clients_created_by ON public.clients(created_by);
CREATE INDEX idx_products_modules_company_id ON public.products_modules(company_id);
CREATE INDEX idx_products_inverters_company_id ON public.products_inverters(company_id);
CREATE INDEX idx_cities_irradiance_city_uf ON public.cities_irradiance(cidade, uf);
CREATE INDEX idx_tariffs_lookup ON public.tariffs(concessionaria, uf, classe);
CREATE INDEX idx_structure_costs_company_roof ON public.structure_costs(company_id, tipo_telhado);
CREATE INDEX idx_proposals_company_id ON public.proposals(company_id);
CREATE INDEX idx_proposals_client_id ON public.proposals(client_id);
CREATE INDEX idx_proposals_vendedor_id ON public.proposals(vendedor_id);
CREATE INDEX idx_proposal_items_proposal_id ON public.proposal_items(proposal_id);
CREATE INDEX idx_proposal_financing_options_proposal_id ON public.proposal_financing_options(proposal_id);
CREATE INDEX idx_proposal_photos_proposal_id ON public.proposal_photos(proposal_id);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_products_modules_updated_at BEFORE UPDATE ON public.products_modules FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_products_inverters_updated_at BEFORE UPDATE ON public.products_inverters FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_proposals_updated_at BEFORE UPDATE ON public.proposals FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.auth_company_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.user_profiles WHERE id = auth.uid() AND ativo = true LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
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
      AND (company_id IS NULL OR company_id = public.auth_company_id())
  )
$$;

CREATE OR REPLACE FUNCTION public.proposal_company_id(_proposal_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.proposals WHERE id = _proposal_id LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.generate_proposal_number(_company_id uuid)
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

CREATE OR REPLACE FUNCTION public.prepare_proposal_insert()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.numero IS NULL OR btrim(NEW.numero) = '' THEN
    NEW.numero := public.generate_proposal_number(NEW.company_id);
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

CREATE TRIGGER prepare_proposals_insert BEFORE INSERT ON public.proposals FOR EACH ROW EXECUTE FUNCTION public.prepare_proposal_insert();

CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  default_company_id uuid;
BEGIN
  SELECT id INTO default_company_id
  FROM public.companies
  WHERE cnpj = '66.050.090/0001-33'
  LIMIT 1;

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

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products_inverters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cities_irradiance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tariffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.structure_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_financing_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company users can view their company" ON public.companies FOR SELECT TO authenticated USING (id = public.auth_company_id());
CREATE POLICY "Admins can update their company" ON public.companies FOR UPDATE TO authenticated USING (id = public.auth_company_id() AND public.has_role(auth.uid(), 'admin')) WITH CHECK (id = public.auth_company_id() AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view profiles from company" ON public.user_profiles FOR SELECT TO authenticated USING (id = auth.uid() OR company_id = public.auth_company_id());
CREATE POLICY "Users can update own profile" ON public.user_profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid() AND company_id = public.auth_company_id());
CREATE POLICY "Admins can update company profiles" ON public.user_profiles FOR UPDATE TO authenticated USING (company_id = public.auth_company_id() AND public.has_role(auth.uid(), 'admin')) WITH CHECK (company_id = public.auth_company_id() AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can insert own profile" ON public.user_profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR company_id = public.auth_company_id());
CREATE POLICY "Admins can manage company roles" ON public.user_roles FOR ALL TO authenticated USING (company_id = public.auth_company_id() AND public.has_role(auth.uid(), 'admin')) WITH CHECK (company_id = public.auth_company_id() AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Company users can manage clients" ON public.clients FOR ALL TO authenticated USING (company_id = public.auth_company_id()) WITH CHECK (company_id = public.auth_company_id());
CREATE POLICY "Company users can manage modules" ON public.products_modules FOR ALL TO authenticated USING (company_id = public.auth_company_id()) WITH CHECK (company_id = public.auth_company_id());
CREATE POLICY "Company users can manage inverters" ON public.products_inverters FOR ALL TO authenticated USING (company_id = public.auth_company_id()) WITH CHECK (company_id = public.auth_company_id());
CREATE POLICY "Company users can manage structure costs" ON public.structure_costs FOR ALL TO authenticated USING (company_id = public.auth_company_id()) WITH CHECK (company_id = public.auth_company_id());
CREATE POLICY "Company users can manage proposals" ON public.proposals FOR ALL TO authenticated USING (company_id = public.auth_company_id()) WITH CHECK (company_id = public.auth_company_id());

CREATE POLICY "Users can view proposal items by company" ON public.proposal_items FOR SELECT TO authenticated USING (public.proposal_company_id(proposal_id) = public.auth_company_id());
CREATE POLICY "Users can insert proposal items by company" ON public.proposal_items FOR INSERT TO authenticated WITH CHECK (public.proposal_company_id(proposal_id) = public.auth_company_id());
CREATE POLICY "Users can update proposal items by company" ON public.proposal_items FOR UPDATE TO authenticated USING (public.proposal_company_id(proposal_id) = public.auth_company_id()) WITH CHECK (public.proposal_company_id(proposal_id) = public.auth_company_id());
CREATE POLICY "Users can delete proposal items by company" ON public.proposal_items FOR DELETE TO authenticated USING (public.proposal_company_id(proposal_id) = public.auth_company_id());

CREATE POLICY "Users can view financing by company" ON public.proposal_financing_options FOR SELECT TO authenticated USING (public.proposal_company_id(proposal_id) = public.auth_company_id());
CREATE POLICY "Users can insert financing by company" ON public.proposal_financing_options FOR INSERT TO authenticated WITH CHECK (public.proposal_company_id(proposal_id) = public.auth_company_id());
CREATE POLICY "Users can update financing by company" ON public.proposal_financing_options FOR UPDATE TO authenticated USING (public.proposal_company_id(proposal_id) = public.auth_company_id()) WITH CHECK (public.proposal_company_id(proposal_id) = public.auth_company_id());
CREATE POLICY "Users can delete financing by company" ON public.proposal_financing_options FOR DELETE TO authenticated USING (public.proposal_company_id(proposal_id) = public.auth_company_id());

CREATE POLICY "Users can view proposal photos by company" ON public.proposal_photos FOR SELECT TO authenticated USING (public.proposal_company_id(proposal_id) = public.auth_company_id());
CREATE POLICY "Users can insert proposal photos by company" ON public.proposal_photos FOR INSERT TO authenticated WITH CHECK (public.proposal_company_id(proposal_id) = public.auth_company_id());
CREATE POLICY "Users can update proposal photos by company" ON public.proposal_photos FOR UPDATE TO authenticated USING (public.proposal_company_id(proposal_id) = public.auth_company_id()) WITH CHECK (public.proposal_company_id(proposal_id) = public.auth_company_id());
CREATE POLICY "Users can delete proposal photos by company" ON public.proposal_photos FOR DELETE TO authenticated USING (public.proposal_company_id(proposal_id) = public.auth_company_id());

CREATE POLICY "Authenticated users can view cities" ON public.cities_irradiance FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage cities" ON public.cities_irradiance FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated users can view tariffs" ON public.tariffs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage tariffs" ON public.tariffs FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('company-assets', 'company-assets', true),
  ('client-documents', 'client-documents', false),
  ('proposal-pdfs', 'proposal-pdfs', false),
  ('proposal-photos', 'proposal-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Company assets are public" ON storage.objects FOR SELECT USING (bucket_id = 'company-assets');
CREATE POLICY "Proposal photos are public" ON storage.objects FOR SELECT USING (bucket_id = 'proposal-photos');
CREATE POLICY "Users can manage company assets" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'company-assets' AND public.auth_company_id()::text = (storage.foldername(name))[1]) WITH CHECK (bucket_id = 'company-assets' AND public.auth_company_id()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can manage proposal photos" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'proposal-photos' AND public.auth_company_id()::text = (storage.foldername(name))[1]) WITH CHECK (bucket_id = 'proposal-photos' AND public.auth_company_id()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can manage client documents" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'client-documents' AND public.auth_company_id()::text = (storage.foldername(name))[1]) WITH CHECK (bucket_id = 'client-documents' AND public.auth_company_id()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can manage proposal PDFs" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'proposal-pdfs' AND public.auth_company_id()::text = (storage.foldername(name))[1]) WITH CHECK (bucket_id = 'proposal-pdfs' AND public.auth_company_id()::text = (storage.foldername(name))[1]);

WITH energiza AS (
  INSERT INTO public.companies (
    razao_social, cnpj, endereco_logradouro, endereco_numero, endereco_complemento,
    endereco_bairro, endereco_cidade, endereco_uf, endereco_cep,
    email, telefone, whatsapp, cor_primaria, cor_secundaria
  ) VALUES (
    'ENERGIZA SOLLAR LTDA', '66.050.090/0001-33', 'R. Miramar', '245', 'Letra A',
    'Nossa Senhora de Fátima', 'Montes Claros', 'MG', '39.402-769',
    'energizasollar@gmail.com', '(38) 9895-9015', '(38) 9895-9015', '#16A34A', '#0F172A'
  )
  ON CONFLICT (cnpj) DO UPDATE SET razao_social = EXCLUDED.razao_social
  RETURNING id
)
INSERT INTO public.structure_costs (company_id, tipo_telhado, placas_min, placas_max, custo_por_placa)
SELECT id, tipo_telhado, 1, 999, custo
FROM energiza
CROSS JOIN (VALUES
  ('colonial', 220::numeric),
  ('fibrocimento', 180::numeric),
  ('metalico', 160::numeric),
  ('laje', 240::numeric),
  ('solo', 320::numeric)
) AS costs(tipo_telhado, custo);

INSERT INTO public.cities_irradiance (cidade, uf, hsp_medio, hsp_jan, hsp_fev, hsp_mar, hsp_abr, hsp_mai, hsp_jun, hsp_jul, hsp_ago, hsp_set, hsp_out, hsp_nov, hsp_dez)
VALUES
  ('Montes Claros', 'MG', 5.85, 5.70, 5.80, 5.75, 5.65, 5.55, 5.45, 5.70, 6.05, 6.15, 6.10, 5.95, 5.80),
  ('Belo Horizonte', 'MG', 5.45, 5.30, 5.35, 5.30, 5.20, 5.05, 4.95, 5.20, 5.65, 5.80, 5.75, 5.65, 5.45),
  ('Uberlândia', 'MG', 5.62, 5.45, 5.55, 5.50, 5.35, 5.20, 5.10, 5.35, 5.85, 5.95, 5.90, 5.80, 5.55),
  ('Juiz de Fora', 'MG', 5.10, 5.00, 5.05, 4.95, 4.85, 4.70, 4.60, 4.85, 5.30, 5.45, 5.40, 5.30, 5.10),
  ('Pirapora', 'MG', 5.95, 5.80, 5.90, 5.85, 5.75, 5.65, 5.55, 5.85, 6.15, 6.25, 6.20, 6.05, 5.90),
  ('Janaúba', 'MG', 5.92, 5.78, 5.88, 5.82, 5.72, 5.62, 5.52, 5.82, 6.12, 6.22, 6.15, 6.02, 5.86),
  ('Bocaiúva', 'MG', 5.78, 5.62, 5.70, 5.65, 5.55, 5.45, 5.35, 5.62, 5.98, 6.08, 6.00, 5.88, 5.65),
  ('Salinas', 'MG', 5.88, 5.74, 5.82, 5.78, 5.68, 5.58, 5.48, 5.78, 6.08, 6.18, 6.12, 5.98, 5.82),
  ('Diamantina', 'MG', 5.65, 5.50, 5.58, 5.52, 5.42, 5.30, 5.18, 5.45, 5.85, 5.95, 5.88, 5.78, 5.55),
  ('Sete Lagoas', 'MG', 5.50, 5.35, 5.42, 5.36, 5.28, 5.12, 5.00, 5.25, 5.70, 5.85, 5.78, 5.68, 5.45)
ON CONFLICT (cidade, uf) DO UPDATE SET hsp_medio = EXCLUDED.hsp_medio;

INSERT INTO public.tariffs (concessionaria, uf, classe, valor_kwh, bandeira_atual, atualizado_em)
VALUES ('CEMIG', 'MG', 'residencial', 0.9850, 'verde', CURRENT_DATE);
