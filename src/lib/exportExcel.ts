import * as XLSX from "xlsx";
import type { HeaderData } from "@/components/HeaderForm";
import type { SelectedArea } from "@/components/FormationSelector";
import type { OtherCoursesSelection } from "@/components/OtherCourses";

export function exportToExcel(
  headerData: HeaderData,
  selectedAreas: Map<string, SelectedArea>,
  otherCourses?: OtherCoursesSelection
) {
  const wb = XLSX.utils.book_new();
  const rows: (string | null)[][] = [];

  const now = new Date();
  const dateStr = now.toLocaleDateString("pt-BR");
  const timeStr = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  // Header block
  rows.push(["DADOS DO INTERESSADO"]);
  rows.push(["Código", headerData.codigo || ""]);
  rows.push(["Nome", headerData.nome || ""]);
  rows.push(["Idade", headerData.idade || ""]);
  rows.push(["Estudo/Carreira", headerData.estudo || ""]);
  if (headerData.responsavel) {
    rows.push(["Responsável", headerData.responsavel]);
  }
  rows.push(["Instrutor", headerData.instrutor || ""]);
  rows.push(["Data/Hora", `${dateStr} ${timeStr}`]);
  rows.push([]); // blank row

  // Group selections by area
  const areasWithCourses = Array.from(selectedAreas.values()).filter(
    (a) => a.selectedCourses.size > 0
  );

  if (areasWithCourses.length > 0) {
    rows.push(["FORMAÇÕES SELECIONADAS"]);
    rows.push([]); // blank row

    for (const areaData of areasWithCourses) {
      // Area + Carreira header
      rows.push([`Área: ${areaData.area}`, `Carreira: ${areaData.carreira}`, areaData.observation ? `Obs: ${areaData.observation}` : ""]);

      // Group courses by formação
      const coursesByFormacao = new Map<string, string[]>();
      for (const key of areaData.selectedCourses) {
        const parts = key.split("::");
        const formacao = parts[1];
        const curso = parts[2];
        if (!coursesByFormacao.has(formacao)) {
          coursesByFormacao.set(formacao, []);
        }
        coursesByFormacao.get(formacao)!.push(curso);
      }

      // Build table: Formação in rows, courses as columns
      // Find max number of courses across all formações
      let maxCourses = 0;
      for (const cursos of coursesByFormacao.values()) {
        if (cursos.length > maxCourses) maxCourses = cursos.length;
      }

      // Header row for courses table
      const tableHeader: (string | null)[] = ["Formação"];
      for (let i = 1; i <= maxCourses; i++) {
        tableHeader.push(`Curso ${i}`);
      }
      rows.push(tableHeader);

      // One row per formação
      for (const [formacao, cursos] of coursesByFormacao) {
        const row: (string | null)[] = [formacao];
        for (const curso of cursos) {
          row.push(curso);
        }
        rows.push(row);
      }

      rows.push([]); // blank row between areas
    }
  }

  // Other courses
  if (otherCourses && otherCourses.selected.size > 0) {
    rows.push(["OUTROS CURSOS"]);

    const otherByArea = new Map<string, string[]>();
    for (const key of otherCourses.selected) {
      const [area, curso] = key.split("::");
      if (!otherByArea.has(area)) otherByArea.set(area, []);
      otherByArea.get(area)!.push(curso);
    }

    for (const [area, cursos] of otherByArea) {
      rows.push([`Área: ${area}`, ...cursos]);
    }
  }

  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Auto-width columns
  const colWidths: number[] = [];
  for (const row of rows) {
    for (let c = 0; c < row.length; c++) {
      const val = row[c] || "";
      const len = val.length + 2;
      if (!colWidths[c] || len > colWidths[c]) colWidths[c] = len;
    }
  }
  ws["!cols"] = colWidths.map((w) => ({ wch: Math.min(w, 50) }));

  XLSX.utils.book_append_sheet(wb, ws, "Trilha");
  XLSX.writeFile(
    wb,
    `Trilha_${headerData.nome || "Aluno"}_${dateStr.replace(/\//g, "-")}.xlsx`
  );
}
