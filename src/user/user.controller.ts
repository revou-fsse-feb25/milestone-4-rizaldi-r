import { Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('/profile/:id')
  findById(@Param('id') id: number) {
    return this.userService.findById(id);
  }

  @Patch('/profile')
  findByEmail(@Query('email') email: string) {
    return this.userService.findByEmail(email);
  }

  // @Patch('/profile')
  // update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
  //   return this.userService.update(+id, updateUserDto);
  // }
}
