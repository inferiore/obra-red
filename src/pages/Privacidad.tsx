import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "@/assets/obrared-logo.png";

const SECCIONES = [
  {
    titulo: "1. Marco legal",
    parrafos: [
      'El tratamiento de los datos personales recolectados a través de la plataforma "ObraRed" se realizará de conformidad con lo dispuesto en la legislación colombiana vigente en materia de protección de datos personales, en especial la Ley 1581 de 2012, el Decreto 1377 de 2013 y las demás normas que las modifiquen, adicionen o sustituyan.',
    ],
  },
  {
    titulo: "2. Responsable del tratamiento",
    parrafos: [
      '"ObraRed" actuará como responsable del tratamiento de los datos personales suministrados por los Usuarios.',
    ],
  },
  {
    titulo: "3. Finalidades del tratamiento",
    parrafos: [
      "Los datos serán recolectados, almacenados, utilizados, transmitidos y/o transferidos con la finalidad de:",
      "(i) Permitir el acceso y uso de la plataforma.",
      "(ii) Facilitar la conexión entre Clientes y Usuarios Prestadores de Servicios.",
      "(iii) Gestionar pagos y transacciones.",
      "(iv) Brindar soporte y atención al Usuario.",
      "(v) Cumplir con obligaciones legales y contractuales.",
    ],
  },
  {
    titulo: "4. Autorización del titular",
    parrafos: [
      'El Usuario, al registrarse y utilizar "ObraRed", autoriza de manera previa, expresa e informada el tratamiento de sus datos personales conforme a las finalidades aquí descritas.',
      "Asimismo, declara que la información suministrada es veraz, completa y actualizada. Cualquier inexactitud o falsedad podrá dar lugar a la suspensión o cancelación de la cuenta y, en su caso, a las acciones legales correspondientes.",
    ],
  },
  {
    titulo: "5. Derechos del titular",
    parrafos: [
      'Los Usuarios podrán ejercer en cualquier momento sus derechos a conocer, actualizar, rectificar y suprimir sus datos personales, así como revocar la autorización otorgada, mediante los canales de contacto dispuestos por "ObraRed", de conformidad con la ley aplicable.',
      "Para ejercer estos derechos, el Usuario podrá comunicarse al correo electrónico oficial de soporte de ObraRed o a través de los canales habilitados dentro de la aplicación.",
    ],
  },
  {
    titulo: "6. Medidas de seguridad",
    parrafos: [
      '"ObraRed" adoptará las medidas técnicas, humanas y administrativas necesarias para garantizar la seguridad de la información y evitar su adulteración, pérdida, consulta, uso o acceso no autorizado o fraudulento.',
      "Estas medidas incluyen cifrado de datos sensibles, controles de acceso, auditorías periódicas y políticas internas de manejo responsable de la información.",
    ],
  },
  {
    titulo: "7. Transferencia y transmisión de datos",
    parrafos: [
      'Los datos personales podrán ser transmitidos a terceros encargados del tratamiento (proveedores de pago, servicios de mensajería, alojamiento en la nube, entre otros) únicamente para cumplir con las finalidades descritas, garantizando que dichos terceros adopten estándares equivalentes de protección de datos.',
    ],
  },
  {
    titulo: "8. Conservación de los datos",
    parrafos: [
      'Los datos personales se conservarán durante el tiempo necesario para cumplir con las finalidades del tratamiento y atender las obligaciones legales aplicables. Una vez cesen estas finalidades, los datos serán eliminados o anonimizados de forma segura.',
    ],
  },
  {
    titulo: "9. Cambios a la política",
    parrafos: [
      'Para mayor detalle sobre el tratamiento de datos personales, los Usuarios podrán consultar esta Política de Privacidad disponible dentro de la plataforma.',
      '"ObraRed" podrá actualizar esta política en cualquier momento. Los cambios serán informados a los Usuarios a través de la plataforma o por los medios de contacto registrados.',
    ],
  },
];

const Privacidad = () => {
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
            <ShieldCheck size={14} />
            Documento legal
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Política de Privacidad
          </h1>
          <p className="text-muted-foreground text-sm mt-2 max-w-xl">
            Tratamiento y protección de datos personales en ObraRed (Ley 1581 de 2012)
          </p>
        </header>

        <article className="bg-card rounded-2xl shadow-card border border-border p-6 md:p-10 space-y-8">
          {SECCIONES.map((s) => (
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

export default Privacidad;
