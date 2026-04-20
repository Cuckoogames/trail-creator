import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";

interface CourseCardProps {
  name: string;
  isSelected: boolean;
  onToggle: () => void;
}

export function CourseCard({ name, isSelected, onToggle }: CourseCardProps) {
  return (
    <button
      onClick={() => {
        if (navigator.vibrate) navigator.vibrate(30);
        onToggle();
      }}
      className={`
        relative flex w-full touch-target items-center gap-3 rounded-md border-2 px-4 py-3
        text-left text-sm font-medium transition-all duration-200
        ${isSelected
          ? "border-success bg-success/10 text-foreground"
          : "border-transparent bg-muted/50 text-foreground hover:bg-muted"
        }
      `}
    >
      <span
        className={`
          flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-all
          ${isSelected
            ? "border-success bg-success text-success-foreground"
            : "border-muted-foreground/30 bg-card"
          }
        `}
      >
        <AnimatePresence>
          {isSelected && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              <Check className="h-3 w-3" />
            </motion.span>
          )}
        </AnimatePresence>
      </span>
      <span className="leading-tight">{name}</span>
    </button>
  );
}
