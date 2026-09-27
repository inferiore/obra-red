import { Controller, Get, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { NotificacionesService } from './notificaciones.service';

@UseGuards(JwtAuthGuard)
@Controller('notificaciones')
export class NotificacionesController {
  constructor(private readonly notificacionesService: NotificacionesService) {}

  @Get()
  findMine(@Req() req: { user: JwtPayload }) {
    return this.notificacionesService.findMine(req.user.username);
  }

  @Patch(':id/leer')
  marcarLeida(@Param('id') id: string, @Req() req: { user: JwtPayload }) {
    return this.notificacionesService.marcarLeida(id, req.user.username);
  }
}
