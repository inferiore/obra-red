import { IsIn, IsOptional, IsString } from 'class-validator';
import type { SolicitudEstado } from '../solicitud.entity';

export class UpdateEstadoDto {
  @IsIn(['borrador', 'publicado', 'ejecucion', 'revision', 'corrigiendo', 'finalizado'])
  estado: SolicitudEstado;

  @IsOptional()
  @IsString()
  trabajadorUsername?: string;
}
