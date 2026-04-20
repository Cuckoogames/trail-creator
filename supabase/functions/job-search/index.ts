const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface JobSearchRequest {
  keywords: string;
}

interface JobResult {
  linkedin: { count: number; url: string };
  infojobs: { count: number; url: string };
  bne: { count: number; url: string };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { keywords } = await req.json() as JobSearchRequest;

    if (!keywords) {
      return new Response(
        JSON.stringify({ success: false, error: 'Keywords required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const linkedinUrl = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(keywords)}&location=Brasil`;
    const infojobsUrl = `https://www.infojobs.com.br/empregos.aspx?palabra=${encodeURIComponent(keywords)}`;
    const bneUrl = `https://www.bne.com.br/vagas-de-emprego?q=${encodeURIComponent(keywords)}`;

    // Use Firecrawl to scrape each site for job counts
    const scrapeJobCount = async (url: string, platform: string): Promise<number> => {
      try {
        const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url,
            formats: ['markdown'],
            onlyMainContent: true,
            waitFor: 3000,
          }),
        });

        if (!response.ok) {
          console.error(`${platform} scrape failed: ${response.status}`);
          return 0;
        }

        const data = await response.json();
        const markdown = data?.data?.markdown || data?.markdown || '';

        // Extract job count from page content
        let count = 0;

        if (platform === 'linkedin') {
          // LinkedIn shows "X,XXX results" or "X.XXX resultados"
          const match = markdown.match(/(\d[\d.,]*)\s*(?:results|resultados|vagas|jobs)/i);
          if (match) count = parseInt(match[1].replace(/[.,]/g, ''), 10);
        } else if (platform === 'infojobs') {
          // InfoJobs shows "X vagas de emprego" or "X ofertas"
          const match = markdown.match(/(\d[\d.,]*)\s*(?:vagas?|ofertas?)/i);
          if (match) count = parseInt(match[1].replace(/[.,]/g, ''), 10);
        } else if (platform === 'bne') {
          // BNE shows "X vagas encontradas"
          const match = markdown.match(/(\d[\d.,]*)\s*(?:vagas?|oportunidades?)/i);
          if (match) count = parseInt(match[1].replace(/[.,]/g, ''), 10);
        }

        return count || 0;
      } catch (err) {
        console.error(`${platform} error:`, err);
        return 0;
      }
    };

    // Scrape all 3 in parallel
    const [linkedinCount, infojobsCount, bneCount] = await Promise.all([
      scrapeJobCount(linkedinUrl, 'linkedin'),
      scrapeJobCount(infojobsUrl, 'infojobs'),
      scrapeJobCount(bneUrl, 'bne'),
    ]);

    const result: JobResult = {
      linkedin: { count: linkedinCount, url: linkedinUrl },
      infojobs: { count: infojobsCount, url: infojobsUrl },
      bne: { count: bneCount, url: bneUrl },
    };

    const total = linkedinCount + infojobsCount + bneCount;

    return new Response(
      JSON.stringify({ success: true, total, platforms: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed';
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
