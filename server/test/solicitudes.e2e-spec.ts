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

describe('PATCH /solicitudes/:id/resolver-disputa (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects a non-admin caller with 403', async () => {
    const suffix = Date.now();

    const cliente = await request(app.getHttpServer()).post('/auth/register').send({
      username: `e2e_cliente_rd_${suffix}`,
      password: 'password123',
      name: 'E2E Cliente Resolver Disputa',
      role: 'cliente',
    });
    const clienteToken = cliente.body.token;

    const solicitud = await request(app.getHttpServer())
      .post('/solicitudes')
      .set('Authorization', `Bearer ${clienteToken}`)
      .send({
        tipo: 'plomeria',
        descripcion: 'Solicitud para probar el guard de resolver-disputa.',
        presupuesto: 250000,
        ubicacion: 'Manga, Cartagena',
        estado: 'publicado',
      });
    const solicitudId = solicitud.body.id;

    const res = await request(app.getHttpServer())
      .patch(`/solicitudes/${solicitudId}/resolver-disputa`)
      .set('Authorization', `Bearer ${clienteToken}`)
      .send({ estado: 'ejecucion' });

    expect(res.status).toBe(403);
  });

  it('allows an admin to resolve a solicitud that is en disputa', async () => {
    const suffix = Date.now();

    const cliente = await request(app.getHttpServer()).post('/auth/register').send({
      username: `e2e_cliente_rd2_${suffix}`,
      password: 'password123',
      name: 'E2E Cliente Resolver Disputa 2',
      role: 'cliente',
    });
    const clienteToken = cliente.body.token;

    const trabajador = await request(app.getHttpServer()).post('/auth/register').send({
      username: `e2e_trabajador_rd_${suffix}`,
      password: 'password123',
      name: 'E2E Trabajador Resolver Disputa',
      role: 'trabajador',
    });
    const trabajadorToken = trabajador.body.token;

    const admin = await request(app.getHttpServer()).post('/auth/register').send({
      username: `e2e_admin_rd_${suffix}`,
      password: 'password123',
      name: 'E2E Admin Resolver Disputa',
      role: 'admin',
    });
    const adminToken = admin.body.token;

    const solicitud = await request(app.getHttpServer())
      .post('/solicitudes')
      .set('Authorization', `Bearer ${clienteToken}`)
      .send({
        tipo: 'plomeria',
        descripcion: 'Solicitud que terminará en disputa para la prueba e2e.',
        presupuesto: 250000,
        ubicacion: 'Manga, Cartagena',
        estado: 'publicado',
      });
    const solicitudId = solicitud.body.id;

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

    const disputa = await request(app.getHttpServer())
      .patch(`/solicitudes/${solicitudId}/abrir-disputa`)
      .set('Authorization', `Bearer ${trabajadorToken}`)
      .send({ comentario: 'El cliente no responde ni permite el acceso.' });
    expect(disputa.body.estado).toBe('disputa');

    const res = await request(app.getHttpServer())
      .patch(`/solicitudes/${solicitudId}/resolver-disputa`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ estado: 'ejecucion' });

    expect(res.status).toBe(200);
    expect(res.body.estado).toBe('ejecucion');
  });
});
