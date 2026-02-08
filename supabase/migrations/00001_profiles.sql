-- Migration: 00001_profiles
-- Create profiles table with RLS and trigger for automatic profile creation on signup
-- Part of Phase 1: Foundation & Authentication

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'vendor')) DEFAULT 'user',
  email TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security immediately
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create index for RLS policy performance
CREATE INDEX idx_profiles_id ON public.profiles(id);

-- Trigger function to create profile on signup
-- SECURITY DEFINER with empty search_path for security
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, email, full_name)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data ->> 'role', 'user'),
    new.email,
    new.raw_user_meta_data ->> 'full_name'
  );
  RETURN new;
END;
$$;

-- Create trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies

-- Anyone can read vendor profiles (for browsing marketplace)
CREATE POLICY "Public vendor profiles readable"
ON public.profiles FOR SELECT
USING (role = 'vendor');

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
ON public.profiles FOR SELECT
USING ((SELECT auth.uid()) = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING ((SELECT auth.uid()) = id);

-- Users can only insert their own profile (trigger handles this, but safety net)
CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
WITH CHECK ((SELECT auth.uid()) = id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Create trigger for updated_at
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
