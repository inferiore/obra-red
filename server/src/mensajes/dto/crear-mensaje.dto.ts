import { IsString, MaxLength, MinLength } from 'class-validator';

export class CrearMensajeDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  contenido: string;
}
