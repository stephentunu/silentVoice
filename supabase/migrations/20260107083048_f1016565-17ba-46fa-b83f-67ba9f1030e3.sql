-- Add session_token to submissions to link to participants
ALTER TABLE public.submissions ADD COLUMN session_token text;

-- Create index for faster lookups
CREATE INDEX idx_submissions_session_token ON public.submissions(session_token);