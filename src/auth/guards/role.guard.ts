import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

interface JwtPayload {
  userRole: string;
}

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
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: object }>();
    const user = request.user as JwtPayload;

    // if no user or no user role, deny access
    if (!user || !user.userRole) return false;

    // check if the user role is included in the required roles
    return requiredRoles.includes(user.userRole);
  }
}
