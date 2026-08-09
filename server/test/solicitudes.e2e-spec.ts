import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap';

const makeBase64Photo = (sizeBytes: number) => `data:image/png;base64,${'A'.repeat(sizeBytes)}`;

describe('Solicitudes body size limit (e2e)', () => {
  let app: INestApplication;
  let token: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();

    const register = await request(app.getHttpServer()).post('/auth/register').send({
      username: `e2e_cliente_${Date.now()}`,
      password: 'password123',
      name: 'E2E Cliente',
      role: 'cliente',
    });
    token = register.body.token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('accepts a solicitud with photos that exceed the old 100kb default body limit', async () => {
    const fotos = [makeBase64Photo(100_000), makeBase64Photo(100_000), makeBase64Photo(100_000)];

    const res = await request(app.getHttpServer())
      .post('/solicitudes')
      .set('Authorization', `Bearer ${token}`)
      .send({
        tipo: 'plomeria',
        descripcion: 'Fuga de agua en la cocina, revisar tuberia principal.',
        presupuesto: 250000,
        ubicacion: 'Manga, Cartagena',
        fotos,
      });

    expect(res.status).toBe(201);
    expect(res.body.fotos).toHaveLength(3);
  });

  it('still rejects a payload larger than the configured body size limit', async () => {
    const fotos = [makeBase64Photo(60 * 1024 * 1024)];

    const res = await request(app.getHttpServer())
      .post('/solicitudes')
      .set('Authorization', `Bearer ${token}`)
      .send({
        tipo: 'plomeria',
        descripcion: 'Solicitud con fotos demasiado pesadas.',
        presupuesto: 250000,
        ubicacion: 'Manga, Cartagena',
        fotos,
      });

    expect(res.status).toBe(413);
  });
});
