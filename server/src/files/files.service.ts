import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { File } from './files.entity';
import { Repository } from 'typeorm';

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
}
