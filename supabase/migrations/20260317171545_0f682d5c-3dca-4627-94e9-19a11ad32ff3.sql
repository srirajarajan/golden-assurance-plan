
-- Add bilingual title columns
ALTER TABLE public.updates ADD COLUMN IF NOT EXISTS title_en TEXT;
ALTER TABLE public.updates ADD COLUMN IF NOT EXISTS title_ta TEXT;

-- Migrate existing data: copy title to title_en
UPDATE public.updates SET title_en = title, title_ta = title WHERE title_en IS NULL;
