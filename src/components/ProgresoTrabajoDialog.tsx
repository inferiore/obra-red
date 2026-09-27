import { useState } from "react";
import {
  Clock,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Send,
  User,
  AlertTriangle,
  Camera,
  IdCard,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { CarnetTrabajadorDialog } from "@/components/CarnetTrabajadorDialog";
import { puedeVerCarnet } from "@/lib/carnet";
import { TIPOS_TRABAJO, ESTADO_LABELS } from "@/types/solicitud";
import type { Solicitud } from "@/types/solicitud";

const tipoLabel = (t: string) => TIPOS_TRABAJO.find((x) => x.value === t)?.label ?? t;

const TIMELINE = [
  { label: "Pago asegurado en escrow", done: true, icon: Lock },
  { label: "Trabajador asignado", done: true, icon: User },
  { label: "Trabajo en ejecución", done: true, icon: Clock, current: true },
  { label: "Evidencias enviadas", done: false, icon: CheckCircle2 },
  { label: "Pago liberado", done: false, icon: ShieldCheck },
];

interface Props {
  solicitud: Solicitud | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onAbrirEvidenciaDisputa?: (id: string) => void;
}

interface Mensaje {
  autor: "cliente" | "trabajador";
  texto: string;
  hora: string;
}

export const ProgresoTrabajoDialog = ({
  solicitud,
  open,
  onOpenChange,
  onAbrirEvidenciaDisputa,
}: Props) => {
  const [mensajes, setMensajes] = useState<Mensaje[]>([
    {
      autor: "trabajador",
      texto: "¡Hola! Ya estoy en camino, llego en aproximadamente 30 minutos.",
      hora: "09:15",
    },
    {
      autor: "trabajador",
      texto: "Iniciando el trabajo, te enviaré evidencias pronto.",
      hora: "10:02",
    },
  ]);
  const [draft, setDraft] = useState("");
  const [carnetOpen, setCarnetOpen] = useState(false);

  if (!solicitud) return null;

  const enviar = () => {
    const t = draft.trim();
    if (!t) return;
    setMensajes((prev) => [
      ...prev,
      {
        autor: "cliente",
        texto: t,
        hora: new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
    setDraft("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden h-[100dvh] sm:h-auto sm:max-h-[92vh] w-screen sm:w-full sm:rounded-lg rounded-none grid grid-rows-[auto_1fr_auto]">
        <DialogHeader className="px-5 sm:px-6 pt-6 pb-4 border-b shrink-0 bg-gradient-to-br from-primary/5 to-transparent">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Clock size={20} />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-lg sm:text-xl">Seguimiento del trabajo</DialogTitle>
              <DialogDescription className="line-clamp-1">
                {tipoLabel(solicitud.tipo)} · {solicitud.descripcion}
              </DialogDescription>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <Badge className="bg-amber-500/10 text-amber-700 hover:bg-amber-500/10 border-amber-500/20 gap-1">
              <Clock size={11} />
              {ESTADO_LABELS[solicitud.estado]}
            </Badge>
            {puedeVerCarnet(solicitud) && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs gap-1"
                onClick={() => setCarnetOpen(true)}
              >
                <IdCard size={12} />
                Ver carnet
              </Button>
            )}
          </div>
        </DialogHeader>

        <ScrollArea className="min-h-0">
          <div className="px-5 sm:px-6 py-5 space-y-4">
            {solicitud.estado === "disputa" && onAbrirEvidenciaDisputa && (
              <div className="rounded-xl border border-red-200 dark:border-red-500/30 bg-card p-4">
                <div className="flex items-start gap-2 mb-3">
                  <AlertTriangle size={16} className="text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-900 dark:text-red-200">
                      Esta solicitud está en disputa
                    </p>
                    <p className="text-xs text-red-800/80 dark:text-red-200/80 mt-0.5">
                      Sube evidencia adicional para sustentar tu posición. Nuestro equipo la
                      revisará junto con la del trabajador.
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                  onClick={() => onAbrirEvidenciaDisputa(solicitud.id)}
                >
                  <Camera size={14} />
                  Ver y subir evidencia de disputa
                </Button>
              </div>
            )}

            {/* Timeline */}
            <div className="rounded-xl border bg-card p-4">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-3">
                Estado del proceso
              </p>
              <ol className="space-y-3">
                {TIMELINE.map((step, i) => {
                  const Icon = step.icon;
                  const active = step.done || step.current;
                  return (
                    <li key={i} className="flex items-start gap-3">
                      <div
                        className={
                          active
                            ? "h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0"
                            : "h-8 w-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center shrink-0"
                        }
                      >
                        <Icon size={14} />
                      </div>
                      <div className="flex-1 pt-1">
                        <p className={active ? "text-sm font-medium" : "text-sm text-muted-foreground"}>
                          {step.label}
                        </p>
                        {step.current && (
                          <p className="text-xs text-primary mt-0.5">Estado actual</p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>

            {/* Escrow info */}
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <div className="flex items-center gap-2 mb-1">
                <Lock size={14} className="text-emerald-600" />
                <p className="text-sm font-semibold text-emerald-700">Tu dinero está protegido</p>
              </div>
              <p className="text-xs text-foreground/80">
                Los fondos se liberarán al trabajador solo cuando apruebes las evidencias del trabajo.
              </p>
            </div>

            {/* Chat */}
            <div className="rounded-xl border bg-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare size={14} className="text-primary" />
                <p className="text-sm font-semibold">Chat con el trabajador</p>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {mensajes.map((m, i) => (
                  <div
                    key={i}
                    className={
                      m.autor === "cliente"
                        ? "flex justify-end"
                        : "flex justify-start"
                    }
                  >
                    <div
                      className={
                        m.autor === "cliente"
                          ? "max-w-[80%] rounded-2xl rounded-br-sm bg-primary text-primary-foreground px-3 py-2 text-sm"
                          : "max-w-[80%] rounded-2xl rounded-bl-sm bg-muted px-3 py-2 text-sm"
                      }
                    >
                      <p>{m.texto}</p>
                      <p className="text-[10px] opacity-70 mt-0.5 text-right">{m.hora}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="border-t bg-background/95 backdrop-blur px-5 sm:px-6 py-3 shrink-0 flex gap-2">
          <Input
            placeholder="Escribe un mensaje..."
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && enviar()}
          />
          <Button onClick={enviar} disabled={!draft.trim()}>
            <Send size={16} />
          </Button>
        </div>
      </DialogContent>

      <CarnetTrabajadorDialog
        solicitud={solicitud}
        trabajadorUsername={solicitud.trabajadorAsignado ?? null}
        open={carnetOpen}
        onOpenChange={setCarnetOpen}
      />
    </Dialog>
  );
};
