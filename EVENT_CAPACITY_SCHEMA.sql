-- Event Capacity + Room/Bed Assignment Schema
-- This schema supports STAY tickets (room/bed selection) and SEAT_ONLY tickets (seat grid)
-- for in-person events at venues, plus online events with video providers

-- ============================================
-- 1. VENUE ROOM & BED TABLES
-- ============================================

-- VenueRoom: Rooms within a venue
CREATE TABLE IF NOT EXISTS public.venue_rooms (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  venue_id uuid NOT NULL,
  name text NOT NULL,
  image_url text,
  description text,
  bed_count integer NOT NULL DEFAULT 1 CHECK (bed_count >= 1),
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT venue_rooms_pkey PRIMARY KEY (id),
  CONSTRAINT venue_rooms_venue_id_fkey FOREIGN KEY (venue_id) REFERENCES public.properties(id) ON DELETE CASCADE
);

-- VenueBed: Individual beds within rooms (only needed when bed_count > 1)
CREATE TABLE IF NOT EXISTS public.venue_beds (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL,
  title text NOT NULL,
  image_url text,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT venue_beds_pkey PRIMARY KEY (id),
  CONSTRAINT venue_beds_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.venue_rooms(id) ON DELETE CASCADE
);

-- ============================================
-- 2. EVENT VENUE SNAPSHOT TABLES
-- ============================================

-- EventVenueSnapshot: Links event to venue and tracks snapshot creation
CREATE TABLE IF NOT EXISTS public.event_venue_snapshots (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  event_id integer NOT NULL,
  venue_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT event_venue_snapshots_pkey PRIMARY KEY (id),
  CONSTRAINT event_venue_snapshots_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.retreats(id) ON DELETE CASCADE,
  CONSTRAINT event_venue_snapshots_venue_id_fkey FOREIGN KEY (venue_id) REFERENCES public.properties(id) ON DELETE CASCADE,
  CONSTRAINT event_venue_snapshots_event_id_unique UNIQUE (event_id)
);

-- EventRoom: Event-scoped snapshot of venue rooms
CREATE TABLE IF NOT EXISTS public.event_rooms (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  event_id integer NOT NULL,
  source_room_id uuid NOT NULL,
  name text NOT NULL,
  image_url text,
  description text,
  bed_count integer NOT NULL DEFAULT 1 CHECK (bed_count >= 1),
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT event_rooms_pkey PRIMARY KEY (id),
  CONSTRAINT event_rooms_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.retreats(id) ON DELETE CASCADE,
  CONSTRAINT event_rooms_source_room_id_fkey FOREIGN KEY (source_room_id) REFERENCES public.venue_rooms(id) ON DELETE CASCADE
);

-- EventBed: Event-scoped snapshot of venue beds
CREATE TABLE IF NOT EXISTS public.event_beds (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  event_id integer NOT NULL,
  event_room_id uuid NOT NULL,
  source_bed_id uuid,
  title text NOT NULL,
  image_url text,
  status text NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'BOOKED', 'HELD')),
  held_until timestamp with time zone,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT event_beds_pkey PRIMARY KEY (id),
  CONSTRAINT event_beds_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.retreats(id) ON DELETE CASCADE,
  CONSTRAINT event_beds_event_room_id_fkey FOREIGN KEY (event_room_id) REFERENCES public.event_rooms(id) ON DELETE CASCADE,
  CONSTRAINT event_beds_source_bed_id_fkey FOREIGN KEY (source_bed_id) REFERENCES public.venue_beds(id) ON DELETE SET NULL
);

-- EventSeat: Event-scoped seats for SEAT_ONLY tickets
CREATE TABLE IF NOT EXISTS public.event_seats (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  event_id integer NOT NULL,
  seat_index integer NOT NULL,
  row integer NOT NULL,
  col integer NOT NULL,
  status text NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'BOOKED', 'HELD')),
  held_until timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT event_seats_pkey PRIMARY KEY (id),
  CONSTRAINT event_seats_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.retreats(id) ON DELETE CASCADE,
  CONSTRAINT event_seats_event_id_seat_index_unique UNIQUE (event_id, seat_index)
);

-- ============================================
-- 3. BOOKING ASSIGNMENT TABLES
-- ============================================

