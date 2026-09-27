import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SolicitudesService } from './solicitudes.service';
import { Solicitud } from './solicitud.entity';
import { OfertasService } from '../ofertas/ofertas.service';
import { NotificacionesService } from '../notificaciones/notificaciones.service';
import { UpdateEstadoDto } from './dto/update-estado.dto';
import { SolicitarCorreccionDto } from './dto/solicitar-correccion.dto';
import { AbrirDisputaDto } from './dto/abrir-disputa.dto';

describe('SolicitudesService', () => {
  let service: SolicitudesService;
  let repo: { findOne: jest.Mock; save: jest.Mock };
  let notificacionesService: { crear: jest.Mock };

  beforeEach(async () => {
    repo = {
      findOne: jest.fn(),
      save: jest.fn((data) => Promise.resolve(data)),
    };
    notificacionesService = { crear: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SolicitudesService,
        { provide: getRepositoryToken(Solicitud), useValue: repo },
        { provide: OfertasService, useValue: { findBySolicitudIds: jest.fn() } },
        { provide: NotificacionesService, useValue: notificacionesService },
      ],
    }).compile();

    service = module.get<SolicitudesService>(SolicitudesService);
  });

  describe('actualizarEstado', () => {
    const id = 'solicitud-1';

    it('notifica al cliente cuando el estado pasa a ejecucion', async () => {
      repo.findOne.mockResolvedValue({
        id,
        clienteUsername: 'cliente1',
        estado: 'publicado',
      });
      const dto: UpdateEstadoDto = { estado: 'ejecucion', trabajadorUsername: 'trabajador1' };

      const resultado = await service.actualizarEstado(id, dto);

      expect(resultado.estado).toBe('ejecucion');
      expect(resultado.trabajadorAsignado).toBe('trabajador1');
      expect(notificacionesService.crear).toHaveBeenCalledWith(
        'cliente1',
        'solicitud_en_ejecucion',
        expect.any(String),
        id,
        'solicitud',
        id,
      );
    });

    it('notifica al trabajador asignado cuando el estado pasa a finalizado', async () => {
      repo.findOne.mockResolvedValue({
        id,
        clienteUsername: 'cliente1',
        estado: 'revision',
        trabajadorAsignado: 'trabajador1',
      });
      const dto: UpdateEstadoDto = { estado: 'finalizado' };

      const resultado = await service.actualizarEstado(id, dto);

      expect(resultado.estado).toBe('finalizado');
      expect(notificacionesService.crear).toHaveBeenCalledWith(
        'trabajador1',
        'solicitud_finalizada',
        expect.any(String),
        id,
        'solicitud',
        id,
      );
    });

    it('no notifica ni lanza si pasa a finalizado sin trabajadorAsignado', async () => {
      repo.findOne.mockResolvedValue({
        id,
        clienteUsername: 'cliente1',
        estado: 'revision',
        trabajadorAsignado: undefined,
      });
      const dto: UpdateEstadoDto = { estado: 'finalizado' };

      const resultado = await service.actualizarEstado(id, dto);

      expect(resultado.estado).toBe('finalizado');
      expect(notificacionesService.crear).not.toHaveBeenCalled();
    });

    it('no propaga el error si la notificación falla (resiliencia)', async () => {
      repo.findOne.mockResolvedValue({
        id,
        clienteUsername: 'cliente1',
        estado: 'publicado',
      });
      notificacionesService.crear.mockRejectedValue(new Error('boom'));
      const dto: UpdateEstadoDto = { estado: 'ejecucion', trabajadorUsername: 'trabajador1' };

      await expect(service.actualizarEstado(id, dto)).resolves.toMatchObject({
        estado: 'ejecucion',
      });
    });
  });

  describe('solicitarCorreccion', () => {
    const id = 'solicitud-1';
    const dto: SolicitarCorreccionDto = { comentario: 'Falta pintar el marco' };

    it('primera solicitud: pasa a corrigiendo e incrementa el contador a 1', async () => {
      repo.findOne.mockResolvedValue({
        id,
        clienteUsername: 'cliente1',
        trabajadorAsignado: 'trabajador1',
        estado: 'revision',
        correcciones: [],
        correccionesCount: 0,
      });

      const resultado = await service.solicitarCorreccion(id, dto, 'cliente1');

      expect(resultado.estado).toBe('corrigiendo');
      expect(resultado.correccionesCount).toBe(1);
      expect(resultado.correcciones).toEqual(['Falta pintar el marco']);
      expect(notificacionesService.crear).not.toHaveBeenCalled();
    });

    it('segunda solicitud: pasa a disputa (no vuelve a corrigiendo) y notifica a ambas partes', async () => {
      repo.findOne.mockResolvedValue({
        id,
        clienteUsername: 'cliente1',
        trabajadorAsignado: 'trabajador1',
        estado: 'revision',
        correcciones: ['Primera corrección'],
        correccionesCount: 1,
      });

      const resultado = await service.solicitarCorreccion(id, dto, 'cliente1');

      expect(resultado.estado).toBe('disputa');
      expect(resultado.correccionesCount).toBe(1);
      expect(resultado.correcciones).toEqual([
        'Primera corrección',
        'Falta pintar el marco',
      ]);
      expect(notificacionesService.crear).toHaveBeenCalledWith(
        'cliente1',
        'solicitud_en_disputa',
        expect.any(String),
        id,
        'solicitud',
        id,
      );
      expect(notificacionesService.crear).toHaveBeenCalledWith(
        'trabajador1',
        'solicitud_en_disputa',
        expect.any(String),
        id,
        'solicitud',
        id,
      );
    });

    it('lanza ForbiddenException si quien pide la corrección no es el dueño', async () => {
      repo.findOne.mockResolvedValue({
        id,
        clienteUsername: 'cliente1',
        estado: 'revision',
        correcciones: [],
        correccionesCount: 0,
      });

      await expect(
        service.solicitarCorreccion(id, dto, 'otro-cliente'),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('lanza ConflictException si el estado no es revision', async () => {
      repo.findOne.mockResolvedValue({
        id,
        clienteUsername: 'cliente1',
        estado: 'ejecucion',
        correcciones: [],
        correccionesCount: 0,
      });

      await expect(
        service.solicitarCorreccion(id, dto, 'cliente1'),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('subirEvidenciaDisputa', () => {
    const id = 'solicitud-1';
    const fotos = ['foto1.jpg'];

    it('el cliente puede subir evidencia de disputa', async () => {
      repo.findOne.mockResolvedValue({
        id,
        clienteUsername: 'cliente1',
        trabajadorAsignado: 'trabajador1',
        estado: 'disputa',
        evidenciaDisputa: [],
      });

      const resultado = await service.subirEvidenciaDisputa(id, fotos, 'cliente1');

      expect(resultado.evidenciaDisputa).toEqual([
        expect.objectContaining({ url: 'foto1.jpg', autorUsername: 'cliente1' }),
      ]);
      expect(resultado.evidenciaDisputa[0].createdAt).toEqual(expect.any(String));
    });

    it('el trabajador puede subir evidencia de disputa', async () => {
      repo.findOne.mockResolvedValue({
        id,
        clienteUsername: 'cliente1',
        trabajadorAsignado: 'trabajador1',
        estado: 'disputa',
        evidenciaDisputa: [],
      });

      const resultado = await service.subirEvidenciaDisputa(id, fotos, 'trabajador1');

      expect(resultado.evidenciaDisputa).toEqual([
        expect.objectContaining({ url: 'foto1.jpg', autorUsername: 'trabajador1' }),
      ]);
    });

    it('lanza ForbiddenException si quien sube no es cliente ni trabajador de la solicitud', async () => {
      repo.findOne.mockResolvedValue({
        id,
        clienteUsername: 'cliente1',
        trabajadorAsignado: 'trabajador1',
        estado: 'disputa',
        evidenciaDisputa: [],
      });

      await expect(
        service.subirEvidenciaDisputa(id, fotos, 'otro-usuario'),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('lanza ConflictException si el estado no es disputa', async () => {
      repo.findOne.mockResolvedValue({
        id,
        clienteUsername: 'cliente1',
        trabajadorAsignado: 'trabajador1',
        estado: 'ejecucion',
        evidenciaDisputa: [],
      });

      await expect(
        service.subirEvidenciaDisputa(id, fotos, 'cliente1'),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('acumula evidencia entre llamadas sucesivas en vez de sobrescribir', async () => {
      const solicitud: {
        id: string;
        clienteUsername: string;
        trabajadorAsignado: string;
        estado: string;
        evidenciaDisputa: { url: string; autorUsername: string; createdAt: string }[];
      } = {
        id,
        clienteUsername: 'cliente1',
        trabajadorAsignado: 'trabajador1',
        estado: 'disputa',
        evidenciaDisputa: [],
      };
      repo.findOne.mockImplementation(() => Promise.resolve(solicitud));
      repo.save.mockImplementation((data) => {
        Object.assign(solicitud, data);
        return Promise.resolve(solicitud);
      });

      await service.subirEvidenciaDisputa(id, ['foto-cliente.jpg'], 'cliente1');
      const resultado = await service.subirEvidenciaDisputa(
        id,
        ['foto-trabajador.jpg'],
        'trabajador1',
      );

      expect(resultado.evidenciaDisputa).toEqual([
        expect.objectContaining({ url: 'foto-cliente.jpg', autorUsername: 'cliente1' }),
        expect.objectContaining({ url: 'foto-trabajador.jpg', autorUsername: 'trabajador1' }),
      ]);
    });
  });

  describe('abrirDisputa', () => {
    const id = 'solicitud-1';
    const dto: AbrirDisputaDto = { comentario: 'No estoy de acuerdo con lo pedido' };

    it('abre la disputa y notifica a ambas partes', async () => {
      repo.findOne.mockResolvedValue({
        id,
        clienteUsername: 'cliente1',
        trabajadorAsignado: 'trabajador1',
        estado: 'ejecucion',
        correcciones: [],
        correccionesCount: 0,
      });

      const resultado = await service.abrirDisputa(id, dto, 'trabajador1');

      expect(resultado.estado).toBe('disputa');
      expect(resultado.correcciones).toEqual(['No estoy de acuerdo con lo pedido']);
      expect(notificacionesService.crear).toHaveBeenCalledWith(
        'cliente1',
        'solicitud_en_disputa',
        expect.any(String),
        id,
        'solicitud',
        id,
      );
      expect(notificacionesService.crear).toHaveBeenCalledWith(
        'trabajador1',
        'solicitud_en_disputa',
        expect.any(String),
        id,
        'solicitud',
        id,
      );
    });

    it('lanza NotFoundException si la solicitud no existe', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.abrirDisputa(id, dto, 'trabajador1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('lanza ForbiddenException si el trabajador no está asignado a la solicitud', async () => {
      repo.findOne.mockResolvedValue({
        id,
        clienteUsername: 'cliente1',
        trabajadorAsignado: 'trabajador1',
        estado: 'ejecucion',
        correcciones: [],
        correccionesCount: 0,
      });

      await expect(
        service.abrirDisputa(id, dto, 'otro-trabajador'),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('lanza ConflictException desde un estado inválido (publicado)', async () => {
      repo.findOne.mockResolvedValue({
        id,
        clienteUsername: 'cliente1',
        trabajadorAsignado: 'trabajador1',
        estado: 'publicado',
        correcciones: [],
        correccionesCount: 0,
      });

      await expect(
        service.abrirDisputa(id, dto, 'trabajador1'),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('lanza ConflictException si ya está en disputa', async () => {
      repo.findOne.mockResolvedValue({
        id,
        clienteUsername: 'cliente1',
        trabajadorAsignado: 'trabajador1',
        estado: 'disputa',
        correcciones: ['algo'],
        correccionesCount: 1,
      });

      await expect(
        service.abrirDisputa(id, dto, 'trabajador1'),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('resolverDisputa', () => {
    const id = 'solicitud-1';

    it('resuelve una disputa hacia ejecucion y notifica a ambas partes', async () => {
      repo.findOne.mockResolvedValue({
        id,
        clienteUsername: 'cliente1',
        trabajadorAsignado: 'trabajador1',
        estado: 'disputa',
      });

      const resultado = await service.resolverDisputa(id, 'ejecucion');

      expect(resultado.estado).toBe('ejecucion');
      expect(notificacionesService.crear).toHaveBeenCalledWith(
        'cliente1',
        'disputa_resuelta',
        expect.any(String),
        id,
        'solicitud',
        id,
      );
      expect(notificacionesService.crear).toHaveBeenCalledWith(
        'trabajador1',
        'disputa_resuelta',
        expect.any(String),
        id,
        'solicitud',
        id,
      );
    });

    it('resuelve una disputa hacia finalizado y notifica a ambas partes', async () => {
      repo.findOne.mockResolvedValue({
        id,
        clienteUsername: 'cliente1',
        trabajadorAsignado: 'trabajador1',
        estado: 'disputa',
      });

      const resultado = await service.resolverDisputa(id, 'finalizado');

      expect(resultado.estado).toBe('finalizado');
      expect(notificacionesService.crear).toHaveBeenCalledWith(
        'cliente1',
        'disputa_resuelta',
        expect.any(String),
        id,
        'solicitud',
        id,
      );
      expect(notificacionesService.crear).toHaveBeenCalledWith(
        'trabajador1',
        'disputa_resuelta',
        expect.any(String),
        id,
        'solicitud',
        id,
      );
    });

    it('lanza NotFoundException si la solicitud no existe', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.resolverDisputa(id, 'ejecucion')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('lanza ConflictException si el estado no es disputa (ejecucion)', async () => {
      repo.findOne.mockResolvedValue({
        id,
        clienteUsername: 'cliente1',
        trabajadorAsignado: 'trabajador1',
        estado: 'ejecucion',
      });

      await expect(service.resolverDisputa(id, 'ejecucion')).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('lanza ConflictException si el estado no es disputa (publicado)', async () => {
      repo.findOne.mockResolvedValue({
        id,
        clienteUsername: 'cliente1',
        trabajadorAsignado: 'trabajador1',
        estado: 'publicado',
      });

      await expect(service.resolverDisputa(id, 'finalizado')).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });
});
