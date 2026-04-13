const Footer = () => {
  return (
    <footer className="bg-foreground text-primary-foreground/70 py-12 px-4">
      <div className="container mx-auto">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          <div>
            <span className="text-xl font-bold text-primary-foreground">
              Obra<span className="text-primary">Red</span>
            </span>
            <p className="mt-3 text-sm leading-relaxed">
              El marketplace de servicios que conecta clientes con profesionales confiables.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-primary-foreground mb-3 text-sm">Plataforma</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-primary-foreground transition-colors">Cómo funciona</a></li>
              <li><a href="#" className="hover:text-primary-foreground transition-colors">Para clientes</a></li>
              <li><a href="#" className="hover:text-primary-foreground transition-colors">Para trabajadores</a></li>
              <li><a href="#" className="hover:text-primary-foreground transition-colors">Precios</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-primary-foreground mb-3 text-sm">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-primary-foreground transition-colors">Términos de servicio</a></li>
              <li><a href="#" className="hover:text-primary-foreground transition-colors">Política de privacidad</a></li>
              <li><a href="#" className="hover:text-primary-foreground transition-colors">Política de cookies</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-primary-foreground mb-3 text-sm">Contacto</h4>
            <ul className="space-y-2 text-sm">
              <li>hola@obrared.com</li>
              <li>
                <div className="flex gap-4 mt-2">
                  {["Twitter", "Instagram", "LinkedIn"].map((s) => (
                    <a key={s} href="#" className="hover:text-primary-foreground transition-colors text-xs">
                      {s}
                    </a>
                  ))}
                </div>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-primary-foreground/10 pt-6 text-center text-xs">
          © {new Date().getFullYear()} ObraRed. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
