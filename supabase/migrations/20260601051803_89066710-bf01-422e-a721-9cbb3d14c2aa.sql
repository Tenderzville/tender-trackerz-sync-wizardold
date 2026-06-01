
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.log_security_audit() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.sync_forum_upvotes() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_automation_log_completion() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.enforce_tender_supplier_prep_window() FROM anon, authenticated, PUBLIC;