-- BedAssignment: Links booking to specific bed
CREATE TABLE IF NOT EXISTS public.bed_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL,
  event_bed_id uuid NOT NULL UNIQUE,
  assigned_at timestamp with time zone DEFAULT now(),
  CONSTRAINT bed_assignments_pkey PRIMARY KEY (id),
  CONSTRAINT bed_assignments_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE,
  CONSTRAINT bed_assignments_event_bed_id_fkey FOREIGN KEY (event_bed_id) REFERENCES public.event_beds(id) ON DELETE CASCADE
);

-- SeatAssignment: Links booking to specific seat
CREATE TABLE IF NOT EXISTS public.seat_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL,
  event_seat_id uuid NOT NULL UNIQUE,
  assigned_at timestamp with time zone DEFAULT now(),
  CONSTRAINT seat_assignments_pkey PRIMARY KEY (id),
  CONSTRAINT seat_assignments_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE,
  CONSTRAINT seat_assignments_event_seat_id_fkey FOREIGN KEY (event_seat_id) REFERENCES public.event_seats(id) ON DELETE CASCADE
);

-- ============================================
-- 4. UPDATE EXISTING TABLES
-- ============================================

-- Add new fields to retreats table
ALTER TABLE public.retreats 
  ADD COLUMN IF NOT EXISTS mode text CHECK (mode IN ('IN_PERSON', 'ONLINE')),
  ADD COLUMN IF NOT EXISTS video_provider text CHECK (video_provider IN ('GOOGLE_MEET', 'ZOOM', 'TEAMS', 'OTHER')),
  ADD COLUMN IF NOT EXISTS meeting_url text,
  ADD COLUMN IF NOT EXISTS venue_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS venue_usage_type text CHECK (venue_usage_type IN ('AT_LOCATION', 'OFFSITE')),
  ADD COLUMN IF NOT EXISTS seat_capacity integer DEFAULT 0;

-- Add ticket_type to bookings table
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS ticket_type text CHECK (ticket_type IN ('STAY', 'SEAT_ONLY'));

-- Add seat_capacity to properties table (if not exists)
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS seat_capacity_total integer DEFAULT 0;

-- ============================================
-- 5. INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_venue_rooms_venue_id ON public.venue_rooms(venue_id);
CREATE INDEX IF NOT EXISTS idx_venue_beds_room_id ON public.venue_beds(room_id);
CREATE INDEX IF NOT EXISTS idx_event_venue_snapshots_event_id ON public.event_venue_snapshots(event_id);
CREATE INDEX IF NOT EXISTS idx_event_venue_snapshots_venue_id ON public.event_venue_snapshots(venue_id);
CREATE INDEX IF NOT EXISTS idx_event_rooms_event_id ON public.event_rooms(event_id);
CREATE INDEX IF NOT EXISTS idx_event_rooms_source_room_id ON public.event_rooms(source_room_id);
CREATE INDEX IF NOT EXISTS idx_event_beds_event_id ON public.event_beds(event_id);
CREATE INDEX IF NOT EXISTS idx_event_beds_event_room_id ON public.event_beds(event_room_id);
CREATE INDEX IF NOT EXISTS idx_event_beds_status ON public.event_beds(status);
CREATE INDEX IF NOT EXISTS idx_event_seats_event_id ON public.event_seats(event_id);
CREATE INDEX IF NOT EXISTS idx_event_seats_status ON public.event_seats(status);
CREATE INDEX IF NOT EXISTS idx_bed_assignments_booking_id ON public.bed_assignments(booking_id);
CREATE INDEX IF NOT EXISTS idx_bed_assignments_event_bed_id ON public.bed_assignments(event_bed_id);
CREATE INDEX IF NOT EXISTS idx_seat_assignments_booking_id ON public.seat_assignments(booking_id);
CREATE INDEX IF NOT EXISTS idx_seat_assignments_event_seat_id ON public.seat_assignments(event_seat_id);
CREATE INDEX IF NOT EXISTS idx_retreats_mode ON public.retreats(mode);
CREATE INDEX IF NOT EXISTS idx_retreats_venue_id ON public.retreats(venue_id);
CREATE INDEX IF NOT EXISTS idx_bookings_ticket_type ON public.bookings(ticket_type);

