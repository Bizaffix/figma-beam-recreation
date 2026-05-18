-- AI blog generation support (quilt-match parity): topic backlog + generation log

CREATE TABLE IF NOT EXISTS public.blog_topics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  topic text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  angle text,
  last_used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.content_generation_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  kind text NOT NULL,
  topic text,
  status text NOT NULL,
  error text,
  result_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.blog_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_generation_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage blog topics" ON public.blog_topics;
CREATE POLICY "Admins manage blog topics" ON public.blog_topics
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

DROP POLICY IF EXISTS "Admins read generation log" ON public.content_generation_log;
CREATE POLICY "Admins read generation log" ON public.content_generation_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

INSERT INTO public.blog_topics (topic, category, angle)
SELECT v.topic, v.category, v.angle
FROM (VALUES
  ('What to bring to your first quilt retreat', 'planning', 'beginner-friendly packing checklist'),
  ('How to choose the right quilt retreat for your skill level', 'planning', 'evaluation guide'),
  ('Best quilt retreats in the Northeast for fall', 'regional', 'seasonal regional roundup'),
  ('Best quilt retreats in the South for winter', 'regional', 'seasonal regional roundup'),
  ('Best quilt retreats in the Midwest for spring', 'regional', 'seasonal regional roundup'),
  ('Best quilt retreats in the Mountain region', 'regional', 'regional roundup'),
  ('Best quilt retreats on the West Coast', 'regional', 'regional roundup'),
  ('How to host your first quilt retreat as a creator', 'creator-stories', 'creator how-to'),
  ('Pricing your quilt retreat: a creator''s guide', 'creator-stories', 'business advice'),
  ('Building community at multi-day quilting events', 'creator-stories', 'community-building'),
  ('Turning your venue into a quilt retreat destination', 'venue-guides', 'venue owner guide'),
  ('What quilters look for in a retreat venue', 'venue-guides', 'venue owner guide'),
  ('Setting up the perfect cutting and pressing stations', 'techniques', 'workshop setup'),
  ('Beginner''s guide to applique at retreats', 'techniques', 'technique tutorial'),
  ('Free-motion quilting tips you can practice at a retreat', 'techniques', 'technique tutorial'),
  ('How to organize a sew-along at your retreat', 'planning', 'group activity guide'),
  ('Solo quilters: how to find your retreat community', 'planning', 'community guide'),
  ('Retreat etiquette: sharing space and machines', 'planning', 'social guide'),
  ('Why off-season quilt retreats are the best deal', 'planning', 'budget guide'),
  ('Top features that make a quilt retreat unforgettable', 'planning', 'experience guide'),
  ('Choosing fabrics for a long-weekend retreat project', 'techniques', 'project planning'),
  ('Travel tips for flying with sewing supplies', 'planning', 'travel guide'),
  ('Hosting a mother-daughter quilt retreat', 'planning', 'theme retreat'),
  ('Quilt retreats for charity: organizing community projects', 'planning', 'cause-driven retreats'),
  ('How venues should photograph their retreat space', 'venue-guides', 'marketing tips'),
  ('Stocking your retreat venue: machines, irons, lights', 'venue-guides', 'amenities guide'),
  ('Meal planning for quilt retreat hosts', 'planning', 'logistics guide'),
  ('Designing a quilt retreat schedule that works', 'creator-stories', 'event planning'),
  ('The rise of small-group quilt retreats', 'planning', 'industry trend'),
  ('How to repeat-book retreats with the same group', 'creator-stories', 'retention tips')
) AS v(topic, category, angle)
WHERE NOT EXISTS (SELECT 1 FROM public.blog_topics LIMIT 1);
