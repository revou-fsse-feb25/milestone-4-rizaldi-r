import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { JwtStrategy } from 'src/auth/strategies/jwt.strategy';

@Global()
@Module({
  providers: [PrismaService, JwtStrategy],
  exports: [PrismaService, JwtStrategy],
})
export class PrismaModule {}
