/**
 * Generate a proposal PDF using the uploaded template as background
 * and overlay the interessado's data + chosen plan.
 *
 * Courses are grouped by tipo (curso / mentoria / consultoria).
 * Name & plan fields are white. Course texts are black.
 * Áreas de interesse are checked.
 */
export async function generatePropostaPdf(
  nome: string,
  planoKey: string,
  cursos: string[],
  areas?: string[],
  tipoMap?: Record<string, string | null>
) {
  const { PDFDocument, rgb, StandardFonts } = await import("pdf-lib");

  const templateUrl = "/proposta-template.pdf";
  const templateBytes = await fetch(templateUrl).then(r => r.arrayBuffer());

  const pdfDoc = await PDFDocument.load(templateBytes);
  const pages = pdfDoc.getPages();
  const page = pages[0];
  const { width, height } = page.getSize();

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const white = rgb(1, 1, 1);
  const black = rgb(0, 0, 0);

  // ─── Nome (left side, on the "Nome:" field line) ───
  page.drawText(nome, {
    x: 95,
    y: height - 132,
    size: 12,
    font: fontBold,
    color: white,
  });

  // ─── Plano (right side, on the "Profissão:" field line) ───
  const planoLabels: Record<string, string> = {
    premium: "Plano Premium (120h)",
    smart: "Plano Smart (60h)",
    classic: "Plano Classic (40h)",
    unique: "Plano Unique",
  };

  page.drawText(planoLabels[planoKey] || planoKey, {
    x: 350,
    y: height - 132,
    size: 11,
    font,
    color: white,
  });

  // ─── Áreas de interesse checkmarks ───
  const areaCheckboxes: Record<string, { x: number; y: number }> = {
    "Design gráfico": { x: 152, y: height - 198 },
    "Programação": { x: 152, y: height - 217 },
    "Excel": { x: 152, y: height - 236 },
    "Informática": { x: 330, y: height - 198 },
    "Projetos 2D/3D": { x: 330, y: height - 217 },
    "Administrativos": { x: 330, y: height - 236 },
  };

  if (areas && areas.length > 0) {
    for (const area of areas) {
      for (const [label, pos] of Object.entries(areaCheckboxes)) {
        if (area.toLowerCase().includes(label.toLowerCase()) || label.toLowerCase().includes(area.toLowerCase())) {
          page.drawText("✓", {
            x: pos.x,
            y: pos.y,
            size: 14,
            font: fontBold,
            color: white,
          });
        }
      }
    }
  }

  // ─── Cursos section ───
  // Use tipoMap to categorize: null/undefined = curso, "mentoria" = mentoria, "consultoria" = consultoria
  const cursosList: string[] = [];
  const mentoriasList: string[] = [];
  const consultoriasList: string[] = [];

  for (const c of cursos) {
    // Clean: remove any "Categoria > Carreira > " or "carreira::formação::" prefix
    const parts = c.includes("::") ? c.split("::") : c.split(" > ");
    const cleanName = parts[parts.length - 1] || c;

    const tipo = tipoMap?.[cleanName] || tipoMap?.[c] || null;

    if (tipo === "mentoria") {
      mentoriasList.push(cleanName);
    } else if (tipo === "consultoria") {
      consultoriasList.push(cleanName);
    } else {
      // Also check if name starts with Mentoria:/Consultoria: prefix (legacy)
      if (c.startsWith("Mentoria:") || c.startsWith("Mentoria ")) {
        mentoriasList.push(cleanName.replace(/^Mentoria:\s*/, "").replace(/^Mentoria\s*/, ""));
      } else if (c.startsWith("Consultoria:") || c.startsWith("Consultoria ")) {
        consultoriasList.push(cleanName.replace(/^Consultoria:\s*/, "").replace(/^Consultoria\s*/, ""));
      } else {
        cursosList.push(cleanName);
      }
    }
  }

  const lineHeight = 18;

  // CURSOS column (left)
  const cursosStartX = 55;
  const cursosStartY = height - 410;

  cursosList.forEach((curso, i) => {
    const yPos = cursosStartY - i * lineHeight;
    if (yPos > 80) {
      page.drawText(curso, {
        x: cursosStartX,
        y: yPos,
        size: 10,
        font,
        color: black,
      });
    }
  });

  // MENTORIAS column (middle)
  const mentoriasStartX = 220;

  mentoriasList.forEach((m, i) => {
    const yPos = cursosStartY - i * lineHeight;
    if (yPos > 80) {
      page.drawText(m, {
        x: mentoriasStartX,
        y: yPos,
        size: 10,
        font,
        color: black,
      });
    }
  });

  // CONSULTORIAS column (right)
  const consultoriasStartX = 400;

  consultoriasList.forEach((c, i) => {
    const yPos = cursosStartY - i * lineHeight;
    if (yPos > 80) {
      page.drawText(c, {
        x: consultoriasStartX,
        y: yPos,
        size: 10,
        font,
        color: black,
      });
    }
  });

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes as unknown as ArrayBuffer], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Proposta_${nome.replace(/\s+/g, "_")}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
