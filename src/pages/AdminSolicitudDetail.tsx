import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  DollarSign,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EstadoBadge } from "@/components/EstadoBadge";
import { EvidenciasReadOnly } from "@/components/EvidenciasReadOnly";
import { ChatSolicitudDialog } from "@/components/ChatSolicitudDialog";
import { useSolicitudesStore } from "@/store/solicitudesStore";
import { useOfertasStore } from "@/store/ofertasStore";
import { useMensajesStore, type Mensaje } from "@/store/mensajesStore";
import { useToast } from "@/hooks/use-toast";
import { ApiError } from "@/lib/apiClient";
import { TIPOS_TRABAJO } from "@/types/solicitud";
import type { Oferta } from "@/lib/ofertas";

const EMPTY_OFERTAS: Oferta[] = [];
const EMPTY_MENSAJES: Mensaje[] = [];

const tipoLabel = (tipo: string) =>
  TIPOS_TRABAJO.find((t) => t.value === tipo)?.label ?? tipo;

const formatCOP = (n: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);

const OFERTA_ESTADO_VARIANT: Record<Oferta["estado"], "default" | "secondary" | "outline"> = {
  aceptada: "default",
  pendiente: "secondary",
  rechazada: "outline",
};

const OfertaResumen = ({ oferta }: { oferta: Oferta }) => (
  <div className="rounded-lg border p-3 flex items-start justify-between gap-3">
    <div className="min-w-0">
      <p className="font-medium text-sm truncate">
        {oferta.nombre} <span className="text-muted-foreground">({oferta.trabajadorUsername})</span>
      </p>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
        <span className="font-semibold text-foreground">{formatCOP(oferta.precio)}</span>
        <span className="inline-flex items-center gap-1">
          <Star size={11} className="fill-yellow-400 text-yellow-400" />
          {oferta.calificacion.toFixed(1)}
        </span>
        {oferta.verificado && (
          <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
            <ShieldCheck size={11} /> Verificado
          </span>
        )}
      </div>
      <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">"{oferta.mensaje}"</p>
    </div>
    <Badge variant={OFERTA_ESTADO_VARIANT[oferta.estado]} className="shrink-0 capitalize">
      {oferta.estado}
    </Badge>
  </div>
);

const AdminSolicitudDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const solicitud = useSolicitudesStore((s) => s.solicitudes.find((sol) => sol.id === id));
  const fetchOne = useSolicitudesStore((s) => s.fetchOne);
  const resolverDisputa = useSolicitudesStore((s) => s.resolverDisputa);

  const ofertas = useOfertasStore((s) => (id ? s.bySolicitud[id] ?? EMPTY_OFERTAS : EMPTY_OFERTAS));
  const fetchOfertas = useOfertasStore((s) => s.fetchBySolicitud);

  const mensajes = useMensajesStore((s) => (id ? s.bySolicitud[id] ?? EMPTY_MENSAJES : EMPTY_MENSAJES));
  const fetchMensajes = useMensajesStore((s) => s.fetchBySolicitud);

  const [cargando, setCargando] = useState(true);
  const [noEncontrada, setNoEncontrada] = useState(false);
  const [resolviendo, setResolviendo] = useState(false);
  const [chatAbierto, setChatAbierto] = useState(false);

  useEffect(() => {
    if (!id) return;
    setCargando(true);
    setNoEncontrada(false);
    Promise.all([fetchOne(id), fetchOfertas(id), fetchMensajes(id)])
      .catch(() => setNoEncontrada(true))
      .finally(() => setCargando(false));
  }, [id, fetchOne, fetchOfertas, fetchMensajes]);

  const handleResolver = async (estado: "ejecucion" | "finalizado") => {
    if (!id) return;
    setResolviendo(true);
    try {
      await resolverDisputa(id, estado);
      toast({
        title: estado === "ejecucion" ? "Trabajo reanudado" : "Solicitud finalizada",
        description:
          estado === "ejecucion"
            ? "Se notificó a ambas partes que el trabajo continúa en ejecución."
            : "Se notificó a ambas partes que la solicitud quedó finalizada.",
      });
    } catch (e) {
      toast({
        title: "No se pudo resolver la disputa",
        description: e instanceof ApiError ? e.message : "Error de conexión con el servidor",
        variant: "destructive",
      });
    } finally {
      setResolviendo(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="container mx-auto flex items-center gap-3 h-16 px-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin/solicitudes")}>
            <ArrowLeft size={16} />
            Volver
          </Button>
          <span className="text-lg font-bold">
            Panel de <span className="text-primary">administrador</span>
          </span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 md:py-10 space-y-4 max-w-3xl">
        {cargando ? (
          <Card>
            <CardContent className="py-16 text-center text-muted-foreground">
              Cargando solicitud...
            </CardContent>
          </Card>
        ) : noEncontrada || !solicitud ? (
          <Card>
            <CardContent className="py-16 text-center text-muted-foreground">
              No se encontró esta solicitud.
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                      {tipoLabel(solicitud.tipo)}
                    </p>
                    <CardTitle className="text-lg mt-1">{solicitud.descripcion}</CardTitle>
                  </div>
                  <EstadoBadge estado={solicitud.estado} />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                  <span className="inline-flex items-center gap-1 font-semibold">
                    <DollarSign size={14} className="text-primary" />
                    {formatCOP(solicitud.presupuesto)}
                  </span>
                  <span className="inline-flex items-center gap-1 text-muted-foreground">
                    <MapPin size={14} />
                    {solicitud.ubicacion}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <div className="rounded-lg bg-muted/40 p-3">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Cliente</p>
                    <p className="font-medium mt-0.5">
                      {solicitud.clienteNombre}{" "}
                      <span className="text-muted-foreground">({solicitud.clienteUsername})</span>
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted/40 p-3">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Trabajador</p>
                    <p className="font-medium mt-0.5">
                      {solicitud.trabajadorAsignado ?? "Sin asignar"}
                    </p>
                  </div>
                </div>

                {solicitud.estado === "disputa" && (
                  <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 space-y-3">
                    <p className="text-sm font-semibold text-destructive">Resolver disputa</p>
                    <p className="text-xs text-muted-foreground">
                      Elige uno de los dos desenlaces. Ambas partes serán notificadas.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="sm:flex-1"
                        onClick={() => handleResolver("ejecucion")}
                        disabled={resolviendo}
                      >
                        Reanudar trabajo
                      </Button>
                      <Button
                        size="sm"
                        className="sm:flex-1"
                        onClick={() => handleResolver("finalizado")}
                        disabled={resolviendo}
                      >
                        Dar por finalizado
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  Ofertas {ofertas.length > 0 ? `(${ofertas.length})` : ""}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {ofertas.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Esta solicitud no tiene ofertas.</p>
                ) : (
                  ofertas.map((o) => <OfertaResumen key={o.id} oferta={o} />)
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Evidencia</CardTitle>
              </CardHeader>
              <CardContent>
                <EvidenciasReadOnly
                  estado={solicitud.estado}
                  evidenciaAntes={solicitud.evidenciaAntes}
                  evidenciaDurante={solicitud.evidenciaDurante}
                  evidenciaDespues={solicitud.evidenciaDespues}
                  evidenciaDisputa={solicitud.evidenciaDisputa}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  Chat {mensajes.length > 0 ? `(${mensajes.length} mensajes)` : ""}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button variant="outline" onClick={() => setChatAbierto(true)}>
                  <MessageCircle size={14} />
                  Ver conversación
                </Button>
              </CardContent>
            </Card>

            <ChatSolicitudDialog
              solicitudId={solicitud.id}
              open={chatAbierto}
              onOpenChange={setChatAbierto}
              estado={solicitud.estado}
            />
          </>
        )}
      </main>
    </div>
  );
};

export default AdminSolicitudDetail;
