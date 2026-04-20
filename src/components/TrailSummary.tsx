import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import type { HeaderData } from "./HeaderForm";
import type { SelectedArea } from "./FormationSelector";
import type { OtherCoursesSelection } from "./OtherCourses";
import { JobSearchPopup } from "./JobSearchPopup";

interface TrailSummaryProps {
  headerData: HeaderData;
  selectedAreas: Map<string, SelectedArea>;
  otherCourses: OtherCoursesSelection;
  mentoriaTexto?: string;
  onSave?: () => void;
  saving?: boolean;
}

export function TrailSummary({
  headerData,
  selectedAreas,
  otherCourses,
  mentoriaTexto,
  onSave,
  saving,
}: TrailSummaryProps) {
  const areasWithCourses = Array.from(selectedAreas.values()).filter(
    (a) => a.selectedCourses.size > 0
  );

  const totalCourses =
    areasWithCourses.reduce((acc, a) => acc + a.selectedCourses.size, 0) +
    otherCourses.selected.size;

  if (totalCourses === 0 && !mentoriaTexto) return null;

  const parseCourseKey = (key: string) => {
    const parts = key.split("::");
    return { curso: parts[2] };
  };

  const parseOtherKey = (key: string) => {
    const parts = key.split("::");
    return { area: parts[0], curso: parts[1] };
  };

  const otherByArea = new Map<string, string[]>();
  for (const key of otherCourses.selected) {
    const { area, curso } = parseOtherKey(key);
    if (!otherByArea.has(area)) otherByArea.set(area, []);
    otherByArea.get(area)!.push(curso);
  }

  return (
    <Accordion type="single" collapsible className="rounded-lg border bg-card shadow-sm">
      <AccordionItem value="summary" className="border-none">
        <AccordionTrigger className="px-6 py-4 text-sm font-bold hover:no-underline">
          <div className="flex items-center gap-3 flex-wrap">
            <span>
              Resumo da Trilha selecionada —{" "}
              <span className="text-success">{totalCourses} Cursos</span> em{" "}
              <span className="text-accent">
                {areasWithCourses.length + otherByArea.size} Áreas
              </span>
            </span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-6 pb-6">
          <div className="space-y-6">
            {/* Header summary */}
            <div>
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Cabeçalho
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm md:grid-cols-3">
                {headerData.codigo && (
                  <div>
                    <span className="text-muted-foreground">Código:</span>{" "}
                    <span className="font-medium">{headerData.codigo}</span>
                  </div>
                )}
                {headerData.nome && (
                  <div>
                    <span className="text-muted-foreground">Nome:</span>{" "}
                    <span className="font-medium">{headerData.nome}</span>
                  </div>
                )}
                {headerData.idade && (
                  <div>
                    <span className="text-muted-foreground">Idade:</span>{" "}
                    <span className="font-medium">{headerData.idade}</span>
                  </div>
                )}
                {headerData.estudo && (
                  <div>
                    <span className="text-muted-foreground">Estudo:</span>{" "}
                    <span className="font-medium">{headerData.estudo}</span>
                  </div>
                )}
                {headerData.responsavel && (
                  <div>
                    <span className="text-muted-foreground">Responsável:</span>{" "}
                    <span className="font-medium">{headerData.responsavel}</span>
                  </div>
                )}
                {headerData.instrutor && (
                  <div>
                    <span className="text-muted-foreground">Instrutor:</span>{" "}
                    <span className="font-medium">{headerData.instrutor}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Areas */}
            <div>
              <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Áreas
              </h4>
              <div className="space-y-3">
                {areasWithCourses.map((areaData) => (
                  <div key={areaData.carreira} className="rounded-md border bg-muted/30 p-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{areaData.area}</span>
                      <span className="text-muted-foreground text-xs">›</span>
                      <span className="text-sm text-muted-foreground">{areaData.carreira}</span>
                      <span className="ml-auto rounded-full bg-success/10 px-2 py-0.5 text-xs font-bold text-success">
                        {areaData.selectedCourses.size}
                      </span>
                    </div>
                    {areaData.observation && (
                      <p className="mt-2 text-xs italic text-muted-foreground">
                        Obs: {areaData.observation}
                      </p>
                    )}
                  </div>
                ))}
                {Array.from(otherByArea.entries()).map(([area, cursos]) => (
                  <div key={`other-${area}`} className="rounded-md border bg-muted/30 p-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{area}</span>
                      <span className="text-muted-foreground text-xs">›</span>
                      <span className="text-sm text-muted-foreground">Outros Cursos</span>
                      <span className="ml-auto rounded-full bg-success/10 px-2 py-0.5 text-xs font-bold text-success">
                        {cursos.length}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* All selected courses */}
            <div>
              <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Cursos Selecionados
              </h4>
              <div className="grid grid-cols-1 gap-1 md:grid-cols-2">
                {areasWithCourses.flatMap((areaData) =>
                  Array.from(areaData.selectedCourses).map((key) => {
                    const { curso } = parseCourseKey(key);
                    return (
                      <div key={key} className="flex items-center gap-2 rounded-sm py-1 text-sm">
                        <span className="h-2 w-2 rounded-full bg-success" />
                        <span className="font-medium">{curso}</span>
                      </div>
                    );
                  })
                )}
                {Array.from(otherCourses.selected).map((key) => {
                  const { curso } = parseOtherKey(key);
                  return (
                    <div key={`other-${key}`} className="flex items-center gap-2 rounded-sm py-1 text-sm">
                      <span className="h-2 w-2 rounded-full bg-accent" />
                      <span className="font-medium">{curso}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Mentoria */}
            {mentoriaTexto && (
              <div>
                <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Mentoria / Consultoria Especializada
                </h4>
                <p className="text-sm text-muted-foreground">{mentoriaTexto}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-center gap-3 pt-2">
              {onSave && (
                <Button
                  onClick={onSave}
                  disabled={saving}
                  variant="outline"
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  {saving ? "Salvando..." : "Salvar"}
                </Button>
              )}
              <JobSearchPopup selectedAreas={selectedAreas} otherCourses={otherCourses} />
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
