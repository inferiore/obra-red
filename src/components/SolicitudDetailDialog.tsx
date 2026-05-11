import { useState } from "react";
import { DollarSign, MapPin, User, Calendar, Send, MessageSquare } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EstadoBadge } from "@/components/EstadoBadge";
import { TIPOS_TRABAJO, type Solicitud } from "@/types/solicitud";
import { useToast } from "@/hooks/use-toast";

const tipoLabel = (tipo: string) =>
  TIPOS_TRABAJO.find((t) => t.value === tipo)?.label ?? tipo;

const formatCOP = (n: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);

interface Props {
  solicitud: Solicitud | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOfertaEnviada?: (solicitudId: string, monto: number, mensaje: string) => void;
}

export const SolicitudDetailDialog = ({ solicitud, open, onOpenChange, onOfertaEnviada }: Props) => {
  const { toast } = useToast();
  const [showOferta, setShowOferta] = useState(false);
  const [monto, setMonto] = useState("");
  const [mensaje, setMensaje] = useState("");

  if (!solicitud) return null;

  const resetAndClose = () => {
    setShowOferta(false);
    setMonto("");
    setMensaje("");
    onOpenChange(false);
  };

  const enviarOferta = () => {
    const valor = Number(monto);
    if (!valor || valor <= 0) {
      toast({
        title: "Monto inválido",
        description: "Ingresa un valor mayor a cero.",
        variant: "destructive",
      });
      return;
    }
    if (mensaje.trim().length < 10) {
      toast({
        title: "Mensaje muy corto",
        description: "Describe brevemente tu propuesta (mínimo 10 caracteres).",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Oferta enviada",
      description: `Tu propuesta de ${formatCOP(valor)} fue enviada al cliente.`,
    });
    onOfertaEnviada?.(solicitud.id, valor, mensaje.trim());
    resetAndClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? resetAndClose() : onOpenChange(v))}>
      <DialogContent className="max-w-xl p-0 gap-0 overflow-hidden h-[85vh] sm:h-auto sm:max-h-[90vh] grid grid-rows-[auto_1fr_auto]">
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                {tipoLabel(solicitud.tipo)}
              </p>
              <DialogTitle className="text-xl mt-1">Detalle de la solicitud</DialogTitle>
              <DialogDescription className="mt-1">
                Revisa la información completa antes de enviar tu oferta.
              </DialogDescription>
            </div>
            <EstadoBadge estado={solicitud.estado} />
          </div>
        </DialogHeader>

        <ScrollArea className="min-h-0 px-6 py-4">
          <div className="space-y-5">
            <section>
              <h4 className="text-sm font-semibold mb-2">Descripción</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {solicitud.descripcion}
              </p>
            </section>

            <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                  <DollarSign size={12} /> Presupuesto del cliente
                </p>
                <p className="text-lg font-bold text-primary mt-1">
                  {formatCOP(solicitud.presupuesto)}
                </p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                  <Calendar size={12} /> Publicado
                </p>
                <p className="text-sm font-medium mt-1">
                  {new Date(solicitud.createdAt).toLocaleDateString("es-CO", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </section>

            <section className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <MapPin size={12} /> Ubicación
              </p>
              <p className="text-sm mt-1">{solicitud.ubicacion}</p>
            </section>

            <section className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <User size={12} /> Cliente
              </p>
              <p className="text-sm mt-1 font-medium">{solicitud.clienteNombre}</p>
            </section>

            {solicitud.fotos.length > 0 && (
              <section>
                <h4 className="text-sm font-semibold mb-2">Fotos</h4>
                <div className="grid grid-cols-3 gap-2">
                  {solicitud.fotos.map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      alt={`foto-${i}`}
                      className="w-full h-24 object-cover rounded-md border"
                    />
                  ))}
                </div>
              </section>
            )}

            {showOferta && (
              <section className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
                <h4 className="text-sm font-semibold flex items-center gap-1.5">
                  <MessageSquare size={14} className="text-primary" />
                  Tu propuesta
                </h4>
                <div className="space-y-2">
                  <Label htmlFor="monto">Monto de tu oferta (COP)</Label>
                  <Input
                    id="monto"
                    type="number"
                    inputMode="numeric"
                    placeholder="Ej: 230000"
                    value={monto}
                    onChange={(e) => setMonto(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mensaje">Mensaje al cliente</Label>
                  <Textarea
                    id="mensaje"
                    placeholder="Cuéntale tu experiencia, materiales incluidos, tiempo estimado..."
                    rows={4}
                    maxLength={500}
                    value={mensaje}
                    onChange={(e) => setMensaje(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {mensaje.length}/500
                  </p>
                </div>
              </section>
            )}
          </div>
        </ScrollArea>

        <div className="px-6 py-4 border-t bg-muted/20 shrink-0 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          {showOferta ? (
            <>
              <Button variant="outline" onClick={() => setShowOferta(false)}>
                Cancelar
              </Button>
              <Button onClick={enviarOferta}>
                <Send size={14} />
                Enviar oferta
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={resetAndClose}>
                Cerrar
              </Button>
              <Button onClick={() => setShowOferta(true)}>
                <DollarSign size={14} />
                Enviar oferta de valor
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
