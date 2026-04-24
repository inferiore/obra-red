import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import {
  ArrowLeft,
  AtSign,
  Briefcase,
  Building2,
  Eye,
  EyeOff,
  FileText,
  Hammer,
  IdCard,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Phone,
  User as UserIcon,
} from "lucide-react";
import logo from "@/assets/obrared-logo.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { TIPOS_TRABAJO, type UserRole } from "@/types/solicitud";
import { cn } from "@/lib/utils";

/* -------------------- Constantes -------------------- */

const ZONAS_CARTAGENA = [
  "Centro Histórico",
  "Manga",
  "Bocagrande",
  "Crespo",
  "Castillogrande",
  "Pie de la Popa",
  "Getsemaní",
  "Olaya Herrera",
  "El Laguito",
  "Marbella",
] as const;

/* -------------------- Validación con Zod -------------------- */

const baseSchema = z.object({
  nombre: z.string().trim().min(3, "Mínimo 3 caracteres").max(80, "Máximo 80 caracteres"),
  documento: z
    .string()
    .trim()
    .regex(/^\d{6,12}$/, "Documento inválido (6 a 12 dígitos)"),
  telefono: z
    .string()
    .trim()
    .regex(/^3\d{9}$/, "Celular Colombia: 10 dígitos comenzando en 3"),
  email: z.string().trim().email("Correo inválido").max(255),
  username: z
    .string()
    .trim()
    .min(4, "Mínimo 4 caracteres")
    .max(20, "Máximo 20 caracteres")
    .regex(/^[a-zA-Z0-9_]+$/, "Solo letras, números o guion bajo"),
  password: z
    .string()
    .min(8, "Mínimo 8 caracteres")
    .regex(/[A-Z]/, "Debe incluir una mayúscula")
    .regex(/\d/, "Debe incluir un número"),
  confirmPassword: z.string(),
  terminos: z.literal(true, {
    errorMap: () => ({ message: "Debes aceptar los términos" }),
  }),
});

const clienteSchema = baseSchema
  .extend({
    tipoCliente: z.enum(["natural", "empresa"]),
    razonSocial: z.string().trim().optional(),
    nit: z.string().trim().optional(),
    direccion: z.string().trim().min(5, "Indica una dirección").max(120),
    barrio: z.string().trim().min(2, "Indica el barrio").max(60),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        path: ["confirmPassword"],
        code: z.ZodIssueCode.custom,
        message: "Las contraseñas no coinciden",
      });
    }
    if (data.tipoCliente === "empresa") {
      if (!data.razonSocial || data.razonSocial.length < 3) {
        ctx.addIssue({
          path: ["razonSocial"],
          code: z.ZodIssueCode.custom,
          message: "Razón social requerida (mín. 3 caracteres)",
        });
      }
      if (!data.nit || !/^\d{6,15}$/.test(data.nit)) {
        ctx.addIssue({
          path: ["nit"],
          code: z.ZodIssueCode.custom,
          message: "NIT inválido (6 a 15 dígitos)",
        });
      }
    }
  });

const trabajadorSchema = baseSchema
  .extend({
    especialidad: z.string().min(1, "Selecciona una especialidad"),
    especialidadesExtra: z.array(z.string()).default([]),
    experiencia: z
      .number({ invalid_type_error: "Indica los años" })
      .int()
      .min(0, "Mínimo 0")
      .max(60, "Máximo 60 años"),
    descripcionProfesional: z
      .string()
      .trim()
      .min(50, "Mínimo 50 caracteres")
      .max(500, "Máximo 500 caracteres"),
    zonasCobertura: z.array(z.string()).min(1, "Selecciona al menos una zona"),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        path: ["confirmPassword"],
        code: z.ZodIssueCode.custom,
        message: "Las contraseñas no coinciden",
      });
    }
  });

/* -------------------- Helpers UI -------------------- */

const passwordStrength = (pwd: string): { score: number; label: string; color: string } => {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/\d/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  if (pwd.length >= 12) score++;
  if (score <= 2) return { score, label: "Débil", color: "bg-destructive" };
  if (score === 3) return { score, label: "Media", color: "bg-warning" };
  return { score, label: "Fuerte", color: "bg-success" };
};

const FieldError = ({ msg }: { msg?: string }) =>
  msg ? <p className="text-xs text-destructive mt-1">{msg}</p> : null;

/* -------------------- Componente -------------------- */

