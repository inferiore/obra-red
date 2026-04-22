import { cn } from "@/lib/utils";
import { ESTADO_LABELS, type SolicitudEstado } from "@/types/solicitud";
import { CheckCircle2, Circle, FileEdit, Loader2 } from "lucide-react";

const STYLES: Record<SolicitudEstado, string> = {
  borrador: "bg-muted text-muted-foreground border-border",
  publicado: "bg-primary/10 text-primary border-primary/20",
  ejecucion: "bg-warning/10 text-warning border-warning/30",
  finalizado: "bg-success/10 text-success border-success/30",
};

const ICONS: Record<SolicitudEstado, typeof Circle> = {
  borrador: FileEdit,
  publicado: Circle,
  ejecucion: Loader2,
  finalizado: CheckCircle2,
};

export const EstadoBadge = ({ estado, className }: { estado: SolicitudEstado; className?: string }) => {
  const Icon = ICONS[estado];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        STYLES[estado],
        className,
      )}
    >
      <Icon size={12} className={estado === "ejecucion" ? "animate-spin" : ""} />
      {ESTADO_LABELS[estado]}
    </span>
  );
};
