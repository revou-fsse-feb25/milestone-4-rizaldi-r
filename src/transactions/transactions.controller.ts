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
import { CreateTransactionDto } from './dto/req/create-transaction.dto';
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
import {
  ApiBearerAuth,
  ApiBody,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { TransactionResponseDto } from './dto/res/transaction-response-body.dto';

@Controller('transactions')
@UseGuards(JwtAuthGuard, RolesGuard, ResourceOwnershipGuard)
@OwnershipService(AccountsService)
@AllowAdminBypassOwnership()
@ApiTags('Transactions')
@ApiBearerAuth('JWT-auth')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @OwnershipIdSource('body', 'accountId')
  @Post('deposit')
  @ApiOperation({
    summary: 'Deposit funds into an account',
    description:
      'Deposits funds into a specified account. The account must belong to the authenticated user.',
  })
  @ApiBody({
    type: CreateTransactionDto,
    examples: {
      depositExample: {
        summary: 'Example of a deposit request body',
        value: {
          accountId: 1,
          amount: 100,
          description: 'Initial deposit',
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'The transaction details for the successful deposit.',
    type: TransactionResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Forbidden. The account does not belong to the user.',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized. Requires a valid JWT.',
  })
  createDeposit(@Body() createTransactionDto: CreateTransactionDto) {
    return this.transactionsService.create({
      ...createTransactionDto,
      type: TransactionType.DEPOSIT,
    });
  }

  @OwnershipIdSource('body', 'accountId')
  @Post('withdrawal')
  @ApiOperation({
    summary: 'Withdraw funds from an account',
    description:
      'Withdraws funds from a specified account. The account must belong to the authenticated user.',
  })
  @ApiBody({
    type: CreateTransactionDto,
    examples: {
      withdrawalExample: {
        summary: 'Example of a withdrawal request body',
        value: {
          accountId: 1,
          amount: 50,
          description: 'Cash withdrawal',
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'The transaction details for the successful withdrawal.',
    type: TransactionResponseDto,
  })
  @ApiForbiddenResponse({
    description:
      'Forbidden. The account does not belong to the user or insufficient funds.',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized. Requires a valid JWT.',
  })
  createWithdrawal(@Body() createTransactionDto: CreateTransactionDto) {
    return this.transactionsService.create({
      ...createTransactionDto,
      type: TransactionType.WITHDRAWAL,
    });
  }

  @OwnershipIdSource('body', 'accountId')
  @Post('transfer')
  @ApiOperation({
    summary: 'Transfer funds between accounts',
    description:
      "Transfers funds from the authenticated user's account to another account. Both accounts must belong to the authenticated user.",
  })
  @ApiBody({
    type: CreateTransactionDto,
    examples: {
      transferExample: {
        summary: 'Example of a transfer request body',
        value: {
          accountId: 1,
          amount: 25,
          toAccountId: 2,
          description: 'Funds transfer',
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'The transaction details for the successful transfer.',
    type: TransactionResponseDto,
  })
  @ApiForbiddenResponse({
    description:
      'Forbidden. One or more accounts do not belong to the user or insufficient funds.',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized. Requires a valid JWT.',
  })
  createTransfer(@Body() createTransactionDto: CreateTransactionDto) {
    return this.transactionsService.create({
      ...createTransactionDto,
      type: TransactionType.TRANSFER,
    });
  }

  @Roles('ADMIN')
  @Get('all')
  @ApiOperation({
    summary: 'Get all transactions (Admin only)',
    description:
      'Retrieves all transactions in the system, with an optional filter for a specific account. Restricted to ADMIN users.',
  })
  @ApiQuery({
    name: 'accountId',
    required: false,
    type: 'string',
    description: 'Optional. Filter transactions by account ID.',
  })
  @ApiOkResponse({
    description: 'A list of all transactions.',
    type: TransactionResponseDto,
    isArray: true,
  })
  @ApiForbiddenResponse({ description: 'Forbidden. Requires ADMIN role.' })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized. Requires a valid JWT.',
  })
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
  @ApiOperation({
    summary: 'Get transaction by ID',
    description:
      'Retrieves a specific transaction by its ID. The transaction must belong to the authenticated user.',
  })
  @ApiParam({
    name: 'id',
    required: true,
    type: 'string',
    description: 'The ID of the transaction to retrieve.',
  })
  @ApiOkResponse({
    description: 'The transaction details.',
    type: TransactionResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Forbidden. The transaction does not belong to the user.',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized. Requires a valid JWT.',
  })
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.transactionsService.findById(id);
  }

  @Get()
  @ApiOperation({
    summary: 'Get transactions by current user',
    description:
      'Retrieves all transactions for the authenticated user, with an optional filter for a specific account.',
  })
  @ApiQuery({
    name: 'accountId',
    required: false,
    type: 'string',
    description: 'Optional. Filter transactions by account ID.',
  })
  @ApiOkResponse({
    description: 'A list of transactions for the current user.',
    type: TransactionResponseDto,
    isArray: true,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized. Requires a valid JWT.',
  })
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
