import { useEffect, useState } from "react";
import {
  Camera,
  Upload,
  X,
  CheckCircle2,
  ImageIcon,
  Send,
  Flag,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Solicitud } from "@/types/solicitud";
import { useSolicitudesStore } from "@/store/solicitudesStore";
import { useAuthStore } from "@/store/authStore";
import { ApiError } from "@/lib/apiClient";

const ETAPAS = [
  { key: "antes" as const, label: "Antes", desc: "Estado inicial del lugar" },
  { key: "durante" as const, label: "Durante", desc: "Trabajo en progreso" },
  { key: "despues" as const, label: "Después", desc: "Resultado final" },
];

type Etapa = (typeof ETAPAS)[number]["key"];

// Checklist de EPP (equipo de protección personal): gate único, previo a la
// primera subida de evidencia de progreso de un trabajador para una
// solicitud dada — ver specs/2026-09-26-epp-checklist.md.
const EPP_ITEMS = [
  { key: "cascos" as const, label: "Cascos" },
  { key: "guantes" as const, label: "Guantes" },
  { key: "botas" as const, label: "Botas de seguridad" },
  { key: "gafas" as const, label: "Gafas" },
  { key: "buzo" as const, label: "Suéteres tipo buzo" },
  { key: "pantalones" as const, label: "Pantalones largos" },
];

type EppItemKey = (typeof EPP_ITEMS)[number]["key"];

const EPP_CHECKS_INICIAL: Record<EppItemKey, boolean> = {
  cascos: false,
  guantes: false,
  botas: false,
  gafas: false,
  buzo: false,
  pantalones: false,
};

const eppSessionKey = (solicitudId: string) => `epp-confirmado-${solicitudId}`;

// Mapea cada etapa a su campo correspondiente en Solicitud, para leer la
// evidencia ya guardada cuando quien mira el diálogo no puede subir (cliente).
const EVIDENCIA_FIELD: Record<
  Etapa,
  "evidenciaAntes" | "evidenciaDurante" | "evidenciaDespues"
> = {
  antes: "evidenciaAntes",
  durante: "evidenciaDurante",
  despues: "evidenciaDespues",
};

interface Props {
  solicitud: Solicitud | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onEnviado?: (id: string) => void;
}

