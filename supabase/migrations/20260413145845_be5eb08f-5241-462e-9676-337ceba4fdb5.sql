
-- Add hours column to cursos_items
ALTER TABLE public.cursos_items ADD COLUMN hours integer NOT NULL DEFAULT 0;

-- Create propostas table
CREATE TABLE public.propostas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_proposta serial,
  interessado_id uuid REFERENCES public.interessados(id) ON DELETE SET NULL,
  codigo_interessado text DEFAULT '',
  nome_interessado text NOT NULL DEFAULT '',
  plano_selecionado text DEFAULT '',
  planos_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.propostas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read propostas" ON public.propostas FOR SELECT USING (true);
CREATE POLICY "Public insert propostas" ON public.propostas FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update propostas" ON public.propostas FOR UPDATE USING (true);
CREATE POLICY "Public delete propostas" ON public.propostas FOR DELETE USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.propostas;