const Register = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { register: registerUser } = useAuth();
  const [params] = useSearchParams();
  const roleParam = params.get("role");
  const role: UserRole =
    roleParam === "trabajador" ? "trabajador" : "cliente";

  const isCliente = role === "cliente";
  const isTrabajador = role === "trabajador";

  // Estado del formulario
  const [nombre, setNombre] = useState("");
  const [documento, setDocumento] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [terminos, setTerminos] = useState(false);

  // Cliente
  const [tipoCliente, setTipoCliente] = useState<"natural" | "empresa">("natural");
  const [razonSocial, setRazonSocial] = useState("");
  const [nit, setNit] = useState("");
  const [direccion, setDireccion] = useState("");
  const [barrio, setBarrio] = useState("");

  // Trabajador
  const [especialidad, setEspecialidad] = useState("");
  const [especialidadesExtra, setEspecialidadesExtra] = useState<string[]>([]);
  const [experiencia, setExperiencia] = useState<string>("");
  const [descripcionProfesional, setDescripcionProfesional] = useState("");
  const [zonasCobertura, setZonasCobertura] = useState<string[]>([]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const strength = useMemo(() => passwordStrength(password), [password]);

  const toggleArray = (arr: string[], value: string): string[] =>
    arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const baseData = {
      nombre,
      documento,
      telefono,
      email,
      username,
      password,
      confirmPassword,
      terminos: terminos as true,
    };

    const schema = isCliente ? clienteSchema : trabajadorSchema;
    const data = isCliente
      ? { ...baseData, tipoCliente, razonSocial, nit, direccion, barrio }
      : {
          ...baseData,
          especialidad,
          especialidadesExtra,
          experiencia: experiencia === "" ? NaN : Number(experiencia),
          descripcionProfesional,
          zonasCobertura,
        };

    const result = schema.safeParse(data);
    if (!result.success) {
      const flat: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const key = issue.path.join(".");
        if (!flat[key]) flat[key] = issue.message;
      });
      setErrors(flat);
      toast({
        title: "Revisa el formulario",
        description: "Hay campos con errores que debes corregir.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const payload = result.data;
      const res = registerUser({
        username: payload.username,
        password: payload.password,
        name: payload.nombre,
        role,
        email: payload.email,
        telefono: payload.telefono,
        documento: payload.documento,
        ...(isCliente
          ? {
              tipoCliente: (payload as z.infer<typeof clienteSchema>).tipoCliente,
              razonSocial: (payload as z.infer<typeof clienteSchema>).razonSocial,
              nit: (payload as z.infer<typeof clienteSchema>).nit,
              direccion: (payload as z.infer<typeof clienteSchema>).direccion,
              barrio: (payload as z.infer<typeof clienteSchema>).barrio,
            }
          : {
              especialidad: (payload as z.infer<typeof trabajadorSchema>).especialidad,
              especialidadesExtra: (payload as z.infer<typeof trabajadorSchema>).especialidadesExtra,
              experiencia: (payload as z.infer<typeof trabajadorSchema>).experiencia,
              descripcionProfesional: (payload as z.infer<typeof trabajadorSchema>)
                .descripcionProfesional,
              zonasCobertura: (payload as z.infer<typeof trabajadorSchema>).zonasCobertura,
            }),
      });

      setLoading(false);
      if (!res.ok) {
        toast({
          title: "No se pudo crear la cuenta",
          description: res.error,
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "¡Cuenta creada!",
        description: `Bienvenido a ObraRed, ${payload.nombre.split(" ")[0]}.`,
      });
      navigate("/dashboard");
    }, 400);
  };

  /* -------------------- Render -------------------- */

  const ctaColor = isTrabajador ? "bg-primary hover:bg-primary/90" : "bg-info hover:bg-info/90";
  const ctaText = isTrabajador ? "text-primary-foreground" : "text-info-foreground";

  return (
    <div className="min-h-screen bg-gradient-hero py-8 px-4">
      <div className="w-full max-w-3xl mx-auto">
        {/* Top nav */}
        <button
          onClick={() => navigate("/acceso?mode=register")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6 text-sm"
        >
          <ArrowLeft size={16} />
          Cambiar rol
        </button>

        {/* Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl overflow-hidden shadow-elevated mb-4">
            <img src={logo} alt="ObraRed" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Crear cuenta de{" "}
            <span className={isTrabajador ? "text-primary" : "text-info"}>
              {isTrabajador ? "Trabajador" : "Cliente"}
            </span>
          </h1>
          <p className="text-muted-foreground text-sm mt-2 max-w-md">
            {isTrabajador
              ? "Completa tu perfil profesional para empezar a recibir oportunidades en Cartagena."
              : "Completa tus datos para publicar trabajos y conectar con profesionales verificados."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ============= Datos personales ============= */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <UserIcon size={18} className="text-primary" /> Datos personales
              </CardTitle>
              <CardDescription>Información básica de contacto.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre completo</Label>
                <div className="relative">
                  <UserIcon
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    id="nombre"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Juan Pérez Gómez"
                    className="pl-9 h-11"
                    autoComplete="name"
                  />
                </div>
                <FieldError msg={errors.nombre} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="documento">Documento de identidad</Label>
                <div className="relative">
                  <IdCard
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    id="documento"
                    inputMode="numeric"
                    value={documento}
                    onChange={(e) => setDocumento(e.target.value.replace(/\D/g, ""))}
                    placeholder="1234567890"
                    className="pl-9 h-11"
                    maxLength={12}
                  />
                </div>
                <FieldError msg={errors.documento} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefono">Celular</Label>
                <div className="relative">
                  <Phone
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    id="telefono"
                    inputMode="tel"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value.replace(/\D/g, ""))}
                    placeholder="3001234567"
                    className="pl-9 h-11"
                    maxLength={10}
                    autoComplete="tel"
                  />
                </div>
                <FieldError msg={errors.telefono} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <div className="relative">
                  <Mail
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@correo.com"
                    className="pl-9 h-11"
                    autoComplete="email"
                  />
                </div>
                <FieldError msg={errors.email} />
              </div>
            </CardContent>
          </Card>

          {/* ============= Sección por rol ============= */}
          {isCliente ? (
            <Card className="shadow-card border-info/20">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 size={18} className="text-info" /> Información del cliente
                </CardTitle>
                <CardDescription>
                  Cuéntanos un poco sobre ti o tu empresa.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Tipo de cliente</Label>
                  <RadioGroup
                    value={tipoCliente}
                    onValueChange={(v) => setTipoCliente(v as "natural" | "empresa")}
                    className="grid grid-cols-2 gap-3"
                  >
                    <label
                      className={cn(
                        "flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors",
                        tipoCliente === "natural"
                          ? "border-info bg-info/5"
                          : "border-border hover:border-info/50",
                      )}
                    >
                      <RadioGroupItem value="natural" />
                      <span className="text-sm font-medium">Persona natural</span>
                    </label>
                    <label
                      className={cn(
                        "flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors",
                        tipoCliente === "empresa"
                          ? "border-info bg-info/5"
                          : "border-border hover:border-info/50",
                      )}
                    >
                      <RadioGroupItem value="empresa" />
                      <span className="text-sm font-medium">Empresa</span>
                    </label>
                  </RadioGroup>
                </div>

                {tipoCliente === "empresa" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="razonSocial">Razón social</Label>
                      <Input
                        id="razonSocial"
                        value={razonSocial}
                        onChange={(e) => setRazonSocial(e.target.value)}
                        placeholder="Constructora ABC S.A.S."
                        className="h-11"
                      />
                      <FieldError msg={errors.razonSocial} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nit">NIT</Label>
                      <Input
                        id="nit"
                        inputMode="numeric"
                        value={nit}
                        onChange={(e) => setNit(e.target.value.replace(/\D/g, ""))}
                        placeholder="900123456"
                        className="h-11"
                        maxLength={15}
                      />
                      <FieldError msg={errors.nit} />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="direccion">Dirección principal</Label>
                    <div className="relative">
                      <MapPin
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      />
                      <Input
                        id="direccion"
                        value={direccion}
                        onChange={(e) => setDireccion(e.target.value)}
                        placeholder="Cra 21 #29-45, Edificio Marina"
                        className="pl-9 h-11"
                        autoComplete="street-address"
                      />
                    </div>
                    <FieldError msg={errors.direccion} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="barrio">Barrio</Label>
                    <Input
                      id="barrio"
                      value={barrio}
                      onChange={(e) => setBarrio(e.target.value)}
                      placeholder="Manga"
                      className="h-11"
                    />
                    <FieldError msg={errors.barrio} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-card border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Hammer size={18} className="text-primary" /> Perfil profesional
                </CardTitle>
                <CardDescription>
                  Esta información se mostrará a los clientes.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Especialidad principal</Label>
                    <Select value={especialidad} onValueChange={setEspecialidad}>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Selecciona tu oficio" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIPOS_TRABAJO.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError msg={errors.especialidad} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="experiencia">Años de experiencia</Label>
                    <div className="relative">
                      <Briefcase
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      />
                      <Input
                        id="experiencia"
                        type="number"
                        min={0}
                        max={60}
                        value={experiencia}
                        onChange={(e) => setExperiencia(e.target.value)}
                        placeholder="5"
                        className="pl-9 h-11"
                      />
                    </div>
                    <FieldError msg={errors.experiencia} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Especialidades adicionales (opcional)</Label>
                  <div className="flex flex-wrap gap-2">
                    {TIPOS_TRABAJO.filter((t) => t.value !== especialidad).map((t) => {
                      const active = especialidadesExtra.includes(t.value);
                      return (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() =>
                            setEspecialidadesExtra((prev) => toggleArray(prev, t.value))
                          }
                          className={cn(
                            "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                            active
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-background hover:bg-muted border-border text-muted-foreground",
                          )}
                        >
                          {t.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descripcionProfesional">Descripción profesional</Label>
                  <div className="relative">
                    <FileText
                      size={16}
                      className="absolute left-3 top-3 text-muted-foreground"
                    />
                    <Textarea
                      id="descripcionProfesional"
                      value={descripcionProfesional}
                      onChange={(e) => setDescripcionProfesional(e.target.value)}
                      placeholder="Cuéntales a los clientes sobre tu experiencia, herramientas, garantías y por qué deberían elegirte..."
                      className="pl-9 min-h-[110px]"
                      maxLength={500}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <FieldError msg={errors.descripcionProfesional} />
                    <span className="ml-auto">{descripcionProfesional.length}/500</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Zonas de cobertura en Cartagena</Label>
                  <div className="flex flex-wrap gap-2">
                    {ZONAS_CARTAGENA.map((zona) => {
                      const active = zonasCobertura.includes(zona);
                      return (
                        <button
                          key={zona}
                          type="button"
                          onClick={() =>
                            setZonasCobertura((prev) => toggleArray(prev, zona))
                          }
                          className={cn(
                            "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors flex items-center gap-1",
                            active
                              ? "bg-success text-success-foreground border-success"
                              : "bg-background hover:bg-muted border-border text-muted-foreground",
                          )}
                        >
                          <MapPin size={12} />
                          {zona}
                        </button>
                      );
                    })}
                  </div>
                  {zonasCobertura.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {zonasCobertura.length} zona{zonasCobertura.length > 1 ? "s" : ""} seleccionada
                      {zonasCobertura.length > 1 ? "s" : ""}
                    </p>
                  )}
                  <FieldError msg={errors.zonasCobertura} />
                </div>
              </CardContent>
            </Card>
          )}

          {/* ============= Credenciales ============= */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Lock size={18} className="text-primary" /> Credenciales de acceso
              </CardTitle>
              <CardDescription>Crea tus datos de inicio de sesión.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">Nombre de usuario</Label>
                <div className="relative">
                  <AtSign
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase())}
                    placeholder="usuario_obrared"
                    className="pl-9 h-11"
                    autoComplete="username"
                  />
                </div>
                <FieldError msg={errors.username} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Lock
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    id="password"
                    type={showPwd ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-9 pr-10 h-11"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPwd ? "Ocultar" : "Mostrar"}
                  >
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {password && (
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn("h-full transition-all", strength.color)}
                        style={{ width: `${(strength.score / 5) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">
                      {strength.label}
                    </span>
                  </div>
                )}
                <FieldError msg={errors.password} />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                <div className="relative">
                  <Lock
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    id="confirmPassword"
                    type={showPwd ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-9 h-11"
                    autoComplete="new-password"
                  />
                </div>
                <FieldError msg={errors.confirmPassword} />
              </div>
            </CardContent>
          </Card>

          {/* ============= Términos y CTA ============= */}
          <div className="space-y-4">
            <label className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card hover:bg-muted/30 transition-colors cursor-pointer">
              <Checkbox
                checked={terminos}
                onCheckedChange={(v) => setTerminos(Boolean(v))}
                className="mt-0.5"
              />
              <span className="text-sm text-foreground">
                Acepto los{" "}
                <span className="text-primary font-medium underline">términos y condiciones</span>{" "}
                y la{" "}
                <span className="text-primary font-medium underline">política de privacidad</span>{" "}
                de ObraRed.
              </span>
            </label>
            <FieldError msg={errors.terminos} />

            <Button
              type="submit"
              disabled={loading}
              className={cn(
                "w-full h-12 text-base font-semibold rounded-xl shadow-elevated transition-all active:scale-[0.99]",
                ctaColor,
                ctaText,
              )}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Creando cuenta...
                </>
              ) : (
                <>Crear cuenta de {isTrabajador ? "Trabajador" : "Cliente"}</>
              )}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              ¿Ya tienes cuenta?{" "}
              <Link
                to={`/login?role=${role}&mode=login`}
                className="text-primary font-semibold hover:underline"
              >
                Inicia sesión
              </Link>
            </div>

            <div className="flex justify-center pt-2">
              <Badge variant="outline" className="gap-1.5 text-xs">
                <Lock size={12} />
                Tus datos se almacenan localmente en este dispositivo
              </Badge>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
