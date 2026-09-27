import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EstadoBadge } from "@/components/EstadoBadge";
import { useSolicitudesStore } from "@/store/solicitudesStore";
import { TIPOS_TRABAJO, type Solicitud } from "@/types/solicitud";

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

const AdminSolicitudes = () => {
  const navigate = useNavigate();
  const solicitudes = useSolicitudesStore((s) => s.solicitudes);
  const fetchAll = useSolicitudesStore((s) => s.fetchAll);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const ordenadas = useMemo(() => ordenarParaAdmin(solicitudes), [solicitudes]);

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

        {ordenadas.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center text-muted-foreground">
              No hay solicitudes registradas.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {ordenadas.map((s) => (
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
                          <span className="font-medium text-foreground">{s.trabajadorAsignado}</span>
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
