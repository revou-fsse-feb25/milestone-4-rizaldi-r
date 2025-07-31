import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { User, Transaction, UserRole } from '@prisma/client'; // Ensure UserRole is imported for checkResourceAccess
import { Request } from 'express';
import { TransactionsService } from '../transactions.service';
import { AccountsService } from 'src/accounts/accounts.service';

@Injectable()
export class TransactionAccessGuard implements CanActivate {
  constructor(
    private transactionsService: TransactionsService,
    private accountsService: AccountsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: User }>();
    if (!request.user || !request.user.id) {
      throw new UnauthorizedException(
        'User ID not found in request.user. Ensure JWT payload includes userId.',
      );
    }
    const user: User = request.user;
    const userId: number = user.id;

    if (user.userRole === UserRole.ADMIN) return true;

    // get all account id from user
    const accounts = await this.accountsService.findAllByUserId(userId);
    const accountIds = accounts.map((account) => account.id);

    // Retrieve the transaction data from the request.
    const transactionId: number = parseInt(request.params.id, 10);
    if (isNaN(transactionId)) {
      throw new BadRequestException(
        'Invalid resource ID format from URL parameter.',
      );
    }
    const transaction: Transaction =
      await this.transactionsService.findById(transactionId);
    const fromAccountId = transaction.fromAccountId;
    const toAccountId = transaction.toAccountId;

    // Check if user invloved in transactions
    const isUserInvolved =
      (fromAccountId && accountIds.includes(fromAccountId)) ||
      (toAccountId && accountIds.includes(toAccountId));
    if (!isUserInvolved) {
      throw new ForbiddenException(
        'User is forbidden to access this transaction.',
      );
    }

    return true;
  }
}
