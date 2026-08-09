import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { User } from '../users/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

const toPublicUser = ({ passwordHash: _passwordHash, ...rest }: User) => rest;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  private signFor(user: User) {
    const token = this.jwtService.sign({
      sub: user.id,
      username: user.username,
      role: user.role,
      name: user.name,
    });
    return { token, user: toPublicUser(user) };
  }

  async register(dto: RegisterDto) {
    const username = dto.username.trim().toLowerCase();
    const existing = await this.usersService.findByUsername(username);
    if (existing) throw new ConflictException('El nombre de usuario ya está en uso');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.create({ ...dto, username, passwordHash });
    return this.signFor(user);
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByUsername(dto.username.trim().toLowerCase());
    if (!user) throw new UnauthorizedException('Credenciales incorrectas');
    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Credenciales incorrectas');
    return this.signFor(user);
  }

  async me(username: string) {
    const user = await this.usersService.findByUsername(username);
    if (!user) throw new UnauthorizedException();
    return toPublicUser(user);
  }
}
