
-- Trilha areas (Mkt/Tráfego, Arquitetura, etc.)
CREATE TABLE public.trilha_areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  area_name text NOT NULL,
  category_name text NOT NULL,
  sort_order int NOT NULL DEFAULT 0
);

ALTER TABLE public.trilha_areas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read trilha_areas" ON public.trilha_areas FOR SELECT TO public USING (true);
CREATE POLICY "Public insert trilha_areas" ON public.trilha_areas FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Public update trilha_areas" ON public.trilha_areas FOR UPDATE TO public USING (true);
CREATE POLICY "Public delete trilha_areas" ON public.trilha_areas FOR DELETE TO public USING (true);

-- Trilha carreiras
CREATE TABLE public.trilha_carreiras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  area_id uuid REFERENCES public.trilha_areas(id) ON DELETE CASCADE NOT NULL,
  carreira_name text NOT NULL,
  sort_order int NOT NULL DEFAULT 0
);

ALTER TABLE public.trilha_carreiras ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read trilha_carreiras" ON public.trilha_carreiras FOR SELECT TO public USING (true);
CREATE POLICY "Public insert trilha_carreiras" ON public.trilha_carreiras FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Public update trilha_carreiras" ON public.trilha_carreiras FOR UPDATE TO public USING (true);
CREATE POLICY "Public delete trilha_carreiras" ON public.trilha_carreiras FOR DELETE TO public USING (true);

-- Trilha cursos (formacao_index: 0=Ponto de Partida, 1=Completa, 2=Continuada, 3=Alternativa, 4=Especialista)
CREATE TABLE public.trilha_cursos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  carreira_id uuid REFERENCES public.trilha_carreiras(id) ON DELETE CASCADE NOT NULL,
  formacao_index int NOT NULL CHECK (formacao_index BETWEEN 0 AND 4),
  curso_name text NOT NULL,
  sort_order int NOT NULL DEFAULT 0
);

ALTER TABLE public.trilha_cursos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read trilha_cursos" ON public.trilha_cursos FOR SELECT TO public USING (true);
CREATE POLICY "Public insert trilha_cursos" ON public.trilha_cursos FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Public update trilha_cursos" ON public.trilha_cursos FOR UPDATE TO public USING (true);
CREATE POLICY "Public delete trilha_cursos" ON public.trilha_cursos FOR DELETE TO public USING (true);

-- Cursos areas (for "Outros Cursos" section)
CREATE TABLE public.cursos_areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  area_name text NOT NULL,
  sort_order int NOT NULL DEFAULT 0
);

ALTER TABLE public.cursos_areas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read cursos_areas" ON public.cursos_areas FOR SELECT TO public USING (true);
CREATE POLICY "Public insert cursos_areas" ON public.cursos_areas FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Public update cursos_areas" ON public.cursos_areas FOR UPDATE TO public USING (true);
CREATE POLICY "Public delete cursos_areas" ON public.cursos_areas FOR DELETE TO public USING (true);

-- Cursos items
CREATE TABLE public.cursos_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  area_id uuid REFERENCES public.cursos_areas(id) ON DELETE CASCADE NOT NULL,
  course_name text NOT NULL,
  sort_order int NOT NULL DEFAULT 0
);

ALTER TABLE public.cursos_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read cursos_items" ON public.cursos_items FOR SELECT TO public USING (true);
CREATE POLICY "Public insert cursos_items" ON public.cursos_items FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Public update cursos_items" ON public.cursos_items FOR UPDATE TO public USING (true);
CREATE POLICY "Public delete cursos_items" ON public.cursos_items FOR DELETE TO public USING (true);
