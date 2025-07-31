import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RequestItf } from 'src/_common/types/request.type';
import { PayloadDto } from '../../_common/res/payload.dto';

// interface JwtPayload {
//   userRole: string;
// }

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // get role from metadata
    const requiredRoles = this.reflector.get<string[]>(
      'roles',
      context.getHandler(),
    );
    if (!requiredRoles) return true;

    // get the user from request, which is populated by JwtAuthGuard
    const request = context.switchToHttp().getRequest<RequestItf>();
    const user = request.user as PayloadDto;

    // if no user or no user role, deny access
    if (!user || !user.userRole) return false;

    // check if the user role is included in the required roles
    return requiredRoles.includes(user.userRole);
  }
}
