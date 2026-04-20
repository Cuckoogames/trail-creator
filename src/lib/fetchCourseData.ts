import { supabase } from "@/integrations/supabase/client";

export interface CourseEntry {
  area: string;
  carreira: string;
  formacoes: { label: string; cursos: string[] }[];
}

export interface CategoryData {
  categoria: string;
  areas: CourseEntry[];
}

export interface OtherCoursesArea {
  area: string;
  courses: string[];
}

const FORMACAO_LABELS = [
  "Ponto de Partida",
  "Formação Completa",
  "Formação Continuada",
  "Formação Alternativa",
  "Nível Especialista",
];

export async function fetchCourseData(): Promise<CategoryData[]> {
  const [areasRes, carreirasRes, cursosRes] = await Promise.all([
    supabase.from("trilha_areas").select("*").order("sort_order"),
    supabase.from("trilha_carreiras").select("*").order("sort_order"),
    supabase.from("trilha_cursos").select("*").order("sort_order"),
  ]);

  const areas = areasRes.data || [];
  const carreiras = carreirasRes.data || [];
  const cursos = cursosRes.data || [];

  const categoryMap = new Map<string, CourseEntry[]>();

  for (const area of areas) {
    const catName = area.category_name;
    if (!categoryMap.has(catName)) categoryMap.set(catName, []);

    const areaCarreiras = carreiras.filter(c => c.area_id === area.id);
    for (const carr of areaCarreiras) {
      const carrCursos = cursos.filter(c => c.carreira_id === carr.id);
      const formacoes = FORMACAO_LABELS.map((label, i) => {
        const items = carrCursos.filter(c => c.formacao_index === i).map(c => c.curso_name);
        return { label, cursos: items };
      }).filter(f => f.cursos.length > 0);

      categoryMap.get(catName)!.push({
        area: area.area_name,
        carreira: carr.carreira_name,
        formacoes,
      });
    }
  }

  return Array.from(categoryMap.entries()).map(([categoria, areas]) => ({ categoria, areas }));
}

export async function fetchOtherCourses(): Promise<OtherCoursesArea[]> {
  const [areasRes, itemsRes] = await Promise.all([
    supabase.from("cursos_areas").select("*").order("sort_order"),
    supabase.from("cursos_items").select("*").order("sort_order"),
  ]);

  const areas = areasRes.data || [];
  const items = itemsRes.data || [];

  return areas.map(a => ({
    area: a.area_name,
    courses: items.filter(i => i.area_id === a.id).map(i => i.course_name),
  }));
}

export const CATEGORIAS = [
  "Design Gráfico",
  "Excel para Negócios",
  "Gestão Administrativa",
  "Gestão Comercial",
  "Informática Essencial",
  "Informática Kids",
  "Produção Audiovisual",
  "Programação",
  "Projetos Digitais para Arquitetura e Engenharias",
  "Fotografia",
];
