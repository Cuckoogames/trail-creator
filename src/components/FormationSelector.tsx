import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { CATEGORIAS, type CategoryData, type CourseEntry } from "@/lib/fetchCourseData";
import { FormationGrid } from "./FormationGrid";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface SelectedArea {
  area: string;
  carreira: string;
  selectedCourses: Set<string>;
  observation: string;
  showObservation: boolean;
}

interface FormationSelectorProps {
  selectedAreas: Map<string, SelectedArea>;
  onSelectionChange: (areas: Map<string, SelectedArea>) => void;
  courseData: CategoryData[];
}

export function FormationSelector({ selectedAreas, onSelectionChange, courseData }: FormationSelectorProps) {
  const [selectedCategoria, setSelectedCategoria] = useState<string>("");
  const [selectedCarreira, setSelectedCarreira] = useState<string>("");

  const currentCategory = courseData.find((c) => c.categoria === selectedCategoria);
  const currentEntries = currentCategory?.areas || [];

  // Filter entries by selected carreira or show all
  const displayEntries = selectedCarreira
    ? currentEntries.filter((e) => e.carreira === selectedCarreira)
    : currentEntries;

  const toggleCourse = useCallback(
    (carreira: string, area: string, courseKey: string) => {
      const newAreas = new Map(selectedAreas);
      const existing = newAreas.get(carreira) || {
        area,
        carreira,
        selectedCourses: new Set<string>(),
        observation: "",
        showObservation: false,
      };

      const newCourses = new Set(existing.selectedCourses);
      if (newCourses.has(courseKey)) {
        newCourses.delete(courseKey);
      } else {
        newCourses.add(courseKey);
      }

      if (newCourses.size === 0 && !existing.observation) {
        newAreas.delete(carreira);
      } else {
        newAreas.set(carreira, { ...existing, selectedCourses: newCourses });
      }

      onSelectionChange(newAreas);
    },
    [selectedAreas, onSelectionChange]
  );

  const toggleObservation = useCallback(
    (carreira: string, area: string) => {
      const newAreas = new Map(selectedAreas);
      const existing = newAreas.get(carreira) || {
        area,
        carreira,
        selectedCourses: new Set<string>(),
        observation: "",
        showObservation: false,
      };
      newAreas.set(carreira, {
        ...existing,
        showObservation: !existing.showObservation,
      });
      onSelectionChange(newAreas);
    },
    [selectedAreas, onSelectionChange]
  );

  const setObservation = useCallback(
    (carreira: string, area: string, text: string) => {
      const newAreas = new Map(selectedAreas);
      const existing = newAreas.get(carreira) || {
        area,
        carreira,
        selectedCourses: new Set<string>(),
        observation: "",
        showObservation: true,
      };
      newAreas.set(carreira, { ...existing, observation: text });
      onSelectionChange(newAreas);
    },
    [selectedAreas, onSelectionChange]
  );

  const uniqueCarreiras = currentEntries.map((e) => e.carreira);

  return (
    <section className="space-y-5">
      <h2 className="text-lg font-bold tracking-tight text-foreground">
        Formação
      </h2>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Categoria
          </label>
          <Select
            value={selectedCategoria}
            onValueChange={(v) => {
              setSelectedCategoria(v);
              setSelectedCarreira("");
            }}
          >
            <SelectTrigger className="touch-target text-base">
              <SelectValue placeholder="Selecione uma categoria" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIAS.map((cat) => (
                <SelectItem key={cat} value={cat} className="touch-target text-base">
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedCategoria && uniqueCarreiras.length > 0 && (
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Área / Carreira
            </label>
            <Select value={selectedCarreira} onValueChange={setSelectedCarreira}>
              <SelectTrigger className="touch-target text-base">
                <SelectValue placeholder="Todas as áreas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="touch-target text-base">
                  Todas as áreas
                </SelectItem>
                {uniqueCarreiras.map((c) => (
                  <SelectItem key={c} value={c} className="touch-target text-base">
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {selectedCategoria && (
          <motion.div
            key={selectedCategoria + selectedCarreira}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {(selectedCarreira && selectedCarreira !== "all"
              ? displayEntries
              : currentEntries
            )
              .filter((e) => e.formacoes.length > 0)
              .map((entry) => {
                const areaData = selectedAreas.get(entry.carreira);
                return (
                  <div key={entry.carreira} className="space-y-3">
                    <FormationGrid
                      entry={entry}
                      selectedCourses={areaData?.selectedCourses || new Set()}
                      onToggleCourse={(key) =>
                        toggleCourse(entry.carreira, entry.area, key)
                      }
                    />

                    {(areaData?.selectedCourses?.size ?? 0) > 0 && (
                      <div className="flex items-center gap-3 pl-2">
                        <Checkbox
                          id={`obs-${entry.carreira}`}
                          checked={areaData?.showObservation || false}
                          onCheckedChange={() =>
                            toggleObservation(entry.carreira, entry.area)
                          }
                          className="h-5 w-5"
                        />
                        <label
                          htmlFor={`obs-${entry.carreira}`}
                          className="cursor-pointer text-sm font-medium text-muted-foreground"
                        >
                          Adicionar observações para esta formação
                        </label>
                      </div>
                    )}

                    <AnimatePresence>
                      {areaData?.showObservation && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <Textarea
                            placeholder="Observações sobre esta formação..."
                            className="min-h-[80px] text-base"
                            value={areaData?.observation || ""}
                            onChange={(e) =>
                              setObservation(
                                entry.carreira,
                                entry.area,
                                e.target.value
                              )
                            }
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}

            {(selectedCarreira && selectedCarreira !== "all"
              ? displayEntries
              : currentEntries
            ).filter((e) => e.formacoes.length > 0).length === 0 && (
              <div className="rounded-lg border-2 border-dashed border-border p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  Nenhum curso disponível nesta categoria/área.
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {!selectedCategoria && (
        <div className="rounded-lg border-2 border-dashed border-border p-12 text-center opacity-40">
          <ChevronDown className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium text-muted-foreground">
            Selecione uma categoria para visualizar os cursos disponíveis
          </p>
        </div>
      )}
    </section>
  );
}
