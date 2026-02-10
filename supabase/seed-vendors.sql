-- Seed file: Create dummy auth users and vendor profiles
-- Run via Supabase Dashboard SQL Editor
-- Password for all test accounts: password123

-- Step 1: Insert into auth.users (minimal fields required)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'venue1@test.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"role":"vendor"}', 'authenticated', 'authenticated'),
  ('22222222-2222-2222-2222-222222222222', 'venue2@test.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"role":"vendor"}', 'authenticated', 'authenticated'),
  ('33333333-3333-3333-3333-333333333333', 'catering1@test.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"role":"vendor"}', 'authenticated', 'authenticated'),
  ('44444444-4444-4444-4444-444444444444', 'catering2@test.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"role":"vendor"}', 'authenticated', 'authenticated'),
  ('55555555-5555-5555-5555-555555555555', 'photo1@test.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"role":"vendor"}', 'authenticated', 'authenticated'),
  ('66666666-6666-6666-6666-666666666666', 'photo2@test.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"role":"vendor"}', 'authenticated', 'authenticated'),
  ('77777777-7777-7777-7777-777777777777', 'video1@test.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"role":"vendor"}', 'authenticated', 'authenticated'),
  ('88888888-8888-8888-8888-888888888888', 'music1@test.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"role":"vendor"}', 'authenticated', 'authenticated'),
  ('99999999-9999-9999-9999-999999999999', 'decor1@test.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"role":"vendor"}', 'authenticated', 'authenticated'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'makeup1@test.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"role":"vendor"}', 'authenticated', 'authenticated'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'costume1@test.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"role":"vendor"}', 'authenticated', 'authenticated'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'nattu1@test.com', crypt('password123', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"role":"vendor"}', 'authenticated', 'authenticated')
ON CONFLICT (id) DO NOTHING;

-- Step 2: Update profiles with vendor role and names (trigger created them)
UPDATE public.profiles SET role = 'vendor', full_name = 'Sunnyvale Hindu Temple' WHERE id = '11111111-1111-1111-1111-111111111111';
UPDATE public.profiles SET role = 'vendor', full_name = 'Fremont Cultural Center' WHERE id = '22222222-2222-2222-2222-222222222222';
UPDATE public.profiles SET role = 'vendor', full_name = 'Saravana Bhavan Catering' WHERE id = '33333333-3333-3333-3333-333333333333';
UPDATE public.profiles SET role = 'vendor', full_name = 'Komala Vilas Events' WHERE id = '44444444-4444-4444-4444-444444444444';
UPDATE public.profiles SET role = 'vendor', full_name = 'Rajan Photography' WHERE id = '55555555-5555-5555-5555-555555555555';
UPDATE public.profiles SET role = 'vendor', full_name = 'Bay Area Moments' WHERE id = '66666666-6666-6666-6666-666666666666';
UPDATE public.profiles SET role = 'vendor', full_name = 'Nritya Films' WHERE id = '77777777-7777-7777-7777-777777777777';
UPDATE public.profiles SET role = 'vendor', full_name = 'Chennai Classical Musicians' WHERE id = '88888888-8888-8888-8888-888888888888';
UPDATE public.profiles SET role = 'vendor', full_name = 'Lotus Stage Decorations' WHERE id = '99999999-9999-9999-9999-999999999999';
UPDATE public.profiles SET role = 'vendor', full_name = 'Bridal Glow Studio' WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
UPDATE public.profiles SET role = 'vendor', full_name = 'Nartaki Costumes' WHERE id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
UPDATE public.profiles SET role = 'vendor', full_name = 'Guru Nattuvanar Services' WHERE id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

-- Step 3: Create vendor profiles with full data
INSERT INTO public.vendor_profiles (id, business_name, description, category, service_areas, price_min, price_max, is_published)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Sunnyvale Hindu Temple', 'Beautiful temple venue with traditional architecture, perfect for Arangetrams. Includes sound system and seating for 300 guests.', 'venue', ARRAY['San Jose', 'Sunnyvale', 'Santa Clara'], 3000, 5000, true),
  ('22222222-2222-2222-2222-222222222222', 'Fremont Cultural Center', 'Modern cultural center with state-of-the-art stage and lighting. Ideal for large Arangetrams with 500+ guests.', 'venue', ARRAY['Fremont', 'Newark', 'Union City'], 4000, 7000, true),
  ('33333333-3333-3333-3333-333333333333', 'Saravana Bhavan Catering', 'Authentic South Indian vegetarian cuisine. Specializing in traditional Arangetram feasts with full-service staff.', 'catering', ARRAY['San Jose', 'Fremont', 'Sunnyvale', 'Santa Clara'], 5000, 15000, true),
  ('44444444-4444-4444-4444-444444444444', 'Komala Vilas Events', 'Premium vegetarian catering with live dosa station and traditional sweets. Known for exceptional presentation.', 'catering', ARRAY['San Francisco', 'San Jose', 'Palo Alto'], 8000, 20000, true),
  ('55555555-5555-5555-5555-555555555555', 'Rajan Photography', 'Capturing the grace of Bharatanatyam for 15 years. Specializes in action shots and traditional portraits.', 'photography', ARRAY['San Jose', 'Fremont', 'Sunnyvale'], 2000, 4000, true),
  ('66666666-6666-6666-6666-666666666666', 'Bay Area Moments', 'Contemporary photography style with artistic flair. Drone shots available. Quick turnaround.', 'photography', ARRAY['San Francisco', 'Oakland', 'San Jose'], 2500, 5000, true),
  ('77777777-7777-7777-7777-777777777777', 'Nritya Films', 'Cinematic Arangetram videos with multi-camera coverage. Includes highlight reel and full performance.', 'videography', ARRAY['San Jose', 'Fremont', 'Cupertino'], 3000, 6000, true),
  ('88888888-8888-8888-8888-888888888888', 'Chennai Classical Musicians', 'Professional Carnatic music ensemble with mridangam, violin, and flute. Trained at Kalakshetra.', 'musicians', ARRAY['San Jose', 'Fremont', 'San Francisco', 'Sunnyvale'], 2000, 4000, true),
  ('99999999-9999-9999-9999-999999999999', 'Lotus Stage Decorations', 'Traditional and modern stage setups with fresh flowers, drapes, and lighting. Custom backdrops available.', 'stage_decoration', ARRAY['San Jose', 'Fremont', 'Santa Clara'], 1500, 4000, true),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Bridal Glow Studio', 'Expert in traditional Bharatanatyam makeup and hair styling. Includes trial session.', 'makeup_artist', ARRAY['San Jose', 'Fremont', 'Sunnyvale', 'Palo Alto'], 300, 600, true),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Nartaki Costumes', 'Custom-stitched Bharatanatyam costumes and jewelry rental. Wide selection of colors and styles.', 'costumes', ARRAY['San Jose', 'Fremont'], 500, 2000, true),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Guru Nattuvanar Services', 'Experienced nattuvanar for your Arangetram. 30+ years of guiding young dancers.', 'nattuvanar', ARRAY['San Jose', 'Fremont', 'Sunnyvale', 'Santa Clara'], 1000, 2000, true)
ON CONFLICT (id) DO NOTHING;
