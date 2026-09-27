import {
  Body,
  Controller,
  Delete,
  Get,
  ParseFilePipe,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesService } from './files.service';
import { FilesInterceptor } from '@nestjs/platform-express';

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
    @UploadedFiles(new ParseFilePipe({ validators: [] }))
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
