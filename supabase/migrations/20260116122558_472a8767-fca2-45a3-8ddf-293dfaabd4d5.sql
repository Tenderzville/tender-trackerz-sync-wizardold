-- Add document_links column to rfqs table for external document URLs
ALTER TABLE public.rfqs 
ADD COLUMN IF NOT EXISTS document_links text[] DEFAULT '{}';

-- Add comment for clarity
COMMENT ON COLUMN public.rfqs.document_links IS 'Array of external URLs to RFQ documents (to save storage)';