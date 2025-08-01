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
import {
  AccountResponseDto,
  AccountWithOptionalFieldsDto,
} from './dto/res/account-response-body.dto';

@UseGuards(JwtAuthGuard, RolesGuard, ResourceOwnershipGuard)
@OwnershipService(AccountsService)
@AllowAdminBypassOwnership()
@ApiTags('Accounts')
@ApiBearerAuth('JWT-auth')
@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Roles('ADMIN')
  @Get('/all')
  @ApiOperation({
    summary: 'Get all accounts (Admin only)',
    description:
      'Retrieves all bank accounts in the system. This endpoint is restricted to ADMIN users only.',
  })
  @ApiOkResponse({
    description: 'A list of all accounts.',
    type: AccountResponseDto,
    isArray: true,
  })
  @ApiForbiddenResponse({ description: 'Forbidden. Requires ADMIN role.' })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized. Requires a valid JWT.',
  })
  async findAll(): Promise<Account[]> {
    return this.accountsService.findAll();
  }

  @Get()
  @ApiOperation({
    summary: 'Get accounts by current user',
    description:
      'Retrieves all accounts belonging to the currently authenticated user. Optionally, includes transactions with the `transaction=true` query parameter.',
  })
  @ApiQuery({
    name: 'transaction',
    required: false,
    type: Boolean,
    description:
      'Set to `true` to include transaction history for each account.',
  })
  @ApiOkResponse({
    description: 'A list of accounts for the current user.',
    type: AccountWithOptionalFieldsDto,
    isArray: true,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized. Requires a valid JWT.',
  })
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
  @ApiOperation({
    summary: 'Get account by ID',
    description:
      'Retrieves a specific account by its ID. The account must belong to the authenticated user.',
  })
  @ApiParam({
    name: 'id',
    required: true,
    type: 'string',
    description: 'The ID of the account to retrieve.',
  })
  @ApiOkResponse({
    description: 'The account details.',
    type: AccountResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Forbidden. The account does not belong to the user.',
  })
  async findById(@Param('id', ParseIntPipe) id: number): Promise<Account> {
    return this.accountsService.findById(id);
  }

  @Post()
  @ApiOperation({
    summary: 'Create account',
    description: 'Creates a new account for the authenticated user.',
  })
  @ApiBody({
    type: CreateAccountDto,
    examples: {
      createAccountExample: {
        summary: 'Example of a new account request body',
        value: {
          accountName: 'Test Account',
          currency: 'USD',
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'The newly created account.',
    type: AccountResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized. Requires a valid JWT.',
  })
  async create(
    @CurrentUser() user: User,
    @Body() createAccountDto: CreateAccountDto,
  ) {
    return this.accountsService.create(user.id, createAccountDto);
  }

  @OwnershipIdSource('param')
  @Patch(':id')
  @ApiOperation({
    summary: 'Update account by ID',
    description:
      'Updates a specific account by its ID. The account must belong to the authenticated user.',
  })
  @ApiParam({
    name: 'id',
    required: true,
    type: 'string',
    description: 'The ID of the account to update.',
  })
  @ApiBody({
    type: UpdateAccountDto,
    examples: {
      updateAccountExample: {
        summary: 'Example of an account update request body',
        value: {
          accountName: 'John-account-test',
          accountStatus: 'ACTIVE',
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'The updated account details.',
    type: AccountResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Forbidden. The account does not belong to the user.',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized. Requires a valid JWT.',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAccountDto: UpdateAccountDto,
  ) {
    return this.accountsService.update(id, updateAccountDto);
  }

  @Roles('ADMIN')
  @Patch('balance/:id')
  @ApiOperation({
    summary: 'Update account balance by ID (Admin only)',
    description:
      'Updates the balance of a specific account. This endpoint is restricted to ADMIN users only.',
  })
  @ApiParam({
    name: 'id',
    required: true,
    type: 'string',
    description: 'The ID of the account to update the balance for.',
  })
  @ApiBody({
    type: UpdateAccountBalanceDto,
    examples: {
      updateBalanceExample: {
        summary: 'Example of an update balance request body',
        value: {
          balance: 2000,
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'The account with the updated balance.',
    type: AccountResponseDto,
  })
  @ApiForbiddenResponse({ description: 'Forbidden. Requires ADMIN role.' })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized. Requires a valid JWT.',
  })
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
  @ApiOperation({
    summary: 'Delete account by ID',
    description:
      'Deletes a specific account by its ID. The account must belong to the authenticated user.',
  })
  @ApiParam({
    name: 'id',
    required: true,
    type: 'string',
    description: 'The ID of the account to delete.',
  })
  @ApiOkResponse({
    description: 'The deleted account.',
    type: AccountResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Forbidden. The account does not belong to the user.',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized. Requires a valid JWT.',
  })
  async delete(@Param('id', ParseIntPipe) id: number): Promise<Account> {
    return this.accountsService.delete(id);
  }
}