-- ============================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all new tables
ALTER TABLE public.venue_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_beds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_venue_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_beds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bed_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seat_assignments ENABLE ROW LEVEL SECURITY;

-- Venue Rooms: Venue owners can manage their own rooms
CREATE POLICY "Venue owners can manage their own rooms"
  ON public.venue_rooms FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.properties
      WHERE properties.id = venue_rooms.venue_id
      AND properties.owner_id = auth.uid()
    )
  );

-- Venue Beds: Venue owners can manage beds in their rooms
CREATE POLICY "Venue owners can manage their own beds"
  ON public.venue_beds FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.venue_rooms vr
      JOIN public.properties p ON p.id = vr.venue_id
      WHERE vr.id = venue_beds.room_id
      AND p.owner_id = auth.uid()
    )
  );

-- Public can view published venue rooms/beds
CREATE POLICY "Public can view published venue rooms"
  ON public.venue_rooms FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.properties
      WHERE properties.id = venue_rooms.venue_id
      AND properties.status IN ('published', 'verified')
    )
  );

CREATE POLICY "Public can view published venue beds"
  ON public.venue_beds FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.venue_rooms vr
      JOIN public.properties p ON p.id = vr.venue_id
      WHERE vr.id = venue_beds.room_id
      AND p.status IN ('published', 'verified')
    )
  );

-- Event Venue Snapshots: Organizers can manage snapshots for their events
CREATE POLICY "Organizers can manage their event venue snapshots"
  ON public.event_venue_snapshots FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.retreats
      WHERE retreats.id = event_venue_snapshots.event_id
      AND retreats.instructor_id = auth.uid()
    )
  );

-- Event Rooms/Beds/Seats: Public can view for published events, organizers can manage
CREATE POLICY "Public can view event rooms for published events"
  ON public.event_rooms FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.retreats
      WHERE retreats.id = event_rooms.event_id
      AND retreats.published = true
    )
  );

CREATE POLICY "Organizers can manage their event rooms"
  ON public.event_rooms FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.retreats
      WHERE retreats.id = event_rooms.event_id
      AND retreats.instructor_id = auth.uid()
    )
  );

CREATE POLICY "Public can view event beds for published events"
  ON public.event_beds FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.retreats
      WHERE retreats.id = event_beds.event_id
      AND retreats.published = true
    )
  );

CREATE POLICY "Organizers can manage their event beds"
  ON public.event_beds FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.retreats
      WHERE retreats.id = event_beds.event_id
      AND retreats.instructor_id = auth.uid()
    )
  );

CREATE POLICY "Public can view event seats for published events"
  ON public.event_seats FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.retreats
      WHERE retreats.id = event_seats.event_id
      AND retreats.published = true
    )
  );

CREATE POLICY "Organizers can manage their event seats"
  ON public.event_seats FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.retreats
      WHERE retreats.id = event_seats.event_id
      AND retreats.instructor_id = auth.uid()
    )
  );

-- Bed/Seat Assignments: Users can view their own assignments, organizers can view for their events
CREATE POLICY "Users can view their own bed assignments"
  ON public.bed_assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE bookings.id = bed_assignments.booking_id
      AND bookings.user_id = auth.uid()
    )
  );

CREATE POLICY "Organizers can view bed assignments for their events"
  ON public.bed_assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.event_beds eb
      JOIN public.retreats r ON r.id = eb.event_id
      WHERE eb.id = bed_assignments.event_bed_id
      AND r.instructor_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their own seat assignments"
  ON public.seat_assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE bookings.id = seat_assignments.booking_id
      AND bookings.user_id = auth.uid()
    )
  );

CREATE POLICY "Organizers can view seat assignments for their events"
  ON public.seat_assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.event_seats es
      JOIN public.retreats r ON r.id = es.event_id
      WHERE es.id = seat_assignments.event_seat_id
      AND r.instructor_id = auth.uid()
    )
  );

-- ============================================
-- 7. HELPER FUNCTIONS
-- ============================================

