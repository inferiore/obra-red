import { useState } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  Star,
  Briefcase,
  Clock,
  MapPin,
  User,
  Lock,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import type { Solicitud } from "@/types/solicitud";
import type { Oferta } from "@/lib/ofertas";
import { TIPOS_TRABAJO } from "@/types/solicitud";

const formatCOP = (n: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);

const tipoLabel = (tipo: string) =>
  TIPOS_TRABAJO.find((t) => t.value === tipo)?.label ?? tipo;

interface Props {
  solicitud: Solicitud | null;
  oferta: Oferta | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmar: (solicitudId: string, oferta: Oferta) => void;
}

const TERMINOS = [
  "El pago será retenido por la plataforma (escrow) hasta que apruebes el trabajo.",
  "El trabajador se compromete a cumplir el alcance, calidad y plazo acordados.",
  "Puedes solicitar correcciones antes de aprobar y liberar el pago.",
  "En caso de conflicto, puedes abrir una disputa para mediación de ObraRed.",
  "Los datos del acuerdo quedarán registrados como evidencia digital.",
];

export const ConfirmacionAcuerdoDialog = ({
  solicitud,
  oferta,
  open,
  onOpenChange,
  onConfirmar,
}: Props) => {
  const [aceptado, setAceptado] = useState(false);
  const [verCompleto, setVerCompleto] = useState(false);

  if (!solicitud || !oferta) return null;

  const handleConfirmar = () => {
    if (!aceptado) return;
    onConfirmar(solicitud.id, oferta);
    setAceptado(false);
    setVerCompleto(false);
  };

  const handleClose = (v: boolean) => {
    if (!v) {
      setAceptado(false);
      setVerCompleto(false);
    }
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden h-[100dvh] sm:h-auto sm:max-h-[92vh] w-screen sm:w-full sm:rounded-lg rounded-none grid grid-rows-[auto_1fr_auto]">
        {/* Header */}
        <DialogHeader className="px-5 sm:px-6 pt-6 pb-4 border-b shrink-0 bg-gradient-to-br from-primary/5 to-transparent">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <ShieldCheck size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-lg sm:text-xl">
                Confirmación de acuerdo de servicio
              </DialogTitle>
              <DialogDescription>
                Revisa los detalles antes de continuar al pago.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Body scrollable */}
        <ScrollArea className="min-h-0">
          <div className="px-5 sm:px-6 py-5 space-y-4">
            {/* Trabajador */}
            <div className="rounded-xl border bg-card p-4 shadow-soft">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-3">
                Trabajador seleccionado
              </p>
              <div className="flex items-start gap-3">
                <Avatar className="h-14 w-14 border-2 border-primary/20">
                  <AvatarImage src={oferta.fotoUrl} alt={oferta.nombre} />
                  <AvatarFallback>
                    <User size={20} />
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <p className="font-semibold truncate">{oferta.nombre}</p>
                    {oferta.verificado && (
                      <Badge className="bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10 border-emerald-500/20 gap-1 h-5">
                        <ShieldCheck size={11} />
                        Verificado
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Star size={12} className="fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold text-foreground">
                        {oferta.calificacion.toFixed(1)}
                      </span>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Briefcase size={12} />
                      {oferta.trabajosCompletados} trabajos completados
                    </span>
                  </div>
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 mt-2 text-xs"
                  >
                    Ver perfil completo
                  </Button>
                </div>
              </div>
            </div>

            {/* Resumen del servicio */}
            <div className="rounded-xl border bg-card p-4 shadow-soft">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-3">
                Resumen del servicio
              </p>
              <p className="text-xs text-muted-foreground">
                {tipoLabel(solicitud.tipo)}
              </p>
              <h3 className="font-semibold text-base mt-0.5 line-clamp-2">
                {solicitud.descripcion}
              </h3>

              {solicitud.ubicacion && (
                <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                  <MapPin size={13} />
                  <span className="line-clamp-1">{solicitud.ubicacion}</span>
                </div>
              )}

              <Separator className="my-4" />

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-primary/5 border border-primary/10 p-3">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    Precio acordado
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-primary mt-1">
                    {formatCOP(oferta.precio)}
                  </p>
                </div>
                <div className="rounded-lg bg-muted/40 p-3">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground inline-flex items-center gap-1">
                    <Clock size={11} /> Tiempo estimado
                  </p>
                  <p className="text-xl sm:text-2xl font-bold mt-1">
                    {oferta.tiempoEstimadoDias}
                    <span className="text-sm font-medium text-muted-foreground ml-1">
                      {oferta.tiempoEstimadoDias === 1 ? "día" : "días"}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Términos */}
            <div className="rounded-xl border bg-card p-4 shadow-soft">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-3">
                Términos del servicio
              </p>
              <ul className="space-y-2.5">
                {TERMINOS.slice(0, verCompleto ? TERMINOS.length : 4).map(
                  (t, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle2
                        size={16}
                        className="text-emerald-600 shrink-0 mt-0.5"
                      />
                      <span className="text-foreground/90">{t}</span>
                    </li>
                  ),
                )}
              </ul>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 h-8 text-xs"
                onClick={() => setVerCompleto((v) => !v)}
              >
                {verCompleto ? (
                  <>
                    <ChevronUp size={14} /> Ver menos
                  </>
                ) : (
                  <>
                    <ChevronDown size={14} /> Ver términos completos
                  </>
                )}
              </Button>
            </div>

            {/* Confianza */}
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Lock size={16} className="text-emerald-600" />
                <p className="font-semibold text-sm text-emerald-700">
                  Tu pago está protegido
                </p>
              </div>
              <ul className="space-y-1.5 text-xs text-foreground/80">
                <li>• Tu dinero estará retenido hasta que apruebes el trabajo.</li>
                <li>• ObraRed actúa como intermediario seguro entre las partes.</li>
                <li>• Podrás revisar evidencias antes de liberar el pago.</li>
              </ul>
            </div>

            {/* Aceptación */}
            <label
              htmlFor="acepto-terminos"
              className="flex items-start gap-3 p-4 rounded-xl border-2 border-dashed cursor-pointer hover:bg-muted/40 transition-colors data-[checked=true]:border-primary data-[checked=true]:bg-primary/5"
              data-checked={aceptado}
            >
              <Checkbox
                id="acepto-terminos"
                checked={aceptado}
                onCheckedChange={(v) => setAceptado(v === true)}
                className="mt-0.5 transition-transform data-[state=checked]:scale-110"
              />
              <span className="text-sm leading-snug">
                Acepto los{" "}
                <span className="font-semibold underline">
                  términos del servicio
                </span>{" "}
                y las condiciones de la plataforma ObraRed.
              </span>
            </label>
          </div>
        </ScrollArea>

        {/* Footer fijo */}
        <div className="border-t bg-background/95 backdrop-blur px-5 sm:px-6 py-4 shrink-0 flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
          <Button
            variant="outline"
            className="sm:flex-1"
            onClick={() => handleClose(false)}
          >
            <X size={16} />
            Cancelar
          </Button>
          <Button
            className="sm:flex-[2] bg-emerald-600 hover:bg-emerald-700 text-white shadow-elevated transition-transform active:scale-[0.98] disabled:bg-muted disabled:text-muted-foreground"
            disabled={!aceptado}
            onClick={handleConfirmar}
          >
            <ShieldCheck size={16} />
            Confirmar y continuar al pago
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
