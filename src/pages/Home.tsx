import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowRight,
  RefreshCw,
  Users,
  Wrench,
  MessageSquare,
  Code2,
  Rocket,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  Image,
  X,
  LogIn,
  BookOpen,
  GraduationCap,
  Repeat,
  UserCheck,
  Handshake,
  Monitor,
  Palette,
  Briefcase,
  TrendingUp,
  Instagram,
} from "lucide-react";
import logoSrc from "@/assets/logo-dark.svg";
import { Button } from "@/components/ui/button";
import { fetchCourseData, type CategoryData } from "@/lib/fetchCourseData";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface AreaCourses {
  area: string;
  carreiras: { nome: string; cursos: string[] }[];
}

function buildAreaCourses(courseData: CategoryData[]): AreaCourses[] {
  const result: AreaCourses[] = [];
  const areaMap = new Map<string, { nome: string; cursos: string[] }[]>();
  for (const cat of courseData) {
    for (const entry of cat.areas) {
      const key = entry.area;
      if (!areaMap.has(key)) areaMap.set(key, []);
      const uniqueCourses = new Set<string>();
      for (const f of entry.formacoes) {
        for (const c of f.cursos) uniqueCourses.add(c);
      }
      if (uniqueCourses.size > 0) {
        areaMap.get(key)!.push({ nome: entry.carreira, cursos: Array.from(uniqueCourses) });
      }
    }
  }
  for (const [area, carreiras] of areaMap) {
    if (carreiras.length > 0) result.push({ area, carreiras });
  }
  return result;
}

const areaIcons: Record<string, React.ElementType> = {
  "Mkt / Tráfego": TrendingUp,
  "Arquitetura": Briefcase,
  "Design Gráfico": Palette,
  "Engenharia": Wrench,
  "Produção Audiovisual": Code2,
  "Projetos Técnicos": Briefcase,
  "IA (Inteligência Artificial)": Monitor,
  "Ingressante (Jovens)": Users,
  "Fotografia": Image,
  "Games": Rocket,
  "Kids": Users,
  "Administrativos": Briefcase,
  "Negócios": TrendingUp,
};

function getAreaIcon(area: string) {
  return areaIcons[area] || BookOpen;
}

const formats = [
  { icon: RefreshCw, title: "Dual System", desc: "Integração completa entre o conhecimento e aplicação prática em cenários reais de mercado.", color: "text-destructive" },
  { icon: Users, title: "Mentorias", desc: "Acompanhamento personalizado realizado em sessões individuais ou em pequenos grupos estratégicos.", color: "text-destructive" },
  { icon: Wrench, title: "Treinamentos", desc: "Programas de capacitação técnica intensiva voltados para o domínio de ferramentas e processos.", color: "text-destructive" },
  { icon: MessageSquare, title: "Consultorias", desc: "Suporte estratégico desenhado para resolver desafios específicos de carreira ou desenvolvimento de projetos.", color: "text-destructive" },
];

const timeline = [
  { label: "Ingresso", icon: LogIn },
  { label: "Formação Base", icon: BookOpen },
  { label: "Formação Completa", icon: GraduationCap },
  { label: "Formação Continuada", icon: Repeat },
  { label: "Mentorias", icon: UserCheck },
  { label: "Consultorias e Treinamentos", icon: Handshake },
];

