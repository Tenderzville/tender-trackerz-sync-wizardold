DROP POLICY "Published tutorials are public" ON public.tutorials;
CREATE POLICY "Published tutorials are public" ON public.tutorials FOR SELECT TO anon, authenticated USING (is_published = true);
CREATE POLICY "Admins view all tutorials" ON public.tutorials FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));