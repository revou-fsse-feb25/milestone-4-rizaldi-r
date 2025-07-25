import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { User } from '@prisma/client';
import {
  createParam,
  updateParam,
  UserRepositoryItf,
} from './types/user.repository.interface';

@Injectable()
export class UserRepository implements UserRepositoryItf {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<User[]> {
    return await this.prisma.user.findMany();
  }

  async findById(id: number): Promise<User> {
    const foundUser = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!foundUser) throw new NotFoundException(`User with ID ${id} not found`);
    return foundUser;
  }

  async findByEmail(email: string): Promise<User | null> {
    const foundUser = await this.prisma.user.findUnique({
      where: { email },
    });
    // if (!foundUser)
    //   throw new NotFoundException(`User with Email ${email} not found`);
    return foundUser;
  }

  // TODO: update interface
  async create(createData: createParam): Promise<User> {
    return await this.prisma.user.create({
      data: createData,
    });
  }

  async update(id: number, userInput: updateParam): Promise<User> {
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        ...userInput,
      },
    });
    return updatedUser;
  }
}
