import {
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import type { SolicitudEstado, TipoTrabajo } from '../solicitud.entity';

const TIPOS: TipoTrabajo[] = [
  'albanileria',
  'plomeria',
  'electricidad',
  'carpinteria',
  'pintura',
  'soldadura',
  'techado',
  'demolicion',
  'yeso',
  'otro',
];

export class UpdateSolicitudDto {
  @IsString()
  id: string;

  @IsIn(TIPOS)
  tipo: TipoTrabajo;

  @IsString()
  descripcion: string;

  @IsInt()
  @Min(1)
  presupuesto: number;

  @IsString()
  ubicacion: string;

  @IsOptional()
  @IsArray()
  fotos?: string[];

  @IsIn(['borrador', 'publicado'])
  estado?: SolicitudEstado;
}