export const EvidenciasUploadDialog = ({
  solicitud,
  open,
  onOpenChange,
  onEnviado,
}: Props) => {
  const { toast } = useToast();
  const username = useAuthStore((s) => s.user?.username);
  const subirEvidencias = useSolicitudesStore((s) => s.subirEvidencias);
  const subirEvidenciaDisputa = useSolicitudesStore((s) => s.subirEvidenciaDisputa);
  const abrirDisputa = useSolicitudesStore((s) => s.abrirDisputa);
  const fetchOne = useSolicitudesStore((s) => s.fetchOne);
  const [evidencias, setEvidencias] = useState<Record<Etapa, string[]>>({
    antes: [],
    durante: [],
    despues: [],
  });
  const [nota, setNota] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [showDisputa, setShowDisputa] = useState(false);
  const [comentarioDisputa, setComentarioDisputa] = useState("");
  const [enviandoDisputa, setEnviandoDisputa] = useState(false);
  const [tab, setTab] = useState<string>("antes");
  const [disputaFotos, setDisputaFotos] = useState<string[]>([]);
  const [subiendoDisputaFotos, setSubiendoDisputaFotos] = useState(false);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [eppConfirmado, setEppConfirmado] = useState(false);
  const [eppChecks, setEppChecks] = useState<Record<EppItemKey, boolean>>(EPP_CHECKS_INICIAL);

  const solicitudId = solicitud?.id;

  useEffect(() => {
    if (open) {
      setEvidencias({ antes: [], durante: [], despues: [] });
      setNota("");
      setShowDisputa(false);
      setComentarioDisputa("");
      setDisputaFotos([]);
      setTab(solicitud?.estado === "disputa" ? "disputa" : "antes");
      setEppChecks(EPP_CHECKS_INICIAL);
      setEppConfirmado(false);
    }
    // Solo reiniciar al abrir el diálogo, no en cada cambio de `solicitud`
    // (que se actualiza al refetch tras cada subida).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Las evidencias antes/durante/después/disputa no vienen en el listado
  // (GET /solicitudes) por peso; se piden al abrir, igual que en
  // RevisionTrabajoDialog.
  useEffect(() => {
    if (open && solicitudId) {
      setCargandoDetalle(true);
      fetchOne(solicitudId).finally(() => setCargandoDetalle(false));
    }
  }, [open, solicitudId, fetchOne]);

  // Deriva si el gate de EPP debe mostrarse: "primera vez" no se guarda en un
  // flag propio, se deriva de si ya existe evidencia real (ver spec). Ya
  // habiendo evidencia real, el checklist no vuelve a aparecer nunca para
  // esta solicitud; mientras no exista, se recuerda por sesión de navegador
  // para no re-preguntar al reabrir el diálogo (mismo patrón que authStore).
  useEffect(() => {
    if (!open || !solicitudId || cargandoDetalle) return;
    const tieneEvidenciaPrevia =
      (solicitud?.evidenciaAntes?.length ?? 0) > 0 ||
      (solicitud?.evidenciaDurante?.length ?? 0) > 0 ||
      (solicitud?.evidenciaDespues?.length ?? 0) > 0;
    if (tieneEvidenciaPrevia) {
      setEppConfirmado(true);
      return;
    }
    setEppConfirmado(sessionStorage.getItem(eppSessionKey(solicitudId)) === "1");
  }, [
    open,
    solicitudId,
    cargandoDetalle,
    solicitud?.evidenciaAntes,
    solicitud?.evidenciaDurante,
    solicitud?.evidenciaDespues,
  ]);

  if (!solicitud) return null;

  const esCliente = !!username && username === solicitud.clienteUsername;
  const esTrabajador = !!username && username === solicitud.trabajadorAsignado;

  // Antes/Durante/Después: exclusivo del trabajador, solo desde
  // ejecucion/corrigiendo — comportamiento sin cambios respecto al original,
  // solo hecho explícito para poder mostrar el resto como solo lectura.
  const puedeSubirNormal =
    esTrabajador &&
    (solicitud.estado === "ejecucion" || solicitud.estado === "corrigiendo");

  // Disputa: ambas partes pueden subir, solo mientras la solicitud sigue en
  // disputa (el backend rechaza fuera de ese estado).
  const puedeSubirDisputa =
    (esCliente || esTrabajador) && solicitud.estado === "disputa";

  const mostrarTabDisputa =
    solicitud.estado === "disputa" ||
    (solicitud.evidenciaDisputa?.length ?? 0) > 0;

  // Gate de EPP: solo aplica en el flujo normal del trabajador y mientras no
  // se haya confirmado (ver efecto de arriba para cómo se deriva/recuerda).
  const mostrarChecklistEpp = puedeSubirNormal && !cargandoDetalle && !eppConfirmado;
  const todosEppMarcados = EPP_ITEMS.every((item) => eppChecks[item.key]);

  const handleConfirmarEpp = () => {
    if (!todosEppMarcados || !solicitudId) return;
    sessionStorage.setItem(eppSessionKey(solicitudId), "1");
    setEppConfirmado(true);
  };

  const handleFile = (etapa: Etapa, files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files).slice(0, 5 - evidencias[etapa].length);
    Promise.all(
      arr.map(
        (f) =>
          new Promise<string>((resolve) => {
            const r = new FileReader();
            r.onload = () => resolve(r.result as string);
            r.readAsDataURL(f);
          }),
      ),
    ).then((urls) =>
      setEvidencias((prev) => ({ ...prev, [etapa]: [...prev[etapa], ...urls] })),
    );
  };

  const remove = (etapa: Etapa, i: number) => {
    setEvidencias((prev) => ({
      ...prev,
      [etapa]: prev[etapa].filter((_, idx) => idx !== i),
    }));
  };

  const handleFileDisputa = (files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files).slice(0, 5 - disputaFotos.length);
    Promise.all(
      arr.map(
        (f) =>
          new Promise<string>((resolve) => {
            const r = new FileReader();
            r.onload = () => resolve(r.result as string);
            r.readAsDataURL(f);
          }),
      ),
    ).then((urls) => setDisputaFotos((prev) => [...prev, ...urls]));
  };

  const removeDisputaFoto = (i: number) => {
    setDisputaFotos((prev) => prev.filter((_, idx) => idx !== i));
  };

  const totalEv = evidencias.antes.length + evidencias.durante.length + evidencias.despues.length;
  const completo = evidencias.despues.length > 0;

  const handleEnviar = async () => {
    if (!completo) {
      toast({
        title: "Falta evidencia final",
        description: "Sube al menos una foto del resultado final.",
        variant: "destructive",
      });
      return;
    }
    setEnviando(true);
    try {
      await subirEvidencias(solicitud.id, {
        antes: evidencias.antes,
        durante: evidencias.durante,
        despues: evidencias.despues,
        nota: nota.trim() || undefined,
      });
      toast({
        title: "Evidencias enviadas",
        description: "El cliente revisará el trabajo y aprobará la liberación del pago.",
      });
      onEnviado?.(solicitud.id);
      onOpenChange(false);
    } catch (e) {
      toast({
        title: "No se pudieron enviar las evidencias",
        description: e instanceof ApiError ? e.message : "Error de conexión con el servidor",
        variant: "destructive",
      });
    } finally {
      setEnviando(false);
    }
  };

  const handleEnviarDisputa = async () => {
    if (disputaFotos.length === 0) {
      toast({
        title: "Selecciona al menos una foto",
        description: "Sube evidencia fotográfica para sustentar la disputa.",
        variant: "destructive",
      });
      return;
    }
    setSubiendoDisputaFotos(true);
    try {
      await subirEvidenciaDisputa(solicitud.id, disputaFotos);
      toast({
        title: "Evidencia de disputa subida",
        description: "Quedó registrada con tu usuario y la fecha de hoy.",
      });
      setDisputaFotos([]);
    } catch (e) {
      toast({
        title: "No se pudo subir la evidencia",
        description: e instanceof ApiError ? e.message : "Error de conexión con el servidor",
        variant: "destructive",
      });
    } finally {
      setSubiendoDisputaFotos(false);
    }
  };

  const puedeAbrirDisputa =
    esTrabajador &&
    (solicitud.estado === "ejecucion" ||
      solicitud.estado === "revision" ||
      solicitud.estado === "corrigiendo");

  const handleAbrirDisputa = async () => {
    if (comentarioDisputa.trim().length < 10) {
      toast({
        title: "Comentario muy corto",
        description: "Describe con detalle el motivo de la disputa (mínimo 10 caracteres).",
        variant: "destructive",
      });
      return;
    }
    setEnviandoDisputa(true);
    try {
      await abrirDisputa(solicitud.id, comentarioDisputa.trim());
      toast({
        title: "Disputa abierta",
        description: "Nuestro equipo revisará el caso y mediará entre ambas partes.",
      });
      setShowDisputa(false);
      setComentarioDisputa("");
      onOpenChange(false);
    } catch (e) {
      toast({
        title: "No se pudo abrir la disputa",
        description: e instanceof ApiError ? e.message : "Error de conexión con el servidor",
        variant: "destructive",
      });
    } finally {
      setEnviandoDisputa(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden h-[100dvh] sm:h-auto sm:max-h-[92vh] w-screen sm:w-full sm:rounded-lg rounded-none grid grid-rows-[auto_1fr_auto]">
        <DialogHeader className="px-5 sm:px-6 pt-6 pb-4 border-b shrink-0">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Camera size={20} />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-lg sm:text-xl">
                {solicitud.estado === "disputa"
                  ? "Evidencia de disputa"
                  : solicitud.estado === "corrigiendo"
                  ? "Corregir y reenviar evidencias"
                  : "Subir evidencias"}
              </DialogTitle>
              <DialogDescription>
                {puedeSubirNormal
                  ? "Documenta el trabajo en cada etapa para activar la liberación del pago."
                  : "Revisa cómo evolucionó el trabajo por etapa."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="min-h-0">
          <div className="px-5 sm:px-6 py-5 space-y-4">
            {solicitud.estado === "corrigiendo" && solicitud.correcciones?.length > 0 && (
              <div className="rounded-lg border border-orange-300 dark:border-orange-500/40 bg-orange-50 dark:bg-orange-500/10 p-4 space-y-2">
                <p className="text-xs font-semibold text-orange-800 dark:text-orange-300 uppercase tracking-wide">
                  El cliente pidió corregir
                </p>
                {solicitud.correcciones.map((comentario, i) => (
                  <p
                    key={i}
                    className="text-sm text-orange-900/90 dark:text-orange-200/90 whitespace-pre-line"
                  >
                    {comentario}
                  </p>
                ))}
              </div>
            )}

            {mostrarChecklistEpp ? (
              <div className="rounded-xl border bg-card p-4 shadow-soft space-y-4">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-full bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <ShieldCheck size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm">Antes de subir evidencias</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Por tu seguridad, confirma que estás usando tu dotación de protección
                      personal antes de continuar.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  {EPP_ITEMS.map((item) => (
                    <label
                      key={item.key}
                      className="flex items-center gap-2 text-sm cursor-pointer"
                    >
                      <Checkbox
                        checked={eppChecks[item.key]}
                        onCheckedChange={(checked) =>
                          setEppChecks((prev) => ({ ...prev, [item.key]: checked === true }))
                        }
                      />
                      {item.label}
                    </label>
                  ))}
                </div>
              </div>
            ) : (
              <Tabs value={tab} onValueChange={setTab}>
                <TabsList
                  className={cn(
                    "grid w-full",
                    mostrarTabDisputa ? "grid-cols-4" : "grid-cols-3",
                  )}
                >
                  {ETAPAS.map((etapa) => (
                    <TabsTrigger key={etapa.key} value={etapa.key}>
                      {etapa.label}
                    </TabsTrigger>
                  ))}
                  {mostrarTabDisputa && (
                    <TabsTrigger value="disputa" className="text-red-600 data-[state=active]:text-red-700">
                      Disputa
                    </TabsTrigger>
                  )}
                </TabsList>

                {ETAPAS.map((etapa) => {
                  const fotos = puedeSubirNormal
                    ? evidencias[etapa.key]
                    : solicitud[EVIDENCIA_FIELD[etapa.key]] ?? [];
                  return (
                    <TabsContent key={etapa.key} value={etapa.key}>
                      <div className="rounded-xl border bg-card p-4 shadow-soft">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-semibold text-sm">{etapa.label}</p>
                            <p className="text-xs text-muted-foreground">{etapa.desc}</p>
                          </div>
                          {puedeSubirNormal && (
                            <Badge variant={fotos.length > 0 ? "default" : "outline"}>
                              {fotos.length}/5
                            </Badge>
                          )}
                        </div>

                        {!puedeSubirNormal && cargandoDetalle ? (
                          <div className="rounded-md bg-muted/40 py-6 flex flex-col items-center justify-center text-muted-foreground">
                            <ImageIcon size={20} className="mb-1 opacity-60 animate-pulse" />
                            <span className="text-xs">Cargando evidencia...</span>
                          </div>
                        ) : !puedeSubirNormal && fotos.length === 0 ? (
                          <div className="rounded-md bg-muted/40 py-6 flex flex-col items-center justify-center text-muted-foreground">
                            <ImageIcon size={20} className="mb-1 opacity-60" />
                            <span className="text-xs">Sin fotos en esta etapa</span>
                          </div>
                        ) : (
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-3">
                            {fotos.map((src, i) => (
                              <div
                                key={i}
                                className="relative aspect-square rounded-lg overflow-hidden border bg-muted group"
                              >
                                <img src={src} alt={`${etapa.label} ${i + 1}`} className="w-full h-full object-cover" />
                                {puedeSubirNormal && (
                                  <button
                                    type="button"
                                    onClick={() => remove(etapa.key, i)}
                                    className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                    aria-label="Eliminar"
                                  >
                                    <X size={12} />
                                  </button>
                                )}
                              </div>
                            ))}

                            {puedeSubirNormal && fotos.length < 5 && (
                              <label
                                className={cn(
                                  "aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-muted/40 transition-colors",
                                  "text-muted-foreground hover:text-foreground",
                                )}
                              >
                                <Upload size={18} />
                                <span className="text-[10px] text-center px-1">Subir foto</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  multiple
                                  className="hidden"
                                  onChange={(e) => handleFile(etapa.key, e.target.files)}
                                />
                              </label>
                            )}
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  );
                })}

                {mostrarTabDisputa && (
                  <TabsContent value="disputa">
                    <div className="rounded-xl border border-red-200 dark:border-red-500/30 bg-card p-4 shadow-soft space-y-3">
                      <div>
                        <p className="font-semibold text-sm text-red-900 dark:text-red-200">Disputa</p>
                        <p className="text-xs text-muted-foreground">
                          Evidencia subida por el cliente y el trabajador mientras dura la disputa.
                        </p>
                      </div>

                      {cargandoDetalle ? (
                        <div className="rounded-md bg-muted/40 py-6 flex flex-col items-center justify-center text-muted-foreground">
                          <ImageIcon size={20} className="mb-1 opacity-60 animate-pulse" />
                          <span className="text-xs">Cargando evidencia de disputa...</span>
                        </div>
                      ) : (solicitud.evidenciaDisputa?.length ?? 0) === 0 ? (
                        <div className="rounded-md bg-muted/40 py-6 flex flex-col items-center justify-center text-muted-foreground">
                          <ImageIcon size={20} className="mb-1 opacity-60" />
                          <span className="text-xs">Aún no hay evidencia de disputa</span>
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {solicitud.evidenciaDisputa.map((item, i) => (
                            <div
                              key={i}
                              className="relative aspect-square rounded-lg overflow-hidden border bg-muted"
                            >
                              <img
                                src={item.url}
                                alt={`Disputa ${i + 1}`}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute bottom-0 inset-x-0 bg-black/70 text-white px-1 py-0.5">
                                <p className="text-[9px] font-medium truncate">{item.autorUsername}</p>
                                <p className="text-[9px] opacity-80 truncate">
                                  {new Date(item.createdAt).toLocaleString("es-CO")}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {puedeSubirDisputa && (
                        <div className="space-y-2 pt-2 border-t">
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {disputaFotos.map((src, i) => (
                              <div
                                key={i}
                                className="relative aspect-square rounded-lg overflow-hidden border bg-muted group"
                              >
                                <img src={src} alt={`Nueva evidencia ${i + 1}`} className="w-full h-full object-cover" />
                                <button
                                  type="button"
                                  onClick={() => removeDisputaFoto(i)}
                                  className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                  aria-label="Eliminar"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            ))}

                            {disputaFotos.length < 5 && (
                              <label
                                className={cn(
                                  "aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-muted/40 transition-colors",
                                  "text-muted-foreground hover:text-foreground",
                                )}
                              >
                                <Upload size={18} />
                                <span className="text-[10px] text-center px-1">Subir foto</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  multiple
                                  className="hidden"
                                  onChange={(e) => handleFileDisputa(e.target.files)}
                                />
                              </label>
                            )}
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            className="w-full bg-red-600 hover:bg-red-700 text-white"
                            onClick={handleEnviarDisputa}
                            disabled={disputaFotos.length === 0 || subiendoDisputaFotos}
                          >
                            {subiendoDisputaFotos ? "Subiendo..." : "Subir evidencia de disputa"}
                          </Button>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                )}
              </Tabs>
            )}

            {puedeSubirNormal && !mostrarChecklistEpp && (
              <>
                <div className="rounded-xl border bg-card p-4">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-2">
                    Nota para el cliente (opcional)
                  </p>
                  <Textarea
                    placeholder="Describe brevemente el trabajo realizado..."
                    value={nota}
                    onChange={(e) => setNota(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2">
                  <ImageIcon size={14} />
                  <span>{totalEv} {totalEv === 1 ? "foto subida" : "fotos subidas"} en total</span>
                </div>
              </>
            )}

            {puedeAbrirDisputa && (
              <div className="rounded-xl border border-red-200 dark:border-red-500/30 bg-card p-4 space-y-3">
                {!showDisputa ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDisputa(true)}
                    className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-500/10"
                  >
                    <Flag size={14} />
                    Abrir disputa
                  </Button>
                ) : (
                  <>
                    <div>
                      <h3 className="font-semibold text-red-900 dark:text-red-200 flex items-center gap-2">
                        <AlertTriangle size={16} />
                        Abrir disputa
                      </h3>
                      <p className="text-xs text-red-800/80 dark:text-red-200/80 mt-1">
                        Explica por qué no estás de acuerdo con lo solicitado. Nuestro equipo
                        mediará entre ambas partes.
                      </p>
                    </div>
                    <Textarea
                      placeholder="Describe el motivo de la disputa..."
                      value={comentarioDisputa}
                      onChange={(e) => setComentarioDisputa(e.target.value)}
                      rows={4}
                    />
                    <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowDisputa(false)}
                        disabled={enviandoDisputa}
                      >
                        Cancelar
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleAbrirDisputa}
                        disabled={enviandoDisputa}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        {enviandoDisputa ? "Enviando..." : "Enviar y abrir disputa"}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="border-t bg-background/95 backdrop-blur px-5 sm:px-6 py-4 shrink-0 flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
          {puedeSubirNormal && mostrarChecklistEpp ? (
            <>
              <Button
                variant="outline"
                className="sm:flex-1"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                className="sm:flex-[2] bg-emerald-600 hover:bg-emerald-700 text-white shadow-elevated"
                onClick={handleConfirmarEpp}
                disabled={!todosEppMarcados}
              >
                <ShieldCheck size={16} />
                Confirmar y continuar
              </Button>
            </>
          ) : puedeSubirNormal ? (
            <>
              <Button
                variant="outline"
                className="sm:flex-1"
                onClick={() => onOpenChange(false)}
                disabled={enviando}
              >
                Cancelar
              </Button>
              <Button
                className="sm:flex-[2] bg-emerald-600 hover:bg-emerald-700 text-white shadow-elevated"
                onClick={handleEnviar}
                disabled={!completo || enviando}
              >
                {completo ? <CheckCircle2 size={16} /> : <Send size={16} />}
                {enviando ? "Enviando..." : "Enviar para revisión del cliente"}
              </Button>
            </>
          ) : (
            <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
