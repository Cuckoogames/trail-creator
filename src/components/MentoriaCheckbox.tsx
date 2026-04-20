import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

interface MentoriaCheckboxProps {
  value: string;
  onChange: (value: string) => void;
}

export function MentoriaCheckbox({ value, onChange }: MentoriaCheckboxProps) {
  const [checked, setChecked] = useState(!!value);

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-3">
        <Checkbox
          id="mentoria-check"
          checked={checked}
          onCheckedChange={(v) => {
            const next = !!v;
            setChecked(next);
            if (!next) onChange("");
          }}
          className="h-5 w-5"
        />
        <label
          htmlFor="mentoria-check"
          className="cursor-pointer text-sm font-bold text-foreground"
        >
          Mentoria / Consultoria ou Treinamento Especializado
        </label>
      </div>

      <AnimatePresence>
        {checked && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <Textarea
              placeholder="Descreva o tipo de mentoria, consultoria ou treinamento especializado..."
              className="min-h-[80px] text-base"
              value={value}
              onChange={(e) => onChange(e.target.value)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
