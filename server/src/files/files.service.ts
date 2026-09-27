import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { File } from './files.entity';
import { In, Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(File) private readonly filesRepo: Repository<File>,
  ) {}

  async find(object: string, objectId: string): Promise<File[]> {
    const ofertasRepo = this.filesRepo.find({
      where: { object, objectId },
    });
    return ofertasRepo;
  }
  async store(
    object: string,
    objectId: string,
    files: Array<Express.Multer.File>,
  ) {
    const filesObject = files.map((item) => {
      return {
        name: item.filename,
        path: item.path,
        object: object,
        objectId: objectId,
        disk: 'default',
      };
    });
    const filesCreate = this.filesRepo.create(filesObject);
    await this.filesRepo.save(filesCreate);
  }
  async delete(ids: Array<string>) {
    const files = await this.filesRepo.findBy({ id: In(ids) }).then((data) => {
      return data.map((item) => item.path);
    });
    await this.filesRepo.delete({ id: In(ids) });
    await this.deleteFiles(files);
  }

  private async deleteFiles(filenames: string[]) {
    const deletePromises = filenames.map((filename) =>
      fs.promises
        .unlink(path.join('./uploads', path.basename(filename)))
        .catch((err: NodeJS.ErrnoException) => {
          if (err.code !== 'ENOENT') throw err;
        }),
    );

    await Promise.all(deletePromises);
  }
}