const fadeUp = {
  hidden: { opacity: 0, y: 16, filter: "blur(4px)" },
  visible: (i: number) => ({
    opacity: 1, y: 0, filter: "blur(0px)",
    transition: { delay: i * 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  }),
};

export default function Home() {
  const navigate = useNavigate();
  const [campaignOpen, setCampaignOpen] = useState(false);
  const [activeCampaigns, setActiveCampaigns] = useState<{ name: string; image_url: string }[]>([]);
  const [campaignIdx, setCampaignIdx] = useState(0);
  const [openCarreiras, setOpenCarreiras] = useState<Set<string>>(new Set());
  const [areaCourses, setAreaCourses] = useState<AreaCourses[]>([]);

  useEffect(() => {
    fetchCourseData().then(data => setAreaCourses(buildAreaCourses(data)));
    const today = new Date().toISOString().slice(0, 10);
    supabase.from("campaigns").select("*").eq("active", true).then(({ data }) => {
      if (data) {
        const valid = (data as any[]).filter(c => {
          if (c.start_date && c.start_date > today) return false;
          if (c.end_date && c.end_date < today) return false;
          return true;
        });
        setActiveCampaigns(valid.map(c => ({ name: c.name, image_url: c.image_url })));
      }
    });
  }, []);

  const toggleCarreira = (key: string) => {
    setOpenCarreiras((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b bg-card/95 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between px-4 py-3 md:px-8">
          <div className="flex items-center gap-3">
            <img src={logoSrc} alt="NovaMicroway" className="h-8 md:h-10 w-auto" />
            <h1 className="text-lg font-extrabold tracking-tight text-foreground md:text-xl">
              Sua Experiência NovaMicroway
            </h1>
          </div>
          <Button onClick={() => navigate("/configurador")} className="touch-target gap-2 bg-accent text-accent-foreground hover:bg-accent/90">
            <span className="hidden sm:inline">Sua Formação</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <main className="container mx-auto flex-1 space-y-16 px-4 py-10 md:px-8">
        {/* Section 1 – Formas de Ensino */}
        <section>
          <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={fadeUp} custom={0}
            className="text-2xl font-extrabold tracking-tight text-foreground md:text-3xl">
            Formas de Ensino na Escola
          </motion.h2>
          <motion.p initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={fadeUp} custom={1}
            className="mt-2 text-sm text-muted-foreground">
            Formação Especializada: Programas focados em competências práticas para o mercado de trabalho.
          </motion.p>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {formats.map((f, i) => (
              <motion.div key={f.title} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={fadeUp} custom={i + 2}
                className="rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
                <f.icon className={`h-5 w-5 ${f.color}`} />
                <h3 className="mt-3 text-sm font-extrabold uppercase tracking-wide text-foreground">{f.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Section 2 – Trilha + Workshops/Bootcamps */}
        <section>
          <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={fadeUp} custom={0}
            className="text-2xl font-extrabold tracking-tight text-foreground md:text-3xl">
            Trilha de Sucesso do Aluno
          </motion.h2>
          <motion.p initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={fadeUp} custom={1}
            className="mt-2 text-sm text-muted-foreground">
            Linha do tempo da formação — do ingresso à especialização.
          </motion.p>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={fadeUp} custom={2}
            className="mt-10 overflow-x-auto pb-4">
            <div className="relative mx-auto" style={{ minWidth: 700 }}>
              {/* Main line */}
              <div className="absolute left-[48px] right-[48px] top-6 h-px bg-border" />

              <div className="flex items-start justify-between">
                {timeline.map((step) => {
                  const StepIcon = step.icon;
                  return (
                    <div key={step.label} className="relative flex w-24 flex-shrink-0 flex-col items-center">
                      <div className="z-[1] flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm">
                        <StepIcon className="h-5 w-5 text-accent" />
                      </div>
                      <span className="mt-3 text-center text-[11px] font-semibold leading-tight text-foreground">
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Alternative branch */}
              <div className="relative mt-2 flex flex-col items-center" style={{ marginLeft: "calc(2/6 * 100% - 12px)", width: "calc(2/6 * 100%)" }}>
                <svg viewBox="0 0 200 48" className="h-12 w-full" preserveAspectRatio="none">
                  <path d="M 10 0 Q 10 38 100 38 Q 190 38 190 0" fill="none" stroke="hsl(var(--success))" strokeWidth="1.5" strokeDasharray="5 4" />
                </svg>
                <span className="mt-1 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-bold text-success whitespace-nowrap">
                  Formação Alternativa
                </span>
              </div>
            </div>
          </motion.div>

          {/* Workshops & Bootcamps - compact */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={fadeUp} custom={3}
            className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex items-start gap-3 rounded-lg border bg-card p-4 shadow-sm">
              <Code2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-destructive" />
              <div>
                <h4 className="text-sm font-bold text-foreground">Workshops</h4>
                <p className="mt-1 text-xs text-muted-foreground">
                  Sessões práticas focadas no domínio de ferramentas específicas.
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {["Foco em Ferramentas", "Duração Reduzida", "Aplicação Imediata"].map((b) => (
                    <span key={b} className="flex items-center gap-1 text-[11px] font-medium text-foreground">
                      <CheckCircle2 className="h-3 w-3 text-success" />{b}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg border bg-card p-4 shadow-sm">
              <Rocket className="mt-0.5 h-5 w-5 flex-shrink-0 text-success" />
              <div>
                <h4 className="text-sm font-bold text-foreground">Bootcamps</h4>
                <p className="mt-1 text-xs text-muted-foreground">
                  Treinamentos intensivos para virada de carreira em tempo recorde.
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {["Imersão Total", "Aceleração de Carreira", "Projetos Reais"].map((b) => (
                    <span key={b} className="flex items-center gap-1 text-[11px] font-medium text-foreground">
                      <CheckCircle2 className="h-3 w-3 text-success" />{b}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Section 3 – Áreas e Carreiras */}
        <section>
          <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={fadeUp} custom={0}
            className="text-2xl font-extrabold tracking-tight text-foreground md:text-3xl">
            Áreas de Conhecimento
          </motion.h2>

          <div className="mt-8 space-y-10">
            {areaCourses.map((ac, ai) => {
              const AreaIcon = getAreaIcon(ac.area);
              return (
                <motion.div key={ac.area} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.15 }} variants={fadeUp} custom={ai}>
                  <div className="flex items-center gap-2.5 border-b border-border pb-2">
                    <AreaIcon className="h-5 w-5 text-accent" />
                    <h3 className="text-lg font-extrabold uppercase tracking-wide text-foreground">{ac.area}</h3>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {ac.carreiras.map((car) => {
                      const key = `${ac.area}::${car.nome}`;
                      const isOpen = openCarreiras.has(key);
                      return (
                        <Collapsible key={car.nome} open={isOpen} onOpenChange={() => toggleCarreira(key)}>
                          <CollapsibleTrigger className="w-full rounded-lg border border-border/60 bg-card/60 shadow-sm transition-shadow hover:shadow-md">
                            <div className="flex items-center justify-between rounded-lg bg-muted px-3 py-2">
                              <span className="text-xs font-semibold text-foreground">{car.nome}</span>
                              <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
                            </div>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <ul className="space-y-1 px-3 py-2">
                              {car.cursos.map((c) => (
                                <li key={c} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                  <ChevronRight className="h-2.5 w-2.5 flex-shrink-0 text-accent" />{c}
                                </li>
                              ))}
                            </ul>
                          </CollapsibleContent>
                        </Collapsible>
                      );
                    })}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-card/80 mt-12 pb-20">
        <div className="container mx-auto flex flex-col items-center justify-between gap-3 px-4 py-6 sm:flex-row md:px-8">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} NovaMicroway. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-4">
            <a href="https://www.novamicrowaybc.com.br/" target="_blank" rel="noopener noreferrer"
              className="text-xs font-medium text-accent hover:underline">
              novamicrowaybc.com.br
            </a>
            <a href="https://www.instagram.com/novamicrowaybc/" target="_blank" rel="noopener noreferrer"
              className="text-muted-foreground hover:text-accent transition-colors" aria-label="Instagram">
              <Instagram className="h-5 w-5" />
            </a>
            <span className="text-muted-foreground/30">|</span>
            <a href="/admin/login" className="text-muted-foreground/40 hover:text-muted-foreground text-[10px] transition-colors">
              Admin
            </a>
          </div>
        </div>
      </footer>

      {/* Campaign popup button */}
      {activeCampaigns.length > 0 && (
        <>
          <button onClick={() => setCampaignOpen(true)}
            className="fixed bottom-5 right-5 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg transition-transform hover:scale-105 active:scale-95"
            aria-label="Ver campanha">
            <Image className="h-6 w-6" />
          </button>

          {campaignOpen && (
            <div className="fixed bottom-20 right-5 z-30 w-80 overflow-hidden rounded-xl border bg-card shadow-xl">
              <div className="flex items-center justify-between border-b px-4 py-2">
                {activeCampaigns.length > 1 && (
                  <button onClick={() => setCampaignIdx(i => (i - 1 + activeCampaigns.length) % activeCampaigns.length)} className="rounded-full p-1 hover:bg-muted">
                    <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                  </button>
                )}
                <span className="flex-1 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground truncate">
                  {activeCampaigns[campaignIdx]?.name || "Campanha do Momento"}
                </span>
                {activeCampaigns.length > 1 && (
                  <button onClick={() => setCampaignIdx(i => (i + 1) % activeCampaigns.length)} className="rounded-full p-1 hover:bg-muted">
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                )}
                <button onClick={() => setCampaignOpen(false)} className="rounded-full p-1 hover:bg-muted ml-1">
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
              <img src={activeCampaigns[campaignIdx]?.image_url} alt={activeCampaigns[campaignIdx]?.name || "Campanha"} className="w-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/320x200?text=Campanha"; }} />
              {activeCampaigns.length > 1 && (
                <div className="flex justify-center gap-1 py-1.5">
                  {activeCampaigns.map((_, i) => (
                    <span key={i} className={`h-1.5 w-1.5 rounded-full ${i === campaignIdx ? "bg-accent" : "bg-muted-foreground/30"}`} />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
