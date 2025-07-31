import { User } from '@prisma/client';
import { UpdateUserDto } from '../dto/req/update-user.dto';

export interface ItfUserService {
  findAll(): Promise<User[]>;
  findById(id: number): Promise<User>;
  update(id: number, updateUserDto: UpdateUserDto): Promise<User>;
}
