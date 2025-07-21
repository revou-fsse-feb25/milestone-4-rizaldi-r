import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  UseInterceptors,
} from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { Account } from './entities/account.entity';
import { CreateAccountDto } from './dto/req/create-account.dto';
import { PatchAccountDto } from './dto/req/update-account.dto';
import { BodyTransformerInterceptor } from 'src/_common/interceptors/body-transformer.interceptor';

@UseInterceptors(BodyTransformerInterceptor)
@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get()
  findAll(): Account[] {
    const accs = this.accountsService.findAll();
    return accs;
  }

  @Get(':id')
  findOne(@Param('id') id: string): Account {
    const account = this.accountsService.findOne({ userId: id });
    return account;
  }

  @Post()
  createAccount(@Body() body: CreateAccountDto) {
    const account = this.accountsService.createAccount({
      accountName: body.accountName,
      accountType: body.accountType,
    });
    return account;
  }

  @Patch('/:id')
  update(@Param('id') id: string, @Body() body: PatchAccountDto) {
    const acc = this.accountsService.patchAccount({
      userId: id,
      accountName: body.accountName,
      balance: body.balance,
    });
    return acc;
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    const acc = this.accountsService.deleteAccount({ userId: id });
    return acc;
  }
}
