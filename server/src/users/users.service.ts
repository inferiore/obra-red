import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
  ) {}

  findByUsername(username: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { username } });
  }

  async findByUsernames(usernames: string[]): Promise<Map<string, User>> {
    if (usernames.length === 0) return new Map();
    const users = await this.usersRepo
      .createQueryBuilder('u')
      .where('u.username IN (:...usernames)', { usernames })
      .getMany();
    return new Map(users.map((u) => [u.username, u]));
  }

  create(data: Partial<User>): Promise<User> {
    const user = this.usersRepo.create(data);
    return this.usersRepo.save(user);
  }

  async updateProfile(
    username: string,
    data: { name?: string; email?: string; telefono?: string; direccion?: string },
  ): Promise<User> {
    const user = await this.findByUsername(username);
    if (!user) throw new NotFoundException('Usuario no encontrado');
    Object.assign(user, data);
    return this.usersRepo.save(user);
  }
}
