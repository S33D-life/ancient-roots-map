-- Enable realtime for offerings and bookshelf_entries (trees already enabled)
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.offerings;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.bookshelf_entries;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;