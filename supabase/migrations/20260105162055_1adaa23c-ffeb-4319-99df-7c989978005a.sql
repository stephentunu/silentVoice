-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create enum for submission types
CREATE TYPE public.submission_type AS ENUM ('question', 'opinion', 'answer', 'suggestion');

-- Create enum for meeting status
CREATE TYPE public.meeting_status AS ENUM ('active', 'paused', 'ended');

-- Create user_roles table for role-based access
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Create profiles table for admin users
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create meetings table
CREATE TABLE public.meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  code VARCHAR(6) NOT NULL UNIQUE,
  title TEXT DEFAULT 'Untitled Meeting',
  status meeting_status NOT NULL DEFAULT 'active',
  participant_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE
);

-- Create submissions table for anonymous contributions
CREATE TABLE public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID REFERENCES public.meetings(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  type submission_type NOT NULL DEFAULT 'question',
  upvotes INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT false,
  is_hidden BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create votes table to track anonymous votes (using session tokens)
CREATE TABLE public.votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID REFERENCES public.submissions(id) ON DELETE CASCADE NOT NULL,
  session_token TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (submission_id, session_token)
);

-- Create participants table to track anonymous session tokens
CREATE TABLE public.participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID REFERENCES public.meetings(id) ON DELETE CASCADE NOT NULL,
  session_token TEXT NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (meeting_id, session_token)
);

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to handle new user signup (creates profile and assigns admin role)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email)
  VALUES (NEW.id, NEW.email);
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'admin');
  
  RETURN NEW;
END;
$$;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for meetings
CREATE POLICY "Admins can create meetings"
  ON public.meetings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = admin_id AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view their own meetings"
  ON public.meetings FOR SELECT
  TO authenticated
  USING (auth.uid() = admin_id);

CREATE POLICY "Anyone can view active meetings by code"
  ON public.meetings FOR SELECT
  TO anon
  USING (status = 'active');

CREATE POLICY "Admins can update their own meetings"
  ON public.meetings FOR UPDATE
  TO authenticated
  USING (auth.uid() = admin_id AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete their own meetings"
  ON public.meetings FOR DELETE
  TO authenticated
  USING (auth.uid() = admin_id AND public.has_role(auth.uid(), 'admin'));

-- RLS Policies for submissions
CREATE POLICY "Anyone can create submissions for active meetings"
  ON public.submissions FOR INSERT
  TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.meetings 
      WHERE id = meeting_id AND status = 'active'
    )
  );

CREATE POLICY "Authenticated users can create submissions"
  ON public.submissions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.meetings 
      WHERE id = meeting_id AND status = 'active'
    )
  );

CREATE POLICY "Anyone can view non-hidden submissions"
  ON public.submissions FOR SELECT
  TO anon
  USING (is_hidden = false);

CREATE POLICY "Admins can view all submissions for their meetings"
  ON public.submissions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.meetings 
      WHERE id = meeting_id AND admin_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update submissions for their meetings"
  ON public.submissions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.meetings 
      WHERE id = meeting_id AND admin_id = auth.uid()
    )
  );

CREATE POLICY "Admins can delete submissions for their meetings"
  ON public.submissions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.meetings 
      WHERE id = meeting_id AND admin_id = auth.uid()
    )
  );

-- RLS Policies for votes
CREATE POLICY "Anyone can create votes"
  ON public.votes FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Authenticated users can create votes"
  ON public.votes FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can view votes"
  ON public.votes FOR SELECT
  USING (true);

-- RLS Policies for participants
CREATE POLICY "Anyone can join as participant"
  ON public.participants FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Authenticated users can add participants"
  ON public.participants FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view participants for their meetings"
  ON public.participants FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.meetings 
      WHERE id = meeting_id AND admin_id = auth.uid()
    )
  );

-- Enable realtime for submissions table
ALTER PUBLICATION supabase_realtime ADD TABLE public.submissions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.participants;