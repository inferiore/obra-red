import { IsString, MinLength } from 'class-validator';

export class AbrirDisputaDto {
  @IsString()
  @MinLength(10)
  comentario: string;
}
