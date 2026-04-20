import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, Download, Trash2, Search, FileText, Check, Pencil } from "lucide-react";
import type { InteressadoRecord } from "@/lib/saveInteressado";
import { generatePropostaPdf } from "@/lib/generatePropostaPdf";

interface Proposta {
  id: string;
  numero_proposta: number;
  interessado_id: string | null;
  codigo_interessado: string;
  nome_interessado: string;
  plano_selecionado: string;
  planos_data: PlanoData;
  created_at: string;
  updated_at: string;
}

interface PlanoData {
  premium?: string[];
  smart?: string[];
  classic?: string[];
  unique?: string[];
}

interface CursoItem {
  id: string;
  course_name: string;
  hours: number;
  area_id: string;
  tipo: string | null;
}

const PLANOS = [
  { key: "premium", label: "Plano Premium", maxHours: 120, color: "bg-amber-500/10 border-amber-500 text-amber-700" },
  { key: "smart", label: "Plano Smart", maxHours: 60, color: "bg-blue-500/10 border-blue-500 text-blue-700" },
  { key: "classic", label: "Plano Classic", maxHours: 40, color: "bg-emerald-500/10 border-emerald-500 text-emerald-700" },
  { key: "unique", label: "Plano Unique", maxHours: -1, color: "bg-purple-500/10 border-purple-500 text-purple-700" },
] as const;

