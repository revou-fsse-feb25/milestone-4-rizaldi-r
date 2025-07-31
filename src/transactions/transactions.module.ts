import { Module } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { AccountsModule } from 'src/accounts/accounts.module';
import { TransactionsRepository } from './transactions.repository';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [AccountsModule, UserModule],
  controllers: [TransactionsController],
  providers: [TransactionsService, TransactionsRepository],
})
export class TransactionsModule {}
