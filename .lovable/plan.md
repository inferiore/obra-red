## Problema

En `LegalDialog`, el contenido (resumen de Términos / Privacidad) se desborda en pantallas pequeñas y no se puede hacer scroll dentro del modal. El `ScrollArea` está presente pero su viewport interno colapsa porque el contenedor padre no le da una altura concreta cuando se combina `grid` (de `DialogContent`) con `flex-1`.

## Solución

Ajustar `src/components/LegalDialog.tsx` para que el modal tenga una altura máxima real y el área de scroll funcione correctamente en móvil, tablet y desktop, manteniendo header y footer fijos.

### Cambios en `src/components/LegalDialog.tsx`

1. En `DialogContent`:
   - Cambiar la estructura interna a `flex flex-col` con altura controlada: `h-[85vh] sm:h-auto sm:max-h-[85vh]`.
   - Forzar layout vertical con `flex` (en lugar de heredar `grid` del componente base) sobreescribiendo con `!grid-rows-none flex flex-col`.
2. En `ScrollArea`:
   - Asegurar `flex-1 min-h-0` para que ocupe el espacio restante entre header y footer y permita overflow.
3. Header y footer permanecen `shrink-0` para no comprimirse.
4. Mantener todo el contenido (resúmenes, botón "Ver documento completo", botón "Entendido") sin cambios visuales.

### Resultado esperado

- Móvil: modal ocupa ~85% del alto de la pantalla, header y footer fijos, lista de cláusulas scrolleable.
- Desktop: modal centrado con altura máxima 85vh, scroll interno cuando el contenido excede.
- Funciona igual para Términos y para Política de Privacidad.

### Archivos a modificar

- `src/components/LegalDialog.tsx` (único cambio)
