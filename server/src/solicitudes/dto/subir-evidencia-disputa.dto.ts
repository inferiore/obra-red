import { ArrayMinSize, IsArray, IsString } from 'class-validator';

export class SubirEvidenciaDisputaDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  fotos: string[];
}
