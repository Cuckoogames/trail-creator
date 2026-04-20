
ALTER TABLE public.propostas ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();

CREATE OR REPLACE FUNCTION public.update_propostas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_propostas_updated_at
BEFORE UPDATE ON public.propostas
FOR EACH ROW
EXECUTE FUNCTION public.update_propostas_updated_at();
