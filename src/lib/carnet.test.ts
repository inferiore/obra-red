import { describe, it, expect } from "vitest";
import { puedeVerCarnet } from "@/lib/carnet";

describe("puedeVerCarnet", () => {
  it("es falso cuando no hay trabajador asignado", () => {
    expect(puedeVerCarnet({ trabajadorAsignado: undefined, estado: "ejecucion" })).toBe(false);
  });

  it("es falso una vez finalizado, aunque haya trabajador asignado", () => {
    expect(puedeVerCarnet({ trabajadorAsignado: "trabajador1", estado: "finalizado" })).toBe(false);
  });

  it.each(["ejecucion", "revision", "corrigiendo", "disputa"] as const)(
    "es verdadero durante %s si hay trabajador asignado",
    (estado) => {
      expect(puedeVerCarnet({ trabajadorAsignado: "trabajador1", estado })).toBe(true);
    },
  );

  it("es falso en borrador o publicado (nunca hay trabajador asignado ahí)", () => {
    expect(puedeVerCarnet({ trabajadorAsignado: undefined, estado: "publicado" })).toBe(false);
  });
});
