import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FileSpreadsheet, ArrowLeft, Save, Users } from "lucide-react";
import { HeaderForm, type HeaderData } from "@/components/HeaderForm";
import logoSrc from "@/assets/logo-dark.svg";
import { FormationSelector, type SelectedArea } from "@/components/FormationSelector";
import { OtherCourses, type OtherCoursesSelection } from "@/components/OtherCourses";
import { MentoriaCheckbox } from "@/components/MentoriaCheckbox";
import { TrailSummary } from "@/components/TrailSummary";
import { Button } from "@/components/ui/button";
import { exportToExcel } from "@/lib/exportExcel";
import {
  saveInteressado,
  deserializeAreas,
  deserializeOther,
  type InteressadoRecord,
} from "@/lib/saveInteressado";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { fetchCourseData, fetchOtherCourses, type CategoryData, type OtherCoursesArea } from "@/lib/fetchCourseData";

const STORAGE_KEY = "novamicroway_form_data";

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveToStorage(data: Record<string, unknown>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

const Index = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("id");
  const fromAdmin = searchParams.get("from") === "admin";

  const [recordId, setRecordId] = useState<string | null>(editId);
  const [headerData, setHeaderData] = useState<HeaderData>({
    codigo: "",
    nome: "",
    idade: "",
    estudo: "",
    responsavel: "",
    instrutor: "",
  });
  const [selectedAreas, setSelectedAreas] = useState<Map<string, SelectedArea>>(new Map());
  const [otherCourses, setOtherCourses] = useState<OtherCoursesSelection>({ selected: new Set() });
  const [otherCoursesOpen, setOtherCoursesOpen] = useState(false);
  const [mentoriaTexto, setMentoriaTexto] = useState("");
  const [saving, setSaving] = useState(false);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [courseData, setCourseData] = useState<CategoryData[]>([]);
  const [otherCoursesData, setOtherCoursesData] = useState<OtherCoursesArea[]>([]);

  useEffect(() => {
    fetchCourseData().then(setCourseData);
    fetchOtherCourses().then(setOtherCoursesData);
  }, []);

  // Load from DB if editing, otherwise from localStorage
  useEffect(() => {
    if (editId) {
      supabase
        .from("interessados")
        .select("*")
        .eq("id", editId)
        .single()
        .then(({ data }) => {
          if (!data) return;
          const r = data as unknown as InteressadoRecord;
          setHeaderData({
            codigo: r.codigo || "",
            nome: r.nome || "",
            idade: r.idade || "",
            estudo: r.estudo || "",
            responsavel: r.responsavel || "",
            instrutor: r.instrutor || "",
          });
          setSelectedAreas(deserializeAreas(r.selected_areas));
          setOtherCourses(deserializeOther(r.other_courses));
          setMentoriaTexto(r.mentoria_texto || "");
          setRecordId(r.id);
        });
    } else {
      const stored = loadFromStorage();
      if (stored) {
        setHeaderData(stored.headerData || headerData);
        if (stored.selectedAreas) setSelectedAreas(deserializeAreas(stored.selectedAreas));
        if (stored.otherCourses) setOtherCourses(deserializeOther(stored.otherCourses));
        setMentoriaTexto(stored.mentoriaTexto || "");
        setRecordId(stored.recordId || null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId]);

  // Auto-save to localStorage on changes
  useEffect(() => {
    const serialized = {
      headerData,
      selectedAreas: Array.from(selectedAreas.values())
        .filter((a) => a.selectedCourses.size > 0)
        .map((a) => ({
          area: a.area,
          carreira: a.carreira,
          selectedCourses: Array.from(a.selectedCourses),
          observation: a.observation,
        })),
      otherCourses: Array.from(otherCourses.selected),
      mentoriaTexto,
      recordId,
    };
    saveToStorage(serialized);
  }, [headerData, selectedAreas, otherCourses, mentoriaTexto, recordId]);

  // Auto-save to DB after 3s of inactivity
  useEffect(() => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(async () => {
      if (!headerData.nome) return;
      try {
        const id = await saveInteressado(recordId, headerData, selectedAreas, otherCourses, mentoriaTexto);
        setRecordId(id);
      } catch {
        // silent
      }
    }, 3000);
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headerData, selectedAreas, otherCourses, mentoriaTexto]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const id = await saveInteressado(recordId, headerData, selectedAreas, otherCourses, mentoriaTexto);
      setRecordId(id);
      toast.success("Salvo com sucesso!");
    } catch {
      toast.error("Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }, [recordId, headerData, selectedAreas, otherCourses, mentoriaTexto]);

  const totalSelected =
    Array.from(selectedAreas.values()).reduce((acc, a) => acc + a.selectedCourses.size, 0) +
    otherCourses.selected.size;

  const handleExport = useCallback(() => {
    exportToExcel(headerData, selectedAreas, otherCourses);
  }, [headerData, selectedAreas, otherCourses]);

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 border-b bg-card/95 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between px-4 py-3 md:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => fromAdmin ? navigate("/admin") : navigate("/")}
              className="rounded-full p-2 hover:bg-muted transition-colors"
              aria-label={fromAdmin ? "Voltar para Painel Admin" : "Voltar para Home"}
            >
              <ArrowLeft className="h-5 w-5 text-foreground" />
            </button>
            <img src={logoSrc} alt="NovaMicroway" className="h-8 md:h-10 w-auto" />
            <div>
              <h1 className="text-lg font-extrabold tracking-tight text-foreground md:text-xl">
                Sua Formação NovaMicroway
              </h1>
              <p className="text-xs text-muted-foreground">Montagem de Trilha de Formação</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/interessados")}
              className="gap-1.5 text-xs"
            >
              <Users className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Ver Interessados</span>
            </Button>
            {totalSelected > 0 && (
              <span className="rounded-full bg-success/10 px-3 py-1 text-xs font-bold text-success">
                {totalSelected} cursos
              </span>
            )}
            <Button
              onClick={handleExport}
              className="touch-target gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span className="hidden sm:inline">Gerar Documento</span>
              <span className="sm:hidden">Exportar</span>
            </Button>
          </div>
        </div>
      </div>

      <main className="container mx-auto space-y-6 px-4 py-6 md:px-8 md:py-8">
        <HeaderForm data={headerData} onChange={setHeaderData} />
        <FormationSelector selectedAreas={selectedAreas} onSelectionChange={setSelectedAreas} courseData={courseData} />
        <MentoriaCheckbox value={mentoriaTexto} onChange={setMentoriaTexto} />
        <OtherCourses
          selection={otherCourses}
          onSelectionChange={setOtherCourses}
          open={otherCoursesOpen}
          onOpenChange={setOtherCoursesOpen}
          coursesData={otherCoursesData}
        />
        <TrailSummary
          headerData={headerData}
          selectedAreas={selectedAreas}
          otherCourses={otherCourses}
          mentoriaTexto={mentoriaTexto}
          onSave={handleSave}
          saving={saving}
        />
      </main>
    </div>
  );
};

export default Index;
