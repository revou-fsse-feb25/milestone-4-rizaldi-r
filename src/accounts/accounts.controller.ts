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
  Query,
  ParseBoolPipe,
} from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/role.guard';
import { Account, User } from '@prisma/client';
import { CurrentUser } from 'src/_common/decorators/current-user.decorator';
import { CreateAccountDto } from './dto/req/create-account.dto';
import { Roles } from 'src/_common/decorators/roles.decorator';
import {
  UpdateAccountBalanceDto,
  UpdateAccountDto,
} from './dto/req/update-account.dto';
import { ResourceOwnershipGuard } from 'src/_common/guards/resource-owner.guard';
import { AllowAdminBypassOwnership } from 'src/_common/decorators/resource-owner/allow-admin-bypass-owner.decorator';
import { OwnershipService } from 'src/_common/decorators/resource-owner/owner-service.decorator';
import { OwnershipIdSource } from 'src/_common/decorators/resource-owner/ownership-id-source.decorator';

@UseGuards(JwtAuthGuard, RolesGuard, ResourceOwnershipGuard)
@OwnershipService(AccountsService)
@AllowAdminBypassOwnership()
@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  // admin only
  @Roles('ADMIN')
  @Get('/all')
  async findAll(): Promise<Account[]> {
    return this.accountsService.findAll();
  }

  @Get()
  async findAllByUserId(
    @CurrentUser() user: User,
    @Query('transaction', new ParseBoolPipe({ optional: true }))
    transaction?: boolean,
  ): Promise<Account | Account[]> {
    if (transaction) {
      return this.accountsService.findAllWithTransactionsByUserId(user.id);
    } else {
      return this.accountsService.findAllByUserId(user.id);
    }
  }

  @OwnershipIdSource('param')
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

  @OwnershipIdSource('param')
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAccountDto: UpdateAccountDto,
  ) {
    return this.accountsService.update(id, updateAccountDto);
  }

  @Roles('ADMIN')
  @Patch('balance/:id')
  async updateBalance(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAccountBalanceDto: UpdateAccountBalanceDto,
  ) {
    return this.accountsService.updateBalance(
      id,
      updateAccountBalanceDto.balance,
    );
  }

  @OwnershipIdSource('param')
  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number): Promise<Account> {
    return this.accountsService.delete(id);
  }
}
