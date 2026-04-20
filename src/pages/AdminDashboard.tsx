import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { ChevronDown, Plus, Trash2, LogOut, Pencil, Check, X, Upload, Eye, GripVertical, FileText } from "lucide-react";
import { PropostasTab } from "@/components/admin/PropostasTab";
import {
  loadInteressados,
  updateInteressadoStatus,
  type InteressadoRecord,
} from "@/lib/saveInteressado";

const FORMACAO_LABELS = ["Ponto de Partida", "Formação Completa", "Formação Continuada", "Formação Alternativa", "Nível Especialista"];

interface TrilhaArea { id: string; area_name: string; category_name: string; sort_order: number; }
interface TrilhaCarreira { id: string; area_id: string; carreira_name: string; sort_order: number; }
interface TrilhaCurso { id: string; carreira_id: string; formacao_index: number; curso_name: string; sort_order: number; }
interface CursosArea { id: string; area_name: string; sort_order: number; }
interface CursosItem { id: string; area_id: string; course_name: string; sort_order: number; hours: number; tipo: string | null; }

const AdminDashboard = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (sessionStorage.getItem("adm_auth") !== "1") navigate("/admin/login");
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">Painel Administrativo</h1>
          <Button variant="ghost" size="sm" onClick={() => { sessionStorage.removeItem("adm_auth"); navigate("/admin/login"); }}>
            <LogOut className="h-4 w-4 mr-1" /> Sair
          </Button>
        </div>
        <Tabs defaultValue="trilhas">
          <TabsList className="mb-4">
            <TabsTrigger value="trilhas">Trilhas</TabsTrigger>
            <TabsTrigger value="cursos">Cursos</TabsTrigger>
            <TabsTrigger value="campanha">Campanha</TabsTrigger>
            <TabsTrigger value="interessados">Interessados</TabsTrigger>
            <TabsTrigger value="propostas">Propostas</TabsTrigger>
          </TabsList>
          <TabsContent value="trilhas"><TrilhasTab /></TabsContent>
          <TabsContent value="cursos"><CursosTab /></TabsContent>
          <TabsContent value="campanha"><CampanhaTab /></TabsContent>
          <TabsContent value="interessados"><InteressadosTab /></TabsContent>
          <TabsContent value="propostas"><PropostasTab /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

