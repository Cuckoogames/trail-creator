-- Add unique constraint on codigo (only non-null values)
CREATE UNIQUE INDEX idx_interessados_codigo_unique ON public.interessados (codigo) WHERE codigo IS NOT NULL AND codigo != '';

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.interessados;