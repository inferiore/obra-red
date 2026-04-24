## Crear ventana de registro dinámica según rol

Se añadirá una nueva página de registro (`/registro`) que adapta sus campos al rol seleccionado previamente (Cliente o Trabajador), manteniendo la armonía visual de ObraRed (mobile-first, naranja primario, azul para cliente, verde para trabajador).

### 1. Nueva página `src/pages/Register.tsx`

- Lee `?role=cliente|trabajador` desde la URL (igual que `Login.tsx`).
- Header con logo de ObraRed, título dinámico ("Crear cuenta de Cliente" / "Crear cuenta de Trabajador") y botón "Volver" hacia `/acceso?mode=register`.
- Layout mobile-first: una columna con scroll vertical en móvil, dos columnas (datos personales | datos del rol) en desktop ≥ `md`.
- Color de acento del botón principal: `info` (azul) para cliente, `primary` (naranja) para trabajador.

#### Campos comunes (ambos roles)
- Nombre completo (mín. 3 caracteres)
- Documento de identidad (CC, 6–12 dígitos)
- Teléfono Colombia (regex `^3\d{9}$`)
- Email (validación email)
- Usuario (alfanumérico, 4–20 caracteres)
- Contraseña (mín. 8, al menos 1 mayúscula y 1 número) con toggle de visibilidad
- Confirmar contraseña (debe coincidir)
- Checkbox "Acepto los términos y condiciones" (obligatorio)

#### Campos extra Cliente
- Tipo de cliente: radio "Persona natural" / "Empresa"
- Si "Empresa": razón social + NIT
- Dirección principal en Cartagena
- Barrio (texto libre)

#### Campos extra Trabajador
- Especialidad principal: select con `TIPOS_TRABAJO` (de `types/solicitud.ts`)
- Especialidades adicionales: chips multi-select (opcional)
- Años de experiencia (number 0–60)
- Descripción profesional (textarea, 50–500 caracteres con contador)
- Zonas de cobertura: multi-select de barrios principales de Cartagena (Centro, Manga, Bocagrande, Crespo, Castillogrande, Pie de la Popa, Getsemaní, Olaya Herrera)

### 2. Validación

Uso de `zod` + `react-hook-form` (ya disponibles en el proyecto vía `@hookform/resolvers`). Schemas separados `clienteSchema` y `trabajadorSchema`, ambos extendiendo un `baseSchema` común. Errores mostrados bajo cada input con el componente `FormMessage`.

### 3. Persistencia (sin backend)

- Nuevo helper en `src/context/AuthContext.tsx`:
  - `register(data: RegisterPayload): { ok: boolean; error?: string }`
  - Guarda usuarios en `localStorage` con clave `obrared_registered_users` (array de `AuthUser` extendido con campos de perfil).
  - Verifica unicidad de `username` y `email` contra hardcoded + registrados.
- `login()` se modifica para buscar primero en `HARDCODED_USERS` y luego en `localStorage`.
- Tras registro exitoso: toast de éxito, auto-login, y `navigate("/dashboard")`.

### 4. Navegación

- `RoleSelect.tsx`: cuando `mode === "register"`, los botones de rol redirigen a `/registro?role=...` en vez de `/login?role=...`.
- `App.tsx`: añadir `<Route path="/registro" element={<Register />} />`.
- Enlace "¿Ya tienes cuenta? Inicia sesión" al final del formulario que lleva a `/login?role=...&mode=login`.

### 5. UX y estilo

- Inputs con icons de `lucide-react` (User, Phone, Mail, Lock, MapPin, Briefcase, FileText).
- Secciones agrupadas en `Card` con título ("Datos personales", "Información del cliente" / "Perfil profesional").
- Botón submit a ancho completo, altura 14, color según rol, con estado `loading` y spinner durante el "registro" simulado (300 ms).
- Indicador de fortaleza de contraseña (barra de progreso simple: débil/media/fuerte).
- Responsive: en `md+` los grupos se muestran en grid de 2 columnas dentro de cada card.

### Estructura visual (móvil)

```text
┌────────────────────────────┐
│ ← Volver                   │
│   [Logo]                   │
│   Crear cuenta de Cliente  │
├────────────────────────────┤
│ Card: Datos personales     │
│  Nombre / Documento        │
│  Teléfono / Email          │
│  Usuario / Contraseña      │
├────────────────────────────┤
│ Card: Información Cliente  │
│  Tipo / Dirección / Barrio │
├────────────────────────────┤
│ ☐ Acepto términos          │
│ [ Crear cuenta ]           │
│ ¿Ya tienes cuenta? Inicia  │
└────────────────────────────┘
```

### Archivos afectados

- **Crear:** `src/pages/Register.tsx`
- **Editar:** `src/App.tsx` (nueva ruta), `src/pages/RoleSelect.tsx` (redirección condicional), `src/context/AuthContext.tsx` (función `register` + login extendido), `src/types/solicitud.ts` (extender `AuthUser` con campos opcionales de perfil).

### Notas técnicas

- Sin backend: persistencia en `localStorage`. Las contraseñas se almacenan en texto plano (mock); se documenta como limitación temporal.
- Validación 100% client-side con `zod`.
- El registro no envía email de confirmación; el usuario queda activo inmediatamente.
- Compatible con el flujo existente de roles y `ProtectedRoute`.
