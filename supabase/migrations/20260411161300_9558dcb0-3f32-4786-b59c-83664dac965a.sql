
-- Calibrate all 8 seeded journeys to match the real S33D app

-- 1. homepage-entry: "/" with real selectors
UPDATE public.agent_journeys SET
  entry_path = '/',
  steps_json = '[
    {"action":"goto","target":"/"},
    {"action":"wait_for","target":"h1"},
    {"action":"assert_text","target":"h1","expected":"TETOL"},
    {"action":"assert_visible","target":"header, nav"},
    {"action":"assert_visible","target":"has-text(Ancient Friends Map)"}
  ]'::jsonb
WHERE slug = 'homepage-entry';

-- 2. map-load: "/map" with leaflet container
UPDATE public.agent_journeys SET
  entry_path = '/map',
  steps_json = '[
    {"action":"goto","target":"/map"},
    {"action":"wait_for","target":".leaflet-container"},
    {"action":"assert_visible","target":".leaflet-container"},
    {"action":"assert_visible","target":".leaflet-control-zoom"}
  ]'::jsonb
WHERE slug = 'map-load';

-- 3. open-tree-card: map markers
UPDATE public.agent_journeys SET
  entry_path = '/map',
  steps_json = '[
    {"action":"goto","target":"/map"},
    {"action":"wait_for","target":".leaflet-container"},
    {"action":"wait_for","target":".leaflet-marker-icon"},
    {"action":"click","target":".leaflet-marker-icon"},
    {"action":"wait_for","target":".leaflet-popup-content"}
  ]'::jsonb
WHERE slug = 'open-tree-card';

-- 4. tree-detail-page: real tree ID
UPDATE public.agent_journeys SET
  entry_path = '/tree/76ea2883-b4f9-4380-be60-2d3eeafe5793',
  steps_json = '[
    {"action":"goto","target":"/tree/76ea2883-b4f9-4380-be60-2d3eeafe5793"},
    {"action":"wait_for","target":"h1"},
    {"action":"assert_visible","target":"h1"},
    {"action":"assert_visible","target":"main"}
  ]'::jsonb
WHERE slug = 'tree-detail-page';

-- 5. offering-flow: real tree page, look for offering section
UPDATE public.agent_journeys SET
  entry_path = '/tree/76ea2883-b4f9-4380-be60-2d3eeafe5793',
  steps_json = '[
    {"action":"goto","target":"/tree/76ea2883-b4f9-4380-be60-2d3eeafe5793"},
    {"action":"wait_for","target":"h1"},
    {"action":"assert_visible","target":"has-text(Offerings)"},
    {"action":"click","target":"has-text(Add Offering)"},
    {"action":"wait_for","target":"[role=dialog]"}
  ]'::jsonb
WHERE slug = 'offering-flow';

-- 6. whisper-flow: real tree page
UPDATE public.agent_journeys SET
  entry_path = '/tree/76ea2883-b4f9-4380-be60-2d3eeafe5793',
  steps_json = '[
    {"action":"goto","target":"/tree/76ea2883-b4f9-4380-be60-2d3eeafe5793"},
    {"action":"wait_for","target":"h1"},
    {"action":"click","target":"has-text(Whisper)"},
    {"action":"wait_for","target":"[role=dialog]"},
    {"action":"assert_visible","target":"textarea"}
  ]'::jsonb
WHERE slug = 'whisper-flow';

-- 7. tree-radio-open: real tree page
UPDATE public.agent_journeys SET
  entry_path = '/tree/76ea2883-b4f9-4380-be60-2d3eeafe5793',
  steps_json = '[
    {"action":"goto","target":"/tree/76ea2883-b4f9-4380-be60-2d3eeafe5793"},
    {"action":"wait_for","target":"h1"},
    {"action":"assert_visible","target":"has-text(Tree Radio)"}
  ]'::jsonb
WHERE slug = 'tree-radio-open';

-- 8. staff-room-open: correct route
UPDATE public.agent_journeys SET
  entry_path = '/library/staff-room',
  steps_json = '[
    {"action":"goto","target":"/library/staff-room"},
    {"action":"wait_for","target":"h1"},
    {"action":"assert_visible","target":"h1"},
    {"action":"assert_visible","target":"main"}
  ]'::jsonb
WHERE slug = 'staff-room-open';
