import { FilesController } from '../files/files.controller';
import { MulterConfigService } from './multer.config';
import { MulterModule } from '@nestjs/platform-express';
import { Module } from '@nestjs/common';
import { FilesService } from '../files/files.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { File } from '../files/files.entity';
@Module({
  imports: [
    TypeOrmModule.forFeature([File]),
    MulterModule.registerAsync({ useClass: MulterConfigService }),
  ],
  controllers: [FilesController],
  providers: [FilesService],
})
export class UploadsModule {}
