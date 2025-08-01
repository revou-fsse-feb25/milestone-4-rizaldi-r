import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';
import { User, UserRole } from '@prisma/client';
import { hashPassword } from '../_common/utils/password-hashing';
import { RegisterDto } from './dto/register.dto';

interface TokenItf {
  access_token: string;
  refresh_token: string;
}

interface RegisterResponseItf {
  message: string;
  code: number;
  data: {
    id: number;
    username: string;
    email: string;
    tokens: TokenItf;
  };
}

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let adminUser: User;
  let regularUser: User;
  let regularUserToken: string;
  let adminUserToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    prisma = app.get<PrismaService>(PrismaService);

    // Clean database before starting tests
    await prisma.user.deleteMany();

    // Create a user for a conflict test case
    adminUser = await prisma.user.create({
      data: {
        username: 'e2e_admin_user',
        email: 'e2e_admin_user@example.com',
        passwordHash: await hashPassword('AdminPass123!'),
        firstName: 'Admin',
        lastName: 'User',
        userRole: UserRole.ADMIN,
      },
    });

    regularUser = await prisma.user.create({
      data: {
        username: 'e2e_regular_user',
        email: 'e2e_regular_user@example.com',
        passwordHash: await hashPassword('RegularPass123!'),
        firstName: 'Regular',
        lastName: 'User',
        userRole: UserRole.CUSTOMER,
      },
    });

    const regularLoginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: regularUser.email, password: 'RegularPass123!' })
      .expect(HttpStatus.OK);
    const regularLoginResponseBody = regularLoginResponse.body as TokenItf;
    regularUserToken = regularLoginResponseBody.access_token;

    const adminLoginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: adminUser.email, password: 'AdminPass123!' })
      .expect(HttpStatus.OK);
    const adminLoginResponseBody = adminLoginResponse.body as TokenItf;
    adminUserToken = adminLoginResponseBody.access_token;
  });

  afterAll(async () => {
    // Clean up database after all tests
    await prisma.user.deleteMany();
    await app.close();
  });

  // --- POST /auth/register ---
  describe('POST /auth/register', () => {
    it('should successfully register a new user', async () => {
      const newUser: RegisterDto = {
        firstName: 'New',
        lastName: 'User',
        username: 'new_user',
        email: 'new_user@example.com',
        password: 'NewUserPass123!',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(newUser)
        .expect(HttpStatus.CREATED);
      const responseBody = response.body as RegisterResponseItf;

      expect(responseBody.message).toBe('User registered successfully');
      expect(responseBody.data.username).toBe(newUser.username);
      expect(responseBody.data.email).toBe(newUser.email);
      expect(responseBody.data.tokens).toHaveProperty('access_token');
      expect(responseBody.data.tokens).toHaveProperty('refresh_token');

      // Verify user exists in DB
      const userInDb = await prisma.user.findUnique({
        where: { email: newUser.email },
      });
      expect(userInDb).toBeDefined();
      expect(userInDb?.userRole).toBe(UserRole.CUSTOMER);
      expect(userInDb?.username).toBe(newUser.username);
    });

    it('should return 409 Conflict if email already registered', async () => {
      const newUserWithExistingEmail = {
        username: 'another_user',
        email: regularUser.email, // Use an existing email
        password: 'Password123!',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(newUserWithExistingEmail)
        .expect(HttpStatus.CONFLICT);
    });
  });

  // --- POST /auth/login ---
  describe('POST /auth/login', () => {
    it('should successfully log in an existing user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: regularUser.email, password: 'RegularPass123!' })
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('refresh_token');
    });

    it('should return 401 Unauthorized for invalid password', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: regularUser.email, password: 'WrongPassword' })
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return 401 Unauthorized for an unregistered email', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'nonexistent@example.com', password: 'Password123!' })
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  // --- POST /auth/refresh ---
  describe('POST /auth/refresh', () => {
    it('should successfully refresh a token for a logged-in user', async () => {
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: regularUser.email, password: 'RegularPass123!' })
        .expect(HttpStatus.OK);
      const responseBody = loginResponse.body as TokenItf;

      const refreshToken = responseBody.refresh_token;

      const refreshResponse = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Authorization', `Bearer ${refreshToken}`)
        .expect(HttpStatus.CREATED);

      expect(refreshResponse.body).toHaveProperty('access_token');
      expect(refreshResponse.body).toHaveProperty('refresh_token');
    });

    it('should return 401 Unauthorized for an invalid refresh token', async () => {
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Authorization', 'Bearer invalid.token')
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  // --- GET /auth/check (Admin only) ---
  describe('GET /auth/check', () => {
    it('should allow an admin user to access the check endpoint', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/check')
        .set('Authorization', `Bearer ${adminUserToken}`)
        .expect(HttpStatus.OK);
      const responseBody = response.body as { message: string };

      expect(responseBody.message).toBe('Access granted');
    });

    it('should return 403 Forbidden for a regular user', async () => {
      await request(app.getHttpServer())
        .get('/auth/check')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('should return 401 Unauthorized if no token is provided', async () => {
      await request(app.getHttpServer())
        .get('/auth/check')
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });
});
