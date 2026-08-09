import { ArrayMinSize, IsArray, IsOptional, IsString } from 'class-validator';

export class SubirEvidenciasDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  antes?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  durante?: string[];

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  despues: string[];

  @IsOptional()
  @IsString()
  nota?: string;
}
