CREATE TABLE public.tutorials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  audience text NOT NULL DEFAULT 'supplier',
  duration text,
  youtube_url text,
  sort_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.tutorials TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tutorials TO authenticated;
GRANT ALL ON public.tutorials TO service_role;
ALTER TABLE public.tutorials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published tutorials are public" ON public.tutorials FOR SELECT USING (is_published = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert tutorials" ON public.tutorials FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update tutorials" ON public.tutorials FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete tutorials" ON public.tutorials FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_tutorials_updated_at BEFORE UPDATE ON public.tutorials FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
INSERT INTO public.tutorials (slug, title, description, audience, duration, sort_order) VALUES
('supplier-getting-started','Supplier: getting started','Sign up as a supplier, choose your role, set sectors, counties, budget and AGPO eligibility, and turn on alerts.','supplier','3 min',1),
('supplier-dashboard-tour','Supplier dashboard tour','Weekly tip, your numbers, Smart Matches, browsing and saving tenders, AI analysis, consortiums, RFQs and connecting your apps.','supplier','4 min',2),
('buyer-getting-started','Buyer: getting started','Sign up as a buyer, post an RFQ with documents, choose public or private, and review supplier quotes.','buyer','3 min',3),
('marketplace-service-providers','Marketplace and service providers','Find service providers, view profiles, get in touch and list your own service.','marketplace','3 min',4),
('connect-your-apps','Connect your apps','Get tender alerts in Gmail, Google Sheets, Slack, Discord, Telegram or any webhook.','supplier','3 min',5),
('learning-hub-blog','Learning hub and blog','Use guides and templates, and share your own know-how.','all','2 min',6),
('community-forum','Community forum','Ask questions and help other Kenyan bidders.','all','2 min',7),
('subscription-payments','Plans and payments','Free, Pro and Business plans, paying with Paystack, and the founding members offer.','all','2 min',8);