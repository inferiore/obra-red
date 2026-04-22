import { useMemo, useState } from "react";
import { LogOut, Plus, Search, MapPin, DollarSign, CheckCircle2, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { useSolicitudes } from "@/context/SolicitudesContext";
import { EstadoBadge } from "@/components/EstadoBadge";
import { SolicitudForm } from "@/components/SolicitudForm";
import {
  TIPOS_TRABAJO,
  ESTADO_LABELS,
  type Solicitud,
  type SolicitudEstado,
} from "@/types/solicitud";
import { useToast } from "@/hooks/use-toast";

const tipoLabel = (tipo: string) => TIPOS_TRABAJO.find((t) => t.value === tipo)?.label ?? tipo;

const formatCOP = (n: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);

const SolicitudCard = ({
  s,
  action,
}: {
  s: Solicitud;
  action?: { label: string; onClick: () => void; icon?: React.ReactNode };
}) => (
  <Card className="hover:shadow-elevated transition-shadow">
    <CardHeader className="pb-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
            {tipoLabel(s.tipo)}
          </p>
          <CardTitle className="text-base mt-1 line-clamp-1">{s.descripcion}</CardTitle>
        </div>
        <EstadoBadge estado={s.estado} />
      </div>
    </CardHeader>
    <CardContent className="space-y-3">
      <p className="text-sm text-muted-foreground line-clamp-2">{s.descripcion}</p>
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="inline-flex items-center gap-1 text-foreground font-semibold">
          <DollarSign size={14} className="text-primary" />
          {formatCOP(s.presupuesto)}
        </span>
        <span className="inline-flex items-center gap-1 text-muted-foreground">
          <MapPin size={14} />
          {s.clienteNombre}
        </span>
      </div>
      {action && (
        <Button onClick={action.onClick} className="w-full mt-2" size="sm">
          {action.icon}
          {action.label}
        </Button>
      )}
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { solicitudes, porUsuario, actualizarEstado } = useSolicitudes();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [openForm, setOpenForm] = useState(false);
  const [filter, setFilter] = useState<SolicitudEstado | "todas">("todas");
  const [search, setSearch] = useState("");

  const isCliente = user?.role === "cliente";
  const isTrabajador = user?.role === "trabajador";
  const username = user?.username ?? "";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const tomar = (id: string) => {
    actualizarEstado(id, "ejecucion", username);
    toast({ title: "Trabajo aceptado", description: "La solicitud está en ejecución." });
  };

  const finalizar = (id: string) => {
    actualizarEstado(id, "finalizado");
    toast({ title: "Trabajo finalizado", description: "El pago en escrow será liberado." });
  };

  const baseList = useMemo(() => {
    if (!user) return [];
    if (isCliente) return porUsuario(username);
    if (isTrabajador) {
      return solicitudes.filter(
        (s) =>
          s.estado === "publicado" ||
          (s.trabajadorAsignado === username && s.estado !== "borrador"),
      );
    }
    return solicitudes;
  }, [user, isCliente, isTrabajador, porUsuario, solicitudes, username]);

  const filtered = useMemo(() => {
    return baseList.filter((s) => {
      const matchEstado = filter === "todas" || s.estado === filter;
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        s.descripcion.toLowerCase().includes(q) ||
        tipoLabel(s.tipo).toLowerCase().includes(q);
      return matchEstado && matchSearch;
    });
  }, [baseList, filter, search]);

  const stats: Record<SolicitudEstado, number> = {
    borrador: baseList.filter((s) => s.estado === "borrador").length,
    publicado: baseList.filter((s) => s.estado === "publicado").length,
    ejecucion: baseList.filter((s) => s.estado === "ejecucion").length,
    finalizado: baseList.filter((s) => s.estado === "finalizado").length,
  };

  if (!user) {
    return <div />;
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <button onClick={() => navigate("/")} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">OR</span>
            </div>
            <span className="text-lg font-bold">
              Obra<span className="text-primary">Red</span>
            </span>
          </button>
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium leading-tight">{user.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut size={16} />
              <span className="hidden sm:inline">Salir</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 md:py-10 space-y-6">
        {/* Title + CTA */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">
              {isCliente ? "Mis solicitudes" : isTrabajador ? "Trabajos disponibles" : "Todas las solicitudes"}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {isCliente
                ? "Publica trabajos y recibe ofertas de profesionales verificados."
                : isTrabajador
                  ? "Encuentra y acepta trabajos publicados por clientes."
                  : "Vista global de todas las solicitudes en la plataforma."}
            </p>
          </div>

          {isCliente && (
            <Dialog open={openForm} onOpenChange={setOpenForm}>
              <DialogTrigger asChild>
                <Button size="lg" className="shadow-elevated">
                  <Plus size={18} />
                  Nueva solicitud
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Nueva solicitud de trabajo</DialogTitle>
                  <DialogDescription>
                    Completa los datos. Puedes guardar como borrador o publicar de inmediato.
                  </DialogDescription>
                </DialogHeader>
                <SolicitudForm onClose={() => setOpenForm(false)} />
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(Object.keys(stats) as SolicitudEstado[]).map((e) => (
            <Card key={e} className="shadow-soft">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  {ESTADO_LABELS[e]}
                </p>
                <p className="text-2xl font-bold mt-1">{stats[e]}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por descripción o tipo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-11"
            />
          </div>
          <Tabs value={filter} onValueChange={(v) => setFilter(v as SolicitudEstado | "todas")}>
            <TabsList className="grid grid-cols-5 w-full md:w-auto">
              <TabsTrigger value="todas">Todas</TabsTrigger>
              <TabsTrigger value="borrador">Borr.</TabsTrigger>
              <TabsTrigger value="publicado">Public.</TabsTrigger>
              <TabsTrigger value="ejecucion">Ejec.</TabsTrigger>
              <TabsTrigger value="finalizado">Final.</TabsTrigger>
            </TabsList>
            <TabsContent value={filter} />
          </Tabs>
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <p className="text-muted-foreground">No hay solicitudes que coincidan.</p>
              {isCliente && (
                <Button className="mt-4" onClick={() => setOpenForm(true)}>
                  <Plus size={16} />
                  Crear primera solicitud
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((s) => {
              let action: Parameters<typeof SolicitudCard>[0]["action"];
              if (isTrabajador && s.estado === "publicado") {
                action = {
                  label: "Tomar trabajo",
                  onClick: () => tomar(s.id),
                  icon: <Send size={14} />,
                };
              } else if (isCliente && s.estado === "ejecucion") {
                action = {
                  label: "Marcar como finalizado",
                  onClick: () => finalizar(s.id),
                  icon: <CheckCircle2 size={14} />,
                };
              } else if (isCliente && s.estado === "borrador") {
                action = {
                  label: "Publicar ahora",
                  onClick: () => {
                    actualizarEstado(s.id, "publicado");
                    toast({ title: "Solicitud publicada" });
                  },
                  icon: <Send size={14} />,
                };
              }
              return <SolicitudCard key={s.id} s={s} action={action} />;
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
