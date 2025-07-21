import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/role.guard';
import { Roles } from 'src/_decorator/roles.decorator';

@Controller('auth')
@UseGuards(RolesGuard)
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(JwtAuthGuard)
  @Roles('CUSTOMER')
  @Get()
  check() {
    return this.authService.check();
  }

  @Post('refresh')
  refresh(id: number) {
    return this.authService.refresh(id);
  }

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  // @Get('profile')
  // // @UseGuards(JwtAuthGuard)
  // // @ApiBearerAuth()
  // getProfile(@CurrentUser() user) {
  //   return user;
  // }
}
