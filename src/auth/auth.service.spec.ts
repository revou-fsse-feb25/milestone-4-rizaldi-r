import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserRepository } from '../user/user.repository';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserRole } from '@prisma/client';

interface RegisterResponse {
  message: string;
  code: number;
  data: RegisterResponseData;
}

interface RegisterResponseData {
  id: number;
  username: string;
  email: string;
  tokens: {
    access_token: string;
    refresh_token: string;
  };
}

// Mock the password-hashing utils
jest.mock('src/_common/utils/password-hashing', () => ({
  hashPassword: jest.fn((password) => Promise.resolve(`hashed_${password}`)),
  comparePassword: jest.fn((password, hashedPassword: string) =>
    Promise.resolve(password === hashedPassword.replace('hashed_', '')),
  ),
}));

// Import the mocked functions
import {
  hashPassword,
  comparePassword,
} from 'src/_common/utils/password-hashing';

describe('AuthService', () => {
  let authService: AuthService;
  let jwtService: JwtService;
  let configService: ConfigService;
  let userRepository: UserRepository;

  const mockJwtService = {
    signAsync: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'JWT_SECRET') return 'test_secret';
      if (key === 'JWT_EXPIRATION_ACCESS') return '15m';
      if (key === 'JWT_EXPIRATION_REFRESH') return '7d';
      return null;
    }),
  };

  const mockUserRepository = {
    findById: jest.fn(),
    findByEmail: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: UserRepository,
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
    userRepository = module.get<UserRepository>(UserRepository);
  });

  // clear mock after each test
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
    expect(jwtService).toBeDefined();
    expect(configService).toBeDefined();
    expect(userRepository).toBeDefined();
  });

  describe('check', () => {
    it('should return a simple message', () => {
      const result = authService.check();
      expect(result).toEqual({ message: 'Hello API' });
    });
  });

  describe('refresh', () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      userRole: UserRole.CUSTOMER,
      passwordHash: 'hashed_password',
      username: 'testuser',
      firstName: 'Test',
      lastName: 'User',
      lastLogin: new Date(),
      refreshToken: 'old_refresh_token',
    };
    const mockTokens = {
      access_token: 'new_access',
      refresh_token: 'new_refresh',
    };

    it('should successfully refresh tokens for an existing user', async () => {
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockJwtService.signAsync.mockResolvedValueOnce(mockTokens.access_token);
      mockJwtService.signAsync.mockResolvedValueOnce(mockTokens.refresh_token);

      const result = await authService.refresh(mockUser.id);

      expect(mockUserRepository.findById).toHaveBeenCalledWith(mockUser.id);
      expect(mockJwtService.signAsync).toHaveBeenCalledTimes(2);
      expect(result).toEqual(mockTokens);
    });

    it('should throw UnauthorizedException if user is not found', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(authService.refresh(1)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockUserRepository.findById).toHaveBeenCalledWith(1);
      expect(mockJwtService.signAsync).not.toHaveBeenCalled();
    });
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      username: 'newuser',
      email: 'new@example.com',
      password: 'password123',
      firstName: 'New',
      lastName: 'User',
    };
    const createdUser = {
      id: 2,
      email: registerDto.email,
      username: registerDto.username,
      passwordHash: 'hashed_password123',
      userRole: UserRole.CUSTOMER,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
    };
    const mockTokens = {
      access_token: 'reg_access',
      refresh_token: 'reg_refresh',
    };

    it('should successfully register a new user', async () => {
      const { password, ...otherData } = registerDto;

      mockUserRepository.findByEmail.mockResolvedValue(null);
      (hashPassword as jest.Mock).mockResolvedValue('hashed_password123');
      mockUserRepository.create.mockResolvedValue(createdUser);
      mockJwtService.signAsync.mockResolvedValueOnce(mockTokens.access_token);
      mockJwtService.signAsync.mockResolvedValueOnce(mockTokens.refresh_token);
      mockUserRepository.update.mockResolvedValue(true);

      const result = await authService.register(registerDto);

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        registerDto.email,
      );
      expect(hashPassword).toHaveBeenCalledWith(password);
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        ...otherData,
        passwordHash: 'hashed_password123',
        userRole: UserRole.CUSTOMER,
      });
      expect(mockJwtService.signAsync).toHaveBeenCalledTimes(2);
      expect(mockUserRepository.update).toHaveBeenCalledWith(
        createdUser.id,
        expect.any(Object),
      );
      expect(result).toEqual(
        expect.objectContaining<RegisterResponse>({
          message: 'User registered successfully',
          code: 201,
          data: {
            id: createdUser.id,
            email: createdUser.email,
            username: createdUser.username,
            tokens: mockTokens,
          },
        }),
      );
    });

    it('should throw ConflictException if email is already registered', async () => {
      // User exists
      mockUserRepository.findByEmail.mockResolvedValue({
        id: 1,
        email: registerDto.email,
      });

      await expect(authService.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        registerDto.email,
      );
      expect(hashPassword).not.toHaveBeenCalled();
      expect(mockUserRepository.create).not.toHaveBeenCalled();
      expect(mockJwtService.signAsync).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'login@example.com',
      password: 'correct_password',
    };
    const mockUser = {
      id: 3,
      email: loginDto.email,
      passwordHash: 'hashed_correct_password',
      userRole: UserRole.CUSTOMER,
      username: 'loginuser',
      firstName: 'Login',
      lastName: 'User',
      lastLogin: null,
      refreshToken: null,
    };
    const mockTokens = {
      access_token: 'login_access',
      refresh_token: 'login_refresh',
    };

    it('should successfully log in a user', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      (comparePassword as jest.Mock).mockResolvedValue(true);
      mockJwtService.signAsync.mockResolvedValueOnce(mockTokens.access_token);
      mockJwtService.signAsync.mockResolvedValueOnce(mockTokens.refresh_token);
      mockUserRepository.update.mockResolvedValue(true);

      const result = await authService.login(loginDto);

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        loginDto.email,
      );
      expect(comparePassword).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.passwordHash,
      );
      expect(mockJwtService.signAsync).toHaveBeenCalledTimes(2);
      expect(mockUserRepository.update).toHaveBeenCalledWith(
        mockUser.id,
        expect.any(Object),
      );
      expect(result).toEqual(mockTokens);
    });

    it('should throw UnauthorizedException if email is not registered', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);

      await expect(authService.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        loginDto.email,
      );
      expect(comparePassword).not.toHaveBeenCalled();
      expect(mockJwtService.signAsync).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if account has no password set', async () => {
      mockUserRepository.findByEmail.mockResolvedValue({
        ...mockUser,
        passwordHash: null,
      });

      await expect(authService.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        loginDto.email,
      );
      expect(comparePassword).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      // Password does not match
      (comparePassword as jest.Mock).mockResolvedValue(false);

      await expect(authService.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        loginDto.email,
      );
      expect(comparePassword).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.passwordHash,
      );
      expect(mockJwtService.signAsync).not.toHaveBeenCalled();
    });
  });
});
