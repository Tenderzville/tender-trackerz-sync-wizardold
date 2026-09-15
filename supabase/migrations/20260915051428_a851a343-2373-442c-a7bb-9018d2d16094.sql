GRANT SELECT ON public.tender_posters TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tender_posters TO authenticated;
GRANT ALL ON public.tender_posters TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.tender_posters_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.tender_posters_id_seq TO service_role;