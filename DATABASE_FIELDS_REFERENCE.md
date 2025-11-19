# Database Fields Reference

This document tracks all database fields used in the Instructor Dashboard and ensures they exist in Supabase.

## Current Database Schema

### `profiles` Table
- `id` (uuid, PK) - User ID
- `email` (text)
- `full_name` (text, nullable)
- `avatar_url` (text, nullable)
- `bio` (text, nullable)
- `role` (text, default 'student') - Used for: student link count
- `created_at` (timestamp)
- `updated_at` (timestamp)
- `facebook_url` (text, nullable)
- `instagram_url` (text, nullable)
- `pinterest_url` (text, nullable)
- `referred_by` (uuid, nullable, FK to auth.users) - Used for: instructor invites count

**Indexes:**
- `idx_profiles_referred_by` on `referred_by`

### `retreats` Table
- `id` (bigserial, PK)
- `title` (text) - Used in dashboard
- `description` (text) - Used in dashboard
- `location` (text) - Used in dashboard
- `date` (text) - Used for: completed events calculation
- `duration` (text) - Used in dashboard
- `level` (text) - Used in dashboard (Beginner/Intermediate/Advanced)
- `price` (numeric) - Used for: revenue calculations
- `total_spots` (integer) - Used for: expected revenue, booked seats
- `spots_available` (integer) - Used in dashboard
- `image` (text) - Used in dashboard
- `includes` (text[]) - Used in dashboard
- `schedule` (jsonb) - Used in dashboard
- `published` (boolean, default false) - Used for: published count, draft count
- `instructor_id` (uuid, FK to profiles) - Used for: filtering retreats
- `created_at` (timestamp)
- `updated_at` (timestamp)

### `bookings` Table
- `id` (uuid, PK)
- `retreat_id` (integer, FK to retreats) - Used for: fetching bookings
- `user_id` (uuid, FK to auth.users)
- `payment_intent_id` (text, unique)
- `full_name` (text)
- `email` (text)
- `skill_level` (text)
- `amount` (numeric) - Used for: total revenue calculation
- `status` (text, default 'confirmed') - Used for: filtering confirmed bookings
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Indexes:**
- `idx_bookings_user_id` on `user_id`
- `idx_bookings_retreat_id` on `retreat_id`

## Dashboard Metrics and Their Database Dependencies

### Total Revenue
- **Source:** `bookings.amount`
- **Filter:** `bookings.status = 'confirmed'` AND `bookings.retreat_id` IN (instructor's retreats)
- **Calculation:** Sum of all confirmed booking amounts

### Completed Events
- **Source:** `retreats.date`
- **Filter:** Retreats where end date has passed
- **Calculation:** Count of retreats with `date` end date < today

### Students Served
- **Source:** `bookings` table
- **Filter:** `bookings.status = 'confirmed'` AND `bookings.retreat_id` IN (instructor's retreats)
- **Calculation:** Count of confirmed bookings

### Expected Revenue
- **Source:** `retreats.price`, `retreats.total_spots`, `bookings`
- **Filter:** Published retreats only
- **Calculation:** `(Sum of price * total_spots for published retreats) * (booked_seats / total_spots)`

### Published Events
- **Source:** `retreats.published`
- **Filter:** `retreats.published = true` AND `retreats.instructor_id = current_user.id`
- **Calculation:** Count of published retreats

### Booked Seats
- **Source:** `bookings` table
- **Filter:** `bookings.status = 'confirmed'` AND `bookings.retreat_id` IN (instructor's retreats)
- **Calculation:** Count of confirmed bookings

### Event Draft
- **Source:** `retreats.published`
- **Filter:** `retreats.published = false` AND `retreats.instructor_id = current_user.id`
- **Calculation:** Count of unpublished retreats

### Instructor Invites Count
- **Source:** `profiles.referred_by`
- **Filter:** `profiles.referred_by = current_user.id`
- **Calculation:** Count of profiles where current user is the referrer

### Student Link Count
- **Source:** `profiles.role`, `profiles.referred_by`
- **Filter:** `profiles.role = 'student'` AND `profiles.referred_by IS NULL`
- **Calculation:** Count of students who signed up without referral

## Verification Checklist

When adding new features to the Instructor Dashboard:

- [ ] Check if new fields are needed in database
- [ ] If new fields are needed, create migration SQL file
- [ ] Update this document with new fields
- [ ] Verify all queries use existing fields correctly
- [ ] Test that all stats calculate correctly

## Current Status: ✅ All Fields Exist

All fields currently used in the Instructor Dashboard exist in the database schema. No new fields need to be added at this time.

