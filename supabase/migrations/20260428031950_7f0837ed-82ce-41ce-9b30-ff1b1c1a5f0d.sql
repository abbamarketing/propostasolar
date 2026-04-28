ALTER TABLE public.proposals
  ADD COLUMN IF NOT EXISTS personalizar_garantias boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS garantia_modulo_anos integer,
  ADD COLUMN IF NOT EXISTS garantia_inversor_anos integer,
  ADD COLUMN IF NOT EXISTS garantia_instalacao_anos integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS prazo_execucao_dias_uteis integer NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS prazo_homologacao_dias integer NOT NULL DEFAULT 90;