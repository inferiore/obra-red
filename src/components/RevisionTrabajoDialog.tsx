import { useEffect, useState } from "react";
import {
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Flag,
  ZoomIn,
  MessageSquare,
  Lock,
  LifeBuoy,
  ImageIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import type { Solicitud } from "@/types/solicitud";
import { useSolicitudesStore } from "@/store/solicitudesStore";
import { ApiError } from "@/lib/apiClient";

interface Props {
  solicitud: Solicitud | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onAprobar: (id: string) => void;
}

const ETAPAS = [
  { key: "antes", label: "Antes", desc: "Estado inicial del lugar" },
  { key: "durante", label: "Durante", desc: "Trabajo en progreso" },
  { key: "despues", label: "Después", desc: "Resultado final" },
] as const;

const CHECKLIST = [
  "El trabajo cumple lo solicitado",
  "La calidad es adecuada",
  "Se completó en el tiempo acordado",
];

export const RevisionTrabajoDialog = ({ solicitud, open, onOpenChange, onAprobar }: Props) => {
  const { toast } = useToast();
  const fetchOne = useSolicitudesStore((s) => s.fetchOne);
  const solicitarCorreccion = useSolicitudesStore((s) => s.solicitarCorreccion);
  const [zoom, setZoom] = useState<{ label: string; src?: string } | null>(null);
  const [checks, setChecks] = useState<boolean[]>([false, false, false]);
  const [showCorreccion, setShowCorreccion] = useState(false);
  const [comentario, setComentario] = useState("");
  const [confirmAprobar, setConfirmAprobar] = useState(false);
  const [confirmDisputa, setConfirmDisputa] = useState(false);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [enviandoCorreccion, setEnviandoCorreccion] = useState(false);

  const solicitudId = solicitud?.id;
  useEffect(() => {
    if (open && solicitudId) {
      setCargandoDetalle(true);
      fetchOne(solicitudId).finally(() => setCargandoDetalle(false));
    }
  }, [open, solicitudId, fetchOne]);

  if (!solicitud) return null;

  const seAbriraDisputa = (solicitud.correccionesCount ?? 0) >= 1;

  const evidencias = [
    { ...ETAPAS[0], fotos: solicitud.evidenciaAntes ?? [] },
    { ...ETAPAS[1], fotos: solicitud.evidenciaDurante ?? [] },
    { ...ETAPAS[2], fotos: solicitud.evidenciaDespues ?? [] },
  ];

  const reset = () => {
    setChecks([false, false, false]);
    setShowCorreccion(false);
    setComentario("");
  };

  const handleAprobar = () => {
    onAprobar(solicitud.id);
    toast({
      title: "Trabajo aprobado",
      description: "El pago en escrow fue liberado al trabajador.",
    });
    setConfirmAprobar(false);
    reset();
    onOpenChange(false);
  };

  const handleEnviarCorreccion = async () => {
    if (comentario.trim().length < 10) {
      toast({
        title: "Comentario muy corto",
        description: "Describe con detalle qué necesita corrección (mínimo 10 caracteres).",
        variant: "destructive",
      });
      return;
    }
    setEnviandoCorreccion(true);
    try {
      await solicitarCorreccion(solicitud.id, comentario.trim());
      toast(
        seAbriraDisputa
          ? {
              title: "Disputa abierta",
              description:
                "Ya habías solicitado una corrección antes, así que esta solicitud pasó a disputa. Nuestro equipo intervendrá.",
            }
          : {
              title: "Solicitud de corrección enviada",
              description: "El trabajador recibirá tu comentario y podrá ajustar el trabajo.",
            }
      );
      reset();
      onOpenChange(false);
    } catch (e) {
      toast({
        title: "No se pudo enviar la corrección",
        description: e instanceof ApiError ? e.message : "Error de conexión con el servidor",
        variant: "destructive",
      });
    } finally {
      setEnviandoCorreccion(false);
    }
  };

  const handleDisputa = () => {
    toast({
      title: "Disputa abierta",
      description: "Nuestro equipo revisará el caso y te contactará en menos de 24h.",
    });
    setConfirmDisputa(false);
    reset();
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl p-0 gap-0 max-h-[92vh] overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>Revisión del trabajo</DialogTitle>
            <DialogDescription>
              Revisa las evidencias antes de aprobar, solicitar corrección o abrir disputa.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[92vh]">
            {/* Header destacado */}
            <div className="bg-amber-50 dark:bg-amber-500/10 border-b border-amber-200 dark:border-amber-500/30 px-5 py-5 sm:px-6">
              <div className="flex items-start gap-3">
                <div className="shrink-0 w-11 h-11 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center text-amber-700 dark:text-amber-400">
                  <Clock size={22} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg sm:text-xl font-bold text-amber-900 dark:text-amber-200 leading-tight">
                    Pendiente de tu aprobación
                  </h2>
                  <p className="text-sm text-amber-800/80 dark:text-amber-200/80 mt-1">
                    El trabajador ha subido evidencias. Revísalas antes de continuar.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-6 space-y-6">
              {/* Resumen del trabajo */}
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                  Trabajo
                </p>
                <p className="font-semibold mt-0.5 line-clamp-2">{solicitud.descripcion}</p>
                <p className="text-sm text-muted-foreground mt-1">{solicitud.ubicacion}</p>
              </div>

              {/* Evidencias */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <ImageIcon size={16} className="text-primary" />
                    Evidencias del trabajo
                  </h3>
                </div>

                {cargandoDetalle ? (
                  <div className="rounded-lg border bg-muted/30 py-10 flex flex-col items-center justify-center text-muted-foreground">
                    <ImageIcon size={24} className="mb-2 opacity-60 animate-pulse" />
                    <span className="text-sm">Cargando evidencias...</span>
                  </div>
                ) : (
                <div className="space-y-3">
                  {evidencias.map((ev) => (
                    <div key={ev.key} className="rounded-lg border bg-card p-3">
                      <p className="text-sm font-semibold">{ev.label}</p>
                      <p className="text-xs text-muted-foreground mb-2">{ev.desc}</p>
                      {ev.fotos.length === 0 ? (
                        <div className="rounded-md bg-muted/40 py-6 flex flex-col items-center justify-center text-muted-foreground">
                          <ImageIcon size={24} className="mb-1 opacity-60" />
                          <span className="text-xs">Sin fotos en esta etapa</span>
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {ev.fotos.map((src, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setZoom({ label: `${ev.label} ${i + 1}`, src })}
                              className="group relative aspect-square rounded-lg overflow-hidden border bg-muted hover:border-primary/40 transition-all"
                            >
                              <img
                                src={src}
                                alt={`${ev.label} ${i + 1}`}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <span className="bg-white/90 text-foreground rounded-full p-1.5">
                                  <ZoomIn size={14} />
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                )}

                {!cargandoDetalle && solicitud.evidenciaNota && (
                  <div className="mt-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
                    <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">
                      Nota del trabajador
                    </p>
                    <p className="text-sm text-foreground/90 whitespace-pre-line">
                      {solicitud.evidenciaNota}
                    </p>
                  </div>
                )}
              </section>

              {/* Checklist */}
              <section className="rounded-lg border p-4">
                <h3 className="font-semibold">Revisión del cliente</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Revisa cuidadosamente las evidencias antes de tomar una decisión.
                </p>
                <ul className="mt-3 space-y-2.5">
                  {CHECKLIST.map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Checkbox
                        id={`check-${i}`}
                        checked={checks[i]}
                        onCheckedChange={(v) =>
                          setChecks((prev) => prev.map((c, idx) => (idx === i ? !!v : c)))
                        }
                        className="mt-0.5"
                      />
                      <label
                        htmlFor={`check-${i}`}
                        className="text-sm cursor-pointer leading-snug"
                      >
                        ¿{item}?
                      </label>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Mensajes de confianza */}
              <section className="grid sm:grid-cols-3 gap-2">
                {[
                  { icon: Lock, text: "Tu dinero está protegido hasta que apruebes el trabajo." },
                  { icon: MessageSquare, text: "Puedes solicitar correcciones antes de liberar el pago." },
                  { icon: LifeBuoy, text: "Nuestro equipo puede intervenir en caso de disputa." },
                ].map((m, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 rounded-md bg-primary/5 border border-primary/10 p-3"
                  >
                    <m.icon size={16} className="text-primary mt-0.5 shrink-0" />
                    <p className="text-xs text-foreground/80 leading-snug">{m.text}</p>
                  </div>
                ))}
              </section>

              {/* Corrección (textarea condicional) */}
              {showCorreccion && (
                <section
                  className={
                    seAbriraDisputa
                      ? "rounded-lg border border-red-300 dark:border-red-500/40 bg-red-50/60 dark:bg-red-500/5 p-4 space-y-3"
                      : "rounded-lg border border-orange-200 dark:border-orange-500/30 bg-orange-50/60 dark:bg-orange-500/5 p-4 space-y-3"
                  }
                >
                  <div>
                    <h3
                      className={
                        seAbriraDisputa
                          ? "font-semibold text-red-900 dark:text-red-200 flex items-center gap-2"
                          : "font-semibold text-orange-900 dark:text-orange-200 flex items-center gap-2"
                      }
                    >
                      {seAbriraDisputa ? <Flag size={16} /> : <AlertTriangle size={16} />}
                      {seAbriraDisputa ? "Ya usaste tu corrección" : "Solicitar corrección"}
                    </h3>
                    <p
                      className={
                        seAbriraDisputa
                          ? "text-xs text-red-800/80 dark:text-red-200/80 mt-1"
                          : "text-xs text-orange-800/80 dark:text-orange-200/80 mt-1"
                      }
                    >
                      {seAbriraDisputa
                        ? "Ya solicitaste una corrección en esta solicitud. Enviar otra la pasará directamente a disputa y nuestro equipo mediará el caso, en vez de otra ronda de ajustes."
                        : "Explícale al trabajador qué debe ajustar antes de liberar el pago."}
                    </p>
                  </div>
                  <Textarea
                    placeholder="Describe los detalles que requieren corrección..."
                    value={comentario}
                    onChange={(e) => setComentario(e.target.value)}
                    rows={4}
                  />
                  <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowCorreccion(false)}
                      disabled={enviandoCorreccion}
                    >
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleEnviarCorreccion}
                      disabled={enviandoCorreccion}
                      className={
                        seAbriraDisputa
                          ? "bg-red-600 hover:bg-red-700 text-white"
                          : "bg-orange-500 hover:bg-orange-600 text-white"
                      }
                    >
                      {enviandoCorreccion
                        ? "Enviando..."
                        : seAbriraDisputa
                          ? "Enviar y abrir disputa"
                          : "Enviar solicitud de corrección"}
                    </Button>
                  </div>
                </section>
              )}

              {/* Acciones principales */}
              <section className="space-y-2 pt-2 border-t">
                <div className="flex flex-col md:flex-row gap-2">
                  <Button
                    size="lg"
                    onClick={() => setConfirmAprobar(true)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white shadow-elevated"
                  >
                    <CheckCircle2 size={18} />
                    Aprobar trabajo
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => setShowCorreccion(true)}
                    className="flex-1 border-orange-300 text-orange-700 hover:bg-orange-50 hover:text-orange-800 dark:border-orange-500/40 dark:text-orange-300 dark:hover:bg-orange-500/10"
                  >
                    <AlertTriangle size={18} />
                    Solicitar corrección
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmDisputa(true)}
                  className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-500/10"
                >
                  <Flag size={14} />
                  Abrir disputa
                </Button>
                <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground pt-1">
                  <ShieldCheck size={12} className="text-primary" />
                  Pago protegido por ObraRed Escrow
                </p>
              </section>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Zoom modal */}
      <Dialog open={!!zoom} onOpenChange={(v) => !v && setZoom(null)}>
        <DialogContent className="max-w-3xl p-2 sm:p-4">
          <DialogHeader>
            <DialogTitle>{zoom?.label}</DialogTitle>
          </DialogHeader>
          <div className="bg-muted rounded-md aspect-video flex items-center justify-center overflow-hidden">
            {zoom?.src ? (
              <img src={zoom.src} alt={zoom.label} className="w-full h-full object-contain" />
            ) : (
              <div className="flex flex-col items-center text-muted-foreground">
                <ImageIcon size={48} className="mb-2 opacity-60" />
                <span className="text-sm">Sin imagen disponible</span>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmar aprobación */}
      <AlertDialog open={confirmAprobar} onOpenChange={setConfirmAprobar}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Aprobar trabajo y liberar pago?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción liberará el pago en escrow al trabajador y no podrá deshacerse.
              Asegúrate de que el trabajo cumple con lo acordado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAprobar}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Sí, aprobar y liberar pago
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmar disputa */}
      <AlertDialog open={confirmDisputa} onOpenChange={setConfirmDisputa}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Abrir disputa formal?</AlertDialogTitle>
            <AlertDialogDescription>
              Una disputa congela el pago y activa la mediación de nuestro equipo. Úsala solo si
              consideras que el trabajo no se puede resolver con una corrección.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisputa}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Sí, abrir disputa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
