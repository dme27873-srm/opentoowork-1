DO $$
DECLARE
  target_email TEXT := 'admin@opentoowork.com'; -- <<< REPLACE WITH YOUR EMAIL
  target_user_id UUID;
BEGIN
  -- 1. Find the User ID in Supabase Auth
  SELECT id INTO target_user_id FROM auth.users WHERE email = target_email;

  IF target_user_id IS NULL THEN
    RAISE NOTICE 'User % not found in Auth. Please sign up first.', target_email;
  ELSE
    -- 2. Create Profile if it doesn't exist (fixing missing trigger issue)
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
      target_user_id, 
      target_email, 
      'System Admin', 
      'admin'
    )
    ON CONFLICT (id) DO UPDATE
    SET role = 'admin'; -- Force role to admin if profile exists

    -- 3. Clean up: Ensure they don't have candidate/employer profiles that might conflict
    -- (Optional, but keeps DB clean for a pure admin)
    DELETE FROM public.candidate_profiles WHERE user_id = target_user_id;
    DELETE FROM public.employer_profiles WHERE user_id = target_user_id;

    RAISE NOTICE 'Success: User % is now an Admin with a valid profile.', target_email;
  END IF;
END $$;