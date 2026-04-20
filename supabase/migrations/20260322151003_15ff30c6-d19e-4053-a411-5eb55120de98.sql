
CREATE TABLE public.interessados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT DEFAULT '',
  nome TEXT NOT NULL DEFAULT '',
  idade TEXT DEFAULT '',
  estudo TEXT DEFAULT '',
  responsavel TEXT DEFAULT '',
  instrutor TEXT DEFAULT '',
  mentoria_texto TEXT DEFAULT '',
  selected_areas JSONB DEFAULT '[]'::jsonb,
  other_courses JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'Não Cadastrado',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.interessados ENABLE ROW LEVEL SECURITY;

-- Allow public read/write for now (no auth)
CREATE POLICY "Allow public read" ON public.interessados FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON public.interessados FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON public.interessados FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON public.interessados FOR DELETE USING (true);
