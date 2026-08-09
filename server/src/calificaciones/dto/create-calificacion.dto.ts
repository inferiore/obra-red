import { IsArray, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateCalificacionDto {
  @IsString()
  solicitudId: string;

  @IsInt()
  @Min(1)
  @Max(5)
  estrellas: number;

  @IsOptional()
  @IsString()
  comentario?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  etiquetas?: string[];
}
