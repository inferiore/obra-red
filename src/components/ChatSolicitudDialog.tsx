import { useEffect, useMemo, useState } from "react";
import { Send, MessageCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMensajesStore, type Mensaje } from "@/store/mensajesStore";
import { useSolicitudesStore } from "@/store/solicitudesStore";
import { useAuthStore } from "@/store/authStore";
import type { SolicitudEstado } from "@/types/solicitud";

const EMPTY_MENSAJES: Mensaje[] = [];

interface Props {
  solicitudId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  estado?: SolicitudEstado;
}

export const ChatSolicitudDialog = ({ solicitudId, open, onOpenChange, estado }: Props) => {
  const mensajes = useMensajesStore((s) =>
    solicitudId ? s.bySolicitud[solicitudId] ?? EMPTY_MENSAJES : EMPTY_MENSAJES
  );
  const fetchBySolicitud = useMensajesStore((s) => s.fetchBySolicitud);
  const enviar = useMensajesStore((s) => s.enviar);
  const solicitudEnStore = useSolicitudesStore((s) =>
    solicitudId ? s.solicitudes.find((sol) => sol.id === solicitudId) : undefined
  );
  const username = useAuthStore((s) => s.user?.username);

  const [contenido, setContenido] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (open && solicitudId) {
      fetchBySolicitud(solicitudId);
    }
  }, [open, solicitudId, fetchBySolicitud]);

  useEffect(() => {
    if (!open) setContenido("");
  }, [open]);

  const estadoActual = estado ?? solicitudEnStore?.estado;
  const soloLectura = estadoActual === "finalizado";

  const handleEnviar = async () => {
    const texto = contenido.trim();
    if (!texto || !solicitudId || soloLectura) return;
    setEnviando(true);
    try {
      await enviar(solicitudId, texto);
      setContenido("");
    } finally {
      setEnviando(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleEnviar();
    }
  };

  if (!solicitudId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden h-[100dvh] sm:h-[70vh] w-screen sm:w-full sm:rounded-lg rounded-none grid grid-rows-[auto_1fr_auto]">
        <DialogHeader className="px-5 sm:px-6 pt-6 pb-4 border-b shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <MessageCircle size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-lg">Mensajes</DialogTitle>
              <DialogDescription>
                {soloLectura
                  ? "Conversación finalizada — historial de solo lectura."
                  : "Conversación sobre esta solicitud."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="min-h-0">
          <div className="px-5 sm:px-6 py-4 space-y-3">
            {mensajes.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">
                Aún no hay mensajes en esta conversación.
              </p>
            ) : (
              mensajes.map((m) => {
                const esPropio = m.autorUsername === username;
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${esPropio ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                        esPropio
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      {m.contenido}
                    </div>
                    <span className="text-[10px] text-muted-foreground mt-0.5 px-1">
                      {m.autorUsername} ·{" "}
                      {new Date(m.createdAt).toLocaleString("es-CO")}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>

        <div className="border-t bg-background px-5 sm:px-6 py-3 shrink-0 flex items-center gap-2">
          <Input
            value={contenido}
            onChange={(e) => setContenido(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={soloLectura ? "Esta conversación ya finalizó" : "Escribe un mensaje..."}
            disabled={soloLectura || enviando}
          />
          <Button
            size="icon"
            onClick={handleEnviar}
            disabled={soloLectura || enviando || !contenido.trim()}
          >
            <Send size={16} />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
