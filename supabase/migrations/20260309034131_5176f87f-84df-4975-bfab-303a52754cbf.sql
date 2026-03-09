
-- Learning Hub: Guides table
CREATE TABLE public.learning_guides (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  title_sw TEXT,
  description TEXT NOT NULL,
  description_sw TEXT,
  content TEXT NOT NULL,
  content_sw TEXT,
  category VARCHAR NOT NULL DEFAULT 'Beginner',
  read_time VARCHAR DEFAULT '10 min',
  payment_status VARCHAR NOT NULL DEFAULT 'pending',
  payment_reference TEXT,
  amount NUMERIC NOT NULL DEFAULT 500,
  currency VARCHAR NOT NULL DEFAULT 'KES',
  is_approved BOOLEAN NOT NULL DEFAULT false,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Learning Hub: Templates table
CREATE TABLE public.learning_templates (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  title_sw TEXT,
  description TEXT,
  description_sw TEXT,
  format VARCHAR NOT NULL DEFAULT 'PDF',
  category VARCHAR NOT NULL DEFAULT 'Essential',
  file_url TEXT NOT NULL,
  payment_status VARCHAR NOT NULL DEFAULT 'pending',
  payment_reference TEXT,
  amount NUMERIC NOT NULL DEFAULT 300,
  currency VARCHAR NOT NULL DEFAULT 'KES',
  is_approved BOOLEAN NOT NULL DEFAULT false,
  is_published BOOLEAN NOT NULL DEFAULT false,
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Learning Hub: Courses table
CREATE TABLE public.learning_courses (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  title_sw TEXT,
  description TEXT,
  description_sw TEXT,
  level VARCHAR NOT NULL DEFAULT 'Beginner',
  modules INTEGER NOT NULL DEFAULT 1,
  duration VARCHAR DEFAULT '1 hour',
  duration_sw VARCHAR,
  topics TEXT[] DEFAULT '{}',
  course_url TEXT,
  payment_status VARCHAR NOT NULL DEFAULT 'pending',
  payment_reference TEXT,
  amount NUMERIC NOT NULL DEFAULT 1000,
  currency VARCHAR NOT NULL DEFAULT 'KES',
  is_approved BOOLEAN NOT NULL DEFAULT false,
  is_published BOOLEAN NOT NULL DEFAULT false,
  enrollment_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.learning_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_courses ENABLE ROW LEVEL SECURITY;

-- Anyone can view published content
CREATE POLICY "Anyone can view published guides" ON public.learning_guides FOR SELECT USING (is_published = true AND is_approved = true);
CREATE POLICY "Anyone can view published templates" ON public.learning_templates FOR SELECT USING (is_published = true AND is_approved = true);
CREATE POLICY "Anyone can view published courses" ON public.learning_courses FOR SELECT USING (is_published = true AND is_approved = true);

-- Users can view their own content
CREATE POLICY "Users can view own guides" ON public.learning_guides FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own templates" ON public.learning_templates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own courses" ON public.learning_courses FOR SELECT USING (auth.uid() = user_id);

-- Users can create content
CREATE POLICY "Users can create guides" ON public.learning_guides FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can create templates" ON public.learning_templates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can create courses" ON public.learning_courses FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update own content
CREATE POLICY "Users can update own guides" ON public.learning_guides FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can update own templates" ON public.learning_templates FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can update own courses" ON public.learning_courses FOR UPDATE USING (auth.uid() = user_id);

-- Admins can manage all
CREATE POLICY "Admins manage guides" ON public.learning_guides FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage templates" ON public.learning_templates FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage courses" ON public.learning_courses FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Updated_at triggers
CREATE TRIGGER update_learning_guides_updated_at BEFORE UPDATE ON public.learning_guides FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_learning_templates_updated_at BEFORE UPDATE ON public.learning_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_learning_courses_updated_at BEFORE UPDATE ON public.learning_courses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
