import { IsIn } from 'class-validator';

export class ResolverDisputaDto {
  @IsIn(['reanudar', 'trabajador', 'cliente', 'mitad'])
  resolucion: 'reanudar' | 'trabajador' | 'cliente' | 'mitad';
}
