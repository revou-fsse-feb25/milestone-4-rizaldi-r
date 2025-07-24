import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/role.guard';
import { Account, User } from '@prisma/client';
import { CurrentUser } from 'src/_common/decorators/current-user.decorator';
import { CreateAccountDto } from './dto/req/create-account.dto';
import { Roles } from 'src/_common/decorators/roles.decorator';
import { UpdateAccountDto } from './dto/req/update-account.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
// TODO: edit the respond dto
// @UseInterceptors(BodyTransformerInterceptor)
@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  // admin only
  @Roles('ADMIN')
  @Get('/all')
  async findAll(): Promise<Account[]> {
    return this.accountsService.findAll();
  }

  // TODO: find by account name

  @Get()
  async findAllByUserId(@CurrentUser() user: User): Promise<Account[]> {
    return this.accountsService.findAllByUserId(user.id);
  }

  @Get('with-transactions')
  async findAllWithTransactionsByUserId(@CurrentUser() user: User) {
    return this.accountsService.findAllWithTransactionsByUserId(user.id);
  }

  // TODO: check user id
  @Get(':id')
  async findById(@Param('id', ParseIntPipe) id: number): Promise<Account> {
    return this.accountsService.findById(id);
  }

  @Post()
  async create(
    @CurrentUser() user: User,
    @Body() createAccountDto: CreateAccountDto,
  ) {
    return this.accountsService.create(user.id, createAccountDto);
  }

  // TODO: update some field

  // TODO: check user id, check is admin too
  @Patch(':id')
  async updateBalance(
    @Param('id', ParseIntPipe) id: number,
    @Body() newBalance: UpdateAccountDto,
  ) {
    return this.accountsService.updateBalance(id, newBalance.balance);
  }

  // TODO: check user id,
  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number): Promise<Account> {
    return this.accountsService.delete(id);
  }
}
