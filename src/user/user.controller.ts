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

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(BodyTransformerInterceptor)
export class UserController {
  constructor(private readonly userService: UserService) {}

  // Admin only
  @Roles('ADMIN')
  @Get()
  async findAll() {
    return this.userService.findAll();
  }

  @Get('/profile')
  async getProfile(@CurrentUser() user: User) {
    return this.userService.findById(user.id);
  }

  @Patch('/profile')
  async update(
    @CurrentUser() user: User,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userService.update(user.id, updateUserDto);
  }
}