/* ─── INLINE EDIT HELPER ─── */
function InlineEdit({ value, onSave, className }: { value: string; onSave: (v: string) => void; className?: string }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const save = () => {
    if (draft.trim() && draft.trim() !== value) {
      onSave(draft.trim());
    }
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="inline-flex items-center gap-1">
        <Input
          className="h-6 text-xs w-40"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") save(); if (e.key === "Escape") setEditing(false); }}
          autoFocus
        />
        <Button variant="ghost" size="sm" className="h-5 w-5 p-0 text-success" onClick={save}><Check className="h-3 w-3" /></Button>
        <Button variant="ghost" size="sm" className="h-5 w-5 p-0 text-muted-foreground" onClick={() => setEditing(false)}><X className="h-3 w-3" /></Button>
      </div>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 group ${className || ""}`}>
      {value}
      <button onClick={() => { setDraft(value); setEditing(true); }} className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground">
        <Pencil className="h-3 w-3" />
      </button>
    </span>
  );
}

function InlineHoursEdit({ hours, onSave }: { hours: number; onSave: (h: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(hours));

  const save = () => {
    const val = parseInt(draft) || 0;
    if (val !== hours) onSave(val);
    setEditing(false);
  };

  if (editing) {
    return (
      <span className="inline-flex items-center gap-0.5">
        <Input
          className="h-5 text-[10px] w-12 px-1"
          type="number"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") save(); if (e.key === "Escape") setEditing(false); }}
          autoFocus
        />
        <Button variant="ghost" size="sm" className="h-4 w-4 p-0 text-success" onClick={save}><Check className="h-2.5 w-2.5" /></Button>
      </span>
    );
  }

  return (
    <button onClick={() => { setDraft(String(hours)); setEditing(true); }} className="text-muted-foreground hover:text-foreground">
      <Pencil className="h-2.5 w-2.5" />
    </button>
  );
}
function TrilhasTab() {
  const [areas, setAreas] = useState<TrilhaArea[]>([]);
  const [carreiras, setCarreiras] = useState<TrilhaCarreira[]>([]);
  const [cursos, setCursos] = useState<TrilhaCurso[]>([]);
  const [cursosItems, setCursosItems] = useState<CursosItem[]>([]);
  const [cursosAreas, setCursosAreas] = useState<CursosArea[]>([]);
  const [newArea, setNewArea] = useState("");
  const [newCarreira, setNewCarreira] = useState<Record<string, string>>({});

  // Edit carreira dialog state
  const [editCarrId, setEditCarrId] = useState<string | null>(null);
  const [editCarrName, setEditCarrName] = useState("");
  const [editCursoId, setEditCursoId] = useState<string>("");
  const [editFormacao, setEditFormacao] = useState<string>("");

  const load = async () => {
    const [a, c, cu, ci, ca] = await Promise.all([
      supabase.from("trilha_areas").select("*").order("sort_order"),
      supabase.from("trilha_carreiras").select("*").order("sort_order"),
      supabase.from("trilha_cursos").select("*").order("sort_order"),
      supabase.from("cursos_items").select("*").order("sort_order"),
      supabase.from("cursos_areas").select("*").order("sort_order"),
    ]);
    if (a.data) setAreas(a.data);
    if (c.data) setCarreiras(c.data);
    if (cu.data) setCursos(cu.data);
    if (ci.data) setCursosItems(ci.data as unknown as CursosItem[]);
    if (ca.data) setCursosAreas(ca.data);
  };

  useEffect(() => { load(); }, []);

  const addArea = async () => {
    if (!newArea.trim()) return;
    await supabase.from("trilha_areas").insert({ area_name: newArea.trim(), category_name: newArea.trim(), sort_order: areas.length });
    setNewArea("");
    load(); toast.success("Área adicionada");
  };

  const deleteArea = async (id: string) => {
    await supabase.from("trilha_areas").delete().eq("id", id);
    load(); toast.success("Área excluída");
  };

  const renameArea = async (id: string, newName: string) => {
    await supabase.from("trilha_areas").update({ area_name: newName }).eq("id", id);
    load(); toast.success("Área renomeada");
  };

  const addCarreira = async (areaId: string) => {
    const name = newCarreira[areaId]?.trim();
    if (!name) return;
    const count = carreiras.filter(c => c.area_id === areaId).length;
    await supabase.from("trilha_carreiras").insert({ area_id: areaId, carreira_name: name, sort_order: count });
    setNewCarreira(p => ({ ...p, [areaId]: "" }));
    load(); toast.success("Carreira adicionada");
  };

  const deleteCarreira = async (id: string) => {
    await supabase.from("trilha_carreiras").delete().eq("id", id);
    load(); toast.success("Carreira excluída");
  };

  const renameCarreira = async (id: string, newName: string) => {
    await supabase.from("trilha_carreiras").update({ carreira_name: newName }).eq("id", id);
    load();
  };

  const deleteCurso = async (id: string) => {
    await supabase.from("trilha_cursos").delete().eq("id", id);
    load(); toast.success("Curso excluído");
  };

  const openEditCarreira = (c: TrilhaCarreira) => {
    setEditCarrId(c.id);
    setEditCarrName(c.carreira_name);
    setEditCursoId("");
    setEditFormacao("");
  };

  const closeEditCarreira = () => {
    setEditCarrId(null);
  };

  const saveEditCarreira = async () => {
    if (!editCarrId) return;
    const original = carreiras.find(c => c.id === editCarrId);
    if (editCarrName.trim() && original && editCarrName.trim() !== original.carreira_name) {
      await renameCarreira(editCarrId, editCarrName.trim());
      toast.success("Carreira renomeada");
    }
    closeEditCarreira();
  };

  const addCursoFromCatalog = async () => {
    if (!editCarrId || !editCursoId || editFormacao === "") {
      toast.error("Selecione curso e formação");
      return;
    }
    const item = cursosItems.find(i => i.id === editCursoId);
    if (!item) return;
    const fi = parseInt(editFormacao);
    const count = cursos.filter(c => c.carreira_id === editCarrId && c.formacao_index === fi).length;
    await supabase.from("trilha_cursos").insert({
      carreira_id: editCarrId, formacao_index: fi, curso_name: item.course_name, sort_order: count,
    });
    setEditCursoId(""); setEditFormacao("");
    load(); toast.success("Curso adicionado");
  };

  const editingCarr = editCarrId ? carreiras.find(c => c.id === editCarrId) : null;
  const editingCarrCursos = editCarrId ? cursos.filter(c => c.carreira_id === editCarrId) : [];

  return (
    <div className="space-y-4">
      {areas.map(area => (
        <Collapsible key={area.id} className="border rounded-lg bg-card">
          <div className="flex items-center justify-between p-3">
            <CollapsibleTrigger className="flex items-center gap-2 flex-1 text-left">
              <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
            </CollapsibleTrigger>
            <div className="flex items-center gap-2 flex-1">
              <InlineEdit value={area.area_name} onSave={(v) => renameArea(area.id, v)} className="font-semibold text-sm" />
            </div>
            <DeleteButton label={area.area_name} onConfirm={() => deleteArea(area.id)} />
          </div>
          <CollapsibleContent className="px-3 pb-3">
            {carreiras.filter(c => c.area_id === area.id).map(carr => (
              <Collapsible key={carr.id} className="ml-4 border-l-2 border-muted pl-3 mb-3">
                <div className="flex items-center justify-between gap-1">
                  <CollapsibleTrigger className="flex items-center gap-1">
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                  </CollapsibleTrigger>
                  <div className="flex-1 ml-1">
                    <span className="text-sm font-medium">{carr.carreira_name}</span>
                  </div>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground" onClick={() => openEditCarreira(carr)}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <DeleteButton label={carr.carreira_name} onConfirm={() => deleteCarreira(carr.id)} />
                </div>
                <CollapsibleContent className="mt-2 space-y-2">
                  {FORMACAO_LABELS.map((label, fi) => {
                    const items = cursos.filter(c => c.carreira_id === carr.id && c.formacao_index === fi);
                    if (items.length === 0) return null;
                    return (
                      <div key={fi} className="ml-2">
                        <p className="text-xs font-semibold text-muted-foreground mb-1">{label}</p>
                        <div className="flex flex-wrap gap-1 mb-1">
                          {items.map(c => (
                            <span key={c.id} className="inline-flex items-center gap-1 bg-muted text-xs px-2 py-0.5 rounded">
                              {c.curso_name}
                              <DeleteButton label={c.curso_name} onConfirm={() => deleteCurso(c.id)} iconOnly />
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </CollapsibleContent>
              </Collapsible>
            ))}
            <div className="flex gap-2 ml-4 mt-2">
              <Input
                className="h-8 text-xs flex-1"
                placeholder="Nova carreira..."
                value={newCarreira[area.id] || ""}
                onChange={e => setNewCarreira(p => ({ ...p, [area.id]: e.target.value }))}
                onKeyDown={e => e.key === "Enter" && addCarreira(area.id)}
              />
              <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => addCarreira(area.id)}>
                <Plus className="h-3 w-3 mr-1" /> Carreira
              </Button>
            </div>
          </CollapsibleContent>
        </Collapsible>
      ))}
      <div className="flex gap-2 items-end border-t pt-4">
        <div className="flex-1 space-y-1">
          <label className="text-xs font-medium">Nova Área</label>
          <Input className="h-8 text-sm" value={newArea} onChange={e => setNewArea(e.target.value)} placeholder="Nome da área" onKeyDown={e => e.key === "Enter" && addArea()} />
        </div>
        <Button size="sm" className="h-8" onClick={addArea}><Plus className="h-3 w-3 mr-1" /> Área</Button>
      </div>

      {/* Edit Carreira Dialog */}
      <Dialog open={!!editCarrId} onOpenChange={(o) => !o && closeEditCarreira()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Carreira</DialogTitle>
            <DialogDescription>Renomeie a carreira ou adicione cursos cadastrados na aba Cursos.</DialogDescription>
          </DialogHeader>
          {editingCarr && (
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium">Nome da Carreira</label>
                <Input value={editCarrName} onChange={e => setEditCarrName(e.target.value)} />
              </div>

              <div className="border-t pt-3 space-y-2">
                <h4 className="text-sm font-semibold">Adicionar curso à carreira</h4>
                <div className="flex gap-2 items-center">
                  <Select value={editCursoId} onValueChange={setEditCursoId}>
                    <SelectTrigger className="flex-1 h-9 text-sm">
                      <SelectValue placeholder="Selecione um curso cadastrado..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      {cursosAreas.map(area => {
                        const areaItems = cursosItems.filter(i => i.area_id === area.id);
                        if (areaItems.length === 0) return null;
                        return (
                          <div key={area.id}>
                            <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase">{area.area_name}</div>
                            {areaItems.map(it => (
                              <SelectItem key={it.id} value={it.id}>
                                {it.course_name}{it.tipo ? ` (${it.tipo})` : ""}
                              </SelectItem>
                            ))}
                          </div>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <Select value={editFormacao} onValueChange={setEditFormacao}>
                    <SelectTrigger className="w-48 h-9 text-sm">
                      <SelectValue placeholder="Formação..." />
                    </SelectTrigger>
                    <SelectContent>
                      {FORMACAO_LABELS.map((label, i) => (
                        <SelectItem key={i} value={String(i)}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button size="sm" onClick={addCursoFromCatalog}><Plus className="h-3 w-3 mr-1" /> Add</Button>
                </div>
              </div>

              <div className="border-t pt-3 space-y-2">
                <h4 className="text-sm font-semibold">Cursos atuais</h4>
                {FORMACAO_LABELS.map((label, fi) => {
                  const items = editingCarrCursos.filter(c => c.formacao_index === fi);
                  if (items.length === 0) return null;
                  return (
                    <div key={fi}>
                      <p className="text-xs font-semibold text-muted-foreground mb-1">{label}</p>
                      <div className="flex flex-wrap gap-1">
                        {items.map(c => (
                          <span key={c.id} className="inline-flex items-center gap-1 bg-muted text-xs px-2 py-0.5 rounded">
                            {c.curso_name}
                            <DeleteButton label={c.curso_name} onConfirm={() => deleteCurso(c.id)} iconOnly />
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
                {editingCarrCursos.length === 0 && (
                  <p className="text-xs text-muted-foreground italic">Nenhum curso cadastrado nesta carreira.</p>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={closeEditCarreira}>Fechar</Button>
            <Button onClick={saveEditCarreira}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ─── CURSOS TAB ─── */
function CursosTab() {
  const [areas, setAreas] = useState<CursosArea[]>([]);
  const [items, setItems] = useState<CursosItem[]>([]);
  const [newCourse, setNewCourse] = useState("");
  const [newHours, setNewHours] = useState("");
  const [selectedAreas, setSelectedAreas] = useState<Set<string>>(new Set());
  const [newAreaName, setNewAreaName] = useState("");
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  const load = async () => {
    const [a, i] = await Promise.all([
      supabase.from("cursos_areas").select("*").order("sort_order"),
      supabase.from("cursos_items").select("*").order("sort_order"),
    ]);
    if (a.data) setAreas(a.data);
    if (i.data) setItems(i.data as unknown as CursosItem[]);
  };

  useEffect(() => { load(); }, []);

  const addCourse = async () => {
    if (!newCourse.trim() || selectedAreas.size === 0) {
      toast.error("Preencha o nome e selecione ao menos uma área");
      return;
    }
    const hours = parseInt(newHours) || 0;
    for (const areaId of selectedAreas) {
      const count = items.filter(i => i.area_id === areaId).length;
      await supabase.from("cursos_items").insert({ area_id: areaId, course_name: newCourse.trim(), sort_order: count, hours, tipo: null } as any);
    }
    setNewCourse(""); setNewHours(""); setSelectedAreas(new Set());
    load(); toast.success("Curso adicionado");
  };

  const deleteCourse = async (id: string) => {
    await supabase.from("cursos_items").delete().eq("id", id);
    load(); toast.success("Curso excluído");
  };

  const updateHours = async (id: string, hours: number) => {
    await supabase.from("cursos_items").update({ hours } as any).eq("id", id);
    load(); toast.success("Horas atualizadas");
  };

  const updateTipo = async (id: string, tipo: string | null) => {
    await supabase.from("cursos_items").update({ tipo } as any).eq("id", id);
    load(); toast.success("Tipo atualizado");
  };

  const renameCourse = async (id: string, newName: string) => {
    await supabase.from("cursos_items").update({ course_name: newName } as any).eq("id", id);
    load(); toast.success("Curso renomeado");
  };

  const addArea = async () => {
    if (!newAreaName.trim()) return;
    await supabase.from("cursos_areas").insert({ area_name: newAreaName.trim(), sort_order: areas.length });
    setNewAreaName("");
    load(); toast.success("Área adicionada");
  };

  const deleteArea = async (id: string) => {
    await supabase.from("cursos_areas").delete().eq("id", id);
    load(); toast.success("Área excluída");
  };

  const renameArea = async (id: string, newName: string) => {
    await supabase.from("cursos_areas").update({ area_name: newName }).eq("id", id);
    load(); toast.success("Área renomeada");
  };

  const toggleArea = (id: string) => {
    setSelectedAreas(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {areas.map(area => (
          <div key={area.id} className="border rounded-lg bg-card p-3">
            <div className="flex items-center justify-between mb-3">
              <InlineEdit value={area.area_name} onSave={(v) => renameArea(area.id, v)} className="font-semibold text-sm" />
              <DeleteButton label={area.area_name} onConfirm={() => deleteArea(area.id)} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {items.filter(i => i.area_id === area.id).map(item => {
                const isEditing = editingItemId === item.id;
                return (
                  <div key={item.id} className="border rounded-md bg-muted/40 p-2 text-xs flex flex-col gap-1.5">
                    <div className="flex items-start justify-between gap-1">
                      {isEditing ? (
                        <InlineEdit value={item.course_name} onSave={(v) => renameCourse(item.id, v)} className="font-medium break-words" />
                      ) : (
                        <span className="font-medium break-words flex-1">{item.course_name}</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-muted-foreground text-[10px]">
                        {item.hours || 0}h
                        {isEditing && (
                          <span className="ml-1 inline-flex"><InlineHoursEdit hours={item.hours || 0} onSave={(h) => updateHours(item.id, h)} /></span>
                        )}
                      </span>
                      {item.tipo && !isEditing && (
                        <span className={`text-[10px] px-1 rounded ${item.tipo === "mentoria" ? "bg-amber-200 text-amber-800" : "bg-blue-200 text-blue-800"}`}>
                          {item.tipo}
                        </span>
                      )}
                    </div>
                    {isEditing && (
                      <Select value={item.tipo || "curso"} onValueChange={v => updateTipo(item.id, v === "curso" ? null : v)}>
                        <SelectTrigger className="h-6 text-[10px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="curso">Curso</SelectItem>
                          <SelectItem value="mentoria">Mentoria</SelectItem>
                          <SelectItem value="consultoria">Consultoria</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                    <div className="flex items-center justify-end gap-1 mt-auto pt-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                        onClick={() => setEditingItemId(isEditing ? null : item.id)}
                        title={isEditing ? "Concluir" : "Editar"}
                      >
                        {isEditing ? <Check className="h-3 w-3 text-success" /> : <Pencil className="h-3 w-3" />}
                      </Button>
                      <DeleteButton label={item.course_name} onConfirm={() => deleteCourse(item.id)} iconOnly />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 border-t pt-3">
        <Input className="h-8 text-sm flex-1" value={newAreaName} onChange={e => setNewAreaName(e.target.value)} placeholder="Nova área..." onKeyDown={e => e.key === "Enter" && addArea()} />
        <Button size="sm" className="h-8" onClick={addArea}><Plus className="h-3 w-3 mr-1" /> Área</Button>
      </div>

      <div className="border-t pt-4 space-y-3">
        <h3 className="font-semibold text-sm">Adicionar Novo Curso</h3>
        <div className="flex gap-2">
          <Input className="flex-1" value={newCourse} onChange={e => setNewCourse(e.target.value)} placeholder="Nome do curso" />
          <Input className="w-24" type="number" value={newHours} onChange={e => setNewHours(e.target.value)} placeholder="Horas" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {areas.map(a => (
            <label key={a.id} className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox checked={selectedAreas.has(a.id)} onCheckedChange={() => toggleArea(a.id)} />
              {a.area_name}
            </label>
          ))}
        </div>
        <Button onClick={addCourse}><Plus className="h-4 w-4 mr-1" /> Adicionar Curso</Button>
      </div>
    </div>
  );
}

/* ─── CAMPANHA TAB ─── */
interface CampaignRow { id: string; name: string; image_url: string; active: boolean; start_date: string | null; end_date: string | null; }

function CampanhaTab() {
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [newName, setNewName] = useState("");
  const [newStart, setNewStart] = useState("");
  const [newEnd, setNewEnd] = useState("");
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const load = async () => {
    const { data } = await supabase.from("campaigns").select("*").order("sort_order", { ascending: true });
    if (data) setCampaigns(data as CampaignRow[]);
  };

  useEffect(() => { load(); }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!newName.trim()) { toast.error("Digite o nome da campanha primeiro"); return; }
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("campaigns").upload(path, file, { contentType: file.type, upsert: false });
    if (error) { toast.error("Erro no upload: " + error.message); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("campaigns").getPublicUrl(path);
    const maxOrder = campaigns.length > 0 ? Math.max(...campaigns.map(c => (c as any).sort_order ?? 0)) + 1 : 0;
    await supabase.from("campaigns").insert({
      name: newName.trim(),
      image_url: urlData.publicUrl,
      active: true,
      start_date: newStart || null,
      end_date: newEnd || null,
      sort_order: maxOrder,
    } as any);
    setNewName(""); setNewStart(""); setNewEnd("");
    setUploading(false);
    e.target.value = "";
    load();
    toast.success("Campanha adicionada");
  };

  const deleteCampaign = async (id: string, imageUrl: string) => {
    const urlParts = imageUrl.split("/campaigns/");
    if (urlParts[1]) {
      await supabase.storage.from("campaigns").remove([decodeURIComponent(urlParts[1])]);
    }
    await supabase.from("campaigns").delete().eq("id", id);
    load();
    toast.success("Campanha excluída");
  };

  const toggleActive = async (id: string, currentActive: boolean) => {
    await supabase.from("campaigns").update({ active: !currentActive }).eq("id", id);
    load();
    toast.success(currentActive ? "Campanha desativada" : "Campanha ativada");
  };

  const startEdit = (c: CampaignRow) => {
    setEditingId(c.id);
    setEditName(c.name);
    setEditStart(c.start_date || "");
    setEditEnd(c.end_date || "");
  };

  const saveEdit = async () => {
    if (!editingId) return;
    await supabase.from("campaigns").update({
      name: editName.trim(),
      start_date: editStart || null,
      end_date: editEnd || null,
    } as any).eq("id", editingId);
    setEditingId(null);
    load();
    toast.success("Campanha atualizada");
  };

  const handleDragStart = (idx: number) => { setDragIdx(idx); };
  const handleDragOver = (e: React.DragEvent, idx: number) => { e.preventDefault(); setDragOverIdx(idx); };
  const handleDragEnd = () => { setDragIdx(null); setDragOverIdx(null); };

  const handleDrop = async (targetIdx: number) => {
    if (dragIdx === null || dragIdx === targetIdx) { handleDragEnd(); return; }
    const reordered = [...campaigns];
    const [moved] = reordered.splice(dragIdx, 1);
    reordered.splice(targetIdx, 0, moved);
    setCampaigns(reordered);
    handleDragEnd();

    const updates = reordered.map((c, i) =>
      supabase.from("campaigns").update({ sort_order: i } as any).eq("id", c.id)
    );
    await Promise.all(updates);
    toast.success("Ordem atualizada");
  };

  return (
    <div className="space-y-6">
      <div className="border rounded-lg bg-card p-4 space-y-3">
        <h3 className="font-semibold text-sm">Nova Campanha</h3>
        <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nome da campanha" className="h-8 text-sm" />
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-muted-foreground">Data Início</label>
            <Input type="date" value={newStart} onChange={e => setNewStart(e.target.value)} className="h-8 text-sm" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Data Fim</label>
            <Input type="date" value={newEnd} onChange={e => setNewEnd(e.target.value)} className="h-8 text-sm" />
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground">Dimensões recomendadas: 1080×1080 (feed quadrado) ou 1080×1350 (feed retrato). Qualquer JPG/PNG aceito, sem limite de peso.</p>
        <div className="flex gap-2 items-center">
          <input
            id="campaign-upload"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
          <Button size="sm" variant="outline" className="h-8 text-xs" disabled={uploading}
            onClick={() => document.getElementById("campaign-upload")?.click()}>
            <Upload className="h-3 w-3 mr-1" />{uploading ? "Enviando..." : "Upload da Imagem"}
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-semibold text-sm">Campanhas <span className="text-muted-foreground font-normal">(arraste para reordenar)</span></h3>
        {campaigns.length === 0 && <p className="text-xs text-muted-foreground">Nenhuma campanha cadastrada.</p>}
        {campaigns.map((c, idx) => (
          <div
            key={c.id}
            draggable={editingId !== c.id}
            onDragStart={() => handleDragStart(idx)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDragEnd={handleDragEnd}
            onDrop={() => handleDrop(idx)}
            className={`border rounded-lg p-3 transition-all ${c.active ? "border-accent bg-accent/5" : "bg-card"} ${dragIdx === idx ? "opacity-40" : ""} ${dragOverIdx === idx && dragIdx !== idx ? "ring-2 ring-primary" : ""}`}
          >
            {editingId === c.id ? (
              <div className="space-y-2">
                <Input className="h-7 text-xs" value={editName} onChange={e => setEditName(e.target.value)} placeholder="Nome" />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-muted-foreground">Início</label>
                    <Input type="date" className="h-7 text-xs" value={editStart} onChange={e => setEditStart(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground">Fim</label>
                    <Input type="date" className="h-7 text-xs" value={editEnd} onChange={e => setEditEnd(e.target.value)} />
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" className="h-7 text-xs" onClick={saveEdit}><Check className="h-3 w-3 mr-1" />Salvar</Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditingId(null)}><X className="h-3 w-3 mr-1" />Cancelar</Button>
                </div>
              </div>
            ) : (
              <div className="flex gap-3 items-start">
                <div className="flex items-center self-center cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
                  <GripVertical className="h-4 w-4" />
                </div>
                <img src={c.image_url} alt={c.name} className="w-20 h-14 object-cover rounded cursor-pointer border"
                  onClick={() => setPreviewUrl(c.image_url)}
                  onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/80x56?text=Erro"; }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{c.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {c.start_date && c.end_date ? `${c.start_date} → ${c.end_date}` : c.start_date ? `A partir de ${c.start_date}` : c.end_date ? `Até ${c.end_date}` : "Sem datas"}
                    {" · "}{c.active ? "✅ Ativa" : "Inativa"}
                  </p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => toggleActive(c.id, c.active)}>
                    {c.active ? "Desativar" : "Ativar"}
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => startEdit(c)}>
                    <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setPreviewUrl(c.image_url)}>
                    <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                  <DeleteButton label={c.name} onConfirm={() => deleteCampaign(c.id, c.image_url)} />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setPreviewUrl(null)}>
          <div className="relative max-w-lg w-full mx-4" onClick={e => e.stopPropagation()}>
            <button onClick={() => setPreviewUrl(null)} className="absolute -top-3 -right-3 bg-card rounded-full p-1 shadow-lg">
              <X className="h-4 w-4" />
            </button>
            <img src={previewUrl} alt="Preview" className="w-full rounded-lg shadow-xl" />
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── INTERESSADOS TAB ─── */
function InteressadosTab() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<InteressadoRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [codigosComProposta, setCodigosComProposta] = useState<Set<string>>(new Set());

  const load = async () => {
    const data = await loadInteressados();
    setRecords(data);
    setLoading(false);
  };

  const loadPropostasCodigos = async () => {
    const { data } = await supabase.from("propostas").select("codigo_interessado");
    if (data) {
      const codigos = new Set(data.map(p => (p as any).codigo_interessado).filter(Boolean) as string[]);
      setCodigosComProposta(codigos);
    }
  };

  useEffect(() => {
    load();
    loadPropostasCodigos();
    const channel = supabase
      .channel("admin-interessados")
      .on("postgres_changes", { event: "*", schema: "public", table: "interessados" }, () => { load(); })
      .subscribe();
    const channel2 = supabase
      .channel("admin-interessados-propostas")
      .on("postgres_changes", { event: "*", schema: "public", table: "propostas" }, () => { loadPropostasCodigos(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); supabase.removeChannel(channel2); };
  }, []);

  const filtered = useMemo(() => {
    const q = searchText.toLowerCase().trim();
    return records.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (!q) return true;
      return (r.nome || "").toLowerCase().includes(q) || (r.codigo || "").toLowerCase().includes(q) || (r.instrutor || "").toLowerCase().includes(q);
    });
  }, [records, searchText, statusFilter]);

  const handleStatusChange = async (id: string, status: string) => {
    await updateInteressadoStatus(id, status);
    setRecords((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  };

  const handleDelete = async (id: string) => {
    await supabase.from("interessados").delete().eq("id", id);
    load();
    toast.success("Interessado excluído");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input
          placeholder="Buscar por nome, código..."
          className="h-8 text-sm flex-1 max-w-sm"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="Não Cadastrado">Não Cadastrado</SelectItem>
            <SelectItem value="Cadastrado">Cadastrado</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">{filtered.length} registros</span>
      </div>

      {loading && <p className="text-sm text-muted-foreground py-8 text-center">Carregando...</p>}

      {!loading && filtered.length === 0 && (
        <p className="text-sm text-muted-foreground py-8 text-center">Nenhum interessado encontrado.</p>
      )}

      <div className="space-y-2">
        {filtered.map((r) => {
          const temProposta = !!(r.codigo && codigosComProposta.has(r.codigo));
          return (
            <div key={r.id} className="border rounded-lg bg-card p-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">
                  {r.nome || "Sem nome"}
                  {r.codigo && <span className="ml-2 text-xs text-muted-foreground font-normal">#{r.codigo}</span>}
                  {temProposta && (
                    <span className="ml-2 inline-flex items-center gap-0.5 text-[10px] bg-accent/20 text-accent-foreground px-1.5 py-0.5 rounded font-normal">
                      <FileText className="h-2.5 w-2.5" /> Proposta
                    </span>
                  )}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {r.instrutor && `Instrutor: ${r.instrutor} · `}
                  Criado: {new Date(r.created_at).toLocaleDateString("pt-BR")}
                  {r.updated_at && r.updated_at !== r.created_at && (
                    <> · Editado: {new Date(r.updated_at).toLocaleDateString("pt-BR")}{" "}{new Date(r.updated_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</>
                  )}
                </p>
              </div>
              <Select value={r.status} onValueChange={(v) => handleStatusChange(r.id, v)}>
                <SelectTrigger className="w-[140px] h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Não Cadastrado">Não Cadastrado</SelectItem>
                  <SelectItem value="Cadastrado">Cadastrado</SelectItem>
                </SelectContent>
              </Select>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs gap-1"
                onClick={() => navigate(`/configurador?id=${r.id}&from=admin`)}
              >
                <Pencil className="h-3 w-3" /> Editar
              </Button>
              <DeleteButton label={r.nome || "registro"} onConfirm={() => handleDelete(r.id)} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DeleteButton({ label, onConfirm, iconOnly }: { label: string; onConfirm: () => void; iconOnly?: boolean }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className={iconOnly ? "h-4 w-4 p-0 text-muted-foreground hover:text-destructive" : "h-7 px-2 text-muted-foreground hover:text-destructive"}>
          <Trash2 className={iconOnly ? "h-3 w-3" : "h-3.5 w-3.5"} />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir <strong>{label}</strong>? Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default AdminDashboard;
