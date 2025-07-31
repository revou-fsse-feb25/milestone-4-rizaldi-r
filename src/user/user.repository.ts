import { Injectable } from '@nestjs/common';
// import { PrismaService } from 'src/prisma/prisma.service';
import { PrismaService } from '../prisma/prisma.service';
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

  async findById(id: number): Promise<User | null> {
    // if (id === undefined || id === null) {
    //   throw new BadRequestException('User ID cannot be undefined or null.');
    // }
    const foundUser = await this.prisma.user.findUnique({
      where: { id },
    });
    return foundUser;
  }

  async findByUsername(username: string): Promise<User | null> {
    const foundUser = await this.prisma.user.findUnique({
      where: { username },
    });
    return foundUser;
  }

  async findByEmail(email: string): Promise<User | null> {
    const foundUser = await this.prisma.user.findUnique({
      where: { email },
    });
    return foundUser;
  }

  async create(createData: createParam): Promise<User> {
    return await this.prisma.user.create({
      data: createData,
    });
  }

  async update(id: number, userInput: updateParam): Promise<User | null> {
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        ...userInput,
      },
    });
    return updatedUser;
  }
}
