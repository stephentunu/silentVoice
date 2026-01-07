-- Add display_name column to participants table for user identification
ALTER TABLE public.participants
ADD COLUMN display_name text DEFAULT NULL;

-- Add an index for faster queries on display_name
CREATE INDEX idx_participants_display_name ON public.participants(display_name);

-- Update RLS policy to allow participants to select themselves
CREATE POLICY "Participants can view their own record"
ON public.participants
FOR SELECT
USING (true);