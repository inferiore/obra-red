import { IsDateString, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateOfertaDto {
  @IsString()
  solicitudId: string;

  @IsInt()
  @Min(1)
  precio: number;

  @IsString()
  mensaje: string;

  @IsDateString()
  fechaInicio: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  tiempoEstimadoDias?: number;
}
