import { useEffect, useState } from "react";
import {
  CreditCard,
  Lock,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  Smartphone,
  Building2,
  ArrowRight,
  Sparkles,
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
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
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
  onOpenChange: (v: boolean) => void;
  onPagoCompletado: (solicitudId: string, oferta: Oferta) => void;
  onIrAlSeguimiento?: () => void;
}

type Metodo = "tarjeta" | "pse" | "nequi";

const METODOS: {
  id: Metodo;
  label: string;
  desc: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}[] = [
  { id: "tarjeta", label: "Tarjeta de crédito/débito", desc: "Visa, Mastercard, Amex", icon: CreditCard },
  { id: "pse", label: "PSE", desc: "Débito desde tu banco", icon: Building2 },
  { id: "nequi", label: "Nequi / Daviplata", desc: "Pago desde billetera", icon: Smartphone },
];

export const PagoFlowDialog = ({
  solicitud,
  oferta,
  open,
  onOpenChange,
  onPagoCompletado,
  onIrAlSeguimiento,
}: Props) => {
  const [step, setStep] = useState<"pago" | "procesando" | "exito">("pago");
  const [metodo, setMetodo] = useState<Metodo>("tarjeta");
  const [numero, setNumero] = useState("");
  const [vence, setVence] = useState("");
  const [cvv, setCvv] = useState("");
  const [titular, setTitular] = useState("");

  useEffect(() => {
    if (open) {
      setStep("pago");
      setNumero("");
      setVence("");
      setCvv("");
      setTitular("");
      setMetodo("tarjeta");
    }
  }, [open]);

  if (!solicitud || !oferta) return null;

  const total = oferta.precio;
  const comision = Math.round(total * 0.05);
  const granTotal = total + comision;

  const formValido =
    metodo !== "tarjeta" ||
    (numero.replace(/\s/g, "").length >= 13 &&
      /^\d{2}\/\d{2}$/.test(vence) &&
      cvv.length >= 3 &&
      titular.trim().length >= 3);

  const handlePagar = () => {
    if (!formValido) return;
    setStep("procesando");
    setTimeout(() => {
      setStep("exito");
      onPagoCompletado(solicitud.id, oferta);
    }, 1600);
  };

  const handleSeguimiento = () => {
    onOpenChange(false);
    onIrAlSeguimiento?.();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => step !== "procesando" && onOpenChange(v)}>
      <DialogContent className="max-w-xl p-0 gap-0 overflow-hidden h-[100dvh] sm:h-auto sm:max-h-[92vh] w-screen sm:w-full sm:rounded-lg rounded-none grid grid-rows-[auto_1fr_auto]">
        {step === "pago" && (
          <>
            <DialogHeader className="px-5 sm:px-6 pt-6 pb-4 border-b shrink-0 bg-gradient-to-br from-primary/5 to-transparent">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Lock size={20} />
                </div>
                <div className="min-w-0">
                  <DialogTitle className="text-lg sm:text-xl">Pago seguro</DialogTitle>
                  <DialogDescription>
                    Tu dinero será retenido hasta que apruebes el trabajo.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <ScrollArea className="min-h-0">
              <div className="px-5 sm:px-6 py-5 space-y-4">
                {/* Resumen */}
                <div className="rounded-xl border bg-card p-4 shadow-soft">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-2">
                    Resumen del servicio
                  </p>
                  <p className="text-xs text-muted-foreground">{tipoLabel(solicitud.tipo)}</p>
                  <p className="font-semibold line-clamp-2">{solicitud.descripcion}</p>
                  <p className="text-xs text-muted-foreground mt-1">Trabajador: {oferta.nombre}</p>

                  <Separator className="my-3" />

                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Servicio</span>
                      <span>{formatCOP(total)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Comisión plataforma (5%)</span>
                      <span>{formatCOP(comision)}</span>
                    </div>
                  </div>

                  <Separator className="my-3" />

                  <div className="flex items-end justify-between">
                    <span className="text-sm text-muted-foreground">Total a pagar</span>
                    <span className="text-2xl sm:text-3xl font-bold text-primary">
                      {formatCOP(granTotal)}
                    </span>
                  </div>
                </div>

                {/* Métodos */}
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-2">
                    Método de pago
                  </p>
                  <div className="grid gap-2">
                    {METODOS.map((m) => {
                      const Icon = m.icon;
                      const active = metodo === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setMetodo(m.id)}
                          className={cn(
                            "flex items-center gap-3 rounded-xl border p-3 text-left transition-all",
                            active
                              ? "border-primary bg-primary/5 shadow-soft"
                              : "border-border hover:border-primary/40",
                          )}
                        >
                          <div
                            className={cn(
                              "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
                              active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                            )}
                          >
                            <Icon size={18} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold">{m.label}</p>
                            <p className="text-xs text-muted-foreground">{m.desc}</p>
                          </div>
                          <div
                            className={cn(
                              "h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0",
                              active ? "border-primary" : "border-muted-foreground/30",
                            )}
                          >
                            {active && <div className="h-2.5 w-2.5 rounded-full bg-primary" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Form tarjeta */}
                {metodo === "tarjeta" && (
                  <div className="rounded-xl border bg-card p-4 space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="card-num" className="text-xs">Número de tarjeta</Label>
                      <Input
                        id="card-num"
                        inputMode="numeric"
                        placeholder="4242 4242 4242 4242"
                        maxLength={19}
                        value={numero}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/\D/g, "").slice(0, 16);
                          setNumero(raw.replace(/(.{4})/g, "$1 ").trim());
                        }}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="vence" className="text-xs">Vencimiento</Label>
                        <Input
                          id="vence"
                          inputMode="numeric"
                          placeholder="MM/AA"
                          maxLength={5}
                          value={vence}
                          onChange={(e) => {
                            let v = e.target.value.replace(/\D/g, "").slice(0, 4);
                            if (v.length > 2) v = v.slice(0, 2) + "/" + v.slice(2);
                            setVence(v);
                          }}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="cvv" className="text-xs">CVV</Label>
                        <Input
                          id="cvv"
                          inputMode="numeric"
                          placeholder="123"
                          maxLength={4}
                          value={cvv}
                          onChange={(e) => setCvv(e.target.value.replace(/\D/g, ""))}
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="titular" className="text-xs">Titular</Label>
                      <Input
                        id="titular"
                        placeholder="Nombre como aparece en la tarjeta"
                        value={titular}
                        onChange={(e) => setTitular(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {metodo !== "tarjeta" && (
                  <div className="rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground">
                    Serás redirigido a la pasarela segura para completar el pago.
                  </div>
                )}

                {/* Confianza */}
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className="text-emerald-600" />
                    <p className="font-semibold text-sm text-emerald-700">Pago 100% seguro</p>
                  </div>
                  <ul className="space-y-1.5 text-xs text-foreground/80">
                    <li>• Tu dinero será retenido hasta que apruebes el trabajo.</li>
                    <li>• Conexión cifrada extremo a extremo.</li>
                    <li>• Puedes solicitar correcciones o abrir disputa antes de liberar.</li>
                  </ul>
                </div>
              </div>
            </ScrollArea>

            <div className="border-t bg-background/95 backdrop-blur px-5 sm:px-6 py-4 shrink-0 flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
              <Button
                variant="outline"
                className="sm:flex-1"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                className="sm:flex-[2] bg-emerald-600 hover:bg-emerald-700 text-white shadow-elevated transition-transform active:scale-[0.98] disabled:bg-muted disabled:text-muted-foreground"
                disabled={!formValido}
                onClick={handlePagar}
              >
                <Lock size={16} />
                Pagar y asegurar servicio
              </Button>
            </div>
          </>
        )}

        {step === "procesando" && (
          <div className="row-span-3 flex flex-col items-center justify-center px-6 py-16 text-center gap-4">
            <Loader2 size={48} className="text-primary animate-spin" />
            <p className="text-lg font-semibold">Procesando tu pago...</p>
            <p className="text-sm text-muted-foreground max-w-sm">
              No cierres esta ventana. Estamos asegurando los fondos en escrow.
            </p>
          </div>
        )}

        {step === "exito" && (
          <>
            <DialogHeader className="px-5 sm:px-6 pt-6 pb-4 border-b shrink-0 bg-gradient-to-br from-emerald-500/10 to-transparent">
              <div className="flex items-start gap-3">
                <div className="h-12 w-12 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={26} />
                </div>
                <div className="min-w-0">
                  <DialogTitle className="text-lg sm:text-xl">Pago realizado con éxito</DialogTitle>
                  <DialogDescription>
                    Los fondos están retenidos de forma segura.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <ScrollArea className="min-h-0">
              <div className="px-5 sm:px-6 py-5 space-y-4">
                <div className="rounded-xl border-2 border-emerald-500/30 bg-emerald-500/5 p-4">
                  <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white gap-1 mb-3">
                    <Lock size={12} />
                    Fondos retenidos en escrow
                  </Badge>
                  <p className="text-xs text-muted-foreground">Monto asegurado</p>
                  <p className="text-3xl font-bold text-emerald-700 mt-0.5">
                    {formatCOP(granTotal)}
                  </p>
                </div>

                <div className="rounded-xl border bg-card p-4 space-y-2">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">
                    Detalles
                  </p>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Servicio</span>
                    <span className="font-medium text-right line-clamp-1 max-w-[60%]">
                      {tipoLabel(solicitud.tipo)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Trabajador</span>
                    <span className="font-medium">{oferta.nombre}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tiempo estimado</span>
                    <span className="font-medium">
                      {oferta.tiempoEstimadoDias} {oferta.tiempoEstimadoDias === 1 ? "día" : "días"}
                    </span>
                  </div>
                </div>

                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles size={14} className="text-primary" />
                    <p className="text-sm font-semibold">¿Qué sigue?</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    El trabajador iniciará el servicio. Recibirás actualizaciones y podrás revisar las
                    evidencias antes de liberar el pago.
                  </p>
                </div>
              </div>
            </ScrollArea>

            <div className="border-t bg-background/95 backdrop-blur px-5 sm:px-6 py-4 shrink-0">
              <Button
                className="w-full bg-primary hover:bg-primary/90 shadow-elevated"
                onClick={handleSeguimiento}
              >
                Ir al seguimiento
                <ArrowRight size={16} />
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
