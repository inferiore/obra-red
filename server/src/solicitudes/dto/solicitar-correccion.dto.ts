import { IsString, MinLength } from 'class-validator';

export class SolicitarCorreccionDto {
  @IsString()
  @MinLength(10)
  comentario: string;
}
