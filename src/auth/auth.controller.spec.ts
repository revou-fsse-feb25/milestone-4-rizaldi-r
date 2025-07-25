import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/role.guard';
import { RegisterDto } from './dto/register.dto';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

describe('AuthController', () => {
  // let app: INestApplication;
  let authService: AuthService;
  let authController: AuthController;

  const mockAuthService = {
    check: jest.fn(),
    refresh: jest.fn(),
    register: jest.fn(),
    login: jest.fn(),
  };

  const mockJwtAuthGuard = {
    canActivate: jest.fn(() => true),
  };

  const mockRolesGuard = {
    canActivate: jest.fn(() => true),
  };

  // setup dependecy
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          // Mock AuthService
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    })
      // replace the real guard with mock
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .overrideGuard(RolesGuard)
      .useValue(mockRolesGuard)
      .compile();

    // boots up app without starting a server
    // app = module.createNestApplication();
    // await app.init();

    // make reference
    authController = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  // clear mock after each test
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
    expect(authController).toBeDefined();
  });

  describe('check', () => {
    it('should call authService.check and return its result', () => {
      const expectedResult = { message: 'Hello API' };
      mockAuthService.check.mockResolvedValue(expectedResult);

      const result = authController.check();

      expect(mockAuthService.check).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('refresh', () => {
    it('should call authService.refresh with the user ID from @CurrentUser', async () => {
      const testUserId: { id: number } = { id: 1 };
      const expectedResult = {
        accessToken: 'new_access_token',
        refreshToken: 'new_refresh_token',
      };
      mockAuthService.refresh.mockResolvedValue(expectedResult);

      const result = await authController.refresh(testUserId);

      expect(mockAuthService.refresh).toHaveBeenCalledTimes(1);
      expect(mockAuthService.refresh).toHaveBeenCalledWith(testUserId);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('register', () => {
    it('should call authService.register with the provided registerDto', async () => {
      const registerDto: RegisterDto = {
        username: 'scott4',
        email: 'scott4@example.com',
        password: 'pipipopo123',
        firstName: 'scott',
        lastName: 'nuclearblast',
      };
      const expectedResult = { message: 'User registered successfully' };
      mockAuthService.register.mockResolvedValue(expectedResult);

      const result = await authController.register(registerDto);

      expect(mockAuthService.register).toHaveBeenCalledTimes(1);
      expect(mockAuthService.register).toHaveBeenCalledWith(registerDto);
      expect(result).toEqual(expectedResult);
    });
  });
});
