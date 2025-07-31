import { Test, TestingModule } from '@nestjs/testing';
import { UserRepository } from './user.repository';
import { PrismaService } from 'src/prisma/prisma.service';
import { User, UserRole } from '@prisma/client';

// Mock the PrismaService
const mockPrismaService = {
  user: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
};

// Define mock user data
const mockUser: User = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  passwordHash: 'hashedpassword123',
  firstName: 'Test',
  lastName: 'User',
  userRole: UserRole.CUSTOMER,
  refreshToken: null,
  lastLogin: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockUser2: User = {
  id: 2,
  username: 'anotheruser',
  email: 'another@example.com',
  passwordHash: 'hashedpassword456',
  firstName: 'Another',
  lastName: 'User',
  userRole: UserRole.CUSTOMER,
  refreshToken: null,
  lastLogin: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('UserRepository', () => {
  let repository: UserRepository;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<UserRepository>(UserRepository);
    prisma = module.get<PrismaService>(PrismaService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
    expect(prisma).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const expectedUsers = [mockUser, mockUser2];
      mockPrismaService.user.findMany.mockResolvedValue(expectedUsers);

      const result = await repository.findAll();
      expect(result).toEqual(expectedUsers);
      expect(mockPrismaService.user.findMany).toHaveBeenCalledTimes(1);
    });

    it('should return an empty array if no users are found', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([]);

      const result = await repository.findAll();
      expect(result).toEqual([]);
      expect(mockPrismaService.user.findMany).toHaveBeenCalledTimes(1);
    });
  });

  describe('findById', () => {
    it('should return a user if found by ID', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await repository.findById(mockUser.id);
      expect(result).toEqual(mockUser);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUser.id },
      });
    });

    it('should return null if user is not found by ID', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await repository.findById(999);
      expect(result).toBeNull();
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 999 },
      });
    });
  });

  describe('findByEmail', () => {
    it('should return a user if found by email', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await repository.findByEmail(mockUser.email);
      expect(result).toEqual(mockUser);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: mockUser.email },
      });
    });

    it('should return null if user is not found by email', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await repository.findByEmail('nonexistent@example.com');
      expect(result).toBeNull();
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'nonexistent@example.com' },
      });
    });
  });

  describe('create', () => {
    it('should create and return a new user', async () => {
      const createData = {
        username: 'newuser',
        email: 'new@example.com',
        passwordHash: 'newhashedpassword',
        firstName: 'New',
        lastName: 'User',
        userRole: UserRole.CUSTOMER,
      };
      const createdUser: User = {
        id: 3,
        ...createData,
        refreshToken: null,
        lastLogin: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrismaService.user.create.mockResolvedValue(createdUser);

      const result = await repository.create(createData);
      expect(result).toEqual(createdUser);
      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: createData,
      });
    });
  });

  describe('update', () => {
    it('should update a user and return the updated user', async () => {
      const updateData = { firstName: 'UpdatedFirstName' };
      const updatedUser: User = { ...mockUser, ...updateData };
      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      const result = await repository.update(mockUser.id, updateData);
      expect(result).toEqual(updatedUser);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: updateData,
      });
    });

    it('should return null if the user to update is not found', async () => {
      const updateData = { firstName: 'NonExistent' };
      mockPrismaService.user.update.mockResolvedValue(null);

      const result = await repository.update(999, updateData);
      expect(result).toBeNull();
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 999 },
        data: updateData,
      });
    });

    it('should update only specified fields', async () => {
      const updateData = { email: 'updated@example.com' };
      const updatedUser: User = { ...mockUser, ...updateData };
      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      const result = await repository.update(mockUser.id, updateData);
      expect(result).toEqual(updatedUser);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { email: 'updated@example.com' },
      });
    });
  });
});
