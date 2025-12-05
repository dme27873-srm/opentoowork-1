-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS (Safe creation)
DO $$ BEGIN
    CREATE TYPE work_authorization_type AS ENUM (
      'H1B', 'CPT-EAD', 'OPT-EAD', 'GC', 'GC-EAD', 'USC', 'TN'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('candidate', 'employer', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. TABLES

-- PROFILES: The hub for all users
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'candidate',
    full_name TEXT,
    email TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CANDIDATE DETAILS
CREATE TABLE IF NOT EXISTS candidate_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
    work_authorization work_authorization_type NOT NULL DEFAULT 'USC',
    resume_url TEXT,
    skills TEXT[],
    experience_years INTEGER,
    location TEXT,
    bio TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- EMPLOYER DETAILS
CREATE TABLE IF NOT EXISTS employer_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
    company_name TEXT NOT NULL,
    company_website TEXT,
    company_size TEXT,
    location TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- JOBS
CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employer_id UUID NOT NULL REFERENCES employer_profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    location TEXT NOT NULL,
    salary_min INTEGER,
    salary_max INTEGER,
    work_authorization work_authorization_type[],
    skills_required TEXT[],
    experience_required INTEGER,
    job_type TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- APPLICATIONS
CREATE TABLE IF NOT EXISTS applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending',
    cover_letter TEXT,
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(job_id, candidate_id)
);

-- SITE CONTENT (CMS for Admin)
CREATE TABLE IF NOT EXISTS site_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    section_key TEXT UNIQUE NOT NULL,
    content JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_updated_by UUID REFERENCES profiles(id)
);

-- 4. STORAGE SETUP
INSERT INTO storage.buckets (id, name, public) 
VALUES ('resumes', 'resumes', false)
ON CONFLICT (id) DO NOTHING;

-- 5. ROW LEVEL SECURITY (RLS) ENABLE
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE employer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;

-- 6. TIMESTAMP UPDATERS
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply timestamp triggers
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cp_updated_at ON candidate_profiles;
CREATE TRIGGER update_cp_updated_at BEFORE UPDATE ON candidate_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ep_updated_at ON employer_profiles;
CREATE TRIGGER update_ep_updated_at BEFORE UPDATE ON employer_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_jobs_updated_at ON jobs;
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. POLICIES (Permissions)

-- === PROFILES POLICIES ===

-- 1. Read: Everyone can read profiles
CREATE POLICY "Public profiles are viewable by everyone" 
ON profiles FOR SELECT USING (true);

-- 2. Insert: Users can create their own profile (Fixes Signup)
CREATE POLICY "Users can insert own profile" 
ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 3. Update: Users can edit their own profile
CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE USING (auth.uid() = id);

-- 4. Admin: Full Access
CREATE POLICY "Admins can update any profile" 
ON profiles FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can delete any profile" 
ON profiles FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- === CANDIDATE PROFILES POLICIES ===
CREATE POLICY "Anyone can view candidates" 
ON candidate_profiles FOR SELECT USING (true);

CREATE POLICY "Candidates can create own profile" 
ON candidate_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Candidates can update own profile" 
ON candidate_profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can update candidates" 
ON candidate_profiles FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- === EMPLOYER PROFILES POLICIES ===
CREATE POLICY "Anyone can view employers" 
ON employer_profiles FOR SELECT USING (true);

CREATE POLICY "Employers can create own profile" 
ON employer_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Employers can update own profile" 
ON employer_profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can update employers" 
ON employer_profiles FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- === JOBS POLICIES ===
CREATE POLICY "Active jobs are viewable by everyone" 
ON jobs FOR SELECT USING (is_active = true);

-- Employers can view their own non-active jobs
CREATE POLICY "Employers can view own jobs" 
ON jobs FOR SELECT USING (
    EXISTS (SELECT 1 FROM employer_profiles ep WHERE ep.id = jobs.employer_id AND ep.user_id = auth.uid())
);

CREATE POLICY "Employers can insert jobs" 
ON jobs FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM employer_profiles ep WHERE ep.id = jobs.employer_id AND ep.user_id = auth.uid())
);

CREATE POLICY "Employers can update own jobs" 
ON jobs FOR UPDATE USING (
    EXISTS (SELECT 1 FROM employer_profiles ep WHERE ep.id = jobs.employer_id AND ep.user_id = auth.uid())
);

-- Admin Job Access
CREATE POLICY "Admins can insert jobs" 
ON jobs FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can update any job" 
ON jobs FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can delete any job" 
ON jobs FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- === APPLICATIONS POLICIES ===
CREATE POLICY "Candidates can view own applications" 
ON applications FOR SELECT USING (
    EXISTS (SELECT 1 FROM candidate_profiles cp WHERE cp.id = applications.candidate_id AND cp.user_id = auth.uid())
);

CREATE POLICY "Candidates can insert applications" 
ON applications FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM candidate_profiles cp WHERE cp.id = applications.candidate_id AND cp.user_id = auth.uid())
);

CREATE POLICY "Employers can view applications for their jobs" 
ON applications FOR SELECT USING (
    EXISTS (SELECT 1 FROM jobs j JOIN employer_profiles ep ON ep.id = j.employer_id WHERE j.id = applications.job_id AND ep.user_id = auth.uid())
);

CREATE POLICY "Admins can view all applications"
ON applications FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- === SITE CONTENT POLICIES ===
CREATE POLICY "Public read access site_content" 
ON site_content FOR SELECT USING (true);

CREATE POLICY "Admins full access site_content" 
ON site_content FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- === STORAGE POLICIES (Resumes) ===
CREATE POLICY "Candidates upload own resumes"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'resumes' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Candidates view own resumes"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'resumes' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Employers and Admins view all resumes"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'resumes' AND
    EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid()
        AND (p.role = 'employer' OR p.role = 'admin')
    )
);

-- 9. DEFAULT CONTENT
INSERT INTO site_content (section_key, content)
VALUES 
(
  'about_page', 
  '{
    "hero_title": "About OPENTOOWORK",
    "hero_description": "We connect professionals with opportunities.",
    "mission_title": "Our Mission",
    "mission_body": "To simplify the job search."
  }'::jsonb
) 
ON CONFLICT (section_key) DO NOTHING;