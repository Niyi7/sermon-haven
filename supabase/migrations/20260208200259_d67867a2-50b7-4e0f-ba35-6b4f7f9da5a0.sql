-- Create preachers table
CREATE TABLE public.preachers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  bio TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sermons table with foreign key to preachers
CREATE TABLE public.sermons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  theme TEXT NOT NULL,
  description TEXT,
  telegram_file_id TEXT,
  preacher_id UUID NOT NULL REFERENCES public.preachers(id) ON DELETE CASCADE,
  duration TEXT,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.preachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sermons ENABLE ROW LEVEL SECURITY;

-- Create public read policies (sermon library is public content)
CREATE POLICY "Preachers are publicly readable"
  ON public.preachers
  FOR SELECT
  USING (true);

CREATE POLICY "Sermons are publicly readable"
  ON public.sermons
  FOR SELECT
  USING (true);

-- Create indexes for better search performance
CREATE INDEX idx_sermons_preacher_id ON public.sermons(preacher_id);
CREATE INDEX idx_sermons_title ON public.sermons USING gin(to_tsvector('english', title));
CREATE INDEX idx_sermons_theme ON public.sermons(theme);
CREATE INDEX idx_preachers_name ON public.preachers USING gin(to_tsvector('english', name));