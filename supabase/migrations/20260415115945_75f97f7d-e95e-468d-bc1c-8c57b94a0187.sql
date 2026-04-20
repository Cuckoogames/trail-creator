ALTER TABLE public.cursos_items ADD COLUMN tipo TEXT DEFAULT NULL;

COMMENT ON COLUMN public.cursos_items.tipo IS 'null = curso regular, mentoria = mentoria, consultoria = consultoria';