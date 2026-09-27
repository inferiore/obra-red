import { IsIn } from 'class-validator';

export class ResolverDisputaDto {
  @IsIn(['ejecucion', 'finalizado'])
  estado: 'ejecucion' | 'finalizado';
}
