ALTER TABLE public.proposals
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

CREATE TABLE IF NOT EXISTS public.proposal_status_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_id UUID NOT NULL,
  company_id UUID NOT NULL,
  from_status TEXT,
  to_status TEXT NOT NULL,
  motivo TEXT,
  changed_by UUID DEFAULT auth.uid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.proposal_status_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company users can view proposal events"
ON public.proposal_status_events
FOR SELECT
TO authenticated
USING (company_id = private.auth_company_id());

CREATE POLICY "Company users can insert proposal events"
ON public.proposal_status_events
FOR INSERT
TO authenticated
WITH CHECK (
  company_id = private.auth_company_id()
  AND private.proposal_company_id(proposal_id) = private.auth_company_id()
);

CREATE INDEX IF NOT EXISTS idx_proposals_company_deleted_created
ON public.proposals (company_id, deleted_at, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_proposals_status_validity
ON public.proposals (status, valido_ate)
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_proposal_status_events_proposal
ON public.proposal_status_events (proposal_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.mark_expired_proposals()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected_count INTEGER;
BEGIN
  UPDATE public.proposals
  SET status = 'expirada', updated_at = now()
  WHERE status IN ('enviada', 'negociacao')
    AND valido_ate < CURRENT_DATE
    AND deleted_at IS NULL;

  GET DIAGNOSTICS affected_count = ROW_COUNT;
  RETURN affected_count;
END;
$$;

CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.unschedule('mark-expired-proposals-daily')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'mark-expired-proposals-daily');

SELECT cron.schedule(
  'mark-expired-proposals-daily',
  '0 3 * * *',
  $$SELECT public.mark_expired_proposals();$$
);