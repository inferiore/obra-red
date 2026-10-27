import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Flag, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EstadoBadge } from "@/components/EstadoBadge";
import { useSolicitudesStore } from "@/store/solicitudesStore";
import { ESTADO_LABELS, TIPOS_TRABAJO, type Solicitud, type SolicitudEstado } from "@/types/solicitud";

const tipoLabel = (tipo: string) =>
  TIPOS_TRABAJO.find((t) => t.value === tipo)?.label ?? tipo;

// Disputas primero (son las que requieren atención), luego el resto por
// fecha de creación descendente.
const ordenarParaAdmin = (solicitudes: Solicitud[]) =>
  [...solicitudes].sort((a, b) => {
    if (a.estado === "disputa" && b.estado !== "disputa") return -1;
    if (a.estado !== "disputa" && b.estado === "disputa") return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

// `trabajadorAsignado` es el username del trabajador, no su nombre. El
// nombre real viene embebido en `s.ofertas` (ver GET /solicitudes), así que
// lo resolvemos ahí en lugar de pedirlo aparte; si no hay match, el username
// sirve de fallback (mismo comportamiento que antes de este filtro).
const nombreTrabajador = (s: Solicitud): string | undefined => {
  if (!s.trabajadorAsignado) return undefined;
  const oferta = s.ofertas?.find((o) => o.trabajadorUsername === s.trabajadorAsignado);
  return oferta?.nombre ?? s.trabajadorAsignado;
};

const AdminSolicitudes = () => {
  const navigate = useNavigate();
  const solicitudes = useSolicitudesStore((s) => s.solicitudes);
  const fetchAll = useSolicitudesStore((s) => s.fetchAll);

  const [estadoFiltro, setEstadoFiltro] = useState<SolicitudEstado | "todas">("todas");
  const [tipoFiltro, setTipoFiltro] = useState<string>("todas");
  const [busquedaCliente, setBusquedaCliente] = useState("");
  const [busquedaTrabajador, setBusquedaTrabajador] = useState("");

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const ordenadas = useMemo(() => ordenarParaAdmin(solicitudes), [solicitudes]);

  const filtradas = useMemo(() => {
    const qCliente = busquedaCliente.trim().toLowerCase();
    const qTrabajador = busquedaTrabajador.trim().toLowerCase();
    return ordenadas.filter((s) => {
      const matchEstado = estadoFiltro === "todas" || s.estado === estadoFiltro;
      const matchTipo = tipoFiltro === "todas" || s.tipo === tipoFiltro;
      const matchCliente =
        !qCliente ||
        s.clienteNombre.toLowerCase().includes(qCliente) ||
        s.clienteUsername.toLowerCase().includes(qCliente);
      const matchTrabajador =
        !qTrabajador ||
        (nombreTrabajador(s)?.toLowerCase().includes(qTrabajador) ?? false) ||
        (s.trabajadorAsignado?.toLowerCase().includes(qTrabajador) ?? false);
      return matchEstado && matchTipo && matchCliente && matchTrabajador;
    });
  }, [ordenadas, estadoFiltro, tipoFiltro, busquedaCliente, busquedaTrabajador]);

  return (
    <div className="min-h-screen bg-gradient-hero">
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="container mx-auto flex items-center gap-3 h-16 px-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
            <ArrowLeft size={16} />
            Volver
          </Button>
          <span className="text-lg font-bold">
            Panel de <span className="text-primary">administrador</span>
          </span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 md:py-10 space-y-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Solicitudes</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Trazabilidad completa de todas las solicitudes de la plataforma. Las disputas activas
            aparecen primero.
          </p>
        </div>

        {/* Filtros */}
        <div className="flex flex-col gap-3">
          <Tabs
            value={estadoFiltro}
            onValueChange={(v) => setEstadoFiltro(v as SolicitudEstado | "todas")}
          >
            <TabsList className="grid grid-cols-4 sm:grid-cols-8 w-full">
              <TabsTrigger value="todas">Todas</TabsTrigger>
              {(Object.keys(ESTADO_LABELS) as SolicitudEstado[]).map((estado) => (
                <TabsTrigger key={estado} value={estado}>
                  {ESTADO_LABELS[estado]}
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsContent value={estadoFiltro} />
          </Tabs>

          <div className="flex flex-col md:flex-row gap-3">
            <Select value={tipoFiltro} onValueChange={setTipoFiltro}>
              <SelectTrigger className="h-11 w-full md:w-56">
                <SelectValue placeholder="Tipo de trabajo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todos los tipos</SelectItem>
                {TIPOS_TRABAJO.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                placeholder="Buscar por cliente (nombre o usuario)..."
                value={busquedaCliente}
                onChange={(e) => setBusquedaCliente(e.target.value)}
                className="pl-10 h-11"
              />
            </div>

            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                placeholder="Buscar por trabajador (nombre o usuario)..."
                value={busquedaTrabajador}
                onChange={(e) => setBusquedaTrabajador(e.target.value)}
                className="pl-10 h-11"
              />
            </div>
          </div>
        </div>

        {filtradas.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center text-muted-foreground">
              No hay solicitudes que coincidan con los filtros.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {filtradas.map((s) => (
              <Card
                key={s.id}
                className={
                  s.estado === "disputa"
                    ? "border-destructive/50 hover:shadow-elevated transition-shadow cursor-pointer"
                    : "hover:shadow-elevated transition-shadow cursor-pointer"
                }
                onClick={() => navigate(`/admin/solicitudes/${s.id}`)}
              >
                <CardContent className="py-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {s.estado === "disputa" && (
                        <Flag size={14} className="text-destructive shrink-0" />
                      )}
                      <p className="font-semibold truncate">
                        {tipoLabel(s.tipo)} — {s.descripcion}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Cliente: <span className="font-medium text-foreground">{s.clienteNombre}</span>
                      {s.trabajadorAsignado && (
                        <>
                          {" "}
                          · Trabajador:{" "}
                          <span className="font-medium text-foreground">
                            {nombreTrabajador(s)}
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                  <EstadoBadge estado={s.estado} />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminSolicitudes;
