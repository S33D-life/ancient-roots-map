-- Make latitude and longitude nullable to allow importing trees without coordinates
ALTER TABLE trees 
ALTER COLUMN latitude DROP NOT NULL,
ALTER COLUMN longitude DROP NOT NULL;