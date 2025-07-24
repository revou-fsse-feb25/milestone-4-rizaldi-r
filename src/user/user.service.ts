import { Injectable } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { UpdateUserDto } from './dto/update-user.dto';
import { hashPassword } from 'src/_common/utils/password-hashing';
import { ItfUserService } from './types/user.service.inteface';

@Injectable()
export class UserService implements ItfUserService {
  constructor(private readonly userRepository: UserRepository) {}

  findAll() {
    return this.userRepository.findAll();
  }

  findById(id: number) {
    return this.userRepository.findById(id);
  }

  findByEmail(email: string) {
    return this.userRepository.findByEmail(email);
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    // hash password
    let hashedPassword = '';
    if (updateUserDto.password)
      hashedPassword = await hashPassword(updateUserDto.password);

    // add hashed password
    const modifiedUserData = { ...updateUserDto, password: hashedPassword };
    return this.userRepository.update(id, modifiedUserData);
  }
}
