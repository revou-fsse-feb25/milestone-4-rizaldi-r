import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from './roles.decorator';

// Mock SetMetadata to track its calls
jest.mock('@nestjs/common', () => ({
  ...jest.requireActual('@nestjs/common'),
  SetMetadata: jest.fn(() => () => {}),
}));

describe('Roles Decorator', () => {
  // Cast SetMetadata to a Jest mock function
  const mockSetMetadata = SetMetadata as jest.Mock;

  beforeEach(() => {
    // Clear mocks before each test
    jest.clearAllMocks();
  });

  it('should call SetMetadata with "roles" and the provided roles', () => {
    const testRoles: UserRole[] = ['ADMIN', 'CUSTOMER'];

    @Roles(...testRoles)
    class TestClass {}

    expect(mockSetMetadata).toHaveBeenCalledTimes(1);
    expect(mockSetMetadata).toHaveBeenCalledWith('roles', testRoles);
  });

  it('should call SetMetadata with "roles" and an empty array if no roles are provided', () => {
    @Roles()
    class TestClass {}

    expect(mockSetMetadata).toHaveBeenCalledTimes(1);
    expect(mockSetMetadata).toHaveBeenCalledWith('roles', []);
  });

  it('should handle a single role correctly', () => {
    const singleRole: UserRole = 'ADMIN';

    @Roles(singleRole)
    class TestClass {}

    expect(mockSetMetadata).toHaveBeenCalledTimes(1);
    expect(mockSetMetadata).toHaveBeenCalledWith('roles', [singleRole]);
  });
});