-- Function to create event venue snapshot (rooms + beds)
CREATE OR REPLACE FUNCTION create_event_venue_snapshot(
  p_event_id integer,
  p_venue_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_snapshot_id uuid;
  v_room_record record;
  v_bed_record record;
  v_event_room_id uuid;
BEGIN
  -- Create or update snapshot record
  INSERT INTO public.event_venue_snapshots (event_id, venue_id)
  VALUES (p_event_id, p_venue_id)
  ON CONFLICT (event_id) 
  DO UPDATE SET updated_at = now()
  RETURNING id INTO v_snapshot_id;

  -- Delete existing event rooms/beds for this event (refresh snapshot)
  DELETE FROM public.event_beds WHERE event_id = p_event_id;
  DELETE FROM public.event_rooms WHERE event_id = p_event_id;

  -- Copy rooms from venue to event snapshot
  FOR v_room_record IN 
    SELECT * FROM public.venue_rooms 
    WHERE venue_id = p_venue_id 
    ORDER BY sort_order, created_at
  LOOP
    INSERT INTO public.event_rooms (
      event_id, source_room_id, name, image_url, description, bed_count, sort_order
    )
    VALUES (
      p_event_id, v_room_record.id, v_room_record.name, 
      v_room_record.image_url, v_room_record.description, 
      v_room_record.bed_count, v_room_record.sort_order
    )
    RETURNING id INTO v_event_room_id;

    -- If bed_count > 1, copy beds; otherwise create a single default bed
    IF v_room_record.bed_count > 1 THEN
      FOR v_bed_record IN
        SELECT * FROM public.venue_beds
        WHERE room_id = v_room_record.id
        ORDER BY sort_order, created_at
      LOOP
        INSERT INTO public.event_beds (
          event_id, event_room_id, source_bed_id, title, image_url, sort_order
        )
        VALUES (
          p_event_id, v_event_room_id, v_bed_record.id,
          v_bed_record.title, v_bed_record.image_url, v_bed_record.sort_order
        );
      END LOOP;
    ELSE
      -- Create single default bed for room with bed_count = 1
      INSERT INTO public.event_beds (
        event_id, event_room_id, source_bed_id, title, image_url
      )
      VALUES (
        p_event_id, v_event_room_id, NULL, 'Single Bed', NULL
      );
    END IF;
  END LOOP;

  RETURN v_snapshot_id;
END;
$$;

-- Function to create event seats grid
CREATE OR REPLACE FUNCTION create_event_seats_grid(
  p_event_id integer,
  p_seat_capacity integer,
  p_rows integer DEFAULT 10,
  p_cols integer DEFAULT 10
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_seat_count integer := 0;
  v_row integer;
  v_col integer;
  v_seat_index integer := 0;
BEGIN
  -- Delete existing seats for this event
  DELETE FROM public.event_seats WHERE event_id = p_event_id;

  -- Create seats in grid pattern
  FOR v_row IN 1..p_rows LOOP
    FOR v_col IN 1..p_cols LOOP
      IF v_seat_index < p_seat_capacity THEN
        INSERT INTO public.event_seats (
          event_id, seat_index, row, col, status
        )
        VALUES (
          p_event_id, v_seat_index, v_row, v_col, 'AVAILABLE'
        );
        v_seat_index := v_seat_index + 1;
        v_seat_count := v_seat_count + 1;
      END IF;
    END LOOP;
  END LOOP;

  RETURN v_seat_count;
END;
$$;

-- Function to check and expire held beds/seats
CREATE OR REPLACE FUNCTION expire_held_inventory()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Expire held beds older than 15 minutes
  UPDATE public.event_beds
  SET status = 'AVAILABLE', held_until = NULL
  WHERE status = 'HELD'
  AND held_until < now() - interval '15 minutes';

  -- Expire held seats older than 15 minutes
  UPDATE public.event_seats
  SET status = 'AVAILABLE', held_until = NULL
  WHERE status = 'HELD'
  AND held_until < now() - interval '15 minutes';
END;
$$;

-- ============================================
-- 8. TRIGGERS
-- ============================================

-- Auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_venue_rooms_updated_at
  BEFORE UPDATE ON public.venue_rooms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_venue_beds_updated_at
  BEFORE UPDATE ON public.venue_beds
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_venue_snapshots_updated_at
  BEFORE UPDATE ON public.event_venue_snapshots
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
