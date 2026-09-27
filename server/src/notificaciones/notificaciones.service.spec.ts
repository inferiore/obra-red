import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotificacionesService } from './notificaciones.service';
import { Notificacion } from './notificacion.entity';

describe('NotificacionesService', () => {
  let service: NotificacionesService;
  let notificacionesRepo: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
  };

  beforeEach(async () => {
    notificacionesRepo = {
      create: jest.fn((data) => data),
      save: jest.fn((data) => Promise.resolve({ id: 'notificacion-1', ...data })),
      find: jest.fn(),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificacionesService,
        { provide: getRepositoryToken(Notificacion), useValue: notificacionesRepo },
      ],
    }).compile();

    service = module.get<NotificacionesService>(NotificacionesService);
  });

  describe('crear', () => {
    it('crea y guarda una notificación con solicitudId', async () => {
      const resultado = await service.crear(
        'cliente1',
        'nueva_oferta',
        'Recibiste una nueva oferta en tu solicitud',
        'solicitud-1',
      );

      expect(notificacionesRepo.create).toHaveBeenCalledWith({
        userUsername: 'cliente1',
        tipo: 'nueva_oferta',
        mensaje: 'Recibiste una nueva oferta en tu solicitud',
        solicitudId: 'solicitud-1',
        object: null,
        objectId: null,
      });
      expect(notificacionesRepo.save).toHaveBeenCalled();
      expect(resultado).toMatchObject({
        userUsername: 'cliente1',
        tipo: 'nueva_oferta',
        solicitudId: 'solicitud-1',
      });
    });

    it('usa null como solicitudId, object y objectId por defecto cuando no se proveen', async () => {
      await service.crear('cliente1', 'nueva_oferta', 'mensaje');

      expect(notificacionesRepo.create).toHaveBeenCalledWith({
        userUsername: 'cliente1',
        tipo: 'nueva_oferta',
        mensaje: 'mensaje',
        solicitudId: null,
        object: null,
        objectId: null,
      });
    });

    it('persiste object y objectId cuando se proveen', async () => {
      const resultado = await service.crear(
        'cliente1',
        'nueva_oferta',
        'Recibiste una nueva oferta en tu solicitud',
        'solicitud-1',
        'oferta',
        'oferta-1',
      );

      expect(notificacionesRepo.create).toHaveBeenCalledWith({
        userUsername: 'cliente1',
        tipo: 'nueva_oferta',
        mensaje: 'Recibiste una nueva oferta en tu solicitud',
        solicitudId: 'solicitud-1',
        object: 'oferta',
        objectId: 'oferta-1',
      });
      expect(resultado).toMatchObject({
        object: 'oferta',
        objectId: 'oferta-1',
      });
    });
  });

  describe('findMine', () => {
    it('busca las notificaciones del usuario ordenadas por createdAt DESC', async () => {
      notificacionesRepo.find.mockResolvedValue([]);

      await service.findMine('cliente1');

      expect(notificacionesRepo.find).toHaveBeenCalledWith({
        where: { userUsername: 'cliente1' },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('marcarLeida', () => {
    it('marca la notificación como leída si pertenece al usuario', async () => {
      notificacionesRepo.findOne.mockResolvedValue({
        id: 'notificacion-1',
        userUsername: 'cliente1',
        leido: false,
      });

      const resultado = await service.marcarLeida('notificacion-1', 'cliente1');

      expect(notificacionesRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'notificacion-1', userUsername: 'cliente1' },
      });
      expect(resultado.leido).toBe(true);
      expect(notificacionesRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ leido: true }),
      );
    });

    it('lanza NotFoundException si no existe o no pertenece al usuario', async () => {
      notificacionesRepo.findOne.mockResolvedValue(null);

      await expect(
        service.marcarLeida('notificacion-1', 'otro-usuario'),
      ).rejects.toThrow(NotFoundException);
      expect(notificacionesRepo.save).not.toHaveBeenCalled();
    });
  });
});
