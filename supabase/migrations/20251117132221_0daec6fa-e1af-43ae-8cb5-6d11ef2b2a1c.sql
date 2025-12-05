-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum for work authorization types
CREATE TYPE work_authorization_type AS ENUM (
    'H1B',
    'CPT-EAD',
    'OPT-EAD',
    'GC',
    'GC-EAD',
    'USC',
    'TN'
);

-- Create enum for user roles
CREATE TYPE user_role AS ENUM ('candidate', 'employer', 'admin');

-- Create profiles table (extends auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create candidate_profiles table
CREATE TABLE candidate_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
    work_authorization work_authorization_type NOT NULL,
    resume_url TEXT,
    skills TEXT[],
    experience_years INTEGER,
    location TEXT,
    bio TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create employer_profiles table
CREATE TABLE employer_profiles (
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

-- Create jobs table
CREATE TABLE jobs (
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

-- Create applications table
CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending',
    cover_letter TEXT,
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(job_id, candidate_id)
);

-- Create storage bucket for resumes
INSERT INTO storage.buckets (id, name, public) VALUES ('resumes', 'resumes', false);

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE employer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles"
ON profiles FOR SELECT
USING (true);

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Candidate profiles policies
CREATE POLICY "Anyone can view candidate profiles"
ON candidate_profiles FOR SELECT
USING (true);

CREATE POLICY "Candidates can update own profile"
ON candidate_profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Candidates can insert own profile"
ON candidate_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Employer profiles policies
CREATE POLICY "Anyone can view employer profiles"
ON employer_profiles FOR SELECT
USING (true);

CREATE POLICY "Employers can update own profile"
ON employer_profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Employers can insert own profile"
ON employer_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Jobs policies
CREATE POLICY "Anyone can view active jobs"
ON jobs FOR SELECT
USING (is_active = true);

CREATE POLICY "Employers can view own jobs"
ON jobs FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM employer_profiles ep
        WHERE ep.id = jobs.employer_id
        AND ep.user_id = auth.uid()
    )
);

CREATE POLICY "Employers can insert jobs"
ON jobs FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM employer_profiles ep
        WHERE ep.id = jobs.employer_id
        AND ep.user_id = auth.uid()
    )
);

CREATE POLICY "Employers can update own jobs"
ON jobs FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM employer_profiles ep
        WHERE ep.id = jobs.employer_id
        AND ep.user_id = auth.uid()
    )
);

-- Applications policies
CREATE POLICY "Candidates can view own applications"
ON applications FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM candidate_profiles cp
        WHERE cp.id = applications.candidate_id
        AND cp.user_id = auth.uid()
    )
);

CREATE POLICY "Employers can view applications for their jobs"
ON applications FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM jobs j
        JOIN employer_profiles ep ON ep.id = j.employer_id
        WHERE j.id = applications.job_id
        AND ep.user_id = auth.uid()
    )
);

CREATE POLICY "Candidates can insert applications"
ON applications FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM candidate_profiles cp
        WHERE cp.id = applications.candidate_id
        AND cp.user_id = auth.uid()
    )
);

-- Storage policies for resumes
CREATE POLICY "Candidates can upload own resumes"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'resumes' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Candidates can view own resumes"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'resumes' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Employers can view all resumes"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'resumes' AND
    EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid()
        AND p.role = 'employer'
    )
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_candidate_profiles_updated_at
BEFORE UPDATE ON candidate_profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employer_profiles_updated_at
BEFORE UPDATE ON employer_profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at
BEFORE UPDATE ON jobs
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
