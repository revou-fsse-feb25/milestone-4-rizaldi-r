import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // automatically look for and validate the JWT in the Authorization header
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }
}
