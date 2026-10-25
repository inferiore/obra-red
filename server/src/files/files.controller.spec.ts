import { ParseFilePipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { FilesController, filesUploadValidators } from './files.controller';
import { FilesService } from './files.service';

describe('FilesController', () => {
  let controller: FilesController;
  let filesService: { find: jest.Mock; store: jest.Mock; delete: jest.Mock };

  beforeEach(async () => {
    filesService = {
      find: jest.fn(),
      store: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FilesController],
      providers: [{ provide: FilesService, useValue: filesService }],
    }).compile();

    controller = module.get<FilesController>(FilesController);
  });

  describe('list', () => {
    it('delega en el servicio con los query params recibidos', async () => {
      const rows = [{ id: 'file-1' }];
      filesService.find.mockResolvedValue(rows);

      const resultado = await controller.list('solicitud', 'sol-1');

      expect(filesService.find).toHaveBeenCalledWith('solicitud', 'sol-1');
      expect(resultado).toBe(rows);
    });
  });

  describe('store', () => {
    it('delega en el servicio y devuelve las rutas de los archivos subidos', async () => {
      const files = [
        { filename: 'abc.jpg' },
        { filename: 'def.png' },
      ] as Express.Multer.File[];

      const resultado = await controller.store(files, 'solicitud', 'sol-1');

      expect(filesService.store).toHaveBeenCalledWith(
        'solicitud',
        'sol-1',
        files,
      );
      expect(resultado).toEqual({
        path: ['/uploads/abc.jpg', '/uploads/def.png'],
      });
    });

    it('devuelve un arreglo de rutas vacío si no se sube ningún archivo', async () => {
      const files: Express.Multer.File[] = [];

      const resultado = await controller.store(files, 'solicitud', 'sol-1');

      expect(filesService.store).toHaveBeenCalledWith(
        'solicitud',
        'sol-1',
        files,
      );
      expect(resultado).toEqual({ path: [] });
    });
  });

  describe('delete', () => {
    it('delega en el servicio con los ids recibidos', async () => {
      const ids = ['file-1', 'file-2'];

      await controller.delete(ids);

      expect(filesService.delete).toHaveBeenCalledWith(ids);
    });
  });

  describe('validación de archivos subidos (ParseFilePipe de POST /files)', () => {
    const buildPipe = () =>
      new ParseFilePipe({ validators: filesUploadValidators() });

    it('rechaza un archivo con tipo MIME no permitido', async () => {
      const pipe = buildPipe();
      const files = [
        { mimetype: 'application/pdf', size: 1024 },
      ] as Express.Multer.File[];

      await expect(pipe.transform(files)).rejects.toThrow();
    });

    it('rechaza un archivo que excede el tamaño máximo de 25MB', async () => {
      const pipe = buildPipe();
      const files = [
        { mimetype: 'image/jpeg', size: 26 * 1024 * 1024 },
      ] as Express.Multer.File[];

      await expect(pipe.transform(files)).rejects.toThrow();
    });

    it('acepta varias fotos válidas junto con un video válido', async () => {
      const pipe = buildPipe();
      const files = [
        { mimetype: 'image/jpeg', size: 1024 },
        { mimetype: 'image/png', size: 2048 },
        { mimetype: 'video/mp4', size: 10 * 1024 * 1024 },
      ] as Express.Multer.File[];

      await expect(pipe.transform(files)).resolves.toBe(files);
    });
  });
});
