import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileSpreadsheet, ChevronDown, Download, Search, X, Calendar, Filter } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import * as XLSX from "xlsx";
import logoSrc from "@/assets/logo-dark.svg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  loadInteressados,
  updateInteressadoStatus,
  type InteressadoRecord,
} from "@/lib/saveInteressado";
import { supabase } from "@/integrations/supabase/client";

const PAGE_SIZE = 20;

export default function Interessados() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<InteressadoRecord[]>([]);
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // Filters
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterCourses, setFilterCourses] = useState<Set<string>>(new Set());
  const [filterAreas, setFilterAreas] = useState<Set<string>>(new Set());
  const [filterCategories, setFilterCategories] = useState<Set<string>>(new Set());
  const [filterMentoria, setFilterMentoria] = useState(false);

  // Summary download
  const [summaryStart, setSummaryStart] = useState("");
  const [summaryEnd, setSummaryEnd] = useState("");
  const [summaryOpen, setSummaryOpen] = useState(false);

  // DB-based filter options from admin panel
  const [dbAreas, setDbAreas] = useState<string[]>([]);
  const [dbCategories, setDbCategories] = useState<string[]>([]);
  const [dbCourses, setDbCourses] = useState<string[]>([]);

  const loadData = useCallback(async () => {
    const data = await loadInteressados();
    setRecords(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();

    // Load filter options from admin data
    Promise.all([
      supabase.from("trilha_areas").select("area_name").order("sort_order"),
      supabase.from("trilha_carreiras").select("carreira_name").order("sort_order"),
      supabase.from("trilha_cursos").select("curso_name").order("sort_order"),
    ]).then(([areasRes, carreirasRes, cursosRes]) => {
      setDbAreas([...new Set((areasRes.data || []).map((a) => a.area_name))].sort());
      setDbCategories([...new Set((carreirasRes.data || []).map((c) => c.carreira_name))].sort());
      setDbCourses([...new Set((cursosRes.data || []).map((c) => c.curso_name))].sort());
    });

    // Realtime subscription
    const channel = supabase
      .channel("interessados-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "interessados" }, () => {
        loadData();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [loadData]);

  const filterOptions = useMemo(() => ({
    areas: dbAreas,
    categories: dbCategories,
    courses: dbCourses,
  }), [dbAreas, dbCategories, dbCourses]);

  const hasActiveFilters = filterCourses.size > 0 || filterAreas.size > 0 || filterCategories.size > 0 || filterMentoria;

  const clearAllFilters = () => {
    setFilterCourses(new Set());
    setFilterAreas(new Set());
    setFilterCategories(new Set());
    setFilterMentoria(false);
  };

  const toggleSetItem = (set: Set<string>, item: string): Set<string> => {
    const next = new Set(set);
    if (next.has(item)) next.delete(item);
    else next.add(item);
    return next;
  };

  const filtered = useMemo(() => {
    const q = searchText.toLowerCase().trim();
    return records.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;

      const selectedAreas = (r.selected_areas || []) as { area: string; carreira: string; selectedCourses: string[] }[];

      if (filterMentoria && !r.mentoria_texto) return false;

      if (filterAreas.size > 0) {
        const hasArea = selectedAreas.some((a) => filterAreas.has(a.area));
        if (!hasArea) return false;
      }

      if (filterCategories.size > 0) {
        const hasCat = selectedAreas.some((a) => filterCategories.has(a.carreira));
        if (!hasCat) return false;
      }

      if (filterCourses.size > 0) {
        const hasCourse = selectedAreas.some((a) =>
          a.selectedCourses.some((key) => {
            const courseName = key.split("::")[2] || key;
            return filterCourses.has(courseName);
          })
        );
        if (!hasCourse) return false;
      }

      if (!q) return true;

      if ((r.nome || "").toLowerCase().includes(q)) return true;
      if ((r.codigo || "").toLowerCase().includes(q)) return true;
      if ((r.instrutor || "").toLowerCase().includes(q)) return true;

      for (const a of selectedAreas) {
        if (a.area.toLowerCase().includes(q)) return true;
        if (a.carreira.toLowerCase().includes(q)) return true;
        for (const c of a.selectedCourses) {
          if (c.toLowerCase().includes(q)) return true;
        }
      }

      const other = (r.other_courses || []) as string[];
      for (const c of other) {
        if (c.toLowerCase().includes(q)) return true;
      }

      if (r.created_at) {
        const dateStr = new Date(r.created_at).toLocaleDateString("pt-BR");
        if (dateStr.includes(q)) return true;
      }

      return false;
    });
  }, [records, searchText, statusFilter, filterCourses, filterAreas, filterCategories, filterMentoria]);

  // Reset page when filters change
  useEffect(() => { setCurrentPage(1); }, [searchText, statusFilter, filterCourses, filterAreas, filterCategories, filterMentoria]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginatedItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const toggleOpen = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleStatusChange = useCallback(
    async (id: string, status: string) => {
      await updateInteressadoStatus(id, status);
      setRecords((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status } : r))
      );
    },
    []
  );

  const handleExport = useCallback(() => {
    const rows: (string | null)[][] = [];
    rows.push(["Código", "Nome", "Instrutor", "Observação", "Status"]);

    for (const r of filtered) {
      const observations: string[] = [];
      if (Array.isArray(r.selected_areas)) {
        for (const a of r.selected_areas as { observation?: string }[]) {
          if (a.observation) observations.push(a.observation);
        }
      }
      if (r.mentoria_texto) observations.push(r.mentoria_texto);

      rows.push([
        r.codigo || "",
        r.nome || "",
        r.instrutor || "",
        observations.join("; ") || "",
        r.status || "Não Cadastrado",
      ]);
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(rows);
    const colWidths = [15, 30, 20, 50, 18];
    ws["!cols"] = colWidths.map((w) => ({ wch: w }));
    XLSX.utils.book_append_sheet(wb, ws, "Interessados");

    const now = new Date();
    const dateStr = now.toLocaleDateString("pt-BR").replace(/\//g, "-");
    XLSX.writeFile(wb, `Interessados_${dateStr}.xlsx`);
  }, [filtered]);

  const buildSummaryRows = (data: InteressadoRecord[]) => {
    const rows: (string | null)[][] = [];
    rows.push(["Código", "Nome", "Instrutor", "Status", "Formação (Categoria)"]);
    for (const r of data) {
      const categories: string[] = [];
      const areas = (r.selected_areas || []) as { area: string; carreira: string; selectedCourses: string[] }[];
      for (const a of areas) {
        if (a.selectedCourses.length > 0) categories.push(`${a.area} › ${a.carreira}`);
      }
      rows.push([r.codigo || "", r.nome || "", r.instrutor || "", r.status || "Não Cadastrado", categories.join("; ") || ""]);
    }
    return rows;
  };

  const handleSummaryDownload = useCallback(() => {
    const start = summaryStart ? new Date(summaryStart + "T00:00:00") : null;
    const end = summaryEnd ? new Date(summaryEnd + "T23:59:59") : null;

    const periodRecords = records.filter((r) => {
      const d = new Date(r.created_at);
      if (start && d < start) return false;
      if (end && d > end) return false;
      return true;
    });

    const rows = buildSummaryRows(periodRecords);
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = [15, 30, 20, 18, 50].map((w) => ({ wch: w }));
    XLSX.utils.book_append_sheet(wb, ws, "Resumo");

    const label = [
      summaryStart ? summaryStart.replace(/-/g, "") : "inicio",
      summaryEnd ? summaryEnd.replace(/-/g, "") : "fim",
    ].join("_");
    XLSX.writeFile(wb, `Resumo_Interessados_${label}.xlsx`);
    setSummaryOpen(false);
  }, [records, summaryStart, summaryEnd]);

  const handleFilteredSummaryDownload = useCallback(() => {
    const rows = buildSummaryRows(filtered);
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = [15, 30, 20, 18, 50].map((w) => ({ wch: w }));
    XLSX.utils.book_append_sheet(wb, ws, "Resumo");
    const now = new Date().toLocaleDateString("pt-BR").replace(/\//g, "-");
    XLSX.writeFile(wb, `Resumo_Filtrados_${now}.xlsx`);
    setSummaryOpen(false);
  }, [filtered]);

  const parseCourseKey = (key: string) => key.split("::")[2] || key;
  const parseOtherKey = (key: string) => {
    const parts = key.split("::");
    return { area: parts[0], curso: parts[1] };
  };

  const downloadIndividual = useCallback((r: InteressadoRecord) => {
    const wb = XLSX.utils.book_new();
    const rows: (string | null)[][] = [];

    const now = new Date();
    const dateStr = now.toLocaleDateString("pt-BR");
    const timeStr = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

    rows.push(["DADOS DO INTERESSADO"]);
    rows.push(["Código", r.codigo || ""]);
    rows.push(["Nome", r.nome || ""]);
    rows.push(["Idade", r.idade || ""]);
    rows.push(["Estudo/Carreira", r.estudo || ""]);
    if (r.responsavel) rows.push(["Responsável", r.responsavel]);
    rows.push(["Instrutor", r.instrutor || ""]);
    rows.push(["Data/Hora", `${dateStr} ${timeStr}`]);
    rows.push([]);

    const areas = (r.selected_areas || []) as { area: string; carreira: string; selectedCourses: string[]; observation?: string }[];
    const areasWithCourses = areas.filter(a => a.selectedCourses.length > 0);

    if (areasWithCourses.length > 0) {
      rows.push(["FORMAÇÕES SELECIONADAS"]);
      rows.push([]);

      for (const a of areasWithCourses) {
        rows.push([`Área: ${a.area}`, `Carreira: ${a.carreira}`, a.observation ? `Obs: ${a.observation}` : ""]);

        const coursesByFormacao = new Map<string, string[]>();
        for (const key of a.selectedCourses) {
          const parts = key.split("::");
          const formacao = parts[1];
          const curso = parts[2];
          if (!coursesByFormacao.has(formacao)) coursesByFormacao.set(formacao, []);
          coursesByFormacao.get(formacao)!.push(curso);
        }

        let maxCourses = 0;
        for (const cursos of coursesByFormacao.values()) {
          if (cursos.length > maxCourses) maxCourses = cursos.length;
        }

        const tableHeader: (string | null)[] = ["Formação"];
        for (let i = 1; i <= maxCourses; i++) tableHeader.push(`Curso ${i}`);
        rows.push(tableHeader);

        for (const [formacao, cursos] of coursesByFormacao) {
          rows.push([formacao, ...cursos]);
        }
        rows.push([]);
      }
    }

    const otherCourses = (r.other_courses || []) as string[];
    if (otherCourses.length > 0) {
      rows.push(["OUTROS CURSOS"]);
      const otherByArea = new Map<string, string[]>();
      for (const key of otherCourses) {
        const [area, curso] = key.split("::");
        if (!otherByArea.has(area)) otherByArea.set(area, []);
        otherByArea.get(area)!.push(curso);
      }
      for (const [area, cursos] of otherByArea) {
        rows.push([`Área: ${area}`, ...cursos]);
      }
      rows.push([]);
    }

    if (r.mentoria_texto) {
      rows.push(["MENTORIA / CONSULTORIA"]);
      rows.push([r.mentoria_texto]);
    }

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const colWidths: number[] = [];
    for (const row of rows) {
      for (let c = 0; c < row.length; c++) {
        const len = (row[c] || "").length + 2;
        if (!colWidths[c] || len > colWidths[c]) colWidths[c] = len;
      }
    }
    ws["!cols"] = colWidths.map(w => ({ wch: Math.min(w, 50) }));
    XLSX.utils.book_append_sheet(wb, ws, "Trilha");
    XLSX.writeFile(wb, `Trilha_${r.nome || "Aluno"}_${dateStr.replace(/\//g, "-")}.xlsx`);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 border-b bg-card/95 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between px-4 py-3 md:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/configurador")}
              className="rounded-full p-2 hover:bg-muted transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-foreground" />
            </button>
            <img src={logoSrc} alt="NovaMicroway" className="h-8 md:h-10 w-auto" />
            <h1 className="text-lg font-extrabold tracking-tight text-foreground md:text-xl">
              Interessados
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Popover open={summaryOpen} onOpenChange={setSummaryOpen}>
              <PopoverTrigger asChild>
                <Button size="sm" variant="outline" className="gap-1 h-8 text-xs">
                  <Calendar className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Baixar Resumo</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 space-y-3" align="end">
                <p className="text-sm font-semibold">Baixar Resumo</p>

                <Button size="sm" variant="outline" className="w-full h-8 text-xs" onClick={handleFilteredSummaryDownload}>
                  <Download className="h-3.5 w-3.5 mr-1" /> Baixar Filtrados ({filtered.length})
                </Button>

                <div className="border-t pt-3 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Por Período</p>
                  <div>
                    <label className="text-xs text-muted-foreground">Data Início</label>
                    <Input type="date" className="h-8 text-sm" value={summaryStart} onChange={e => setSummaryStart(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Data Fim</label>
                    <Input type="date" className="h-8 text-sm" value={summaryEnd} onChange={e => setSummaryEnd(e.target.value)} />
                  </div>
                </div>
                <Button size="sm" className="w-full h-8 text-xs" onClick={handleSummaryDownload}>
                  <Download className="h-3.5 w-3.5 mr-1" /> Baixar por Período
                </Button>
              </PopoverContent>
            </Popover>
            <Button
              size="sm"
              onClick={handleExport}
              className="gap-1 h-8 text-xs bg-accent text-accent-foreground hover:bg-accent/90"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Exportar Lista</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Filters bar */}
      <div className="sticky top-[57px] z-10 border-b bg-card/90 backdrop-blur-sm">
        <div className="container mx-auto flex items-center gap-3 px-4 py-2 md:px-8">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar nome, código, curso, área, data..."
              className="h-8 text-sm pl-8 pr-8"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            {searchText && (
              <button
                onClick={() => setSearchText("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <Popover open={filterOpen} onOpenChange={setFilterOpen}>
            <PopoverTrigger asChild>
              <Button size="sm" variant={hasActiveFilters ? "default" : "outline"} className="gap-1 h-8 text-xs relative">
                <Filter className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Filtros</span>
                {hasActiveFilters && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] text-destructive-foreground flex items-center justify-center font-bold">
                    {filterCourses.size + filterAreas.size + filterCategories.size + (filterMentoria ? 1 : 0)}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 max-h-[70vh] overflow-y-auto space-y-4 p-4" align="start">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Filtros Avançados</p>
                {hasActiveFilters && (
                  <button onClick={clearAllFilters} className="text-xs text-destructive hover:underline">
                    Limpar todos
                  </button>
                )}
              </div>

              {/* Mentoria filter */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Mentoria</p>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox checked={filterMentoria} onCheckedChange={(v) => setFilterMentoria(!!v)} />
                  <span className="text-sm">Com mentoria preenchida</span>
                </label>
              </div>

              {/* Areas filter */}
              {filterOptions.areas.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Área de Formação</p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {filterOptions.areas.map((area) => (
                      <label key={area} className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={filterAreas.has(area)}
                          onCheckedChange={() => setFilterAreas((prev) => toggleSetItem(prev, area))}
                        />
                        <span className="text-sm truncate">{area}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Categories filter */}
              {filterOptions.categories.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Categoria (Carreira)</p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {filterOptions.categories.map((cat) => (
                      <label key={cat} className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={filterCategories.has(cat)}
                          onCheckedChange={() => setFilterCategories((prev) => toggleSetItem(prev, cat))}
                        />
                        <span className="text-sm truncate">{cat}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Courses filter */}
              {filterOptions.courses.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Curso</p>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {filterOptions.courses.map((course) => (
                      <label key={course} className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={filterCourses.has(course)}
                          onCheckedChange={() => setFilterCourses((prev) => toggleSetItem(prev, course))}
                        />
                        <span className="text-sm truncate">{course}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </PopoverContent>
          </Popover>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="Não Cadastrado">Não Cadastrado</SelectItem>
              <SelectItem value="Cadastrado">Cadastrado</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {filtered.length} de {records.length}
          </span>
        </div>
      </div>

      <main className="container mx-auto px-4 py-6 md:px-8 space-y-3">
        {loading && (
          <p className="text-center text-sm text-muted-foreground py-12">
            Carregando interessados...
          </p>
        )}

        {!loading && records.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-12">
            Nenhum interessado salvo ainda.
          </p>
        )}

        {!loading && records.length > 0 && filtered.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-12">
            Nenhum resultado para os filtros aplicados.
          </p>
        )}

        {paginatedItems.map((r) => (
          <Collapsible
            key={r.id}
            open={openIds.has(r.id)}
            onOpenChange={() => toggleOpen(r.id)}
          >
            <div className="rounded-lg border bg-card shadow-sm">
              <div className="flex items-center gap-3 px-4 py-3">
                <CollapsibleTrigger className="flex flex-1 items-center gap-3">
                  <ChevronDown
                    className={`h-4 w-4 text-muted-foreground transition-transform ${
                      openIds.has(r.id) ? "rotate-180" : ""
                    }`}
                  />
                  <div className="text-left">
                    <span className="text-sm font-bold text-foreground">
                      {r.nome || "Sem nome"}
                    </span>
                    {r.codigo && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        #{r.codigo}
                      </span>
                    )}
                    <span className="ml-2 text-[10px] text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                </CollapsibleTrigger>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    title="Baixar Excel"
                    onClick={() => downloadIndividual(r)}
                  >
                    <Download className="h-4 w-4 text-muted-foreground" />
                  </Button>
                  <Select
                    value={r.status}
                    onValueChange={(v) => handleStatusChange(r.id, v)}
                  >
                    <SelectTrigger className="w-[160px] h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Não Cadastrado">Não Cadastrado</SelectItem>
                      <SelectItem value="Cadastrado">Cadastrado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <CollapsibleContent>
                <div className="border-t px-4 py-4 space-y-4">
                  <div className="grid grid-cols-2 gap-2 text-sm md:grid-cols-3">
                    {r.codigo && (
                      <div>
                        <span className="text-muted-foreground">Código:</span>{" "}
                        <span className="font-medium">{r.codigo}</span>
                      </div>
                    )}
                    {r.nome && (
                      <div>
                        <span className="text-muted-foreground">Nome:</span>{" "}
                        <span className="font-medium">{r.nome}</span>
                      </div>
                    )}
                    {r.idade && (
                      <div>
                        <span className="text-muted-foreground">Idade:</span>{" "}
                        <span className="font-medium">{r.idade}</span>
                      </div>
                    )}
                    {r.estudo && (
                      <div>
                        <span className="text-muted-foreground">Estudo:</span>{" "}
                        <span className="font-medium">{r.estudo}</span>
                      </div>
                    )}
                    {r.responsavel && (
                      <div>
                        <span className="text-muted-foreground">Responsável:</span>{" "}
                        <span className="font-medium">{r.responsavel}</span>
                      </div>
                    )}
                    {r.instrutor && (
                      <div>
                        <span className="text-muted-foreground">Instrutor:</span>{" "}
                        <span className="font-medium">{r.instrutor}</span>
                      </div>
                    )}
                  </div>

                  {Array.isArray(r.selected_areas) &&
                    (r.selected_areas as { area: string; carreira: string; selectedCourses: string[]; observation: string }[])
                      .filter((a) => a.selectedCourses.length > 0)
                      .map((a) => (
                        <div key={a.carreira} className="rounded-md border bg-muted/30 p-3">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">{a.area}</span>
                            <span className="text-muted-foreground text-xs">›</span>
                            <span className="text-sm text-muted-foreground">{a.carreira}</span>
                            <span className="ml-auto rounded-full bg-success/10 px-2 py-0.5 text-xs font-bold text-success">
                              {a.selectedCourses.length}
                            </span>
                          </div>
                          {a.observation && (
                            <p className="mt-1 text-xs italic text-muted-foreground">
                              Obs: {a.observation}
                            </p>
                          )}
                          <div className="mt-2 flex flex-wrap gap-1">
                            {a.selectedCourses.map((key: string) => (
                              <span
                                key={key}
                                className="rounded bg-success/10 px-2 py-0.5 text-xs text-success font-medium"
                              >
                                {parseCourseKey(key)}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}

                  {Array.isArray(r.other_courses) && r.other_courses.length > 0 && (
                    <div className="rounded-md border bg-muted/30 p-3">
                      <span className="font-semibold text-sm">Outros Cursos</span>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {(r.other_courses as string[]).map((key) => {
                          const { curso } = parseOtherKey(key);
                          return (
                            <span
                              key={key}
                              className="rounded bg-accent/10 px-2 py-0.5 text-xs text-accent font-medium"
                            >
                              {curso}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {r.mentoria_texto && (
                    <div className="rounded-md border bg-muted/30 p-3">
                      <span className="font-semibold text-sm">
                        Mentoria / Consultoria Especializada
                      </span>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {r.mentoria_texto}
                      </p>
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        ))}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4 pb-2">
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              Anterior
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                  if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("...");
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  p === "..." ? (
                    <span key={`e${i}`} className="px-1 text-xs text-muted-foreground">…</span>
                  ) : (
                    <Button
                      key={p}
                      size="sm"
                      variant={p === currentPage ? "default" : "outline"}
                      className="h-8 w-8 p-0 text-xs"
                      onClick={() => setCurrentPage(p as number)}
                    >
                      {p}
                    </Button>
                  )
                )}
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              Próximo
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
