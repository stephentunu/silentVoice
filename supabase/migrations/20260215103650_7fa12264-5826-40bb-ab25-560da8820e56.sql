
-- Add audio_url column to submissions
ALTER TABLE public.submissions ADD COLUMN audio_url text;

-- Create storage bucket for voice recordings
INSERT INTO storage.buckets (id, name, public) VALUES ('voice-recordings', 'voice-recordings', true);

-- Allow anyone to upload voice recordings
CREATE POLICY "Anyone can upload voice recordings"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'voice-recordings');

-- Allow anyone to view voice recordings
CREATE POLICY "Anyone can view voice recordings"
ON storage.objects FOR SELECT
USING (bucket_id = 'voice-recordings');
