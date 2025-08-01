import {
  Body,
  Controller,
  Get,
  Patch,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UserService } from './user.service';
import { User } from '@prisma/client';
import { UpdateUserDto } from './dto/req/update-user.dto';
import { CurrentUser } from '../_common/decorators/current-user.decorator';
import { RolesGuard } from '../auth/guards/role.guard';
import { BodyTransformerInterceptor } from '../_common/interceptors/body-transformer.interceptor';
import { Roles } from '../_common/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ApiBearerAuth,
  ApiBody,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UserResponseBodyDto } from './dto/res/user-response-body.dto';

@ApiTags('User')
@ApiBearerAuth('JWT-auth')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(BodyTransformerInterceptor)
export class UserController {
  constructor(private readonly userService: UserService) {}

  // Admin only
  @Roles('ADMIN')
  @Get()
  @ApiOperation({
    summary: 'Get all user profiles',
    description:
      'Retrieves a list of all user profiles in the system. This endpoint is restricted to ADMIN users only.',
  })
  @ApiOkResponse({
    description: 'A list of user profiles.',
    type: UserResponseBodyDto,
    isArray: true,
  })
  @ApiForbiddenResponse({ description: 'Forbidden. Requires ADMIN role.' })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized. Requires a valid JWT.',
  })
  async findAll() {
    return this.userService.findAll();
  }

  @Get('/profile')
  @ApiOperation({
    summary: 'Get current user profile',
    description: 'Retrieves the profile of the currently authenticated user.',
  })
  @ApiOkResponse({
    description: 'The profile of the authenticated user.',
    type: UserResponseBodyDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized. Requires a valid JWT.',
  })
  async getProfile(@CurrentUser() user: User) {
    return this.userService.findById(user.id);
  }

  @Patch('/profile')
  @ApiOperation({
    summary: 'Update current user profile',
    description:
      'Updates the profile of the currently authenticated user. The request body should contain the fields to be updated.',
  })
  @ApiBody({
    type: UpdateUserDto,
    examples: {
      updateUserExample: {
        summary: 'Example of an update user request body',
        value: {
          firstName: 'Jane',
          email: 'jane.doe@example.com',
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'The updated user profile.',
    type: UserResponseBodyDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized. Requires a valid JWT.',
  })
  async update(
    @CurrentUser() user: User,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userService.update(user.id, updateUserDto);
  }
}
