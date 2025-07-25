import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { RolesGuard } from 'src/auth/guards/role.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { TransactionType, User } from '@prisma/client';
import { CurrentUser } from 'src/_common/decorators/current-user.decorator';
import { Roles } from 'src/_common/decorators/roles.decorator';

@Controller('transactions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post('deposit')
  createDeposit(
    @Body() createTransactionDto: CreateTransactionDto,
    // @CurrentUser() user: User,
  ) {
    return this.transactionsService.create({
      ...createTransactionDto,
      type: TransactionType.DEPOSIT,
    });
  }

  @Post('withdrawal')
  createWithdrawal(
    @Body() createTransactionDto: CreateTransactionDto,
    // @CurrentUser() user: User,
  ) {
    return this.transactionsService.create({
      ...createTransactionDto,
      type: TransactionType.WITHDRAWAL,
    });
  }

  @Post('transfer')
  createTransfer(
    @Body() createTransactionDto: CreateTransactionDto,
    // @CurrentUser() user: User,
  ) {
    return this.transactionsService.create({
      ...createTransactionDto,
      type: TransactionType.TRANSFER,
    });
  }

  @Roles('ADMIN')
  @Get('all')
  findAll() {
    return this.transactionsService.findAll();
  }

  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.transactionsService.findById(id);
  }

  @Get('/by-account/:accountId')
  findAllByAccountId(@Param('accountId', ParseIntPipe) accountId: number) {
    return this.transactionsService.findAllByAccountId(accountId);
  }

  @Get()
  findAllByUserId(@CurrentUser() user: User) {
    return this.transactionsService.findAllByUserId(user.id);
  }
}
