-- Create data sources table
CREATE TABLE IF NOT EXISTS public.data_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  method TEXT DEFAULT 'GET' CHECK (method IN ('GET', 'POST', 'PUT', 'PATCH', 'DELETE')),
  headers JSONB DEFAULT '{}',
  query_params JSONB DEFAULT '{}',
  auth_type TEXT DEFAULT 'none' CHECK (auth_type IN ('none', 'bearer', 'api_key', 'basic')),
  auth_config JSONB DEFAULT '{}',
  refresh_interval INTEGER DEFAULT 300, -- seconds
  is_active BOOLEAN DEFAULT true,
  last_fetched_at TIMESTAMP WITH TIME ZONE,
  last_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on data_sources table
ALTER TABLE public.data_sources ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for data_sources
CREATE POLICY "Users can view their own data sources" 
  ON public.data_sources FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own data sources" 
  ON public.data_sources FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own data sources" 
  ON public.data_sources FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own data sources" 
  ON public.data_sources FOR DELETE 
  USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_data_sources_user_id ON public.data_sources(user_id);
CREATE INDEX IF NOT EXISTS idx_data_sources_active ON public.data_sources(is_active) WHERE is_active = true;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_data_sources_updated_at 
  BEFORE UPDATE ON public.data_sources 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();
