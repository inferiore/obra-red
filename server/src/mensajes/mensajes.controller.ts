import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { MensajesService } from './mensajes.service';
import { CrearMensajeDto } from './dto/crear-mensaje.dto';

@UseGuards(JwtAuthGuard)
@Controller()
export class MensajesController {
  constructor(private readonly mensajesService: MensajesService) {}

  @Get('solicitudes/:id/mensajes')
  findBySolicitud(@Param('id') id: string, @Req() req: { user: JwtPayload }) {
    return this.mensajesService.findBySolicitud(id, req.user.username, req.user.role);
  }

  @Post('solicitudes/:id/mensajes')
  crear(
    @Param('id') id: string,
    @Body() dto: CrearMensajeDto,
    @Req() req: { user: JwtPayload },
  ) {
    return this.mensajesService.crear(id, dto.contenido, req.user.username, req.user.role);
  }

  @Get('mensajes/conversaciones')
  findConversaciones(@Req() req: { user: JwtPayload }) {
    return this.mensajesService.findConversaciones(req.user.username);
  }
}
