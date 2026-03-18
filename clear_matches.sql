-- Drop existing table to re-create with proper constraints if needed
-- Or just clear it
TRUNCATE TABLE matches CASCADE;

-- Re-run schema for matches if you haven't added the 'venue' column yet
-- ALTER TABLE matches ADD COLUMN venue TEXT NOT NULL DEFAULT 'Unknown';
