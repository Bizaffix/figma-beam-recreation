# Database Field Verification

This document verifies that all application queries match the database schema exactly.

## Database Schema

### `bookings` Table
- `id` (uuid, PK)
- `retreat_id` (integer, FK to retreats)
- `user_id` (uuid, FK to auth.users)
- `payment_intent_id` (text, unique)
- `full_name` (text)
- `email` (text)
- `skill_level` (text)
- `amount` (numeric(10, 2))
- `status` (text, default 'confirmed')
- `created_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone)

### `profiles` Table
- `id` (uuid, PK, FK to auth.users)
- `email` (text)
- `full_name` (text, nullable)
- `avatar_url` (text, nullable)
- `bio` (text, nullable)
- `role` (text, default 'student', check: 'student'|'instructor'|'admin')
- `created_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone)
- `facebook_url` (text, nullable)
- `instagram_url` (text, nullable)
- `pinterest_url` (text, nullable)
- `referred_by` (uuid, nullable, FK to auth.users)

### `retreats` Table
- `id` (bigserial, PK)
- `title` (text)
- `description` (text)
- `location` (text)
- `date` (text)
- `duration` (text)
- `level` (text, check: 'Beginner'|'Intermediate'|'Advanced')
- `price` (numeric(10, 2))
- `total_spots` (integer)
- `spots_available` (integer)
- `image` (text)
- `includes` (text[])
- `schedule` (jsonb)
- `published` (boolean, default false)
- `instructor_id` (uuid, FK to profiles)
- `created_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone)

## Application Query Verification

### ✅ AdminDashboard (`src/pages/AdminDashboard.tsx`)
- **Bookings Query**: Selects `id, full_name, email, skill_level, amount, status, created_at, retreat_id` ✓
- **Retreats Query**: Selects `id, title, instructor_id` ✓
- **Profiles Query**: Selects `id` with role filter ✓
- **All fields match database schema**

### ✅ InstructorDashboard (`src/pages/InstructorDashboard.tsx`)
- **Retreats Query**: Selects `*` (all fields) ✓
- **Bookings Query**: Selects `amount, status, retreat_id` ✓
- **Profiles Query**: Selects `id` with `referred_by` filter ✓
- **Retreat Insert/Update**: Uses all correct field names (snake_case) ✓
- **Revenue Calculation**: Uses `booking.amount` (numeric) ✓
- **All fields match database schema**

### ✅ Booking Page (`src/pages/Booking.tsx`)
- **Retreats Query**: Selects `id, title, location, date, price, spots_available, total_spots, published, image` ✓
- **Profiles Query**: Selects `full_name, email` ✓
- **All fields match database schema**

### ✅ Payment Page (`src/pages/Payment.tsx`)
- **Retreats Query**: Selects `id, title, location, date, price, image` ✓
- **All fields match database schema**

### ✅ Profile Page (`src/pages/Profile.tsx`)
- **Profiles Query**: Selects `full_name, avatar_url, bio, facebook_url, instagram_url, pinterest_url` ✓
- **Profile Update**: Updates all correct field names ✓
- **All fields match database schema**

### ✅ Index/Home Pages
- **Retreats Query**: Selects `*` with instructor join ✓
- **Profiles Query**: Selects `full_name` ✓
- **All fields match database schema**

### ✅ Edge Function (confirm-payment)
- **Booking Insert**: Inserts with fields:
  - `retreat_id` ✓
  - `user_id` ✓
  - `payment_intent_id` ✓
  - `full_name` ✓
  - `email` ✓
  - `skill_level` ✓
  - `amount` (converted from cents) ✓
  - `status` ('confirmed') ✓
- **All fields match database schema**

## Field Name Conventions

- **Database**: Uses `snake_case` (e.g., `full_name`, `skill_level`, `created_at`)
- **Application**: Uses `snake_case` when querying database directly ✓
- **TypeScript Interfaces**: May use `camelCase` for internal use, but converts to `snake_case` for database queries ✓

## Verification Status

✅ **All queries verified and match database schema**
✅ **All field names use correct snake_case convention**
✅ **All data types match (numeric, text, boolean, etc.)**
✅ **All foreign key relationships are correct**
✅ **All default values and constraints are respected**

## Notes

- The `amount` field in bookings is stored as `numeric(10, 2)` in the database
- When creating payment intents, amount is sent in cents and converted to dollars when saving to database
- The `status` field defaults to 'confirmed' in the database
- The `role` field in profiles has a check constraint allowing only 'student', 'instructor', or 'admin'

