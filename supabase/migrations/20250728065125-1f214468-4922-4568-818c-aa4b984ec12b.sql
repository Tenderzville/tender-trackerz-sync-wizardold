-- Create user profiles table for additional user information
CREATE TABLE public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    first_name text,
    last_name text,
    email text unique,
    profile_image_url text,
    company text,
    phone_number text,
    location text,
    business_type text,
    subscription_type text default 'free',
    subscription_status text default 'active',
    subscription_start_date timestamp,
    subscription_end_date timestamp,
    is_early_user boolean default false,
    paypal_subscription_id text,
    loyalty_points integer default 0,
    referral_code text unique,
    referred_by text,
    twitter_followed boolean default false,
    total_referrals integer default 0,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Create tender categories table
CREATE TABLE public.tender_categories (
    id serial primary key,
    name varchar(100) not null unique,
    description text,
    created_at timestamp with time zone default now()
);

-- Create tenders table
CREATE TABLE public.tenders (
    id serial primary key,
    title varchar(500) not null,
    description text not null,
    organization varchar(200) not null,
    category varchar(100) not null,
    location varchar(100) not null,
    budget_estimate bigint,
    deadline date not null,
    publish_date date default current_date,
    status varchar(50) default 'active',
    requirements text[],
    documents text[],
    contact_email varchar(255),
    contact_phone varchar(50),
    tender_number varchar(100),
    source_url text,
    scraped_from varchar(50),
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Create saved tenders table
CREATE TABLE public.saved_tenders (
    id serial primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    tender_id integer references public.tenders(id) on delete cascade not null,
    created_at timestamp with time zone default now(),
    unique(user_id, tender_id)
);

-- Create consortiums table
CREATE TABLE public.consortiums (
    id serial primary key,
    name varchar(200) not null,
    description text,
    tender_id integer references public.tenders(id) on delete set null,
    created_by uuid references auth.users(id) on delete cascade not null,
    status varchar(50) default 'active',
    max_members integer default 10,
    required_skills text[],
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Create consortium members table
CREATE TABLE public.consortium_members (
    id serial primary key,
    consortium_id integer references public.consortiums(id) on delete cascade not null,
    user_id uuid references auth.users(id) on delete cascade not null,
    role varchar(50) default 'member',
    expertise varchar(200),
    contribution text,
    joined_at timestamp with time zone default now(),
    unique(consortium_id, user_id)
);

-- Create service providers table
CREATE TABLE public.service_providers (
    id serial primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    name varchar(200) not null,
    email varchar(255) not null,
    phone varchar(50),
    specialization varchar(200) not null,
    description text,
    experience integer,
    rating decimal(3,2) default 0.00,
    review_count integer default 0,
    hourly_rate integer,
    availability varchar(50) default 'available',
    certifications text[],
    portfolio text[],
    profile_image text,
    website text,
    linkedin text,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Create AI analyses table
CREATE TABLE public.ai_analyses (
    id serial primary key,
    tender_id integer references public.tenders(id) on delete cascade not null,
    estimated_value_min bigint,
    estimated_value_max bigint,
    win_probability integer,
    recommendations text[],
    confidence_score integer,
    analysis_data jsonb,
    model_version varchar(50),
    created_at timestamp with time zone default now()
);

-- Create user alerts table
CREATE TABLE public.user_alerts (
    id serial primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    type varchar(50) not null,
    title varchar(200) not null,
    message text not null,
    data jsonb,
    is_read boolean default false,
    created_at timestamp with time zone default now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tender_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_tenders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consortiums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consortium_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_alerts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles
FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = id);

-- Tender categories policies (public read, admin write)
CREATE POLICY "Anyone can view tender categories" ON public.tender_categories
FOR SELECT USING (true);

-- Tenders policies (public read)
CREATE POLICY "Anyone can view tenders" ON public.tenders
FOR SELECT USING (true);

-- Saved tenders policies
CREATE POLICY "Users can view their own saved tenders" ON public.saved_tenders
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can save tenders" ON public.saved_tenders
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave their tenders" ON public.saved_tenders
FOR DELETE USING (auth.uid() = user_id);

-- Consortiums policies
CREATE POLICY "Anyone can view consortiums" ON public.consortiums
FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create consortiums" ON public.consortiums
FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Consortium creators can update their consortiums" ON public.consortiums
FOR UPDATE USING (auth.uid() = created_by);

-- Consortium members policies
CREATE POLICY "Anyone can view consortium members" ON public.consortium_members
FOR SELECT USING (true);

CREATE POLICY "Users can join consortiums" ON public.consortium_members
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave consortiums" ON public.consortium_members
FOR DELETE USING (auth.uid() = user_id);

-- Service providers policies
CREATE POLICY "Anyone can view service providers" ON public.service_providers
FOR SELECT USING (true);

CREATE POLICY "Users can create their service provider profile" ON public.service_providers
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their service provider profile" ON public.service_providers
FOR UPDATE USING (auth.uid() = user_id);

-- AI analyses policies (public read)
CREATE POLICY "Anyone can view AI analyses" ON public.ai_analyses
FOR SELECT USING (true);

-- User alerts policies
CREATE POLICY "Users can view their own alerts" ON public.user_alerts
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own alerts" ON public.user_alerts
FOR UPDATE USING (auth.uid() = user_id);

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tenders_updated_at
    BEFORE UPDATE ON public.tenders
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_consortiums_updated_at
    BEFORE UPDATE ON public.consortiums
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_service_providers_updated_at
    BEFORE UPDATE ON public.service_providers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some default tender categories
INSERT INTO public.tender_categories (name, description) VALUES
('Construction', 'Building, infrastructure, and construction projects'),
('ICT', 'Information and communication technology services'),
('Consulting', 'Professional consulting and advisory services'),
('Goods Supply', 'Supply of goods and equipment'),
('Transport', 'Transportation and logistics services'),
('Security', 'Security and surveillance services'),
('Maintenance', 'Maintenance and repair services'),
('Catering', 'Catering and hospitality services');