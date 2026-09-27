import { describe, it, expect } from "vitest";
import { validarCambioContrasena } from "@/components/CambiarContrasenaDialog";

describe("validarCambioContrasena", () => {
  it("rechaza cuando falta la contraseña actual", () => {
    const result = validarCambioContrasena("", "nueva123", "nueva123");
    expect(result.ok).toBe(false);
  });

  it("rechaza una nueva contraseña menor al mínimo requerido", () => {
    const result = validarCambioContrasena("actual123", "corta", "corta");
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/al menos 6 caracteres/);
  });

  it("rechaza cuando la confirmación no coincide", () => {
    const result = validarCambioContrasena("actual123", "nueva123", "otradistinta");
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/no coincide/);
  });

  it("acepta cuando todos los campos son válidos y coinciden", () => {
    const result = validarCambioContrasena("actual123", "nueva123", "nueva123");
    expect(result).toEqual({ ok: true });
  });
});
