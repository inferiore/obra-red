

## Agregar campo de ubicación al formulario de solicitud

Voy a añadir un nuevo campo **"Ubicación exacta del servicio"** al formulario de nueva solicitud (`SolicitudForm.tsx`) para que el cliente pueda especificar dónde se realizará el trabajo. La ubicación se mostrará también en las tarjetas del Dashboard reemplazando el nombre del cliente como dato geográfico.

### 1. Cambios en el modelo de datos

**`src/types/solicitud.ts`**
- Agregar campo `ubicacion: string` a la interfaz `Solicitud`.
- Actualizar las 4 solicitudes mock (`MOCK_SOLICITUDES` en el contexto) con direcciones realistas de Cartagena (ej. *"Manga, Cra 21 #29-45"*, *"Bocagrande, Av. San Martín #5-110"*).

### 2. Cambios en el formulario `SolicitudForm.tsx`

Añadir un nuevo campo entre "Presupuesto" y "Fotos" con:
- **Label:** "Ubicación exacta del servicio *"
- **Input** con ícono de `MapPin` (de lucide-react) a la izquierda.
- **Placeholder:** "Ej: Barrio Manga, Cra 21 #29-45, Cartagena"
- **Texto auxiliar:** "Indica barrio, dirección y referencias para que el trabajador pueda llegar fácilmente."
- Validación obligatoria (no vacío, mínimo 5 caracteres) integrada al `submit` existente con su mensaje de toast correspondiente.
- Estado local: `const [ubicacion, setUbicacion] = useState("")`.
- Se incluye en el payload pasado a `crear(...)`.

### 3. Cambios en `SolicitudesContext.tsx`

- Añadir `ubicacion` en cada uno de los 4 mocks.
- No requiere cambios en la firma de `crear` (ya usa `Omit<Solicitud, ...>`, hereda el campo automáticamente).

### 4. Cambios visuales en `Dashboard.tsx` (`SolicitudCard`)

- En la fila de metadatos, reemplazar el `MapPin + clienteNombre` por `MapPin + s.ubicacion` (truncado con `line-clamp-1` si es largo).
- Mover el nombre del cliente a una línea adicional pequeña arriba (visible solo para trabajador/admin) para no perder esa info.

### Estructura visual del nuevo campo

```text
┌─────────────────────────────────────────┐
│ Ubicación exacta del servicio *         │
│ ┌─────────────────────────────────────┐ │
│ │ 📍 Ej: Barrio Manga, Cra 21 #29-45  │ │
│ └─────────────────────────────────────┘ │
│ Indica barrio, dirección y referencias…│
└─────────────────────────────────────────┘
```

### Notas técnicas

- Se mantiene el enfoque **hardcoded / localStorage** sin backend.
- El campo es texto libre (no se integra mapa ni geocoding) para mantener la simplicidad pedida hasta ahora; queda preparado para reemplazarse luego por un selector de mapa.
- Se aplica `trim()` y validación de longitud mínima como buena práctica (alineado con la guía de validación de inputs).
- No se modifica ningún otro componente fuera de los listados.

