
-- Campaign table
CREATE TABLE public.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  image_url text NOT NULL DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read campaigns" ON public.campaigns FOR SELECT TO public USING (true);
CREATE POLICY "Public insert campaigns" ON public.campaigns FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Public update campaigns" ON public.campaigns FOR UPDATE TO public USING (true);
CREATE POLICY "Public delete campaigns" ON public.campaigns FOR DELETE TO public USING (true);

-- Storage bucket for campaign images
INSERT INTO storage.buckets (id, name, public) VALUES ('campaigns', 'campaigns', true);

CREATE POLICY "Public upload campaigns" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'campaigns');
CREATE POLICY "Public read campaign files" ON storage.objects FOR SELECT TO public USING (bucket_id = 'campaigns');
CREATE POLICY "Public delete campaign files" ON storage.objects FOR DELETE TO public USING (bucket_id = 'campaigns');
