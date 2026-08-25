import { ArrowLeft, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "@/assets/obrared-logo.png";
import { TERMINOS_SECCIONES } from "@/lib/legal";

const Terminos = () => {
  return (
    <div className="min-h-screen bg-gradient-hero py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6 text-sm"
        >
          <ArrowLeft size={16} />
          Volver al inicio
        </Link>

        <header className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-elevated mb-4">
            <img src={logo} alt="ObraRed" className="w-full h-full object-cover" />
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-3">
            <FileText size={14} />
            Documento legal
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Términos y Condiciones de Uso
          </h1>
          <p className="text-muted-foreground text-sm mt-2 max-w-xl">
            Aplicación "App ObraRed" — DIGITAL OBRARED S.A.S. (Colombia)
          </p>
        </header>

        <article className="bg-card rounded-2xl shadow-card border border-border p-6 md:p-10 space-y-8">
          {TERMINOS_SECCIONES.map((s) => (
            <section key={s.titulo}>
              <h2 className="text-lg md:text-xl font-bold text-foreground mb-3">
                {s.titulo}
              </h2>
              <div className="space-y-3">
                {s.parrafos.map((p, i) => (
                  <p
                    key={i}
                    className="text-sm md:text-base text-muted-foreground leading-relaxed"
                  >
                    {p}
                  </p>
                ))}
              </div>
            </section>
          ))}

          <footer className="pt-6 border-t border-border text-xs text-muted-foreground text-center">
            Última actualización: 2026 · DIGITAL OBRARED S.A.S.
          </footer>
        </article>
      </div>
    </div>
  );
};

export default Terminos;
