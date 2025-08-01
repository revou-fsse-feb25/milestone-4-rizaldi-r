import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RolesGuard } from './guards/role.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Roles } from '../_common/decorators/roles.decorator';
import { CurrentUser } from '../_common/decorators/current-user.decorator';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('check')
  @ApiOperation({
    summary: 'Check for admin access',
    description:
      'This endpoint checks if the authenticated user has ADMIN privileges.',
  })
  @ApiBearerAuth('JWT-auth') // Link to the JWT bearer auth scheme defined in main.ts
  @ApiOkResponse({
    description: 'The user has ADMIN access.',
    schema: {
      example: { message: 'Access granted' },
    },
  })
  @ApiForbiddenResponse({
    description:
      'The user is authenticated but lacks the required permissions.',
  })
  @ApiUnauthorizedResponse({
    description: 'No authentication token provided or token is invalid.',
  })
  check(): { message: string } {
    return this.authService.check();
  }

  @UseGuards(JwtAuthGuard)
  @Post('refresh')
  @ApiOperation({
    summary: 'Refresh JWT token',
    description:
      'Refreshes an expired JWT token using a valid, non-expired one.',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiOkResponse({
    description: 'A new JWT token has been generated and returned.',
    schema: {
      type: 'object',
      properties: {
        accessToken: { type: 'string' },
      },
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication token is missing, invalid, or expired.',
  })
  async refresh(@CurrentUser() { id }: { id: number }) {
    return this.authService.refresh(id);
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register a new user',
    description:
      'Registers a new user and returns a JWT token upon successful creation.',
  })
  @ApiCreatedResponse({
    description: 'User registered successfully and a token was generated.',
    schema: {
      type: 'object',
      properties: {
        accessToken: { type: 'string' },
      },
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
  @ApiBody({
    type: RegisterDto,
    description: 'User registration data.',
    examples: {
      a: {
        summary: 'Example of a valid registration body',
        value: {
          email: 'user@example.com',
          password: 'Password123!',
        },
      },
    },
  })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Log in a user',
    description:
      'Authenticates a user with email and password and returns a JWT token.',
  })
  @ApiOkResponse({
    description: 'User logged in successfully and a token was generated.',
    schema: {
      type: 'object',
      properties: {
        accessToken: { type: 'string' },
      },
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
  @ApiBody({
    type: LoginDto,
    description: 'User login credentials.',
    examples: {
      a: {
        summary: 'Example of a valid login body',
        value: {
          email: 'user@example.com',
          password: 'Password123!',
        },
      },
    },
  })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
}
