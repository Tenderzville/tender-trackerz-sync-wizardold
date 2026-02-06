-- Direct insert for admin role - the user exists in auth.users
INSERT INTO public.user_roles (user_id, role)
VALUES ('6d002ebb-e531-4b81-816d-1e92fa444613', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;