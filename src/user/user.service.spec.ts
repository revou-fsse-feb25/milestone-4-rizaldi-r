import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { UserRepository } from './user.repository';
import { ResourceNotFoundException } from 'src/_common/exceptions/custom-not-found.exception';
import { InternalServerErrorException } from '@nestjs/common';
import { User, UserRole } from '@prisma/client';
import { UpdateUserDto } from './dto/req/update-user.dto';
import { hashPassword } from 'src/_common/utils/password-hashing';

// Mock the UserRepository
const mockUserRepository = {
  findAll: jest.fn(),
  findById: jest.fn(),
  update: jest.fn(),
};

// Mock the password hashing utility
jest.mock('src/_common/utils/password-hashing', () => ({
  hashPassword: jest.fn((password: string) =>
    Promise.resolve(`hashed_${password}`),
  ),
}));

// Define a mock user for testing
const mockUser: User = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  passwordHash: 'hashed_oldpassword',
  firstName: 'Test',
  lastName: 'User',
  userRole: UserRole.CUSTOMER,
  refreshToken: null,
  lastLogin: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockAdminUser: User = {
  id: 2,
  username: 'adminuser',
  email: 'admin@example.com',
  passwordHash: 'hashed_adminpassword',
  firstName: 'Admin',
  lastName: 'User',
  userRole: UserRole.ADMIN,
  refreshToken: null,
  lastLogin: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('UserService', () => {
  let service: UserService;
  let userRepository: UserRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: UserRepository,
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userRepository = module.get<UserRepository>(UserRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(userRepository).toBeDefined();
  });

  // --- findAll Tests ---
  describe('findAll', () => {
    it('should return an array of users', async () => {
      const expectedUsers = [mockUser, mockAdminUser];
      mockUserRepository.findAll.mockResolvedValue(expectedUsers);

      const result = await service.findAll();
      expect(result).toEqual(expectedUsers);
      expect(mockUserRepository.findAll).toHaveBeenCalledTimes(1);
    });

    it('should return an empty array if no users are found', async () => {
      mockUserRepository.findAll.mockResolvedValue([]);

      const result = await service.findAll();
      expect(result).toEqual([]);
      expect(mockUserRepository.findAll).toHaveBeenCalledTimes(1);
    });
  });

  // --- findById Tests ---
  describe('findById', () => {
    it('should return a user if found by ID', async () => {
      mockUserRepository.findById.mockResolvedValue(mockUser);

      const result = await service.findById(mockUser.id);
      expect(result).toEqual(mockUser);
      expect(mockUserRepository.findById).toHaveBeenCalledWith(mockUser.id);
    });

    it('should throw ResourceNotFoundException if user is not found', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(service.findById(999)).rejects.toThrow(
        ResourceNotFoundException,
      );
      await expect(service.findById(999)).rejects.toThrow(
        'User with id 999 not found.',
      );
      expect(mockUserRepository.findById).toHaveBeenCalledWith(999);
    });
  });

  // --- update Tests ---
  describe('update', () => {
    it('should update a user profile without changing password', async () => {
      const updateDto: UpdateUserDto = {
        firstName: 'Updated',
        lastName: 'User',
      };
      const updatedUser: User = { ...mockUser, ...updateDto };

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.update.mockResolvedValue(updatedUser);

      const result = await service.update(mockUser.id, updateDto);
      expect(result).toEqual(updatedUser);
      expect(mockUserRepository.findById).toHaveBeenCalledWith(mockUser.id);
      expect(mockUserRepository.update).toHaveBeenCalledWith(mockUser.id, {
        firstName: 'Updated',
        lastName: 'User',
      });
      expect(hashPassword).not.toHaveBeenCalled();
    });

    it('should update a user profile and hash new password', async () => {
      const updateDto: UpdateUserDto = { password: 'newpassword123' };
      const updatedUser: User = {
        ...mockUser,
        passwordHash: 'hashed_newpassword123',
      };

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.update.mockResolvedValue(updatedUser);

      const result = await service.update(mockUser.id, updateDto);
      expect(result).toEqual(updatedUser);
      expect(mockUserRepository.findById).toHaveBeenCalledWith(mockUser.id);
      expect(hashPassword).toHaveBeenCalledWith('newpassword123');
      expect(mockUserRepository.update).toHaveBeenCalledWith(mockUser.id, {
        passwordHash: 'hashed_newpassword123',
      });
    });

    it('should throw ResourceNotFoundException if user to update does not exist', async () => {
      const updateDto: UpdateUserDto = { firstName: 'Non Existent' };
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(service.update(999, updateDto)).rejects.toThrow(
        ResourceNotFoundException,
      );
      await expect(service.update(999, updateDto)).rejects.toThrow(
        'User with id 999 not found.',
      );
      expect(mockUserRepository.findById).toHaveBeenCalledWith(999);
      expect(mockUserRepository.update).not.toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException if update fails unexpectedly', async () => {
      const updateDto: UpdateUserDto = { firstName: 'Failed Update' };
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.update.mockResolvedValue(null);

      await expect(service.update(mockUser.id, updateDto)).rejects.toThrow(
        InternalServerErrorException,
      );
      await expect(service.update(mockUser.id, updateDto)).rejects.toThrow(
        `Failed to update user with ID ${mockUser.id} unexpectedly.`,
      );
      expect(mockUserRepository.findById).toHaveBeenCalledWith(mockUser.id);
      expect(mockUserRepository.update).toHaveBeenCalledWith(mockUser.id, {
        firstName: 'Failed Update',
      });
    });

    it('should handle empty update DTO gracefully', async () => {
      const updateDto: UpdateUserDto = {};
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.update.mockResolvedValue(mockUser);

      const result = await service.update(mockUser.id, updateDto);
      expect(result).toEqual(mockUser);
      expect(mockUserRepository.findById).toHaveBeenCalledWith(mockUser.id);
      expect(mockUserRepository.update).toHaveBeenCalledWith(mockUser.id, {});
      expect(hashPassword).not.toHaveBeenCalled();
    });
  });
});
