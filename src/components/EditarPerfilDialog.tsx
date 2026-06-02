import { useEffect, useState } from "react";
import { z } from "zod";
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
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const schema = z.object({
  name: z.string().trim().min(2, "Mínimo 2 caracteres").max(80, "Máximo 80 caracteres"),
  email: z
    .string()
    .trim()
    .max(255, "Máximo 255 caracteres")
    .email("Correo inválido")
    .or(z.literal("")),
  telefono: z
    .string()
    .trim()
    .max(20, "Máximo 20 caracteres")
    .regex(/^[+0-9\s-]*$/, "Solo números, espacios, + o -")
    .or(z.literal("")),
  direccion: z.string().trim().max(120, "Máximo 120 caracteres").or(z.literal("")),
});

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditarPerfilDialog = ({ open, onOpenChange }: Props) => {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", telefono: "", direccion: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open && user) {
      setForm({
        name: user.name ?? "",
        email: user.email ?? "",
        telefono: user.telefono ?? "",
        direccion: user.direccion ?? "",
      });
      setErrors({});
    }
  }, [open, user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.issues.forEach((i) => {
        fieldErrors[i.path[0] as string] = i.message;
      });
      setErrors(fieldErrors);
      return;
    }
    const res = updateProfile(parsed.data);
    if (!res.ok) {
      toast.error(res.error ?? "No se pudo actualizar el perfil");
      return;
    }
    toast.success("Perfil actualizado correctamente");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar perfil</DialogTitle>
          <DialogDescription>
            Actualiza tu información personal. Los cambios se guardarán en tu cuenta.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nombre completo</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              maxLength={80}
              required
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              maxLength={255}
              placeholder="tucorreo@ejemplo.com"
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="telefono">Teléfono</Label>
            <Input
              id="telefono"
              value={form.telefono}
              onChange={(e) => setForm({ ...form, telefono: e.target.value })}
              maxLength={20}
              placeholder="+57 300 000 0000"
            />
            {errors.telefono && <p className="text-xs text-destructive">{errors.telefono}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="direccion">Dirección</Label>
            <Input
              id="direccion"
              value={form.direccion}
              onChange={(e) => setForm({ ...form, direccion: e.target.value })}
              maxLength={120}
              placeholder="Calle, ciudad"
            />
            {errors.direccion && (
              <p className="text-xs text-destructive">{errors.direccion}</p>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Guardar cambios</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
