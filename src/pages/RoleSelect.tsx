import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Hammer, User } from "lucide-react";
import logo from "@/assets/obrared-logo.png";

const RoleSelect = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const mode = params.get("mode") === "register" ? "register" : "login";

  const title = mode === "register" ? "Crear cuenta" : "Iniciar sesión";
  const subtitle =
    mode === "register"
      ? "Elige cómo quieres registrarte"
      : "Elige cómo quieres acceder";

  const goTo = (role: "cliente" | "trabajador") => {
    if (mode === "register") {
      navigate(`/registro?role=${role}`);
    } else {
      navigate(`/login?role=${role}&mode=login`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-hero">
      <div className="w-full max-w-md">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 text-sm"
        >
          <ArrowLeft size={16} />
          Volver al inicio
        </button>

        {/* Brand */}
        <div className="flex flex-col items-center text-center mb-12">
          <div className="w-24 h-24 rounded-3xl overflow-hidden shadow-elevated mb-6">
            <img src={logo} alt="ObraRed" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-5xl font-bold text-primary tracking-tight">
            ObraRed
          </h1>
          <p className="text-muted-foreground mt-2 text-base">
            Conectando Cartagena
          </p>
        </div>

        {/* Mode label */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold text-foreground">{title}</h2>
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        </div>

        {/* Role buttons */}
        <div className="space-y-4">
          <button
            onClick={() => goTo("cliente")}
            className="w-full h-16 rounded-2xl bg-info hover:bg-info/90 text-info-foreground font-semibold text-lg flex items-center justify-center gap-3 shadow-card hover:shadow-elevated transition-all active:scale-[0.98]"
          >
            <User size={22} strokeWidth={2.5} />
            Soy Cliente
          </button>

          <button
            onClick={() => goTo("trabajador")}
            className="w-full h-16 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-lg flex items-center justify-center gap-3 shadow-card hover:shadow-elevated transition-all active:scale-[0.98]"
          >
            <Hammer size={22} strokeWidth={2.5} />
            Soy Trabajador
          </button>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-10">
          Servicios de construcción y hogar en Cartagena
        </p>
      </div>
    </div>
  );
};

export default RoleSelect;
