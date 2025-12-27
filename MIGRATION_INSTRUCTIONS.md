# Database Migration Instructions

## Current Situation
You have already applied `MANUAL_PAYMENT_APPROVAL_MIGRATION.sql` but not `MANUAL_PAYMENT_MIGRATION.sql`.

## The Problem
The error you're seeing:
```
Could not find the 'add_ons' column of 'bookings' in the schema cache
```

This happens because `MANUAL_PAYMENT_MIGRATION.sql` adds several required columns that `MANUAL_PAYMENT_APPROVAL_MIGRATION.sql` doesn't include:
- `payment_status`
- `full_amount`
- `deposit_amount`
- `price_variant`
- `add_ons` ← **This is the missing column causing your error**
- `booking_date`

## Solution

### Option 1: Run the Missing Columns Migration (Recommended)
Run `MANUAL_PAYMENT_MISSING_COLUMNS.sql` in Supabase SQL Editor. This file:
- ✅ Only adds columns that don't already exist (safe to run)
- ✅ Won't duplicate any columns you already have
- ✅ Includes all the missing columns needed for manual payments

**Steps:**
1. Open Supabase Dashboard → SQL Editor
2. Create a new query
3. Copy and paste the contents of `MANUAL_PAYMENT_MISSING_COLUMNS.sql`
4. Run the query
5. Verify the output shows all columns exist

### Option 2: Run the Full Manual Payment Migration
Alternatively, you can run `MANUAL_PAYMENT_MIGRATION.sql`, which will:
- Add all missing columns
- Handle data migration
- Make `payment_intent_id` nullable

**Note:** This is also safe to run because it checks if columns exist before adding them.

## Migration Order (For Reference)

If setting up from scratch, the correct order is:
1. **First**: Run `MANUAL_PAYMENT_MIGRATION.sql` (base columns)
2. **Second**: Run `MANUAL_PAYMENT_APPROVAL_MIGRATION.sql` (approval workflow)

Since you've already run #2, you just need to run #1 (or the safe version: `MANUAL_PAYMENT_MISSING_COLUMNS.sql`).

## Verification

After running the migration, verify all columns exist by running:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'bookings' 
AND column_name IN (
  'payment_status',
  'full_amount',
  'deposit_amount', 
  'price_variant',
  'add_ons',
  'booking_date',
  'manual_payment_status',
  'payment_rejection_date'
)
ORDER BY column_name;
```

All 8 columns should appear in the results.

## After Migration

Once the migration is complete:
1. Refresh your application
2. Try creating a manual payment booking again
3. The error should be resolved

