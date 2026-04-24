import { ArrowLeft, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "@/assets/obrared-logo.png";

const SECCIONES = [
  {
    titulo: "1. Consideraciones generales",
    parrafos: [
      'DIGITAL OBRARED S.A.S. (en adelante, "OBRARED") es una sociedad constituida conforme a las leyes colombianas, identificada con NIT. XXXXX, con domicilio en la ciudad de Cartagena. ObraRed es la operadora y administradora de la Aplicación "App ObraRed" y la Plataforma ObraRed en la República de Colombia.',
      'El presente documento contiene los Términos y Condiciones de Uso de la Aplicación "App ObraRed" (en adelante, "Términos y Condiciones").',
    ],
  },
  {
    titulo: "Naturaleza",
    parrafos: [
      'Los presentes Términos y Condiciones regulan la autorización de uso de la Aplicación "App ObraRed" que otorga ObraRed a los trabajadores independientes.',
    ],
  },
  {
    titulo: "2. Definiciones",
    parrafos: [
      "Para los efectos de los presentes Términos y Condiciones se entiende por:",
      "Identificación de la plataforma. Los presentes Términos y Condiciones regulan el acceso y uso de la plataforma digital ObraRed en Colombia. El uso implica aceptación total del presente acuerdo legal.",
      "Usuario/Cliente. Toda persona natural que usa la Plataforma ObraRed para adquirir y/o solicitar un servicio prestado por un trabajador independiente.",
      'Trabajador independiente. Personas naturales que, en virtud de la autorización otorgada por ObraRed para el uso de la Aplicación "App ObraRed", se conectan a la misma para, de manera libre, autónoma y voluntaria, aceptan la solicitud de servicio de los clientes.',
      'Aplicación "App ObraRed". Aplicación por medio de la cual los trabajadores independientes, de manera libre, voluntaria y autónoma, pueden visualizar y aceptar las solicitudes u órdenes por parte de los clientes.',
    ],
  },
  {
    titulo: "3. Descripción del servicio",
    parrafos: [
      "Naturaleza del servicio. ObraRed es una plataforma tecnológica de intermediación que conecta clientes con trabajadores independientes. No ejecuta servicios ni actúa como empleador.",
      "Ausencia de relación laboral. Los trabajadores actúan de forma independiente, sin subordinación ni vínculo laboral con ObraRed.",
      "Relación entre las partes. El cliente contrata directamente al trabajador. ObraRed no forma parte de la relación contractual.",
      "Sistema de ofertas. El cliente publica una oferta y los trabajadores presentan propuestas. El cliente selecciona la mejor opción.",
      "Sistema de pagos. El pago puede ser retenido y liberado tras aprobación del cliente. ObraRed facilita el proceso sin asumir responsabilidad.",
      "Evidencia del servicio. El trabajador deberá subir evidencia del trabajo realizado. El cliente aprobará o rechazará el servicio.",
      "Calificaciones. Los usuarios podrán calificarse. ObraRed podrá suspender cuentas por mal comportamiento.",
      "Fraude. Se prohíbe el uso indebido de la plataforma. ObraRed podrá cancelar cuentas sin previo aviso.",
      'El trabajador independiente reconoce y acepta que: (i) no se encuentra obligado a aceptar o ejecutar un número mínimo de solicitudes; (ii) no se garantiza la asignación de un volumen determinado de trabajos; y (iii) no existe ningún tipo de exclusividad en el uso de la aplicación.',
      "Una vez asignado un servicio, el trabajador se compromete a cumplir con la gestión solicitada de manera íntegra, oportuna y conforme a las condiciones, especificaciones técnicas y requerimientos definidos por el Cliente.",
    ],
  },
  {
    titulo: "4. Objeto",
    parrafos: [
      "Los presentes Términos y Condiciones regulan la autorización de uso que otorga ObraRed a los Usuarios (Clientes y trabajadores independientes) para que estos accedan a la plataforma, se informen sobre los servicios publicados, ofrecidos y gestionados por los Usuarios Prestadores de Servicios, y puedan solicitar, contratar y ejecutar dichos servicios a través de ObraRed.",
    ],
  },
  {
    titulo: "5. Aceptación de los Términos y Condiciones",
    parrafos: [
      "Mediante la aceptación de los presentes Términos y Condiciones, ObraRed otorga al Usuario y trabajador independiente una autorización de uso de la aplicación, con el propósito de permitirle gestionar de manera libre, autónoma y voluntaria los servicios, solicitudes o proyectos publicados dentro de la plataforma.",
      "Al registrarse en ObraRed, la persona natural o jurídica acepta de manera previa, expresa e informada la totalidad de los presentes Términos y Condiciones.",
      "El Usuario se compromete a hacer uso personal, responsable e intransferible de su cuenta, credenciales de acceso y número de identificación dentro de la aplicación.",
      "Los menores de edad (personas menores de 18 años) no podrán registrarse ni hacer uso de la aplicación ObraRed bajo ninguna circunstancia.",
    ],
  },
  {
    titulo: "6. Autonomía",
    parrafos: [
      "A través de ObraRed, los Prestadores pueden publicar, ofertar y gestionar sus servicios. Las condiciones como precios, alcance del servicio, tiempos de ejecución, disponibilidad y demás características son definidas directamente por los Usuarios Prestadores de Servicios o acordadas entre estos y los Clientes, sin intervención directa de ObraRed.",
      "ObraRed actúa como una plataforma digital de intermediación o portal de contacto, cuya finalidad es facilitar la conexión entre Clientes y Prestadores de Servicios.",
    ],
  },
  {
    titulo: "7. Relación jurídica entre las partes",
    parrafos: [
      "El Usuario Prestador de Servicios y el Cliente aceptan que ObraRed actúa única y exclusivamente como una plataforma tecnológica de intermediación, encargada de facilitar el contacto entre las partes. La relación jurídica de mandato se configura únicamente entre el Cliente (Mandante) y el Usuario Prestador de Servicios (Mandatario).",
    ],
  },
  {
    titulo: "8. Seguridad y salud en el trabajo",
    parrafos: [
      "El Usuario Prestador se obliga a cumplir con las normas de seguridad y salud en el trabajo aplicables en Colombia, a contar con los elementos de protección personal necesarios y a adoptar todas las medidas preventivas que resulten pertinentes para mitigar riesgos durante la ejecución de sus labores.",
      "El Usuario Prestador será responsable de su afiliación, pago de aportes y cobertura al Sistema de Seguridad Social Integral, incluyendo salud, pensión y riesgos laborales.",
      "ObraRed no será responsable, bajo ninguna circunstancia, por accidentes, incidentes, lesiones, daños materiales o perjuicios de cualquier naturaleza que se generen con ocasión o como consecuencia de los servicios ejecutados por el Usuario Prestador.",
    ],
  },
  {
    titulo: "9. Pagos y comisiones",
    parrafos: [
      "El Cliente reconoce que los pagos realizados a través de ObraRed pueden estar sujetos a la intervención de terceros proveedores de servicios de pago.",
      "El Usuario Prestador de Servicios acepta que los valores correspondientes a los servicios ejecutados podrán estar sujetos a comisiones, tarifas por uso de la plataforma u otros cargos previamente informados por ObraRed.",
      "En caso de cancelaciones, controversias o incumplimientos, ObraRed podrá retener, reversar o gestionar los pagos conforme a las políticas internas y a la normativa aplicable.",
    ],
  },
  {
    titulo: "10. Disputas y resolución de conflictos",
    parrafos: [
      "Cualquier controversia derivada del uso de la plataforma será gestionada por ObraRed buscando un equilibrio entre las partes, conforme a sus políticas internas y la normativa colombiana aplicable.",
    ],
  },
  {
    titulo: "11. Cancelación de servicios aceptados",
    parrafos: [
      "Una vez un servicio ha sido aceptado a través de la plataforma ObraRed, tanto el Cliente como el Usuario Prestador de Servicios asumen el compromiso de cumplir con las condiciones acordadas.",
      "Cuando la cancelación se origine por causas de fuerza mayor o caso fortuito debidamente comprobado, ObraRed evaluará cada caso en particular para determinar las medidas aplicables.",
      "ObraRed se reserva el derecho de cancelar o suspender servicios cuando identifique posibles riesgos, incumplimientos o situaciones que puedan afectar la seguridad o confianza dentro de la plataforma.",
    ],
  },
  {
    titulo: "12. Precios y disponibilidad",
    parrafos: [
      "Los precios de los servicios publicados son definidos directamente por los Usuarios Prestadores de Servicios. Estos valores pueden variar según la naturaleza del trabajo, su complejidad, ubicación, tiempos de ejecución y demás condiciones específicas.",
      "La disponibilidad de los servicios publicados, así como la posibilidad de aceptar o ejecutar trabajos, depende directamente de la disponibilidad, horarios y condiciones definidas por los Usuarios Prestadores de Servicios.",
    ],
  },
  {
    titulo: "13. Prohibición del trabajo infantil",
    parrafos: [
      "El uso de la plataforma ObraRed está estrictamente limitado a personas que cuenten con plena capacidad legal para contratar. Se prohíbe de manera expresa el registro, uso de la plataforma o prestación de servicios por parte de menores de edad.",
    ],
  },
  {
    titulo: "14. Propiedad intelectual",
    parrafos: [
      "Todos los contenidos de la plataforma ObraRed están protegidos por las normas vigentes en materia de propiedad intelectual. Cualquier uso indebido podrá dar lugar a las acciones legales correspondientes.",
    ],
  },
  {
    titulo: "15. Modificaciones",
    parrafos: [
      "ObraRed se reserva el derecho de modificar, actualizar o ajustar en cualquier momento los presentes Términos y Condiciones, conforme a necesidades operativas, legales o de mejora del servicio.",
      "Cualquier modificación será informada a los Usuarios a través de la plataforma o por los medios de contacto registrados. El uso continuo de ObraRed después de la publicación de los cambios implica la aceptación expresa de los mismos.",
      "En caso de que el Usuario no esté de acuerdo con las modificaciones, deberá abstenerse de continuar utilizando la plataforma y podrá solicitar la cancelación de su cuenta.",
    ],
  },
  {
    titulo: "16. Cláusula final",
    parrafos: [
      "Los presentes Términos y Condiciones constituyen el acuerdo íntegro entre las partes respecto al uso de la plataforma ObraRed y prevalecen sobre cualquier comunicación o acuerdo previo.",
    ],
  },
];

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

export default Terminos;
