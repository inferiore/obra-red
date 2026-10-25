import { randomInt } from 'crypto';

/**
 * Código numérico de 4 dígitos, estático por solicitud — se genera una sola
 * vez cuando la solicitud pasa a `ejecucion` y no rota mientras dure el
 * servicio (ver specs/2026-10-24-codigo-verificacion-servicio.md).
 */
export const generarCodigoVerificacion = (): string =>
  String(randomInt(1000, 10000));
