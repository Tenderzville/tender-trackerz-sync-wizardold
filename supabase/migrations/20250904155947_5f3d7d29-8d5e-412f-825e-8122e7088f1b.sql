-- Trigger the tender scraper to populate database with initial data
-- First, let's check if we have any automation logs
INSERT INTO automation_logs (function_name, status, executed_at) 
VALUES ('manual-scraper-trigger', 'pending', now());

-- Make storage buckets public for file access
UPDATE storage.buckets 
SET public = true 
WHERE name IN ('rfq-documents', 'quote-attachments');

-- Add RLS policies for storage buckets
CREATE POLICY "Authenticated users can view files" 
ON storage.objects 
FOR SELECT 
TO authenticated
USING (bucket_id IN ('rfq-documents', 'quote-attachments'));

CREATE POLICY "Users can upload files to RFQ documents" 
ON storage.objects 
FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'rfq-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload quote attachments" 
ON storage.objects 
FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'quote-attachments' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can manage their own files" 
ON storage.objects 
FOR DELETE 
TO authenticated
USING (
  bucket_id IN ('rfq-documents', 'quote-attachments')
  AND auth.uid()::text = (storage.foldername(name))[1]
);