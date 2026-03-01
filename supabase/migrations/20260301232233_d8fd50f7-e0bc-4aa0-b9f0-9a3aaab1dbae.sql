-- Enable realtime for offerings so GroveView can show live events
ALTER PUBLICATION supabase_realtime ADD TABLE public.offerings;