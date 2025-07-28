import { ExecutionContext } from '@nestjs/common';
import { currentUserFactory } from './current-user.decorator';
import { PayloadDto } from '../res/payload.dto';
import { UserRole } from '@prisma/client';

interface MockHttpContext {
  getRequest: jest.Mock;
}

describe('CurrentUser Decorator', () => {
  let mockExecutionContext: ExecutionContext;
  let mockRequest: { user: PayloadDto | undefined };
  let mockSwitchToHttp: jest.Mock<MockHttpContext, []>;

  // Reset mocks before each test
  beforeEach(() => {
    mockRequest = {
      user: {
        id: 1,
        email: 'test@example.com',
        userRole: UserRole.CUSTOMER,
      },
    };

    // Define mockSwitchToHttp separately to avoid unbound method
    mockSwitchToHttp = jest.fn<MockHttpContext, []>().mockReturnValue({
      getRequest: jest.fn().mockReturnValue(mockRequest),
    });

    mockExecutionContext = {
      switchToHttp: mockSwitchToHttp,
      getClass: jest.fn(),
      getHandler: jest.fn(),
      getArgs: jest.fn(),
      getArgByIndex: jest.fn(),
      getType: jest.fn(),
    } as unknown as ExecutionContext;
  });

  it('should extract the user object from the request', () => {
    // Call the decorator's factory function directly
    const result = currentUserFactory(undefined, mockExecutionContext);

    expect(mockSwitchToHttp).toHaveBeenCalledTimes(1);
    expect(mockSwitchToHttp().getRequest).toHaveBeenCalledTimes(1);
    expect(result).toEqual(mockRequest.user);
  });

  it('should return undefined if user is not present on the request', () => {
    // Modify mockRequest to not have a user property
    mockRequest.user = undefined;

    const result = currentUserFactory(undefined, mockExecutionContext);

    expect(mockSwitchToHttp).toHaveBeenCalledTimes(1);
    expect(mockSwitchToHttp().getRequest).toHaveBeenCalledTimes(1);
    expect(result).toBeUndefined();
  });

  it('should pass the data argument to the decorator factory', () => {
    const testData = 'some_data';
    const result = currentUserFactory(testData, mockExecutionContext);

    expect(result).toEqual(mockRequest.user);
  });
});
