import { Body, Controller, Get, NotFoundException, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JwtPayload } from '../auth/jwt-payload.interface';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { User } from './user.entity';

const toPublicUser = ({ passwordHash: _passwordHash, ...rest }: User) => rest;

const toPublicProfile = (user: User) => ({
  username: user.username,
  name: user.name,
  role: user.role,
  fotoUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}`,
  especialidad: user.especialidad ?? null,
  especialidadesExtra: user.especialidadesExtra ?? [],
  experiencia: user.experiencia ?? null,
  descripcionProfesional: user.descripcionProfesional ?? null,
  zonasCobertura: user.zonasCobertura ?? [],
  calificacion: user.calificacion,
  trabajosCompletados: user.trabajosCompletados,
  verificado: user.verificado,
});

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Patch('me')
  async updateMe(@Req() req: { user: JwtPayload }, @Body() dto: UpdateProfileDto) {
    const user = await this.usersService.updateProfile(req.user.username, dto);
    return toPublicUser(user);
  }

  @Get(':username')
  async findPublicProfile(@Param('username') username: string) {
    const user = await this.usersService.findByUsername(username);
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return toPublicProfile(user);
  }
}
