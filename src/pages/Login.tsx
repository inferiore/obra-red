import { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Lock, User, ArrowLeft, Hammer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth, HARDCODED_USERS } from "@/context/AuthContext";
import type { UserRole } from "@/types/solicitud";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuth();
  const [params] = useSearchParams();
  const roleParam = params.get("role") as UserRole | null;
  const mode = params.get("mode") === "register" ? "register" : "login";
  const selectedRole: UserRole | null =
    roleParam === "cliente" || roleParam === "trabajador" || roleParam === "admin"
      ? roleParam
      : null;

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const visibleUsers = useMemo(
    () => (selectedRole ? HARDCODED_USERS.filter((u) => u.role === selectedRole) : HARDCODED_USERS),
    [selectedRole],
  );

  const roleLabel = selectedRole === "cliente" ? "Cliente" : selectedRole === "trabajador" ? "Trabajador" : null;
  const RoleIcon = selectedRole === "trabajador" ? Hammer : User;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      const result = login(username, password);
      if (result.ok) {
        toast({
          title: "¡Bienvenido!",
          description: `Sesión iniciada como ${result.role}.`,
        });
        navigate("/dashboard");
      } else {
        toast({
          title: "Credenciales incorrectas",
          description: result.error ?? "Verifica tu usuario y contraseña.",
          variant: "destructive",
        });
      }
      setLoading(false);
    }, 300);
  };

  const quickLogin = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-hero">
      <div className="w-full max-w-md">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6 text-sm"
        >
          <ArrowLeft size={16} />
          Volver al inicio
        </button>

        <Card className="border-border shadow-elevated">
          <CardHeader className="space-y-3 text-center">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">OR</span>
            </div>
            <CardTitle className="text-2xl">Iniciar sesión</CardTitle>
            <CardDescription>
              Accede a tu cuenta de Obra<span className="text-primary font-semibold">Red</span>
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="username">Usuario</Label>
                <div className="relative">
                  <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="cliente"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10 h-11"
                    required
                    autoComplete="username"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-11"
                    required
                    autoComplete="current-password"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full h-11" disabled={loading}>
                {loading ? "Ingresando..." : "Iniciar sesión"}
              </Button>

              <div className="rounded-lg bg-muted/50 border border-border p-3 space-y-2">
                <p className="text-xs font-medium text-foreground">Usuarios de prueba (clic para usar):</p>
                <div className="grid gap-1.5">
                  {HARDCODED_USERS.map((u) => (
                    <button
                      key={u.username}
                      type="button"
                      onClick={() => quickLogin(u.username, u.password)}
                      className="flex items-center justify-between text-xs px-2 py-1.5 rounded-md hover:bg-card border border-transparent hover:border-border transition-colors"
                    >
                      <span className="capitalize font-medium text-foreground">{u.role}</span>
                      <span className="font-mono text-muted-foreground">
                        {u.username} / {u.password}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;

