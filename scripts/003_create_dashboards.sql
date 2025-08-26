-- Create dashboards table
CREATE TABLE IF NOT EXISTS public.dashboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  layout_config JSONB DEFAULT '{}',
  is_public BOOLEAN DEFAULT false,
  is_template BOOLEAN DEFAULT false,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create dashboard_widgets table for storing widget configurations
CREATE TABLE IF NOT EXISTS public.dashboard_widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dashboard_id UUID NOT NULL REFERENCES public.dashboards(id) ON DELETE CASCADE,
  widget_type TEXT NOT NULL CHECK (widget_type IN ('table', 'chart', 'kpi', 'text', 'iframe')),
  title TEXT NOT NULL,
  data_source_id UUID REFERENCES public.data_sources(id) ON DELETE SET NULL,
  config JSONB DEFAULT '{}',
  position_x INTEGER DEFAULT 0,
  position_y INTEGER DEFAULT 0,
  width INTEGER DEFAULT 4,
  height INTEGER DEFAULT 4,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on dashboards table
ALTER TABLE public.dashboards ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for dashboards
CREATE POLICY "Users can view their own dashboards" 
  ON public.dashboards FOR SELECT 
  USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can insert their own dashboards" 
  ON public.dashboards FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own dashboards" 
  ON public.dashboards FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own dashboards" 
  ON public.dashboards FOR DELETE 
  USING (auth.uid() = user_id);

-- Enable RLS on dashboard_widgets table
ALTER TABLE public.dashboard_widgets ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for dashboard_widgets
CREATE POLICY "Users can view widgets of their dashboards or public dashboards" 
  ON public.dashboard_widgets FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.dashboards d 
      WHERE d.id = dashboard_widgets.dashboard_id 
      AND (d.user_id = auth.uid() OR d.is_public = true)
    )
  );

CREATE POLICY "Users can insert widgets to their own dashboards" 
  ON public.dashboard_widgets FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.dashboards d 
      WHERE d.id = dashboard_widgets.dashboard_id 
      AND d.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update widgets of their own dashboards" 
  ON public.dashboard_widgets FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.dashboards d 
      WHERE d.id = dashboard_widgets.dashboard_id 
      AND d.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete widgets of their own dashboards" 
  ON public.dashboard_widgets FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.dashboards d 
      WHERE d.id = dashboard_widgets.dashboard_id 
      AND d.user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_dashboards_user_id ON public.dashboards(user_id);
CREATE INDEX IF NOT EXISTS idx_dashboards_public ON public.dashboards(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_dashboard_id ON public.dashboard_widgets(dashboard_id);

-- Create trigger to automatically update updated_at for dashboards
CREATE TRIGGER update_dashboards_updated_at 
  BEFORE UPDATE ON public.dashboards 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger to automatically update updated_at for dashboard_widgets
CREATE TRIGGER update_dashboard_widgets_updated_at 
  BEFORE UPDATE ON public.dashboard_widgets 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();
