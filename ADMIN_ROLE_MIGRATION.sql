-- Add 'admin' role support to profiles table
-- Run this in Supabase SQL Editor
-- Go to: Supabase Dashboard → SQL Editor → New Query

-- Drop the existing check constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add a new check constraint that includes 'admin' role
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('student', 'instructor', 'admin'));

-- Now you can update a user to admin role:
-- UPDATE profiles SET role = 'admin' WHERE email = 'admin@admin.com';

