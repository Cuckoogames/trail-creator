import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface HeaderData {
  codigo: string;
  nome: string;
  idade: string;
  estudo: string;
  responsavel: string;
  instrutor: string;
}

interface HeaderFormProps {
  data: HeaderData;
  onChange: (data: HeaderData) => void;
}

export function HeaderForm({ data, onChange }: HeaderFormProps) {
  const [showResponsavel, setShowResponsavel] = useState(false);

  return (
    <header className="rounded-lg border bg-card p-6 shadow-sm">
      <h2 className="mb-5 text-lg font-bold tracking-tight text-foreground">
        Dados do Interessado
      </h2>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3 lg:grid-cols-5">
        <div className="space-y-1.5">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Código do Interessado
          </Label>
          <Input
            className="touch-target rounded-md border-input bg-card text-base"
            placeholder="Ex: 00123"
            value={data.codigo}
            onChange={(e) => onChange({ ...data, codigo: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Nome do Interessado
          </Label>
          <Input
            className="touch-target rounded-md border-input bg-card text-base"
            placeholder="Nome completo"
            value={data.nome}
            onChange={(e) => onChange({ ...data, nome: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Idade
          </Label>
          <div className="relative">
            <Input
              className="touch-target rounded-md border-input bg-card text-base pr-9"
              placeholder="Ex: 18"
              value={data.idade}
              onChange={(e) => onChange({ ...data, idade: e.target.value })}
            />
            <button
              type="button"
              onClick={() => setShowResponsavel(!showResponsavel)}
              className={`absolute bottom-1 right-1 flex h-6 w-6 items-center justify-center rounded-full transition-colors ${
                showResponsavel
                  ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
                  : "bg-muted text-muted-foreground hover:bg-muted-foreground/20"
              }`}
              title={showResponsavel ? "Ocultar responsável" : "Adicionar responsável"}
            >
              {showResponsavel ? <X className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
            </button>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Estudo / Carreira
          </Label>
          <Input
            className="touch-target rounded-md border-input bg-card text-base"
            placeholder="Ex: Ensino Médio"
            value={data.estudo}
            onChange={(e) => onChange({ ...data, estudo: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Instrutor
          </Label>
          <Input
            className="touch-target rounded-md border-input bg-card text-base"
            placeholder="Nome do instrutor"
            value={data.instrutor}
            onChange={(e) => onChange({ ...data, instrutor: e.target.value })}
          />
        </div>
      </div>

      {showResponsavel && (
        <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-3 lg:grid-cols-5">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Responsável
            </Label>
            <Input
              className="touch-target rounded-md border-input bg-card text-base"
              placeholder="Nome do responsável"
              value={data.responsavel}
              onChange={(e) => onChange({ ...data, responsavel: e.target.value })}
            />
          </div>
        </div>
      )}
    </header>
  );
}
