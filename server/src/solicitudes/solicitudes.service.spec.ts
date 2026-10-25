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
import { UsersService } from '../users/users.service';
import { UpdateEstadoDto } from './dto/update-estado.dto';
import { SolicitarCorreccionDto } from './dto/solicitar-correccion.dto';
import { AbrirDisputaDto } from './dto/abrir-disputa.dto';

describe('SolicitudesService', () => {
  let service: SolicitudesService;
  let repo: { findOne: jest.Mock; save: jest.Mock; remove: jest.Mock };
  let notificacionesService: { crear: jest.Mock };
  let ofertasService: {
    findBySolicitudIds: jest.Mock;
    existeAceptada: jest.Mock;
    eliminarPorSolicitud: jest.Mock;
  };
  let usersService: { findByUsername: jest.Mock };

  beforeEach(async () => {
    repo = {
      findOne: jest.fn(),
      save: jest.fn((data) => Promise.resolve(data)),
      remove: jest.fn((data) => Promise.resolve(data)),
    };
    notificacionesService = { crear: jest.fn().mockResolvedValue(undefined) };
    ofertasService = {
      findBySolicitudIds: jest.fn(),
      existeAceptada: jest.fn().mockResolvedValue(false),
      eliminarPorSolicitud: jest.fn().mockResolvedValue(undefined),
    };
    usersService = { findByUsername: jest.fn().mockResolvedValue(null) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SolicitudesService,
        { provide: getRepositoryToken(Solicitud), useValue: repo },
        { provide: OfertasService, useValue: ofertasService },
        { provide: NotificacionesService, useValue: notificacionesService },
        { provide: UsersService, useValue: usersService },
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
      expect(resultado.codigoVerificacion).toMatch(/^\d{4}$/);
      expect(notificacionesService.crear).toHaveBeenCalledWith(
        'cliente1',
        'solicitud_en_ejecucion',
        expect.any(String),
        id,
        'solicitud',
        id,
      );
    });

    it('no regenera el código de verificación si la solicitud ya tenía uno', async () => {
      repo.findOne.mockResolvedValue({
        id,
        clienteUsername: 'cliente1',
        estado: 'disputa',
        trabajadorAsignado: 'trabajador1',
        codigoVerificacion: '1234',
      });
      const dto: UpdateEstadoDto = { estado: 'ejecucion' };

      const resultado = await service.actualizarEstado(id, dto);

      expect(resultado.codigoVerificacion).toBe('1234');
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

  describe('obtenerCodigoVerificacion', () => {
    const id = 'solicitud-1';

    it('el cliente dueño puede acceder al código', async () => {
      repo.findOne.mockResolvedValue({
        id,
        clienteUsername: 'cliente1',
        trabajadorAsignado: 'trabajador1',
        estado: 'ejecucion',
        codigoVerificacion: '4321',
      });
      usersService.findByUsername.mockResolvedValue({
        username: 'trabajador1',
        documento: '1234567890',
      });

      const resultado = await service.obtenerCodigoVerificacion(id, 'cliente1');

      expect(resultado.codigo).toBe('4321');
      expect(resultado.documentoFallback).toBe('890');
    });

    it('el trabajador asignado puede acceder al código', async () => {
      repo.findOne.mockResolvedValue({
        id,
        clienteUsername: 'cliente1',
        trabajadorAsignado: 'trabajador1',
        estado: 'ejecucion',
        codigoVerificacion: '4321',
      });
      usersService.findByUsername.mockResolvedValue({
        username: 'trabajador1',
        documento: '1234567890',
      });

      const resultado = await service.obtenerCodigoVerificacion(id, 'trabajador1');

      expect(resultado.codigo).toBe('4321');
    });

    it('lanza ForbiddenException si quien pide el código no es cliente ni trabajador de la solicitud', async () => {
      repo.findOne.mockResolvedValue({
        id,
        clienteUsername: 'cliente1',
        trabajadorAsignado: 'trabajador1',
        estado: 'ejecucion',
        codigoVerificacion: '4321',
      });

      await expect(
        service.obtenerCodigoVerificacion(id, 'otro-usuario'),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('lanza ConflictException si la solicitud todavía no tiene código', async () => {
      repo.findOne.mockResolvedValue({
        id,
        clienteUsername: 'cliente1',
        trabajadorAsignado: 'trabajador1',
        estado: 'publicado',
        codigoVerificacion: undefined,
      });

      await expect(
        service.obtenerCodigoVerificacion(id, 'cliente1'),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('omite documentoFallback si el trabajador no tiene documento registrado', async () => {
      repo.findOne.mockResolvedValue({
        id,
        clienteUsername: 'cliente1',
        trabajadorAsignado: 'trabajador1',
        estado: 'ejecucion',
        codigoVerificacion: '4321',
      });
      usersService.findByUsername.mockResolvedValue({
        username: 'trabajador1',
        documento: undefined,
      });

      const resultado = await service.obtenerCodigoVerificacion(id, 'cliente1');

      expect(resultado.documentoFallback).toBeUndefined();
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

    it('reanuda la disputa hacia ejecucion sin setear resolucionDisputa y notifica a ambas partes', async () => {
      repo.findOne.mockResolvedValue({
        id,
        clienteUsername: 'cliente1',
        trabajadorAsignado: 'trabajador1',
        estado: 'disputa',
      });

      const resultado = await service.resolverDisputa(id, 'reanudar');

      expect(resultado.estado).toBe('ejecucion');
      expect(resultado.resolucionDisputa).toBeUndefined();
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

    it('resuelve la disputa a favor del trabajador, finaliza y notifica con el mensaje específico', async () => {
      repo.findOne.mockResolvedValue({
        id,
        clienteUsername: 'cliente1',
        trabajadorAsignado: 'trabajador1',
        estado: 'disputa',
      });

      const resultado = await service.resolverDisputa(id, 'trabajador');

      expect(resultado.estado).toBe('finalizado');
      expect(resultado.resolucionDisputa).toBe('trabajador');
      expect(notificacionesService.crear).toHaveBeenCalledWith(
        'cliente1',
        'disputa_resuelta',
        expect.stringContaining('liberó al trabajador'),
        id,
        'solicitud',
        id,
      );
      expect(notificacionesService.crear).toHaveBeenCalledWith(
        'trabajador1',
        'disputa_resuelta',
        expect.stringContaining('a tu favor'),
        id,
        'solicitud',
        id,
      );
    });

    it('resuelve la disputa a favor del cliente, finaliza y notifica con el mensaje específico', async () => {
      repo.findOne.mockResolvedValue({
        id,
        clienteUsername: 'cliente1',
        trabajadorAsignado: 'trabajador1',
        estado: 'disputa',
      });

      const resultado = await service.resolverDisputa(id, 'cliente');

      expect(resultado.estado).toBe('finalizado');
      expect(resultado.resolucionDisputa).toBe('cliente');
      expect(notificacionesService.crear).toHaveBeenCalledWith(
        'cliente1',
        'disputa_resuelta',
        expect.stringContaining('devuelto a ti'),
        id,
        'solicitud',
        id,
      );
      expect(notificacionesService.crear).toHaveBeenCalledWith(
        'trabajador1',
        'disputa_resuelta',
        expect.stringContaining('devuelto al cliente'),
        id,
        'solicitud',
        id,
      );
    });

    it('resuelve la disputa dividiendo el pago 50/50, finaliza y notifica a ambas partes', async () => {
      repo.findOne.mockResolvedValue({
        id,
        clienteUsername: 'cliente1',
        trabajadorAsignado: 'trabajador1',
        estado: 'disputa',
      });

      const resultado = await service.resolverDisputa(id, 'mitad');

      expect(resultado.estado).toBe('finalizado');
      expect(resultado.resolucionDisputa).toBe('mitad');
      expect(notificacionesService.crear).toHaveBeenCalledWith(
        'cliente1',
        'disputa_resuelta',
        expect.stringContaining('50/50'),
        id,
        'solicitud',
        id,
      );
      expect(notificacionesService.crear).toHaveBeenCalledWith(
        'trabajador1',
        'disputa_resuelta',
        expect.stringContaining('50/50'),
        id,
        'solicitud',
        id,
      );
    });

    it('lanza NotFoundException si la solicitud no existe', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.resolverDisputa(id, 'reanudar')).rejects.toBeInstanceOf(
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

      await expect(service.resolverDisputa(id, 'reanudar')).rejects.toBeInstanceOf(
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

      await expect(service.resolverDisputa(id, 'trabajador')).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });

  describe('eliminar', () => {
    const id = 'solicitud-1';

    it('elimina las ofertas de la solicitud y luego la solicitud si el dueño coincide y no hay trabajador asignado ni oferta aceptada', async () => {
      const solicitud = {
        id,
        clienteUsername: 'cliente1',
        estado: 'publicado',
        trabajadorAsignado: undefined,
      };
      repo.findOne.mockResolvedValue(solicitud);
      ofertasService.existeAceptada.mockResolvedValue(false);

      await service.eliminar(id, 'cliente1');

      expect(ofertasService.existeAceptada).toHaveBeenCalledWith(id);
      expect(ofertasService.eliminarPorSolicitud).toHaveBeenCalledWith(id);
      expect(repo.remove).toHaveBeenCalledWith(solicitud);
    });

    it('lanza ForbiddenException si quien pide eliminar no es el dueño de la solicitud', async () => {
      repo.findOne.mockResolvedValue({
        id,
        clienteUsername: 'cliente1',
        estado: 'publicado',
        trabajadorAsignado: undefined,
      });

      await expect(service.eliminar(id, 'otro-cliente')).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(ofertasService.eliminarPorSolicitud).not.toHaveBeenCalled();
      expect(repo.remove).not.toHaveBeenCalled();
    });

    it('lanza ConflictException si ya hay un trabajador asignado', async () => {
      repo.findOne.mockResolvedValue({
        id,
        clienteUsername: 'cliente1',
        estado: 'ejecucion',
        trabajadorAsignado: 'trabajador1',
      });

      await expect(service.eliminar(id, 'cliente1')).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(ofertasService.eliminarPorSolicitud).not.toHaveBeenCalled();
      expect(repo.remove).not.toHaveBeenCalled();
    });

    it('lanza ConflictException si ya existe una oferta aceptada', async () => {
      repo.findOne.mockResolvedValue({
        id,
        clienteUsername: 'cliente1',
        estado: 'publicado',
        trabajadorAsignado: undefined,
      });
      ofertasService.existeAceptada.mockResolvedValue(true);

      await expect(service.eliminar(id, 'cliente1')).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(ofertasService.eliminarPorSolicitud).not.toHaveBeenCalled();
      expect(repo.remove).not.toHaveBeenCalled();
    });

    it('lanza NotFoundException si la solicitud no existe', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.eliminar(id, 'cliente1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
