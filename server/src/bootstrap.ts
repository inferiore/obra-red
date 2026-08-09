import { INestApplication, ValidationPipe } from '@nestjs/common';
import { json, urlencoded } from 'express';

// Las evidencias de trabajo admiten hasta 15 fotos (5 por etapa: antes/durante/después)
// además de las hasta 5 fotos de la solicitud, todas como base64 en el body — de ahí el margen.
export const BODY_SIZE_LIMIT = '50mb';

export function configureApp(app: INestApplication): void {
  app.use(json({ limit: BODY_SIZE_LIMIT }));
  app.use(urlencoded({ extended: true, limit: BODY_SIZE_LIMIT }));
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
}
