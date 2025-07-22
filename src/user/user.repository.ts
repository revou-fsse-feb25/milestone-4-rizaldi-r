import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRepositoryItf } from './user.repository.interface';
import { PrismaService } from 'prisma/prisma.service';
import { User } from '@prisma/client';

@Injectable()
export class UserRepository implements UserRepositoryItf {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: number): Promise<User | null> {
    const foundUser = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!foundUser) throw new NotFoundException(`User with ID ${id} not found`);
    return foundUser;
    // return this.users.find((user) => user.id === id) || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const foundUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (!foundUser)
      throw new NotFoundException(`User with Email ${email} not found`);
    return foundUser;
  }

  // async update(id: string, updatedUser: User): Promise<User> {
  //   const index = this.users.findIndex((user) => user.id === id);
  //   if (index !== -1) {
  //     this.users[index] = updatedUser;
  //     return updatedUser;
  //   }
  //   return null;
  // }
}
