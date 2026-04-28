ALTER TABLE public.proposal_financing_options
ADD COLUMN IF NOT EXISTS incluir_proposta boolean NOT NULL DEFAULT true;