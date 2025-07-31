import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { RolesGuard } from 'src/auth/guards/role.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { TransactionType, User } from '@prisma/client';
import { CurrentUser } from 'src/_common/decorators/current-user.decorator';
import { Roles } from 'src/_common/decorators/roles.decorator';
import { ResourceOwnershipGuard } from 'src/_common/guards/resource-owner.guard';
import { OwnershipIdSource } from 'src/_common/decorators/resource-owner/ownership-id-source.decorator';
import { OwnershipService } from 'src/_common/decorators/resource-owner/owner-service.decorator';
import { AccountsService } from 'src/accounts/accounts.service';
import { AllowAdminBypassOwnership } from 'src/_common/decorators/resource-owner/allow-admin-bypass-owner.decorator';
import { TransactionAccessGuard } from './guards/transaction-account-access.guard';

@Controller('transactions')
@UseGuards(JwtAuthGuard, RolesGuard, ResourceOwnershipGuard)
@OwnershipService(AccountsService)
@AllowAdminBypassOwnership()
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @OwnershipIdSource('body', 'accountId')
  @Post('deposit')
  createDeposit(@Body() createTransactionDto: CreateTransactionDto) {
    return this.transactionsService.create({
      ...createTransactionDto,
      type: TransactionType.DEPOSIT,
    });
  }

  @OwnershipIdSource('body', 'accountId')
  @Post('withdrawal')
  createWithdrawal(@Body() createTransactionDto: CreateTransactionDto) {
    return this.transactionsService.create({
      ...createTransactionDto,
      type: TransactionType.WITHDRAWAL,
    });
  }

  @OwnershipIdSource('body', 'accountId')
  @Post('transfer')
  createTransfer(@Body() createTransactionDto: CreateTransactionDto) {
    return this.transactionsService.create({
      ...createTransactionDto,
      type: TransactionType.TRANSFER,
    });
  }

  @Roles('ADMIN')
  @Get('all')
  findAll(
    @Query('accountId', new ParseIntPipe({ optional: true }))
    accountId?: number,
  ) {
    if (accountId) {
      return this.transactionsService.findAllByAccountId(accountId);
    } else {
      return this.transactionsService.findAll();
    }
  }

  @UseGuards(TransactionAccessGuard)
  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.transactionsService.findById(id);
  }

  @Get()
  findAllByCurrentUser(
    @CurrentUser() user: User,
    @Query('accountId', new ParseIntPipe({ optional: true }))
    accountId?: number,
  ) {
    if (accountId) {
      return this.transactionsService.findAllByUserId(user.id, accountId);
    } else {
      return this.transactionsService.findAllByUserId(user.id);
    }
  }
}
