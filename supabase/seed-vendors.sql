-- Seed file: Dummy vendors for testing
-- Run via: npx supabase db execute -f supabase/seed-vendors.sql
-- Or paste into Supabase Dashboard SQL Editor

-- First create profiles for the dummy vendors
INSERT INTO public.profiles (id, email, full_name, role)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'venue1@test.com', 'Sunnyvale Hindu Temple', 'vendor'),
  ('22222222-2222-2222-2222-222222222222', 'venue2@test.com', 'Fremont Cultural Center', 'vendor'),
  ('33333333-3333-3333-3333-333333333333', 'catering1@test.com', 'Saravana Bhavan Catering', 'vendor'),
  ('44444444-4444-4444-4444-444444444444', 'catering2@test.com', 'Komala Vilas Events', 'vendor'),
  ('55555555-5555-5555-5555-555555555555', 'photo1@test.com', 'Rajan Photography', 'vendor'),
  ('66666666-6666-6666-6666-666666666666', 'photo2@test.com', 'Bay Area Moments', 'vendor'),
  ('77777777-7777-7777-7777-777777777777', 'video1@test.com', 'Nritya Films', 'vendor'),
  ('88888888-8888-8888-8888-888888888888', 'music1@test.com', 'Chennai Classical Musicians', 'vendor'),
  ('99999999-9999-9999-9999-999999999999', 'decor1@test.com', 'Lotus Stage Decorations', 'vendor'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'makeup1@test.com', 'Bridal Glow Studio', 'vendor'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'costume1@test.com', 'Nartaki Costumes', 'vendor'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'nattu1@test.com', 'Guru Nattuvanar Services', 'vendor')
ON CONFLICT (id) DO NOTHING;

-- Now create vendor profiles
INSERT INTO public.vendor_profiles (id, business_name, description, category, service_areas, price_min, price_max, is_published)
VALUES
  -- Venues
  ('11111111-1111-1111-1111-111111111111',
   'Sunnyvale Hindu Temple',
   'Beautiful temple venue with traditional architecture, perfect for Arangetrams. Includes sound system and seating for 300 guests. Located in the heart of Silicon Valley.',
   'venue',
   ARRAY['San Jose', 'Sunnyvale', 'Santa Clara'],
   3000, 5000, true),

  ('22222222-2222-2222-2222-222222222222',
   'Fremont Cultural Center',
   'Modern cultural center with state-of-the-art stage and lighting. Ideal for large Arangetrams with 500+ guests. Ample parking available.',
   'venue',
   ARRAY['Fremont', 'Newark', 'Union City'],
   4000, 7000, true),

  -- Catering
  ('33333333-3333-3333-3333-333333333333',
   'Saravana Bhavan Catering',
   'Authentic South Indian vegetarian cuisine. Specializing in traditional Arangetram feasts with full-service staff. 20+ years experience.',
   'catering',
   ARRAY['San Jose', 'Fremont', 'Sunnyvale', 'Santa Clara'],
   5000, 15000, true),

  ('44444444-4444-4444-4444-444444444444',
   'Komala Vilas Events',
   'Premium vegetarian catering with live dosa station and traditional sweets. Known for exceptional presentation and taste.',
   'catering',
   ARRAY['San Francisco', 'San Jose', 'Palo Alto'],
   8000, 20000, true),

  -- Photography
  ('55555555-5555-5555-5555-555555555555',
   'Rajan Photography',
   'Capturing the grace and beauty of Bharatanatyam for 15 years. Specializes in action shots and traditional portraits. Full editing included.',
   'photography',
   ARRAY['San Jose', 'Fremont', 'Sunnyvale'],
   2000, 4000, true),

  ('66666666-6666-6666-6666-666666666666',
   'Bay Area Moments',
   'Contemporary photography style with artistic flair. Drone shots available. Quick turnaround on edited photos.',
   'photography',
   ARRAY['San Francisco', 'Oakland', 'San Jose'],
   2500, 5000, true),

  -- Videography
  ('77777777-7777-7777-7777-777777777777',
   'Nritya Films',
   'Cinematic Arangetram videos with multi-camera coverage. Includes highlight reel, full performance, and behind-the-scenes footage.',
   'videography',
   ARRAY['San Jose', 'Fremont', 'Cupertino'],
   3000, 6000, true),

  -- Musicians
  ('88888888-8888-8888-8888-888888888888',
   'Chennai Classical Musicians',
   'Professional Carnatic music ensemble with mridangam, violin, and flute. Trained at Kalakshetra. Available for rehearsals.',
   'musicians',
   ARRAY['San Jose', 'Fremont', 'San Francisco', 'Sunnyvale'],
   2000, 4000, true),

  -- Stage Decoration
  ('99999999-9999-9999-9999-999999999999',
   'Lotus Stage Decorations',
   'Traditional and modern stage setups with fresh flowers, drapes, and lighting. Custom backdrops available. Setup and teardown included.',
   'stage_decoration',
   ARRAY['San Jose', 'Fremont', 'Santa Clara'],
   1500, 4000, true),

  -- Makeup Artist
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'Bridal Glow Studio',
   'Expert in traditional Bharatanatyam makeup and hair styling. Includes trial session. Travel to venue included.',
   'makeup_artist',
   ARRAY['San Jose', 'Fremont', 'Sunnyvale', 'Palo Alto'],
   300, 600, true),

  -- Costumes
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
   'Nartaki Costumes',
   'Custom-stitched Bharatanatyam costumes and jewelry rental. Wide selection of colors and styles. Express orders available.',
   'costumes',
   ARRAY['San Jose', 'Fremont'],
   500, 2000, true),

  -- Nattuvanar
  ('cccccccc-cccc-cccc-cccc-cccccccccccc',
   'Guru Nattuvanar Services',
   'Experienced nattuvanar for your Arangetram. 30+ years of guiding young dancers. Includes rehearsal sessions.',
   'nattuvanar',
   ARRAY['San Jose', 'Fremont', 'Sunnyvale', 'Santa Clara'],
   1000, 2000, true)
ON CONFLICT (id) DO NOTHING;
