import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/authStore";

const MIN_PASSWORD_LENGTH = 6;

export interface CambiarContrasenaValidationResult {
  ok: boolean;
  message?: string;
}

/**
 * Pure validation for the "cambiar contraseña" form. Extracted so it can be
 * unit-tested without rendering the dialog.
 */
export const validarCambioContrasena = (
  actual: string,
  nueva: string,
  confirmar: string,
): CambiarContrasenaValidationResult => {
  if (!actual) {
    return { ok: false, message: "Ingresa tu contraseña actual." };
  }
  if (nueva.length < MIN_PASSWORD_LENGTH) {
    return {
      ok: false,
      message: `La nueva contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`,
    };
  }
  if (nueva !== confirmar) {
    return { ok: false, message: "La confirmación no coincide con la nueva contraseña." };
  }
  return { ok: true };
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CambiarContrasenaDialog = ({ open, onOpenChange }: Props) => {
  const { toast } = useToast();
  const cambiarPassword = useAuthStore((s) => s.cambiarPassword);
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [enviando, setEnviando] = useState(false);

  const resetAndClose = () => {
    setActual("");
    setNueva("");
    setConfirmar("");
    onOpenChange(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validacion = validarCambioContrasena(actual, nueva, confirmar);
    if (!validacion.ok) {
      toast({
        title: "Datos inválidos",
        description: validacion.message,
        variant: "destructive",
      });
      return;
    }
    setEnviando(true);
    const res = await cambiarPassword(actual, nueva);
    setEnviando(false);
    if (!res.ok) {
      toast({
        title: "No se pudo cambiar la contraseña",
        description: res.error ?? "Verifica tu contraseña actual e intenta de nuevo.",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Contraseña actualizada",
      description: "Tu contraseña se cambió correctamente.",
    });
    resetAndClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? resetAndClose() : onOpenChange(v))}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cambiar contraseña</DialogTitle>
          <DialogDescription>
            Ingresa tu contraseña actual y elige una nueva contraseña.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="actual">Contraseña actual</Label>
            <Input
              id="actual"
              type="password"
              value={actual}
              onChange={(e) => setActual(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nueva">Nueva contraseña</Label>
            <Input
              id="nueva"
              type="password"
              value={nueva}
              onChange={(e) => setNueva(e.target.value)}
              autoComplete="new-password"
              minLength={MIN_PASSWORD_LENGTH}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirmar">Confirmar nueva contraseña</Label>
            <Input
              id="confirmar"
              type="password"
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              autoComplete="new-password"
              minLength={MIN_PASSWORD_LENGTH}
              required
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button type="button" variant="outline" onClick={resetAndClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={enviando}>
              {enviando ? "Guardando..." : "Guardar contraseña"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
