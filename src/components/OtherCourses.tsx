import { useCallback, useMemo } from "react";
import { ChevronDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { OtherCoursesArea } from "@/lib/fetchCourseData";

export interface OtherCoursesSelection {
  selected: Set<string>; // "area::curso"
}

interface OtherCoursesProps {
  selection: OtherCoursesSelection;
  onSelectionChange: (selection: OtherCoursesSelection) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coursesData: OtherCoursesArea[];
}

export function OtherCourses({
  selection,
  onSelectionChange,
  open,
  onOpenChange,
  coursesData,
}: OtherCoursesProps) {
  const areaCourses = coursesData;

  const toggleCourse = useCallback(
    (area: string, curso: string) => {
      const key = `${area}::${curso}`;
      const newSelected = new Set(selection.selected);
      if (newSelected.has(key)) {
        newSelected.delete(key);
      } else {
        newSelected.add(key);
      }
      onSelectionChange({ selected: newSelected });
    },
    [selection, onSelectionChange]
  );

  return (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border bg-card px-6 py-4 text-sm font-bold shadow-sm hover:bg-muted/50 transition-colors">
        <span>
          Outros Cursos
          {selection.selected.size > 0 && (
            <span className="ml-2 text-success">
              ({selection.selected.size} selecionados)
            </span>
          )}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-3 rounded-lg border bg-card p-6 shadow-sm">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {areaCourses.map(({ area, courses }) => (
              <div key={area} className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-1">
                  {area}
                </h4>
                <div className="space-y-1">
                  {courses.map((curso) => {
                    const key = `${area}::${curso}`;
                    const checked = selection.selected.has(key);
                    return (
                      <div key={key} className="flex items-center gap-2">
                        <Checkbox
                          id={`other-${key}`}
                          checked={checked}
                          onCheckedChange={() => toggleCourse(area, curso)}
                          className="h-4 w-4"
                        />
                        <label
                          htmlFor={`other-${key}`}
                          className={`cursor-pointer text-sm ${
                            checked
                              ? "font-medium text-foreground"
                              : "text-muted-foreground"
                          }`}
                        >
                          {curso}
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