export function PropostasTab() {
  const [propostas, setPropostas] = useState<Proposta[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingProposta, setEditingProposta] = useState<Proposta | null>(null);
  const [searchText, setSearchText] = useState("");

  const load = async () => {
    const { data } = await supabase
      .from("propostas")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setPropostas(data as unknown as Proposta[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel("admin-propostas")
      .on("postgres_changes", { event: "*", schema: "public", table: "propostas" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const filtered = useMemo(() => {
    const q = searchText.toLowerCase().trim();
    if (!q) return propostas;
    return propostas.filter(p =>
      p.nome_interessado.toLowerCase().includes(q) ||
      (p.codigo_interessado || "").toLowerCase().includes(q) ||
      String(p.numero_proposta).includes(q)
    );
  }, [propostas, searchText]);

  const handleDelete = async (id: string) => {
    await supabase.from("propostas").delete().eq("id", id);
    load();
    toast.success("Proposta excluída");
  };

  const handleDownload = async (p: Proposta) => {
    try {
      const planoItems = p.planos_data[p.plano_selecionado as keyof PlanoData] || [];
      // Fetch cursos_items to get tipo info
      const { data: ciData } = await supabase.from("cursos_items").select("course_name, tipo");
      const tipoMap: Record<string, string | null> = {};
      (ciData || []).forEach((ci: any) => { tipoMap[ci.course_name] = ci.tipo; });
      await generatePropostaPdf(p.nome_interessado, p.plano_selecionado, planoItems, undefined, tipoMap);
      toast.success("PDF gerado!");
    } catch (e) {
      toast.error("Erro ao gerar PDF");
      console.error(e);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar proposta por nome, código, nº..."
            className="pl-10 h-8 text-sm"
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
          />
        </div>
        <span className="text-xs text-muted-foreground">{filtered.length} propostas</span>
        <Button onClick={() => setShowCreate(true)} className="bg-accent text-accent-foreground hover:bg-accent/90 gap-1.5">
          <Plus className="h-4 w-4" /> Nova Proposta
        </Button>
      </div>

      {loading && <p className="text-sm text-muted-foreground py-8 text-center">Carregando...</p>}

      {!loading && filtered.length === 0 && (
        <p className="text-sm text-muted-foreground py-8 text-center">Nenhuma proposta encontrada.</p>
      )}

      <div className="space-y-2">
        {filtered.map((p) => (
          <div key={p.id} className="border rounded-lg bg-card p-3 flex items-center gap-3">
            <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">
                Proposta #{p.numero_proposta}
                {p.codigo_interessado && <span className="ml-2 text-xs text-muted-foreground font-normal">Cód: {p.codigo_interessado}</span>}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {p.nome_interessado}
                {p.plano_selecionado && ` · ${PLANOS.find(pl => pl.key === p.plano_selecionado)?.label || p.plano_selecionado}`}
                {" · Criado: "}{new Date(p.created_at).toLocaleDateString("pt-BR")}
                {p.updated_at && p.updated_at !== p.created_at && (
                  <> · Editado: {new Date(p.updated_at).toLocaleDateString("pt-BR")}{" "}{new Date(p.updated_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</>
                )}
              </p>
            </div>
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => setEditingProposta(p)}>
              <Pencil className="h-3 w-3" /> Editar
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => handleDownload(p)}>
              <Download className="h-3 w-3" /> Baixar
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 px-2 text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                  <AlertDialogDescription>Excluir proposta #{p.numero_proposta}?</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleDelete(p.id)} className="bg-destructive text-destructive-foreground">Excluir</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ))}
      </div>

      {showCreate && (
        <CreatePropostaDialog
          open={showCreate}
          onClose={() => { setShowCreate(false); load(); }}
        />
      )}

      {editingProposta && (
        <EditPropostaDialog
          open={!!editingProposta}
          proposta={editingProposta}
          onClose={() => { setEditingProposta(null); load(); }}
        />
      )}
    </div>
  );
}

/* ─── EDIT PROPOSTA DIALOG ─── */
function EditPropostaDialog({ open, proposta, onClose }: { open: boolean; proposta: Proposta; onClose: () => void }) {
  const [cursosItems, setCursosItems] = useState<CursoItem[]>([]);
  const [interessado, setInteressado] = useState<InteressadoRecord | null>(null);
  const [planoCursos, setPlanoCursos] = useState<PlanoData>(proposta.planos_data || { premium: [], smart: [], classic: [], unique: [] });
  const [activePlano, setActivePlano] = useState<string>(proposta.plano_selecionado || "premium");
  const [planoSelecionado, setPlanoSelecionado] = useState<string>(proposta.plano_selecionado || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("cursos_items").select("*").order("sort_order").then(({ data }) => {
      if (data) setCursosItems(data as unknown as CursoItem[]);
    });
    if (proposta.interessado_id) {
      supabase.from("interessados").select("*").eq("id", proposta.interessado_id).single().then(({ data }) => {
        if (data) setInteressado(data as unknown as InteressadoRecord);
      });
    }
  }, [proposta]);

  const interessadoCursos = useMemo(() => {
    if (!interessado) return { cursos: [] as string[], mentorias: [] as string[], outros: [] as string[], areaMap: [] as { area: string; courses: string[] }[] };
    return buildInteressadoCursos(interessado);
  }, [interessado]);

  const allItems = useMemo(() => buildAllItems(interessadoCursos), [interessadoCursos]);

  const getPlanoHours = (planoKey: string) => {
    const courses = planoCursos[planoKey as keyof PlanoData] || [];
    return courses.reduce((sum, courseName) => {
      const item = cursosItems.find(ci => ci.course_name === courseName);
      return sum + (item?.hours || 0);
    }, 0);
  };

  const addCourseToPlan = (courseName: string) => {
    addCourseToPlanHelper(courseName, activePlano, planoCursos, setPlanoCursos, cursosItems, getPlanoHours);
  };

  const removeFromPlan = (planoKey: string, courseName: string) => {
    setPlanoCursos(prev => ({
      ...prev,
      [planoKey]: (prev[planoKey as keyof PlanoData] || []).filter(c => c !== courseName),
    }));
  };

  const handleSave = async () => {
    if (!planoSelecionado) { toast.error("Selecione um plano"); return; }
    setSaving(true);
    try {
      await supabase.from("propostas").update({
        plano_selecionado: planoSelecionado,
        planos_data: planoCursos as any,
      } as any).eq("id", proposta.id);
      toast.success("Proposta atualizada!");
      onClose();
    } catch {
      toast.error("Erro ao atualizar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Proposta #{proposta.numero_proposta}</DialogTitle>
        </DialogHeader>
        <PlanEditorContent
          interessado={interessado}
          interessadoCursos={interessadoCursos}
          allItems={allItems}
          planoCursos={planoCursos}
          activePlano={activePlano}
          setActivePlano={setActivePlano}
          planoSelecionado={planoSelecionado}
          setPlanoSelecionado={setPlanoSelecionado}
          addCourseToPlan={addCourseToPlan}
          removeFromPlan={removeFromPlan}
          getPlanoHours={getPlanoHours}
          cursosItems={cursosItems}
        />
        <div className="flex gap-2 justify-end border-t pt-4">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>Salvar Alterações</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ─── CREATE PROPOSTA DIALOG ─── */
function CreatePropostaDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState<"search" | "edit">("search");
  const [searchText, setSearchText] = useState("");
  const [interessados, setInteressados] = useState<InteressadoRecord[]>([]);
  const [selected, setSelected] = useState<InteressadoRecord | null>(null);
  const [cursosItems, setCursosItems] = useState<CursoItem[]>([]);

  const [planoCursos, setPlanoCursos] = useState<PlanoData>({ premium: [], smart: [], classic: [], unique: [] });
  const [activePlano, setActivePlano] = useState<string>("premium");
  const [planoSelecionado, setPlanoSelecionado] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("interessados").select("*").order("nome").then(({ data }) => {
      if (data) setInteressados(data as unknown as InteressadoRecord[]);
    });
    supabase.from("cursos_items").select("*").order("sort_order").then(({ data }) => {
      if (data) setCursosItems(data as unknown as CursoItem[]);
    });
  }, []);

  const filteredInteressados = useMemo(() => {
    const q = searchText.toLowerCase().trim();
    if (!q) return interessados.slice(0, 10);
    return interessados.filter(i =>
      (i.codigo || "").toLowerCase().includes(q) || (i.nome || "").toLowerCase().includes(q)
    ).slice(0, 10);
  }, [interessados, searchText]);

  const selectInteressado = (i: InteressadoRecord) => {
    setSelected(i);
    setStep("edit");
  };

  const interessadoCursos = useMemo(() => {
    if (!selected) return { cursos: [] as string[], mentorias: [] as string[], outros: [] as string[], areaMap: [] as { area: string; courses: string[] }[] };
    return buildInteressadoCursos(selected);
  }, [selected]);

  const allItems = useMemo(() => buildAllItems(interessadoCursos), [interessadoCursos]);

  const getPlanoHours = (planoKey: string) => {
    const courses = planoCursos[planoKey as keyof PlanoData] || [];
    return courses.reduce((sum, courseName) => {
      const item = cursosItems.find(ci => ci.course_name === courseName);
      return sum + (item?.hours || 0);
    }, 0);
  };

  const addCourseToPlan = (courseName: string) => {
    addCourseToPlanHelper(courseName, activePlano, planoCursos, setPlanoCursos, cursosItems, getPlanoHours);
  };

  const removeFromPlan = (planoKey: string, courseName: string) => {
    setPlanoCursos(prev => ({
      ...prev,
      [planoKey]: (prev[planoKey as keyof PlanoData] || []).filter(c => c !== courseName),
    }));
  };

  const handleSave = async () => {
    if (!selected) return;
    if (!planoSelecionado) { toast.error("Selecione um plano para a proposta"); return; }
    const planoItems = planoCursos[planoSelecionado as keyof PlanoData] || [];
    if (planoItems.length === 0) { toast.error("Adicione pelo menos um curso ao plano selecionado"); return; }

    setSaving(true);
    try {
      await supabase.from("propostas").insert({
        interessado_id: selected.id,
        codigo_interessado: selected.codigo || "",
        nome_interessado: selected.nome,
        plano_selecionado: planoSelecionado,
        planos_data: planoCursos as any,
      } as any);
      toast.success("Proposta criada!");
      onClose();
    } catch {
      toast.error("Erro ao salvar proposta");
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadAndSave = async () => {
    if (!selected || !planoSelecionado) { toast.error("Selecione um plano"); return; }
    const planoItems = planoCursos[planoSelecionado as keyof PlanoData] || [];
    if (planoItems.length === 0) { toast.error("Adicione cursos ao plano"); return; }

    setSaving(true);
    try {
      await supabase.from("propostas").insert({
        interessado_id: selected.id,
        codigo_interessado: selected.codigo || "",
        nome_interessado: selected.nome,
        plano_selecionado: planoSelecionado,
        planos_data: planoCursos as any,
      } as any);
      // Extract area names for PDF checkboxes
      const areaNames = interessadoCursos.areaMap.map(a => a.area);
      // Build tipo map from cursosItems
      const tipoMap: Record<string, string | null> = {};
      cursosItems.forEach(ci => { tipoMap[ci.course_name] = ci.tipo; });
      await generatePropostaPdf(selected.nome, planoSelecionado, planoItems, areaNames, tipoMap);
      toast.success("Proposta salva e PDF gerado!");
      onClose();
    } catch (e) {
      toast.error("Erro ao gerar proposta");
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Proposta</DialogTitle>
        </DialogHeader>

        {step === "search" && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por código ou nome do interessado..."
                className="pl-10"
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {filteredInteressados.map(i => (
                <button
                  key={i.id}
                  onClick={() => selectInteressado(i)}
                  className="w-full text-left p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <p className="text-sm font-medium">{i.nome}</p>
                  <p className="text-xs text-muted-foreground">
                    {i.codigo && `#${i.codigo} · `}{i.instrutor && `Instrutor: ${i.instrutor}`}
                  </p>
                </button>
              ))}
              {filteredInteressados.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum interessado encontrado</p>
              )}
            </div>
          </div>
        )}

        {step === "edit" && selected && (
          <div className="space-y-6">
            <ResumoInteressado interessado={selected} interessadoCursos={interessadoCursos} />
            <PlanEditorContent
              interessado={selected}
              interessadoCursos={interessadoCursos}
              allItems={allItems}
              planoCursos={planoCursos}
              activePlano={activePlano}
              setActivePlano={setActivePlano}
              planoSelecionado={planoSelecionado}
              setPlanoSelecionado={setPlanoSelecionado}
              addCourseToPlan={addCourseToPlan}
              removeFromPlan={removeFromPlan}
              getPlanoHours={getPlanoHours}
              cursosItems={cursosItems}
            />
            <div className="flex gap-2 justify-end border-t pt-4">
              <Button variant="outline" onClick={onClose}>Cancelar</Button>
              <Button onClick={handleSave} disabled={saving}>
                Salvar Proposta
              </Button>
              <Button
                onClick={handleDownloadAndSave}
                disabled={saving || !planoSelecionado}
                className="bg-accent text-accent-foreground hover:bg-accent/90 gap-1.5"
              >
                <Download className="h-4 w-4" /> Baixar Proposta
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ─── SHARED: Resumo do Interessado ─── */
function ResumoInteressado({ interessado, interessadoCursos }: {
  interessado: InteressadoRecord;
  interessadoCursos: ReturnType<typeof buildInteressadoCursos>;
}) {
  return (
    <div className="rounded-lg border bg-muted/30 p-4">
      <h4 className="font-semibold text-sm mb-2">Resumo do Interessado</h4>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <p><span className="text-muted-foreground">Nome:</span> {interessado.nome}</p>
        <p><span className="text-muted-foreground">Código:</span> {interessado.codigo || "—"}</p>
        <p><span className="text-muted-foreground">Instrutor:</span> {interessado.instrutor || "—"}</p>
        <p><span className="text-muted-foreground">Status:</span> {interessado.status}</p>
      </div>

      {/* Cursos organizados por Área */}
      {interessadoCursos.areaMap.length > 0 && (
        <div className="mt-3 space-y-2">
          {interessadoCursos.areaMap.map((group, i) => (
            <div key={i}>
              <p className="text-xs font-semibold text-primary">
                Área: {group.area}
              </p>
              <p className="text-xs text-muted-foreground ml-2">
                Cursos: {group.courses.join(", ")}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Outros Cursos */}
      {interessadoCursos.outros.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-semibold text-secondary-foreground">Outros Cursos:</p>
          <div className="flex flex-wrap gap-1 mt-1">
            {interessadoCursos.outros.map((c, i) => (
              <span key={i} className="text-[10px] bg-secondary/50 text-secondary-foreground px-1.5 py-0.5 rounded">{c}</span>
            ))}
          </div>
        </div>
      )}

      {/* Mentoria */}
      {interessadoCursos.mentorias.length > 0 && (
        <div className="mt-2">
          <p className="text-xs text-muted-foreground mb-1">Mentoria:</p>
          <span className="text-[10px] bg-accent/20 text-accent-foreground px-1.5 py-0.5 rounded">{interessadoCursos.mentorias[0]}</span>
        </div>
      )}
    </div>
  );
}

/* ─── SHARED: Plan Editor ─── */
function PlanEditorContent({
  interessado,
  interessadoCursos,
  allItems,
  planoCursos,
  activePlano,
  setActivePlano,
  planoSelecionado,
  setPlanoSelecionado,
  addCourseToPlan,
  removeFromPlan,
  getPlanoHours,
  cursosItems,
}: {
  interessado: InteressadoRecord | null;
  interessadoCursos: ReturnType<typeof buildInteressadoCursos>;
  allItems: string[];
  planoCursos: PlanoData;
  activePlano: string;
  setActivePlano: (p: string) => void;
  planoSelecionado: string;
  setPlanoSelecionado: (p: string) => void;
  addCourseToPlan: (c: string) => void;
  removeFromPlan: (plano: string, c: string) => void;
  getPlanoHours: (p: string) => number;
  cursosItems: CursoItem[];
}) {
  return (
    <>
      {/* 4 Planos */}
      <div>
        <h4 className="font-semibold text-sm mb-3">Planos</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {PLANOS.map(plano => {
            const items = planoCursos[plano.key as keyof PlanoData] || [];
            const hours = getPlanoHours(plano.key);
            const isActive = activePlano === plano.key;
            const isSelected = planoSelecionado === plano.key;

            return (
              <div
                key={plano.key}
                className={`relative border-2 rounded-lg p-3 cursor-pointer transition-all ${plano.color} ${isActive ? "ring-2 ring-primary shadow-md" : "opacity-80 hover:opacity-100"}`}
                onClick={() => setActivePlano(plano.key)}
              >
                <button
                  className={`absolute top-1 right-1 h-5 w-5 rounded-full border-2 flex items-center justify-center text-[10px] transition-all ${isSelected ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/40 hover:border-primary"}`}
                  onClick={(e) => { e.stopPropagation(); setPlanoSelecionado(isSelected ? "" : plano.key); }}
                  title="Selecionar para proposta"
                >
                  {isSelected && <Check className="h-3 w-3" />}
                </button>

                <p className="font-bold text-xs mb-1">{plano.label}</p>
                <p className="text-[10px] mb-2">
                  {plano.key === "unique" ? "1 curso/mentoria" : `${hours}h / ${plano.maxHours}h`}
                </p>
                <div className="space-y-1 min-h-[40px]">
                  {items.map((item, i) => (
                    <div key={i} className="flex items-center gap-1 text-[10px] bg-background/60 rounded px-1.5 py-0.5">
                      <span className="flex-1 truncate">{item}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); removeFromPlan(plano.key, item); }}
                        className="text-destructive hover:text-destructive/80 shrink-0"
                      >×</button>
                    </div>
                  ))}
                  {items.length === 0 && (
                    <p className="text-[10px] opacity-50 italic">Clique abaixo para adicionar</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Checklist de cursos para adicionar */}
      <div>
        <h4 className="font-semibold text-sm mb-2">
          Cursos do Interessado
          <span className="font-normal text-muted-foreground ml-2 text-xs">
            (clique para adicionar ao <strong>{PLANOS.find(p => p.key === activePlano)?.label}</strong>)
          </span>
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5">
          {allItems.map((item, i) => {
            const isInActive = (planoCursos[activePlano as keyof PlanoData] || []).includes(item);
            const isInAnyPlan = Object.values(planoCursos).some(arr => arr?.includes(item));

            return (
              <button
                key={i}
                onClick={() => addCourseToPlan(item)}
                className={`text-left text-xs p-2 rounded border transition-all ${isInActive ? "bg-primary/10 border-primary text-primary font-medium" : isInAnyPlan ? "bg-muted/50 border-muted text-muted-foreground" : "hover:bg-muted/50 border-transparent"}`}
              >
                <span className="flex items-center gap-1.5">
                  <Checkbox checked={isInActive} className="h-3 w-3 pointer-events-none" />
                  {item}
                </span>
              </button>
            );
          })}
          {allItems.length === 0 && (
            <p className="col-span-full text-xs text-muted-foreground text-center py-4">
              Nenhum curso cadastrado para este interessado
            </p>
          )}
        </div>
      </div>
    </>
  );
}

/* ─── HELPERS ─── */
function buildInteressadoCursos(selected: InteressadoRecord) {
  const cursos: string[] = [];
  const areaMap: { area: string; courses: string[] }[] = [];
  const areas = selected.selected_areas || [];

  for (const a of areas) {
    const courseNames: string[] = [];
    for (const c of a.selectedCourses || []) {
      // Format is "carreira::formação::curso" — extract just the course name
      const parts = c.split("::");
      const cleanName = parts.length >= 3 ? parts[parts.length - 1] : (c.split(" > ").pop() || c);
      cursos.push(cleanName);
      courseNames.push(cleanName);
    }
    if (courseNames.length > 0) {
      areaMap.push({ area: a.area, courses: courseNames });
    }
  }

  const outros = selected.other_courses || [];
  const mentoria = selected.mentoria_texto ? [selected.mentoria_texto] : [];

  return { cursos, mentorias: mentoria, outros, areaMap };
}

function buildAllItems(interessadoCursos: ReturnType<typeof buildInteressadoCursos>) {
  const items: string[] = [...interessadoCursos.cursos, ...interessadoCursos.outros];
  if (interessadoCursos.mentorias.length > 0) {
    items.push(`Mentoria: ${interessadoCursos.mentorias[0]}`);
  }
  return items;
}

function addCourseToPlanHelper(
  courseName: string,
  activePlano: string,
  planoCursos: PlanoData,
  setPlanoCursos: React.Dispatch<React.SetStateAction<PlanoData>>,
  cursosItems: CursoItem[],
  getPlanoHours: (p: string) => number
) {
  const plano = PLANOS.find(p => p.key === activePlano);
  if (!plano) return;

  const current = planoCursos[activePlano as keyof PlanoData] || [];
  if (current.includes(courseName)) {
    setPlanoCursos(prev => ({ ...prev, [activePlano]: current.filter(c => c !== courseName) }));
    return;
  }

  if (plano.key === "unique" && current.length >= 1) {
    toast.error("Plano Unique permite apenas 1 item");
    return;
  }

  const item = cursosItems.find(ci => ci.course_name === courseName);
  const courseHours = item?.hours || 0;
  if (plano.maxHours > 0) {
    const currentHours = getPlanoHours(activePlano);
    if (currentHours + courseHours > plano.maxHours) {
      toast.error(`Limite de ${plano.maxHours}h excedido`);
      return;
    }
  }

  setPlanoCursos(prev => ({ ...prev, [activePlano]: [...current, courseName] }));
}
