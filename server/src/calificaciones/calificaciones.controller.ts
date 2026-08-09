import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { CalificacionesService } from './calificaciones.service';
import { CreateCalificacionDto } from './dto/create-calificacion.dto';

@UseGuards(JwtAuthGuard)
@Controller('calificaciones')
export class CalificacionesController {
  constructor(private readonly calificacionesService: CalificacionesService) {}

  @Get()
  findByTrabajador(@Query('trabajadorUsername') trabajadorUsername: string) {
    return this.calificacionesService.findByTrabajador(trabajadorUsername);
  }

  @Post()
  crear(@Body() dto: CreateCalificacionDto, @Req() req: { user: JwtPayload }) {
    return this.calificacionesService.crear(dto, req.user.username);
  }
}
