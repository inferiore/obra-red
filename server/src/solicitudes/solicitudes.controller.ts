import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { SolicitudesService } from './solicitudes.service';
import { CreateSolicitudDto } from './dto/create-solicitud.dto';
import { UpdateEstadoDto } from './dto/update-estado.dto';
import { UpdateSolicitudDto } from './dto/update-solicitud.dto';
import { SubirEvidenciasDto } from './dto/subir-evidencias.dto';
import { SubirEvidenciaDisputaDto } from './dto/subir-evidencia-disputa.dto';
import { SolicitarCorreccionDto } from './dto/solicitar-correccion.dto';
import { AbrirDisputaDto } from './dto/abrir-disputa.dto';
import { ResolverDisputaDto } from './dto/resolver-disputa.dto';

@UseGuards(JwtAuthGuard)
@Controller('solicitudes')
export class SolicitudesController {
  constructor(private readonly solicitudesService: SolicitudesService) {}

  @Get()
  findAll() {
    return this.solicitudesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.solicitudesService.findOne(id);
  }

  @Post()
  crear(@Body() dto: CreateSolicitudDto, @Req() req: { user: JwtPayload }) {
    return this.solicitudesService.crear(dto, {
      username: req.user.username,
      name: req.user.name,
    });
  }

  @Patch(':id/estado')
  actualizarEstado(@Param('id') id: string, @Body() dto: UpdateEstadoDto) {
    return this.solicitudesService.actualizarEstado(id, dto);
  }

  @Patch(':id/')
  actualizar(@Param('id') id: string, @Body() dto: UpdateSolicitudDto) {
    return this.solicitudesService.actualizar(id, dto);
  }

  @Patch(':id/evidencias')
  subirEvidencias(
    @Param('id') id: string,
    @Body() dto: SubirEvidenciasDto,
    @Req() req: { user: JwtPayload },
  ) {
    return this.solicitudesService.subirEvidencias(id, dto, req.user.username);
  }

  @Patch(':id/evidencia-disputa')
  subirEvidenciaDisputa(
    @Param('id') id: string,
    @Body() dto: SubirEvidenciaDisputaDto,
    @Req() req: { user: JwtPayload },
  ) {
    return this.solicitudesService.subirEvidenciaDisputa(
      id,
      dto.fotos,
      req.user.username,
    );
  }

  @Patch(':id/solicitar-correccion')
  solicitarCorreccion(
    @Param('id') id: string,
    @Body() dto: SolicitarCorreccionDto,
    @Req() req: { user: JwtPayload },
  ) {
    return this.solicitudesService.solicitarCorreccion(id, dto, req.user.username);
  }

  @Patch(':id/abrir-disputa')
  abrirDisputa(
    @Param('id') id: string,
    @Body() dto: AbrirDisputaDto,
    @Req() req: { user: JwtPayload },
  ) {
    return this.solicitudesService.abrirDisputa(id, dto, req.user.username);
  }

  @Patch(':id/resolver-disputa')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  resolverDisputa(@Param('id') id: string, @Body() dto: ResolverDisputaDto) {
    return this.solicitudesService.resolverDisputa(id, dto.estado);
  }

  @Delete(':id')
  eliminar(@Param('id') id: string) {
    return this.solicitudesService.eliminar(id);
  }
}
