import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { OfertasService } from './ofertas.service';
import { CreateOfertaDto } from './dto/create-oferta.dto';

@UseGuards(JwtAuthGuard)
@Controller('ofertas')
export class OfertasController {
  constructor(private readonly ofertasService: OfertasService) {}

  @Get()
  findBySolicitud(@Query('solicitudId') solicitudId: string) {
    return this.ofertasService.findBySolicitud(solicitudId);
  }

  @Post()
  crear(@Body() dto: CreateOfertaDto, @Req() req: { user: JwtPayload }) {
    return this.ofertasService.crear(dto, req.user.username);
  }

  @Patch(':id/aceptar')
  aceptar(@Param('id') id: string) {
    return this.ofertasService.aceptar(id);
  }
}
