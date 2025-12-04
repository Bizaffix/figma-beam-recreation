# Itinerary Builder and Pricing Breakdown - Database Integration

## Overview
This document describes the new database fields added to support the Itinerary Builder and Pricing Breakdown features.

## New Database Fields

### Added to `retreats` Table

1. **`venue_fees`** (NUMERIC(10, 2), default 0)
   - Stores the location/venue fees that hosts enter
   - Used in the revenue breakdown calculation
   - Defaults to 0 if not set

2. **`food_budget`** (NUMERIC(10, 2), default 0)
   - Stores the food coordination budget
   - Used in the revenue breakdown calculation
   - Defaults to 0 if not set

3. **`itinerary_blocks`** (JSONB, nullable)
   - Stores the full itinerary builder data
   - Contains array of itinerary blocks with:
     - Block type (class, open_sew, meal, field_trip, rest)
     - Title, description, time, day
     - Pattern file URLs and names (for class blocks)
     - Project image URLs and names (for class blocks)
     - Supply lists (for class blocks)
   - Nullable to maintain backward compatibility

## Migration

Run the SQL migration file: `ITINERARY_AND_PRICING_MIGRATION.sql`

This migration:
- Adds the three new columns to the `retreats` table
- Uses safe `DO $$` blocks to check if columns exist before adding
- Sets appropriate defaults
- Verifies the columns were added successfully

## Code Updates

### Files Updated

1. **`src/pages/InstructorRetreatForm.tsx`**
   - Loads `venue_fees`, `food_budget`, and `itinerary_blocks` when editing
   - Saves all three fields when creating/updating retreats
   - Properly initializes state from database values

2. **`src/pages/InstructorDashboard.tsx`**
   - Loads `venue_fees`, `food_budget`, and `itinerary_blocks` when editing
   - Saves all three fields when creating/updating retreats
   - Updated `Retreat` interface to include new optional fields

### Data Flow

**When Creating/Editing:**
1. User enters venue fees and food budget in the pricing breakdown
2. User builds itinerary using the itinerary builder
3. On save, all data is sent to Supabase:
   - `venue_fees` and `food_budget` as numeric values
   - `itinerary_blocks` as JSONB array
   - `schedule` is also saved (converted from itinerary blocks) for backward compatibility

**When Loading:**
1. Fetch retreat data from Supabase
2. Load `venue_fees` and `food_budget` into state
3. Check if `itinerary_blocks` exists:
   - If yes, load into itinerary builder
   - If no, check `schedule` and convert to itinerary blocks if needed
4. Display data in forms

## Backward Compatibility

- Existing retreats without the new fields will work fine (defaults to 0 for fees, null for itinerary_blocks)
- The `schedule` field continues to work for simple schedule format
- If `itinerary_blocks` is null, the system falls back to the simple schedule view
- Conversion functions handle migration from old format to new format

## Storage Buckets Required

For the itinerary builder to work fully, you need these Supabase Storage buckets:

1. **`retreat-patterns`** - For PDF pattern files
2. **`retreat-project-images`** - For project images

These can be created in Supabase Dashboard → Storage.

## Testing Checklist

- [ ] Run the migration SQL in Supabase
- [ ] Create a new retreat with itinerary builder and pricing breakdown
- [ ] Verify data is saved correctly in database
- [ ] Edit the retreat and verify data loads correctly
- [ ] Test with existing retreats (backward compatibility)
- [ ] Verify venue fees and food budget appear in revenue breakdown
- [ ] Verify itinerary blocks can be dragged and reordered
- [ ] Test pattern and image uploads for class blocks

## Notes

- All fields are optional/nullable to maintain backward compatibility
- The `schedule` field is still saved for backward compatibility with existing code
- The itinerary builder converts between old and new formats automatically
- Revenue calculations use `venue_fees` and `food_budget` in real-time

