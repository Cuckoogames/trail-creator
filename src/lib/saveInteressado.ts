import { supabase } from "@/integrations/supabase/client";
import type { HeaderData } from "@/components/HeaderForm";
import type { SelectedArea } from "@/components/FormationSelector";
import type { OtherCoursesSelection } from "@/components/OtherCourses";

export interface InteressadoRecord {
  id: string;
  codigo: string;
  nome: string;
  idade: string;
  estudo: string;
  responsavel: string;
  instrutor: string;
  mentoria_texto: string;
  selected_areas: SerializedArea[];
  other_courses: string[];
  status: string;
  created_at: string;
  updated_at: string;
}

interface SerializedArea {
  area: string;
  carreira: string;
  selectedCourses: string[];
  observation: string;
}

function serializeAreas(areas: Map<string, SelectedArea>): SerializedArea[] {
  return Array.from(areas.values())
    .filter((a) => a.selectedCourses.size > 0)
    .map((a) => ({
      area: a.area,
      carreira: a.carreira,
      selectedCourses: Array.from(a.selectedCourses),
      observation: a.observation,
    }));
}

function serializeOther(other: OtherCoursesSelection): string[] {
  return Array.from(other.selected);
}

export function deserializeAreas(data: SerializedArea[]): Map<string, SelectedArea> {
  const map = new Map<string, SelectedArea>();
  for (const a of data || []) {
    map.set(a.carreira, {
      area: a.area,
      carreira: a.carreira,
      selectedCourses: new Set(a.selectedCourses),
      observation: a.observation,
      showObservation: !!a.observation,
    });
  }
  return map;
}

export function deserializeOther(data: string[]): OtherCoursesSelection {
  return { selected: new Set(data || []) };
}

export async function saveInteressado(
  id: string | null,
  headerData: HeaderData,
  selectedAreas: Map<string, SelectedArea>,
  otherCourses: OtherCoursesSelection,
  mentoriaTexto: string
): Promise<string> {
  // Check for duplicate codigo
  if (headerData.codigo && headerData.codigo.trim()) {
    const { data: existing } = await supabase
      .from("interessados")
      .select("id")
      .eq("codigo", headerData.codigo.trim())
      .maybeSingle();
    if (existing && existing.id !== id) {
      throw new Error(`O código "${headerData.codigo}" já está em uso por outro interessado.`);
    }
  }

  const payload: Record<string, unknown> = {
    codigo: headerData.codigo,
    nome: headerData.nome,
    idade: headerData.idade,
    estudo: headerData.estudo,
    responsavel: headerData.responsavel,
    instrutor: headerData.instrutor,
    mentoria_texto: mentoriaTexto,
    selected_areas: JSON.parse(JSON.stringify(serializeAreas(selectedAreas))),
    other_courses: JSON.parse(JSON.stringify(serializeOther(otherCourses))),
    updated_at: new Date().toISOString(),
  };

  if (id) {
    const { error } = await supabase
      .from("interessados")
      .update(payload as any)
      .eq("id", id);
    if (error) throw error;
    return id;
  } else {
    const { data, error } = await supabase
      .from("interessados")
      .insert(payload as any)
      .select("id")
      .single();
    if (error) throw error;
    return data!.id;
  }
}

export async function loadInteressados(): Promise<InteressadoRecord[]> {
  const { data, error } = await supabase
    .from("interessados")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []) as unknown as InteressadoRecord[];
}

export async function updateInteressadoStatus(id: string, status: string) {
  const { error } = await supabase
    .from("interessados")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}
