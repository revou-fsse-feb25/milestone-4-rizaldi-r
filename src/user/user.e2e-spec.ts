import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { User, UserRole } from '@prisma/client';
import { hashPassword } from '../_common/utils/password-hashing';

describe('UserController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;

  // Test users
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
    jwtService = app.get<JwtService>(JwtService);

    // Clean database before starting tests
    await prisma.user.deleteMany();

    // Create test users
    adminUser = await prisma.user.create({
      data: {
        username: 'admin_e2e_user',
        email: 'admin_e2e_user@example.com',
        passwordHash: await hashPassword('AdminPass123!'),
        firstName: 'Admin',
        lastName: 'User',
        userRole: UserRole.ADMIN,
      },
    });

    regularUser = await prisma.user.create({
      data: {
        username: 'regular_e2e_user',
        email: 'regular_e2e_user@example.com',
        passwordHash: await hashPassword('RegularPass123!'),
        firstName: 'Regular',
        lastName: 'User',
        userRole: UserRole.CUSTOMER,
      },
    });

    // Generate JWT tokens for test users
    adminUserToken = jwtService.sign({
      id: adminUser.id,
      userRole: adminUser.userRole,
    });
    regularUserToken = jwtService.sign({
      id: regularUser.id,
      userRole: regularUser.userRole,
    });
  });

  afterAll(async () => {
    // Clean up database after all tests
    await prisma.user.deleteMany();
    await app.close();
  });

  // --- GET /users (Admin only) ---
  describe('GET /users', () => {
    it('should allow an admin user to get all users', async () => {
      const response = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${adminUserToken}`)
        .expect(HttpStatus.OK);

      const users = response.body as User[];
      expect(users).toBeInstanceOf(Array);
      expect(users.length).toBeGreaterThanOrEqual(2); // At least the two created users
      // Check for the presence of our test users (just by username for simplicity)
      const usernames = users.map((user) => user.username);
      expect(usernames).toContain(adminUser.username);
      expect(usernames).toContain(regularUser.username);
    });

    it('should return 403 Forbidden for a regular user trying to get all users', async () => {
      await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('should return 401 Unauthorized if no token is provided', async () => {
      await request(app.getHttpServer())
        .get('/users')
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  // --- GET /users/profile ---
  describe('GET /users/profile', () => {
    it('should allow a regular user to get their own profile', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/profile')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(HttpStatus.OK);

      const profile = response.body as User;
      expect(profile.id).toBe(regularUser.id);
      expect(profile.email).toBe(regularUser.email);
      expect(profile.username).toBe(regularUser.username);
      // The password hash should never be returned
      expect(profile.passwordHash).toBeUndefined();
    });

    it('should allow an admin user to get their own profile', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/profile')
        .set('Authorization', `Bearer ${adminUserToken}`)
        .expect(HttpStatus.OK);

      const profile = response.body as User;
      expect(profile.id).toBe(adminUser.id);
      expect(profile.email).toBe(adminUser.email);
      expect(profile.username).toBe(adminUser.username);
      expect(profile.passwordHash).toBeUndefined();
    });

    it('should return 401 Unauthorized if no token is provided', async () => {
      await request(app.getHttpServer())
        .get('/users/profile')
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  // --- PATCH /users/profile ---
  describe('PATCH /users/profile', () => {
    it('should allow a regular user to update their first and last name', async () => {
      const newFirstName = 'UpdatedRegular';
      const newLastName = 'UpdatedUser';

      const response = await request(app.getHttpServer())
        .patch('/users/profile')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send({ firstName: newFirstName, lastName: newLastName })
        .expect(HttpStatus.OK);

      const updatedProfile = response.body as User;
      expect(updatedProfile.firstName).toBe(newFirstName);
      expect(updatedProfile.lastName).toBe(newLastName);

      // Verify the change in the database
      const dbUser = await prisma.user.findUnique({
        where: { id: regularUser.id },
      });
      expect(dbUser?.firstName).toBe(newFirstName);
      expect(dbUser?.lastName).toBe(newLastName);
      // Revert the user back to the original for other tests
      await prisma.user.update({
        where: { id: regularUser.id },
        data: { firstName: 'Regular', lastName: 'User' },
      });
    });

    it('should prevent a user from updating userRole', async () => {
      const originalRole = regularUser.userRole;

      await request(app.getHttpServer())
        .patch('/users/profile')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send({
          firstName: 'StillRegular',
          userRole: UserRole.ADMIN,
        })
        .expect(HttpStatus.OK); // The update will succeed for valid fields

      // Verify that the sensitive fields were NOT changed in the database
      const dbUser = await prisma.user.findUnique({
        where: { id: regularUser.id },
      });
      expect(dbUser?.userRole).toBe(originalRole);
    });

    it('should return 409 Conflict if a user tries to update their email to an existing one', async () => {
      await request(app.getHttpServer())
        .patch('/users/profile')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send({
          email: adminUser.email,
        })
        .expect(HttpStatus.CONFLICT);
    });

    it('should return 409 Conflict if a user tries to update their username to an existing one', async () => {
      await request(app.getHttpServer())
        .patch('/users/profile')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send({
          username: adminUser.username,
        })
        .expect(HttpStatus.CONFLICT);
    });

    it('should return 401 Unauthorized if no token is provided', async () => {
      await request(app.getHttpServer())
        .patch('/users/profile')
        .send({ firstName: 'Anonymous' })
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });
});
