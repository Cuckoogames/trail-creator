import { useState, useMemo, useCallback, useEffect } from "react";
import { Briefcase, ExternalLink, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { SelectedArea } from "./FormationSelector";
import type { OtherCoursesSelection } from "./OtherCourses";

interface JobSearchPopupProps {
  selectedAreas: Map<string, SelectedArea>;
  otherCourses: OtherCoursesSelection;
}

interface PlatformData {
  count: number;
  url: string;
}

interface JobData {
  total: number;
  platforms: {
    linkedin: PlatformData;
    infojobs: PlatformData;
    bne: PlatformData;
  };
}

function buildSearchKeywords(
  selectedAreas: Map<string, SelectedArea>,
  otherCourses: OtherCoursesSelection
): { areas: string[]; courses: string[] } {
  const areas = new Set<string>();
  const courses = new Set<string>();

  for (const areaData of selectedAreas.values()) {
    if (areaData.selectedCourses.size > 0) {
      areas.add(areaData.area);
      for (const key of areaData.selectedCourses) {
        const parts = key.split("::");
        courses.add(parts[2]);
      }
    }
  }

  for (const key of otherCourses.selected) {
    const [area, curso] = key.split("::");
    areas.add(area);
    courses.add(curso);
  }

  return {
    areas: Array.from(areas),
    courses: Array.from(courses),
  };
}

export function JobSearchPopup({ selectedAreas, otherCourses }: JobSearchPopupProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [jobData, setJobData] = useState<JobData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { areas, courses } = useMemo(
    () => buildSearchKeywords(selectedAreas, otherCourses),
    [selectedAreas, otherCourses]
  );

  const hasSelection = courses.length > 0;

  const searchQuery = useMemo(() => {
    const topCourses = courses.slice(0, 5);
    const areaTerms = areas.slice(0, 2);
    return [...areaTerms, ...topCourses].join(" ");
  }, [areas, courses]);

  const courseList = courses.join(", ");
  const areaList = areas.join(", ");

  const fetchJobs = useCallback(async () => {
    if (!searchQuery) return;
    setLoading(true);
    setError(null);
    setJobData(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("job-search", {
        body: { keywords: searchQuery },
      });

      if (fnError) throw fnError;

      if (data?.success) {
        setJobData({ total: data.total, platforms: data.platforms });
      } else {
        setError(data?.error || "Erro ao buscar vagas");
      }
    } catch (err) {
      console.error("Job search error:", err);
      setError("Erro ao conectar com o serviço de vagas");
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (open && hasSelection && !jobData && !loading) {
      fetchJobs();
    }
  }, [open, hasSelection, fetchJobs]);

  // Reset data when selection changes
  useEffect(() => {
    setJobData(null);
  }, [searchQuery]);

  if (!hasSelection) return null;

  const linkedinUrl = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(searchQuery)}&location=Brasil`;
  const infojobsUrl = `https://www.infojobs.com.br/empregos.aspx?palabra=${encodeURIComponent(searchQuery)}`;
  const bneUrl = `https://www.bne.com.br/vagas-de-emprego?q=${encodeURIComponent(searchQuery)}`;

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant="outline"
        className="gap-2 border-accent text-accent hover:bg-accent/10"
      >
        <Briefcase className="h-4 w-4" />
        Vagas de Emprego
      </Button>

      {open && (
        <div className="fixed bottom-4 right-4 z-50 w-[360px] max-w-[calc(100vw-2rem)] rounded-xl border bg-card shadow-2xl animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-accent" />
              <h3 className="text-sm font-bold">Vagas de Emprego</h3>
              {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded-md p-1 hover:bg-muted transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            <div className="rounded-lg bg-muted/50 p-3 space-y-1">
              {jobData ? (
                <p className="text-xs font-semibold text-foreground">
                  {jobData.total > 0
                    ? `${jobData.total.toLocaleString("pt-BR")} vagas de emprego encontradas`
                    : "Buscando vagas..."
                  }
                </p>
              ) : loading ? (
                <p className="text-xs text-muted-foreground flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Buscando vagas em tempo real...
                </p>
              ) : error ? (
                <p className="text-xs text-destructive">{error}</p>
              ) : null}
              <p className="text-xs text-muted-foreground">
                para <span className="font-semibold text-foreground">{areaList}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                com conhecimento em{" "}
                <span className="font-semibold text-foreground">{courseList}</span>
              </p>
            </div>

            <div className="space-y-2">
              <JobSiteLink
                name="LinkedIn"
                url={jobData?.platforms.linkedin.url || linkedinUrl}
                color="bg-[#0A66C2]"
                count={jobData?.platforms.linkedin.count}
                loading={loading}
              />
              <JobSiteLink
                name="InfoJobs"
                url={jobData?.platforms.infojobs.url || infojobsUrl}
                color="bg-[#FF7D00]"
                count={jobData?.platforms.infojobs.count}
                loading={loading}
              />
              <JobSiteLink
                name="BNE"
                url={jobData?.platforms.bne.url || bneUrl}
                color="bg-[#00A651]"
                count={jobData?.platforms.bne.count}
                loading={loading}
              />
            </div>

            {error && (
              <Button
                onClick={fetchJobs}
                variant="ghost"
                size="sm"
                className="w-full text-xs"
              >
                Tentar novamente
              </Button>
            )}

            <p className="text-[10px] text-muted-foreground text-center">
              Dados obtidos via scraping em tempo real
            </p>
          </div>
        </div>
      )}
    </>
  );
}

function JobSiteLink({
  name,
  url,
  color,
  count,
  loading,
}: {
  name: string;
  url: string;
  color: string;
  count?: number;
  loading: boolean;
}) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors group"
    >
      <div className={`h-8 w-8 rounded-md ${color} flex items-center justify-center`}>
        <Briefcase className="h-4 w-4 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{name}</p>
        <p className="text-xs text-muted-foreground">
          {loading ? (
            <span className="flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" /> Buscando...
            </span>
          ) : count !== undefined && count > 0 ? (
            `${count.toLocaleString("pt-BR")} vagas encontradas`
          ) : count === 0 ? (
            "Pesquisar vagas"
          ) : (
            "Pesquisar vagas"
          )}
        </p>
      </div>
      <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
    </a>
  );
}
