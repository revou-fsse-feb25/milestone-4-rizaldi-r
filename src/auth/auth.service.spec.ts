import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
// import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  // let userService: UserService;
  let jwtService: JwtService;

  const mockUserService = {
    findByEmail: jest.fn(),
    create: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        // { provide: UserService, useValue: mockUserService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    // userService = module.get<UserService>(UserService);
    jwtService = module.get<JwtService>(JwtService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      // Arrange
      const registerDto = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };
      const hashedPassword = 'hashedPassword';
      const createdUser = {
        id: '1',
        email: registerDto.email,
        name: registerDto.name,
        password: hashedPassword,
      };

      mockUserService.findByEmail.mockResolvedValue(null);
      mockUserService.create.mockResolvedValue(createdUser);
      jest.spyOn(bcrypt, 'hash').mockImplementation(() => Promise.resolve(hashedPassword));

      // Act
      const result = await service.register(registerDto);

      // Assert
      expect(mockUserService.findByEmail).toHaveBeenCalledWith(registerDto.email);
      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);
      expect(mockUserService.create).toHaveBeenCalledWith({
        ...registerDto,
        password: hashedPassword,
      });
      expect(result).toEqual({
        id: '1',
        email: registerDto.email,
        name: registerDto.name,
      });
    });

    it('should throw ConflictException if user already exists', async () => {
      // Arrange
      const registerDto = {
        email: 'existing@example.com',
        password: 'password123',
      };
      mockUserService.findByEmail.mockResolvedValue({ id: '1', email: registerDto.email });

      // Act & Assert
      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
      expect(mockUserService.findByEmail).toHaveBeenCalledWith(registerDto.email);
      expect(mockUserService.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should return a JWT token when login is successful', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'password123';
      const user = {
        id: '1',
        email,
        name: 'Test User',
        password: 'hashedPassword',
      };
      const token = 'jwt-token';

      mockUserService.findByEmail.mockResolvedValue(user);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));
      mockJwtService.sign.mockReturnValue(token);

      // Act
      const result = await service.login(email, password);

      // Assert
      expect(mockUserService.findByEmail).toHaveBeenCalledWith(email);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, user.password);
      expect(mockJwtService.sign).toHaveBeenCalledWith({ sub: user.id, email: user.email });
      expect(result).toEqual({
        access_token: token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      // Arrange
      const email = 'nonexistent@example.com';
      const password = 'password123';
      mockUserService.findByEmail.mockResolvedValue(null);

      // Act & Assert
      await expect(service.login(email, password)).rejects.toThrow(UnauthorizedException);
      expect(mockUserService.findByEmail).toHaveBeenCalledWith(email);
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'wrongpassword';
      const user = {
        id: '1',
        email,
        password: 'hashedPassword',
      };

      mockUserService.findByEmail.mockResolvedValue(user);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(false));

      // Act & Assert
      await expect(service.login(email, password)).rejects.toThrow(UnauthorizedException);
      expect(mockUserService.findByEmail).toHaveBeenCalledWith(email);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, user.password);
    });
  });
});