import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  ParseFilePipe,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesService } from './files.service';
import { FilesInterceptor } from '@nestjs/platform-express';

// Tipos permitidos para fotos (object: "solicitud") y foto+video (object: "correccion").
const ALLOWED_FILE_TYPES =
  /^(image\/(jpeg|png|webp)|video\/(mp4|quicktime|webm))$/;
// Límite único de 25MB para todos los archivos (fotos y video), por simplicidad.
const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

// Exportado para poder testear la validación de archivos de forma aislada.
export const filesUploadValidators = () => [
  new FileTypeValidator({
    fileType: ALLOWED_FILE_TYPES,
    // multer usa diskStorage (ver uploads/multer.config.ts): el archivo no
    // llega con `buffer`, así que no se puede inspeccionar el magic number;
    // sin este flag, FileTypeValidator rechazaría siempre el archivo.
    fallbackToMimetype: true,
  }),
  new MaxFileSizeValidator({ maxSize: MAX_FILE_SIZE_BYTES }),
];

@Controller('files')
export class FilesController {
  constructor(private readonly fileService: FilesService) {}
  @Get()
  list(@Query('object') object: string, @Query('objectId') objectId: string) {
    return this.fileService.find(object, objectId);
  }

  @Post()
  @UseInterceptors(FilesInterceptor('files', 5))
  async store(
    @UploadedFiles(new ParseFilePipe({ validators: filesUploadValidators() }))
    files: Express.Multer.File[],
    @Body('object') object: string,
    @Body('objectId') objectId: string,
  ) {
    await this.fileService.store(object, objectId, files);
    return { path: files.map((f) => `/uploads/${f.filename}`) };
  }

  @Delete()
  async delete(@Body('ids') ids: Array<string>) {
    await this.fileService.delete(ids);
  }
}
