import { IsArray, IsIn, IsInt, IsOptional, IsString, MinLength } from 'class-validator';
import type { UserRole } from '../../users/user.entity';

export class RegisterDto {
  @IsString()
  @MinLength(3)
  username: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @MinLength(1)
  name: string;

  @IsIn(['cliente', 'trabajador', 'admin'])
  role: UserRole;

  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsString() telefono?: string;
  @IsOptional() @IsString() documento?: string;

  // Cliente
  @IsOptional() @IsIn(['natural', 'empresa']) tipoCliente?: 'natural' | 'empresa';
  @IsOptional() @IsString() razonSocial?: string;
  @IsOptional() @IsString() nit?: string;
  @IsOptional() @IsString() direccion?: string;
  @IsOptional() @IsString() barrio?: string;

  // Trabajador
  @IsOptional() @IsString() especialidad?: string;
  @IsOptional() @IsArray() especialidadesExtra?: string[];
  @IsOptional() @IsInt() experiencia?: number;
  @IsOptional() @IsString() descripcionProfesional?: string;
  @IsOptional() @IsArray() zonasCobertura?: string[];
}
