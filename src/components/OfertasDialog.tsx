import { useEffect, useMemo, useState } from "react";
import { ConfirmacionAcuerdoDialog } from "@/components/ConfirmacionAcuerdoDialog";
import { PagoFlowDialog } from "@/components/PagoFlowDialog";
import { Star, Calendar, CheckCircle2, Sparkles, ShieldCheck, Briefcase, User } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import type { Solicitud } from "@/types/solicitud";
import { ordenarPorMejor, razonMejorOferta, type Oferta } from "@/lib/ofertas";
import { useOfertasStore } from "@/store/ofertasStore";
import { TrabajadorPerfilDialog } from "@/components/TrabajadorPerfilDialog";

const formatCOP = (n: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);

const formatFecha = (fecha: string) =>
  new Date(`${fecha}T00:00:00`).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

interface Props {
  solicitud: Solicitud | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAceptar?: (solicitudId: string, oferta: Oferta) => void;
}

const Estrellas = ({ valor }: { valor: number }) => (
  <span className="inline-flex items-center gap-1 text-sm">
    <Star size={14} className="fill-yellow-400 text-yellow-400" />
    <span className="font-semibold">{valor.toFixed(1)}</span>
  </span>
);

const OfertaCard = ({
  oferta,
  destacada,
  razon,
  onAceptar,
  onVerPerfil,
}: {
  oferta: Oferta;
  destacada?: boolean;
  razon?: string;
  onAceptar: () => void;
  onVerPerfil: () => void;
}) => (
  <div
    className={[
      "rounded-xl border p-4 transition-all",
      oferta.expirada
        ? "border-border bg-muted/30 opacity-70"
        : destacada
          ? "border-primary/60 bg-primary/5 shadow-elevated relative"
          : "border-border bg-card hover:border-primary/30",
    ].join(" ")}
  >
    {destacada && !oferta.expirada && (
      <div className="absolute -top-3 left-4">
        <Badge className="bg-primary text-primary-foreground gap-1 shadow-soft">
          <Sparkles size={12} />
          Mejor opción recomendada
        </Badge>
      </div>
    )}

    <div className="flex items-start gap-3">
      <Avatar className="h-12 w-12 shrink-0 border">
        <AvatarImage src={oferta.fotoUrl} alt={oferta.nombre} />
        <AvatarFallback>
          <User size={18} />
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="font-semibold truncate">{oferta.nombre}</p>
          <Estrellas valor={oferta.calificacion} />
          {oferta.expirada && (
            <Badge variant="outline" className="text-xs text-muted-foreground border-muted-foreground/30">
              Oferta expirada
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
          {oferta.verificado && (
            <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
              <ShieldCheck size={12} /> Verificado
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <Briefcase size={12} /> {oferta.trabajosCompletados} trabajos
          </span>
        </div>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-3 mt-4">
      <div className="rounded-lg bg-muted/40 p-3">
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Precio ofertado</p>
        <p className="text-lg font-bold text-primary mt-0.5">{formatCOP(oferta.precio)}</p>
      </div>
      <div className="rounded-lg bg-muted/40 p-3">
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
          <Calendar size={11} /> Inicia el
        </p>
        <p className="text-sm font-semibold mt-0.5">
          {oferta.fechaInicio ? formatFecha(oferta.fechaInicio) : "A confirmar"}
        </p>
      </div>
    </div>

    <p className="text-sm text-muted-foreground mt-3 line-clamp-3">"{oferta.mensaje}"</p>

    {destacada && !oferta.expirada && razon && (
      <p className="text-xs text-primary/90 font-medium mt-3 bg-primary/10 rounded-md px-2.5 py-1.5">
        ⭐ {razon}
      </p>
    )}

    <div className="flex flex-col sm:flex-row gap-2 mt-4">
      <Button variant="outline" size="sm" className="sm:flex-1" onClick={onVerPerfil}>
        Ver perfil
      </Button>
      <Button
        size="sm"
        className={destacada && !oferta.expirada ? "sm:flex-[2] shadow-elevated" : "sm:flex-1"}
        onClick={onAceptar}
        disabled={oferta.expirada}
      >
        <CheckCircle2 size={14} />
        {oferta.expirada ? "Expirada" : "Aceptar oferta"}
      </Button>
    </div>
  </div>
);

export const OfertasDialog = ({ solicitud, open, onOpenChange, onAceptar }: Props) => {
  const { toast } = useToast();
  const fetchBySolicitud = useOfertasStore((s) => s.fetchBySolicitud);
  const aceptarOferta = useOfertasStore((s) => s.aceptar);
  const ofertasBySolicitud = useOfertasStore((s) => s.bySolicitud);
  const [ofertaPendiente, setOfertaPendiente] = useState<Oferta | null>(null);
  const [ofertaPago, setOfertaPago] = useState<Oferta | null>(null);
  const [perfilUsername, setPerfilUsername] = useState<string | null>(null);

  useEffect(() => {
    if (solicitud && open) fetchBySolicitud(solicitud.id);
  }, [solicitud, open, fetchBySolicitud]);

  const ofertasOrdenadas = useMemo(() => {
    if (!solicitud) return [];
    const ofertas = ofertasBySolicitud[solicitud.id] ?? [];
    const vigentes = ofertas.filter((o) => !o.expirada);
    const expiradas = ofertas.filter((o) => o.expirada);
    return [...ordenarPorMejor(vigentes, solicitud.presupuesto), ...expiradas];
  }, [solicitud, ofertasBySolicitud]);

  if (!solicitud) return null;

  const handleSeleccionar = (oferta: Oferta) => {
    setOfertaPendiente(oferta);
  };

  const handleConfirmar = (_solicitudId: string, oferta: Oferta) => {
    // Tras aceptar el acuerdo, abrimos la pantalla de pago (escrow)
    setOfertaPendiente(null);
    setOfertaPago(oferta);
  };

  const handlePagoCompletado = async (solicitudId: string, oferta: Oferta) => {
    await aceptarOferta(oferta.id, solicitudId);
    toast({
      title: "Pago asegurado en escrow",
      description: `Aceptaste a ${oferta.nombre} por ${formatCOP(oferta.precio)}. El trabajo está en ejecución.`,
    });
    onAceptar?.(solicitudId, oferta);
  };

  const handleCerrarPago = () => {
    setOfertaPago(null);
    onOpenChange(false);
  };

  const mejor = ofertasOrdenadas[0];
  const razon = mejor ? razonMejorOferta(mejor, solicitud.presupuesto) : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden h-[100dvh] sm:h-auto sm:max-h-[90vh] w-screen sm:w-full sm:rounded-lg rounded-none grid grid-rows-[auto_1fr]">
        <DialogHeader className="px-5 sm:px-6 pt-6 pb-4 border-b shrink-0">
          <DialogTitle className="text-xl">Ofertas recibidas</DialogTitle>
          <DialogDescription className="line-clamp-2">
            {solicitud.descripcion}
          </DialogDescription>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
            <span>
              Presupuesto:{" "}
              <span className="font-semibold text-foreground">
                {formatCOP(solicitud.presupuesto)}
              </span>
            </span>
            <span>
              {ofertasOrdenadas.length}{" "}
              {ofertasOrdenadas.length === 1 ? "oferta recibida" : "ofertas recibidas"}
            </span>
          </div>
        </DialogHeader>

        <ScrollArea className="min-h-0">
          <div className="px-5 sm:px-6 py-5 space-y-4">
            {ofertasOrdenadas.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-12">
                Aún no has recibido ofertas para este trabajo.
              </p>
            ) : (
              ofertasOrdenadas.map((o, i) => (
                <div key={o.id} className={i === 0 ? "pt-3" : ""}>
                  <OfertaCard
                    oferta={o}
                    destacada={i === 0}
                    razon={i === 0 ? razon : undefined}
                    onAceptar={() => handleSeleccionar(o)}
                    onVerPerfil={() => setPerfilUsername(o.trabajadorUsername)}
                  />
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
      <ConfirmacionAcuerdoDialog
        solicitud={solicitud}
        oferta={ofertaPendiente}
        open={!!ofertaPendiente}
        onOpenChange={(v) => !v && setOfertaPendiente(null)}
        onConfirmar={handleConfirmar}
      />
      <PagoFlowDialog
        solicitud={solicitud}
        oferta={ofertaPago}
        open={!!ofertaPago}
        onOpenChange={(v) => !v && setOfertaPago(null)}
        onPagoCompletado={handlePagoCompletado}
        onIrAlSeguimiento={handleCerrarPago}
      />
      <TrabajadorPerfilDialog
        username={perfilUsername}
        open={!!perfilUsername}
        onOpenChange={(v) => !v && setPerfilUsername(null)}
      />
    </Dialog>
  );
};
