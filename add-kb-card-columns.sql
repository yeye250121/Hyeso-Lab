-- Add columns for KB Card and detailed inquiry tracking
ALTER TABLE inquiries 
ADD COLUMN IF NOT EXISTS landing_template TEXT DEFAULT 'kt-cctv',
ADD COLUMN IF NOT EXISTS landing_subtype TEXT DEFAULT '1',
ADD COLUMN IF NOT EXISTS documents JSONB DEFAULT '{}'::jsonb;

-- Create index for filtering by template
CREATE INDEX IF NOT EXISTS idx_inquiries_landing_template ON inquiries(landing_template);
