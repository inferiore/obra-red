import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, User, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

// Hardcoded credentials (no backend)
const DEFAULT_USER = "admin";
const DEFAULT_PASS = "admin123";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      if (username === DEFAULT_USER && password === DEFAULT_PASS) {
        toast({
          title: "¡Bienvenido!",
          description: "Inicio de sesión exitoso.",
        });
        sessionStorage.setItem("obrared_auth", "true");
        navigate("/");
      } else {
        toast({
          title: "Credenciales incorrectas",
          description: "Verifica tu usuario y contraseña.",
          variant: "destructive",
        });
      }
      setLoading(false);
    }, 400);
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
                    placeholder="admin"
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

              <div className="rounded-lg bg-muted/50 border border-border px-4 py-3 text-xs text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Credenciales de prueba:</p>
                <p>Usuario: <span className="font-mono text-primary">admin</span></p>
                <p>Contraseña: <span className="font-mono text-primary">admin123</span></p>
              </div>

              <p className="text-center text-sm text-muted-foreground">
                ¿No tienes cuenta?{" "}
                <a href="#" className="text-primary font-medium hover:underline">
                  Regístrate
                </a>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
