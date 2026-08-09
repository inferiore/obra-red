import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap';

const makeBase64Photo = (sizeBytes: number) => `data:image/png;base64,${'A'.repeat(sizeBytes)}`;

describe('Evidencias body size limit (e2e)', () => {
  let app: INestApplication;
  let clienteToken: string;
  let trabajadorToken: string;
  let solicitudId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();

    const suffix = Date.now();

    const cliente = await request(app.getHttpServer()).post('/auth/register').send({
      username: `e2e_cliente_ev_${suffix}`,
      password: 'password123',
      name: 'E2E Cliente Evidencias',
      role: 'cliente',
    });
    clienteToken = cliente.body.token;

    const trabajador = await request(app.getHttpServer()).post('/auth/register').send({
      username: `e2e_trabajador_ev_${suffix}`,
      password: 'password123',
      name: 'E2E Trabajador Evidencias',
      role: 'trabajador',
    });
    trabajadorToken = trabajador.body.token;

    const solicitud = await request(app.getHttpServer())
      .post('/solicitudes')
      .set('Authorization', `Bearer ${clienteToken}`)
      .send({
        tipo: 'plomeria',
        descripcion: 'Solicitud para probar subida de evidencias grandes.',
        presupuesto: 250000,
        ubicacion: 'Manga, Cartagena',
        estado: 'publicado',
      });
    solicitudId = solicitud.body.id;

    const oferta = await request(app.getHttpServer())
      .post('/ofertas')
      .set('Authorization', `Bearer ${trabajadorToken}`)
      .send({
        solicitudId,
        precio: 230000,
        mensaje: 'Puedo hacer el trabajo con garantía incluida.',
        fechaInicio: new Date().toISOString().slice(0, 10),
      });

    await request(app.getHttpServer())
      .patch(`/ofertas/${oferta.body.id}/aceptar`)
      .set('Authorization', `Bearer ${clienteToken}`);
  });

  afterAll(async () => {
    await app.close();
  });

  it('accepts a realistic multi-photo evidence payload (~30MB) that previously triggered 413', async () => {
    const antes = [makeBase64Photo(2_000_000), makeBase64Photo(2_000_000)];
    const durante = [makeBase64Photo(2_000_000), makeBase64Photo(2_000_000), makeBase64Photo(2_000_000)];
    const despues = [
      makeBase64Photo(2_000_000),
      makeBase64Photo(2_000_000),
      makeBase64Photo(2_000_000),
      makeBase64Photo(2_000_000),
      makeBase64Photo(2_000_000),
    ];

    const res = await request(app.getHttpServer())
      .patch(`/solicitudes/${solicitudId}/evidencias`)
      .set('Authorization', `Bearer ${trabajadorToken}`)
      .send({ antes, durante, despues, nota: 'Trabajo terminado según lo acordado.' });

    expect(res.status).toBe(200);
    expect(res.body.estado).toBe('revision');
    expect(res.body.evidenciaDespues).toHaveLength(5);
  });
});
