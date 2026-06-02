import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/obrared-logo.png";
import {
  ArrowLeft,
  Bell,
  Briefcase,
  CheckCircle2,
  CreditCard,
  DollarSign,
  Hammer,
  Image as ImageIcon,
  KeyRound,
  LogOut,
  Mail,
  MapPin,
  Pencil,
  Plus,
  Search,
  Shield,
  ShieldCheck,
  Star,
  TrendingUp,
  User as UserIcon,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { useSolicitudes } from "@/context/SolicitudesContext";
import { EstadoBadge } from "@/components/EstadoBadge";
import { TIPOS_TRABAJO, type Solicitud } from "@/types/solicitud";
import { EditarPerfilDialog } from "@/components/EditarPerfilDialog";

const formatCOP = (n: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);

const tipoLabel = (tipo: string) =>
  TIPOS_TRABAJO.find((t) => t.value === tipo)?.label ?? tipo;

const initials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

/* ---------- Reusable building blocks ---------- */

const StatCard = ({
  label,
  value,
  icon,
  tone = "default",
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  tone?: "default" | "success" | "warning" | "info";
}) => {
  const toneClass =
    tone === "success"
      ? "bg-success/10 text-success"
      : tone === "warning"
        ? "bg-warning/10 text-warning"
        : tone === "info"
          ? "bg-info/10 text-info"
          : "bg-primary/10 text-primary";
  return (
    <Card className="shadow-soft hover:shadow-card transition-shadow">
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${toneClass}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
          <p className="text-xl font-bold leading-tight truncate">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
};

const SectionTitle = ({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) => (
  <div className="flex items-start justify-between gap-4 mb-4">
    <div className="flex items-start gap-3 min-w-0">
      <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <h2 className="text-lg font-bold leading-tight">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
    </div>
    {action}
  </div>
);

const TrabajoMini = ({ s }: { s: Solicitud }) => (
  <div className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border hover:bg-muted/40 transition-colors">
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground uppercase tracking-wide">
        {tipoLabel(s.tipo)}
      </p>
      <p className="text-sm font-medium line-clamp-1">{s.descripcion}</p>
      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
        <MapPin size={11} />
        <span className="line-clamp-1">{s.ubicacion}</span>
      </p>
    </div>
    <div className="flex flex-col items-end gap-1 shrink-0">
      <EstadoBadge estado={s.estado} />
      <span className="text-sm font-semibold">{formatCOP(s.presupuesto)}</span>
    </div>
  </div>
);

/* ---------- Page ---------- */

const Perfil = () => {
  const { user, logout } = useAuth();
  const { solicitudes, porUsuario } = useSolicitudes();
  const navigate = useNavigate();
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifPush, setNotifPush] = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  const isCliente = user?.role === "cliente";
  const isTrabajador = user?.role === "trabajador";
  const username = user?.username ?? "";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  /* ----- Cliente data ----- */
  const misSolicitudes = useMemo(
    () => (isCliente ? porUsuario(username) : []),
    [isCliente, porUsuario, username],
  );
  const clienteStats = {
    publicados: misSolicitudes.length,
    activos: misSolicitudes.filter(
      (s) => s.estado === "publicado" || s.estado === "ejecucion",
    ).length,
    finalizados: misSolicitudes.filter((s) => s.estado === "finalizado").length,
  };
  const clientePagos = misSolicitudes
    .filter((s) => s.estado === "ejecucion" || s.estado === "finalizado")
    .map((s) => ({
      id: s.id,
      titulo: tipoLabel(s.tipo),
      monto: s.presupuesto,
      estado: s.estado === "finalizado" ? "liberado" : "retenido",
      fecha: s.createdAt,
    }));

  /* ----- Trabajador data ----- */
  const trabajosTrabajador = useMemo(
    () =>
      isTrabajador
        ? solicitudes.filter((s) => s.trabajadorAsignado === username)
        : [],
    [isTrabajador, solicitudes, username],
  );

  if (!user) return <div />;
  const trabajadorStats = {
    completados: trabajosTrabajador.filter((s) => s.estado === "finalizado").length,
    activos: trabajosTrabajador.filter((s) => s.estado === "ejecucion").length,
    rating: 4.8,
    aceptacion: 92,
  };
  const ingresos = {
    acumulado: trabajosTrabajador
      .filter((s) => s.estado === "finalizado")
      .reduce((sum, s) => sum + s.presupuesto, 0),
    pendiente: trabajosTrabajador
      .filter((s) => s.estado === "ejecucion")
      .reduce((sum, s) => sum + s.presupuesto, 0),
  };

  /* ---------- Render ---------- */

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Top bar */}
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft size={18} />
            <span className="hidden sm:inline">Volver al panel</span>
          </button>
          <button onClick={() => navigate("/")} className="flex items-center gap-2">
            <img src={logo} alt="ObraRed" className="w-9 h-9 rounded-lg object-cover" />
            <span className="text-lg font-bold">
              Obra<span className="text-primary">Red</span>
            </span>
          </button>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut size={16} />
            <span className="hidden sm:inline">Salir</span>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 md:py-10">
        {/* Profile header card */}
        <Card className="shadow-card overflow-hidden">
          <div className="h-20 md:h-28 bg-gradient-primary" />
          <CardContent className="p-4 md:p-6 -mt-12 md:-mt-16">
            <div className="flex flex-col md:flex-row md:items-end gap-4 md:gap-6">
              <Avatar className="w-24 h-24 md:w-28 md:h-28 border-4 border-card shadow-elevated">
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                  {initials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl md:text-3xl font-bold leading-tight">
                    {user.name}
                  </h1>
                  <Badge
                    variant="secondary"
                    className={
                      isTrabajador
                        ? "bg-success/10 text-success border-success/20"
                        : isCliente
                          ? "bg-info/10 text-info border-info/20"
                          : ""
                    }
                  >
                    {isTrabajador ? (
                      <Hammer size={12} className="mr-1" />
                    ) : (
                      <UserIcon size={12} className="mr-1" />
                    )}
                    {isTrabajador ? "Trabajador" : isCliente ? "Cliente" : "Admin"}
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <ShieldCheck size={12} className="text-success" />
                    Verificado
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                  <Mail size={13} /> {user.username}@obrared.co
                </p>
                {isTrabajador && (
                  <div className="flex items-center gap-1 mt-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        size={16}
                        className={
                          i <= Math.round(trabajadorStats.rating)
                            ? "fill-warning text-warning"
                            : "text-muted-foreground/30"
                        }
                      />
                    ))}
                    <span className="text-sm font-semibold ml-1">
                      {trabajadorStats.rating.toFixed(1)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({trabajadorStats.completados} trabajos)
                    </span>
                  </div>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-2 md:self-center">
                <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                  <Pencil size={14} />
                  Editar perfil
                </Button>
                {isCliente ? (
                  <Button size="sm" onClick={() => navigate("/dashboard")}>
                    <Plus size={14} />
                    Publicar trabajo
                  </Button>
                ) : isTrabajador ? (
                  <Button size="sm" onClick={() => navigate("/dashboard")}>
                    <Search size={14} />
                    Buscar trabajos
                  </Button>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs (mobile + desktop) */}
        <Tabs defaultValue="resumen" className="mt-6">
          <TabsList className="w-full grid grid-cols-3 md:w-auto md:inline-grid">
            <TabsTrigger value="resumen">Resumen</TabsTrigger>
            <TabsTrigger value="actividad">
              {isTrabajador ? "Trabajos" : "Mis trabajos"}
            </TabsTrigger>
            <TabsTrigger value="ajustes">Ajustes</TabsTrigger>
          </TabsList>

          {/* ===== Resumen ===== */}
          <TabsContent value="resumen" className="mt-6 space-y-6">
            {isCliente && (
              <>
                <div>
                  <SectionTitle
                    icon={<TrendingUp size={18} />}
                    title="Resumen rápido"
                    description="Tu actividad reciente como cliente."
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <StatCard
                      label="Publicados"
                      value={clienteStats.publicados}
                      icon={<Briefcase size={18} />}
                      tone="info"
                    />
                    <StatCard
                      label="Activos"
                      value={clienteStats.activos}
                      icon={<TrendingUp size={18} />}
                      tone="warning"
                    />
                    <StatCard
                      label="Finalizados"
                      value={clienteStats.finalizados}
                      icon={<CheckCircle2 size={18} />}
                      tone="success"
                    />
                  </div>
                </div>

                <div>
                  <SectionTitle
                    icon={<Wallet size={18} />}
                    title="Pagos"
                    description="Estado del dinero retenido y liberado en escrow."
                  />
                  <Card>
                    <CardContent className="p-0 divide-y divide-border">
                      {clientePagos.length === 0 ? (
                        <p className="p-6 text-center text-sm text-muted-foreground">
                          Aún no tienes pagos registrados.
                        </p>
                      ) : (
                        clientePagos.map((p) => (
                          <div
                            key={p.id}
                            className="flex items-center justify-between p-4 gap-3"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                                  p.estado === "liberado"
                                    ? "bg-success/10 text-success"
                                    : "bg-warning/10 text-warning"
                                }`}
                              >
                                <DollarSign size={16} />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium line-clamp-1">
                                  {p.titulo}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(p.fecha).toLocaleDateString("es-CO")}
                                </p>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="font-semibold text-sm">
                                {formatCOP(p.monto)}
                              </p>
                              <Badge
                                variant="outline"
                                className={
                                  p.estado === "liberado"
                                    ? "bg-success/10 text-success border-success/20 text-xs"
                                    : "bg-warning/10 text-warning border-warning/20 text-xs"
                                }
                              >
                                {p.estado === "liberado" ? "Liberado" : "Retenido"}
                              </Badge>
                            </div>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <SectionTitle
                    icon={<Shield size={18} />}
                    title="Seguridad y pagos"
                    description="Métodos guardados y verificación de cuenta."
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <CreditCard size={16} className="text-primary" />
                          Métodos de pago
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-5 rounded bg-foreground/80" />
                            <span className="text-sm">•••• 4242</span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            Principal
                          </Badge>
                        </div>
                        <Button variant="outline" size="sm" className="w-full">
                          <Plus size={14} /> Agregar método
                        </Button>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <ShieldCheck size={16} className="text-success" />
                          Verificación
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span>Correo electrónico</span>
                          <Badge className="bg-success/10 text-success border-success/20">
                            Verificado
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Teléfono</span>
                          <Badge variant="outline">Pendiente</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Documento de identidad</span>
                          <Badge className="bg-success/10 text-success border-success/20">
                            Verificado
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </>
            )}

            {isTrabajador && (
              <>
                <div>
                  <SectionTitle
                    icon={<Hammer size={18} />}
                    title="Perfil profesional"
                    description="Tu especialidad y experiencia visible para los clientes."
                  />
                  <Card>
                    <CardContent className="p-5 space-y-4">
                      <div className="flex flex-wrap gap-2">
                        <Badge className="bg-primary/10 text-primary border-primary/20">
                          Plomería
                        </Badge>
                        <Badge className="bg-primary/10 text-primary border-primary/20">
                          Albañilería
                        </Badge>
                        <Badge variant="outline">+ Agregar</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Profesional con más de 8 años de experiencia en remodelaciones
                        residenciales. Trabajo limpio, puntual y con garantía.
                      </p>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground">Experiencia</p>
                          <p className="font-semibold">8 años</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Zona</p>
                          <p className="font-semibold">Cartagena</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <SectionTitle
                    icon={<TrendingUp size={18} />}
                    title="Métricas"
                    description="Tu desempeño en la plataforma."
                  />
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <StatCard
                      label="Calificación"
                      value={trabajadorStats.rating.toFixed(1)}
                      icon={<Star size={18} />}
                      tone="warning"
                    />
                    <StatCard
                      label="Completados"
                      value={trabajadorStats.completados}
                      icon={<CheckCircle2 size={18} />}
                      tone="success"
                    />
                    <StatCard
                      label="Activos"
                      value={trabajadorStats.activos}
                      icon={<Briefcase size={18} />}
                      tone="info"
                    />
                    <StatCard
                      label="Aceptación"
                      value={`${trabajadorStats.aceptacion}%`}
                      icon={<TrendingUp size={18} />}
                    />
                  </div>
                  <Card className="mt-3">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Tasa de aceptación</span>
                        <span className="font-semibold">{trabajadorStats.aceptacion}%</span>
                      </div>
                      <Progress value={trabajadorStats.aceptacion} className="h-2" />
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <SectionTitle
                    icon={<Wallet size={18} />}
                    title="Ingresos"
                    description="Resumen económico de tus trabajos."
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Card>
                      <CardContent className="p-5">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">
                          Ganancias acumuladas
                        </p>
                        <p className="text-2xl font-bold mt-1 text-success">
                          {formatCOP(ingresos.acumulado)}
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-5">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">
                          Pagos pendientes (escrow)
                        </p>
                        <p className="text-2xl font-bold mt-1 text-warning">
                          {formatCOP(ingresos.pendiente)}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <div>
                  <SectionTitle
                    icon={<ImageIcon size={18} />}
                    title="Portafolio"
                    description="Muestra tus mejores trabajos a los clientes."
                    action={
                      <Button variant="outline" size="sm">
                        <Plus size={14} /> Agregar
                      </Button>
                    }
                  />
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="aspect-square rounded-lg bg-muted flex items-center justify-center text-muted-foreground border border-border"
                      >
                        <ImageIcon size={24} />
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          {/* ===== Actividad ===== */}
          <TabsContent value="actividad" className="mt-6 space-y-6">
            <div>
              <SectionTitle
                icon={<Briefcase size={18} />}
                title={isCliente ? "Mis trabajos" : "Mis trabajos asignados"}
                description={
                  isCliente
                    ? "Todas las solicitudes que has publicado."
                    : "Trabajos en ejecución y finalizados."
                }
              />
              {(isCliente ? misSolicitudes : trabajosTrabajador).length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground text-sm">
                      Aún no tienes actividad registrada.
                    </p>
                    <Button
                      className="mt-4"
                      size="sm"
                      onClick={() => navigate("/dashboard")}
                    >
                      {isCliente ? "Publicar mi primer trabajo" : "Buscar oportunidades"}
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {(isCliente ? misSolicitudes : trabajosTrabajador).map((s) => (
                    <TrabajoMini key={s.id} s={s} />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* ===== Ajustes ===== */}
          <TabsContent value="ajustes" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Pencil size={16} className="text-primary" /> Editar perfil
                  </CardTitle>
                  <CardDescription>
                    Actualiza tu nombre, foto y datos de contacto.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" size="sm" className="w-full">
                    Editar información personal
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Bell size={16} className="text-primary" /> Notificaciones
                  </CardTitle>
                  <CardDescription>Decide cómo quieres ser notificado.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Correo electrónico</p>
                      <p className="text-xs text-muted-foreground">
                        Resumen y nuevas oportunidades.
                      </p>
                    </div>
                    <Switch checked={notifEmail} onCheckedChange={setNotifEmail} />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Push</p>
                      <p className="text-xs text-muted-foreground">
                        Alertas en tiempo real.
                      </p>
                    </div>
                    <Switch checked={notifPush} onCheckedChange={setNotifPush} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <KeyRound size={16} className="text-primary" /> Seguridad
                  </CardTitle>
                  <CardDescription>Cambia tu contraseña periódicamente.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" size="sm" className="w-full">
                    Cambiar contraseña
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-destructive/30">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2 text-destructive">
                    <LogOut size={16} /> Cerrar sesión
                  </CardTitle>
                  <CardDescription>Saldrás de tu cuenta en este dispositivo.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full"
                    onClick={handleLogout}
                  >
                    Cerrar sesión
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Perfil;
