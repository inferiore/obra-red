import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { In } from 'typeorm';
import * as fs from 'fs';
import { FilesService } from './files.service';
import { File } from './files.entity';

describe('FilesService', () => {
  let service: FilesService;
  let filesRepo: {
    find: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    findBy: jest.Mock;
    delete: jest.Mock;
  };
  let unlinkSpy: jest.SpiedFunction<typeof fs.promises.unlink>;

  beforeEach(async () => {
    filesRepo = {
      find: jest.fn(),
      create: jest.fn((data) => data),
      save: jest.fn().mockResolvedValue(undefined),
      findBy: jest.fn(),
      delete: jest.fn().mockResolvedValue(undefined),
    };

    unlinkSpy = jest
      .spyOn(fs.promises, 'unlink')
      .mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FilesService,
        { provide: getRepositoryToken(File), useValue: filesRepo },
      ],
    }).compile();

    service = module.get<FilesService>(FilesService);
  });

  afterEach(() => {
    unlinkSpy.mockRestore();
  });

  describe('find', () => {
    it('busca los archivos por object y objectId', async () => {
      const rows = [{ id: 'file-1', object: 'solicitud', objectId: 'sol-1' }];
      filesRepo.find.mockResolvedValue(rows);

      const resultado = await service.find('solicitud', 'sol-1');

      expect(filesRepo.find).toHaveBeenCalledWith({
        where: { object: 'solicitud', objectId: 'sol-1' },
      });
      expect(resultado).toBe(rows);
    });
  });

  describe('store', () => {
    it('persiste un registro de archivo para un único file', async () => {
      const files = [
        {
          filename: 'abc123.jpg',
          path: 'uploads/abc123.jpg',
        },
      ] as Express.Multer.File[];

      await service.store('solicitud', 'sol-1', files);

      expect(filesRepo.create).toHaveBeenCalledWith([
        {
          name: 'abc123.jpg',
          path: 'uploads/abc123.jpg',
          object: 'solicitud',
          objectId: 'sol-1',
          disk: 'default',
        },
      ]);
      expect(filesRepo.save).toHaveBeenCalledWith([
        {
          name: 'abc123.jpg',
          path: 'uploads/abc123.jpg',
          object: 'solicitud',
          objectId: 'sol-1',
          disk: 'default',
        },
      ]);
    });

    it('persiste un registro de archivo por cada file cuando hay varios', async () => {
      const files = [
        { filename: 'a.jpg', path: 'uploads/a.jpg' },
        { filename: 'b.png', path: 'uploads/b.png' },
      ] as Express.Multer.File[];

      await service.store('solicitud', 'sol-1', files);

      const registrosCreados = filesRepo.create.mock.calls[0][0];
      expect(registrosCreados).toHaveLength(2);
      expect(registrosCreados).toEqual([
        expect.objectContaining({ name: 'a.jpg', path: 'uploads/a.jpg' }),
        expect.objectContaining({ name: 'b.png', path: 'uploads/b.png' }),
      ]);
      expect(filesRepo.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('delete', () => {
    it('elimina las filas correspondientes a los ids indicados y borra los archivos del disco', async () => {
      const ids = ['file-1', 'file-2'];
      filesRepo.findBy.mockResolvedValue([
        { id: 'file-1', path: 'uploads/a.jpg' },
        { id: 'file-2', path: 'uploads/b.png' },
      ]);

      await service.delete(ids);

      expect(filesRepo.findBy).toHaveBeenCalledWith({ id: In(ids) });
      expect(filesRepo.delete).toHaveBeenCalledWith({ id: In(ids) });
      expect(unlinkSpy).toHaveBeenCalledTimes(2);
    });

    it('no lanza error si un archivo ya no existe en disco (ENOENT)', async () => {
      const ids = ['file-1'];
      filesRepo.findBy.mockResolvedValue([{ id: 'file-1', path: 'uploads/a.jpg' }]);
      const enoentError: NodeJS.ErrnoException = Object.assign(new Error('missing'), {
        code: 'ENOENT',
      });
      unlinkSpy.mockRejectedValue(enoentError);

      await expect(service.delete(ids)).resolves.toBeUndefined();
    });

    it('propaga errores del sistema de archivos distintos de ENOENT', async () => {
      const ids = ['file-1'];
      filesRepo.findBy.mockResolvedValue([{ id: 'file-1', path: 'uploads/a.jpg' }]);
      const otroError: NodeJS.ErrnoException = Object.assign(new Error('boom'), {
        code: 'EACCES',
      });
      unlinkSpy.mockRejectedValue(otroError);

      await expect(service.delete(ids)).rejects.toThrow('boom');
    });
  });
});
