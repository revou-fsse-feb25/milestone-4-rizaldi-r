import { User } from '@prisma/client';
import { UpdateUserDto } from '../dto/update-user.dto';

export interface ItfUserService {
  findAll(): Promise<User[]>;
  findById(id: number): Promise<User>;
  findByEmail(email: string): Promise<User>;
  update(id: number, updateUserDto: UpdateUserDto): Promise<User>;
}
