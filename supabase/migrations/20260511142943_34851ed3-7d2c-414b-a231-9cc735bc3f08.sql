INSERT INTO public.webhook_endpoints (name, source, secret, is_active)
SELECT 'Browse AI - eGP Kenya', 'egpkenya', encode(gen_random_bytes(24), 'hex'), true
WHERE NOT EXISTS (SELECT 1 FROM public.webhook_endpoints WHERE source = 'egpkenya');