import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';

import { LoginDto } from './dto/login.dto';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@prisma/client';
import { PayloadDto } from '../_common/res/payload.dto';
import {
  comparePassword,
  hashPassword,
} from '../_common/utils/password-hashing';
import { UserRepository } from '../user/user.repository';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private userRepository: UserRepository,
  ) {}

  check() {
    return { message: 'Hello API' };
  }

  private async generateToken(payload: PayloadDto) {
    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: this.configService.get<string>(
          'JWT_EXPIRATION_ACCESS',
          '15m',
        ),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: this.configService.get<string>(
          'JWT_EXPIRATION_REFRESH',
          '7d',
        ),
      }),
    ]);

    return { access_token, refresh_token };
  }

  async refresh(userId: number) {
    // find user from db
    const foundUser = await this.userRepository.findById(userId);
    if (!foundUser) throw new UnauthorizedException('User not found');

    // Generate JWT token
    const tokens = await this.generateToken({
      id: foundUser.id,
      email: foundUser.email,
      userRole: foundUser.userRole,
    });
    return tokens;
  }

  async register(registerDto: RegisterDto) {
    const { password, ...otherData } = registerDto;

    // Check if user already exists
    const foundUser = await this.userRepository.findByEmail(otherData.email);
    if (foundUser) {
      throw new ConflictException('Email already registered');
    }

    // Hash the password
    const hashedPassword = await hashPassword(password);

    // Create the user in db
    const user = await this.userRepository.create({
      ...otherData,
      passwordHash: hashedPassword,
      userRole: UserRole.CUSTOMER,
    });

    // generate token
    const tokens = await this.generateToken({
      id: user.id,
      email: user.email,
      userRole: user.userRole,
    });

    // Update refresh token in db
    await this.userRepository.update(user.id, {
      lastLogin: new Date(),
      refreshToken: tokens.refresh_token,
    });

    // Remove password from response
    return {
      message: 'User registered successfully',
      code: 201,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        tokens,
      },
    };
  }

  async login(
    loginDto: LoginDto,
  ): Promise<{ access_token: string; refresh_token: string }> {
    const { email, password } = loginDto;

    // Find the user
    const foundUser = await this.userRepository.findByEmail(email);
    if (!foundUser) throw new UnauthorizedException('Email not registered');

    // Verify password
    const hashedPassword = foundUser.passwordHash;
    if (!hashedPassword)
      throw new UnauthorizedException('Account has no password set.');

    // Compare password
    const isPasswordValid = await comparePassword(password, hashedPassword);
    if (!isPasswordValid) throw new UnauthorizedException('Invalid Credential');

    // Generate JWT token
    const tokens = await this.generateToken({
      id: foundUser.id,
      email: foundUser.email,
      userRole: foundUser.userRole,
    });

    // Update db
    await this.userRepository.update(foundUser.id, {
      lastLogin: new Date(),
      refreshToken: tokens.refresh_token,
    });
    return tokens;
  }
}
