import { useEffect, useState } from "react";
import { Bell, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNotificacionesStore, type Notificacion } from "@/store/notificacionesStore";
import { useSolicitudesStore } from "@/store/solicitudesStore";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/hooks/use-toast";
import { OfertasDialog } from "@/components/OfertasDialog";
import { SolicitudDetailDialog } from "@/components/SolicitudDetailDialog";
import { ProgresoTrabajoDialog } from "@/components/ProgresoTrabajoDialog";
import { ChatSolicitudDialog } from "@/components/ChatSolicitudDialog";
import type { Solicitud, UserRole } from "@/types/solicitud";

type DialogTipo = "ofertas" | "detalle" | "progreso" | "chat" | null;

const resolverDialogTipo = (tipo: string, role?: UserRole): DialogTipo => {
  switch (tipo) {
    case "nueva_oferta":
      return "ofertas";
    case "oferta_aceptada":
      return "detalle";
    case "nuevo_mensaje":
      return "chat";
    case "solicitud_en_ejecucion":
      return "progreso";
    case "solicitud_finalizada":
      return "detalle";
    case "solicitud_en_disputa":
    case "disputa_resuelta":
      return role === "trabajador" ? "detalle" : "progreso";
    default:
      return null;
  }
};

export const NotificacionesMenu = () => {
  const items = useNotificacionesStore((s) => s.items);
  const noLeidas = useNotificacionesStore((s) => s.noLeidas);
  const fetchAll = useNotificacionesStore((s) => s.fetchAll);
  const marcarLeida = useNotificacionesStore((s) => s.marcarLeida);
  const solicitudes = useSolicitudesStore((s) => s.solicitudes);
  const fetchOne = useSolicitudesStore((s) => s.fetchOne);
  const role = useAuthStore((s) => s.user?.role);
  const { toast } = useToast();

  const [dialogTipo, setDialogTipo] = useState<DialogTipo>(null);
  const [solicitud, setSolicitud] = useState<Solicitud | null>(null);
  const [chatSolicitudId, setChatSolicitudId] = useState<string | null>(null);
  const [cargandoId, setCargandoId] = useState<string | null>(null);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleClick = async (n: Notificacion) => {
    if (cargandoId) return;
    if (!n.leido) marcarLeida(n.id);

    if (!n.solicitudId) return;

    const tipo = resolverDialogTipo(n.tipo, role);
    if (!tipo) return;

    if (tipo === "chat") {
      setChatSolicitudId(n.solicitudId);
      setDialogTipo("chat");
      return;
    }

    const cacheada = solicitudes.find((s) => s.id === n.solicitudId);
    if (cacheada) {
      setSolicitud(cacheada);
      setDialogTipo(tipo);
      return;
    }

    setCargandoId(n.id);
    try {
      const resuelta = await fetchOne(n.solicitudId);
      setSolicitud(resuelta);
      setDialogTipo(tipo);
    } catch {
      toast({
        title: "No se pudo cargar la solicitud",
        variant: "destructive",
      });
    } finally {
      setCargandoId(null);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="relative">
            <Bell size={16} />
            {noLeidas > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-4 min-w-4 justify-center rounded-full px-1 text-[10px] leading-none"
              >
                {noLeidas}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuLabel>Notificaciones</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {items.length === 0 ? (
            <p className="px-2 py-4 text-center text-sm text-muted-foreground">
              No tienes notificaciones.
            </p>
          ) : (
            items.map((n) => (
              <DropdownMenuItem
                key={n.id}
                onClick={() => handleClick(n)}
                className={`flex flex-col items-start gap-0.5 whitespace-normal ${
                  n.leido ? "opacity-60" : "font-medium"
                }`}
              >
                <div className="flex w-full items-center gap-2">
                  <span className="text-sm">{n.mensaje}</span>
                  {cargandoId === n.id && (
                    <Loader2 size={12} className="animate-spin shrink-0" />
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(n.createdAt).toLocaleString("es-CO")}
                </span>
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <OfertasDialog
        solicitud={dialogTipo === "ofertas" ? solicitud : null}
        open={dialogTipo === "ofertas"}
        onOpenChange={(v) => !v && setDialogTipo(null)}
      />
      <SolicitudDetailDialog
        solicitud={dialogTipo === "detalle" ? solicitud : null}
        open={dialogTipo === "detalle"}
        onOpenChange={(v) => !v && setDialogTipo(null)}
      />
      <ProgresoTrabajoDialog
        solicitud={dialogTipo === "progreso" ? solicitud : null}
        open={dialogTipo === "progreso"}
        onOpenChange={(v) => !v && setDialogTipo(null)}
      />
      <ChatSolicitudDialog
        solicitudId={dialogTipo === "chat" ? chatSolicitudId : null}
        open={dialogTipo === "chat"}
        onOpenChange={(v) => !v && setDialogTipo(null)}
      />
    </>
  );
};
