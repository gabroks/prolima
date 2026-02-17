-- Create storage bucket for company assets
INSERT INTO storage.buckets (id, name, public) VALUES ('company-assets', 'company-assets', true);

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload company assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'company-assets' AND auth.uid() IS NOT NULL);

-- Allow authenticated users to update
CREATE POLICY "Authenticated users can update company assets"
ON storage.objects FOR UPDATE
USING (bucket_id = 'company-assets' AND auth.uid() IS NOT NULL);

-- Allow public read access
CREATE POLICY "Public can view company assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'company-assets');

-- Allow authenticated users to delete
CREATE POLICY "Authenticated users can delete company assets"
ON storage.objects FOR DELETE
USING (bucket_id = 'company-assets' AND auth.uid() IS NOT NULL);
