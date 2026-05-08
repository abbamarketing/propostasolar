REVOKE ALL ON FUNCTION public.prepare_proposal_insert() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.prepare_proposal_insert() FROM anon;
REVOKE ALL ON FUNCTION public.prepare_proposal_insert() FROM authenticated;

REVOKE ALL ON FUNCTION public.prepare_client_document_insert() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.prepare_client_document_insert() FROM anon;
REVOKE ALL ON FUNCTION public.prepare_client_document_insert() FROM authenticated;