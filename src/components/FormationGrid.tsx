import { CourseCard } from "./CourseCard";
import type { CourseEntry } from "@/data/courseData";

interface FormationLevel {
  label: string;
  cursos: string[];
}

interface FormationGridProps {
  entry: CourseEntry;
  selectedCourses: Set<string>;
  onToggleCourse: (courseKey: string) => void;
}

export function FormationGrid({ entry, selectedCourses, onToggleCourse }: FormationGridProps) {
  const totalCourses = entry.formacoes.reduce((acc, f) => acc + f.cursos.length, 0);
  const selectedCount = entry.formacoes.reduce(
    (acc, f) => acc + f.cursos.filter((c) => selectedCourses.has(`${entry.carreira}::${f.label}::${c}`)).length,
    0
  );

  return (
    <div className="rounded-lg border bg-card p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h4 className="text-sm font-extrabold uppercase tracking-wider text-foreground">
          {entry.carreira}
        </h4>
        <span className="rounded-full border bg-muted px-2.5 py-0.5 text-xs font-bold text-muted-foreground">
          {totalCourses} cursos
        </span>
        {selectedCount > 0 && (
          <span className="rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-bold text-success">
            {selectedCount} selecionados
          </span>
        )}
      </div>

      <p className="mb-4 text-xs text-muted-foreground">
        Clique em um curso para selecionar. Use a rolagem horizontal para ver mais formações.
      </p>

      <div className="snap-scroll gap-6 pb-3">
        {entry.formacoes.map((formacao) => (
          <FormationColumn
            key={formacao.label}
            formacao={formacao}
            carreira={entry.carreira}
            selectedCourses={selectedCourses}
            onToggleCourse={onToggleCourse}
          />
        ))}
      </div>
    </div>
  );
}

function FormationColumn({
  formacao,
  carreira,
  selectedCourses,
  onToggleCourse,
}: {
  formacao: FormationLevel;
  carreira: string;
  selectedCourses: Set<string>;
  onToggleCourse: (key: string) => void;
}) {
  const selectedInCol = formacao.cursos.filter((c) =>
    selectedCourses.has(`${carreira}::${formacao.label}::${c}`)
  ).length;

  return (
    <div className="flex w-64 shrink-0 snap-start flex-col">
      <div className="mb-3 flex items-center justify-between">
        <h5 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
          {formacao.label}
        </h5>
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
          {selectedInCol}
        </span>
      </div>

      <div
        className="flex flex-1 flex-col gap-2 rounded-lg border-2 border-dashed border-border p-3"
        style={{
          backgroundImage:
            "radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px)",
          backgroundSize: "12px 12px",
        }}
      >
        {formacao.cursos.map((curso) => {
          const key = `${carreira}::${formacao.label}::${curso}`;
          return (
            <CourseCard
              key={key}
              name={curso}
              isSelected={selectedCourses.has(key)}
              onToggle={() => onToggleCourse(key)}
            />
          );
        })}
      </div>

      {formacao.cursos.length > 0 && (
        <div className="mt-2 flex items-center justify-center gap-1 text-xs font-bold text-muted-foreground">
          <span>»</span>
          <span>PRÓXIMO</span>
        </div>
      )}
    </div>
  );
}
