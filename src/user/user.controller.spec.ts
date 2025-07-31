import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/role.guard';
import { BodyTransformerInterceptor } from 'src/_common/interceptors/body-transformer.interceptor';
import { User, UserRole } from '@prisma/client';
import { UpdateUserDto } from './dto/req/update-user.dto';
import { NotFoundException, CallHandler } from '@nestjs/common';

// Mock the UserService
const mockUserService = {
  findAll: jest.fn(),
  findById: jest.fn(),
  update: jest.fn(),
};

// Mock the guards and interceptor
const mockJwtAuthGuard = { canActivate: jest.fn(() => true) };
const mockRolesGuard = { canActivate: jest.fn(() => true) };
const mockBodyTransformerInterceptor = {
  intercept: jest.fn((context, next: CallHandler) => next.handle()),
};

// Define a mock user
const mockUser: User = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  passwordHash: 'hashedpassword',
  firstName: 'Test',
  lastName: 'User',
  userRole: UserRole.CUSTOMER,
  refreshToken: null,
  lastLogin: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Define a mock admin user
const mockAdminUser: User = {
  ...mockUser,
  id: 99,
  username: 'adminuser',
  email: 'admin@example.com',
  userRole: UserRole.ADMIN,
};

describe('UserController', () => {
  let controller: UserController;
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .overrideGuard(RolesGuard)
      .useValue(mockRolesGuard)
      .overrideInterceptor(BodyTransformerInterceptor)
      .useValue(mockBodyTransformerInterceptor)
      .compile();

    controller = module.get<UserController>(UserController);
    service = module.get<UserService>(UserService);
  });

  afterEach(() => {
    // Reset all mock after each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  describe('findAll (Admin only)', () => {
    it('should return all users for an admin', async () => {
      const expectedUsers: User[] = [mockUser, mockAdminUser];
      mockUserService.findAll.mockResolvedValue(expectedUsers);

      const result = await controller.findAll();
      expect(result).toEqual(expectedUsers);
      expect(mockUserService.findAll).toHaveBeenCalledTimes(1);
    });

    it('should return an empty array if no users exist for admin', async () => {
      mockUserService.findAll.mockResolvedValue([]);

      const result = await controller.findAll();
      expect(result).toEqual([]);
      expect(mockUserService.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('getProfile', () => {
    it('should return the profile of the current user', async () => {
      mockUserService.findById.mockResolvedValue(mockUser);

      const result = await controller.getProfile(mockUser);
      expect(result).toEqual(mockUser);
      expect(mockUserService.findById).toHaveBeenCalledWith(mockUser.id);
    });

    it('should throw NotFoundException if user profile not found', async () => {
      mockUserService.findById.mockRejectedValue(
        new NotFoundException('User profile not found.'),
      );

      await expect(controller.getProfile(mockUser)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockUserService.findById).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('update', () => {
    it('should update the profile of the current user', async () => {
      const updateDto: UpdateUserDto = {
        firstName: 'Updated',
        lastName: 'User',
      };
      const updatedUser: User = { ...mockUser, ...updateDto };
      mockUserService.update.mockResolvedValue(updatedUser);

      const result = await controller.update(mockUser, updateDto);
      expect(result).toEqual(updatedUser);
      expect(mockUserService.update).toHaveBeenCalledWith(
        mockUser.id,
        updateDto,
      );
    });

    it('should throw NotFoundException if user to update not found', async () => {
      const updateDto: UpdateUserDto = {
        firstName: 'Non Existent',
        lastName: 'Non Existent',
      };
      mockUserService.update.mockRejectedValue(
        new NotFoundException('User not found for update.'),
      );
      mockJwtAuthGuard.canActivate.mockReturnValue(true);
      mockBodyTransformerInterceptor.intercept.mockImplementation(
        (context, next) => next.handle(),
      );

      await expect(controller.update(mockUser, updateDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockUserService.update).toHaveBeenCalledWith(
        mockUser.id,
        updateDto,
      );
    });

    it('should throw an error if service fails to update user', async () => {
      const updateDto: UpdateUserDto = {
        firstName: 'Failed Update',
        lastName: 'Failed Update',
      };
      mockUserService.update.mockRejectedValue(
        new Error('Database error during update'),
      );
      mockJwtAuthGuard.canActivate.mockReturnValue(true);
      mockBodyTransformerInterceptor.intercept.mockImplementation(
        (context, next) => next.handle(),
      );

      await expect(controller.update(mockUser, updateDto)).rejects.toThrow(
        'Database error during update',
      );
      expect(mockUserService.update).toHaveBeenCalledWith(
        mockUser.id,
        updateDto,
      );
    });
  });
});
