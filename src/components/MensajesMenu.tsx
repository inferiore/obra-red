import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
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
import { useMensajesStore } from "@/store/mensajesStore";
import { ChatSolicitudDialog } from "@/components/ChatSolicitudDialog";

export const MensajesMenu = () => {
  const conversaciones = useMensajesStore((s) => s.conversaciones);
  const fetchConversaciones = useMensajesStore((s) => s.fetchConversaciones);
  const [solicitudId, setSolicitudId] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    fetchConversaciones();
  }, [fetchConversaciones]);

  const noLeidos = conversaciones.reduce((sum, c) => sum + c.noLeidos, 0);

  const abrirChat = (id: string) => {
    setSolicitudId(id);
    setChatOpen(true);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="relative">
            <MessageCircle size={16} />
            {noLeidos > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-4 min-w-4 justify-center rounded-full px-1 text-[10px] leading-none"
              >
                {noLeidos}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuLabel>Mensajes</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {conversaciones.length === 0 ? (
            <p className="px-2 py-4 text-center text-sm text-muted-foreground">
              No tienes conversaciones activas.
            </p>
          ) : (
            conversaciones.map((c) => (
              <DropdownMenuItem
                key={c.solicitudId}
                onClick={() => abrirChat(c.solicitudId)}
                className={`flex flex-col items-start gap-0.5 whitespace-normal ${
                  c.noLeidos > 0 ? "font-medium" : "opacity-80"
                }`}
              >
                <div className="flex w-full items-center justify-between gap-2">
                  <span className="text-sm truncate">{c.contraparteNombre}</span>
                  {c.noLeidos > 0 && (
                    <Badge
                      variant="destructive"
                      className="h-4 min-w-4 justify-center rounded-full px-1 text-[10px] leading-none shrink-0"
                    >
                      {c.noLeidos}
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground truncate w-full">
                  {c.ultimoMensaje}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(c.ultimaFecha).toLocaleString("es-CO")}
                </span>
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ChatSolicitudDialog
        solicitudId={solicitudId}
        open={chatOpen}
        onOpenChange={setChatOpen}
      />
    </>
  );
};
