import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { OfertasService } from './ofertas.service';
import { Oferta } from './oferta.entity';
import { Solicitud } from '../solicitudes/solicitud.entity';
import { UsersService } from '../users/users.service';
import { NotificacionesService } from '../notificaciones/notificaciones.service';
import { CreateOfertaDto } from './dto/create-oferta.dto';

describe('OfertasService', () => {
  let service: OfertasService;
  let ofertasRepo: {
    find: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    count: jest.Mock;
    delete: jest.Mock;
  };
  let solicitudesRepo: { findOne: jest.Mock };
  let dataSource: { transaction: jest.Mock };
  let notificacionesService: { crear: jest.Mock };
  let usersService: { findByUsernames: jest.Mock };

  const dto: CreateOfertaDto = {
    solicitudId: 'solicitud-1',
    precio: 100000,
    mensaje: 'Puedo hacerlo',
    fechaInicio: '2026-09-15',
  };
  const trabajadorUsername = 'trabajador1';

  beforeEach(async () => {
    ofertasRepo = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
      create: jest.fn((data) => data),
      save: jest.fn((data) => Promise.resolve({ id: 'oferta-1', ...data })),
      count: jest.fn(),
      delete: jest.fn().mockResolvedValue(undefined),
    };
    solicitudesRepo = {
      findOne: jest.fn(),
    };
    dataSource = { transaction: jest.fn() };
    notificacionesService = { crear: jest.fn().mockResolvedValue(undefined) };
    usersService = { findByUsernames: jest.fn().mockResolvedValue(new Map()) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OfertasService,
        { provide: getRepositoryToken(Oferta), useValue: ofertasRepo },
        { provide: getRepositoryToken(Solicitud), useValue: solicitudesRepo },
        { provide: UsersService, useValue: usersService },
        { provide: DataSource, useValue: dataSource },
        { provide: NotificacionesService, useValue: notificacionesService },
      ],
    }).compile();

    service = module.get<OfertasService>(OfertasService);
  });

  describe('crear', () => {
    it('lanza NotFoundException si la solicitud no existe', async () => {
      solicitudesRepo.findOne.mockResolvedValue(null);

      await expect(service.crear(dto, trabajadorUsername)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('lanza ConflictException si la solicitud no está publicada', async () => {
      solicitudesRepo.findOne.mockResolvedValue({
        id: 'solicitud-1',
        estado: 'ejecucion',
      });

      await expect(service.crear(dto, trabajadorUsername)).rejects.toThrow(
        ConflictException,
      );
      expect(ofertasRepo.findOne).not.toHaveBeenCalled();
    });

    it('lanza ConflictException si el trabajador ya tiene una oferta pendiente en la solicitud', async () => {
      solicitudesRepo.findOne.mockResolvedValue({
        id: 'solicitud-1',
        estado: 'publicado',
      });
      ofertasRepo.findOne.mockResolvedValue({
        id: 'oferta-existente',
        solicitudId: 'solicitud-1',
        trabajadorUsername,
        estado: 'pendiente',
      });

      await expect(service.crear(dto, trabajadorUsername)).rejects.toThrow(
        ConflictException,
      );
      expect(ofertasRepo.findOne).toHaveBeenCalledWith({
        where: {
          solicitudId: dto.solicitudId,
          trabajadorUsername,
          estado: 'pendiente',
        },
      });
      expect(ofertasRepo.save).not.toHaveBeenCalled();
    });

    it('permite crear una nueva oferta si la única previa del trabajador está rechazada', async () => {
      solicitudesRepo.findOne.mockResolvedValue({
        id: 'solicitud-1',
        estado: 'publicado',
      });
      // La consulta filtra por estado: 'pendiente', así que una oferta rechazada
      // no debe aparecer aquí — el mock refleja ese comportamiento devolviendo null.
      ofertasRepo.findOne.mockResolvedValue(null);

      const resultado = await service.crear(dto, trabajadorUsername);

      expect(resultado).toMatchObject({
        ...dto,
        trabajadorUsername,
      });
      expect(ofertasRepo.save).toHaveBeenCalled();
    });

    it('notifica al cliente que recibió una nueva oferta', async () => {
      solicitudesRepo.findOne.mockResolvedValue({
        id: 'solicitud-1',
        estado: 'publicado',
        clienteUsername: 'cliente1',
      });
      ofertasRepo.findOne.mockResolvedValue(null);

      await service.crear(dto, trabajadorUsername);

      expect(notificacionesService.crear).toHaveBeenCalledWith(
        'cliente1',
        'nueva_oferta',
        expect.any(String),
        dto.solicitudId,
        'oferta',
        'oferta-1',
      );
    });
  });

  describe('aceptar', () => {
    const ofertaId = 'oferta-1';

    const diasAtras = (dias: number) => {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - dias);
      return fecha;
    };

    // Construye un `manager` transaccional falso que responde según la entidad
    // consultada (Oferta vs Solicitud), reflejando cómo `aceptar()` usa
    // `manager.findOne`/`update`/`save` dentro de `dataSource.transaction`.
    const mockManager = (oferta: any, solicitud: any) => ({
      findOne: jest.fn((entity, options) => {
        if (entity === Oferta) return Promise.resolve(oferta);
        if (entity === Solicitud) return Promise.resolve(solicitud);
        return Promise.resolve(null);
      }),
      update: jest.fn().mockResolvedValue(undefined),
      save: jest.fn((data) => Promise.resolve(data)),
    });

    it('lanza NotFoundException si la oferta no existe', async () => {
      dataSource.transaction.mockImplementation((cb) => cb(mockManager(null, null)));

      await expect(service.aceptar(ofertaId)).rejects.toThrow(NotFoundException);
    });

    it('lanza ConflictException si la oferta ya expiró', async () => {
      const oferta = {
        id: ofertaId,
        solicitudId: 'solicitud-1',
        trabajadorUsername: 'trabajador1',
        createdAt: diasAtras(10),
      };
      dataSource.transaction.mockImplementation((cb) =>
        cb(mockManager(oferta, { id: 'solicitud-1' })),
      );

      await expect(service.aceptar(ofertaId)).rejects.toThrow(ConflictException);
    });

    it('lanza NotFoundException si la solicitud de la oferta no existe', async () => {
      const oferta = {
        id: ofertaId,
        solicitudId: 'solicitud-1',
        trabajadorUsername: 'trabajador1',
        createdAt: diasAtras(1),
      };
      dataSource.transaction.mockImplementation((cb) => cb(mockManager(oferta, null)));

      await expect(service.aceptar(ofertaId)).rejects.toThrow(NotFoundException);
    });

    it('acepta la oferta, rechaza las hermanas y pasa la solicitud a ejecución', async () => {
      const oferta = {
        id: ofertaId,
        solicitudId: 'solicitud-1',
        trabajadorUsername: 'trabajador1',
        createdAt: diasAtras(1),
      };
      const solicitud = {
        id: 'solicitud-1',
        clienteUsername: 'cliente1',
        estado: 'publicado',
      };
      const manager = mockManager(oferta, solicitud);
      dataSource.transaction.mockImplementation((cb) => cb(manager));

      const resultado = await service.aceptar(ofertaId);

      expect(manager.update).toHaveBeenCalledWith(
        Oferta,
        { solicitudId: oferta.solicitudId, id: expect.anything() },
        { estado: 'rechazada' },
      );
      expect(manager.update).toHaveBeenCalledWith(
        Oferta,
        { id: ofertaId },
        { estado: 'aceptada' },
      );
      expect(resultado.estado).toBe('ejecucion');
      expect(resultado.trabajadorAsignado).toBe('trabajador1');
      expect(resultado.codigoVerificacion).toMatch(/^\d{4}$/);
      expect(manager.save).toHaveBeenCalledWith(
        expect.objectContaining({ estado: 'ejecucion', trabajadorAsignado: 'trabajador1' }),
      );
    });

    it('no regenera el código de verificación si la solicitud ya tenía uno', async () => {
      const oferta = {
        id: ofertaId,
        solicitudId: 'solicitud-1',
        trabajadorUsername: 'trabajador1',
        createdAt: diasAtras(1),
      };
      const solicitud = {
        id: 'solicitud-1',
        clienteUsername: 'cliente1',
        estado: 'publicado',
        codigoVerificacion: '9999',
      };
      dataSource.transaction.mockImplementation((cb) =>
        cb(mockManager(oferta, solicitud)),
      );

      const resultado = await service.aceptar(ofertaId);

      expect(resultado.codigoVerificacion).toBe('9999');
    });

    it('notifica al trabajador y al cliente tras aceptar la oferta', async () => {
      const oferta = {
        id: ofertaId,
        solicitudId: 'solicitud-1',
        trabajadorUsername: 'trabajador1',
        createdAt: diasAtras(1),
      };
      const solicitud = {
        id: 'solicitud-1',
        clienteUsername: 'cliente1',
        estado: 'publicado',
      };
      dataSource.transaction.mockImplementation((cb) =>
        cb(mockManager(oferta, solicitud)),
      );

      await service.aceptar(ofertaId);

      expect(notificacionesService.crear).toHaveBeenCalledWith(
        'trabajador1',
        'oferta_aceptada',
        expect.any(String),
        'solicitud-1',
        'oferta',
        ofertaId,
      );
      expect(notificacionesService.crear).toHaveBeenCalledWith(
        'cliente1',
        'solicitud_en_ejecucion',
        expect.any(String),
        'solicitud-1',
        'solicitud',
        'solicitud-1',
      );
    });

    it('no propaga el error si la notificación falla (resiliencia)', async () => {
      const oferta = {
        id: ofertaId,
        solicitudId: 'solicitud-1',
        trabajadorUsername: 'trabajador1',
        createdAt: diasAtras(1),
      };
      const solicitud = {
        id: 'solicitud-1',
        clienteUsername: 'cliente1',
        estado: 'publicado',
      };
      dataSource.transaction.mockImplementation((cb) =>
        cb(mockManager(oferta, solicitud)),
      );
      notificacionesService.crear.mockRejectedValue(new Error('boom'));

      await expect(service.aceptar(ofertaId)).resolves.toMatchObject({
        estado: 'ejecucion',
      });
    });
  });

  describe('findBySolicitud', () => {
    const diasAtras = (dias: number) => {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - dias);
      return fecha;
    };

    it('excluye las ofertas expiradas (más de 3 días) del resultado', async () => {
      const ofertaExpirada = {
        id: 'oferta-vieja',
        solicitudId: 'solicitud-1',
        trabajadorUsername: 'trabajador1',
        precio: 50000,
        mensaje: 'vieja',
        estado: 'pendiente',
        createdAt: diasAtras(10),
      };
      const ofertaVigente = {
        id: 'oferta-nueva',
        solicitudId: 'solicitud-1',
        trabajadorUsername: 'trabajador2',
        precio: 60000,
        mensaje: 'nueva',
        estado: 'pendiente',
        createdAt: diasAtras(1),
      };
      ofertasRepo.find.mockResolvedValue([ofertaExpirada, ofertaVigente]);

      const resultado = await service.findBySolicitud('solicitud-1');

      expect(resultado).toHaveLength(1);
      expect(resultado[0].id).toBe('oferta-nueva');
      expect(resultado.find((o) => o.id === 'oferta-vieja')).toBeUndefined();
      expect(usersService.findByUsernames).toHaveBeenCalledWith(['trabajador2']);
    });

    it('devuelve una oferta reciente sin marcarla como expirada', async () => {
      const ofertaVigente = {
        id: 'oferta-nueva',
        solicitudId: 'solicitud-1',
        trabajadorUsername: 'trabajador2',
        precio: 60000,
        mensaje: 'nueva',
        estado: 'pendiente',
        createdAt: diasAtras(1),
      };
      ofertasRepo.find.mockResolvedValue([ofertaVigente]);

      const resultado = await service.findBySolicitud('solicitud-1');

      expect(resultado).toHaveLength(1);
      expect(resultado[0]).not.toHaveProperty('expirada');
    });
  });

  describe('findBySolicitudIds', () => {
    const diasAtras = (dias: number) => {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - dias);
      return fecha;
    };

    it('excluye las ofertas expiradas al agrupar por solicitud', async () => {
      const ofertaExpirada = {
        id: 'oferta-vieja',
        solicitudId: 'solicitud-1',
        trabajadorUsername: 'trabajador1',
        precio: 50000,
        mensaje: 'vieja',
        estado: 'pendiente',
        createdAt: diasAtras(10),
      };
      const ofertaVigente = {
        id: 'oferta-nueva',
        solicitudId: 'solicitud-1',
        trabajadorUsername: 'trabajador2',
        precio: 60000,
        mensaje: 'nueva',
        estado: 'pendiente',
        createdAt: diasAtras(1),
      };
      ofertasRepo.find.mockResolvedValue([ofertaExpirada, ofertaVigente]);

      const resultado = await service.findBySolicitudIds(['solicitud-1']);

      const ofertasSolicitud1 = resultado.get('solicitud-1') ?? [];
      expect(ofertasSolicitud1).toHaveLength(1);
      expect(ofertasSolicitud1[0].id).toBe('oferta-nueva');
    });
  });

  describe('existeAceptada', () => {
    it('devuelve true si hay al menos una oferta aceptada para la solicitud', async () => {
      ofertasRepo.count.mockResolvedValue(1);

      await expect(service.existeAceptada('solicitud-1')).resolves.toBe(true);
      expect(ofertasRepo.count).toHaveBeenCalledWith({
        where: { solicitudId: 'solicitud-1', estado: 'aceptada' },
      });
    });

    it('devuelve false si no hay ninguna oferta aceptada para la solicitud', async () => {
      ofertasRepo.count.mockResolvedValue(0);

      await expect(service.existeAceptada('solicitud-1')).resolves.toBe(false);
    });
  });

  describe('eliminarPorSolicitud', () => {
    it('elimina todas las ofertas asociadas a la solicitud', async () => {
      await service.eliminarPorSolicitud('solicitud-1');

      expect(ofertasRepo.delete).toHaveBeenCalledWith({ solicitudId: 'solicitud-1' });
    });
  });
});
