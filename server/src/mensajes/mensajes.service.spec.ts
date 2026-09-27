import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MensajesService } from './mensajes.service';
import { Mensaje } from './mensaje.entity';
import { Solicitud } from '../solicitudes/solicitud.entity';
import { UsersService } from '../users/users.service';
import { NotificacionesService } from '../notificaciones/notificaciones.service';

describe('MensajesService', () => {
  let service: MensajesService;
  let mensajesRepo: {
    find: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    update: jest.Mock;
  };
  let solicitudesRepo: { findOne: jest.Mock; find: jest.Mock };
  let usersService: { findByUsernames: jest.Mock };
  let notificacionesService: { crear: jest.Mock };

  const solicitudBase: Solicitud = {
    id: 'solicitud-1',
    clienteUsername: 'cliente1',
    trabajadorAsignado: 'trabajador1',
    estado: 'ejecucion',
  } as Solicitud;

  beforeEach(async () => {
    mensajesRepo = {
      find: jest.fn(),
      create: jest.fn((data) => data),
      save: jest.fn((data) => Promise.resolve({ id: 'mensaje-1', createdAt: new Date(), ...data })),
      update: jest.fn().mockResolvedValue(undefined),
    };
    solicitudesRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
    };
    usersService = { findByUsernames: jest.fn().mockResolvedValue(new Map()) };
    notificacionesService = { crear: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MensajesService,
        { provide: getRepositoryToken(Mensaje), useValue: mensajesRepo },
        { provide: getRepositoryToken(Solicitud), useValue: solicitudesRepo },
        { provide: UsersService, useValue: usersService },
        { provide: NotificacionesService, useValue: notificacionesService },
      ],
    }).compile();

    service = module.get<MensajesService>(MensajesService);
  });

  describe('guard de acceso', () => {
    it('findBySolicitud lanza ForbiddenException si el usuario no es cliente ni trabajador asignado', async () => {
      solicitudesRepo.findOne.mockResolvedValue(solicitudBase);

      await expect(
        service.findBySolicitud('solicitud-1', 'intruso', 'cliente'),
      ).rejects.toThrow(ForbiddenException);
      expect(mensajesRepo.find).not.toHaveBeenCalled();
    });

    it('crear lanza ForbiddenException si el usuario no es cliente ni trabajador asignado', async () => {
      solicitudesRepo.findOne.mockResolvedValue(solicitudBase);

      await expect(
        service.crear('solicitud-1', 'hola', 'intruso', 'cliente'),
      ).rejects.toThrow(ForbiddenException);
      expect(mensajesRepo.save).not.toHaveBeenCalled();
    });

    it('findBySolicitud lanza NotFoundException si la solicitud no existe', async () => {
      solicitudesRepo.findOne.mockResolvedValue(null);

      await expect(
        service.findBySolicitud('solicitud-1', 'cliente1', 'cliente'),
      ).rejects.toThrow(NotFoundException);
    });

    it('findBySolicitud permite el acceso a un admin que no es cliente ni trabajador', async () => {
      solicitudesRepo.findOne.mockResolvedValue(solicitudBase);
      mensajesRepo.find.mockResolvedValue([]);

      await expect(
        service.findBySolicitud('solicitud-1', 'admin1', 'admin'),
      ).resolves.toEqual([]);
    });

    it('findBySolicitud no marca mensajes como leídos cuando el llamante es admin', async () => {
      solicitudesRepo.findOne.mockResolvedValue(solicitudBase);
      const mensajes = [
        {
          id: 'm1',
          solicitudId: 'solicitud-1',
          autorUsername: 'trabajador1',
          contenido: 'hola cliente',
          leidoPorDestinatario: false,
          createdAt: new Date('2026-01-01'),
        },
      ];
      mensajesRepo.find.mockResolvedValue(mensajes);

      await service.findBySolicitud('solicitud-1', 'admin1', 'admin');

      expect(mensajesRepo.update).not.toHaveBeenCalled();
    });

    it('crear permite el acceso a un admin y notifica a ambas partes', async () => {
      solicitudesRepo.findOne.mockResolvedValue(solicitudBase);

      await service.crear('solicitud-1', 'hola desde admin', 'admin1', 'admin');

      expect(notificacionesService.crear).toHaveBeenCalledWith(
        'cliente1',
        'nuevo_mensaje',
        expect.any(String),
        'solicitud-1',
        'mensaje',
        'mensaje-1',
      );
      expect(notificacionesService.crear).toHaveBeenCalledWith(
        'trabajador1',
        'nuevo_mensaje',
        expect.any(String),
        'solicitud-1',
        'mensaje',
        'mensaje-1',
      );
      expect(notificacionesService.crear).toHaveBeenCalledTimes(2);
    });
  });

  describe('crear', () => {
    it('lanza ConflictException si la solicitud ya está finalizada', async () => {
      solicitudesRepo.findOne.mockResolvedValue({ ...solicitudBase, estado: 'finalizado' });

      await expect(
        service.crear('solicitud-1', 'hola', 'cliente1', 'cliente'),
      ).rejects.toThrow(ConflictException);
      expect(mensajesRepo.save).not.toHaveBeenCalled();
    });

    it('notifica al trabajador cuando el autor es el cliente', async () => {
      solicitudesRepo.findOne.mockResolvedValue(solicitudBase);

      await service.crear('solicitud-1', 'hola', 'cliente1', 'cliente');

      expect(notificacionesService.crear).toHaveBeenCalledWith(
        'trabajador1',
        'nuevo_mensaje',
        expect.any(String),
        'solicitud-1',
        'mensaje',
        'mensaje-1',
      );
    });

    it('notifica al cliente cuando el autor es el trabajador', async () => {
      solicitudesRepo.findOne.mockResolvedValue(solicitudBase);

      await service.crear('solicitud-1', 'hola', 'trabajador1', 'trabajador');

      expect(notificacionesService.crear).toHaveBeenCalledWith(
        'cliente1',
        'nuevo_mensaje',
        expect.any(String),
        'solicitud-1',
        'mensaje',
        'mensaje-1',
      );
    });

    it('guarda el mensaje con el autor y contenido correctos', async () => {
      solicitudesRepo.findOne.mockResolvedValue(solicitudBase);

      const resultado = await service.crear('solicitud-1', 'hola', 'cliente1', 'cliente');

      expect(mensajesRepo.create).toHaveBeenCalledWith({
        solicitudId: 'solicitud-1',
        autorUsername: 'cliente1',
        contenido: 'hola',
      });
      expect(resultado).toMatchObject({ solicitudId: 'solicitud-1', autorUsername: 'cliente1' });
    });
  });

  describe('findBySolicitud', () => {
    it('marca como leídos los mensajes de la otra parte y no toca los propios', async () => {
      solicitudesRepo.findOne.mockResolvedValue(solicitudBase);
      const mensajes = [
        {
          id: 'm1',
          solicitudId: 'solicitud-1',
          autorUsername: 'trabajador1',
          contenido: 'hola cliente',
          leidoPorDestinatario: false,
          createdAt: new Date('2026-01-01'),
        },
        {
          id: 'm2',
          solicitudId: 'solicitud-1',
          autorUsername: 'cliente1',
          contenido: 'hola trabajador',
          leidoPorDestinatario: false,
          createdAt: new Date('2026-01-02'),
        },
      ];
      mensajesRepo.find.mockResolvedValue(mensajes);

      const resultado = await service.findBySolicitud('solicitud-1', 'cliente1', 'cliente');

      expect(mensajesRepo.update).toHaveBeenCalledWith(
        expect.objectContaining({ solicitudId: 'solicitud-1', leidoPorDestinatario: false }),
        { leidoPorDestinatario: true },
      );
      // El mensaje del trabajador se refleja como leído en el resultado devuelto.
      expect(resultado.find((m) => m.id === 'm1')?.leidoPorDestinatario).toBe(true);
      // El mensaje propio del cliente no debe "leerse a sí mismo".
      expect(resultado.find((m) => m.id === 'm2')?.leidoPorDestinatario).toBe(false);
    });

    it('consulta los mensajes ordenados por createdAt ASC', async () => {
      solicitudesRepo.findOne.mockResolvedValue(solicitudBase);
      mensajesRepo.find.mockResolvedValue([]);

      await service.findBySolicitud('solicitud-1', 'cliente1', 'cliente');

      expect(mensajesRepo.find).toHaveBeenCalledWith({
        where: { solicitudId: 'solicitud-1' },
        order: { createdAt: 'ASC' },
      });
    });
  });

  describe('findConversaciones', () => {
    it('agrupa mensajes de varias solicitudes con una sola consulta batched (evita N+1)', async () => {
      const solicitudes = [
        { id: 'solicitud-1', clienteUsername: 'cliente1', trabajadorAsignado: 'trabajador1' },
        { id: 'solicitud-2', clienteUsername: 'cliente1', trabajadorAsignado: 'trabajador2' },
        { id: 'solicitud-3', clienteUsername: 'cliente1', trabajadorAsignado: 'trabajador3' },
      ] as Solicitud[];
      solicitudesRepo.find.mockResolvedValue(solicitudes);

      const mensajes = [
        {
          id: 'm1',
          solicitudId: 'solicitud-1',
          autorUsername: 'trabajador1',
          contenido: 'primero',
          leidoPorDestinatario: false,
          createdAt: new Date('2026-01-01T10:00:00'),
        },
        {
          id: 'm2',
          solicitudId: 'solicitud-1',
          autorUsername: 'trabajador1',
          contenido: 'segundo',
          leidoPorDestinatario: false,
          createdAt: new Date('2026-01-01T11:00:00'),
        },
        {
          id: 'm3',
          solicitudId: 'solicitud-2',
          autorUsername: 'cliente1',
          contenido: 'hola',
          leidoPorDestinatario: true,
          createdAt: new Date('2026-01-02T09:00:00'),
        },
      ];
      mensajesRepo.find.mockResolvedValue(mensajes);
      usersService.findByUsernames.mockResolvedValue(
        new Map([
          ['trabajador1', { username: 'trabajador1', name: 'Juan' }],
          ['trabajador2', { username: 'trabajador2', name: 'Pedro' }],
        ]),
      );

      const resultado = await service.findConversaciones('cliente1');

      // Una sola consulta a Solicitud y una sola consulta batched a Mensaje,
      // sin importar cuántas solicitudes tenga el usuario.
      expect(solicitudesRepo.find).toHaveBeenCalledTimes(1);
      expect(mensajesRepo.find).toHaveBeenCalledTimes(1);

      // solicitud-3 no tiene mensajes, así que no debe aparecer.
      expect(resultado).toHaveLength(2);

      const conv1 = resultado.find((c) => c.solicitudId === 'solicitud-1');
      expect(conv1).toMatchObject({
        contraparteNombre: 'Juan',
        ultimoMensaje: 'segundo',
        noLeidos: 2,
      });

      const conv2 = resultado.find((c) => c.solicitudId === 'solicitud-2');
      expect(conv2).toMatchObject({
        contraparteNombre: 'Pedro',
        ultimoMensaje: 'hola',
        noLeidos: 0,
      });
    });

    it('retorna arreglo vacío si el usuario no tiene solicitudes asociadas', async () => {
      solicitudesRepo.find.mockResolvedValue([]);

      const resultado = await service.findConversaciones('nadie');

      expect(resultado).toEqual([]);
      expect(mensajesRepo.find).not.toHaveBeenCalled();
    });
  });
});
