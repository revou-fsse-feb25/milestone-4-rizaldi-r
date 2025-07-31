import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { UserRepository } from './user.repository';
import { UpdateUserDto } from './dto/req/update-user.dto';
// import { hashPassword } from 'src/_common/utils/password-hashing';
import { hashPassword } from '../_common/utils/password-hashing';
import { ItfUserService } from './types/user.service.inteface';
import { ResourceNotFoundException } from '../_common/exceptions/custom-not-found.exception';
import { User, UserRole } from '@prisma/client';

@Injectable()
export class UserService implements ItfUserService {
  constructor(private readonly userRepository: UserRepository) {}

  async findAll(): Promise<User[]> {
    return await this.userRepository.findAll();
  }

  async findById(id: number): Promise<User> {
    if (id === undefined || id === null) {
      throw new BadRequestException('User ID cannot be undefined or null.');
    }
    const user = await this.userRepository.findById(id);
    if (!user) throw new ResourceNotFoundException('User', 'id', id);
    return user;
  }

  async update(
    id: number,
    updateUserDto: UpdateUserDto & { userRole?: UserRole },
  ): Promise<User> {
    // check if user exist
    await this.findById(id);

    // filter out userRole for extra safety
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { userRole, password, email, username, ...otherData } = updateUserDto;

    // check if email and username already exist
    if (email) {
      const existingEmail = await this.userRepository.findByEmail(email);
      if (existingEmail)
        throw new ConflictException('Email already registered');
    }
    if (username) {
      const existingUsername =
        await this.userRepository.findByUsername(username);
      if (existingUsername)
        throw new ConflictException('Username already exist');
    }

    // hash password
    let passwordHash: string | undefined;
    if (password) {
      passwordHash = await hashPassword(password);
    }

    // add paswordHash if exist
    const modifiedUserData = {
      ...otherData,
      ...(passwordHash && { passwordHash }),
    };

    // update db
    const updatedUser = await this.userRepository.update(id, modifiedUserData);
    if (!updatedUser) {
      throw new InternalServerErrorException(
        `Failed to update user with ID ${id} unexpectedly.`,
      );
    }

    return updatedUser;
  }
}
