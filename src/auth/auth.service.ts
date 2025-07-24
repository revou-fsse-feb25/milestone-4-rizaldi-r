import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  comparePassword,
  hashPassword,
} from 'src/_common/utils/password-hashing';
import { LoginDto } from './dto/login.dto';
import { PayloadDto } from 'src/_common/res/payload.dto';
import { ConfigService } from '@nestjs/config';

// TODO: create AuthRepository
@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  check() {
    return { message: 'Hello API' };
  }

  private async generateToken(payload: PayloadDto) {
    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(payload, {
        // secret: process.env.JWT_SECRET,
        secret: this.configService.get<string>('JWT_SECRET'),
        // TODO: set to 15m
        expiresIn: this.configService.get<string>('JWT_EXPIRATION', '1d'),
      }),
      this.jwtService.signAsync(payload, {
        // secret: process.env.JWT_SECRET,
        secret: this.configService.get<string>('JWT_SECRET'),
        // expiresIn: '7d',
        expiresIn: this.configService.get<string>('JWT_EXPIRATION', '7d'),
      }),
    ]);

    return { access_token, refresh_token };
  }

  async refresh(userId: number) {
    // find user from db
    const foundUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });
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
    const { username, email, password, firstName, lastName } = registerDto;

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    // Check if user already exists
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Hash the password
    const hashedPassword = await hashPassword(password);

    // Create the user
    // TODO: move this to user repo
    const user = await this.prisma.user.create({
      data: {
        username,
        email,
        passwordHash: hashedPassword,
        firstName,
        lastName,
        userRole: 'CUSTOMER',
      },
    });

    // Remove password from response
    return {
      message: 'User registered successfully',
      code: 201,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    };
  }

  async login(
    loginDto: LoginDto,
  ): Promise<{ access_token: string; refresh_token: string }> {
    const { email, password } = loginDto;
    // const payload = { email, password };

    // Find the user
    const foundUser = await this.prisma.user.findUnique({ where: { email } });
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
    // TODO: move this to user repo
    await this.prisma.user.update({
      where: { id: foundUser.id },
      data: {
        lastLogin: new Date(),
        refreshToken: tokens.refresh_token,
      },
    });
    return tokens;
  }
}
