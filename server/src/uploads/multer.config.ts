import { Injectable } from '@nestjs/common';
import {
  MulterModuleOptions,
  MulterOptionsFactory,
} from '@nestjs/platform-express';
import { randomUUID } from 'crypto';
import { diskStorage } from 'multer';
import { extname } from 'path';

// uploads/multer.config.ts
@Injectable()
export class MulterConfigService implements MulterOptionsFactory {
  createMulterOptions(): MulterModuleOptions {
    return {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) =>
          cb(null, `${randomUUID()}${extname(file.originalname)}`),
      }),
      fileFilter: (req, file, cb) => {
        cb(
          null,
          /^(image\/(jpeg|png|webp)|video\/(mp4|quicktime|webm))$/.test(
            file.mimetype,
          ),
        );
      },
      // Alineado con el máximo de 25MB validado en FilesController
      // (ParseFilePipe + MaxFileSizeValidator); si este límite fuera menor,
      // multer rechazaría archivos de 20-25MB antes de llegar al validator,
      // con un error distinto al esperado.
      limits: { fileSize: 25 * 1024 * 1024 },
    };
  }
}
