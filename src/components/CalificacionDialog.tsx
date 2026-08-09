import { useEffect, useState } from "react";
import { Star, ShieldCheck, CheckCircle2, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { TIPOS_TRABAJO } from "@/types/solicitud";
import type { Solicitud } from "@/types/solicitud";
import { useCalificacionesStore } from "@/store/calificacionesStore";
import { ApiError } from "@/lib/apiClient";

const formatCOP = (n: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);

const tipoLabel = (t: string) => TIPOS_TRABAJO.find((x) => x.value === t)?.label ?? t;

const ETIQUETAS = [
  "Puntual",
  "Profesional",
  "Buena comunicación",
  "Trabajo limpio",
  "Recomendado",
  "Excelente calidad",
];

interface Props {
  solicitud: Solicitud | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onEnviado?: (id: string, score: number) => void;
}

export const CalificacionDialog = ({ solicitud, open, onOpenChange, onEnviado }: Props) => {
  const { toast } = useToast();
  const crearCalificacion = useCalificacionesStore((s) => s.crear);
  const [score, setScore] = useState(0);
  const [hover, setHover] = useState(0);
  const [comentario, setComentario] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (open) {
      setScore(0);
      setHover(0);
      setComentario("");
      setTags([]);
    }
  }, [open]);

  if (!solicitud) return null;

  const toggleTag = (t: string) =>
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  const handleEnviar = async () => {
    if (score === 0) {
      toast({
        title: "Selecciona una calificación",
        description: "Toca las estrellas para calificar el servicio.",
        variant: "destructive",
      });
      return;
    }
    setEnviando(true);
    try {
      await crearCalificacion({
        solicitudId: solicitud.id,
        estrellas: score,
        comentario: comentario.trim() || undefined,
        etiquetas: tags,
      });
      onEnviado?.(solicitud.id, score);
      toast({
        title: "¡Reseña enviada!",
        description: "Gracias por tu opinión, ayudas a mejorar la comunidad.",
      });
      onOpenChange(false);
    } catch (e) {
      toast({
        title: "No se pudo enviar la reseña",
        description: e instanceof ApiError ? e.message : "Error de conexión con el servidor",
        variant: "destructive",
      });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden h-[100dvh] sm:h-auto sm:max-h-[92vh] w-screen sm:w-full sm:rounded-lg rounded-none grid grid-rows-[auto_1fr_auto]">
        <DialogHeader className="px-5 sm:px-6 pt-6 pb-4 border-b shrink-0 bg-gradient-to-br from-emerald-500/10 to-transparent">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 size={20} />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-lg sm:text-xl">Pago liberado con éxito</DialogTitle>
              <DialogDescription>
                Califica el servicio para finalizar.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="min-h-0">
          <div className="px-5 sm:px-6 py-5 space-y-4">
            {/* Resumen */}
            <div className="rounded-xl border bg-card p-4">
              <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white gap-1 mb-3">
                <ShieldCheck size={11} />
                Trabajo completado
              </Badge>
              <p className="text-xs text-muted-foreground">{tipoLabel(solicitud.tipo)}</p>
              <p className="font-semibold line-clamp-2">{solicitud.descripcion}</p>
              <div className="flex items-center justify-between mt-3 pt-3 border-t">
                <span className="text-xs text-muted-foreground">Pago liberado</span>
                <span className="font-bold text-emerald-700">{formatCOP(solicitud.presupuesto)}</span>
              </div>
            </div>

            {/* Estrellas */}
            <div className="rounded-xl border bg-card p-5 text-center">
              <p className="text-sm font-semibold mb-1">¿Cómo calificas el servicio?</p>
              <p className="text-xs text-muted-foreground mb-4">Tu opinión ayuda a otros usuarios.</p>
              <div className="flex justify-center gap-1.5">
                {[1, 2, 3, 4, 5].map((n) => {
                  const filled = (hover || score) >= n;
                  return (
                    <button
                      key={n}
                      type="button"
                      onMouseEnter={() => setHover(n)}
                      onMouseLeave={() => setHover(0)}
                      onClick={() => setScore(n)}
                      className="p-1 transition-transform hover:scale-110 active:scale-95"
                      aria-label={`${n} estrellas`}
                    >
                      <Star
                        size={36}
                        className={cn(
                          "transition-colors",
                          filled ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/40",
                        )}
                      />
                    </button>
                  );
                })}
              </div>
              {score > 0 && (
                <p className="text-xs text-muted-foreground mt-3">
                  {score === 5
                    ? "¡Excelente! 🎉"
                    : score >= 4
                      ? "Muy bueno"
                      : score >= 3
                        ? "Bueno"
                        : score >= 2
                          ? "Regular"
                          : "Necesita mejorar"}
                </p>
              )}
            </div>

            {/* Tags */}
            <div className="rounded-xl border bg-card p-4">
              <p className="text-xs font-semibold mb-3 flex items-center gap-1">
                <Sparkles size={12} className="text-primary" />
                Destaca lo positivo
              </p>
              <div className="flex flex-wrap gap-2">
                {ETIQUETAS.map((t) => {
                  const active = tags.includes(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => toggleTag(t)}
                      className={cn(
                        "text-xs px-3 py-1.5 rounded-full border transition-all",
                        active
                          ? "bg-primary text-primary-foreground border-primary shadow-soft"
                          : "bg-background border-border hover:border-primary/40",
                      )}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Comentario */}
            <div className="rounded-xl border bg-card p-4">
              <p className="text-xs font-semibold mb-2">Comentario (opcional)</p>
              <Textarea
                placeholder="Cuéntanos cómo fue tu experiencia..."
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                rows={3}
                maxLength={300}
              />
              <p className="text-[10px] text-muted-foreground text-right mt-1">
                {comentario.length}/300
              </p>
            </div>
          </div>
        </ScrollArea>

        <div className="border-t bg-background/95 backdrop-blur px-5 sm:px-6 py-4 shrink-0 flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
          <Button
            variant="outline"
            className="sm:flex-1"
            onClick={() => onOpenChange(false)}
            disabled={enviando}
          >
            Más tarde
          </Button>
          <Button
            className="sm:flex-[2] bg-primary hover:bg-primary/90 shadow-elevated"
            onClick={handleEnviar}
            disabled={score === 0 || enviando}
          >
            <Star size={16} />
            {enviando ? "Enviando..." : "Enviar reseña"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
